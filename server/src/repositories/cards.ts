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
import { boardCardTreesQuery, CardQuery, parentBoardQuery } from "hornbeam-common/lib/queries";
import { cardsToTrees, CardTree } from "hornbeam-common/lib/app/cardTrees";

export interface CardRepository {
  add: (mutation: CardAddMutation) => Promise<void>;
  update: (mutation: CardEditMutation) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Card>>;
  fetchById: (query: CardQuery) => Promise<Card | null>;
  fetchParentByChildId: (childId: string) => Promise<Card | null>;
  fetchChildCountByParentId: (parentId: string) => Promise<number>;
  search: (searchTerm: string) => Promise<ReadonlyArray<Card>>;
  fetchBoardCardTrees: (
    boardId: BoardId,
    cardStatuses: ReadonlySet<CardStatus>,
  ) => Promise<ReadonlyArray<CardTree>>;
  fetchParentBoard: (boardId: BoardId) => Promise<BoardId>;
}

export class CardRepositoryInMemory implements CardRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(mutation: CardAddMutation): Promise<void> {
    this.snapshot.mutate({
      type: "cardAdd",
      cardAdd: mutation
    });
  }

  async update(mutation: CardEditMutation): Promise<void> {
    this.snapshot.mutate({
      type: "cardEdit",
      cardEdit: mutation,
    });
  }

  async fetchAll(): Promise<ReadonlyArray<Card>> {
    // TODO: use proper project ID
    const projectId = this.snapshot.value.allProjects()[0].id;
    return this.snapshot.value.fetchProjectContents(projectId).allCards();
  }

  async fetchById(query: CardQuery): Promise<Card | null> {
    return this.snapshot.value
      .fetchProjectContents(query.projectId)
      .findCardById(query.cardId);
  }

  async fetchParentByChildId(childId: string): Promise<Card | null> {
    // TODO: use proper project ID
    const projectId = this.snapshot.value.allProjects()[0].id;
    const childCard = this.snapshot.value.fetchProjectContents(projectId).findCardById(childId);
    if (childCard === null || childCard.parentCardId === null) {
      return null;
    }
    return this.snapshot.value.fetchProjectContents(projectId).findCardById(childCard.parentCardId);
  }

  async fetchChildCountByParentId(parentId: string): Promise<number> {
    // TODO: use proper project ID
    const projectId = this.snapshot.value.allProjects()[0].id;
    return this.snapshot.value.fetchProjectContents(projectId).countCardChildren(parentId);
  }

  async search(searchTerm: string): Promise<ReadonlyArray<Card>> {
    // TODO: use proper project ID
    const projectId = this.snapshot.value.allProjects()[0].id;
    return this.snapshot.value.fetchProjectContents(projectId).searchCards(searchTerm).slice(0, MAX_SEARCH_RESULTS);
  }

  async fetchBoardCardTrees(
    boardId: BoardId,
    cardStatuses: ReadonlySet<CardStatus>,
  ): Promise<ReadonlyArray<CardTree>> {
    // TODO: use proper project ID
    const projectId = this.snapshot.value.allProjects()[0].id;
    return queryAppSnapshot(this.snapshot.value, boardCardTreesQuery({boardId, cardStatuses, projectId}));
  }

  async fetchParentBoard(boardId: BoardId): Promise<BoardId> {
    // TODO: use proper project ID
    const projectId = this.snapshot.value.allProjects()[0].id;
    return queryAppSnapshot(this.snapshot.value, parentBoardQuery({boardId, projectId}));
  }
}

const MAX_SEARCH_RESULTS = 20;

export class CardRepositoryDatabase implements CardRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(mutation: CardAddMutation): Promise<void> {
    await this.database.insertInto("cards")
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
          )
          .where("projectId", "=", mutation.projectId),
        isSubboardRoot: false,
        number: eb.selectFrom("cards")
          .select(
            eb.fn.coalesce(
              eb(eb.fn.max("cards.number"), "+", 1),
              eb.lit(1),
            ).as("number")
          )
          .where("projectId", "=", mutation.projectId),
        parentCardId: mutation.parentCardId,
        projectId: mutation.projectId,
        status: SerializedCardStatus.encode(CardStatus.None),
        text: mutation.text,
      }))
      .execute();
  }

  async update(mutation: CardEditMutation): Promise<void> {
    let query = this.database.updateTable("cards")
      .where("id", "=", mutation.id);
    let queryRequired = false;

    if (mutation.categoryId !== undefined) {
      // TODO: check category is valid
      query = query.set({categoryId: mutation.categoryId});
      queryRequired = true;
    }

    if (mutation.isSubboardRoot !== undefined) {
      query = query.set({isSubboardRoot: mutation.isSubboardRoot});
      queryRequired = true;
    }

    if (mutation.parentCardId !== undefined) {
      // TODO: check parent is valid
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
  }

  async fetchAll(): Promise<ReadonlyArray<Card>> {
    const cardsQuery = this.selectColumns(this.database.selectFrom("cards"));

    const cardRows = await cardsQuery.execute();

    return cardRows.map(cardRow => this.rowToCard(cardRow));
  }

  async fetchById(query: CardQuery): Promise<Card | null> {
    const cardQuery = this.selectColumns(
      this.database.selectFrom("cards")
        .where("id", "=", query.cardId)
        .where("projectId", "=", query.projectId)
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
    const row = await this.database.selectFrom("cards")
      .select(({fn, lit}) => [fn.count<string>(lit(0)).as("count")])
      .where("cards.parentCardId", "=", parentId)
      .executeTakeFirst();

    return row === undefined ? 0 : parseInt(row.count, 10);
  }

  async search(searchTerm: string): Promise<ReadonlyArray<Card>> {
    const cardsQuery = this.selectColumns(
      this.database.selectFrom("cards")
        .where(({fn, val}) => fn("strpos", ["cards.text", val(searchTerm)]), ">", 0)
        .orderBy("cards.index")
        .limit(20)
    );

    const cardRows = await cardsQuery.execute();

    return cardRows.map(cardRow => this.rowToCard(cardRow));
  }

  async fetchBoardCardTrees(
    boardId: BoardId,
    cardStatuses: ReadonlySet<CardStatus>,
  ): Promise<ReadonlyArray<CardTree>> {
    const cardsQuery = this.selectColumns(
      this.database
        .withRecursive(
          "boardCards(id, childrenAllowed)",
          db => {
            let rootCards = db.selectFrom("cards")
              .select(eb => ["id", eb.lit<boolean>(true).as("childrenAllowed")]);
            if (boardId.boardRootId === null) {
              rootCards = rootCards.where("cards.parentCardId", "is", null);
            } else {
              rootCards = rootCards.where("cards.id", "=", boardId.boardRootId);
            }

            return rootCards.union(
              db.selectFrom("cards")
                .select(eb => ["cards.id", eb.not(eb.ref("isSubboardRoot")).as("childrenAllowed")])
                .innerJoin("boardCards", "boardCards.id", "cards.parentCardId")
                .where("boardCards.childrenAllowed", "=", true)
            );
          }
        )
        .selectFrom("cards")
        .innerJoin("boardCards", "boardCards.id", "cards.id")
        .where("cards.status", "in", Array.from(cardStatuses))
    );

    const cardRows = await cardsQuery.execute();

    const cards = cardRows.map(cardRow => this.rowToCard(cardRow));

    return cardsToTrees(cards, boardId);
  }

  async fetchParentBoard(boardId: BoardId): Promise<BoardId> {
    if (boardId.boardRootId === null) {
      return rootBoardId;
    }

    const row = await this.database
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
