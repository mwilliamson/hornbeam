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
  let database: Database | null = null;

  async function getDatabase(): Promise<Database> {
    // TODO: deal with concurrency
    if (database === null) {
      const temporaryDatabase = disposableStack.use(await createTemporaryDatabase(testDatabaseUrl()));
      const connectedDatabase = await databaseConnect(temporaryDatabase.connectionString);
      disposableStack.defer(() => {
        connectedDatabase.destroy();
      });
      database = connectedDatabase;
    }

    return database;
  }

  return {
    categoryRepository: async () => {
      return new CategoryRepositoryDatabase(await getDatabase());
    },
    [Symbol.asyncDispose]: async () => {
      await disposableStack.disposeAsync();
    },
  };
}
