import { Instant } from "@js-joda/core";
import { assertThat, containsExactly, deepEqualTo, hasProperties, isSequence } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { uuidv7 } from "uuidv7";
import { presetColorGreen, presetColorRed } from "hornbeam-common/lib/app/colors";
import { CategoryRepository, CategoryRepositoryDatabase, CategoryRepositoryInMemory } from "./categories";
import { initialAppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { withTemporaryDatabase } from "../database/withTemporaryDatabase";
import { testDatabaseUrl } from "../settings";
import { databaseConnect } from "../database";

export function createCategoryRepositoryTestSuite(
  name: string,
  withRepository: (
    f: (repository: CategoryRepository) => Promise<void>
  ) => Promise<void>,
): void {
  suite(name, () => {
    suite("fetchAll()", () => {
      testRepository("no categories", async (repository) => {
        const categories = await repository.fetchAll();

        assertThat(categories, containsExactly());
      });

      testRepository("can fetch categories after they're added", async (repository) => {
        const category1Id = uuidv7();
        await repository.add({
          color: {presetColorId: presetColorRed.id},
          createdAt: Instant.ofEpochSecond(0),
          id: category1Id,
          name: "<category 1 name>",
        });

        const category2Id = uuidv7();
        await repository.add({
          color: {presetColorId: presetColorGreen.id},
          createdAt: Instant.ofEpochSecond(60),
          id: category2Id,
          name: "<category 2 name>",
        });

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
        await repository.add({
          color: {presetColorId: presetColorRed.id},
          createdAt: Instant.ofEpochSecond(0),
          id: category1Id,
          name: "<category 1 name>",
        });

        const category2Id = uuidv7();
        await repository.add({
          color: {presetColorId: presetColorGreen.id},
          createdAt: Instant.ofEpochSecond(60),
          id: category2Id,
          name: "<category 2 name>",
        });

        const categories = await repository.fetchAll();

        assertThat(categories, isSequence(
          hasProperties({name: "<category 1 name>"}),
          hasProperties({name: "<category 2 name>"}),
        ));
      });

      testRepository("categories can be reordered", async (repository) => {
        const category1Id = uuidv7();
        await repository.add({
          color: {presetColorId: presetColorRed.id},
          createdAt: Instant.ofEpochSecond(0),
          id: category1Id,
          name: "<category 1 name>",
        });

        const category2Id = uuidv7();
        await repository.add({
          color: {presetColorId: presetColorGreen.id},
          createdAt: Instant.ofEpochSecond(60),
          id: category2Id,
          name: "<category 2 name>",
        });

        const category3Id = uuidv7();
        await repository.add({
          color: {presetColorId: presetColorGreen.id},
          createdAt: Instant.ofEpochSecond(120),
          id: category3Id,
          name: "<category 3 name>",
        });

        await repository.reorder({
          ids: [category2Id, category1Id, category3Id],
          createdAt: Instant.ofEpochSecond(180),
        });

        const categories = await repository.fetchAll();

        assertThat(categories, isSequence(
          hasProperties({name: "<category 2 name>"}),
          hasProperties({name: "<category 1 name>"}),
          hasProperties({name: "<category 3 name>"}),
        ));
      });
    });
  });

  function testRepository(name: string, f: (categories: CategoryRepository) => Promise<void>) {
    test(name, async () => {
      await withRepository(f);
    });
  }
}

createCategoryRepositoryTestSuite(
  "repositories/categories/inMemory",
  async (f) => f(new CategoryRepositoryInMemory(initialAppSnapshot()))
);

createCategoryRepositoryTestSuite(
  "repositories/categories/database",
  async (f) => {
    await withTemporaryDatabase(testDatabaseUrl(), async connectionString => {
      const database = await databaseConnect(connectionString);

      try {
        const repository = new CategoryRepositoryDatabase(database);
        await f(repository);
      } finally {
        await database.destroy();
      }
    });
  },
);
