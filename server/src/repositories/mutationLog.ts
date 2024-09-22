import { ProjectContentsMutation } from "hornbeam-common/lib/app/snapshots";
import { SerializedProjectContentsMutation } from "hornbeam-common/lib/serialization/app";
import { Database } from "../database";
import { JsonValue } from "../database/types";
import { deserialize } from "hornbeam-common/lib/serialization/deserialize";

interface LoggedMutation {
  id: string;
  mutation: ProjectContentsMutation;
}

export interface MutationLogRepository {
  add: (id: string, mutation: ProjectContentsMutation) => Promise<number>;
  fetchAll: () => Promise<ReadonlyArray<LoggedMutation>>;
}

export class MutationLogRepositoryInMemory implements MutationLogRepository {
  private readonly mutations: Array<LoggedMutation> = [];

  async add(id: string, mutation: ProjectContentsMutation): Promise<number> {
    this.mutations.push({id, mutation});

    return this.mutations.length - 1;
  }

  async fetchAll(): Promise<ReadonlyArray<LoggedMutation>> {
    return Array.from(this.mutations);
  }
}

export class MutationLogRepositoryDatabase implements MutationLogRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(id: string, mutation: ProjectContentsMutation): Promise<number> {
    const row = await this.database.insertInto("mutationLog")
      .values((eb) => ({
        id: id,
        index: eb.selectFrom("mutationLog")
          .select(
            eb.fn.coalesce(
              eb(eb.fn.max("mutationLog.index"), "+", 1),
              eb.lit(0)
            ).as("index")
          ),
        mutation: SerializedProjectContentsMutation.encode(mutation) as JsonValue,
      }))
      .returning("index")
      .executeTakeFirstOrThrow();

    return row.index;
  }

  async fetchAll(): Promise<ReadonlyArray<LoggedMutation>> {
    const mutationRows = await this.database.selectFrom("mutationLog")
      .select(["id", "mutation"])
      .orderBy("index")
      .execute();

    return mutationRows.map(mutationRow => ({
      id: mutationRow.id,
      mutation: deserialize(SerializedProjectContentsMutation, mutationRow.mutation),
    }));
  }
}
