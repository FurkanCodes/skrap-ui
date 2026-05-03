"use client";

import { useEffect, useRef } from "react";
import type { PaddleEventData } from "@paddle/paddle-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { loadPaddle, subscribePaddleEvents } from "@/features/billing/client/paddle-js";
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
  const openedTransactionRef = useRef<string | null>(null);

  useEffect(() => {
    const transactionId = readTransactionId(searchParams);
    if (!transactionId || openedTransactionRef.current === transactionId) {
      return;
    }

    let disposed = false;
    openedTransactionRef.current = transactionId;

    const clearPaymentLinkParam = () => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete(PADDLE_TRANSACTION_PARAM);
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    const unsubscribe = subscribePaddleEvents((event) => {
      if (!isTransactionEvent(event, transactionId)) {
        return;
      }

      if (event.name === "checkout.completed") {
        void syncCompletedTransaction(transactionId).finally(() => {
          if (!disposed) {
            router.push(localizePathname("/settings", locale));
          }
        });
        return;
      }

      if (event.name === "checkout.closed") {
        openedTransactionRef.current = null;
        clearPaymentLinkParam();
      }
    });

    void loadPaddle()
      .then((paddle) => {
        if (disposed) {
          return;
        }
        paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "overlay",
          },
        });
      })
      .catch((error) => {
        openedTransactionRef.current = null;
        console.error("[paddle-payment-link]", {
          outcome: "open_failed",
          transactionId,
          message: error instanceof Error ? error.message : "Could not open Paddle checkout.",
        });
      });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [locale, pathname, router, searchParams]);

  return null;
}

function readTransactionId(searchParams: ReadonlySearchParams): string | null {
  const transactionId = searchParams.get(PADDLE_TRANSACTION_PARAM)?.trim() ?? "";
  return transactionId.startsWith("txn_") ? transactionId : null;
}

function isTransactionEvent(event: PaddleEventData, transactionId: string): boolean {
  const eventTransactionId = event.data?.transaction_id;
  return !eventTransactionId || eventTransactionId === transactionId;
}

async function syncCompletedTransaction(transactionId: string): Promise<void> {
  try {
    await fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ transactionId }),
    });
  } catch (error) {
    console.warn("[paddle-payment-link]", {
      outcome: "sync_failed",
      transactionId,
      message: error instanceof Error ? error.message : "Could not sync Paddle transaction.",
    });
  }
}
