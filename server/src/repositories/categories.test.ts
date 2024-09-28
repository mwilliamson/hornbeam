import { assertThat, containsExactly, deepEqualTo, hasProperties, isSequence } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { presetColorGreen, presetColorRed } from "hornbeam-common/lib/app/colors";
import { CategoryRepository } from "./categories";
import * as categoriesTesting from "hornbeam-common/lib/app/categories.testing";
import { fileSuite } from "../testing";
import { RepositoryFixtures, repositoryFixturesDatabase, repositoryFixturesInMemory } from "./fixtures";
import { testingProjectAddMutation } from "hornbeam-common/lib/app/projects.testing";

const PROJECT_1_ID = "01923983-2f95-7d79-975f-000000010000";
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
      await repository.add(categoriesTesting.testingCategoryAddMutation({
        color: {presetColorId: presetColorRed.id},
        id: CATEGORY_1_ID,
        name: "<category 1 name>",
        projectId: PROJECT_1_ID,
      }));

      await repository.add(categoriesTesting.testingCategoryAddMutation({
        color: {presetColorId: presetColorGreen.id},
        id: CATEGORY_2_ID,
        name: "<category 2 name>",
        projectId: PROJECT_1_ID,
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
      await repository.add(categoriesTesting.testingCategoryAddMutation({
        id: CATEGORY_1_ID,
        name: "<category 1 name>",
        projectId: PROJECT_1_ID,
      }));

      await repository.add(categoriesTesting.testingCategoryAddMutation({
        id: CATEGORY_2_ID,
        name: "<category 2 name>",
        projectId: PROJECT_1_ID,
      }));

      const categories = await repository.fetchAll();

      assertThat(categories, isSequence(
        hasProperties({name: "<category 1 name>"}),
        hasProperties({name: "<category 2 name>"}),
      ));
    });

    testRepository("categories can be reordered", async (repository) => {
      await repository.add(categoriesTesting.testingCategoryAddMutation({
        id: CATEGORY_1_ID,
        name: "<category 1 name>",
        projectId: PROJECT_1_ID,
      }));

      await repository.add(categoriesTesting.testingCategoryAddMutation({
        id: CATEGORY_2_ID,
        name: "<category 2 name>",
        projectId: PROJECT_1_ID,
      }));

      await repository.add(categoriesTesting.testingCategoryAddMutation({
        id: CATEGORY_3_ID,
        name: "<category 3 name>",
        projectId: PROJECT_1_ID,
      }));

      await repository.reorder(categoriesTesting.testingCategoryReorderMutation({
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

      const projectRepository = await fixtures.projectRepository();
      await projectRepository.add(testingProjectAddMutation({
        id: PROJECT_1_ID,
      }));

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
