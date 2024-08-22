import { last } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useSimpleSync } from "simple-sync/lib/react";
import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate, initialAppState } from "hornbeam-common/src/app";
import { AppUpdate, AppRequest } from "hornbeam-common/src/app/snapshots";
import appStateToQueryFunction from "hornbeam-common/src/appStateToQueryFunction";
import { deserializeAppUpdate, serializeAppUpdate } from "hornbeam-common/src/serialization/app";
import { Deferred, createDeferred } from "hornbeam-common/src/util/promises";
import { BackendConnection, BackendConnectionProvider, BackendConnectionState, BackendSubscriptions } from ".";

interface ConnectSimpleSyncProps {
  children: (connectionState: BackendConnectionState) => React.ReactNode;
  uri: string;
}

export function ConnectSimpleSync(props: ConnectSimpleSyncProps) {
  const {children, uri} = props;

  const state = useSimpleSync({
    applyAppUpdate,
    initialAppState: initialAppState(),
    uri: uri,

    serializeAppUpdate,
    deserializeAppUpdate,
  });


  if (state.type === "connected") {
    return (
      <ConnectedSimpleSync
        appState={state.appState}
        sendAppUpdate={state.sendAppUpdate}
      >
        {children}
      </ConnectedSimpleSync>
    );
  } else {
    return children(state);
  }
}

interface ConnectedSimpleSyncProps {
  appState: AppState;
  children: (connectionState: BackendConnectionState) => React.ReactNode;
  sendAppUpdate: (update: AppUpdate) => void;
}

function ConnectedSimpleSync(props: ConnectedSimpleSyncProps) {
  const {appState, children, sendAppUpdate} = props;

  const [timeTravelSnapshotIndex, setTimeTravelSnapshotIndex] = useState<number | null>(null);
  const query = appStateToQueryFunction(appState, timeTravelSnapshotIndex);
  const sendRequest = useCreateSendRequest(sendAppUpdate, appState.updateIds);

  const subscriptionsRef = useRef(new BackendSubscriptions());
  const lastUpdateId = last(appState.updateIds) ?? null;
  useEffect(() => {
    subscriptionsRef.current.setLastUpdateId(lastUpdateId);
  }, [lastUpdateId]);

  // TODO: ensure connection doesn't change.
  const connection: BackendConnection = {
    query,
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
      {children({
        type: "connected",
        connection,
      })}
    </BackendConnectionProvider>
  );
}

function useCreateSendRequest(
  sendUpdate: (update: AppUpdate) => void,
  updateIds: ReadonlyArray<string>,
): (request: AppRequest) => Promise<void> {
  const pendingRef = useRef({
    requests: new Map<string, Deferred<void>>(),
    lastUpdateIndex: -1,
  });

  const sendRequestRef = useRef(async (request: AppRequest) => {
    const updateId = uuidv7();
    sendUpdate({
      updateId,
      request,
    });

    const deferred = createDeferred<void>();

    pendingRef.current.requests.set(updateId, deferred);

    return deferred.promise;
  });

  useEffect(() => {
    for (
      let updateIndex = pendingRef.current.lastUpdateIndex + 1;
      updateIndex < updateIds.length;
      updateIndex++
    ) {
      const updateId = updateIds[updateIndex];
      const pendingRequest = pendingRef.current.requests.get(updateId);
      if (pendingRequest !== undefined) {
        pendingRequest.resolve();
        pendingRef.current.requests.delete(updateId);
      }

      pendingRef.current.lastUpdateIndex = updateIndex;
    }
  }, [updateIds]);

  return sendRequestRef.current;
}
