import { Category, CategoryAddRequest, CategoryReorderRequest } from "hornbeam-common/lib/app/categories";
import { AppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { Kysely } from "kysely";
import { DB } from "../database/types";

export interface CategoryRepository {
  add: (request: CategoryAddRequest) => Promise<void>;
  reorder: (request: CategoryReorderRequest) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Category>>;
}

export class CategoryRepositoryInMemory implements CategoryRepository {
  private snapshot: AppSnapshot;

  constructor(initialSnapshot: AppSnapshot) {
    this.snapshot = initialSnapshot;
  }

  async add(request: CategoryAddRequest): Promise<void> {
    this.snapshot = this.snapshot.categoryAdd(request);
  }

  async reorder(request: CategoryReorderRequest): Promise<void> {
    this.snapshot = this.snapshot.categoryReorder(request);
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

  async add(request: CategoryAddRequest): Promise<void> {
    await this.database.transaction().execute(async transaction => {
      await transaction.insertInto("categories")
        .values(({fn, selectFrom, lit}) => ({
          createdAt: new Date(request.createdAt.toEpochMilli()),
          id: request.id,
          index: selectFrom("categories")
            .select(fn.coalesce(fn.max("categories.index"), lit(0)).as("index")),
          name: request.name,
          presetColorId: request.color.presetColorId,
        }))
        .execute();
    });
  }

  async reorder(request: CategoryReorderRequest): Promise<void> {
    await this.database.transaction().execute(async transaction => {
      // TODO: investigate Kysely batch update support
      // See: https://github.com/kysely-org/kysely/issues/839
      let index = 0;
      for (const id of request.ids) {
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
