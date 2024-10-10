import { assertThat, containsExactly, deepEqualTo, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { BackendConnection } from ".";
import { presetColors } from "hornbeam-common/lib/app/colors";
import { Duration, Instant } from "@js-joda/core";
import { allCategoriesQuery, allColorsQuery, allProjectsQuery, availableCategoriesQuery, boardCardTreesQuery, cardChildCountQuery, cardHistoryQuery, cardQuery, parentBoardQuery, parentCardQuery, searchCardsQuery } from "hornbeam-common/lib/queries";
import { createDeferred } from "hornbeam-common/lib/util/promises";
import { cardSubboardId, rootBoardId } from "hornbeam-common/lib/app/boards";
import { allCardStatuses } from "hornbeam-common/lib/app/cardStatuses";
import { handleNever } from "hornbeam-common/lib/util/assertNever";
import { testingAppMutation } from "hornbeam-common/lib/app/snapshots.testing";
import { matched, Matcher, unmatched } from "@mwilliamson/precisely/lib/core";

const UNKNOWN_ID = "0191beaa-0000-7507-9e6b-000000000001";

export function createBackendConnectionTestSuite(
  name: string,
  createBackendConnection: () => Promise<[BackendConnection, () => Promise<void>]>,
): void {
  suite(name, () => {
    suite("queries", () => {
      suite("card", () => {
        testBackendConnection("unrecognised card ID returns null", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const card = await backendConnection.executeQuery(cardQuery({
            cardId: UNKNOWN_ID,
            projectId,
          }));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("can find card by ID", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            projectId,
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            projectId,
            text: "<card text 1>",
          }));

          const {id: card2Id} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            projectId,
            text: "<card text 2>",
          }));

          const card = await backendConnection.executeQuery(cardQuery({
            cardId: card2Id,
            projectId,
          }));

          assertThat(card, hasProperties({text: "<card text 2>"}));
        });
      });

      suite("parentCard", () => {
        testBackendConnection("unrecognised card ID returns null", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const card = await backendConnection.executeQuery(parentCardQuery({
            cardId: UNKNOWN_ID,
            projectId,
          }));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("card has no parent", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            projectId,
          }));

          const {id: cardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId: null,
            projectId,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery({
            cardId,
            projectId,
          }));

          assertThat(card, equalTo(null));
        });

        testBackendConnection("card has parent", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            name: "<category name 1>",
            projectId,
          }));

          const {id: parentCardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId: null,
            projectId,
            text: "<parent card text>",
          }));

          const {id: childCardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId,
            projectId,
          }));

          const card = await backendConnection.executeQuery(parentCardQuery({
            cardId: childCardId,
            projectId,
          }));

          assertThat(card, hasProperties({text: "<parent card text>"}));
        });
      });

      suite("cardChildCount", () => {
        testBackendConnection("unrecognised card ID returns 0", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const card = await backendConnection.executeQuery(cardChildCountQuery({
            cardId: UNKNOWN_ID,
            projectId,
          }));

          assertThat(card, equalTo(0));
        });

        testBackendConnection("card with no children", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            projectId,
          }));

          const {id: cardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId: null,
            projectId,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery({
            cardId,
            projectId,
          }));

          assertThat(card, equalTo(0));
        });

        testBackendConnection("card with children", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            name: "<category name 1>",
            projectId,
          }));

          const {id: parentCardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId: null,
            projectId,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId,
            projectId,
          }));
          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId,
            projectId,
          }));

          const card = await backendConnection.executeQuery(cardChildCountQuery({
            cardId: parentCardId,
            projectId,
          }));

          assertThat(card, equalTo(2));
        });
      });

      suite("cardHistory", () => {
        testBackendConnection("card history initially has card creation", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            projectId,
          }));

          const {id: cardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            projectId,
          }));

          const cardHistory = await backendConnection.executeQuery(cardHistoryQuery({
            cardId,
            projectId,
          }));

          assertThat(cardHistory, containsExactly(
            hasProperties({
              type: "created",
              instant: lastMinute(),
            }),
          ));
        });

        testBackendConnection("card history includes comments", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            projectId,
          }));

          const {id: cardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            projectId,
          }));

          await backendConnection.mutate(testingAppMutation.commentAdd({
            cardId,
            projectId,
            text: "<card text>",
          }));

          const cardHistory = await backendConnection.executeQuery(cardHistoryQuery({
            cardId,
            projectId,
          }));

          assertThat(cardHistory, containsExactly(
            hasProperties({
              type: "created",
            }),
            hasProperties({
              type: "comment",
              instant: lastMinute(),
              comment: hasProperties({
                text: "<card text>",
              }),
            }),
          ));
        });
      });

      testBackendConnection("searchCards", async (backendConnection) => {
        const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

        const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
          projectId,
        }));

        await backendConnection.mutate(testingAppMutation.cardAdd({
          categoryId,
          projectId,
          text: "ab",
        }));

        await backendConnection.mutate(testingAppMutation.cardAdd({
          categoryId,
          projectId,
          text: "ac",
        }));

        await backendConnection.mutate(testingAppMutation.cardAdd({
          categoryId,
          projectId,
          text: "dd",
        }));

        const cardHistory = await backendConnection.executeQuery(searchCardsQuery({
          projectId,
          searchTerm: "a",
        }));

        assertThat(cardHistory, containsExactly(
          hasProperties({text: "ab"}),
          hasProperties({text: "ac"}),
        ));
      });

      suite("boardCardTrees", () => {
        testBackendConnection("root board", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            name: "<category name 1>",
            projectId,
          }));

          const {id: parentCardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId: null,
            projectId,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId,
            projectId,
            text: "<child card text>",
          }));

          const boardCardTrees = await backendConnection.executeQuery(boardCardTreesQuery({
            boardId: rootBoardId,
            cardStatuses: new Set(allCardStatuses),
            projectId,
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
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            name: "<category name 1>",
            projectId,
          }));

          const {id: parentCardId} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId: null,
            projectId,
            text: "<parent card text>",
          }));

          await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId,
            projectId,
            text: "<child card text>",
          }));

          const boardCardTrees = await backendConnection.executeQuery(boardCardTreesQuery({
            boardId: rootBoardId,
            cardStatuses: new Set(allCardStatuses),
            projectId,
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
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const parentBoardId = await backendConnection.executeQuery(parentBoardQuery({
            boardId: rootBoardId,
            projectId,
          }));

          assertThat(parentBoardId, deepEqualTo(rootBoardId));
        });

        testBackendConnection("can find parent of subboard", async (backendConnection) => {
          const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

          const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
            projectId,
          }));

          const {id: card1Id} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId: null,
            projectId,
          }));
          await backendConnection.mutate(testingAppMutation.cardEdit({
            edits: {isSubboardRoot: true},
            id: card1Id,
            projectId,
          }));

          const {id: card2Id} = await backendConnection.mutate(testingAppMutation.cardAdd({
            categoryId,
            parentCardId: card1Id,
            projectId,
          }));
          await backendConnection.mutate(testingAppMutation.cardEdit({
            edits: {isSubboardRoot: true},
            id: card2Id,
            projectId,
          }));

          const parentBoardId = await backendConnection.executeQuery(parentBoardQuery({
            boardId: cardSubboardId(card2Id),
            projectId,
          }));

          assertThat(parentBoardId, deepEqualTo(cardSubboardId(card1Id)));
        });
      });

      testBackendConnection("allCategories", async (backendConnection) => {
        const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

        await backendConnection.mutate(testingAppMutation.categoryAdd({
          name: "<category name 1>",
          projectId,
        }));
        await backendConnection.mutate(testingAppMutation.categoryAdd({
          name: "<category name 2>",
          projectId,
        }));

        const query = allCategoriesQuery({projectId});
        const allCategories = await backendConnection.executeQuery(query);

        assertThat(allCategories.allCategories(), containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
      });

      testBackendConnection("availableCategories", async (backendConnection) => {
        const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

        await backendConnection.mutate(testingAppMutation.categoryAdd({
          name: "<category name 1>",
          projectId,
        }));
        await backendConnection.mutate(testingAppMutation.categoryAdd({
          name: "<category name 2>",
          projectId,
        }));

        const query = availableCategoriesQuery({projectId});
        const availableCategories = await backendConnection.executeQuery(query);

        assertThat(availableCategories, containsExactly(
          hasProperties({name: "<category name 1>"}),
          hasProperties({name: "<category name 2>"}),
        ));
      });

      testBackendConnection("allColors", async (backendConnection) => {
        const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

        const allColors = await backendConnection.executeQuery(allColorsQuery({
          projectId,
        }));

        assertThat(allColors.allPresetColors(), containsExactly(
          ...presetColors.map(presetColor => hasProperties({name: presetColor.name}))
        ));
      });
    });

    testBackendConnection("allProjects", async (backendConnection) => {
      await backendConnection.mutate(testingAppMutation.projectAdd({
        name: "<project name 1>",
      }));
      await backendConnection.mutate(testingAppMutation.projectAdd({
        name: "<project name 2>",
      }));

      const allProjects = await backendConnection.executeQuery(allProjectsQuery);

      assertThat(allProjects, containsExactly(
        hasProperties({name: "<project name 1>"}),
        hasProperties({name: "<project name 2>"}),
      ));
    });

    testBackendConnection("null query returns null", async (backendConnection) => {
      const {id: projectId} = await backendConnection.mutate(testingAppMutation.projectAdd({}));

      const {id: categoryId} = await backendConnection.mutate(testingAppMutation.categoryAdd({
        projectId,
      }));

      const {id: card1Id} = await backendConnection.mutate(testingAppMutation.cardAdd({
        categoryId,
        projectId,
        text: "<card text 1>",
      }));

      const {id: card2Id} = await backendConnection.mutate(testingAppMutation.cardAdd({
        categoryId,
        projectId,
        text: "<card text 2>",
      }));

      const result = await backendConnection.executeQueries({
        a: null,
        b: cardQuery({cardId: card1Id, projectId}),
        c: null,
        d: cardQuery({cardId: card2Id, projectId}),
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

function lastMinute(): Matcher {
  return {
    describe: () => "last minute",
    match: value => {
      if (!(value instanceof Instant)) {
        return unmatched("was not an Instant");
      }

      const delta = Duration.between(value as Instant, Instant.now());
      const deltaMinutes = delta.toMillis() / (1000 * 60);
      if (delta.compareTo(Duration.ofMinutes(1)) <= 0) {
        return matched();
      } else {
        return unmatched(`was ${deltaMinutes} minutes ago`);
      }
    }
  };
}
