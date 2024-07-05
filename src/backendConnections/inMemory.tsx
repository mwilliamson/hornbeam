import { useState } from "react";
import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "../app";
import { AppUpdate, Request } from "../app/snapshots";
import { BackendConnection } from ".";

export function useInMemoryBackend(initialState: () => AppState): BackendConnection {
  const [appState, setAppState] = useState<AppState>(initialState);

  const sendRequest = async (request: Request) => {
    const update: AppUpdate = {
      request,
      updateId: uuidv7(),
    };
    setAppState(appState => applyAppUpdate(appState, update));
  };

  return {
    appState,
    sendRequest,
  };
}
