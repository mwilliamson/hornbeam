import React from "react";
import ReactDOM from "react-dom/client";

import { connectSimpleSync } from "./backendConnections/simpleSync";
import { BackendConnection } from "./backendConnections";
import BackendConnect from "./views/BackendConnect";
import AppView from "./views/AppView";

function webSocketUri(): string {
  const location = window.location;
  const webSocketProtocol = location.protocol === "https:" ? "wss" : "ws";

  let path = new URLSearchParams(location.search).get("path") || "ws";
  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  return `${webSocketProtocol}://${location.host}/${path}`;
}

function connect(): BackendConnection {
  return connectSimpleSync(webSocketUri());
}

function SimpleSyncClient() {
  return (
    <BackendConnect connect={connect}>
      {backendConnection => (
        <AppView backendConnection={backendConnection} />
      )}
    </BackendConnect>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SimpleSyncClient />
  </React.StrictMode>,
);
