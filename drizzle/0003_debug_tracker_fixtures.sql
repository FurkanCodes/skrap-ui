CREATE TABLE IF NOT EXISTS "debug_tracker_fixtures" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"base_price" text NOT NULL,
	"changed_price" text NOT NULL,
	"currency" text NOT NULL,
	"base_stock" text NOT NULL,
	"changed_stock" text NOT NULL,
	"scenario" text NOT NULL,
	"change_after_seconds" integer NOT NULL,
	"cycle_seconds" integer NOT NULL,
	"starts_at" timestamp,
	"include_noise" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "debug_tracker_fixtures_scenario_idx"
	ON "debug_tracker_fixtures" ("scenario");
