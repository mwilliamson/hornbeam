import { Instant } from "@js-joda/core";
import { assertThat, containsExactly, deepEqualTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import * as categoriesTesting from "hornbeam-common/lib/app/categories.testing";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { testingCardAddMutation } from "hornbeam-common/lib/app/cards.testing";

const CARD_1_ID = "0191beb5-0000-79e7-8207-000000001001";
const CARD_2_ID = "0191beb5-0000-79e7-8207-000000001002";
const CATEGORY_1_ID = "0191be9e-f6df-7507-9e6b-000000000001";

export function createCardHistoryFetcherTests(
  createFixtures: () => RepositoryFixtures,
): void {
  testFetcher("card initially has created at entry", async (fixtures) => {
    const cardRepository = await fixtures.cardRepository();
    const cardHistoryFetcher = await fixtures.cardHistoryFetcher();

    await cardRepository.add(testingCardAddMutation({
      categoryId: CATEGORY_1_ID,
      createdAt: Instant.ofEpochSecond(1713386548),
      id: CARD_1_ID,
    }));
    await cardRepository.add(testingCardAddMutation({
      categoryId: CATEGORY_1_ID,
      createdAt: Instant.ofEpochSecond(1713386549),
      id: CARD_2_ID,
    }));

    const cardHistory = await cardHistoryFetcher.fetchCardHistoryById(CARD_1_ID);

    assertThat(cardHistory, containsExactly(
      hasProperties({
        type: "created",
        instant: deepEqualTo(Instant.ofEpochSecond(1713386548)),
      }),
    ));
  });

  function testFetcher(name: string, f: (fixtures: RepositoryFixtures) => Promise<void>) {
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
    createCardHistoryFetcherTests(repositoryFixturesInMemory);
  });

  suite("database", () => {
    createCardHistoryFetcherTests(repositoryFixturesDatabase);
  });
});
