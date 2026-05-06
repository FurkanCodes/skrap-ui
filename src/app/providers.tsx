"use client";

import type { ComponentProps } from "react";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PaddlePaymentLinkHandler } from "@/features/billing/components/paddle-payment-link-handler";

interface AppProvidersProps {
  children: React.ReactNode;
  messages: ComponentProps<typeof NextIntlClientProvider>["messages"];
}

export function AppProviders({ children, messages }: AppProvidersProps) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Suspense fallback={null}>
            <PaddlePaymentLinkHandler locale="en" />
          </Suspense>
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
