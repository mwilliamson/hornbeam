import { assertThat, containsExactly, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { BackendConnection } from ".";
import { AppRequest, requests } from "hornbeam-common/lib/app/snapshots";
import { presetColorWhite } from "hornbeam-common/lib/app/colors";
import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { allCategoriesQuery } from "hornbeam-common/lib/queries";
import { CategoryAddRequest } from "hornbeam-common/lib/app/categories";

export function createBackendConnectionTestSuite(
  name: string,
  createBackendConnection: () => Promise<[BackendConnection, () => Promise<void>]>,
): void {
  function testBackendConnection(
    name: string,
    f: (backendConnection: BackendConnection) => Promise<void>,
  ) {
    test(name, async () => {
      const [backendConnection, tearDown] = await createBackendConnection();

      try {
        try {
          await f(backendConnection);
        } finally {
          backendConnection.close();
        }
      } finally {
        await tearDown();
      }
    });
  }

  suite(name, () => {
    suite("queries", () => {
      testBackendConnection("can fetch all categories", async (backendConnection) => {
        await backendConnection.sendRequest(testRequests.categoryAdd({
          name: "<category name 1>",
        }));
        await backendConnection.sendRequest(testRequests.categoryAdd({
          name: "<category name 2>",
        }));

        const allCategories = await backendConnection.query(allCategoriesQuery);

        assertThat(allCategories.allCategories(), containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
      });
    });
  });
}

const testRequests = {
  categoryAdd: (request: Partial<CategoryAddRequest>): AppRequest => {
    return requests.categoryAdd({
      color: {presetColorId: presetColorWhite.id},
      createdAt: Instant.ofEpochSecond(1724429942),
      id: uuidv7(),
      name: "<default test name>",
      ...request,
    });
  },
};
