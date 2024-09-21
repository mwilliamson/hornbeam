import "disposablestack/auto";
import { Client } from "pg";
import createDatabase from "./createDatabase";

export interface TemporaryDatabase extends AsyncDisposable {
  connectionString: string;
}

export async function createTemporaryDatabase(databaseUrl: string): Promise<TemporaryDatabase> {
  await using disposableStack = new AsyncDisposableStack();

  const databaseManagementClient = new Client(databaseUrl);
  databaseManagementClient.connect();
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
