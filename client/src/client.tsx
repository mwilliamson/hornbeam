import React from "react";
import ReactDOM from "react-dom/client";

import BoardView from "./views/BoardView";
import { ConnectServer } from "./backendConnections/server";

function Client() {
  return (
    <ConnectServer uri="/">
      {(connection) => (
        <BoardView
          backendConnection={connection}
        />
      )}
    </ConnectServer>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Client />
  </React.StrictMode>,
);
