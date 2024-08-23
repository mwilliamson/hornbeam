import { startServer } from "hornbeam-server/lib";
import { createBackendConnectionTestSuite } from "./backendConnection.test";
import { connectServer } from "./server";

createBackendConnectionTestSuite(
  "backendConnections/server",
  async () => {
    const httpServer = await startServer({port: 0});

    const port = httpServer.port();
    if (port === null) {
      throw new Error("Could not find server port");
    }

    const backendConnection = connectServer(`http://localhost:${port}/`);

    const tearDown = async () => {
      await httpServer.close();
    };

    return [backendConnection, tearDown];
  },
);
