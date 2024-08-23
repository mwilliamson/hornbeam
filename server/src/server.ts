import { startServer } from "./";

async function run() {
  try {
    startServer({port: 3000});
  } catch (err) {
    process.exit(1);
  }
}

run();
