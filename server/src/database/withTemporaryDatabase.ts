import { Client } from "pg";
import createDatabase from "./createDatabase";

export async function withTemporaryDatabase(
  databaseUrl: string,
  f: (connectionString: string) => Promise<void>,
): Promise<void> {
  const databaseManagementClient = new Client(databaseUrl);
  databaseManagementClient.connect();

  try {
    await databaseManagementClient.query(`
      CREATE DATABASE hornbeam_tmp;
    `);

    try {
      const connectionString = `postgres://${databaseManagementClient.user}:${databaseManagementClient.password}@${databaseManagementClient.host}/hornbeam_tmp`;
      await createDatabase(connectionString);
      await f(connectionString);
    } finally {
      await databaseManagementClient.query(`
        DROP DATABASE hornbeam_tmp;
      `);
    }
  } finally {
    await databaseManagementClient.end();
  }
}
