import { Instant } from "@js-joda/core";
import { Card, CardAddEffect, CardEditEffect } from "hornbeam-common/lib/app/cards";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";
import { CardStatus } from "hornbeam-common/lib/app/cardStatuses";
import { SerializedCardStatus } from "hornbeam-common/lib/serialization/cardStatuses";
import { deserialize } from "hornbeam-common/lib/serialization/deserialize";
import { DB } from "../database/types";
import { SelectQueryBuilder } from "kysely";
import { BoardId, cardSubboardId, rootBoardId } from "hornbeam-common/lib/app/boards";
import { queryAppSnapshot } from "hornbeam-common/lib/appStateToQueryFunction";
import { BoardCardTreesQuery, boardCardTreesQuery, CardChildCountQuery, CardQuery, ParentBoardQuery, parentBoardQuery, ParentCardQuery, SearchCardsQuery } from "hornbeam-common/lib/queries";
import { cardsToTrees, CardTree } from "hornbeam-common/lib/app/cardTrees";
import { appEffects } from "hornbeam-common/lib/app/snapshots";

export interface CardRepository {
  add: (effect: CardAddEffect) => Promise<void>;
  update: (effect: CardEditEffect) => Promise<void>;
  fetchByProjectId: (projectId: string) => Promise<ReadonlyArray<Card>>;
  fetchById: (query: CardQuery) => Promise<Card | null>;
  fetchParent: (query: ParentCardQuery) => Promise<Card | null>;
  fetchChildCount: (query: CardChildCountQuery) => Promise<number>;
  search: (query: SearchCardsQuery) => Promise<ReadonlyArray<Card>>;
  fetchBoardCardTrees: (query: BoardCardTreesQuery) => Promise<ReadonlyArray<CardTree>>;
  fetchParentBoard: (query: ParentBoardQuery) => Promise<BoardId>;
}

export class CardRepositoryInMemory implements CardRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(effect: CardAddEffect): Promise<void> {
    this.snapshot.applyEffect(appEffects.cardAdd(effect));
  }

  async update(effect: CardEditEffect): Promise<void> {
    this.snapshot.applyEffect(appEffects.cardEdit(effect));
  }

  async fetchByProjectId(projectId: string): Promise<ReadonlyArray<Card>> {
    return this.snapshot.value.fetchProjectContents(projectId).allCards();
  }

  async fetchById(query: CardQuery): Promise<Card | null> {
    return this.snapshot.value
      .fetchProjectContents(query.projectId)
      .findCardById(query.cardId);
  }

  async fetchParent(query: ParentCardQuery): Promise<Card | null> {
    const projectContents = this.snapshot.value
      .fetchProjectContents(query.projectId);

    const childCard = projectContents.findCardById(query.cardId);

    if (childCard === null || childCard.parentCardId === null) {
      return null;
    }

    return projectContents.findCardById(childCard.parentCardId);
  }

  async fetchChildCount(query: CardChildCountQuery): Promise<number> {
    return this.snapshot.value
      .fetchProjectContents(query.projectId)
      .countCardChildren(query.cardId);
  }

  async search(query: SearchCardsQuery): Promise<ReadonlyArray<Card>> {
    return this.snapshot.value
      .fetchProjectContents(query.projectId)
      .searchCards(query.searchTerm)
      .slice(0, MAX_SEARCH_RESULTS);
  }

  async fetchBoardCardTrees(query: BoardCardTreesQuery): Promise<ReadonlyArray<CardTree>> {
    return queryAppSnapshot(this.snapshot.value, boardCardTreesQuery(query));
  }

  async fetchParentBoard(query: ParentBoardQuery): Promise<BoardId> {
    return queryAppSnapshot(this.snapshot.value, parentBoardQuery(query));
  }
}

const MAX_SEARCH_RESULTS = 20;

export class CardRepositoryDatabase implements CardRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(effect: CardAddEffect): Promise<void> {
    await this.database.insertInto("cards")
      .values((eb) => ({
        categoryId: effect.categoryId,
        createdAt: new Date(effect.createdAt.toEpochMilli()),
        id: effect.id,
        index: eb.selectFrom("cards")
          .select(
            eb.fn.coalesce(
              eb(eb.fn.max("cards.index"), "+", 1),
              eb.lit(0),
            ).as("index")
          )
          .where("projectId", "=", effect.projectId),
        isSubboardRoot: false,
        number: eb.selectFrom("cards")
          .select(
            eb.fn.coalesce(
              eb(eb.fn.max("cards.number"), "+", 1),
              eb.lit(1),
            ).as("number")
          )
          .where("projectId", "=", effect.projectId),
        parentCardId: effect.parentCardId,
        projectId: effect.projectId,
        status: SerializedCardStatus.encode(CardStatus.None),
        text: effect.text,
      }))
      .execute();
  }

  async update(effect: CardEditEffect): Promise<void> {
    let query = this.database.updateTable("cards")
      .where("id", "=", effect.id);
    let queryRequired = false;

    if (effect.categoryId !== undefined) {
      // TODO: check category is valid
      query = query.set({categoryId: effect.categoryId});
      queryRequired = true;
    }

    if (effect.isSubboardRoot !== undefined) {
      query = query.set({isSubboardRoot: effect.isSubboardRoot});
      queryRequired = true;
    }

    if (effect.parentCardId !== undefined) {
      // TODO: check parent is valid
      query = query.set({parentCardId: effect.parentCardId});
      queryRequired = true;
    }

    if (effect.status !== undefined) {
      query = query.set({status: SerializedCardStatus.encode(effect.status)});
      queryRequired = true;
    }

    if (effect.text !== undefined) {
      query = query.set({text: effect.text});
      queryRequired = true;
    }

    if (queryRequired) {
      await query.execute();
    }
  }

  async fetchByProjectId(projectId: string): Promise<ReadonlyArray<Card>> {
    const cardsQuery = this.selectColumns(
      this.database.selectFrom("cards")
        .where("projectId", "=", projectId)
    );

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

  async fetchParent(query: ParentCardQuery): Promise<Card | null> {
    const cardQuery = this.selectColumns(
      this.database.selectFrom("cards")
        .innerJoin("cards as child_cards", "cards.id", "child_cards.parentCardId")
        .where("cards.projectId", "=", query.projectId)
        .where("child_cards.projectId", "=", query.projectId)
        .where("child_cards.id", "=", query.cardId)
    );

    const cardRow = await cardQuery.executeTakeFirst();

    if (cardRow === undefined) {
      return null;
    } else {
      return this.rowToCard(cardRow);
    }
  }

  async fetchChildCount(query: CardChildCountQuery): Promise<number> {
    const row = await this.database.selectFrom("cards")
      .innerJoin("cards as parent_cards", "cards.parentCardId", "parent_cards.id")
      .select(({fn, lit}) => [fn.count<string>(lit(0)).as("count")])
      .where("cards.parentCardId", "=", query.cardId)
      .where("cards.projectId", "=", query.projectId)
      .where("parent_cards.projectId", "=", query.projectId)
      .executeTakeFirst();

    return row === undefined ? 0 : parseInt(row.count, 10);
  }

  async search(query: SearchCardsQuery): Promise<ReadonlyArray<Card>> {
    const cardsQuery = this.selectColumns(
      this.database.selectFrom("cards")
        .where(({fn, val}) => fn("strpos", ["cards.text", val(query.searchTerm)]), ">", 0)
        .where("cards.projectId", "=", query.projectId)
        .orderBy("cards.index")
        .limit(20)
    );

    const cardRows = await cardsQuery.execute();

    return cardRows.map(cardRow => this.rowToCard(cardRow));
  }

  async fetchBoardCardTrees(query: BoardCardTreesQuery): Promise<ReadonlyArray<CardTree>> {
    const cardsQuery = this.selectColumns(
      this.database
        .withRecursive(
          "boardCards(id, childrenAllowed)",
          db => {
            let rootCards = db.selectFrom("cards")
              .select(eb => ["id", eb.lit<boolean>(true).as("childrenAllowed")])
              .where("cards.projectId", "=", query.projectId);
            if (query.boardId.boardRootId === null) {
              rootCards = rootCards.where("cards.parentCardId", "is", null);
            } else {
              rootCards = rootCards.where("cards.id", "=", query.boardId.boardRootId);
            }

            return rootCards.union(
              db.selectFrom("cards")
                .select(eb => ["cards.id", eb.not(eb.ref("isSubboardRoot")).as("childrenAllowed")])
                .innerJoin("boardCards", "boardCards.id", "cards.parentCardId")
                .where("boardCards.childrenAllowed", "=", true)
                .where("cards.projectId", "=", query.projectId)
            );
          }
        )
        .selectFrom("cards")
        .innerJoin("boardCards", "boardCards.id", "cards.id")
        .where("cards.status", "in", Array.from(query.cardStatuses))
        .where("cards.projectId", "=", query.projectId)
    );

    const cardRows = await cardsQuery.execute();

    const cards = cardRows.map(cardRow => this.rowToCard(cardRow));

    return cardsToTrees(cards, query.boardId);
  }

  async fetchParentBoard(query: ParentBoardQuery): Promise<BoardId> {
    if (query.boardId.boardRootId === null) {
      return rootBoardId;
    }

    const row = await this.database
      .withRecursive(
        "ancestors(id, parentId, isParentBoard)",
        db =>
          db.selectFrom("cards")
            .select(eb => ["id as id", "parentCardId as parentId", eb.lit<boolean>(false).as("isParentBoard")])
            .where("id", "=", query.boardId.boardRootId)
            .where("cards.projectId", "=", query.projectId)
            .union(
              db.selectFrom("cards")
                .select(["cards.id as id", "cards.parentCardId as parentId", "cards.isSubboardRoot as isParentBoard"])
                .innerJoin("ancestors", "ancestors.parentId", "cards.id")
                .where("ancestors.isParentBoard", "=", false)
                .where("cards.projectId", "=", query.projectId)
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
