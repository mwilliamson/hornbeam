import { Instant } from "@js-joda/core";
import { assertThat, containsExactly, hasProperties } from "@mwilliamson/precisely";
import { suite, test } from "mocha";
import { uuidv7 } from "uuidv7";
import { presetColorWhite } from "hornbeam-common/lib/app/colors";
import { CategoryRepository, CategoryRepositoryDatabase, CategoryRepositoryInMemory } from "./categories";
import { initialAppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { withTemporaryDatabase } from "../database/withTemporaryDatabase";
import { testDatabaseUrl } from "../settings";
import * as pg from "pg";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { DB } from "../database/types";

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
      const database = new Kysely<DB>({
        dialect: new PostgresDialect({
          pool: new pg.Pool({connectionString})
        }),
        plugins: [
          new CamelCasePlugin(),
        ],
      });
      try {
        const repository = new CategoryRepositoryDatabase(database);
        await f(repository);
      } finally {
        await database.destroy();
      }
    });
  },
);
