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

      CREATE UNIQUE INDEX uq__categories__index ON categories(index);

      CREATE TABLE cards (
        category_id uuid NOT NULL REFERENCES categories(id),
        created_at timestamptz NOT NULL,
        id uuid PRIMARY KEY,
        index int NOT NULL,
        is_subboard_root BOOL NOT NULL,
        number int NOT NULL,
        parent_card_id uuid NULL REFERENCES cards(id),
        text text NOT NULL
      );

      CREATE UNIQUE INDEX uq__cards__index ON cards(index);
      CREATE UNIQUE INDEX uq__cards__number ON cards(number);
    `);
  } finally {
    await client.end();
  }
}
