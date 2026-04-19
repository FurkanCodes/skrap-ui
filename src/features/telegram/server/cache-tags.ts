import "server-only";

const TELEGRAM_STATUS_TAG_PREFIX = "telegram-status";

export function getTelegramStatusTag(userId: string): string {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error("userId is required to build telegram status cache tag");
  }
  return `${TELEGRAM_STATUS_TAG_PREFIX}:${normalizedUserId}`;
}
