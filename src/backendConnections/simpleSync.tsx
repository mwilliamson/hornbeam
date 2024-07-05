
import { useSimpleSync } from "simple-sync/lib/react";

import { AppState, applyAppUpdate, initialAppState } from "../app";
import { deserializeAppUpdate, serializeAppUpdate } from "../serialization";
import { BackendConnectionState } from ".";
import { AppUpdate, AppRequest } from "../app/snapshots";
import { useEffect, useRef } from "react";
import { Deferred, createDeferred } from "../util/promises";
import { uuidv7 } from "uuidv7";

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

  const sendRequest = useCreateSendRequest(sendAppUpdate, appState.updateIds);

  return children({
    type: "connected",
    connection: {
      appState,
      sendRequest,
    }
  });
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
