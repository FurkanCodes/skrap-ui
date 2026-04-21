export const MIN_TRACK_INTERVAL_MINUTES = 1;
export const MAX_TRACK_INTERVAL_MINUTES = 10_080;

// Legacy sentinel used by temporary test-only interval mode.
export const TEST_INTERVAL_15_SECONDS_VALUE = 10_079;

const PLAN_MIN_INTERVAL_MINUTES = {
  free: 720,
  plus: 120,
  pro: 30,
} as const;

export function resolvePlanMinIntervalMinutes(planKey: string | null | undefined): number | null {
  const normalized = planKey?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized in PLAN_MIN_INTERVAL_MINUTES) {
    return PLAN_MIN_INTERVAL_MINUTES[normalized as keyof typeof PLAN_MIN_INTERVAL_MINUTES];
  }

  return null;
}

export function resolveEffectiveMinIntervalMinutes(input: {
  planKey: string | null | undefined;
  entitlementMinIntervalMinutes: number | null | undefined;
}): number {
  const entitlementMin = Number(input.entitlementMinIntervalMinutes);
  const safeEntitlementMin =
    Number.isInteger(entitlementMin) && entitlementMin > 0
      ? entitlementMin
      : MIN_TRACK_INTERVAL_MINUTES;
  const planMin = resolvePlanMinIntervalMinutes(input.planKey) ?? MIN_TRACK_INTERVAL_MINUTES;

  return Math.max(MIN_TRACK_INTERVAL_MINUTES, safeEntitlementMin, planMin);
}

export function getTrackIntervalValidationError(
  intervalMinutes: number,
  minIntervalMinutes: number
): string | null {
  if (!Number.isInteger(intervalMinutes)) {
    return "Interval must be a whole number of minutes.";
  }

  if (intervalMinutes === TEST_INTERVAL_15_SECONDS_VALUE) {
    return "15-second test interval is not allowed.";
  }

  if (
    intervalMinutes < minIntervalMinutes ||
    intervalMinutes > MAX_TRACK_INTERVAL_MINUTES
  ) {
    return `Interval must be between ${minIntervalMinutes} and ${MAX_TRACK_INTERVAL_MINUTES} minutes.`;
  }

  return null;
}
