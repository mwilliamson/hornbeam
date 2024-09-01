import "dotenv/config";
import childProcess from "node:child_process";
import util from "node:util";
import { Client } from "pg";
import createDatabase from "./createDatabase";

const exec = util.promisify(childProcess.exec);

async function generateTypes(): Promise<void> {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error("Missing TEST_DATABASE_URL");
  }

  await withTemporaryDatabase(databaseUrl, async (connectionString) => {
    await createDatabase(connectionString);

    console.log(await exec(`../node_modules/.bin/kysely-codegen --camel-case --out-file src/database/types.d.ts --singular --url ${connectionString}`));
  });
}

async function withTemporaryDatabase(
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

generateTypes().then(
  () => {
    console.log("Finished successfully.");
  },
  (error) => {
    console.error(error);
  }
);
