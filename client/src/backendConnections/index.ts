import React, { useContext } from "react";

import { AppRequest } from "../app/snapshots";
import { AppQuery } from "./queries";

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

export interface BackendConnection {
  sendRequest: SendRequest;
  query: <R>(query: AppQuery<R>) => Promise<R>;
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
