import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "hornbeam-common/lib/app";
import { AppUpdate, AppRequest } from "hornbeam-common/lib/app/snapshots";
import { queryAppState } from "hornbeam-common/lib/appStateToQueryFunction";
import { BackendConnection, BackendSubscriptions } from ".";
import { last, mapValues } from "lodash";
import { AppQueries, AppQueriesResult } from "hornbeam-common/lib/queries";

export function connectInMemory(initialState: AppState): BackendConnection {
  let appState = initialState;
  const subscriptions = new BackendSubscriptions();

  const generateLastUpdate = () => {
    return {
      updateId: last(appState.updateIds) ?? null,
      snapshotIndex: appState.latestSnapshotIndex(),
    };
  };

  const sendRequest = async (request: AppRequest) => {
    const update: AppUpdate = {
      request,
      updateId: uuidv7(),
    };

    appState = applyAppUpdate(appState, update);
    subscriptions.onLastUpdate(generateLastUpdate());
  };

  let timeTravelSnapshotIndex: number | null = null;
  const setTimeTravelSnapshotIndex = (newSnapshotIndex: number | null) => {
    timeTravelSnapshotIndex = newSnapshotIndex;
    subscriptions.onTimeTravel(newSnapshotIndex);
  };

  subscriptions.onLastUpdate(generateLastUpdate());

  return {
    close: () => {},
    query: async query => queryAppState(appState, timeTravelSnapshotIndex, query),
    queryMany: async <TQueries extends AppQueries>(queries: TQueries) => mapValues(
      queries,
      query => queryAppState(appState, timeTravelSnapshotIndex, query),
    ) as AppQueriesResult<TQueries>,
    sendRequest,
    subscribe: subscriptions.subscribe,
    subscribeStatus: subscriptions.subscribeConnectionStatus,
    setTimeTravelSnapshotIndex,
  };
}
