"use client";

import {
  IconBell,
  IconClock,
  IconLink,
  IconPlus,
  IconSearch,
  IconShieldCheck,
  IconTrendingDown,
} from "@tabler/icons-react";
import { useState } from "react";

import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { Link } from "@/i18n/navigation";

const intervalOptions = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "360", label: "6 hours" },
  { value: "1440", label: "24 hours" },
];

export function TrackersDashboardUnauthenticated() {
  const [interval, setInterval] = useState("60");
  const [trackingMode, setTrackingMode] = useState<"alert" | "monitor">("alert");
  const [notifyIncrease, setNotifyIncrease] = useState(true);
  const [notifyStock, setNotifyStock] = useState(false);

  return (
    <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Product URL</CardTitle>
            <CardDescription>Add any product page to start tracking.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pb-4">
            <div className="relative">
              <IconLink className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" stroke={1.5} />
              <Input
                value="https://trendyol.com/example-product"
                readOnly
                className="h-10 pl-9"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-xs text-muted-foreground">Paste one URL or add multiple rows.</p>
            <Button size="sm" disabled>
              <IconPlus className="size-3.5" stroke={1.5} />
              Add
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracking mode</CardTitle>
            <CardDescription>Choose when Dealvinci should notify you.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-4">
            <button
              type="button"
              onClick={() => setTrackingMode("alert")}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/45"
            >
              <span className="flex items-center gap-3">
                <IconTrendingDown className="size-4 text-foreground" stroke={1.5} />
                <span>
                  <span className="block text-sm font-medium text-foreground">Price Alert</span>
                  <span className="block text-xs text-muted-foreground">Notify when target is reached.</span>
                </span>
              </span>
              <Radio checked={trackingMode === "alert"} readOnly aria-hidden="true" tabIndex={-1} />
            </button>
            <button
              type="button"
              onClick={() => setTrackingMode("monitor")}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/45"
            >
              <span className="flex items-center gap-3">
                <IconSearch className="size-4 text-foreground" stroke={1.5} />
                <span>
                  <span className="block text-sm font-medium text-foreground">Price Drop</span>
                  <span className="block text-xs text-muted-foreground">Notify on each detected drop.</span>
                </span>
              </span>
              <Radio checked={trackingMode === "monitor"} readOnly aria-hidden="true" tabIndex={-1} />
            </button>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-xs text-muted-foreground">Mode applies to new trackers.</p>
            <Link href="/auth/sign-in?next=/dashboard" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Sign in
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check interval</CardTitle>
            <CardDescription>Set how often prices should be refreshed.</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <AnimatedDropdown
              value={interval}
              onValueChange={setInterval}
              options={intervalOptions}
              className="w-40"
            />
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-xs text-muted-foreground">Higher plans unlock faster checks.</p>
            <Button size="sm" disabled>
              Save
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Control extra Telegram alerts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-4">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
              <span className="flex items-center gap-3">
                <IconBell className="size-4 text-foreground" stroke={1.5} />
                <span>
                  <span className="block text-sm font-medium text-foreground">Price increases</span>
                  <span className="block text-xs text-muted-foreground">Also notify when prices move up.</span>
                </span>
              </span>
              <Checkbox
                checked={notifyIncrease}
                onCheckedChange={(checked) => setNotifyIncrease(Boolean(checked))}
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
              <span className="flex items-center gap-3">
                <IconShieldCheck className="size-4 text-foreground" stroke={1.5} />
                <span>
                  <span className="block text-sm font-medium text-foreground">Stock changes</span>
                  <span className="block text-xs text-muted-foreground">Notify restock and stock-out events.</span>
                </span>
              </span>
              <Checkbox
                checked={notifyStock}
                onCheckedChange={(checked) => setNotifyStock(Boolean(checked))}
              />
            </label>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-xs text-muted-foreground">Telegram required for delivery.</p>
            <IconClock className="size-4 text-muted-foreground" stroke={1.5} />
          </CardFooter>
        </Card>
    </div>
  );
}
