import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import { METADATA_KEYS } from "@/features/scraper/constants";
import type { DiscoverResponse, ScrapesResponse } from "@/features/scraper/types";
import { TrackResultPanel } from "@/features/tracking/components/track-result-panel";
import {
  formatPrice,
  isDiscoverResponse,
  pickImageUrl,
  pickStringValue,
} from "@/features/scraper/utils";
import { formatCurrencyAmount } from "@/lib/currency";

interface ScraperResultsProps {
  response: ScrapesResponse | DiscoverResponse;
}

export function ScraperResults({ response }: ScraperResultsProps) {
  const isFullySuccessful = response.failure_count === 0;
  const isAllFailed = response.success_count === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest run</CardTitle>
        <CardDescription>Request ID: {response.request_id}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div
          className={
            isFullySuccessful
              ? "rounded-lg border border-emerald-600/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
              : "rounded-lg border border-amber-600/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
          }
        >
          {isFullySuccessful
            ? "Run completed with no failures."
            : isAllFailed
              ? "Run completed, but all URLs failed. Review errors below and retry after adjusting options."
              : "Run completed with partial failures. Review failed URLs and retry with adjusted fetch strategy."}
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip tone="muted">Total: {response.total_urls}</Chip>
          <Chip tone="success">Success: {response.success_count}</Chip>
          <Chip tone={response.failure_count > 0 ? "danger" : "muted"}>
            Failure: {response.failure_count}
          </Chip>
          {isDiscoverResponse(response) ? (
            <Chip tone="muted">Discovered: {response.discovered_url_count}</Chip>
          ) : null}
        </div>

        {isDiscoverResponse(response) ? (
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>
              Discovery: {response.discovery_stats.requests_count} requests in{" "}
              {response.discovery_stats.elapsed_seconds.toFixed(2)}s
            </p>
            {response.discovered_urls.length > 0 ? (
              <div className="max-h-40 overflow-auto rounded-lg border bg-background p-3 text-xs">
                {response.discovered_urls.map((url) => (
                  <p key={url} className="break-all">
                    {url}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <Separator />

        <div className="grid gap-3">
          {response.results.map((result) => {
            const title = pickStringValue(result, METADATA_KEYS) ?? result.url;
            const imageUrl = pickImageUrl(result);
            const primaryListing = result.listings[0] ?? null;
            const primaryPriceLabel = primaryListing
              ? formatCurrencyAmount(primaryListing.amount, primaryListing.currency, { fallback: "-" })
              : formatPrice(result);

            return (
              <Card key={`${result.url}-${result.product_id ?? "unknown"}`} size="sm">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="size-16 shrink-0 overflow-hidden rounded-md border bg-muted/30">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full place-items-center px-2 text-center text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="line-clamp-2 text-sm">{title}</CardTitle>
                      <CardDescription className="line-clamp-2">{result.url}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 pb-3 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    <Chip tone={result.success ? "success" : "danger"}>
                      {result.success ? "success" : "failed"}
                    </Chip>
                    <Chip tone="muted">Primary offer: {primaryPriceLabel}</Chip>
                    <Chip tone="muted">Listings: {result.listing_count}</Chip>
                    {result.adapter_key ? (
                      <Chip tone="muted">Adapter: {result.adapter_key}</Chip>
                    ) : null}
                  </div>

                  {result.error ? <p className="text-destructive">{result.error}</p> : null}

                  {result.listings.length > 0 ? (
                    <ul className="grid gap-1">
                      {result.listings.map((listing, index) => (
                        <li
                          key={listing.item_id}
                          className="flex flex-wrap items-center gap-2 rounded-md border bg-background px-2 py-1 break-words"
                        >
                          <span className="break-words">
                            {formatCurrencyAmount(listing.amount, listing.currency, { fallback: "-" })}
                            {listing.seller ? ` • ${listing.seller}` : ""}
                          </span>
                          {index === 0 ? (
                            <Chip tone="success" className="text-[10px]">
                              Primary
                            </Chip>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {result.success ? (
                    <TrackResultPanel
                      url={result.url}
                      siteKey={result.site_key}
                      amount={result.amount}
                      currency={result.currency}
                      primarySeller={primaryListing?.seller ?? null}
                    />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
