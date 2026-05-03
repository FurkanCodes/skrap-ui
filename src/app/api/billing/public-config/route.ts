import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PaddleEnvironment = "sandbox" | "production";

interface PaddlePublicConfigResponse {
  token: string;
  environment: PaddleEnvironment;
}

export async function GET(): Promise<NextResponse> {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { detail: "Paddle client token is not configured on the server." },
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
  const publicEnv = process.env.NEXT_PUBLIC_PADDLE_ENV?.trim().toLowerCase();
  if (publicEnv === "production") {
    return "production";
  }

  const serverEnv = process.env.PADDLE_ENV?.trim().toLowerCase();
  if (serverEnv === "production") {
    return "production";
  }

  return "sandbox";
}
