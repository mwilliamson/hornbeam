import "disposablestack/auto";
import { initialAppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { CategoryRepository, CategoryRepositoryDatabase, CategoryRepositoryInMemory } from "./categories";
import { Database, databaseConnect } from "../database";
import { createTemporaryDatabase, TemporaryDatabase } from "../database/temporaryDatabases";
import { testDatabaseUrl } from "../settings";
import * as testing from "../testing";
import { AppSnapshotRef } from "./snapshotRef";
import { CardRepository, CardRepositoryDatabase, CardRepositoryInMemory } from "./cards";
import { sql } from "kysely";

export interface RepositoryFixtures extends AsyncDisposable {
  cardRepository: () => Promise<CardRepository>;
  categoryRepository: () => Promise<CategoryRepository>;
}

export function repositoryFixturesInMemory(): RepositoryFixtures {
  const snapshot = new AppSnapshotRef(initialAppSnapshot());

  return {
    cardRepository: async () => {
      return new CardRepositoryInMemory(snapshot);
    },
    categoryRepository: async () => {
      return new CategoryRepositoryInMemory(snapshot);
    },
    [Symbol.asyncDispose]: async () => {
    },
  };
}

let temporaryDatabase: TemporaryDatabase | null = null;

export function repositoryFixturesDatabase(): RepositoryFixtures {
  const disposableStack = new AsyncDisposableStack();
  let database: Promise<Database> | null = null;
  let disposed = false;

  async function setUpDatabase(): Promise<Database> {
    if (temporaryDatabase === null) {
      temporaryDatabase = await createTemporaryDatabase(testDatabaseUrl());
      testing.use(temporaryDatabase);
    }
    if (disposed) {
      throw new Error("Cannot use after disposal");
    }

    const connectedDatabase = await databaseConnect(temporaryDatabase.connectionString);
    if (disposed) {
      throw new Error("Cannot use after disposal");
    }
    disposableStack.defer(async () => {
      await sql`
        DELETE FROM cards;
        DELETE FROM categories;
      `.execute(connectedDatabase);
      connectedDatabase.destroy();
    });

    return connectedDatabase;
  }

  async function getDatabase(): Promise<Database> {
    if (disposed) {
      throw new Error("Cannot use after disposal");
    }

    if (database === null) {
      database = setUpDatabase();
    }

    return database;
  }

  return {
    cardRepository: async () => {
      return new CardRepositoryDatabase(await getDatabase());
    },

    categoryRepository: async () => {
      return new CategoryRepositoryDatabase(await getDatabase());
    },

    [Symbol.asyncDispose]: async () => {
      disposed = true;
      await disposableStack.disposeAsync();
    },
  };
}
