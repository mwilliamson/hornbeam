import http from "node:http";
import * as simpleSync from "simple-sync/lib";

import { createBackendConnectionTestSuite } from "./backendConnection.test";
import { connectSimpleSync } from "./simpleSync";
import { createDeferred } from "hornbeam-common/lib/util/promises";

createBackendConnectionTestSuite(
  "backendConnections/simpleSync",
  async () => {
    const webSocketPath = "/ws";

    const httpServer = http.createServer();

    simpleSync.listen({
      httpServer,
      webSocketPath,
    });

    httpServer.listen();

    const address = httpServer.address();
    if (address === null || typeof address === "string") {
      throw new Error("could not find port of HTTP server");
    }
    const port = address.port;

    const backendConnection = connectSimpleSync(`ws://localhost:${port}${webSocketPath}`);

    const tearDown = async () => {
      const closeDeferred = createDeferred();

      httpServer.close(error => {
        if (error) {
          closeDeferred.reject(error);
        } else {
          closeDeferred.resolve(undefined);
        }
      });

      await closeDeferred.promise;
    };

    return [backendConnection, tearDown];
  },
);
