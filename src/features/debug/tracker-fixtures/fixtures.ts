import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { debugTrackerFixtures } from "./schema";

export type DebugTrackerScenario = "static" | "drop" | "increase" | "stock_out" | "restock";
export type DebugTrackerStock = "in_stock" | "out_of_stock" | "preorder" | "limited";

export interface DebugTrackerFixtureInput {
  id: string;
  name: string;
  basePrice: string;
  changedPrice: string;
  currency: string;
  baseStock: DebugTrackerStock;
  changedStock: DebugTrackerStock;
  scenario: DebugTrackerScenario;
  changeAfterSeconds: number;
  cycleSeconds: number;
  startsAt: Date | null;
  includeNoise: boolean;
}

export type DebugTrackerFixture = DebugTrackerFixtureInput & {
  createdAt: Date;
  updatedAt: Date;
};

type DebugTrackerFixtureRow = typeof debugTrackerFixtures.$inferSelect;

export const DEFAULT_DEBUG_FIXTURES: DebugTrackerFixtureInput[] = [
  {
    id: "price-drop",
    name: "Tracker DB Price Drop",
    basePrice: "9999",
    changedPrice: "6999",
    currency: "TRY",
    baseStock: "in_stock",
    changedStock: "in_stock",
    scenario: "drop",
    changeAfterSeconds: 300,
    cycleSeconds: 600,
    startsAt: null,
    includeNoise: true,
  },
  {
    id: "price-increase",
    name: "Tracker DB Price Increase",
    basePrice: "6999",
    changedPrice: "9999",
    currency: "TRY",
    baseStock: "in_stock",
    changedStock: "in_stock",
    scenario: "increase",
    changeAfterSeconds: 300,
    cycleSeconds: 600,
    startsAt: null,
    includeNoise: true,
  },
  {
    id: "stock-out",
    name: "Tracker DB Stock Out",
    basePrice: "9999",
    changedPrice: "9999",
    currency: "TRY",
    baseStock: "in_stock",
    changedStock: "out_of_stock",
    scenario: "stock_out",
    changeAfterSeconds: 300,
    cycleSeconds: 600,
    startsAt: null,
    includeNoise: true,
  },
  {
    id: "restock",
    name: "Tracker DB Restock",
    basePrice: "9999",
    changedPrice: "9999",
    currency: "TRY",
    baseStock: "out_of_stock",
    changedStock: "in_stock",
    scenario: "restock",
    changeAfterSeconds: 300,
    cycleSeconds: 600,
    startsAt: null,
    includeNoise: true,
  },
];

const SCENARIOS = new Set<DebugTrackerScenario>([
  "static",
  "drop",
  "increase",
  "stock_out",
  "restock",
]);

const STOCKS = new Set<DebugTrackerStock>([
  "in_stock",
  "out_of_stock",
  "preorder",
  "limited",
]);

export function normalizeFixtureId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const id = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{1,63}$/.test(id) ? id : null;
}

export function sanitizeFixtureInput(
  value: unknown,
  fallback?: DebugTrackerFixtureInput
): DebugTrackerFixtureInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = normalizeFixtureId(record.id ?? fallback?.id);
  if (!id) {
    return null;
  }

  const text = (key: string, defaultValue: string) =>
    typeof record[key] === "string" && record[key].trim()
      ? record[key].trim()
      : defaultValue;

  const integer = (key: string, defaultValue: number) => {
    const parsed = Number(record[key]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
  };

  const scenario = text("scenario", fallback?.scenario ?? "static") as DebugTrackerScenario;
  const baseStock = text("baseStock", fallback?.baseStock ?? "in_stock") as DebugTrackerStock;
  const changedStock = text(
    "changedStock",
    fallback?.changedStock ?? "out_of_stock"
  ) as DebugTrackerStock;
  const startsAt =
    typeof record.startsAt === "string" && record.startsAt.trim()
      ? new Date(record.startsAt)
      : fallback?.startsAt ?? null;

  if (
    !SCENARIOS.has(scenario) ||
    !STOCKS.has(baseStock) ||
    !STOCKS.has(changedStock) ||
    (startsAt && Number.isNaN(startsAt.getTime()))
  ) {
    return null;
  }

  return {
    id,
    name: text("name", fallback?.name ?? "Tracker DB Fixture"),
    basePrice: text("basePrice", fallback?.basePrice ?? "9999"),
    changedPrice: text("changedPrice", fallback?.changedPrice ?? "7999"),
    currency: text("currency", fallback?.currency ?? "TRY").toUpperCase(),
    baseStock,
    changedStock,
    scenario,
    changeAfterSeconds: integer(
      "changeAfterSeconds",
      fallback?.changeAfterSeconds ?? 300
    ),
    cycleSeconds: integer("cycleSeconds", fallback?.cycleSeconds ?? 600),
    startsAt,
    includeNoise:
      typeof record.includeNoise === "boolean"
        ? record.includeNoise
        : fallback?.includeNoise ?? false,
  };
}

function toDebugTrackerFixture(row: DebugTrackerFixtureRow): DebugTrackerFixture {
  return {
    ...row,
    scenario: row.scenario as DebugTrackerScenario,
    baseStock: row.baseStock as DebugTrackerStock,
    changedStock: row.changedStock as DebugTrackerStock,
  };
}

export async function getDebugTrackerFixture(
  id: string
): Promise<DebugTrackerFixture | null> {
  const [fixture] = await getDb()
    .select()
    .from(debugTrackerFixtures)
    .where(eq(debugTrackerFixtures.id, id))
    .limit(1);

  return fixture ? toDebugTrackerFixture(fixture) : null;
}

export async function listDebugTrackerFixtures(): Promise<DebugTrackerFixture[]> {
  const fixtures = await getDb().select().from(debugTrackerFixtures);
  return fixtures.map(toDebugTrackerFixture);
}

export async function upsertDebugTrackerFixture(
  fixture: DebugTrackerFixtureInput
): Promise<DebugTrackerFixture> {
  const [saved] = await getDb()
    .insert(debugTrackerFixtures)
    .values(fixture)
    .onConflictDoUpdate({
      target: debugTrackerFixtures.id,
      set: {
        name: fixture.name,
        basePrice: fixture.basePrice,
        changedPrice: fixture.changedPrice,
        currency: fixture.currency,
        baseStock: fixture.baseStock,
        changedStock: fixture.changedStock,
        scenario: fixture.scenario,
        changeAfterSeconds: fixture.changeAfterSeconds,
        cycleSeconds: fixture.cycleSeconds,
        startsAt: fixture.startsAt,
        includeNoise: fixture.includeNoise,
        updatedAt: new Date(),
      },
    })
    .returning();

  return toDebugTrackerFixture(saved);
}

export async function seedDefaultDebugTrackerFixtures(): Promise<DebugTrackerFixture[]> {
  const results: DebugTrackerFixture[] = [];
  for (const fixture of DEFAULT_DEBUG_FIXTURES) {
    results.push(await upsertDebugTrackerFixture(fixture));
  }
  return results;
}
