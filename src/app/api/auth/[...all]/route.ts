import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

function getHandlers() {
  return toNextJsHandler(getAuth());
}

export async function GET(...args: Parameters<ReturnType<typeof getHandlers>["GET"]>) {
  const handlers = getHandlers();
  return handlers.GET(...args);
}

export async function POST(...args: Parameters<ReturnType<typeof getHandlers>["POST"]>) {
  const handlers = getHandlers();
  return handlers.POST(...args);
}
