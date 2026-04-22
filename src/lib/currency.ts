const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  TRY: "₺",
  INR: "₹",
  RUB: "₽",
  KRW: "₩",
  BRL: "R$",
  CHF: "Fr",
};
const DEFAULT_NUMBER_LOCALE = "en-US";

function coerceAmountToNumber(amount: number | string | null | undefined): number | null {
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? amount : null;
  }

  if (typeof amount !== "string") {
    return null;
  }

  const trimmed = amount.trim();
  if (!trimmed) {
    return null;
  }

  const cleaned = trimmed.replace(/[^\d,.\-]/g, "");
  if (!cleaned) {
    return null;
  }

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    const decimalSeparator = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".") ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    const normalized = cleaned.split(thousandsSeparator).join("").replace(decimalSeparator, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (hasComma) {
    const parts = cleaned.split(",");
    const normalized =
      parts.length === 2 && parts[1].length <= 2
        ? `${parts[0]}.${parts[1]}`
        : cleaned.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSymbolPrefix(symbol: string): string {
  return symbol.length > 1 ? `${symbol} ` : symbol;
}

export function normalizeCurrencyCode(currency: string | null | undefined): string | null {
  const code = (currency ?? "").trim().toUpperCase();
  return code || null;
}

export function getCurrencySymbol(currency: string | null | undefined): string | null {
  const code = normalizeCurrencyCode(currency);
  if (!code) {
    return null;
  }
  return CURRENCY_SYMBOLS[code] ?? null;
}

export function formatCurrencyAmount(
  amount: number | string | null | undefined,
  currency: string | null | undefined,
  options?: {
    fallback?: string;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    locale?: string | string[];
  }
): string {
  const fallback = options?.fallback ?? "—";
  const code = normalizeCurrencyCode(currency);
  const symbol = getCurrencySymbol(code);
  const numericAmount = coerceAmountToNumber(amount);

  if (numericAmount !== null) {
    const formatted = new Intl.NumberFormat(options?.locale ?? DEFAULT_NUMBER_LOCALE, {
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    }).format(numericAmount);

    if (symbol) {
      return `${getSymbolPrefix(symbol)}${formatted}`;
    }

    if (code) {
      return `${formatted} ${code}`;
    }

    return formatted;
  }

  if (typeof amount === "string" && amount.trim().length > 0) {
    const rawAmount = amount.trim();
    if (symbol) {
      return `${getSymbolPrefix(symbol)}${rawAmount}`;
    }
    if (code) {
      return `${rawAmount} ${code}`;
    }
    return rawAmount;
  }

  return fallback;
}
