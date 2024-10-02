import { Project, ProjectAddEffect } from "hornbeam-common/lib/app/projects";
import { AppSnapshotRef } from "./snapshotRef";
import { Database } from "../database";
import { appEffects } from "hornbeam-common/lib/app/snapshots";

export interface ProjectRepository {
  add: (effect: ProjectAddEffect) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Project>>;
}

export class ProjectRepositoryInMemory implements ProjectRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  public async add(effect: ProjectAddEffect): Promise<void> {
    this.snapshot.applyEffect(appEffects.projectAdd(effect));
  }

  public async fetchAll(): Promise<ReadonlyArray<Project>> {
    return this.snapshot.value.allProjects();
  }
}

export class ProjectRepositoryDatabase implements ProjectRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  public async add(mutation: ProjectAddEffect): Promise<void> {
    await this.database.insertInto("projects")
      .values({
        id: mutation.id,
        name: mutation.name,
      })
      .execute();
  }

  public async fetchAll(): Promise<ReadonlyArray<Project>> {
    const rows = await this.database.selectFrom("projects")
      .select(["id", "name"])
      .execute();

    return rows.map(row => ({
      id: row.id,
      name: row.name,
    }));
  }
}
