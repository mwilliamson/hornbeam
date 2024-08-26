import { useEffect, useState } from "react";
import { BackendConnection, BackendConnectionProvider, BackendConnectionState } from "../backendConnections";
import { assertNeverWithDefault } from "hornbeam-common/lib/util/assertNever";

interface BackendConnectProps {
  connect: () => BackendConnection;
  children: (connection: BackendConnection) => React.ReactNode;
}

export default function BackendConnect(props: BackendConnectProps) {
  const {connect, children} = props;

  const [connectionState, setConnectionState] = useState<BackendConnectionState>({type: "connecting"});

  useEffect(() => {
    const connection = connect();

    connection.subscribeStatus(status => {
      switch (status.type) {
        case "unconnected":
          setConnectionState({type: "connecting"});
          return;
        case "connected":
          setConnectionState({
            type: "connected",
            connection,
          });
          return;
        case "connection-error":
          setConnectionState({type: "connection-error"});
          return;
        case "sync-error":
          setConnectionState({type: "sync-error"});
          return;
        default:
          assertNeverWithDefault(status, null);
          return;
      }
    });

    return () => {
      connection.close();
    };
  }, [connect]);

  return (
    <BackendConnectionStateView
      connectionState={connectionState}
    >
      {children}
    </BackendConnectionStateView>
  );
}

interface BackendConnectionStateViewProps {
  connectionState: BackendConnectionState;
  children: (connection: BackendConnection) => React.ReactNode;
}

function BackendConnectionStateView(props: BackendConnectionStateViewProps) {
  const {connectionState, children} = props;

  switch (connectionState.type) {
    case "connecting":
      return (
        <p>Connecting...</p>
      );
    case "connected":
      return (
        <BackendConnectionProvider value={connectionState.connection}>
          {children(connectionState.connection)}
        </BackendConnectionProvider>
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
