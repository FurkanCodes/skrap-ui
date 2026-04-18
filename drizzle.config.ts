import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.BETTER_AUTH_DATABASE_URL?.trim() ||
  process.env.SUPABASE_DB_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "Database URL is required for drizzle-kit. Set DATABASE_URL (or BETTER_AUTH_DATABASE_URL / SUPABASE_DB_URL)."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
