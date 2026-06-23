import { createPool } from "@vercel/postgres";

export const db = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

export function isDatabaseConfigured() {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}
