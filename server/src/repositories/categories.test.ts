import { assertThat, containsExactly, deepEqualTo, hasProperties, isSequence } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { uuidv7 } from "uuidv7";
import { presetColorGreen, presetColorRed } from "hornbeam-common/lib/app/colors";
import { CategoryRepository } from "./categories";
import * as categoriesTesting from "hornbeam-common/lib/app/categories.testing";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";

export function createCategoryRepositoryTests(
  createFixtures: () => RepositoryFixtures,
): void {
  suite("fetchAll()", () => {
    testRepository("no categories", async (repository) => {
      const categories = await repository.fetchAll();

      assertThat(categories, containsExactly());
    });

    testRepository("can fetch categories after they're added", async (repository) => {
      const category1Id = uuidv7();
      await repository.add(categoriesTesting.testCategoryAddMutation({
        color: {presetColorId: presetColorRed.id},
        id: category1Id,
        name: "<category 1 name>",
      }));

      const category2Id = uuidv7();
      await repository.add(categoriesTesting.testCategoryAddMutation({
        color: {presetColorId: presetColorGreen.id},
        id: category2Id,
        name: "<category 2 name>",
      }));

      const categories = await repository.fetchAll();

      assertThat(categories, containsExactly(
        hasProperties({
          color: deepEqualTo({presetColorId: presetColorRed.id}),
          id: category1Id,
          name: "<category 1 name>",
        }),
        hasProperties({
          color: deepEqualTo({presetColorId: presetColorGreen.id}),
          id: category2Id,
          name: "<category 2 name>",
        }),
      ));
    });

    testRepository("categories are fetched in order they're added", async (repository) => {
      const category1Id = uuidv7();
      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: category1Id,
        name: "<category 1 name>",
      }));

      const category2Id = uuidv7();
      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: category2Id,
        name: "<category 2 name>",
      }));

      const categories = await repository.fetchAll();

      assertThat(categories, isSequence(
        hasProperties({name: "<category 1 name>"}),
        hasProperties({name: "<category 2 name>"}),
      ));
    });

    testRepository("categories can be reordered", async (repository) => {
      const category1Id = uuidv7();
      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: category1Id,
        name: "<category 1 name>",
      }));

      const category2Id = uuidv7();
      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: category2Id,
        name: "<category 2 name>",
      }));

      const category3Id = uuidv7();
      await repository.add(categoriesTesting.testCategoryAddMutation({
        id: category3Id,
        name: "<category 3 name>",
      }));

      await repository.reorder(categoriesTesting.testCategoryReorderMutation({
        ids: [category2Id, category1Id, category3Id],
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
