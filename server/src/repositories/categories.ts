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
        .values((eb) => ({
          createdAt: new Date(mutation.createdAt.toEpochMilli()),
          id: mutation.id,
          index: eb.selectFrom("categories")
            .select(
              eb.fn.coalesce(
                eb(eb.fn.max("categories.index"), "+", 1),
                eb.lit(0)
              ).as("index")
            ),
          name: mutation.name,
          presetColorId: mutation.color.presetColorId,
        }))
        .execute();
    });
  }

  async reorder(mutation: CategoryReorderMutation): Promise<void> {
    await this.database.transaction().execute(async transaction => {
      // TODO: handle missing IDs

      // Renumber the indexes to negative values to avoid violating the unique
      // constraint on indexes.
      await transaction.updateTable("categories")
        .set((eb) => ({
          index: eb.neg(eb.ref("categories.index"))
        }))
        .execute();

      await transaction.updateTable("categories")
        .set((eb) => ({
          index: eb.fn<number>("array_position", [eb.val(mutation.ids), eb.ref("categories.id")])
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
