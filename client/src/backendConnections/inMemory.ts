import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "hornbeam-common/lib/app";
import { AppUpdate, AppRequest } from "hornbeam-common/lib/app/snapshots";
import { queryAppState } from "hornbeam-common/lib/appStateToQueryFunction";
import { BackendConnection, BackendSubscriptions } from ".";
import { last, mapValues } from "lodash";
import { AppQueries, AppQueriesResult, AppQuery } from "hornbeam-common/lib/queries";

export function connectInMemory(initialState: AppState): BackendConnection {
  let appState = initialState;

  const executeQuery = async <R>(query: AppQuery<R>): Promise<R> => {
    return queryAppState(appState, timeTravelSnapshotIndex, query);
  };

  const executeQueries = async <TQueries extends AppQueries>(queries: TQueries) => {
    return mapValues(
      queries,
      query => queryAppState(appState, timeTravelSnapshotIndex, query)
    ) as AppQueriesResult<TQueries>;
  };

  const subscriptions = new BackendSubscriptions(executeQueries);

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
    executeQuery,
    executeQueries,
    sendRequest,
    subscribe: subscriptions.subscribe,
    subscribeStatus: subscriptions.subscribeConnectionStatus,
    subscribeQueries: subscriptions.subscribeQueries,
    subscribeTimeTravel: subscriptions.subscribeTimeTravel,
    setTimeTravelSnapshotIndex,
  };
}
