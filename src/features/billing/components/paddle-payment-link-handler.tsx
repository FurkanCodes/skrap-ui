"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { localizePathname } from "@/i18n/paths";
import type { AppLocale } from "@/i18n/routing";

interface PaddlePaymentLinkHandlerProps {
  locale: AppLocale;
}

interface ReadonlySearchParams {
  get(name: string): string | null;
}

const PADDLE_TRANSACTION_PARAM = "_ptxn";

export function PaddlePaymentLinkHandler({ locale }: PaddlePaymentLinkHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const transactionId = readTransactionId(searchParams);
    if (!transactionId) {
      return;
    }

    const checkoutPath = localizePathname("/billing/checkout", locale);
    if (pathname === checkoutPath) {
      return;
    }

    const params = new URLSearchParams();
    params.set(PADDLE_TRANSACTION_PARAM, transactionId);
    router.replace(`${checkoutPath}?${params.toString()}`, { scroll: false });
  }, [locale, pathname, router, searchParams]);

  return null;
}

function readTransactionId(searchParams: ReadonlySearchParams): string | null {
  const transactionId = searchParams.get(PADDLE_TRANSACTION_PARAM)?.trim() ?? "";
  return transactionId.startsWith("txn_") ? transactionId : null;
}
