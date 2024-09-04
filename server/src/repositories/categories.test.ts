import { assertThat, containsExactly, deepEqualTo, hasProperties, isSequence } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { presetColorGreen, presetColorRed } from "hornbeam-common/lib/app/colors";
import { CategoryRepository } from "./categories";
import * as categoriesTesting from "hornbeam-common/lib/app/categories.testing";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";

const CATEGORY_1_ID = "0191be9e-f6df-7507-9e6b-000000000001";
const CATEGORY_2_ID = "0191be9e-f6df-7507-9e6b-000000000002";
const CATEGORY_3_ID = "0191be9e-f6df-7507-9e6b-000000000003";

export function createCategoryRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  suite("fetchAll()", () => {
    testRepository("no categories", async (repository) => {
      const categories = await repository.fetchAll();

      assertThat(categories, containsExactly());
    });

    testRepository("can fetch categories after they're added", async (repository) => {
      await repository.add(categoriesTesting.testCategoryAddMutation({
        color: {presetColorId: presetColorRed.id},
        id: CATEGORY_1_ID,
        name: "<category 1 name>",
      }));

      await repository.add(categoriesTesting.testCategoryAddMutation({
        color: {presetColorId: presetColorGreen.id},
        id: CATEGORY_2_ID,
        name: "<category 2 name>",
      }));

      const categories = await repository.fetchAll();

      assertThat(categories, containsExactly(
        hasProperties({
          color: deepEqualTo({presetColorId: presetColorRed.id}),
          id: CATEGORY_1_ID,
          name: "<category 1 name>",
        }),
        hasProperties({
          color: deepEqualTo({presetColorId: presetColorGreen.id}),
          id: CATEGORY_2_ID,
          name: "<category 2 name>",
        }),
      ));
    });

    testRepository("categories are fetched in order they're added", async (repository) => {
      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: CATEGORY_1_ID,
        name: "<category 1 name>",
      }));

      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: CATEGORY_2_ID,
        name: "<category 2 name>",
      }));

      const categories = await repository.fetchAll();

      assertThat(categories, isSequence(
        hasProperties({name: "<category 1 name>"}),
        hasProperties({name: "<category 2 name>"}),
      ));
    });

    testRepository("categories can be reordered", async (repository) => {
      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: CATEGORY_1_ID,
        name: "<category 1 name>",
      }));

      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: CATEGORY_2_ID,
        name: "<category 2 name>",
      }));

      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: CATEGORY_3_ID,
        name: "<category 3 name>",
      }));

      await repository.reorder(categoriesTesting.testCategoryReorderMutation({
        ids: [CATEGORY_2_ID, CATEGORY_1_ID, CATEGORY_3_ID],
      }));

      const categories = await repository.fetchAll();

      assertThat(categories, isSequence(
        hasProperties({name: "<category 2 name>"}),
        hasProperties({name: "<category 1 name>"}),
        hasProperties({name: "<category 3 name>"}),
      ));
    });
  });

  function testRepository(name: string, f: (categories: CategoryRepository) => Promise<void>) {
    test(name, async () => {
      await using fixtures = await createFixtures();
      await f(await fixtures.categoryRepository());
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
