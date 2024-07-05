import React, { useContext } from "react";

import { AppState } from "../app";
import { AppRequest } from "../app/snapshots";

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

export interface BackendConnection {
  appState: AppState;
  sendRequest: SendRequest;
}

export type SendRequest = (update: AppRequest) => Promise<void>;

export const BackendConnectionContext = React.createContext<BackendConnection | null>(null);

export function useSendRequest(): SendRequest {
  const backendConnection = useContext(BackendConnectionContext);

  if (backendConnection === null) {
    throw new Error("Backend connection has not been set up.");
  }

  return backendConnection.sendRequest;
}
