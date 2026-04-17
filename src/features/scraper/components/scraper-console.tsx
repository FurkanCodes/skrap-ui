"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FORM_VALUES, FETCH_MODES, INITIAL_SCRAPER_STATE } from "@/features/scraper/constants";
import { ScraperResults } from "@/features/scraper/components/scraper-results";
import { SubmitButton } from "@/features/scraper/components/submit-button";
import { runScraperAction } from "@/features/scraper/server/actions";
import type { EndpointMode, FetchMode } from "@/features/scraper/types";
import { splitByWhitespace } from "@/features/scraper/utils";

const JOB_TYPES: Array<{
  value: EndpointMode;
  title: string;
  description: string;
}> = [
  {
    value: "scrapes",
    title: "Scrape product pages",
    description: "Best when you already have exact product URLs.",
  },
  {
    value: "discover",
    title: "Discover then scrape",
    description: "Use start URLs and let Skrap crawl to find matching pages.",
  },
];

const FETCH_MODE_HELPERS: Record<FetchMode, string> = {
  auto: "Skrap picks the best mode per URL.",
  http: "Fastest path for static HTML pages.",
  dynamic: "Use browser rendering for JavaScript-heavy pages.",
  stealth: "Extra anti-bot evasion when sites are aggressive.",
};

function endpointLabel(endpointMode: EndpointMode): string {
  return endpointMode === "discover" ? "Discover" : "Scrape";
}

function PendingRunStatus({ mode }: { mode: EndpointMode }) {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  const label = endpointLabel(mode);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground"
    >
      Running {label.toLowerCase()} job. This can take a few seconds depending on URL depth.
    </div>
  );
}

export function ScraperConsole() {
  const [state, formAction] = useActionState(runScraperAction, INITIAL_SCRAPER_STATE);

  const [endpointMode, setEndpointMode] = useState<EndpointMode>(DEFAULT_FORM_VALUES.endpointMode);
  const [urls, setUrls] = useState(DEFAULT_FORM_VALUES.urls);
  const [sites, setSites] = useState(DEFAULT_FORM_VALUES.sites);
  const [timeoutSeconds, setTimeoutSeconds] = useState(DEFAULT_FORM_VALUES.timeoutSeconds);
  const [fetchMode, setFetchMode] = useState<FetchMode>(DEFAULT_FORM_VALUES.fetchMode);
  const [maxPages, setMaxPages] = useState(DEFAULT_FORM_VALUES.maxPages);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_FORM_VALUES.maxDepth);

  const parsedUrlCount = useMemo(() => splitByWhitespace(urls).length, [urls]);
  const currentJobLabel = endpointLabel(endpointMode);
  const isUrlError = state.error?.toLowerCase().includes("url") ?? false;

  return (
    <>
      <Card className="gap-5">
        <CardHeader className="gap-2">
          <CardTitle className="text-xl font-semibold tracking-tight">Run a Job</CardTitle>
          <CardDescription>
            Choose a job type, paste product URLs, then run and inspect normalized output.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" action={formAction} noValidate>
            <input type="hidden" name="endpointMode" value={endpointMode} />
            <input type="hidden" name="fetchMode" value={fetchMode} />

            <div className="grid gap-3">
              <Label className="text-sm font-medium">What do you want to run?</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {JOB_TYPES.map((jobType) => {
                  const isSelected = endpointMode === jobType.value;

                  return (
                    <button
                      key={jobType.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setEndpointMode(jobType.value)}
                      className={cn(
                        "rounded-lg border px-3 py-3 text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-foreground/20 hover:bg-muted/40"
                      )}
                    >
                      <p className="text-sm font-semibold text-foreground">{jobType.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{jobType.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {state.error ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {state.error}
              </div>
            ) : null}

            <PendingRunStatus mode={endpointMode} />

            <div className="grid gap-2">
              <Label htmlFor="urls">Product URLs</Label>
              <Textarea
                id="urls"
                name="urls"
                className="min-h-32"
                value={urls}
                onChange={(event) => setUrls(event.target.value)}
                placeholder="https://www.epey.com/akilli-telefonlar/huawei-pura-70.html"
                spellCheck={false}
                aria-invalid={isUrlError}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <p>Paste one URL per line, or separate multiple URLs with spaces.</p>
                <p className="tabular-nums">Detected: {parsedUrlCount}</p>
              </div>
            </div>

            <div className="grid gap-4 rounded-lg border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Request options</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="sites">Site adapter keys (optional)</Label>
                  <Input
                    id="sites"
                    name="sites"
                    value={sites}
                    onChange={(event) => setSites(event.target.value)}
                    placeholder="generic"
                    spellCheck={false}
                    maxLength={200}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fetch-mode">Fetch strategy</Label>
                  <Select
                    value={fetchMode}
                    onValueChange={(value) => setFetchMode(value as FetchMode)}
                  >
                    <SelectTrigger id="fetch-mode" className="w-full">
                      <SelectValue placeholder="Choose strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {FETCH_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{FETCH_MODE_HELPERS[fetchMode]}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timeout-seconds">Timeout (seconds, optional)</Label>
                  <Input
                    id="timeout-seconds"
                    name="timeoutSeconds"
                    inputMode="numeric"
                    value={timeoutSeconds}
                    onChange={(event) => setTimeoutSeconds(event.target.value)}
                    placeholder="5"
                    min={1}
                    max={120}
                    step={1}
                    pattern="[0-9]*"
                  />
                </div>
              </div>

              {endpointMode === "discover" ? (
                <div className="grid gap-4 border-t border-border/70 pt-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="max-pages">Max pages (1-300)</Label>
                    <Input
                      id="max-pages"
                      name="maxPages"
                      inputMode="numeric"
                      value={maxPages}
                      onChange={(event) => setMaxPages(event.target.value)}
                      placeholder="50"
                      min={1}
                      max={300}
                      step={1}
                      pattern="[0-9]*"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="max-depth">Max depth (0-5)</Label>
                    <Input
                      id="max-depth"
                      name="maxDepth"
                      inputMode="numeric"
                      value={maxDepth}
                      onChange={(event) => setMaxDepth(event.target.value)}
                      placeholder="0"
                      min={0}
                      max={5}
                      step={1}
                      pattern="[0-9]*"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <input type="hidden" name="maxPages" value={maxPages} />
                  <input type="hidden" name="maxDepth" value={maxDepth} />
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Ready to run {currentJobLabel.toLowerCase()}.</p>
                <p className="text-xs text-muted-foreground">
                  {endpointMode === "discover"
                    ? "Use depth 0 to discover broadly with scrape-like runtime."
                    : "Use discover mode when you need link crawling before extraction."}
                </p>
              </div>
              <SubmitButton
                idleLabel={`Run ${currentJobLabel}`}
                pendingLabel={`Running ${currentJobLabel}...`}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {state.response ? <ScraperResults response={state.response} /> : null}
    </>
  );
}
