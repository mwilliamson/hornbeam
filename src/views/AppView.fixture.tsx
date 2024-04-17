import { useState } from "react";

import { applyAppUpdate, AppState, AppUpdate, initialAppState } from "../app";
import AppView from "./AppView";

export default function AppViewFixture() {
  const [appState, setAppState] = useState<AppState>(initialAppState());

  const sendUpdate = (update: AppUpdate) => {
    setAppState(appState => applyAppUpdate(appState, update));
  };

  return (
    <div style={{height: "100vh", width: "100vw", margin: -20}}>
      <AppView sendUpdate={sendUpdate} state={appState} />
    </div>
  );
}
