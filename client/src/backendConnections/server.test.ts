import "disposablestack/auto";
import { startServer } from "hornbeam-server/lib";
import * as settings from "hornbeam-server/lib/settings";
import { createTemporaryDatabase } from "hornbeam-server/lib/database/temporaryDatabases";
import { createBackendConnectionTestSuite } from "./backendConnection.test";
import { connectServer } from "./server";

createBackendConnectionTestSuite(
  "backendConnections/server",
  async () => {
    // TODO: reuse database (reuse code from server fixtures?)
    const disposableStack = new AsyncDisposableStack();

    const temporaryDatabase = await createTemporaryDatabase(settings.testDatabaseUrl());
    disposableStack.use(temporaryDatabase);

    const httpServer = await startServer({databaseUrl: temporaryDatabase.connectionString, port: 0});
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
