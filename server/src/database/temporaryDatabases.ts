import "disposablestack/auto";
import { Client } from "pg";
import createDatabase from "./createDatabase";
import { Database, databaseConnect } from ".";
import { sql } from "kysely";

export interface TemporaryDatabase extends AsyncDisposable {
  connectionString: string;
}

export async function createTemporaryDatabase(databaseUrl: string): Promise<TemporaryDatabase> {
  await using disposableStack = new AsyncDisposableStack();

  const databaseManagementClient = new Client(databaseUrl);
  await databaseManagementClient.connect();
  disposableStack.defer(async () => {
    await databaseManagementClient.end();
  });

  await databaseManagementClient.query(`
    DROP DATABASE IF EXISTS hornbeam_tmp;
  `);
  await databaseManagementClient.query(`
    CREATE DATABASE hornbeam_tmp;
  `);
  disposableStack.defer(async () => {
    await databaseManagementClient.query(`
      DROP DATABASE hornbeam_tmp;
    `);
  });

  const connectionString = `postgres://${databaseManagementClient.user}:${databaseManagementClient.password}@${databaseManagementClient.host}/hornbeam_tmp`;
  await createDatabase(connectionString);

  const returnDisposableStack = disposableStack.move();

  return {
    connectionString,
    async [Symbol.asyncDispose]() {
      await returnDisposableStack.disposeAsync();
    },
  };
}

export async function withTemporaryDatabase(
  databaseUrl: string,
  f: (connectionString: string) => Promise<void>,
): Promise<void> {
  await using temporaryDatabase = await createTemporaryDatabase(databaseUrl);

  await f(temporaryDatabase.connectionString);
}

interface ReusableTemporaryDatabase extends AsyncDisposable {
  getDatabase: () => Promise<Database>;
  reset: () => Promise<void>;
}

export function createReusableTemporaryDatabase(databaseUrl: string): ReusableTemporaryDatabase {
  const sessionDisposableStack = new AsyncDisposableStack();

  let temporaryDatabase: TemporaryDatabase | null = null;
  let connectedDatabase: Database | null = null;

  let disposed = false;

  async function getDatabase(): Promise<Database> {
    if (temporaryDatabase === null) {
      temporaryDatabase = await createTemporaryDatabase(databaseUrl);
      sessionDisposableStack.use(temporaryDatabase);
    }
    if (disposed) {
      throw new Error("Cannot use after disposal");
    }

    if (connectedDatabase === null) {
      const newConnectedDatabase = await databaseConnect(temporaryDatabase.connectionString);
      sessionDisposableStack.defer(async () => {
        newConnectedDatabase.destroy();
      });
      connectedDatabase = newConnectedDatabase;
      if (disposed) {
        throw new Error("Cannot use after disposal");
      }
    }

    return connectedDatabase;
  }

  const reset = async (): Promise<void> => {
    if (connectedDatabase !== null) {
      await sql`
        DELETE FROM cards;
        DELETE FROM categories;
      `.execute(connectedDatabase);
    }
  };

  return {
    getDatabase,
    reset,
    [Symbol.asyncDispose]: async () => {
      disposed = true;
      await sessionDisposableStack.disposeAsync();
    }
  };
}
