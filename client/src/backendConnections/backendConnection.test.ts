import { assertThat, containsExactly, deepEqualTo, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { BackendConnection } from ".";
import { presetColors } from "hornbeam-common/lib/app/colors";
import { Instant } from "@js-joda/core";
import { allCategoriesQuery, allColorsQuery, allProjectsQuery, availableCategoriesQuery, boardCardTreesQuery, cardChildCountQuery, cardHistoryQuery, cardQuery, parentBoardQuery, parentCardQuery, searchCardsQuery } from "hornbeam-common/lib/queries";
import { createDeferred } from "hornbeam-common/lib/util/promises";
import { cardSubboardId, rootBoardId } from "hornbeam-common/lib/app/boards";
import { allCardStatuses } from "hornbeam-common/lib/app/cardStatuses";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import { testingAppMutation } from "hornbeam-common/lib/app/snapshots.testing";

const CARD_1_ID = "0191beaa-0000-7507-9e6b-000000000001";
const CARD_2_ID = "0191beaa-0000-7507-9e6b-000000000002";
const CARD_3_ID = "0191beaa-0000-7507-9e6b-000000000003";
const CATEGORY_1_ID = "0191beaa-0001-7507-9e6b-000000000001";
const CATEGORY_2_ID = "0191beaa-0001-7507-9e6b-000000000002";
const PROJECT_1_ID = "0191beaa-0002-7507-9e6b-000000000001";
const PROJECT_2_ID = "0191beaa-0003-7507-9e6b-000000000002";

export function createBackendConnectionTestSuite(
  name: string,
  createBackendConnection: () => Promise<[BackendConnection, () => Promise<void>]>,
): void {
  suite(name, () => {
    suite("queries", () => {
      suite("card", () => {
        testBackendConnection("unrecognised card ID returns null", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          const card = await backendConnection.executeQuery(cardQuery({
            cardId: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("can find card by ID", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            projectId: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            projectId: PROJECT_1_ID,
            text: "<card text 1>",
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
            projectId: PROJECT_1_ID,
            text: "<card text 2>",
          }));

          const card = await backendConnection.executeQuery(cardQuery({
            cardId: CARD_2_ID,
            projectId: PROJECT_1_ID,
          }));

          assertThat(card, hasProperties({text: "<card text 2>"}));
        });
      });

      suite("parentCard", () => {
        testBackendConnection("unrecognised card ID returns null", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery({
            cardId: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("card has no parent", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            projectId: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            parentCardId: null,
            projectId: PROJECT_1_ID,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery({
            cardId: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("card has parent", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            name: "<category name 1>",
            projectId: PROJECT_1_ID,
          }));

          const parentCardId = CARD_1_ID;
          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: parentCardId,
            parentCardId: null,
            projectId: PROJECT_1_ID,
            text: "<parent card text>",
          }));

          const childCardId = CARD_2_ID;
          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: childCardId,
            parentCardId,
            projectId: PROJECT_1_ID,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery({
            cardId: childCardId,
            projectId: PROJECT_1_ID,
          }));

          assertThat(card, hasProperties({text: "<parent card text>"}));
        });
      });

      suite("cardChildCount", () => {
        testBackendConnection("unrecognised card ID returns 0", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery({
            cardId: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

          assertThat(card, equalTo(0));
        });

        testBackendConnection("card with no children", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            projectId: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            parentCardId: null,
            projectId: PROJECT_1_ID,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery({
            cardId: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

          assertThat(card, equalTo(0));
        });

        testBackendConnection("card with children", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            name: "<category name 1>",
            projectId: PROJECT_1_ID,
          }));

          const parentCardId = CARD_1_ID;
          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: parentCardId,
            parentCardId: null,
            projectId: PROJECT_1_ID,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
            parentCardId,
            projectId: PROJECT_1_ID,
          }));
          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_3_ID,
            parentCardId,
            projectId: PROJECT_1_ID,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery({
            cardId: parentCardId,
            projectId: PROJECT_1_ID,
          }));

          assertThat(card, equalTo(2));
        });
      });

      suite("cardHistory", () => {
        testBackendConnection("card history initially has card creation", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            projectId: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            createdAt: Instant.ofEpochSecond(1713386548),
            id: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

          const cardHistory = await backendConnection.executeQuery(cardHistoryQuery({
            cardId: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

          assertThat(cardHistory, containsExactly(
            hasProperties({
              type: "created",
              instant: deepEqualTo(Instant.ofEpochSecond(1713386548)),
            }),
          ));
        });

        testBackendConnection("card history includes comments", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            projectId: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.commentAdd({
            cardId: CARD_1_ID,
            createdAt: Instant.ofEpochSecond(1713386548),
            projectId: PROJECT_1_ID,
            text: "<card text>",
          }));

          const cardHistory = await backendConnection.executeQuery(cardHistoryQuery({
            cardId: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));

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
        await backendConnection.mutate(testingAppMutation.projectAdd({
          id: PROJECT_1_ID,
        }));

        await backendConnection.mutate(testingAppMutation.categoryAdd({
          id: CATEGORY_1_ID,
          projectId: PROJECT_1_ID,
        }));

        await backendConnection.mutate(testingAppMutation.cardAdd({
          categoryId: CATEGORY_1_ID,
          id: CARD_1_ID,
          projectId: PROJECT_1_ID,
          text: "ab",
        }));

        await backendConnection.mutate(testingAppMutation.cardAdd({
          categoryId: CATEGORY_1_ID,
          id: CARD_2_ID,
          projectId: PROJECT_1_ID,
          text: "ac",
        }));

        await backendConnection.mutate(testingAppMutation.cardAdd({
          categoryId: CATEGORY_1_ID,
          id: CARD_3_ID,
          projectId: PROJECT_1_ID,
          text: "dd",
        }));

        const cardHistory = await backendConnection.executeQuery(searchCardsQuery({
          projectId: PROJECT_1_ID,
          searchTerm: "a",
        }));

        assertThat(cardHistory, containsExactly(
          hasProperties({text: "ab"}),
          hasProperties({text: "ac"}),
        ));
      });

      suite("boardCardTrees", () => {
        testBackendConnection("root board", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            name: "<category name 1>",
            projectId: PROJECT_1_ID,
          }));

          const parentCardId = CARD_1_ID;
          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: parentCardId,
            parentCardId: null,
            projectId: PROJECT_1_ID,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
            parentCardId,
            projectId: PROJECT_1_ID,
            text: "<child card text>",
          }));

          const boardCardTrees = await backendConnection.executeQuery(boardCardTreesQuery({
            boardId: rootBoardId,
            cardStatuses: new Set(allCardStatuses),
            projectId: PROJECT_1_ID,
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
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            name: "<category name 1>",
            projectId: PROJECT_1_ID,
          }));

          const parentCardId = CARD_1_ID;
          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: parentCardId,
            parentCardId: null,
            projectId: PROJECT_1_ID,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
            parentCardId,
            projectId: PROJECT_1_ID,
            text: "<child card text>",
          }));

          const boardCardTrees = await backendConnection.executeQuery(boardCardTreesQuery({
            boardId: rootBoardId,
            cardStatuses: new Set(allCardStatuses),
            projectId: PROJECT_1_ID,
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
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          const parentBoardId = await backendConnection.executeQuery(parentBoardQuery({
            boardId: rootBoardId,
            projectId: PROJECT_1_ID,
          }));

          assertThat(parentBoardId, deepEqualTo(rootBoardId));
        });

        testBackendConnection("can find parent of subboard", async (backendConnection) => {
          await backendConnection.mutate(testingAppMutation.projectAdd({
            id: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.categoryAdd({
            id: CATEGORY_1_ID,
            projectId: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_1_ID,
            parentCardId: null,
            projectId: PROJECT_1_ID,
          }));
          await backendConnection.mutate(testingAppMutation.cardEdit({
            id: CARD_1_ID,
            isSubboardRoot: true,
            projectId: PROJECT_1_ID,
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId: CATEGORY_1_ID,
            id: CARD_2_ID,
            parentCardId: CARD_1_ID,
            projectId: PROJECT_1_ID,
          }));
          await backendConnection.mutate(testingAppMutation.cardEdit({
            id: CARD_2_ID,
            isSubboardRoot: true,
            projectId: PROJECT_1_ID,
          }));

          const parentBoardId = await backendConnection.executeQuery(parentBoardQuery({
            boardId: cardSubboardId(CARD_2_ID),
            projectId: PROJECT_1_ID,
          }));

          assertThat(parentBoardId, deepEqualTo(cardSubboardId(CARD_1_ID)));
        });
      });

      testBackendConnection("allCategories", async (backendConnection) => {
        await backendConnection.mutate(testingAppMutation.projectAdd({
          id: PROJECT_1_ID,
        }));

        await backendConnection.mutate(testingAppMutation.categoryAdd({
          id: CATEGORY_1_ID,
          name: "<category name 1>",
          projectId: PROJECT_1_ID,
        }));
        await backendConnection.mutate(testingAppMutation.categoryAdd({
          id: CATEGORY_2_ID,
          name: "<category name 2>",
          projectId: PROJECT_1_ID,
        }));

        const query = allCategoriesQuery({projectId: PROJECT_1_ID});
        const allCategories = await backendConnection.executeQuery(query);

        assertThat(allCategories.allCategories(), containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
      });

      testBackendConnection("availableCategories", async (backendConnection) => {
        await backendConnection.mutate(testingAppMutation.projectAdd({
          id: PROJECT_1_ID,
        }));

        await backendConnection.mutate(testingAppMutation.categoryAdd({
          id: CATEGORY_1_ID,
          name: "<category name 1>",
          projectId: PROJECT_1_ID,
        }));
        await backendConnection.mutate(testingAppMutation.categoryAdd({
          id: CATEGORY_2_ID,
          name: "<category name 2>",
          projectId: PROJECT_1_ID,
        }));

        const query = availableCategoriesQuery({projectId: PROJECT_1_ID});
        const availableCategories = await backendConnection.executeQuery(query);

        assertThat(availableCategories, containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
      });

      testBackendConnection("allColors", async (backendConnection) => {
        await backendConnection.mutate(testingAppMutation.projectAdd({
          id: PROJECT_1_ID,
        }));

        const allColors = await backendConnection.executeQuery(allColorsQuery({
          projectId: PROJECT_1_ID,
        }));

        assertThat(allColors.allPresetColors(), containsExactly(
          ...presetColors.map(presetColor => hasProperties({name: presetColor.name}))
        ));
      });
    });

    testBackendConnection("allProjects", async (backendConnection) => {
      await backendConnection.mutate(testingAppMutation.projectAdd({
        id: PROJECT_1_ID,
        name: "<project name 1>",
      }));
      await backendConnection.mutate(testingAppMutation.projectAdd({
        id: PROJECT_2_ID,
        name: "<project name 2>",
      }));

      const allProjects = await backendConnection.executeQuery(allProjectsQuery);

      assertThat(allProjects, containsExactly(
        hasProperties({name: "<project name 1>"}),
        hasProperties({name: "<project name 2>"}),
      ));
    });

    testBackendConnection("null query returns null", async (backendConnection) => {
      await backendConnection.mutate(testingAppMutation.projectAdd({
        id: PROJECT_1_ID,
      }));

      await backendConnection.mutate(testingAppMutation.categoryAdd({
        id: CATEGORY_1_ID,
        projectId: PROJECT_1_ID,
      }));

      await backendConnection.mutate(testingAppMutation.cardAdd({
        categoryId: CATEGORY_1_ID,
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card text 1>",
      }));

      await backendConnection.mutate(testingAppMutation.cardAdd({
        categoryId: CATEGORY_1_ID,
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card text 2>",
      }));

      const result = await backendConnection.executeQueries({
        a: null,
        b: cardQuery({cardId: CARD_1_ID, projectId: PROJECT_1_ID}),
        c: null,
        d: cardQuery({cardId: CARD_2_ID, projectId: PROJECT_1_ID}),
      });

      assertThat(result, hasProperties({
        a: equalTo(null),
        b: hasProperties({text: "<card text 1>"}),
        c: equalTo(null),
        d: hasProperties({text: "<card text 2>"}),
      }));
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
