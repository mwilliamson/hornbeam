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
  updateId: string | null;
  snapshotIndex: number;
}

export interface BackendSubscriber {
  onConnect: (lastUpdate: OnUpdateArgs) => void;
  onUpdate: (update: OnUpdateArgs) => void;
  onTimeTravel: (newSnapshotIndex: number | null) => void;
  onConnectionError: () => void;
  onSyncError: () => void;
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

export interface BackendSubscription {
  close: () => void;
}

let nextSubscriptionId = 1;

export class BackendSubscriptions {
  private readonly executeQueries: ExecuteQueries;
  private readonly subscriptions: Map<number, BackendSubscriber>;
  private readonly connectionStatusSubscriptions: Map<number, BackendConnectionStatusSubscriber>;
  private readonly queriesSubscriptions: Map<number, AppQueriesSubscription>;
  private connectionStatus: BackendConnectionStatus;
  private lastUpdate: OnUpdateArgs | null;

  public constructor(executeQueries: ExecuteQueries) {
    this.executeQueries = executeQueries;
    this.subscriptions = new Map();
    this.connectionStatusSubscriptions = new Map();
    this.queriesSubscriptions = new Map();
    this.connectionStatus = {type: "unconnected"};
    this.lastUpdate = null;
  }

  public subscribe = (subscriber: BackendSubscriber) => {
    const subscriptionId = nextSubscriptionId++;
    this.subscriptions.set(subscriptionId, subscriber);

    if (this.lastUpdate !== null) {
      subscriber.onConnect(this.lastUpdate);
    }

    return {
      close: () => {
        this.subscriptions.delete(subscriptionId);
      },
    };
  };

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

  public onLastUpdate = (lastUpdate: OnUpdateArgs) => {
    if (this.connectionStatus.type !== "connected") {
      this.updateConnectionStatus({type: "connected"});
    }

    for (const subscriber of this.queriesSubscriptions.values()) {
      subscriber.execute();
    }

    for (const subscriber of this.subscriptions.values()) {
      if (this.lastUpdate === null) {
        subscriber.onConnect(lastUpdate);
      } else {
        subscriber.onUpdate(lastUpdate);
      }
    }

    this.lastUpdate = lastUpdate;
  };

  public onTimeTravel = (newSnapshotIndex: number | null) => {
    for (const subscriber of this.queriesSubscriptions.values()) {
      subscriber.execute();
    }

    for (const subscriber of this.subscriptions.values()) {
      subscriber.onTimeTravel(newSnapshotIndex);
    }
  };

  public onConnectionError = () => {
    this.lastUpdate = null;
    this.updateConnectionStatus({type: "connection-error"});
    for (const subscriber of this.subscriptions.values()) {
      subscriber.onConnectionError();
    }
    for (const subscriber of this.connectionStatusSubscriptions.values()) {
      subscriber(this.connectionStatus);
    }
  };

  public onSyncError = () => {
    this.updateConnectionStatus({type: "sync-error"});
    this.lastUpdate = null;
    for (const subscriber of this.subscriptions.values()) {
      subscriber.onSyncError();
    }
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
  subscribe: (subscriber: BackendSubscriber) => BackendSubscription;
  subscribeStatus: (subscriber: BackendConnectionStatusSubscriber) => BackendSubscription;
  subscribeQueries: <TQueries extends AppQueries>(
    queries: TQueries,
    subscriber: AppQueriesSubscriber<TQueries>,
  ) => BackendSubscription;
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
