import "disposablestack/auto";
import { initialAppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { CategoryRepository, CategoryRepositoryDatabase, CategoryRepositoryInMemory } from "./categories";
import { Database, databaseConnect } from "../database";
import { createTemporaryDatabase } from "../database/temporaryDatabases";
import { testDatabaseUrl } from "../settings";

export interface RepositoryFixtures extends AsyncDisposable {
  categoryRepository: () => Promise<CategoryRepository>;
}

export function repositoryFixturesInMemory(): RepositoryFixtures {
  const snapshot = initialAppSnapshot();

  return {
    categoryRepository: async () => {
      return new CategoryRepositoryInMemory(snapshot);
    },
    [Symbol.asyncDispose]: async () => {
    },
  };
}

export function repositoryFixturesDatabase(): RepositoryFixtures {
  const disposableStack = new AsyncDisposableStack();
  let database: Promise<Database> | null = null;
  let disposed = false;

  async function setUpDatabase(): Promise<Database> {
    const temporaryDatabase = await createTemporaryDatabase(testDatabaseUrl());
    if (disposed) {
      throw new Error("Cannot use after disposal");
    }
    disposableStack.use(temporaryDatabase);

    const connectedDatabase = await databaseConnect(temporaryDatabase.connectionString);
    if (disposed) {
      throw new Error("Cannot use after disposal");
    }
    disposableStack.defer(() => {
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
    categoryRepository: async () => {
      return new CategoryRepositoryDatabase(await getDatabase());
    },
    [Symbol.asyncDispose]: async () => {
      disposed = true;
      await disposableStack.disposeAsync();
    },
  };
}
