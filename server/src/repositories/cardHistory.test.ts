import { Instant } from "@js-joda/core";
import { assertThat, containsExactly, deepEqualTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import * as categoriesTesting from "hornbeam-common/lib/app/categories.testing";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { testingCardAddMutation } from "hornbeam-common/lib/app/cards.testing";
import { testingCommentAddMutation } from "hornbeam-common/lib/app/comments.testing";
import { testingProjectAddMutation } from "hornbeam-common/lib/app/projects.testing";

const CARD_1_ID = "0191beb5-0000-79e7-8207-000000001001";
const CARD_2_ID = "0191beb5-0000-79e7-8207-000000001002";
const CATEGORY_1_ID = "0191be9e-f6df-7507-9e6b-000000000001";
const PROJECT_1_ID = "01923983-2f95-7d79-975f-000000002001";

export function createCardHistoryFetcherTests(
  createFixtures: () => RepositoryFixtures,
): void {
  testFetcher("card initially has created at entry", async (fixtures) => {
    const cardRepository = await fixtures.cardRepository();
    await cardRepository.add(testingCardAddMutation({
      categoryId: CATEGORY_1_ID,
      createdAt: Instant.ofEpochSecond(1713386548),
      id: CARD_1_ID,
      projectId: PROJECT_1_ID,
    }));
    await cardRepository.add(testingCardAddMutation({
      categoryId: CATEGORY_1_ID,
      createdAt: Instant.ofEpochSecond(1713386549),
      id: CARD_2_ID,
      projectId: PROJECT_1_ID,
    }));

    const cardHistoryFetcher = await fixtures.cardHistoryFetcher();
    const cardHistory = await cardHistoryFetcher.fetchCardHistoryById({
      cardId: CARD_1_ID,
      projectId: PROJECT_1_ID,
    });

    assertThat(cardHistory, containsExactly(
      hasProperties({
        type: "created",
        instant: deepEqualTo(Instant.ofEpochSecond(1713386548)),
      }),
    ));
  });

  testFetcher("card history includes comments", async (fixtures) => {
    const cardRepository = await fixtures.cardRepository();
    await cardRepository.add(testingCardAddMutation({
      categoryId: CATEGORY_1_ID,
      id: CARD_1_ID,
      projectId: PROJECT_1_ID,
    }));

    const commentRepository = await fixtures.commentRepository();
    await commentRepository.add(testingCommentAddMutation({
      cardId: CARD_1_ID,
      createdAt: Instant.ofEpochSecond(1713386548),
      text: "<card text>",
    }));

    const cardHistoryFetcher = await fixtures.cardHistoryFetcher();
    const cardHistory = await cardHistoryFetcher.fetchCardHistoryById({
      cardId: CARD_1_ID,
      projectId: PROJECT_1_ID,
    });

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

  function testFetcher(name: string, f: (fixtures: RepositoryFixtures) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();

      const projectRepository = await fixtures.projectRepository();
      await projectRepository.add(testingProjectAddMutation({
        id: PROJECT_1_ID,
      }));

      const categoryRepository = await fixtures.categoryRepository();
      await categoryRepository.add(categoriesTesting.testingCategoryAddMutation({
        id: CATEGORY_1_ID,
        projectId: PROJECT_1_ID,
      }));

      await f(fixtures);
    });
  }
}

fileSuite(__filename, () => {
  suite("inMemory", () => {
    createCardHistoryFetcherTests(repositoryFixturesInMemory);
  });

  suite("database", () => {
    createCardHistoryFetcherTests(repositoryFixturesDatabase);
  });
});
