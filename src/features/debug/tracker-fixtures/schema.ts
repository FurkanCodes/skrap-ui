import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const debugTrackerFixtures = pgTable(
  "debug_tracker_fixtures",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    basePrice: text("base_price").notNull(),
    changedPrice: text("changed_price").notNull(),
    currency: text("currency").notNull(),
    baseStock: text("base_stock").notNull(),
    changedStock: text("changed_stock").notNull(),
    scenario: text("scenario").notNull(),
    changeAfterSeconds: integer("change_after_seconds").notNull(),
    cycleSeconds: integer("cycle_seconds").notNull(),
    startsAt: timestamp("starts_at"),
    includeNoise: boolean("include_noise").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("debug_tracker_fixtures_scenario_idx").on(table.scenario)],
);
