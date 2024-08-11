import { initialAppState } from "../app";
import { ConnectInMemory } from "../backendConnections/inMemory";
import AppView from "./AppView";

export default function AppViewFixture() {
  return (
    <ConnectInMemory initialState={initialAppState}>
      {backendConnection => (
        <div style={{height: "100vh", width: "100vw", margin: -20}}>
          <AppView backendConnection={backendConnection} />
        </div>
      )}
    </ConnectInMemory>
  );
}
