import "disposablestack/auto";
import { initialAppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { CategoryRepository, CategoryRepositoryDatabase, CategoryRepositoryInMemory } from "./categories";
import { Database } from "../database";
import { createReusableTemporaryDatabase } from "../database/temporaryDatabases";
import { testDatabaseUrl } from "../settings";
import * as testing from "../testing";
import { AppSnapshotRef } from "./snapshotRef";
import { CardRepository, CardRepositoryDatabase, CardRepositoryInMemory } from "./cards";

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

const temporaryDatabase = createReusableTemporaryDatabase(testDatabaseUrl());
testing.use(temporaryDatabase);

export function repositoryFixturesDatabase(): RepositoryFixtures {
  let database: Promise<Database> | null = null;
  let disposed = false;

  async function getDatabase(): Promise<Database> {
    if (disposed) {
      throw new Error("Cannot use after disposal");
    }

    if (database === null) {
      database = temporaryDatabase.getDatabase();
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
      await temporaryDatabase.reset();
    },
  };
}
