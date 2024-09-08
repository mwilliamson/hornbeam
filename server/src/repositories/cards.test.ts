import { Instant } from "@js-joda/core";
import { assertThat, containsExactly, deepEqualTo, equalTo, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { CardRepository } from "./cards";
import { testingCardAddMutation } from "hornbeam-common/lib/app/cards.testing";
import { testingCategoryAddMutation } from "hornbeam-common/lib/app/categories.testing";
import { CardAddMutation } from "hornbeam-common/lib/app/cards";

const CARD_1_ID = "0191beb5-0000-79e7-8207-000000001001";
const CARD_2_ID = "0191beb5-0000-79e7-8207-000000001002";
const CARD_3_ID = "0191beb5-0000-79e7-8207-000000001003";
const CARD_4_ID = "0191beb5-0000-79e7-8207-000000001004";
const CARD_5_ID = "0191beb5-0000-79e7-8207-000000001005";
const CATEGORY_1_ID = "0191beb5-0000-79e7-8207-000000000001";
const CATEGORY_2_ID = "0191beb5-0000-79e7-8207-000000000002";

export function createCardsRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  suite("fetchById()", () => {
    testRepository("when there are no cards then fetchById() returns null", async (repository) => {
      const card = await repository.fetchById(CARD_1_ID);

      assertThat(card, equalTo(null));
    });

    testRepository("when there are cards then fetchById() returns card with matching ID", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        text: "<card 1 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        text: "<card 2 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
        text: "<card 3 text>",
      }));

      const card = await repository.fetchById(CARD_2_ID);

      assertThat(card, hasProperties({text: "<card 2 text>"}));
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
      }));

      const card = await repository.fetchParentByChildId(CARD_1_ID);

      assertThat(card, equalTo(null));
    });

    testRepository("when card has parent then fetchParentByChildId() returns parent", async (repository) => {
      const parent1Id = CARD_1_ID;
      await repository.add(cardAddMutation({
        id: parent1Id,
        text: "<parent card 1>",
      }));
      const parent2Id = CARD_2_ID;
      await repository.add(cardAddMutation({
        id: parent2Id,
        text: "<parent card 2>",
      }));
      const child1Id = CARD_3_ID;
      await repository.add(cardAddMutation({
        id: child1Id,
        parentCardId: parent1Id,
        text: "<child card 1>",
      }));
      const child2Id = CARD_4_ID;
      await repository.add(cardAddMutation({
        id: child2Id,
        parentCardId: parent2Id,
        text: "<child card 2>",
      }));

      const card = await repository.fetchParentByChildId(child2Id);

      assertThat(card, hasProperties({text: "<parent card 2>"}));
    });
  });

  suite("field persistence", () => {
    testRepository("text", async (repository) => {
      await repository.add(cardAddMutation({
        id: CARD_1_ID,
        text: "<card 1 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_2_ID,
        text: "<card 2 text>",
      }));
      await repository.add(cardAddMutation({
        id: CARD_3_ID,
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
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        categoryId: CATEGORY_1_ID,
        id: CARD_2_ID,
        text: "<card 2>",
      }));
      await repository.add(cardAddMutation({
        categoryId: CATEGORY_2_ID,
        id: CARD_3_ID,
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
        text: "<card 1>",
      }));
      await repository.add(cardAddMutation({
        createdAt: Instant.ofEpochSecond(2000),
        id: CARD_2_ID,
        text: "<card 2>",
      }));
      await repository.add(cardAddMutation({
        createdAt: Instant.ofEpochSecond(3000),
        id: CARD_3_ID,
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
        text: "<parent card 1>",
      }));

      const parentCard2Id = CARD_2_ID;
      await repository.add(cardAddMutation({
        id: parentCard2Id,
        parentCardId: null,
        text: "<parent card 2>",
      }));

      const childCard1Id = CARD_3_ID;
      await repository.add(cardAddMutation({
        id: childCard1Id,
        parentCardId: parentCard1Id,
        text: "<child card 1>",
      }));
      const childCard2Id = CARD_4_ID;
      await repository.add(cardAddMutation({
        id: childCard2Id,
        parentCardId: parentCard1Id,
        text: "<child card 2>",
      }));
      const childCard3Id = CARD_5_ID;
      await repository.add(cardAddMutation({
        id: childCard3Id,
        parentCardId: parentCard2Id,
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

  function cardAddMutation(mutation: Partial<CardAddMutation>): CardAddMutation {
    return testingCardAddMutation({
      categoryId: CATEGORY_1_ID,
      ...mutation,
    });
  }

  function testRepository(name: string, f: (repository: CardRepository) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();

      const categoryRepository = await fixtures.categoryRepository();
      await categoryRepository.add(testingCategoryAddMutation({
        id: CATEGORY_1_ID,
      }));
      await categoryRepository.add(testingCategoryAddMutation({
        id: CATEGORY_2_ID,
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
