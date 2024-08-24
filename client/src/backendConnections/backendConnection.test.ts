import { assertThat, containsExactly, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { BackendConnection } from ".";
import { AppRequest, requests } from "hornbeam-common/lib/app/snapshots";
import { presetColorWhite } from "hornbeam-common/lib/app/colors";
import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { allCategoriesQuery, availableCategoriesQuery } from "hornbeam-common/lib/queries";
import { CategoryAddRequest } from "hornbeam-common/lib/app/categories";
import { createDeferred } from "hornbeam-common/lib/util/promises";

export function createBackendConnectionTestSuite(
  name: string,
  createBackendConnection: () => Promise<[BackendConnection, () => Promise<void>]>,
): void {
  suite(name, () => {
    suite("queries", () => {
      testBackendConnection("allCategories", async (backendConnection) => {
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

      testBackendConnection("availableCategories", async (backendConnection) => {
        await backendConnection.sendRequest(testRequests.categoryAdd({
          name: "<category name 1>",
        }));
        await backendConnection.sendRequest(testRequests.categoryAdd({
          name: "<category name 2>",
        }));

        const availableCategories = await backendConnection.query(availableCategoriesQuery);

        assertThat(availableCategories, containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
      });
    });
  });

  function testBackendConnection(
    name: string,
    f: (backendConnection: BackendConnection) => Promise<void>,
  ) {
    test(name, async () => {
      const [backendConnection, tearDown] = await createBackendConnection();

      try {
        try {
          const connected = createDeferred<void>();

          const subscription = backendConnection.subscribe({
            onConnect: () => {
              connected.resolve();
            },
            onConnectionError: () => {
              connected.reject(new Error("connection error"));
            },
            onSyncError: () => {
              connected.reject(new Error("sync error"));
            },
            onUpdate: () => {},
            onTimeTravel: () => {},
          });

          await connected.promise;

          subscription.close();

          await f(backendConnection);
        } finally {
          backendConnection.close();
        }
      } finally {
        await tearDown();
      }
    });
  }
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
