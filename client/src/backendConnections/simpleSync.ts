import { mapValues } from "lodash";
import * as simpleSync from "simple-sync/lib/client";
import { uuidv7 } from "uuidv7";

import { applyAppUpdate, initialAppState } from "hornbeam-common/lib/app";
import { AppMutation, AppUpdate } from "hornbeam-common/lib/app/snapshots";
import { queryAppState } from "hornbeam-common/lib/appStateToQueryFunction";
import { deserializeAppUpdate, serializeAppUpdate } from "hornbeam-common/lib/serialization/app";
import { Deferred, createDeferred } from "hornbeam-common/lib/util/promises";
import { BackendConnection, BackendSubscriptions } from ".";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import { AppQueries, AppQueriesResult, AppQuery } from "hornbeam-common/lib/queries";

export function connectSimpleSync(
  uri: string,
): BackendConnection {
  let appState = initialAppState();

  const executeQuery = async <R>(query: AppQuery<R>): Promise<R> => {
    return queryAppState(appState, timeTravelSnapshotIndex, query);
  };

  const executeQueries = async <TQueries extends AppQueries>(queries: TQueries) => {
    return mapValues(
      queries,
      query => query === null ? null : queryAppState(appState, timeTravelSnapshotIndex, query),
    ) as AppQueriesResult<TQueries>;
  };

  const requestSender: RequestSender = createRequestSender();
  const subscriptions = new BackendSubscriptions(executeQueries);

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
          handleNever(state, null);
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
    executeQuery,
    executeQueries,
    mutate: requestSender.mutate,
    subscribeStatus: subscriptions.subscribeConnectionStatus,
    subscribeQueries: subscriptions.subscribeQueries,
    subscribeTimeTravel: subscriptions.subscribeTimeTravel,
    setTimeTravelSnapshotIndex,
  };
}

interface RequestSender {
  mutate: (mutation: AppMutation) => Promise<void>;
  useSendAppUpdate: (sendAppUpdate: ((update: AppUpdate) => void) | null) => void;
  receiveUpdateIds: (updateIds: ReadonlyArray<string>) => void;
}

function createRequestSender(): RequestSender {
  let sendAppUpdate: ((update: AppUpdate) => void) | null = null;
  const pendingUpdates = new Map<string, Deferred<void>>();
  let lastUpdateIndex = -1;

  return {
    mutate: async (mutation: AppMutation) => {
      if (sendAppUpdate === null) {
        // TODO: better error?
        throw new Error("Not connected");
      }

      const updateId = uuidv7();
      sendAppUpdate({
        updateId,
        mutation,
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
