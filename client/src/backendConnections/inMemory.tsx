import { last } from "lodash";
import { useState } from "react";
import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "hornbeam-common/src/app";
import { AppUpdate, AppRequest } from "hornbeam-common/src/app/snapshots";
import appStateToQueryFunction from "hornbeam-common/src/appStateToQueryFunction";
import { BackendConnection, BackendConnectionProvider } from ".";

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

  // TODO: remove time travel duplication with simpleSync
  const [timeTravelSnapshotIndex, setTimeTravelSnapshotIndex] = useState<number | null>(null);

  // TODO: ensure connection doesn't change.
  const connection: BackendConnection = {
    query: appStateToQueryFunction(appState, timeTravelSnapshotIndex),
    sendRequest,
    lastUpdateId: last(appState.updateIds) ?? null,
    timeTravel: {
      maxSnapshotIndex: appState.latestSnapshotIndex(),
      snapshotIndex: timeTravelSnapshotIndex,
      setSnapshotIndex: newSnapshotIndex => setTimeTravelSnapshotIndex(newSnapshotIndex),
      start: () => setTimeTravelSnapshotIndex(appState.latestSnapshotIndex()),
      stop: () => setTimeTravelSnapshotIndex(null),
    },
  };

  return (
    <BackendConnectionProvider value={connection}>
      {children(connection)}
    </BackendConnectionProvider>
  );
}
