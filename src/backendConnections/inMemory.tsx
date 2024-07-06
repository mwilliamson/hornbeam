import { useState } from "react";
import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "../app";
import { AppUpdate, AppRequest } from "../app/snapshots";
import { BackendConnection, BackendConnectionProvider } from ".";
import { appStateToQueryFunction } from "./simpleSync";

interface ConnectInMemoryProps {
  children: (connection: BackendConnection) => React.ReactNode;
  initialState: () => AppState;
}

export function ConnectInMemory(props: ConnectInMemoryProps) {
  const {children, initialState} = props;

  const [appState, setAppState] = useState<AppState>(initialState);

  const sendRequest = async (request: AppRequest) => {
    const update: AppUpdate = {
      request,
      updateId: uuidv7(),
    };
    setAppState(appState => applyAppUpdate(appState, update));
  };

  const connection = {
    appState,
    query: appStateToQueryFunction(appState),
    sendRequest,
  };

  return (
    <BackendConnectionProvider value={connection}>
      {children(connection)}
    </BackendConnectionProvider>
  );
}
