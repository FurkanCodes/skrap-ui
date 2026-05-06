"use client";

import { Suspense } from "react";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PaddlePaymentLinkHandler } from "@/features/billing/components/paddle-payment-link-handler";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
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
  );
}
