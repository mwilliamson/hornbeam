import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import * as pg from "pg";
import { DB } from "./types";

export type Database = Kysely<DB>;

export async function databaseConnect(connectionString: string): Promise<Database> {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({connectionString})
    }),
    plugins: [
      new CamelCasePlugin(),
    ],
  });
}
