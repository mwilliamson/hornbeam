import { AppEffect } from "hornbeam-common/lib/app/snapshots";
import { SerializedAppEffect } from "hornbeam-common/lib/serialization/app";
import { Database } from "../database";
import { JsonValue } from "../database/types";
import { deserialize } from "hornbeam-common/lib/serialization/deserialize";

// TODO: rename mutation to effect

interface LoggedMutation {
  id: string;
  mutation: AppEffect;
}

export interface MutationLogRepository {
  add: (id: string, mutation: AppEffect) => Promise<number>;
  fetchLatestIndex: () => Promise<number>;
  fetchAll: () => Promise<ReadonlyArray<LoggedMutation>>;
}

export class MutationLogRepositoryInMemory implements MutationLogRepository {
  private readonly mutations: Array<LoggedMutation> = [];

  async add(id: string, mutation: AppEffect): Promise<number> {
    this.mutations.push({id, mutation});

    return this.mutations.length;
  }

  async fetchLatestIndex(): Promise<number> {
    return this.mutations.length;
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

  async add(id: string, mutation: AppEffect): Promise<number> {
    const row = await this.database.insertInto("mutationLog")
      .values((eb) => ({
        id: id,
        index: eb.selectFrom("mutationLog")
          .select(
            eb.fn.coalesce(
              eb(eb.fn.max("mutationLog.index"), "+", 1),
              eb.lit(1)
            ).as("index")
          ),
        mutation: SerializedAppEffect.encode(mutation) as JsonValue,
      }))
      .returning("index")
      .executeTakeFirstOrThrow();

    return row.index;
  }

  async fetchLatestIndex(): Promise<number> {
    const row = await this.database.selectFrom("mutationLog")
      .select(eb => [eb.fn.coalesce(eb.fn.max("index"), eb.lit(0)).as("latestIndex")])
      .executeTakeFirstOrThrow();

    return row.latestIndex;
  }

  async fetchAll(): Promise<ReadonlyArray<LoggedMutation>> {
    const mutationRows = await this.database.selectFrom("mutationLog")
      .select(["id", "mutation"])
      .orderBy("index")
      .execute();

    return mutationRows.map(mutationRow => ({
      id: mutationRow.id,
      mutation: deserialize(SerializedAppEffect, mutationRow.mutation),
    }));
  }
}
