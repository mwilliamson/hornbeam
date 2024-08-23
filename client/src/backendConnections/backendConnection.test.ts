import { assertThat, containsExactly, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { BackendConnection } from ".";
import { requests } from "hornbeam-common/lib/app/snapshots";
import { presetColorWhite } from "hornbeam-common/lib/app/colors";
import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { allCategoriesQuery } from "hornbeam-common/lib/queries";

export function createBackendConnectionTestSuite(
  name: string,
  createBackendConnection: () => BackendConnection,
): void {
  suite(name, () => {
    suite("queries", () => {
      test("can fetch all categories", async () => {
        const backendConnection = createBackendConnection();
        await backendConnection.sendRequest(requests.categoryAdd({
          color: {presetColorId: presetColorWhite.id},
          createdAt: Instant.ofEpochSecond(1724429942),
          id: uuidv7(),
          name: "<category name 1>",
        }));
        await backendConnection.sendRequest(requests.categoryAdd({
          color: {presetColorId: presetColorWhite.id},
          createdAt: Instant.ofEpochSecond(1724429942),
          id: uuidv7(),
          name: "<category name 2>",
        }));

        const allCategories = await backendConnection.query(allCategoriesQuery);

        assertThat(allCategories.allCategories(), containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
        backendConnection.close();
      });
    });
  });
}
