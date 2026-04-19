"use client";

import { Check, Loader2, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ActionConfirmAlertProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirmPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionConfirmAlert({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isConfirmPending = false,
  onConfirm,
  onCancel,
}: ActionConfirmAlertProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4">
      <div className="w-full max-w-[560px]">
        <Alert className="flex items-center justify-between gap-4 border-border bg-card">
          <div className="min-w-0">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isConfirmPending}
              className="cursor-pointer"
            >
              <X className="size-4" />
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={isConfirmPending}
              className="cursor-pointer"
            >
              {isConfirmPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {confirmLabel}
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
}
