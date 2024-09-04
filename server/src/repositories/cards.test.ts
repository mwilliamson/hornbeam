import { assertThat, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { CardRepository } from "./cards";
import { testCardAddMutation } from "hornbeam-common/lib/app/cards.testing";
import { testCategoryAddMutation } from "hornbeam-common/lib/app/categories.testing";

const CARD_1_ID = "0191beb5-0000-79e7-8207-000000001001";
const CARD_2_ID = "0191beb5-0000-79e7-8207-000000001002";
const CARD_3_ID = "0191beb5-0000-79e7-8207-000000001003";
const CATEGORY_1_ID = "0191beb5-0000-79e7-8207-000000000001";

export function createCardsRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  suite("fetchById()", () => {
    testRepository("when there are no cards then fetchById() returns null", async (repository) => {
      const card = await repository.fetchById(CARD_1_ID);

      assertThat(card, equalTo(null));
    });

    testRepository("when there are cards then fetchById() returns card with matching ID", async (repository) => {
      await repository.add(testCardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_1_ID,
        text: "<card 1 text>",
      }));
      await repository.add(testCardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_2_ID,
        text: "<card 2 text>",
      }));
      await repository.add(testCardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_3_ID,
        text: "<card 3 text>",
      }));

      const card = await repository.fetchById(CARD_2_ID);

      assertThat(card, hasProperties({text: "<card 2 text>"}));
    });
  });

  function testRepository(name: string, f: (repository: CardRepository) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();

      const categoryRepository = await fixtures.categoryRepository();
      await categoryRepository.add(testCategoryAddMutation({
        id: CATEGORY_1_ID,
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
