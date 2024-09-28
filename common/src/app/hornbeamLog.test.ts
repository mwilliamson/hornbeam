import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "mocha";
import { applyAppUpdate, initialAppState } from ".";
import { deserializeAppUpdate } from "../serialization/app";

test("hornbeam.log is valid", async () => {
  let appState = initialAppState();
  const eventLogFile = await fs.open(path.join(__dirname, "../../../hornbeam.log"), "r");
  for await (const line of eventLogFile.readLines({encoding: "utf-8", start: 0, autoClose: true})) {
    const message = JSON.parse(line);
    const appUpdate = deserializeAppUpdate(message.payload);
    appState = applyAppUpdate(appState, appUpdate);
  }

  assert.ok(appState.latestSnapshot().fetchProjectContents().allCards().length > 20);
});
