
import childProcess from "node:child_process";
import util from "node:util";
import { withTemporaryDatabase } from "./temporaryDatabases";
import { testDatabaseUrl } from "../settings";

const exec = util.promisify(childProcess.exec);

async function generateTypes(): Promise<void> {
  const databaseUrl = testDatabaseUrl();

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
