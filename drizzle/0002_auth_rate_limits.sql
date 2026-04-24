CREATE TABLE IF NOT EXISTS "auth_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
