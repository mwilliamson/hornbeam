import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "hornbeam-common/src/app";
import { AppUpdate, AppRequest } from "hornbeam-common/src/app/snapshots";
import { queryAppState } from "hornbeam-common/src/appStateToQueryFunction";
import { BackendConnection, BackendSubscriptions } from ".";
import { last } from "lodash";

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
    query: query => queryAppState(appState, timeTravelSnapshotIndex, query),
    sendRequest,
    subscribe: subscriptions.subscribe,
    setTimeTravelSnapshotIndex,
  };
}
