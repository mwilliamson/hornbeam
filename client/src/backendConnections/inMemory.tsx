import { useEffect, useRef, useState } from "react";
import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "hornbeam-common/src/app";
import { AppUpdate, AppRequest } from "hornbeam-common/src/app/snapshots";
import appStateToQueryFunction from "hornbeam-common/src/appStateToQueryFunction";
import { BackendConnection, BackendConnectionProvider, BackendSubscriptions } from ".";
import { last } from "lodash";

interface ConnectInMemoryProps {
  children: (connection: BackendConnection) => React.ReactNode;
  initialState: () => AppState;
}

export function ConnectInMemory(props: ConnectInMemoryProps) {
  const {children, initialState} = props;

  // TODO: don't use (React) state for app state
  const [appState, setAppState] = useState<AppState>(initialState);

  const subscriptionsRef = useRef(new BackendSubscriptions());
  const lastUpdateId = last(appState.updateIds) ?? null;
  useEffect(() => {
    subscriptionsRef.current.setLastUpdateId(lastUpdateId);
  }, [lastUpdateId]);

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
    subscribe: subscriptionsRef.current.subscribe,
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
