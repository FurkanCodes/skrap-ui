import { NextResponse } from "next/server";

import {
  getDebugTrackerFixture,
  normalizeFixtureId,
  sanitizeFixtureInput,
  upsertDebugTrackerFixture,
} from "@/features/debug/tracker-fixtures/fixtures";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<unknown>;
};

function getFixtureUrl(request: Request, fixtureId: string): string {
  const url = new URL("/debug/test-product", request.url);
  url.searchParams.set("fixture", fixtureId);
  return url.toString();
}

export async function GET(request: Request, { params }: RouteContext) {
  const rawParams = await params;
  const rawId =
    rawParams && typeof rawParams === "object" && "id" in rawParams
      ? (rawParams as { id?: unknown }).id
      : null;
  const id = normalizeFixtureId(rawId);
  if (!id) {
    return NextResponse.json({ detail: "Invalid fixture id." }, { status: 400 });
  }

  const fixture = await getDebugTrackerFixture(id);
  if (!fixture) {
    return NextResponse.json({ detail: "Fixture not found." }, { status: 404 });
  }

  return NextResponse.json({
    item: fixture,
    url: getFixtureUrl(request, fixture.id),
  });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const rawParams = await params;
  const rawId =
    rawParams && typeof rawParams === "object" && "id" in rawParams
      ? (rawParams as { id?: unknown }).id
      : null;
  const id = normalizeFixtureId(rawId);
  if (!id) {
    return NextResponse.json({ detail: "Invalid fixture id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON payload." }, { status: 400 });
  }

  const existing = await getDebugTrackerFixture(id);
  const fixture = sanitizeFixtureInput({ ...(body as object), id }, existing ?? undefined);
  if (!fixture) {
    return NextResponse.json({ detail: "Invalid tracker fixture." }, { status: 400 });
  }

  const saved = await upsertDebugTrackerFixture(fixture);
  return NextResponse.json({
    item: saved,
    url: getFixtureUrl(request, saved.id),
  });
}
