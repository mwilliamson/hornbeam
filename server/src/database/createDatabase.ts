import { Client } from "pg";

export default async function createDatabase(databaseUrl: string) {
  const client = new Client(databaseUrl);
  await client.connect();
  try {
    // TODO: use an enum for the card status?

    await client.query(`
      CREATE TABLE projects (
        id uuid PRIMARY KEY,
        name text NOT NULL
      );

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
        is_subboard_root bool NOT NULL,
        number int NOT NULL,
        parent_card_id uuid NULL REFERENCES cards(id),
        status text NOT NULL,
        text text NOT NULL
      );

      CREATE UNIQUE INDEX uq__cards__index ON cards(index);
      CREATE UNIQUE INDEX uq__cards__number ON cards(number);

      CREATE TABLE comments (
        card_id uuid NOT NULL REFERENCES cards(id),
        created_at timestamptz NOT NULL,
        id uuid PRIMARY KEY,
        text text NOT NULL
      );

      CREATE INDEX ix__comments__card_id ON comments(card_id);

      CREATE TABLE mutation_log (
        id uuid PRIMARY KEY,
        index int NOT NULL,
        mutation jsonb NOT NULL
      );

      CREATE UNIQUE INDEX ix__mutation_log__index ON mutation_log(index);
    `);
  } finally {
    await client.end();
  }
}
