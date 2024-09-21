import createDatabase from "./database/createDatabase";
import * as settings from "./settings";

async function run() {
  await createDatabase(settings.databaseUrl());
}

run();
