import "dotenv/config";
import childProcess from "node:child_process";
import util from "node:util";
import { withTemporaryDatabase } from "./withTemporaryDatabase";

const exec = util.promisify(childProcess.exec);

async function generateTypes(): Promise<void> {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error("Missing TEST_DATABASE_URL");
  }

  await withTemporaryDatabase(databaseUrl, async (connectionString) => {
    console.log(await exec(`../node_modules/.bin/kysely-codegen --camel-case --out-file src/database/types.d.ts --singular --url ${connectionString}`));
  });
}

generateTypes().then(
  () => {
    console.log("Finished successfully.");
  },
  (error) => {
    console.error(error);
  }
);
