import { Category, CategoryAddRequest } from "hornbeam-common/lib/app/categories";
import { AppSnapshot } from "hornbeam-common/lib/app/snapshots";
import { Kysely } from "kysely";
import { DB } from "../database/types";
import { presetColorWhite } from "hornbeam-common/lib/app/colors";

export interface CategoryRepository {
  add: (request: CategoryAddRequest) => Promise<void>;
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
    await this.database.insertInto("categories")
      .values({
        createdAt: new Date(request.createdAt.toEpochMilli()),
        id: request.id,
        name: request.name,
      })
      .execute();
  }

  async fetchAll(): Promise<ReadonlyArray<Category>> {
    const categoryRows = await this.database.selectFrom("categories")
      .select(["id", "name"])
      .execute();

    return categoryRows.map(categoryRow => ({
      color: {presetColorId: presetColorWhite.id},
      id: categoryRow.id,
      name: categoryRow.name,
    }));
  }
}
