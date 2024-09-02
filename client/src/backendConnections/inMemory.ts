import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "hornbeam-common/lib/app";
import { AppUpdate, ProjectContentsMutation } from "hornbeam-common/lib/app/snapshots";
import { queryAppState } from "hornbeam-common/lib/appStateToQueryFunction";
import { BackendConnection, BackendSubscriptions } from ".";
import { mapValues } from "lodash";
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
      snapshotIndex: appState.latestSnapshotIndex(),
    };
  };

  const mutate = async (mutation: ProjectContentsMutation) => {
    const update: AppUpdate = {
      mutation,
      updateId: uuidv7(),
    };

    appState = applyAppUpdate(appState, update);
    await subscriptions.onLastUpdate(generateLastUpdate());
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
    mutate,
    subscribeStatus: subscriptions.subscribeConnectionStatus,
    subscribeQueries: subscriptions.subscribeQueries,
    subscribeTimeTravel: subscriptions.subscribeTimeTravel,
    setTimeTravelSnapshotIndex,
  };
}
