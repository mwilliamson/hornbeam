import React from "react";
import ReactDOM from "react-dom/client";

import { applyAppUpdate, initialAppState } from "hornbeam-common/src/app";
import { deserializeAppUpdate } from "hornbeam-common/src/serialization/app";
import BoardView from "./views/BoardView";
import hornbeamLog from "../../hornbeam.log";
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
        <BoardView backendConnection={backendConnection} />
      )}
    </ConnectInMemory>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Client />
  </React.StrictMode>,
);
