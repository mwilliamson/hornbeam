import { useState } from "react";

import { applyAppUpdate, AppState, initialAppState } from "../app";
import { AppUpdate } from "../app/snapshots";
import AppView from "./AppView";

export default function AppViewFixture() {
  const [appState, setAppState] = useState<AppState>(initialAppState());

  const sendUpdate = (update: AppUpdate) => {
    setAppState(appState => applyAppUpdate(appState, update));
  };

  return (
    <div style={{height: "100vh", width: "100vw", margin: -20}}>
      <AppView sendUpdate={sendUpdate} appState={appState} />
    </div>
  );
}
