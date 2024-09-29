import React from "react";
import ReactDOM from "react-dom/client";

import { connectServer } from "./backendConnections/server";
import BackendConnect from "./views/BackendConnect";
import { BackendConnection } from "./backendConnections";
import AppView from "./views/AppView";

function connect(): BackendConnection {
  return connectServer("/");
}

function Client() {
  return (
    <BackendConnect connect={connect}>
      {(connection) => (
        <AppView
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
