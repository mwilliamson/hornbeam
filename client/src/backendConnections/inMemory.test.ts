import { initialAppState } from "hornbeam-common/lib/app";
import { createBackendConnectionTestSuite } from "./backendConnection.test";
import { connectInMemory } from "./inMemory";

createBackendConnectionTestSuite(
  "backendConnections/inMemory",
  () => connectInMemory(initialAppState()),
);
