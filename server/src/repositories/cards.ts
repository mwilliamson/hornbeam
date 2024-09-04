import { Instant } from "@js-joda/core";
import { Card, CardAddMutation } from "hornbeam-common/lib/app/cards";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";
import { CardStatus } from "hornbeam-common/lib/app/cardStatuses";

export interface CardRepository {
  add: (mutation: CardAddMutation) => Promise<void>;
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

  async fetchById(id: string): Promise<Card | null> {
    const cardRow = await this.database.selectFrom("cards")
      .select(["categoryId", "createdAt", "id", "text"])
      .where("id", "=", id)
      .executeTakeFirst();

    if (cardRow === undefined) {
      return null;
    } else {
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
}
