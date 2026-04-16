"use client";

import { useActionState, useMemo, useState } from "react";

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Skrap UI</CardTitle>
          <CardDescription>
            Paste one or more product URLs, run scrape/discover, and inspect normalized results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" action={formAction}>
            <input type="hidden" name="endpointMode" value={endpointMode} />
            <input type="hidden" name="fetchMode" value={fetchMode} />

            <div className="grid gap-2">
              <Label htmlFor="endpoint-mode">Endpoint mode</Label>
              <Select
                value={endpointMode}
                onValueChange={(value) => setEndpointMode(value as EndpointMode)}
              >
                <SelectTrigger id="endpoint-mode" className="w-full">
                  <SelectValue placeholder="Select endpoint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scrapes">Scrapes (`/api/v1/scrapes`)</SelectItem>
                  <SelectItem value="discover">Discover (`/api/v1/discover`)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="urls">URLs (space or newline separated)</Label>
              <Textarea
                id="urls"
                name="urls"
                className="min-h-28"
                value={urls}
                onChange={(event) => setUrls(event.target.value)}
                placeholder="https://www.epey.com/akilli-telefonlar/huawei-pura-70.html"
              />
              <p className="text-xs text-muted-foreground">Detected URL count: {parsedUrlCount}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="sites">Sites (optional)</Label>
                <Input
                  id="sites"
                  name="sites"
                  value={sites}
                  onChange={(event) => setSites(event.target.value)}
                  placeholder="generic"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fetch-mode">Fetch mode</Label>
                <Select
                  value={fetchMode}
                  onValueChange={(value) => setFetchMode(value as FetchMode)}
                >
                  <SelectTrigger id="fetch-mode" className="w-full">
                    <SelectValue placeholder="Fetch mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {FETCH_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeout-seconds">Timeout seconds (optional)</Label>
                <Input
                  id="timeout-seconds"
                  name="timeoutSeconds"
                  inputMode="numeric"
                  value={timeoutSeconds}
                  onChange={(event) => setTimeoutSeconds(event.target.value)}
                  placeholder="5"
                />
              </div>
            </div>

            {endpointMode === "discover" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="max-pages">Max pages</Label>
                  <Input
                    id="max-pages"
                    name="maxPages"
                    inputMode="numeric"
                    value={maxPages}
                    onChange={(event) => setMaxPages(event.target.value)}
                    placeholder="50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="max-depth">Max depth</Label>
                  <Input
                    id="max-depth"
                    name="maxDepth"
                    inputMode="numeric"
                    value={maxDepth}
                    onChange={(event) => setMaxDepth(event.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            ) : (
              <>
                <input type="hidden" name="maxPages" value={maxPages} />
                <input type="hidden" name="maxDepth" value={maxDepth} />
              </>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton />
              <p className="text-xs text-muted-foreground">
                Tip: use `discover` with `max_depth=0` for spider runtime with scrape-like behavior.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {state.error ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Request failed</CardTitle>
            <CardDescription>{state.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {state.response ? <ScraperResults response={state.response} /> : null}
    </>
  );
}
