import "server-only";

const TRACKED_ITEMS_TAG_PREFIX = "tracked-items";

export function getTrackedItemsTag(userId: string): string {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error("userId is required to build tracked-items cache tag");
  }
  return `${TRACKED_ITEMS_TAG_PREFIX}:${normalizedUserId}`;
}

