import { AppEffect } from "hornbeam-common/lib/app/snapshots";
import { SerializedAppEffect } from "hornbeam-common/lib/serialization/app";
import { Database } from "../database";
import { JsonValue } from "../database/types";
import { deserialize } from "hornbeam-common/lib/serialization/deserialize";

interface LoggedEffect {
  id: string;
  effect: AppEffect;
}

export interface EffectLogRepository {
  add: (id: string, effect: AppEffect) => Promise<number>;
  fetchLatestIndex: () => Promise<number>;
  fetchAll: () => Promise<ReadonlyArray<LoggedEffect>>;
}

export class EffectLogRepositoryInMemory implements EffectLogRepository {
  private readonly effects: Array<LoggedEffect> = [];

  async add(id: string, effect: AppEffect): Promise<number> {
    this.effects.push({id, effect});

    return this.effects.length;
  }

  async fetchLatestIndex(): Promise<number> {
    return this.effects.length;
  }

  async fetchAll(): Promise<ReadonlyArray<LoggedEffect>> {
    return Array.from(this.effects);
  }
}

export class EffectLogRepositoryDatabase implements EffectLogRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async add(id: string, effect: AppEffect): Promise<number> {
    const row = await this.database.insertInto("effectLog")
      .values((eb) => ({
        id: id,
        index: eb.selectFrom("effectLog")
          .select(
            eb.fn.coalesce(
              eb(eb.fn.max("effectLog.index"), "+", 1),
              eb.lit(1)
            ).as("index")
          ),
        effect: SerializedAppEffect.encode(effect) as JsonValue,
      }))
      .returning("index")
      .executeTakeFirstOrThrow();

    return row.index;
  }

  async fetchLatestIndex(): Promise<number> {
    const row = await this.database.selectFrom("effectLog")
      .select(eb => [eb.fn.coalesce(eb.fn.max("index"), eb.lit(0)).as("latestIndex")])
      .executeTakeFirstOrThrow();

    return row.latestIndex;
  }

  async fetchAll(): Promise<ReadonlyArray<LoggedEffect>> {
    const effectRows = await this.database.selectFrom("effectLog")
      .select(["id", "effect"])
      .orderBy("index")
      .execute();

    return effectRows.map(effectRow => ({
      id: effectRow.id,
      effect: deserialize(SerializedAppEffect, effectRow.effect),
    }));
  }
}
