"use client";

import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { cn } from "@/lib/utils";
import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FORM_VALUES, FETCH_MODES, INITIAL_SCRAPER_STATE } from "@/features/scraper/constants";
import { ScraperResults } from "@/features/scraper/components/scraper-results";
import { SubmitButton } from "@/features/scraper/components/submit-button";
import type {
  DiscoverRequest,
  EndpointMode,
  FetchMode,
  ScrapeJobCreateResponse,
  ScrapeJobStatus,
  ScrapeJobStatusResponse,
  ScraperActionState,
  ScraperFormValues,
  ScrapesRequest,
} from "@/features/scraper/types";
import { extractUrls } from "@/features/scraper/utils";

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
    description: "Use start URLs and let Dealvinci crawl to find matching pages.",
  },
];

const FETCH_MODE_HELPERS: Record<FetchMode, string> = {
  auto: "Dealvinci picks the best mode per URL.",
  http: "Fastest path for static HTML pages.",
  dynamic: "Use browser rendering for JavaScript-heavy pages.",
  stealth: "Extra anti-bot evasion when sites are aggressive.",
};

function endpointLabel(endpointMode: EndpointMode): string {
  return endpointMode === "discover" ? "Discover" : "Scrape";
}

function PendingRunStatus({
  mode,
  jobId,
  status,
}: {
  mode: EndpointMode;
  jobId: string | null;
  status: "idle" | "submitting" | ScrapeJobStatus;
}) {
  if (status === "idle" || status === "succeeded" || status === "failed" || status === "expired") {
    return null;
  }

  const label = endpointLabel(mode);
  const statusLabel = status === "submitting" ? "Starting" : status;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground"
    >
      {statusLabel} {label.toLowerCase()} job{jobId ? ` (${jobId})` : ""}.
    </div>
  );
}

function parseBoundedInteger(
  value: string,
  options: { min: number; max: number }
): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  if (parsed < options.min || parsed > options.max) {
    return null;
  }
  return parsed;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  return fallback;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildScrapesPayload(
  urls: string[],
  sites: string[],
  timeoutSeconds: number | undefined,
  fetchMode: FetchMode
): ScrapesRequest {
  const payload: ScrapesRequest = {
    urls,
    fetch_mode: fetchMode,
  };
  if (sites.length > 0) {
    payload.sites = sites;
  }
  if (timeoutSeconds !== undefined) {
    payload.timeout_seconds = timeoutSeconds;
  }
  return payload;
}

function buildDiscoverPayload(
  urls: string[],
  sites: string[],
  timeoutSeconds: number | undefined,
  fetchMode: FetchMode,
  maxPages: string,
  maxDepth: string
): DiscoverRequest {
  const parsedMaxPages = parseBoundedInteger(maxPages, { min: 1, max: 300 });
  const parsedMaxDepth = parseBoundedInteger(maxDepth, { min: 0, max: 5 });
  if (parsedMaxPages === null) {
    throw new Error("Max pages must be an integer between 1 and 300.");
  }
  if (parsedMaxDepth === null) {
    throw new Error("Max depth must be an integer between 0 and 5.");
  }
  const payload: DiscoverRequest = {
    start_urls: urls,
    fetch_mode: fetchMode,
    max_pages: parsedMaxPages,
    max_depth: parsedMaxDepth,
  };
  if (sites.length > 0) {
    payload.sites = sites;
  }
  if (timeoutSeconds !== undefined) {
    payload.timeout_seconds = timeoutSeconds;
  }
  return payload;
}

export function ScraperConsole() {
  const [state, setState] = useState<ScraperActionState>(INITIAL_SCRAPER_STATE);
  const [jobStatus, setJobStatus] = useState<"idle" | "submitting" | ScrapeJobStatus>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const [endpointMode, setEndpointMode] = useState<EndpointMode>(DEFAULT_FORM_VALUES.endpointMode);
  const [urls, setUrls] = useState(DEFAULT_FORM_VALUES.urls);
  const [sites, setSites] = useState(DEFAULT_FORM_VALUES.sites);
  const [timeoutSeconds, setTimeoutSeconds] = useState(DEFAULT_FORM_VALUES.timeoutSeconds);
  const [fetchMode, setFetchMode] = useState<FetchMode>(DEFAULT_FORM_VALUES.fetchMode);
  const [maxPages, setMaxPages] = useState(DEFAULT_FORM_VALUES.maxPages);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_FORM_VALUES.maxDepth);

  const parsedUrlCount = useMemo(() => extractUrls(urls).length, [urls]);
  const currentJobLabel = endpointLabel(endpointMode);
  const isUrlError = state.error?.toLowerCase().includes("url") ?? false;
  const isPending = jobStatus !== "idle" && jobStatus !== "succeeded" && jobStatus !== "failed" && jobStatus !== "expired";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form: ScraperFormValues = {
      endpointMode,
      urls,
      sites,
      timeoutSeconds,
      fetchMode,
      maxPages,
      maxDepth,
    };
    const requestUrls = extractUrls(urls);
    if (requestUrls.length === 0) {
      setState({ form, response: null, error: "Add at least one URL." });
      return;
    }

    const timeoutValue = timeoutSeconds.trim();
    const parsedTimeout = timeoutValue
      ? parseBoundedInteger(timeoutValue, { min: 1, max: 120 })
      : undefined;
    if (parsedTimeout === null) {
      setState({ form, response: null, error: "Timeout must be an integer between 1 and 120 seconds." });
      return;
    }

    const siteFilters = sites
      .split(/\s+/)
      .map((site) => site.trim().toLowerCase())
      .filter(Boolean);
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setState({ form, response: null, error: null });
    setJobStatus("submitting");
    setJobId(null);

    try {
      const payload =
        endpointMode === "discover"
          ? buildDiscoverPayload(requestUrls, siteFilters, parsedTimeout, fetchMode, maxPages, maxDepth)
          : buildScrapesPayload(requestUrls, siteFilters, parsedTimeout, fetchMode);
      const createResponse = await fetch("/api/scraper/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointMode, payload }),
      });
      const createPayload = await readJson(createResponse);
      if (!createResponse.ok) {
        throw new Error(extractErrorMessage(createPayload, "Could not start scrape job."));
      }
      const createdJob = createPayload as ScrapeJobCreateResponse;
      setJobId(createdJob.job_id);
      setJobStatus(createdJob.status);

      while (runIdRef.current === runId) {
        await wait(2000);
        const pollResponse = await fetch(`/api/scraper/jobs/${encodeURIComponent(createdJob.job_id)}`, {
          cache: "no-store",
        });
        const pollPayload = await readJson(pollResponse);
        if (!pollResponse.ok) {
          throw new Error(extractErrorMessage(pollPayload, "Could not load scrape job."));
        }
        const job = pollPayload as ScrapeJobStatusResponse;
        setJobStatus(job.status);

        if (job.status === "succeeded" && job.result) {
          setState({ form, response: job.result, error: null });
          return;
        }
        if (job.status === "failed" || job.status === "expired") {
          setState({ form, response: null, error: job.error ?? `Scrape job ${job.status}.` });
          return;
        }
      }
    } catch (error) {
      if (runIdRef.current !== runId) {
        return;
      }
      setJobStatus("failed");
      setState({
        form,
        response: null,
        error: error instanceof Error ? error.message : "Unexpected error while contacting backend.",
      });
    }
  }

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
          <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
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

            <PendingRunStatus mode={endpointMode} jobId={jobId} status={jobStatus} />

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
                  <AnimatedDropdown
                    id="fetch-mode"
                    options={FETCH_MODES.map((mode) => ({
                      value: mode,
                      label: mode,
                      keywords: FETCH_MODE_HELPERS[mode],
                    }))}
                    value={fetchMode}
                    onValueChange={(value) => setFetchMode(value as FetchMode)}
                    placeholder="Choose strategy"
                  />
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
                pending={isPending}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {state.response ? <ScraperResults response={state.response} /> : null}
    </>
  );
}
