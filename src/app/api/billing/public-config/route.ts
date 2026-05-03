import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PaddleEnvironment = "sandbox" | "production";

interface PaddlePublicConfigResponse {
  token: string;
  environment: PaddleEnvironment;
}

export async function GET(): Promise<NextResponse> {
  const token = readEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", "PADDLE_CLIENT_TOKEN");
  if (!token) {
    return NextResponse.json(
      { detail: "Paddle client token is not configured on the server. Set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN or PADDLE_CLIENT_TOKEN for the running Next.js container." },
      { status: 500 }
    );
  }

  const environment = resolveEnvironment();
  const response: PaddlePublicConfigResponse = {
    token,
    environment,
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function resolveEnvironment(): PaddleEnvironment {
  const publicEnv = readEnv("NEXT_PUBLIC_PADDLE_ENV")?.toLowerCase();
  if (publicEnv === "production") {
    return "production";
  }

  const serverEnv = readEnv("PADDLE_ENV")?.toLowerCase();
  if (serverEnv === "production") {
    return "production";
  }

  return "sandbox";
}

function readEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return null;
}
