import { Category, CategoryAddMutation, CategoryReorderMutation } from "hornbeam-common/lib/app/categories";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";

export interface CategoryRepository {
  add: (mutation: CategoryAddMutation) => Promise<void>;
  reorder: (mutation: CategoryReorderMutation) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Category>>;
}

export class CategoryRepositoryInMemory implements CategoryRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(mutation: CategoryAddMutation): Promise<void> {
    this.snapshot.update(snapshot => snapshot.categoryAdd(mutation));
  }

  async reorder(mutation: CategoryReorderMutation): Promise<void> {
    this.snapshot.update(snapshot => snapshot.categoryReorder(mutation));
  }

  async fetchAll(): Promise<ReadonlyArray<Category>> {
    return this.snapshot.value.allCategories();
  }
}

export class CategoryRepositoryDatabase implements CategoryRepository {
  private readonly database: Database;

  constructor(database: Database) {
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
      // TODO: handle missing IDs
      await transaction.updateTable("categories")
        .set(({fn, ref, val}) => ({
          index: fn<number>("array_position", [val(mutation.ids), ref("categories.id")])
        }))
        .execute();
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
