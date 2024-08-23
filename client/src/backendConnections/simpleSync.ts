import { last } from "lodash";
import * as simpleSync from "simple-sync/lib/client";
import { uuidv7 } from "uuidv7";

import { applyAppUpdate, initialAppState } from "hornbeam-common/lib/app";
import { AppUpdate, AppRequest } from "hornbeam-common/lib/app/snapshots";
import { queryAppState } from "hornbeam-common/lib/appStateToQueryFunction";
import { deserializeAppUpdate, serializeAppUpdate } from "hornbeam-common/lib/serialization/app";
import { Deferred, createDeferred } from "hornbeam-common/lib/util/promises";
import { BackendConnection, BackendSubscriptions } from ".";
import assertNever from "hornbeam-common/lib/util/assertNever";

export function connectSimpleSync(
  uri: string,
): BackendConnection {
  let appState = initialAppState();
  const requestSender: RequestSender = createRequestSender();
  const subscriptions = new BackendSubscriptions();

  const client = simpleSync.connect({
    applyAppUpdate,
    initialAppState: appState,
    uri: uri,
    serializeAppUpdate,
    deserializeAppUpdate,
    onChange: (state) => {
      switch (state.type) {
        case "connecting": {
          requestSender.useSendAppUpdate(null);
          return;
        }
        case "connected": {
          appState = state.appState;
          requestSender.useSendAppUpdate(state.sendAppUpdate);
          requestSender.receiveUpdateIds(appState.updateIds);
          subscriptions.onLastUpdate({
            updateId: last(appState.updateIds) ?? null,
            snapshotIndex: appState.latestSnapshotIndex(),
          });
          return;
        }
        case "connection-error": {
          requestSender.useSendAppUpdate(null);
          subscriptions.onConnectionError();
          return;
        }
        case "sync-error": {
          // TODO: error
          requestSender.useSendAppUpdate(null);
          subscriptions.onSyncError();
          return;
        }
        default:
          assertNever(state, null);
      }
    },
  });

  let timeTravelSnapshotIndex: number | null = null;
  const setTimeTravelSnapshotIndex = (newSnapshotIndex: number | null) => {
    timeTravelSnapshotIndex = newSnapshotIndex;
    subscriptions.onTimeTravel(newSnapshotIndex);
  };

  return {
    close: () => client.close(),
    query: async query => {
      return queryAppState(appState, timeTravelSnapshotIndex, query);
    },
    sendRequest: requestSender.sendRequest,
    subscribe: subscriptions.subscribe,
    setTimeTravelSnapshotIndex,
  };
}

interface RequestSender {
  sendRequest: (request: AppRequest) => Promise<void>;
  useSendAppUpdate: (sendAppUpdate: ((update: AppUpdate) => void) | null) => void;
  receiveUpdateIds: (updateIds: ReadonlyArray<string>) => void;
}

function createRequestSender(): RequestSender {
  let sendAppUpdate: ((update: AppUpdate) => void) | null = null;
  const pendingUpdates = new Map<string, Deferred<void>>();
  let lastUpdateIndex = -1;

  return {
    sendRequest: async (request: AppRequest) => {
      if (sendAppUpdate === null) {
        // TODO: better error?
        throw new Error("Not connected");
      }

      const updateId = uuidv7();
      sendAppUpdate({
        updateId,
        request,
      });

      const deferred = createDeferred<void>();
      pendingUpdates.set(updateId, deferred);
      return deferred.promise;
    },

    useSendAppUpdate: newSendAppUpdate => {
      sendAppUpdate = newSendAppUpdate;
    },

    receiveUpdateIds: (updateIds) => {
      for (
        let updateIndex = lastUpdateIndex + 1;
        updateIndex < updateIds.length;
        updateIndex++
      ) {
        const updateId = updateIds[updateIndex];
        const pendingUpdate = pendingUpdates.get(updateId);
        if (pendingUpdate !== undefined) {
          pendingUpdate.resolve();
          pendingUpdates.delete(updateId);
        }

        lastUpdateIndex = updateIndex;
      }
    },
  };
}
