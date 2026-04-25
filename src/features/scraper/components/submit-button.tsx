"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
  pending?: boolean;
}

export function SubmitButton({ idleLabel, pendingLabel, pending: pendingOverride }: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingOverride ?? formPending;

  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-36">
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
