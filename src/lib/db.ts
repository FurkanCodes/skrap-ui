import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.BETTER_AUTH_DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim();
  if (!url) {
    throw new Error(
      "Database URL is required. Set DATABASE_URL (or BETTER_AUTH_DATABASE_URL / SUPABASE_DB_URL)."
    );
  }
  return url;
}

export function getDb() {
  if (_db) {
    return _db;
  }

  const databaseUrl = resolveDatabaseUrl();
  _sql = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // Supabase transaction pooler (PgBouncer) is incompatible with named
    // prepared statements. Disable to avoid prepared statement collisions.
    prepare: false,
  });
  _db = drizzle(_sql);
  return _db;
}
