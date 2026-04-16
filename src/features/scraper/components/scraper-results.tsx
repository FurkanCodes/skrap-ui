import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { METADATA_KEYS } from "@/features/scraper/constants";
import type { DiscoverResponse, ScrapesResponse } from "@/features/scraper/types";
import { formatPrice, isDiscoverResponse, pickStringValue } from "@/features/scraper/utils";

interface ScraperResultsProps {
  response: ScrapesResponse | DiscoverResponse;
}

export function ScraperResults({ response }: ScraperResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Response summary</CardTitle>
        <CardDescription>Request ID: {response.request_id}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Total: {response.total_urls}</Badge>
          <Badge variant="secondary">Success: {response.success_count}</Badge>
          <Badge variant="secondary">Failure: {response.failure_count}</Badge>
          {isDiscoverResponse(response) ? (
            <Badge variant="outline">Discovered: {response.discovered_url_count}</Badge>
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
                  <p key={url} className="truncate">
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

            return (
              <Card key={`${result.url}-${result.product_id ?? "unknown"}`} size="sm">
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-sm">{title}</CardTitle>
                  <CardDescription className="line-clamp-2">{result.url}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 pb-3 text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={result.success ? "secondary" : "destructive"}>
                      {result.success ? "success" : "failed"}
                    </Badge>
                    <Badge variant="outline">{formatPrice(result)}</Badge>
                    <Badge variant="outline">Listings: {result.listing_count}</Badge>
                    {result.adapter_key ? (
                      <Badge variant="outline">Adapter: {result.adapter_key}</Badge>
                    ) : null}
                  </div>

                  {result.error ? <p className="text-destructive">{result.error}</p> : null}

                  {result.listings.length > 0 ? (
                    <ul className="grid gap-1">
                      {result.listings.map((listing) => (
                        <li key={listing.item_id} className="rounded-md border bg-background px-2 py-1">
                          {listing.amount ?? "-"} {listing.currency ?? ""}
                          {listing.seller ? ` • ${listing.seller}` : ""}
                        </li>
                      ))}
                    </ul>
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
