import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  nestpawSql: ReturnType<typeof postgres> | undefined;
  nestpawDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add a Neon (or Postgres) connection string to store/.env.local",
    );
  }
  if (!globalForDb.nestpawDb) {
    // Keep the pool tiny — Next build/dev can spawn many workers.
    globalForDb.nestpawSql = postgres(url, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    globalForDb.nestpawDb = drizzle(globalForDb.nestpawSql, { schema });
  }
  return globalForDb.nestpawDb;
}

export type Db = ReturnType<typeof getDb>;
