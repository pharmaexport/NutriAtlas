import { createPool } from "@vercel/postgres";

export function isDatabaseConfigured() {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

export function getDb() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Database is not configured. Set POSTGRES_URL or DATABASE_URL.");
  }

  return createPool({ connectionString });
}
