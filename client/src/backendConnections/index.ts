import React, { useContext } from "react";

import { AppMutation } from "hornbeam-common/lib/app/snapshots";
import { AppQuery, AppQueries, AppQueriesResult } from "hornbeam-common/lib/queries";

export type BackendConnectionState =
  | {
    type: "connecting";
  }
  | {
    type: "connected";
    connection: BackendConnection;
  }
  | {
    type: "connection-error";
  }
  | {
    type: "sync-error";
  };

export interface TimeTravel {
  maxSnapshotIndex: number;
  snapshotIndex: number | null;
  setSnapshotIndex: (timeTravelSnapshotIndex: number) => void;
  start: () => void;
  stop: () => void;
}

interface OnUpdateArgs {
  snapshotIndex: number;
}

type BackendConnectionStatusSubscriber = (status: BackendConnectionStatus) => void;

type BackendConnectionStatus =
  | {type: "unconnected"}
  | {type: "connected"}
  | {type: "connection-error"}
  | {type: "sync-error"};

interface AppQueriesSubscriber<TQueries extends AppQueries> {
  readonly onSuccess: (result: AppQueriesResult<TQueries>) => void;
  readonly onError: (error: unknown) => void;
}

interface AppQueriesSubscription {
  readonly queries: AppQueries;
  readonly subscriber: AppQueriesSubscriber<never>;
}

interface TimeTravelSubscriber {
  onMaxSnapshotIndex: (maxSnapshotIndex: number) => void;
  onTimeTravel: (newSnapshotIndex: number | null) => void;
}

export interface BackendSubscription {
  close: () => void;
}

let nextSubscriptionId = 1;

export class BackendSubscriptions {
  private connectionStatus: BackendConnectionStatus;
  private readonly connectionStatusSubscriptions: Map<number, BackendConnectionStatusSubscriber>;

  private readonly executeQueries: ExecuteQueries;
  private readonly queriesSubscriptions: Map<number, AppQueriesSubscription>;

  private lastUpdate: OnUpdateArgs | null;
  private timeTravelSnapshotIndex: number | null;
  private readonly timeTravelSubscriptions: Map<number, TimeTravelSubscriber>;

  public constructor(executeQueries: ExecuteQueries) {
    this.connectionStatus = {type: "unconnected"};
    this.connectionStatusSubscriptions = new Map();

    this.executeQueries = executeQueries;
    this.queriesSubscriptions = new Map();

    this.lastUpdate = null;
    this.timeTravelSnapshotIndex = null;
    this.timeTravelSubscriptions = new Map();
  }

  public subscribeConnectionStatus = (subscriber: BackendConnectionStatusSubscriber) => {
    const subscriptionId = nextSubscriptionId++;
    this.connectionStatusSubscriptions.set(subscriptionId, subscriber);

    subscriber(this.connectionStatus);

    return {
      close: () => {
        this.connectionStatusSubscriptions.delete(subscriptionId);
      },
    };
  };

  public subscribeQueries = <TQueries extends AppQueries>(
    queries: TQueries,
    subscriber: AppQueriesSubscriber<TQueries>,
  ) => {
    // TODO: track (and cache) which queries have already been executed
    const subscriptionId = nextSubscriptionId++;

    const querySubscription: AppQueriesSubscription = {
      queries,
      subscriber,
    };

    if (this.connectionStatus.type === "connected") {
      this.loadQueriesSubscriptions([querySubscription]);
    }

    this.queriesSubscriptions.set(subscriptionId, querySubscription);

    return {
      close: () => {
        this.queriesSubscriptions.delete(subscriptionId);
      },
    };
  };

  public subscribeTimeTravel = (subscriber: TimeTravelSubscriber) => {
    const subscriptionId = nextSubscriptionId++;

    this.timeTravelSubscriptions.set(subscriptionId, subscriber);

    if (this.lastUpdate !== null) {
      subscriber.onMaxSnapshotIndex(this.lastUpdate.snapshotIndex);
    }

    subscriber.onTimeTravel(this.timeTravelSnapshotIndex);

    return {
      close: () => {
        this.timeTravelSubscriptions.delete(subscriptionId);
      }
    };
  };

  public onLastUpdate = async (lastUpdate: OnUpdateArgs) => {
    this.lastUpdate = lastUpdate;

    if (this.connectionStatus.type !== "connected") {
      this.updateConnectionStatus({type: "connected"});
    }

    for (const subscriber of this.timeTravelSubscriptions.values()) {
      subscriber.onMaxSnapshotIndex(lastUpdate.snapshotIndex);
    }

    await this.loadQueriesSubscriptions(Array.from(this.queriesSubscriptions.values()));
  };

  public onTimeTravel = (newSnapshotIndex: number | null) => {
    this.loadQueriesSubscriptions(Array.from(this.queriesSubscriptions.values()));

    for (const subscriber of this.timeTravelSubscriptions.values()) {
      subscriber.onTimeTravel(newSnapshotIndex);
    }
  };

  public onConnectionError = () => {
    this.lastUpdate = null;
    this.updateConnectionStatus({type: "connection-error"});
  };

  public onSyncError = () => {
    this.lastUpdate = null;
    this.updateConnectionStatus({type: "sync-error"});
  };

  private updateConnectionStatus = (newConnectionStatus: BackendConnectionStatus): void => {
    this.connectionStatus = newConnectionStatus;
    for (const subscriber of this.connectionStatusSubscriptions.values()) {
      subscriber(this.connectionStatus);
    }
  };

  private loadQueriesSubscriptions(subscriptions: ReadonlyArray<AppQueriesSubscription>) {
    if (this.lastUpdate === null) {
      return;
    }

    const combinedQueries: AppQueries = {};
    let queryIndex = 0;
    for (const subscription of subscriptions) {
      for (const query of Object.values(subscription.queries)) {
        combinedQueries[queryIndex++] = query;
      }
    }

    const lastUpdateAtQueryTime = this.lastUpdate;
    const isStale = () =>
      this.lastUpdate === null || lastUpdateAtQueryTime.snapshotIndex !== this.lastUpdate.snapshotIndex;

    this.executeQueries(combinedQueries).then(
      result => {
        if (!isStale()) {
          queryIndex = 0;
          for (const subscription of subscriptions) {
            const subscriptionResult: {[key: string]: unknown} = {};
            for (const key of Object.keys(subscription.queries)) {
              subscriptionResult[key] = result[queryIndex++];
            }
            subscription.subscriber.onSuccess(subscriptionResult as never);
          }
        }
      },
      error => {
        if (!isStale()) {
          for (const subscription of subscriptions) {
            subscription.subscriber.onError(error);
          }
        }
      },
    );
  }
}

export type ExecuteQueries = <TQueries extends AppQueries>(
  queries: TQueries,
) => Promise<AppQueriesResult<TQueries>>;

export interface BackendConnection {
  close: () => void;
  mutate: Mutate;
  executeQuery: <R>(query: AppQuery<R>) => Promise<R>;
  executeQueries: ExecuteQueries;
  subscribeStatus: (subscriber: BackendConnectionStatusSubscriber) => BackendSubscription;
  subscribeQueries: <TQueries extends AppQueries>(
    queries: TQueries,
    subscriber: AppQueriesSubscriber<TQueries>,
  ) => BackendSubscription;
  subscribeTimeTravel: (subscriber: TimeTravelSubscriber) => BackendSubscription;
  setTimeTravelSnapshotIndex: ((newSnapshotIndex: number | null) => void) | null;
}

export type Mutate = (mutation: AppMutation) => Promise<void>;

const BackendConnectionContext = React.createContext<BackendConnection | null>(null);

export const BackendConnectionProvider = BackendConnectionContext.Provider;

export function useBackendConnection(): BackendConnection {
  const backendConnection = useContext(BackendConnectionContext);

  if (backendConnection === null) {
    throw new Error("Backend connection has not been set up.");
  }

  return backendConnection;
}
