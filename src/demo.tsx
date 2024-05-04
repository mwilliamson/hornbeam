import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { applyAppUpdate, AppState, initialAppState } from "./app";
import { AppUpdate } from "./app/snapshots";
import AppView from "./views/AppView";
import hornbeamLog from "../hornbeam.log";
import { deserializeAppUpdate } from "./serialization";

function Client() {
  const [appState, setAppState] = useState<AppState>(() => {
    let appState = initialAppState();

    for (const message of hornbeamLog) {
      const appUpdate = deserializeAppUpdate(message.payload);
      appState = applyAppUpdate(appState, appUpdate);
    }

    return appState;
  });

  const sendUpdate = (update: AppUpdate) => {
    setAppState(appState => applyAppUpdate(appState, update));
  };

  return (
    <AppView sendUpdate={sendUpdate} appState={appState} />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Client />
  </React.StrictMode>,
);
