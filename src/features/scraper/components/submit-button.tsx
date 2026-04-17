"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
}

export function SubmitButton({ idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-36">
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
