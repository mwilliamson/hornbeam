import React, { useContext } from "react";

import { AppRequest } from "hornbeam-common/src/app/snapshots";
import { AppQuery } from "hornbeam-common/src/queries";
import { uuidv7 } from "uuidv7";

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

export interface BackendSubscriber {
  onLastUpdateId: (lastUpdateId: string | null) => void;
}

export interface BackendSubscription {
  close: () => void;
}

export class BackendSubscriptions {
  private readonly subscriptions: Map<string, BackendSubscriber>;
  private lastUpdateId: string | null | undefined;

  public constructor() {
    this.subscriptions = new Map();
    this.lastUpdateId = undefined;
  }

  public subscribe = (subscriber: BackendSubscriber) => {
    // TODO: could use a simpler key
    const subscriptionId = uuidv7();
    this.subscriptions.set(subscriptionId, subscriber);

    if (this.lastUpdateId !== undefined) {
      subscriber.onLastUpdateId(this.lastUpdateId);
    }

    return {
      close: () => {
        this.subscriptions.delete(subscriptionId);
      },
    };
  };

  public setLastUpdateId = (lastUpdateId: string | null) => {
    this.lastUpdateId = lastUpdateId;

    for (const subscriber of this.subscriptions.values()) {
      subscriber.onLastUpdateId(lastUpdateId);
    }
  };
}

export interface BackendConnection {
  sendRequest: SendRequest;
  query: <R>(query: AppQuery<R>) => Promise<R>;
  subscribe: (subscriber: BackendSubscriber) => BackendSubscription;
  timeTravel: TimeTravel | null;
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
