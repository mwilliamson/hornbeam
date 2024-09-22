import { assertThat, containsExactly, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import * as categoriesTesting from "hornbeam-common/lib/app/categories.testing";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { testingCardAddMutation } from "hornbeam-common/lib/app/cards.testing";
import { testingCommentAddMutation } from "hornbeam-common/lib/app/comments.testing";

const CATEGORY_1_ID = "01921902-0000-7c1a-a1c3-000000000001";
const CARD_1_ID = "01921902-0000-7c1a-a1c3-000000001001";
const CARD_2_ID = "01921902-0000-7c1a-a1c3-000000001002";
const COMMENT_1_ID = "01921902-0000-7c1a-a1c3-000000002001";
const COMMENT_2_ID = "01921902-0000-7c1a-a1c3-000000002002";
const COMMENT_3_ID = "01921902-0000-7c1a-a1c3-000000002003";

export function createCategoryRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  suite("fetchByCardId()", () => {
    testRepository("can fetch comments for a card", async (repository) => {
      const cardRepository = await repository.cardRepository();
      await cardRepository.add(testingCardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_1_ID,
      }));
      await cardRepository.add(testingCardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_2_ID,
      }));

      const commentRepository = await repository.commentRepository();
      await commentRepository.add(testingCommentAddMutation({
        cardId: CARD_1_ID,
        id: COMMENT_1_ID,
        text: "<comment 1a>",
      }));
      await commentRepository.add(testingCommentAddMutation({
        cardId: CARD_1_ID,
        id: COMMENT_2_ID,
        text: "<comment 1b>",
      }));
      await commentRepository.add(testingCommentAddMutation({
        cardId: CARD_2_ID,
        id: COMMENT_3_ID,
        text: "<comment 2>",
      }));

      const comments = await commentRepository.fetchByCardId(CARD_1_ID);

      // TODO: guarantee ordering?
      assertThat(comments, containsExactly(
        hasProperties({
          text: "<comment 1a>",
        }),
        hasProperties({
          text: "<comment 1b>",
        }),
      ));
    });
  });

  function testRepository(name: string, f: (fixtures: RepositoryFixtures) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();
      const categoryRepository = await fixtures.categoryRepository();
      await categoryRepository.add(categoriesTesting.testingCategoryAddMutation({
        id: CATEGORY_1_ID,
      }));
      await f(fixtures);
    });
  }
}

fileSuite(__filename, () => {
  suite("inMemory", () => {
    createCategoryRepositoryTests(repositoryFixturesInMemory);
  });

  suite("database", () => {
    createCategoryRepositoryTests(repositoryFixturesDatabase);
  });
});
