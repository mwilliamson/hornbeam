import { startServer } from "./";
import * as settings from "./settings";

async function run() {
  try {
    startServer({databaseUrl: settings.databaseUrl(), port: 3000});
  } catch (err) {
    process.exit(1);
  }
}

run();
