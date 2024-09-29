import React from "react";
import ReactDOM from "react-dom/client";

import { applyAppUpdate, initialAppState } from "hornbeam-common/lib/app";
import { deserializeAppUpdate } from "hornbeam-common/lib/serialization/app";
import hornbeamLog from "../../hornbeam.log";
import { connectInMemory } from "./backendConnections/inMemory";
import BackendConnect from "./views/BackendConnect";
import { BackendConnection } from "./backendConnections";
import AppView from "./views/AppView";

function connect(): BackendConnection {
  let appState = initialAppState();

  for (const message of hornbeamLog) {
    const appUpdate = deserializeAppUpdate(message.payload);
    appState = applyAppUpdate(appState, appUpdate);
  }

  return connectInMemory(appState);
}

function Client() {
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
    <Client />
  </React.StrictMode>,
);
