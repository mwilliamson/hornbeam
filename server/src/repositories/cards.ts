import { Instant } from "@js-joda/core";
import { Card, CardAddMutation } from "hornbeam-common/lib/app/cards";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";
import { CardStatus } from "hornbeam-common/lib/app/cardStatuses";
import { DB } from "../database/types";
import { SelectQueryBuilder } from "kysely";

export interface CardRepository {
  add: (mutation: CardAddMutation) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Card>>;
  fetchById: (id: string) => Promise<Card | null>;
  fetchParentByChildId: (childId: string) => Promise<Card | null>;
  fetchChildCountByParentId: (parentId: string) => Promise<number>;
  search: (searchTerm: string) => Promise<ReadonlyArray<Card>>;
}

export class CardRepositoryInMemory implements CardRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(mutation: CardAddMutation): Promise<void> {
    return this.snapshot.update(snapshot => snapshot.cardAdd(mutation));
  }

  async fetchAll(): Promise<ReadonlyArray<Card>> {
    return this.snapshot.value.allCards();
  }

  async fetchById(id: string): Promise<Card | null> {
    return this.snapshot.value.findCardById(id);
  }

  async fetchParentByChildId(childId: string): Promise<Card | null> {
    const childCard = this.snapshot.value.findCardById(childId);
    if (childCard === null || childCard.parentCardId === null) {
      return null;
    }
    return this.snapshot.value.findCardById(childCard.parentCardId);
  }

  async fetchChildCountByParentId(parentId: string): Promise<number> {
    return this.snapshot.value.countCardChildren(parentId);
  }

  async search(searchTerm: string): Promise<ReadonlyArray<Card>> {
    return this.snapshot.value.searchCards(searchTerm).slice(0, MAX_SEARCH_RESULTS);
  }
}

const MAX_SEARCH_RESULTS = 20;

export class CardRepositoryDatabase implements CardRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(mutation: CardAddMutation): Promise<void> {
    await this.database.transaction().execute(async transaction => {
      await transaction.insertInto("cards")
        .values((eb) => ({
          categoryId: mutation.categoryId,
          createdAt: new Date(mutation.createdAt.toEpochMilli()),
          id: mutation.id,
          index: eb.selectFrom("cards")
            .select(eb.fn.coalesce(eb.fn.max("cards.index"), eb.lit(0)).as("index")),
          number: eb.selectFrom("cards")
            .select(
              eb.fn.coalesce(
                eb(eb.fn.max("cards.number"), "+", 1),
                eb.lit(1),
              ).as("number")),
          parentCardId: mutation.parentCardId,
          text: mutation.text,
        }))
        .execute();
    });
  }

  async fetchAll(): Promise<ReadonlyArray<Card>> {
    const cardsQuery = this.selectColumns(this.database.selectFrom("cards"));

    const cardRows = await cardsQuery.execute();

    return cardRows.map(cardRow => this.rowToCard(cardRow));
  }

  async fetchById(id: string): Promise<Card | null> {
    const cardQuery = this.selectColumns(
      this.database.selectFrom("cards")
        .where("id", "=", id)
    );

    const cardRow = await cardQuery.executeTakeFirst();

    if (cardRow === undefined) {
      return null;
    } else {
      return this.rowToCard(cardRow);
    }
  }

  async fetchParentByChildId(childId: string): Promise<Card | null> {
    const cardQuery = this.selectColumns(
      this.database.selectFrom("cards")
        .innerJoin("cards as child_cards", "cards.id", "child_cards.parentCardId")
        .where("child_cards.id", "=", childId)
    );

    const cardRow = await cardQuery.executeTakeFirst();

    if (cardRow === undefined) {
      return null;
    } else {
      return this.rowToCard(cardRow);
    }
  }

  async fetchChildCountByParentId(parentId: string): Promise<number> {
    return await this.database.transaction().execute(async transaction => {
      const row = await transaction.selectFrom("cards")
        .select(({fn, lit}) => [fn.count<string>(lit(0)).as("count")])
        .where("cards.parentCardId", "=", parentId)
        .executeTakeFirst();

      return row === undefined ? 0 : parseInt(row.count, 10);
    });
  }

  async search(searchTerm: string): Promise<ReadonlyArray<Card>> {
    return await this.database.transaction().execute(async transaction => {
      const cardsQuery = this.selectColumns(
        transaction.selectFrom("cards")
          .where(({fn, val}) => fn("strpos", ["cards.text", val(searchTerm)]), ">", 0)
          .orderBy("cards.index")
          .limit(20)
      );

      const cardRows = await cardsQuery.execute();

      return cardRows.map(cardRow => this.rowToCard(cardRow));
    });
  }

  selectColumns(query: SelectQueryBuilder<DB, "cards", unknown>) {
    return query.select([
      "cards.categoryId",
      "cards.createdAt",
      "cards.id",
      "cards.number",
      "cards.parentCardId",
      "cards.text",
    ]);
  }

  rowToCard(cardRow: QueryOutput<ReturnType<typeof this.selectColumns>>): Card {
    return {
      categoryId: cardRow.categoryId,
      createdAt: Instant.ofEpochMilli(cardRow.createdAt.getTime()),
      id: cardRow.id,
      isSubboardRoot: false,
      number: cardRow.number,
      parentCardId: cardRow.parentCardId,
      status: CardStatus.None,
      text: cardRow.text,
    };
  }
}

type QueryOutput<TQuery> = TQuery extends SelectQueryBuilder<DB, infer _T, infer O> ? O : never;
