import { Instant } from "@js-joda/core";
import { assertThat, containsExactly, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { uuidv7 } from "uuidv7";
import { presetColorWhite } from "hornbeam-common/lib/app/colors";
import { CategoryRepository, CategoryRepositoryInMemory } from "./categories";
import { initialAppSnapshot } from "hornbeam-common/lib/app/snapshots";

export function createCategoryRepositoryTestSuite(
  name: string,
  createRepository: () => Promise<[CategoryRepository, () => Promise<void>]>,
): void {
  suite(name, () => {
    suite("fetchAll()", () => {
      testRepository("no categories", async (repository) => {
        const categories = await repository.fetchAll();

        assertThat(categories, containsExactly());
      });

      testRepository("multiple categories", async (repository) => {
        const category1Id = uuidv7();
        await repository.add({
          color: {presetColorId: presetColorWhite.id},
          createdAt: Instant.ofEpochSecond(0),
          id: category1Id,
          name: "<category 1 name>",
        });

        const category2Id = uuidv7();
        await repository.add({
          color: {presetColorId: presetColorWhite.id},
          createdAt: Instant.ofEpochSecond(60),
          id: category2Id,
          name: "<category 2 name>",
        });

        const categories = await repository.fetchAll();

        assertThat(categories, containsExactly(
          hasProperties({
            id: category1Id,
            name: "<category 1 name>",
          }),
          hasProperties({
            id: category2Id,
            name: "<category 2 name>",
          }),
        ));
      });
    });
  });

  function testRepository(name: string, f: (categories: CategoryRepository) => Promise<void>) {
    test(name, async () => {
      const [repository, tearDown] = await createRepository();

      try {
        await f(repository);
      } finally {
        await tearDown();
      }
    });
  }
}

createCategoryRepositoryTestSuite(
  "repositories/categories/inMemory",
  async () => [
    new CategoryRepositoryInMemory(initialAppSnapshot()),
    () => Promise.resolve(),
  ]
)
