import { initialAppState } from "hornbeam-common/src/app";
import { ConnectInMemory } from "../backendConnections/inMemory";
import BoardView from "./BoardView";

export default function BoardViewFixture() {
  return (
    <ConnectInMemory initialState={initialAppState}>
      {backendConnection => (
        <div style={{height: "100vh", width: "100vw", margin: -20}}>
          <BoardView backendConnection={backendConnection} />
        </div>
      )}
    </ConnectInMemory>
  );
}
