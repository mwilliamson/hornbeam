import { Category, CategoryAddMutation, CategoryReorderMutation } from "hornbeam-common/lib/app/categories";
import { AppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { Kysely } from "kysely";
import { DB } from "../database/types";

export interface CategoryRepository {
  add: (mutation: CategoryAddMutation) => Promise<void>;
  reorder: (mutation: CategoryReorderMutation) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Category>>;
}

export class CategoryRepositoryInMemory implements CategoryRepository {
  private snapshot: AppSnapshot;

  constructor(initialSnapshot: AppSnapshot) {
    this.snapshot = initialSnapshot;
  }

  async add(mutation: CategoryAddMutation): Promise<void> {
    this.snapshot = this.snapshot.categoryAdd(mutation);
  }

  async reorder(mutation: CategoryReorderMutation): Promise<void> {
    this.snapshot = this.snapshot.categoryReorder(mutation);
  }

  async fetchAll(): Promise<ReadonlyArray<Category>> {
    return this.snapshot.allCategories();
  }
}

export class CategoryRepositoryDatabase implements CategoryRepository {
  private readonly database: Kysely<DB>;

  constructor(database: Kysely<DB>) {
    this.database = database;
  }

  async add(mutation: CategoryAddMutation): Promise<void> {
    await this.database.transaction().execute(async transaction => {
      await transaction.insertInto("categories")
        .values(({fn, selectFrom, lit}) => ({
          createdAt: new Date(mutation.createdAt.toEpochMilli()),
          id: mutation.id,
          index: selectFrom("categories")
            .select(fn.coalesce(fn.max("categories.index"), lit(0)).as("index")),
          name: mutation.name,
          presetColorId: mutation.color.presetColorId,
        }))
        .execute();
    });
  }

  async reorder(mutation: CategoryReorderMutation): Promise<void> {
    await this.database.transaction().execute(async transaction => {
      // TODO: investigate Kysely batch update support
      // See: https://github.com/kysely-org/kysely/issues/839
      let index = 0;
      for (const id of mutation.ids) {
        await transaction.updateTable("categories")
          .set({index})
          .where("categories.id", "=", id)
          .execute();
        index++;
      }
    });
  }

  async fetchAll(): Promise<ReadonlyArray<Category>> {
    const categoryRows = await this.database.selectFrom("categories")
      .select(["id", "name", "presetColorId"])
      .orderBy("index")
      .execute();

    return categoryRows.map(categoryRow => ({
      color: {presetColorId: categoryRow.presetColorId},
      id: categoryRow.id,
      name: categoryRow.name,
    }));
  }
}
