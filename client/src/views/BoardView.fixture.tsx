import { initialAppState } from "hornbeam-common/lib/app";
import { connectInMemory } from "../backendConnections/inMemory";
import BackendConnect from "./BackendConnect";
import BoardView from "./BoardView";

function connect() {
  return connectInMemory(initialAppState());
}

export default function BoardViewFixture() {
  return (
    <BackendConnect connect={connect}>
      {backendConnection => (
        <div style={{height: "100vh", width: "100vw", margin: -20}}>
          <BoardView backendConnection={backendConnection} />
        </div>
      )}
    </BackendConnect>
  );
}
