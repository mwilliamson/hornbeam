import React from "react";
import ReactDOM from "react-dom/client";

import BoardView from "./views/BoardView";
import { ConnectSimpleSync } from "./backendConnections/simpleSync";
import { BackendConnectionState } from "./backendConnections";

function webSocketUri() {
  const location = window.location;
  const webSocketProtocol = location.protocol === "https:" ? "wss" : "ws";

  let path = new URLSearchParams(location.search).get("path") || "ws";
  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  return `${webSocketProtocol}://${location.host}/${path}`;
}

function Client() {
  return (
    <ConnectSimpleSync uri={webSocketUri()}>
      {(connectionState) => (
        <BackendConnectionStateView
          connectionState={connectionState}
        />
      )}
    </ConnectSimpleSync>
  );
}

interface BackendConnectionStateViewProps {
  connectionState: BackendConnectionState;
}

function BackendConnectionStateView(props: BackendConnectionStateViewProps) {
  const {connectionState} = props;

  switch (connectionState.type) {
    case "connecting":
      return (
        <p>Connecting...</p>
      );
    case "connected":
      return (
        <BoardView backendConnection={connectionState.connection} />
      );
    case "connection-error":
      return (
        <p>Connection error, please reload the page.</p>
      );
    case "sync-error":
      return (
        <p>Synchronisation error, please reload the page.</p>
      );
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Client />
  </React.StrictMode>,
);
