import { assertThat, containsExactly, deepEqualTo, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { BackendConnection } from ".";
import { presetColors } from "hornbeam-common/lib/app/colors";
import { Instant } from "@js-joda/core";
import { allCategoriesQuery, allColorsQuery, availableCategoriesQuery, boardCardTreesQuery, cardChildCountQuery, cardHistoryQuery, cardQuery, parentBoardQuery, parentCardQuery, searchCardsQuery } from "hornbeam-common/lib/queries";
import { createDeferred } from "hornbeam-common/lib/util/promises";
import { cardSubboardId, rootBoardId } from "hornbeam-common/lib/app/boards";
import { allCardStatuses } from "hornbeam-common/lib/app/cardStatuses";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import { testingProjectContentsMutation } from "hornbeam-common/lib/app/snapshots.testing";

const CARD_1_ID = "0191beaa-0000-7507-9e6b-000000000001";
const CARD_2_ID = "0191beaa-0000-7507-9e6b-000000000002";
const CARD_3_ID = "0191beaa-0000-7507-9e6b-000000000003";
const CATEGORY_1_ID = "0191beaa-0001-7507-9e6b-000000000001";

export function createBackendConnectionTestSuite(
  name: string,
  createBackendConnection: () => Promise<[BackendConnection, () => Promise<void>]>,
): void {
  suite(name, () => {
    suite("queries", () => {
      suite("card", () => {
        testBackendConnection("unrecognised ID returns null", async (backendConnection) => {
          const card = await backendConnection.executeQuery(cardQuery(CARD_1_ID));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("can find card by ID", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            text: "<card text 1>",
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
            text: "<card text 2>",
          }));

          const card = await backendConnection.executeQuery(cardQuery(CARD_2_ID));

          assertThat(card, hasProperties({text: "<card text 2>"}));
        });
      });

      suite("parentCard", () => {
        testBackendConnection("unrecognised ID returns null", async (backendConnection) => {
          const card = await backendConnection.executeQuery(parentCardQuery(CARD_1_ID));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("card has no parent", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            parentCardId: null,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery(CARD_1_ID));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("card has parent", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
            name: "<category name 1>",
          }));

          const parentCardId = CARD_1_ID;
          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: parentCardId,
            parentCardId: null,
            text: "<parent card text>",
          }));

          const childCardId = CARD_2_ID;
          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: childCardId,
            parentCardId,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery(childCardId));

          assertThat(card, hasProperties({text: "<parent card text>"}));
        });
      });

      suite("cardChildCount", () => {
        testBackendConnection("unrecognised ID returns 0", async (backendConnection) => {
          const card = await backendConnection.executeQuery(cardChildCountQuery(CARD_1_ID));

          assertThat(card, equalTo(0));
        });

        testBackendConnection("card with no children", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            parentCardId: null,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery(CARD_1_ID));

          assertThat(card, equalTo(0));
        });

        testBackendConnection("card with children", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
            name: "<category name 1>",
          }));

          const parentCardId = CARD_1_ID;
          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: parentCardId,
            parentCardId: null,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
            parentCardId,
          }));
          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_3_ID,
            parentCardId,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery(parentCardId));

          assertThat(card, equalTo(2));
        });
      });

      suite("cardHistory", () => {
        testBackendConnection("card history initially has card creation", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            createdAt: Instant.ofEpochSecond(1713386548),
            id: CARD_1_ID,
          }));

          const cardHistory = await backendConnection.executeQuery(cardHistoryQuery(CARD_1_ID));

          assertThat(cardHistory, containsExactly(
            hasProperties({
              type: "created",
              instant: deepEqualTo(Instant.ofEpochSecond(1713386548)),
            }),
          ));
        });

        testBackendConnection("card history includes comments", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
          }));

          await backendConnection.mutate(testingProjectContentsMutation.commentAdd({
            cardId: CARD_1_ID,
            createdAt: Instant.ofEpochSecond(1713386548),
            text: "<card text>",
          }));

          const cardHistory = await backendConnection.executeQuery(cardHistoryQuery(CARD_1_ID));

          assertThat(cardHistory, containsExactly(
            hasProperties({
              type: "created",
            }),
            hasProperties({
              type: "comment",
              instant: deepEqualTo(Instant.ofEpochSecond(1713386548)),
              comment: hasProperties({
                text: "<card text>",
              }),
            }),
          ));
        });
      });

      testBackendConnection("searchCards", async (backendConnection) => {
        await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
          id: CATEGORY_1_ID,
        }));

        await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
          categoryId: CATEGORY_1_ID,
          id: CARD_1_ID,
          text: "ab",
        }));

        await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
          categoryId: CATEGORY_1_ID,
          id: CARD_2_ID,
          text: "ac",
        }));

        await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
          categoryId: CATEGORY_1_ID,
          id: CARD_3_ID,
          text: "dd",
        }));

        const cardHistory = await backendConnection.executeQuery(searchCardsQuery("a"));

        assertThat(cardHistory, containsExactly(
          hasProperties({text: "ab"}),
          hasProperties({text: "ac"}),
        ));
      });

      suite("boardCardTrees", () => {
        testBackendConnection("root board", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
            name: "<category name 1>",
          }));

          const parentCardId = CARD_1_ID;
          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: parentCardId,
            parentCardId: null,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
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

        testBackendConnection("root board", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
            name: "<category name 1>",
          }));

          const parentCardId = CARD_1_ID;
          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: parentCardId,
            parentCardId: null,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
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

      suite("parentBoard", () => {
        testBackendConnection("root board parent is itself", async (backendConnection) => {
          const parentBoardId = await backendConnection.executeQuery(parentBoardQuery(rootBoardId));

          assertThat(parentBoardId, deepEqualTo(rootBoardId));
        });

        testBackendConnection("can find parent of subboard", async (backendConnection) => {
          await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
            id: CATEGORY_1_ID,
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            parentCardId: null,
          }));
          await backendConnection.mutate(testingProjectContentsMutation.cardEdit({
            id: CARD_1_ID,
            isSubboardRoot: true,
          }));

          await backendConnection.mutate(testingProjectContentsMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
            parentCardId: CARD_1_ID,
          }));
          await backendConnection.mutate(testingProjectContentsMutation.cardEdit({
            id: CARD_2_ID,
            isSubboardRoot: true,
          }));

          const parentBoardId = await backendConnection.executeQuery(parentBoardQuery(cardSubboardId(CARD_2_ID)));

          assertThat(parentBoardId, deepEqualTo(cardSubboardId(CARD_1_ID)));
        });
      });

      testBackendConnection("allCategories", async (backendConnection) => {
        await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
          name: "<category name 1>",
        }));
        await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
          name: "<category name 2>",
        }));

        const allCategories = await backendConnection.executeQuery(allCategoriesQuery);

        assertThat(allCategories.allCategories(), containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
      });

      testBackendConnection("availableCategories", async (backendConnection) => {
        await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
          name: "<category name 1>",
        }));
        await backendConnection.mutate(testingProjectContentsMutation.categoryAdd({
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
                return;
              default:
                handleNever(status, null);
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
