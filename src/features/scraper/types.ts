export type FetchMode = "auto" | "http" | "dynamic" | "stealth";
export type EndpointMode = "scrapes" | "discover";

export interface PriceListingResponse {
  item_id: string;
  amount: string | null;
  currency: string | null;
  raw_text: string | null;
  source: string | null;
  seller: string | null;
  listing_url: string | null;
}

export interface PriceResultResponse {
  url: string;
  success: boolean;
  product_id: string | null;
  site_key: string | null;
  adapter_key: string | null;
  amount: string | null;
  currency: string | null;
  raw_text: string | null;
  source: string | null;
  listing_count: number;
  listings: PriceListingResponse[];
  error: string | null;
  [key: string]: unknown;
}

export interface ScrapesResponse {
  request_id: string;
  total_urls: number;
  success_count: number;
  failure_count: number;
  results: PriceResultResponse[];
}

export interface DiscoveryStats {
  requests_count: number;
  failed_requests_count: number;
  blocked_requests_count: number;
  offsite_requests_count: number;
  elapsed_seconds: number;
  sessions_requests_count: Record<string, number>;
}

export interface DiscoverResponse extends ScrapesResponse {
  seed_count: number;
  discovered_url_count: number;
  discovered_urls: string[];
  discovery_stats: DiscoveryStats;
}

export interface ScrapesRequest {
  urls: string[];
  sites?: string[];
  timeout_seconds?: number;
  fetch_mode: FetchMode;
}

export interface DiscoverRequest {
  start_urls: string[];
  sites?: string[];
  timeout_seconds?: number;
  fetch_mode: FetchMode;
  max_pages: number;
  max_depth: number;
}

export interface ScraperFormValues {
  endpointMode: EndpointMode;
  urls: string;
  sites: string;
  timeoutSeconds: string;
  fetchMode: FetchMode;
  maxPages: string;
  maxDepth: string;
}

export interface ScraperActionState {
  form: ScraperFormValues;
  response: ScrapesResponse | DiscoverResponse | null;
  error: string | null;
}
