import { Project, ProjectAddMutation } from "hornbeam-common/lib/app/projects";
import { AppSnapshotRef } from "./snapshotRef";
import { Database } from "../database";

export interface ProjectRepository {
  add: (mutation: ProjectAddMutation) => Promise<void>;
  fetchAll: () => Promise<ReadonlyArray<Project>>;
}

export class ProjectRepositoryInMemory implements ProjectRepository {
  private readonly snapshot: AppSnapshotRef;

  constructor(snapshot: AppSnapshotRef) {
    this.snapshot = snapshot;
  }

  public async add(mutation: ProjectAddMutation): Promise<void> {
    this.snapshot.mutate({
      type: "projectAdd",
      projectAdd: mutation,
    });
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

  public async add(mutation: ProjectAddMutation): Promise<void> {
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
