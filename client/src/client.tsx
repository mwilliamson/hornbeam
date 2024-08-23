import React from "react";
import ReactDOM from "react-dom/client";

import BoardView from "./views/BoardView";
import { connectServer } from "./backendConnections/server";
import BackendConnect from "./views/BackendConnect";
import { BackendConnection } from "./backendConnections";

function connect(): BackendConnection {
  return connectServer("/");
}

function Client() {
  return (
    <BackendConnect connect={connect}>
      {(connection) => (
        <BoardView
          backendConnection={connection}
        />
      )}
    </BackendConnect>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Client />
  </React.StrictMode>,
);
