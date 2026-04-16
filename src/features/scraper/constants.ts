import type { FetchMode, ScraperActionState, ScraperFormValues } from "@/features/scraper/types";

export const FETCH_MODES: FetchMode[] = ["auto", "http", "dynamic", "stealth"];

export const METADATA_KEYS = [
  "name",
  "title",
  "product_name",
  "brand",
  "model",
  "sku",
  "mpn",
] as const;

export const DEFAULT_FORM_VALUES: ScraperFormValues = {
  endpointMode: "scrapes",
  urls: "",
  sites: "generic",
  timeoutSeconds: "5",
  fetchMode: "auto",
  maxPages: "50",
  maxDepth: "0",
};

export const INITIAL_SCRAPER_STATE: ScraperActionState = {
  form: DEFAULT_FORM_VALUES,
  response: null,
  error: null,
};
