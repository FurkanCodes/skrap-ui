import { NextResponse } from "next/server";

import {
  listDebugTrackerFixtures,
  sanitizeFixtureInput,
  seedDefaultDebugTrackerFixtures,
  upsertDebugTrackerFixture,
} from "@/features/debug/tracker-fixtures/fixtures";

export const runtime = "nodejs";

function getFixtureUrl(request: Request, fixtureId: string): string {
  const url = new URL("/debug/test-product", request.url);
  url.searchParams.set("fixture", fixtureId);
  return url.toString();
}

export async function GET(request: Request) {
  const fixtures = await listDebugTrackerFixtures();

  return NextResponse.json({
    items: fixtures.map((fixture) => ({
      ...fixture,
      url: getFixtureUrl(request, fixture.id),
    })),
  });
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("seed") === "defaults") {
    const fixtures = await seedDefaultDebugTrackerFixtures();
    return NextResponse.json({
      items: fixtures.map((fixture) => ({
        ...fixture,
        url: getFixtureUrl(request, fixture.id),
      })),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON payload." }, { status: 400 });
  }

  const fixture = sanitizeFixtureInput(body);
  if (!fixture) {
    return NextResponse.json({ detail: "Invalid tracker fixture." }, { status: 400 });
  }

  const saved = await upsertDebugTrackerFixture(fixture);
  return NextResponse.json(
    {
      item: saved,
      url: getFixtureUrl(request, saved.id),
    },
    { status: 201 }
  );
}
