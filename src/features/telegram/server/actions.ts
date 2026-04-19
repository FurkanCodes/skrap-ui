"use server";

import { revalidatePath } from "next/cache";

import { getBackendJson, postBackendJson } from "@/features/scraper/server/backend-client";
import type {
  TelegramActiveStatusResponse,
  TelegramConnectStartResponse,
  TelegramConnectStatusResponse,
} from "@/features/telegram/types";
import { requireSession } from "@/lib/server-auth";

function normalizeConnectState(state: string): string {
  const normalized = state.trim();
  if (!normalized) {
    throw new Error("Connect state is required.");
  }
  return normalized;
}

export async function startTelegramConnectAction(): Promise<TelegramConnectStartResponse> {
  await requireSession();

  return postBackendJson<TelegramConnectStartResponse, Record<string, never>>(
    "/api/v1/integrations/telegram/connect",
    {},
    { auth: true }
  );
}

export async function checkTelegramConnectStatusAction(
  state: string
): Promise<TelegramConnectStatusResponse> {
  await requireSession();

  const normalizedState = normalizeConnectState(state);
  const status = await getBackendJson<TelegramConnectStatusResponse>(
    `/api/v1/integrations/telegram/connect/${encodeURIComponent(normalizedState)}`,
    { auth: true, cache: "no-store" }
  );

  if (status.status === "connected") {
    revalidatePath("/", "page");
  }

  return status;
}

export async function refreshTelegramStatusAction(): Promise<TelegramActiveStatusResponse> {
  await requireSession();

  return getBackendJson<TelegramActiveStatusResponse>("/api/v1/integrations/telegram/status", {
    auth: true,
    cache: "no-store",
  });
}
