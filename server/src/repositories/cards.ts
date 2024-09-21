import { Instant } from "@js-joda/core";
import { Card, CardAddMutation, CardEditMutation } from "hornbeam-common/lib/app/cards";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";
import { CardStatus } from "hornbeam-common/lib/app/cardStatuses";
import { SerializedCardStatus } from "hornbeam-common/lib/serialization/cardStatuses";
import { deserialize } from "hornbeam-common/lib/serialization/deserialize";
import { DB } from "../database/types";
import { SelectQueryBuilder } from "kysely";
import { BoardId, cardSubboardId, rootBoardId } from "hornbeam-common/lib/app/boards";
import { queryAppSnapshot } from "hornbeam-common/lib/appStateToQueryFunction";
import { parentBoardQuery } from "hornbeam-common/lib/queries";

export interface CardRepository {
  add: (mutation: CardAddMutation) => Promise<void>;
  update: (mutation: CardEditMutation) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Card>>;
  fetchById: (id: string) => Promise<Card | null>;
  fetchParentByChildId: (childId: string) => Promise<Card | null>;
  fetchChildCountByParentId: (parentId: string) => Promise<number>;
  search: (searchTerm: string) => Promise<ReadonlyArray<Card>>;
  fetchParentBoard: (boardId: BoardId) => Promise<BoardId>;
}

export class CardRepositoryInMemory implements CardRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(mutation: CardAddMutation): Promise<void> {
    return this.snapshot.update(snapshot => snapshot.cardAdd(mutation));
  }

  async update(mutation: CardEditMutation): Promise<void> {
    return this.snapshot.update(snapshot => snapshot.cardEdit(mutation));
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

  async fetchParentBoard(boardId: BoardId): Promise<BoardId> {
    return queryAppSnapshot(this.snapshot.value, parentBoardQuery(boardId));
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
            .select(
              eb.fn.coalesce(
                eb(eb.fn.max("cards.index"), "+", 1),
                eb.lit(0),
              ).as("index")
            ),
          isSubboardRoot: false,
          number: eb.selectFrom("cards")
            .select(
              eb.fn.coalesce(
                eb(eb.fn.max("cards.number"), "+", 1),
                eb.lit(1),
              ).as("number")),
          parentCardId: mutation.parentCardId,
          status: SerializedCardStatus.encode(CardStatus.None),
          text: mutation.text,
        }))
        .execute();
    });
  }

  async update(mutation: CardEditMutation): Promise<void> {
    await this.database.transaction().execute(async transaction => {
      let query = transaction.updateTable("cards")
        .where("id", "=", mutation.id);
      let queryRequired = false;

      if (mutation.categoryId !== undefined) {
        query = query.set({categoryId: mutation.categoryId});
        queryRequired = true;
      }

      if (mutation.isSubboardRoot !== undefined) {
        query = query.set({isSubboardRoot: mutation.isSubboardRoot});
        queryRequired = true;
      }

      if (mutation.parentCardId !== undefined) {
        query = query.set({parentCardId: mutation.parentCardId});
        queryRequired = true;
      }

      if (mutation.status !== undefined) {
        query = query.set({status: SerializedCardStatus.encode(mutation.status)});
        queryRequired = true;
      }

      if (mutation.text !== undefined) {
        query = query.set({text: mutation.text});
        queryRequired = true;
      }

      if (queryRequired) {
        await query.execute();
      }
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

  async fetchParentBoard(boardId: BoardId): Promise<BoardId> {
    if (boardId.boardRootId === null) {
      return rootBoardId;
    }

    return await this.database.transaction().execute(async transaction => {
      const row = await transaction
        .withRecursive(
          "ancestors(id, parentId, isParentBoard)",
          db =>
            db.selectFrom("cards")
              .select(eb => ["id as id", "parentCardId as parentId", eb.lit<boolean>(false).as("isParentBoard")])
              .where("id", "=", boardId.boardRootId)
              .union(
                db.selectFrom("cards")
                  .select(["cards.id as id", "cards.parentCardId as parentId", "cards.isSubboardRoot as isParentBoard"])
                  .innerJoin("ancestors", "ancestors.parentId", "cards.id")
                  .where("ancestors.isParentBoard", "=", false)
              )
        )
        .selectFrom("ancestors")
        .select(["id"])
        .where("isParentBoard", "=", true)
        .executeTakeFirst();

      if (row === undefined) {
        return rootBoardId;
      } else {
        return cardSubboardId(row.id);
      }
    });
  }

  selectColumns(query: SelectQueryBuilder<DB, "cards", unknown>) {
    return query.select([
      "cards.categoryId",
      "cards.createdAt",
      "cards.id",
      "cards.isSubboardRoot",
      "cards.number",
      "cards.parentCardId",
      "cards.status",
      "cards.text",
    ]);
  }

  rowToCard(cardRow: QueryOutput<ReturnType<typeof this.selectColumns>>): Card {
    return {
      categoryId: cardRow.categoryId,
      createdAt: Instant.ofEpochMilli(cardRow.createdAt.getTime()),
      id: cardRow.id,
      isSubboardRoot: cardRow.isSubboardRoot,
      number: cardRow.number,
      parentCardId: cardRow.parentCardId,
      status: deserialize(SerializedCardStatus, cardRow.status),
      text: cardRow.text,
    };
  }
}

type QueryOutput<TQuery> = TQuery extends SelectQueryBuilder<DB, infer _T, infer O> ? O : never;
