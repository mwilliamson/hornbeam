import React from "react";
import ReactDOM from "react-dom/client";

import { applyAppUpdate, initialAppState } from "./app";
import AppView from "./views/AppView";
import hornbeamLog from "../../hornbeam.log";
import { deserializeAppUpdate } from "./serialization";
import { ConnectInMemory } from "./backendConnections/inMemory";

function Client() {
  const initialDemoState = () => {
    let appState = initialAppState();

    for (const message of hornbeamLog) {
      const appUpdate = deserializeAppUpdate(message.payload);
      appState = applyAppUpdate(appState, appUpdate);
    }

    return appState;
  };

  return (
    <ConnectInMemory initialState={initialDemoState}>
      {backendConnection => (
        <AppView backendConnection={backendConnection} />
      )}
    </ConnectInMemory>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Client />
  </React.StrictMode>,
);
