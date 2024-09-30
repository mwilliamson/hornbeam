import { Instant } from "@js-joda/core";
import { assertThat, containsExactly, deepEqualTo, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { uuidv7 } from "uuidv7";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { CardRepository } from "./cards";
import { testingCardAddMutation, testingCardEditMutation } from "hornbeam-common/lib/app/cards.testing";
import { testingCategoryAddMutation } from "hornbeam-common/lib/app/categories.testing";
import { CardAddMutation } from "hornbeam-common/lib/app/cards";
import { allCardStatuses, CardStatus } from "hornbeam-common/lib/app/cardStatuses";
import { cardSubboardId, rootBoardId } from "hornbeam-common/lib/app/boards";
import { testingProjectAddMutation } from "hornbeam-common/lib/app/projects.testing";

const CARD_1_ID = "0191beb5-0000-79e7-8207-000000001001";
const CARD_2_ID = "0191beb5-0000-79e7-8207-000000001002";
const CARD_3_ID = "0191beb5-0000-79e7-8207-000000001003";
const CARD_4_ID = "0191beb5-0000-79e7-8207-000000001004";
const CARD_5_ID = "0191beb5-0000-79e7-8207-000000001005";
const CATEGORY_1_ID = "0191beb5-0000-79e7-8207-000000000001";
const CATEGORY_2_ID = "0191beb5-0000-79e7-8207-000000000002";
const CATEGORY_3_ID = "0191beb5-0000-79e7-8207-000000000003";
const PROJECT_1_ID = "01923983-2f95-7d79-975f-000000002001";
const PROJECT_2_ID = "01923983-2f95-7d79-975f-000000002002";

export function createCardsRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  suite("fetchById()", () => {
    testRepository("when there are no cards then fetchById() returns null", async (repository) => {
      const card = await repository.fetchById({cardId: CARD_1_ID, projectId: PROJECT_1_ID});

      assertThat(card, equalTo(null));
    });

    testRepository("when there are cards then fetchById() returns card with matching ID", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        projectId: PROJECT_1_ID,
        text: "<card 3 text>",
      }));

      const card = await repository.fetchById({cardId: CARD_2_ID, projectId: PROJECT_1_ID});

      assertThat(card, hasProperties({text: "<card 2 text>"}));
    });

    testRepository("when card does not match project ID then card is not found", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));

      const card = await repository.fetchById({cardId: CARD_1_ID, projectId: PROJECT_2_ID});

      assertThat(card, equalTo(null));
    });
  });

  suite("fetchParentByChildId()", () => {
    testRepository("when there are no cards then fetchParentByChildId() returns null", async (repository) => {
      const card = await repository.fetchParentByChildId(CARD_1_ID);

      assertThat(card, equalTo(null));
    });

    testRepository("when card has no parent then fetchParentByChildId() returns null", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        parentCardId: null,
        projectId: PROJECT_1_ID,
      }));

      const card = await repository.fetchParentByChildId(CARD_1_ID);

      assertThat(card, equalTo(null));
    });

    testRepository("when card has parent then fetchParentByChildId() returns parent", async (repository) => {
      const parent1Id = CARD_1_ID;
      await repository.add(cardAddMutation({
        id: parent1Id,
        projectId: PROJECT_1_ID,
        text: "<parent card 1>",
      }));
      const parent2Id = CARD_2_ID;
      await repository.add(cardAddMutation({
        id: parent2Id,
        projectId: PROJECT_1_ID,
        text: "<parent card 2>",
      }));
      const child1Id = CARD_3_ID;
      await repository.add(cardAddMutation({
        id: child1Id,
        parentCardId: parent1Id,
        projectId: PROJECT_1_ID,
        text: "<child card 1>",
      }));
      const child2Id = CARD_4_ID;
      await repository.add(cardAddMutation({
        id: child2Id,
        parentCardId: parent2Id,
        projectId: PROJECT_1_ID,
        text: "<child card 2>",
      }));

      const card = await repository.fetchParentByChildId(child2Id);

      assertThat(card, hasProperties({text: "<parent card 2>"}));
    });
  });

  suite("fetchChildCountByParentId()", () => {
    testRepository("when parent ID is not recognised then count is 0", async (repository) => {
      const card = await repository.fetchChildCountByParentId(CARD_1_ID);

      assertThat(card, equalTo(0));
    });

    testRepository("can count children of parent", async (repository) => {
      const parent1Id = CARD_1_ID;
      await repository.add(cardAddMutation({
        id: parent1Id,
        projectId: PROJECT_1_ID,
      }));
      const parent2Id = CARD_2_ID;
      await repository.add(cardAddMutation({
        id: parent2Id,
        projectId: PROJECT_1_ID,
      }));
      const child1Id = CARD_3_ID;
      await repository.add(cardAddMutation({
        id: child1Id,
        parentCardId: parent1Id,
        projectId: PROJECT_1_ID,
      }));
      const child2Id = CARD_4_ID;
      await repository.add(cardAddMutation({
        id: child2Id,
        parentCardId: parent2Id,
        projectId: PROJECT_1_ID,
      }));
      const child3Id = CARD_5_ID;
      await repository.add(cardAddMutation({
        id: child3Id,
        parentCardId: parent2Id,
        projectId: PROJECT_1_ID,
      }));
      const card = await repository.fetchChildCountByParentId(parent2Id);

      assertThat(card, equalTo(2));
    });
  });

  suite("search", () => {
    testRepository("search finds cards that contain search term in text", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "abcd",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "bc",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        projectId: PROJECT_1_ID,
        text: "cd",
      }));

      const cards = await repository.search("bc");

      assertThat(cards, containsExactly(
        hasProperties({text: "abcd"}),
        hasProperties({text: "bc"}),
      ));
    });

    testRepository("results are limited to 20 cards", async (repository) => {
      for (let i = 0; i< 30; i++) {
        const id = uuidv7();
        await repository.add(cardAddMutation({
          id,
          projectId: PROJECT_1_ID,
          text: "abcd",
        }));
      }

      const cards = await repository.search("bc");

      assertThat(cards.length, equalTo(20));
    });
  });

  suite("numbers", () => {
    testRepository("cards are numbered sequentially", async(repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        projectId: PROJECT_1_ID,
        text: "<card 3 text>",
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({number: 1, text: "<card 1 text>"}),
        hasProperties({number: 2, text: "<card 2 text>"}),
        hasProperties({number: 3, text: "<card 3 text>"}),
      ));
    });
  });

  suite("board card trees", () => {
    testRepository("root board includes cards without parents", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));

      const cardTrees = await repository.fetchBoardCardTrees(rootBoardId, new Set(allCardStatuses));

      assertThat(cardTrees, containsExactly(
        hasProperties({
          card: hasProperties({text: "<card 1>"}),
          children: containsExactly(),
        }),
        hasProperties({
          card: hasProperties({text: "<card 2>"}),
          children: containsExactly(),
        }),
      ));
    });

    testRepository("children are attached to their parent", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        parentCardId: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 3>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_4_ID,
        parentCardId: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 4>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_5_ID,
        parentCardId: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 5>",
      }));

      const cardTrees = await repository.fetchBoardCardTrees(rootBoardId, new Set(allCardStatuses));

      assertThat(cardTrees, containsExactly(
        hasProperties({
          card: hasProperties({text: "<card 1>"}),
          children: containsExactly(
            hasProperties({
              card: hasProperties({text: "<card 3>"}),
              children: containsExactly(),
            }),
            hasProperties({
              card: hasProperties({text: "<card 4>"}),
              children: containsExactly(),
            }),
          ),
        }),
        hasProperties({
          card: hasProperties({text: "<card 2>"}),
          children: containsExactly(
            hasProperties({
              card: hasProperties({text: "<card 5>"}),
              children: containsExactly(),
            }),
          ),
        }),
      ));
    });

    testRepository("children of subboard roots are ignored", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        isSubboardRoot: true,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        parentCardId: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));

      const cardTrees = await repository.fetchBoardCardTrees(rootBoardId, new Set(allCardStatuses));

      assertThat(cardTrees, containsExactly(
        hasProperties({
          card: hasProperties({text: "<card 1>"}),
          children: containsExactly(),
        }),
      ));
    });

    testRepository("card subboard uses card as root", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        isSubboardRoot: true,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        parentCardId: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 3>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_4_ID,
        parentCardId: CARD_3_ID,
        projectId: PROJECT_1_ID,
        text: "<card 4>",
      }));

      const cardTrees = await repository.fetchBoardCardTrees(
        cardSubboardId(CARD_1_ID),
        new Set(allCardStatuses),
      );

      assertThat(cardTrees, containsExactly(
        hasProperties({
          card: hasProperties({text: "<card 1>"}),
          children: containsExactly(
            hasProperties({
              card: hasProperties({text: "<card 3>"}),
              children: containsExactly(
                hasProperties({
                  card: hasProperties({text: "<card 4>"}),
                  children: containsExactly(),
                }),
              ),
            }),
          ),
        }),
      ));
    });

    testRepository("cards are filtered by card statuses", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        status: CardStatus.None,
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        status: CardStatus.Deleted,
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        projectId: PROJECT_1_ID,
        text: "<card 3>",
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_3_ID,
        projectId: PROJECT_1_ID,
        status: CardStatus.Done,
      }));

      const cardTrees = await repository.fetchBoardCardTrees(
        rootBoardId,
        new Set([CardStatus.None, CardStatus.Done]),
      );

      assertThat(cardTrees, containsExactly(
        hasProperties({
          card: hasProperties({text: "<card 1>"}),
        }),
        hasProperties({
          card: hasProperties({text: "<card 3>"}),
        }),
      ));
    });
  });

  suite("parent board", () => {
    testRepository("parent of root board is root board", async (repository) => {
      const parentBoardId = await repository.fetchParentBoard(rootBoardId);

      assertThat(parentBoardId, deepEqualTo(rootBoardId));
    });

    testRepository("when card has no parent then parent of subboard is root board", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
      }));

      const parentBoardId = await repository.fetchParentBoard(cardSubboardId(CARD_1_ID));

      assertThat(parentBoardId, deepEqualTo(rootBoardId));
    });

    testRepository("when card has parent that is not subboard then parent of subboard is root board", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        parentCardId: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));

      const parentBoardId = await repository.fetchParentBoard(cardSubboardId(CARD_2_ID));

      assertThat(parentBoardId, deepEqualTo(rootBoardId));
    });

    testRepository("when card has parent that is subboard then parent of subboard is parent card board", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        parentCardId: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        isSubboardRoot: true,
        projectId: PROJECT_1_ID,
      }));

      const parentBoardId = await repository.fetchParentBoard(cardSubboardId(CARD_2_ID));

      assertThat(parentBoardId, deepEqualTo(cardSubboardId(CARD_1_ID)));
    });

    testRepository("when card has ancestor that is subboard then ancestor of subboard is parent card board", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        parentCardId: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        parentCardId: CARD_2_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        isSubboardRoot: true,
        projectId: PROJECT_1_ID,
      }));

      const parentBoardId = await repository.fetchParentBoard(cardSubboardId(CARD_3_ID));

      assertThat(parentBoardId, deepEqualTo(cardSubboardId(CARD_1_ID)));
    });

    testRepository("when card has multiple ancestors that are subboards then closest ancestor is parent board", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        parentCardId: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        parentCardId: CARD_2_ID,
        projectId: PROJECT_1_ID,
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        isSubboardRoot: true,
        projectId: PROJECT_1_ID,
      }));
      await repository.update(testingCardEditMutation({
        id: CARD_2_ID,
        isSubboardRoot: true,
        projectId: PROJECT_1_ID,
      }));

      const parentBoardId = await repository.fetchParentBoard(cardSubboardId(CARD_3_ID));

      assertThat(parentBoardId, deepEqualTo(cardSubboardId(CARD_2_ID)));
    });
  });

  suite("field persistence", () => {
    testRepository("text", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        projectId: PROJECT_1_ID,
        text: "<card 3 text>",
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({id: CARD_1_ID, text: "<card 1 text>"}),
        hasProperties({id: CARD_2_ID, text: "<card 2 text>"}),
        hasProperties({id: CARD_3_ID, text: "<card 3 text>"}),
      ));
    });

    testRepository("category", async (repository) => {
      await repository.add(cardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));
      await repository.add(cardAddMutation({
        categoryId: CATEGORY_2_ID,
        id: CARD_3_ID,
        projectId: PROJECT_1_ID,
        text: "<card 3>",
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({categoryId: CATEGORY_1_ID, text: "<card 1>"}),
        hasProperties({categoryId: CATEGORY_1_ID, text: "<card 2>"}),
        hasProperties({categoryId: CATEGORY_2_ID, text: "<card 3>"}),
      ));
    });

    testRepository("created at", async (repository) => {
      await repository.add(cardAddMutation({
        createdAt: Instant.ofEpochSecond(1000),
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        createdAt: Instant.ofEpochSecond(2000),
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));
      await repository.add(cardAddMutation({
        createdAt: Instant.ofEpochSecond(3000),
        id: CARD_3_ID,
        projectId: PROJECT_1_ID,
        text: "<card 3>",
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({createdAt: deepEqualTo(Instant.ofEpochSecond(1000)), text: "<card 1>"}),
        hasProperties({createdAt: deepEqualTo(Instant.ofEpochSecond(2000)), text: "<card 2>"}),
        hasProperties({createdAt: deepEqualTo(Instant.ofEpochSecond(3000)), text: "<card 3>"}),
      ));
    });

    testRepository("parent card", async (repository) => {
      const parentCard1Id = CARD_1_ID;
      await repository.add(cardAddMutation({
        id: parentCard1Id,
        parentCardId: null,
        projectId: PROJECT_1_ID,
        text: "<parent card 1>",
      }));

      const parentCard2Id = CARD_2_ID;
      await repository.add(cardAddMutation({
        id: parentCard2Id,
        parentCardId: null,
        projectId: PROJECT_1_ID,
        text: "<parent card 2>",
      }));

      const childCard1Id = CARD_3_ID;
      await repository.add(cardAddMutation({
        id: childCard1Id,
        parentCardId: parentCard1Id,
        projectId: PROJECT_1_ID,
        text: "<child card 1>",
      }));
      const childCard2Id = CARD_4_ID;
      await repository.add(cardAddMutation({
        id: childCard2Id,
        parentCardId: parentCard1Id,
        projectId: PROJECT_1_ID,
        text: "<child card 2>",
      }));
      const childCard3Id = CARD_5_ID;
      await repository.add(cardAddMutation({
        id: childCard3Id,
        parentCardId: parentCard2Id,
        projectId: PROJECT_1_ID,
        text: "<child card 3>",
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({parentCardId: null, text: "<parent card 1>"}),
        hasProperties({parentCardId: null, text: "<parent card 2>"}),
        hasProperties({parentCardId: parentCard1Id, text: "<child card 1>"}),
        hasProperties({parentCardId: parentCard1Id, text: "<child card 2>"}),
        hasProperties({parentCardId: parentCard2Id, text: "<child card 3>"}),
      ));
    });
  });

  suite("field updates", () => {
    testRepository("nothing", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));

      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({id: CARD_1_ID, text: "<card 1>"}),
        hasProperties({id: CARD_2_ID, text: "<card 2>"}),
      ));
    });

    testRepository("category", async (repository) => {
      await repository.add(cardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        categoryId: CATEGORY_2_ID,
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));

      await repository.update(testingCardEditMutation({
        categoryId: CATEGORY_3_ID,
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({categoryId: CATEGORY_3_ID, text: "<card 1>"}),
        hasProperties({categoryId: CATEGORY_2_ID, text: "<card 2>"}),
      ));
    });

    testRepository("is subboard root", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));

      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        isSubboardRoot: true,
        projectId: PROJECT_1_ID,
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({isSubboardRoot: true, text: "<card 1>"}),
        hasProperties({isSubboardRoot: false, id: CARD_2_ID, text: "<card 2>"}),
      ));
    });

    testRepository("parent", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        parentCardId: null,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        parentCardId: null,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        parentCardId: null,
        projectId: PROJECT_1_ID,
        text: "<card 3>",
      }));

      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        parentCardId: CARD_3_ID,
        projectId: PROJECT_1_ID,
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({parentCardId: CARD_3_ID, text: "<card 1>"}),
        hasProperties({parentCardId: null, text: "<card 2>"}),
        hasProperties({parentCardId: null, text: "<card 3>"}),
      ));
    });

    testRepository("status", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));

      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        status: CardStatus.Done,
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({status: CardStatus.Done, text: "<card 1>"}),
        hasProperties({status: CardStatus.None, text: "<card 2>"}),
      ));
    });

    testRepository("text", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        projectId: PROJECT_1_ID,
        text: "<card 2>",
      }));

      await repository.update(testingCardEditMutation({
        id: CARD_1_ID,
        projectId: PROJECT_1_ID,
        text: "<updated text>",
      }));

      const card = await repository.fetchAll();

      assertThat(card, containsExactly(
        hasProperties({id: CARD_1_ID, text: "<updated text>"}),
        hasProperties({id: CARD_2_ID, text: "<card 2>"}),
      ));
    });
  });

  function cardAddMutation(mutation: Partial<CardAddMutation>): CardAddMutation {
    return testingCardAddMutation({
      categoryId: CATEGORY_1_ID,
      ...mutation,
    });
  }

  function testRepository(name: string, f: (repository: CardRepository) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();

      const projectRepository = await fixtures.projectRepository();
      await projectRepository.add(testingProjectAddMutation({
        id: PROJECT_1_ID,
      }));
      await projectRepository.add(testingProjectAddMutation({
        id: PROJECT_2_ID,
      }));

      const categoryRepository = await fixtures.categoryRepository();
      await categoryRepository.add(testingCategoryAddMutation({
        id: CATEGORY_1_ID,
        projectId: PROJECT_1_ID,
      }));
      await categoryRepository.add(testingCategoryAddMutation({
        id: CATEGORY_2_ID,
        projectId: PROJECT_1_ID,
      }));
      await categoryRepository.add(testingCategoryAddMutation({
        id: CATEGORY_3_ID,
        projectId: PROJECT_1_ID,
      }));

      await f(await fixtures.cardRepository());
    });
  }
}

fileSuite(__filename, () => {
  suite("inMemory", () => {
    createCardsRepositoryTests(repositoryFixturesInMemory);
  });

  suite("database", () => {
    createCardsRepositoryTests(repositoryFixturesDatabase);
  });
});
