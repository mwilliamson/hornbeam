import { assertThat, containsExactly, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { BackendConnection } from ".";
import { AppRequest, requests } from "hornbeam-common/lib/app/snapshots";
import { presetColors, presetColorWhite } from "hornbeam-common/lib/app/colors";
import { Instant } from "@js-joda/core";
import { uuidv7 } from "uuidv7";
import { allCategoriesQuery, allColorsQuery, availableCategoriesQuery, boardCardTreesQuery, cardChildCountQuery, cardQuery, parentCardQuery } from "hornbeam-common/lib/queries";
import { CategoryAddRequest } from "hornbeam-common/lib/app/categories";
import { createDeferred } from "hornbeam-common/lib/util/promises";
import { CardAddRequest } from "hornbeam-common/lib/app/cards";
import { rootBoardId } from "hornbeam-common/lib/app/boards";
import { allCardStatuses } from "hornbeam-common/lib/app/cardStatuses";

export function createBackendConnectionTestSuite(
  name: string,
  createBackendConnection: () => Promise<[BackendConnection, () => Promise<void>]>,
): void {
  suite(name, () => {
    suite("queries", () => {
      suite("card", () => {
        testBackendConnection("unrecognised ID returns null", async (backendConnection) => {
          const card = await backendConnection.executeQuery(cardQuery(uuidv7()));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("can find card by ID", async (backendConnection) => {
          const categoryId = uuidv7();
          await backendConnection.sendRequest(testRequests.categoryAdd({
            id: categoryId,
          }));

          const card1Id = uuidv7();
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: card1Id,
            text: "<card text 1>",
          }));

          const card2Id = uuidv7();
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: card2Id,
            text: "<card text 2>",
          }));

          const card = await backendConnection.executeQuery(cardQuery(card2Id));

          assertThat(card, hasProperties({text: "<card text 2>"}));
        });
      });

      suite("parentCard", () => {
        testBackendConnection("unrecognised ID returns null", async (backendConnection) => {
          const card = await backendConnection.executeQuery(parentCardQuery(uuidv7()));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("card has no parent", async (backendConnection) => {
          const categoryId = uuidv7();
          await backendConnection.sendRequest(testRequests.categoryAdd({
            id: categoryId,
          }));

          const card1Id = uuidv7();
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: card1Id,
            parentCardId: null,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery(card1Id));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("card has parent", async (backendConnection) => {
          const categoryId = uuidv7();
          await backendConnection.sendRequest(testRequests.categoryAdd({
            id: categoryId,
            name: "<category name 1>",
          }));

          const parentCardId = uuidv7();
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: parentCardId,
            parentCardId: null,
            text: "<parent card text>",
          }));

          const card1Id = uuidv7();
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: card1Id,
            parentCardId,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery(card1Id));

          assertThat(card, hasProperties({text: "<parent card text>"}));
        });
      });

      suite("cardChildCount", () => {
        testBackendConnection("unrecognised ID returns 0", async (backendConnection) => {
          const card = await backendConnection.executeQuery(cardChildCountQuery(uuidv7()));

          assertThat(card, equalTo(0));
        });

        testBackendConnection("card with no children", async (backendConnection) => {
          const categoryId = uuidv7();
          await backendConnection.sendRequest(testRequests.categoryAdd({
            id: categoryId,
          }));

          const card1Id = uuidv7();
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: card1Id,
            parentCardId: null,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery(card1Id));

          assertThat(card, equalTo(0));
        });

        testBackendConnection("card with children", async (backendConnection) => {
          const categoryId = uuidv7();
          await backendConnection.sendRequest(testRequests.categoryAdd({
            id: categoryId,
            name: "<category name 1>",
          }));

          const parentCardId = uuidv7();
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: parentCardId,
            parentCardId: null,
            text: "<parent card text>",
          }));

          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: uuidv7(),
            parentCardId,
          }));
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: uuidv7(),
            parentCardId,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery(parentCardId));

          assertThat(card, equalTo(2));
        });
      });

      suite("boardCardTrees", () => {
        testBackendConnection("root board", async (backendConnection) => {
          const categoryId = uuidv7();
          await backendConnection.sendRequest(testRequests.categoryAdd({
            id: categoryId,
            name: "<category name 1>",
          }));

          const parentCardId = uuidv7();
          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: parentCardId,
            parentCardId: null,
            text: "<parent card text>",
          }));

          await backendConnection.sendRequest(testRequests.cardAdd({
            categoryId,
            id: uuidv7(),
            parentCardId,
            text: "<child card text>",
          }));

          const boardCardTrees = await backendConnection.executeQuery(boardCardTreesQuery({
            boardId: rootBoardId,
            cardStatuses: new Set(allCardStatuses),
          }));

          assertThat(boardCardTrees, containsExactly(
            hasProperties({
              card: hasProperties({
                text: "<parent card text>",
              }),
              children: containsExactly(
                hasProperties({
                  card: hasProperties({
                    text: "<child card text>",
                  }),
                  children: containsExactly(),
                }),
              ),
            }),
          ));
        });
      });

      testBackendConnection("allCategories", async (backendConnection) => {
        await backendConnection.sendRequest(testRequests.categoryAdd({
          name: "<category name 1>",
        }));
        await backendConnection.sendRequest(testRequests.categoryAdd({
          name: "<category name 2>",
        }));

        const allCategories = await backendConnection.executeQuery(allCategoriesQuery);

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

        const availableCategories = await backendConnection.executeQuery(availableCategoriesQuery);

        assertThat(availableCategories, containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
      });

      testBackendConnection("allColors", async (backendConnection) => {
        const allColors = await backendConnection.executeQuery(allColorsQuery);

        assertThat(allColors.allPresetColors(), containsExactly(
          ...presetColors.map(presetColor => hasProperties({name: presetColor.name}))
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

          const subscription = backendConnection.subscribeStatus(status => {
            switch (status.type) {
              case "connected":
                connected.resolve();
                return;
              case "connection-error":
                connected.reject(new Error("connection error"));
                return;
              case "sync-error":
                connected.reject(new Error("sync error"));
                return;
              case "unconnected":
                break;
            }
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

const defaultCreatedAt = Instant.ofEpochSecond(1724429942);

const testRequests = {
  cardAdd: (request: Partial<CardAddRequest>): AppRequest => {
    return requests.cardAdd({
      categoryId: uuidv7(),
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      parentCardId: null,
      text: "<default test text>",
      ...request,
    });
  },

  categoryAdd: (request: Partial<CategoryAddRequest>): AppRequest => {
    return requests.categoryAdd({
      color: {presetColorId: presetColorWhite.id},
      createdAt: defaultCreatedAt,
      id: uuidv7(),
      name: "<default test name>",
      ...request,
    });
  },
};
