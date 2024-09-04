import { Client } from "pg";

export default async function createDatabase(databaseUrl: string) {
  const client = new Client(databaseUrl);
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE categories (
        created_at timestamptz NOT NULL,
        id uuid PRIMARY KEY,
        index int NOT NULL,
        name text NOT NULL,
        preset_color_id uuid NOT NULL
      );

      CREATE TABLE cards (
        category_id uuid NOT NULL REFERENCES categories(id),
        created_at timestamptz NOT NULL,
        id uuid PRIMARY KEY,
        index int NOT NULL,
        text text NOT NULL
      );
    `);
  } finally {
    await client.end();
  }
}
