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
  const tokenState = readEnvState("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", "PADDLE_CLIENT_TOKEN");
  const token = tokenState.value;
  if (!token) {
    const diagnostics = {
      build: "paddle-public-config-v2",
      tokenVars: tokenState.diagnostics,
      environmentVars: readEnvState("NEXT_PUBLIC_PADDLE_ENV", "PADDLE_ENV").diagnostics,
    };
    console.warn("[billing-public-config] Paddle client token missing", diagnostics);
    return NextResponse.json(
      {
        detail:
          "Paddle client token is not configured in the running Next.js container.",
        diagnostics,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Dealvinci-Billing-Config": "paddle-public-config-v2",
        },
      }
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
      "X-Dealvinci-Billing-Config": "paddle-public-config-v2",
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
  return readEnvState(...names).value;
}

function readEnvState(...names: string[]): {
  value: string | null;
  diagnostics: Record<string, { present: boolean; length: number }>;
} {
  const diagnostics: Record<string, { present: boolean; length: number }> = {};
  let firstValue: string | null = null;

  for (const name of names) {
    const value = process.env[name]?.trim();
    diagnostics[name] = {
      present: Boolean(value),
      length: value?.length ?? 0,
    };
    if (value) {
      firstValue ??= value;
    }
  }

  return {
    value: firstValue,
    diagnostics,
  };
}
