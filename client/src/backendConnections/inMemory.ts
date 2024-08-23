import { uuidv7 } from "uuidv7";

import { AppState, applyAppUpdate } from "hornbeam-common/src/app";
import { AppUpdate, AppRequest } from "hornbeam-common/src/app/snapshots";
import { queryAppState } from "hornbeam-common/src/appStateToQueryFunction";
import { BackendConnection, BackendSubscriptions } from ".";
import { last } from "lodash";

export function connectInMemory(initialState: AppState): BackendConnection {
  let appState = initialState;
  const subscriptions = new BackendSubscriptions();
  const timeTravelSnapshotIndex: number | null = null;

  const sendRequest = async (request: AppRequest) => {
    const update: AppUpdate = {
      request,
      updateId: uuidv7(),
    };

    appState = applyAppUpdate(appState, update);
    subscriptions.setLastUpdateId(last(appState.updateIds) ?? null);
  };

  // TODO: remove time travel duplication with simpleSync
  // TODO: restore time travel

  subscriptions.setLastUpdateId(last(appState.updateIds) ?? null);

  return {
    close: () => {},
    query: query => queryAppState(appState, timeTravelSnapshotIndex, query),
    sendRequest,
    subscribe: subscriptions.subscribe,
    timeTravel: null,
    // timeTravel: {
    //   maxSnapshotIndex: appState.latestSnapshotIndex(),
    //   snapshotIndex: timeTravelSnapshotIndex,
    //   setSnapshotIndex: newSnapshotIndex => setTimeTravelSnapshotIndex(newSnapshotIndex),
    //   start: () => setTimeTravelSnapshotIndex(appState.latestSnapshotIndex()),
    //   stop: () => setTimeTravelSnapshotIndex(null),
    // },
  };
}
