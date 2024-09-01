import "dotenv/config";

export function testDatabaseUrl(): string {
  const databaseUrl = process.env.TEST_DATABASE_URL;

  if (databaseUrl === undefined) {
    throw new Error("Missing TEST_DATABASE_URL");
  }

  return databaseUrl;
}
