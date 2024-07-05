import { AppState } from "../app";
import { Request } from "../app/snapshots";

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
  sendRequest: (update: Request) => Promise<void>;
}
