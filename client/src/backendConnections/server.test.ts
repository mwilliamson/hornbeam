import "disposablestack/auto";
import { startServer } from "hornbeam-server/lib";
import * as settings from "hornbeam-server/lib/settings";
import { createReusableTemporaryDatabase } from "hornbeam-server/lib/database/temporaryDatabases";
import { createBackendConnectionTestSuite } from "./backendConnection.test";
import { connectServer } from "./server";
import * as testing from "../testing";

const temporaryDatabase = createReusableTemporaryDatabase(settings.testDatabaseUrl());
testing.use(temporaryDatabase);

createBackendConnectionTestSuite(
  "backendConnections/server",
  async () => {
    const disposableStack = new AsyncDisposableStack();

    disposableStack.defer(async () => {
      await temporaryDatabase.reset();
    });
    const databaseUrl = await temporaryDatabase.getDatabaseUrl();

    const httpServer = await startServer({databaseUrl, port: 0});
    disposableStack.defer(async () => {
      await httpServer.close();
    });

    const port = httpServer.port();
    if (port === null) {
      throw new Error("Could not find server port");
    }

    const backendConnection = connectServer(`http://localhost:${port}/`);

    const tearDown = async () => {
      await disposableStack.disposeAsync();
    };

    return [backendConnection, tearDown];
  },
);
