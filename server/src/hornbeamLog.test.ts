import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "mocha";
import { fileSuite } from "./testing";
import { fixtureDatabase } from "./repositories/fixtures";
import { deserializeAppUpdate } from "hornbeam-common/lib/serialization/app";
import { App } from "./app";

fileSuite(__filename, () => {
  test("can import hornbeam.log", async () => {
    const database = await fixtureDatabase();
    const app = new App(database);
    const eventLogFile = await fs.open(path.join(__dirname, "../../hornbeam.log"), "r");
    for await (const line of eventLogFile.readLines({encoding: "utf-8", start: 0, autoClose: true})) {
      const message = JSON.parse(line);
      const appUpdate = deserializeAppUpdate(message.payload);
      // TODO: add support for all mutations
      if (appUpdate.mutation.type !== "cardMove") {
        await app.transaction(async transaction => {
          await transaction.mutate(appUpdate.mutation);
        });
      }
    }

    const categories = await app.transaction(async transaction => {
      const result = await transaction.query([{type: "allCategories"}]);
      return result.queryResults[0] as ReadonlyArray<unknown>;
    });

    assert.ok(categories.length >= 6);
  });
});
