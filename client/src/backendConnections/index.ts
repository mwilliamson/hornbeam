import React, { useContext } from "react";

import { AppRequest } from "hornbeam-common/lib/app/snapshots";
import { AppQuery } from "hornbeam-common/lib/queries";

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

export interface BackendSubscription {
  close: () => void;
}

let nextSubscriptionId = 1;

export class BackendSubscriptions {
  private readonly subscriptions: Map<number, BackendSubscriber>;
  private lastUpdate: OnUpdateArgs | null;
  private timeTravelSnapshotIndex: number | null;

  public constructor() {
    this.subscriptions = new Map();
    this.lastUpdate = null;
    this.timeTravelSnapshotIndex = null;
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

  public onLastUpdate = (lastUpdate: OnUpdateArgs) => {
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
    this.timeTravelSnapshotIndex = newSnapshotIndex;
    for (const subscriber of this.subscriptions.values()) {
      subscriber.onTimeTravel(newSnapshotIndex);
    }
  };

  public onConnectionError = () => {
    this.lastUpdate = null;
    for (const subscriber of this.subscriptions.values()) {
      subscriber.onConnectionError();
    }
  };

  public onSyncError = () => {
    this.lastUpdate = null;
    for (const subscriber of this.subscriptions.values()) {
      subscriber.onSyncError();
    }
  };
}

export interface BackendConnection {
  close: () => void;
  sendRequest: SendRequest;
  query: <R>(query: AppQuery<R>) => Promise<R>;
  subscribe: (subscriber: BackendSubscriber) => BackendSubscription;
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
