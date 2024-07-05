import { initialAppState } from "../app";
import { useInMemoryBackend } from "../backendConnections/inMemory";
import AppView from "./AppView";

export default function AppViewFixture() {
  const backendConnection = useInMemoryBackend(initialAppState);

  return (
    <div style={{height: "100vh", width: "100vw", margin: -20}}>
      <AppView backendConnection={backendConnection} />
    </div>
  );
}
