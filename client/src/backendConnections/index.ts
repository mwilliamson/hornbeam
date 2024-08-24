import React, { useContext } from "react";

import { AppRequest } from "hornbeam-common/lib/app/snapshots";
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
  onSuccess: (result: AppQueriesResult<TQueries>) => void;
  onError: (error: unknown) => void;
}

interface AppQueriesSubscription {
  execute: () => void;
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
  private readonly executeQueries: ExecuteQueries;
  private readonly connectionStatusSubscriptions: Map<number, BackendConnectionStatusSubscriber>;
  private readonly queriesSubscriptions: Map<number, AppQueriesSubscription>;
  private connectionStatus: BackendConnectionStatus;
  private lastUpdate: OnUpdateArgs | null;
  private readonly timeTravelSubscriptions: Map<number, TimeTravelSubscriber>;
  private timeTravelSnapshotIndex: number | null;

  public constructor(executeQueries: ExecuteQueries) {
    this.executeQueries = executeQueries;
    this.connectionStatusSubscriptions = new Map();
    this.queriesSubscriptions = new Map();
    this.timeTravelSubscriptions = new Map();
    this.connectionStatus = {type: "unconnected"};
    this.lastUpdate = null;
    this.timeTravelSnapshotIndex = null;
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

    let currentLoadId: number | null = null;

    const execute = () => {
      const loadId = nextLoadId++;
      currentLoadId = loadId;

      this.executeQueries(queries).then(
        result => {
          if (loadId === currentLoadId) {
            subscriber.onSuccess(result);
          }
        },
        error => {
          if (loadId === currentLoadId) {
            subscriber.onError(error);
          }
        },
      );
    };

    if (this.connectionStatus.type === "connected") {
      execute();
    }

    this.queriesSubscriptions.set(subscriptionId, {
      execute,
    });

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

  public onLastUpdate = (lastUpdate: OnUpdateArgs) => {
    if (this.connectionStatus.type !== "connected") {
      this.updateConnectionStatus({type: "connected"});
    }

    for (const subscriber of this.queriesSubscriptions.values()) {
      subscriber.execute();
    }

    for (const subscriber of this.timeTravelSubscriptions.values()) {
      subscriber.onMaxSnapshotIndex(lastUpdate.snapshotIndex);
    }

    this.lastUpdate = lastUpdate;
  };

  public onTimeTravel = (newSnapshotIndex: number | null) => {
    for (const subscriber of this.queriesSubscriptions.values()) {
      subscriber.execute();
    }

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
}

let nextLoadId = 1;

export type ExecuteQueries = <TQueries extends AppQueries>(
  queries: TQueries,
) => Promise<AppQueriesResult<TQueries>>;

export interface BackendConnection {
  close: () => void;
  sendRequest: SendRequest;
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

export type SendRequest = (update: AppRequest) => Promise<void>;

const BackendConnectionContext = React.createContext<BackendConnection | null>(null);

export const BackendConnectionProvider = BackendConnectionContext.Provider;

export function useBackendConnection(): BackendConnection {
  const backendConnection = useContext(BackendConnectionContext);

  if (backendConnection === null) {
    throw new Error("Backend connection has not been set up.");
  }

  return backendConnection;
}

export function useSendRequest(): SendRequest {
  const backendConnection = useBackendConnection();

  return backendConnection.sendRequest;
}
