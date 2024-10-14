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
  getDatabaseUrl: () => Promise<string>;
  getDatabase: () => Promise<Database>;
  reset: () => Promise<void>;
}

export function createReusableTemporaryDatabase(databaseUrl: string): ReusableTemporaryDatabase {
  const sessionDisposableStack = new AsyncDisposableStack();

  let temporaryDatabase: TemporaryDatabase | null = null;
  let connectedDatabase: Database | null = null;

  let disposed = false;

  async function setUpDatabase(): Promise<[string, Database]> {
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

    return [temporaryDatabase.connectionString, connectedDatabase];
  }

  async function getDatabase(): Promise<Database> {
    const [_, database] = await setUpDatabase();
    return database;
  }

  async function getDatabaseUrl(): Promise<string> {
    const [databaseUrl] = await setUpDatabase();
    return databaseUrl;
  }

  const reset = async (): Promise<void> => {
    if (connectedDatabase !== null) {
      await sql`
        DELETE FROM comments;
        DELETE FROM cards;
        DELETE FROM categories;
        DELETE FROM projects;
        DELETE FROM users;
        DELETE FROM effect_log;
      `.execute(connectedDatabase);
    }
  };

  return {
    getDatabaseUrl,
    getDatabase,
    reset,
    [Symbol.asyncDispose]: async () => {
      disposed = true;
      await sessionDisposableStack.disposeAsync();
    }
  };
}
