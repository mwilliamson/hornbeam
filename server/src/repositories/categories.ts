import { Category, CategoryAddEffect, CategoryReorderEffect } from "hornbeam-common/lib/app/categories";
import { Database } from "../database";
import { AppSnapshotRef } from "./snapshotRef";
import { appEffects } from "hornbeam-common/lib/app/snapshots";

export interface CategoryRepository {
  add: (effect: CategoryAddEffect) => Promise<void>;
  reorder: (effect: CategoryReorderEffect) => Promise<void>;
  fetchAllByProjectId: (projectId: string) => Promise<ReadonlyArray<Category>>;
}

export class CategoryRepositoryInMemory implements CategoryRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  async add(effect: CategoryAddEffect): Promise<void> {
    this.snapshot.applyEffect(appEffects.categoryAdd(effect));
  }

  async reorder(effect: CategoryReorderEffect): Promise<void> {
    this.snapshot.applyEffect(appEffects.categoryReorder(effect));
  }

  async fetchAllByProjectId(projectId: string): Promise<ReadonlyArray<Category>> {
    return this.snapshot.value.fetchProjectContents(projectId).allCategories();
  }
}

export class CategoryRepositoryDatabase implements CategoryRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(effect: CategoryAddEffect): Promise<void> {
    await this.database.insertInto("categories")
      .values((eb) => ({
        createdAt: new Date(effect.createdAt.toEpochMilli()),
        id: effect.id,
        index: eb.selectFrom("categories")
          .select(
            eb.fn.coalesce(
              eb(eb.fn.max("categories.index"), "+", 1),
              eb.lit(0)
            ).as("index")
          )
          .where("categories.projectId", "=", effect.projectId),
        name: effect.name,
        presetColorId: effect.color.presetColorId,
        projectId: effect.projectId,
      }))
      .execute();
  }

  async reorder(effect: CategoryReorderEffect): Promise<void> {
    // TODO: handle missing IDs

    // Renumber the indexes to negative values to avoid violating the unique
    // constraint on indexes.
    await this.database.updateTable("categories")
      .set((eb) => ({
        index: eb.neg(eb.ref("categories.index"))
      }))
      .where("projectId", "=", effect.projectId)
      .execute();

    await this.database.updateTable("categories")
      .set((eb) => ({
        index: eb.fn<number>("array_position", [eb.val(effect.ids), eb.ref("categories.id")])
      }))
      .where("projectId", "=", effect.projectId)
      .execute();
  }

  async fetchAllByProjectId(projectId: string): Promise<ReadonlyArray<Category>> {
    const categoryRows = await this.database.selectFrom("categories")
      .select(["id", "name", "presetColorId", "projectId"])
      .where("projectId", "=", projectId)
      .orderBy("index")
      .execute();

    return categoryRows.map(categoryRow => ({
      color: {presetColorId: categoryRow.presetColorId},
      id: categoryRow.id,
      name: categoryRow.name,
      projectId: categoryRow.projectId,
    }));
  }
}
