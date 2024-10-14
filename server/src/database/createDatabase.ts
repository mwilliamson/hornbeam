import { Client } from "pg";

export default async function createDatabase(databaseUrl: string) {
  const client = new Client(databaseUrl);
  await client.connect();
  try {
    // TODO: use an enum for the card status?

    await client.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        email_address text NOT NULL,
        password_salt text NOT NULL,
        password_hash text NOT NULL
      );

      CREATE UNIQUE INDEX uq__users__email_address ON users(email_address);

      CREATE TABLE projects (
        id uuid PRIMARY KEY,
        name text NOT NULL
      );

      CREATE TABLE categories (
        created_at timestamptz NOT NULL,
        id uuid PRIMARY KEY,
        index int NOT NULL,
        name text NOT NULL,
        preset_color_id uuid NOT NULL,
        project_id uuid NOT NULL REFERENCES projects(id)
      );

      CREATE UNIQUE INDEX uq__categories__index ON categories(project_id, index);

      CREATE TABLE cards (
        category_id uuid NOT NULL REFERENCES categories(id),
        created_at timestamptz NOT NULL,
        id uuid PRIMARY KEY,
        index int NOT NULL,
        is_subboard_root bool NOT NULL,
        number int NOT NULL,
        parent_card_id uuid NULL REFERENCES cards(id),
        project_id uuid NOT NULL REFERENCES projects(id),
        status text NOT NULL,
        text text NOT NULL
      );

      CREATE UNIQUE INDEX uq__cards__index ON cards(project_id, index);
      CREATE UNIQUE INDEX uq__cards__number ON cards(project_id, number);

      CREATE TABLE comments (
        card_id uuid NOT NULL REFERENCES cards(id),
        created_at timestamptz NOT NULL,
        id uuid PRIMARY KEY,
        text text NOT NULL
      );

      CREATE INDEX ix__comments__card_id ON comments(card_id);

      CREATE TABLE effect_log (
        id uuid PRIMARY KEY,
        index int NOT NULL,
        effect jsonb NOT NULL
      );

      CREATE UNIQUE INDEX ix__effect_log__index ON effect_log(index);
    `);
  } finally {
    await client.end();
  }
}
