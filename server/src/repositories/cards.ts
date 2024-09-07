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
}

export class CardRepositoryDatabase implements CardRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(mutation: CardAddMutation): Promise<void> {
    await this.database.transaction().execute(async transaction => {
      await transaction.insertInto("cards")
        .values(({fn, selectFrom, lit}) => ({
          categoryId: mutation.categoryId,
          createdAt: new Date(mutation.createdAt.toEpochMilli()),
          id: mutation.id,
          index: selectFrom("cards")
            .select(fn.coalesce(fn.max("cards.index"), lit(0)).as("index")),
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

  selectColumns(query: SelectQueryBuilder<DB, "cards", unknown>) {
    return query.select(["categoryId", "createdAt", "id", "text"]);
  }

  rowToCard(cardRow: QueryOutput<ReturnType<typeof this.selectColumns>>): Card {
    return {
      categoryId: cardRow.categoryId,
      createdAt: Instant.ofEpochMilli(cardRow.createdAt.getTime()),
      id: cardRow.id,
      isSubboardRoot: false,
      number: 0,
      parentCardId: null,
      status: CardStatus.None,
      text: cardRow.text,
    };
  }
}

type QueryOutput<TQuery> = TQuery extends SelectQueryBuilder<DB, infer _T, infer O> ? O : never;
