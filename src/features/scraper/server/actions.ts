"use server";

import { z } from "zod";

import { DEFAULT_FORM_VALUES } from "@/features/scraper/constants";
import {
  BackendApiError,
  postBackendJson,
} from "@/features/scraper/server/backend-client";
import type {
  DiscoverRequest,
  DiscoverResponse,
  FetchMode,
  ScraperActionState,
  ScraperFormValues,
  ScrapesRequest,
  ScrapesResponse,
} from "@/features/scraper/types";
import { splitByWhitespace } from "@/features/scraper/utils";

const formSchema = z.object({
  endpointMode: z.enum(["scrapes", "discover"]),
  urls: z.string().trim().min(1, "Add at least one URL."),
  sites: z.string().trim().optional().default(""),
  timeoutSeconds: z.string().trim().optional().default(""),
  fetchMode: z.enum(["auto", "http", "dynamic", "stealth"]),
  maxPages: z.string().trim().optional().default(DEFAULT_FORM_VALUES.maxPages),
  maxDepth: z.string().trim().optional().default(DEFAULT_FORM_VALUES.maxDepth),
});

function normalizeFetchMode(value: string): FetchMode {
  if (value === "http" || value === "dynamic" || value === "stealth" || value === "auto") {
    return value;
  }

  return DEFAULT_FORM_VALUES.fetchMode;
}

function normalizeFormData(formData: FormData): ScraperFormValues {
  const endpointMode = String(formData.get("endpointMode") ?? DEFAULT_FORM_VALUES.endpointMode);

  return {
    endpointMode: endpointMode === "discover" ? "discover" : "scrapes",
    urls: String(formData.get("urls") ?? ""),
    sites: String(formData.get("sites") ?? ""),
    timeoutSeconds: String(formData.get("timeoutSeconds") ?? DEFAULT_FORM_VALUES.timeoutSeconds),
    fetchMode: normalizeFetchMode(
      String(formData.get("fetchMode") ?? DEFAULT_FORM_VALUES.fetchMode)
    ),
    maxPages: String(formData.get("maxPages") ?? DEFAULT_FORM_VALUES.maxPages),
    maxDepth: String(formData.get("maxDepth") ?? DEFAULT_FORM_VALUES.maxDepth),
  };
}

function mapError(error: unknown): string {
  if (error instanceof BackendApiError) {
    if (error.status === 401) {
      return "Authentication failed while calling backend. Check your backend token or session.";
    }

    if (error.status === 403) {
      return "Backend denied this request. Confirm your credentials have scrape/discover permissions.";
    }

    if (error.status === 404) {
      return "Requested scrape endpoint was not found. Verify backend routes and base URL.";
    }

    if (error.status === 429) {
      return "Rate limited by backend. Wait a moment, then run the job again.";
    }

    if (error.status >= 500) {
      return "Backend failed while processing the job. Retry shortly or inspect backend logs.";
    }

    return error.message || "Request failed while contacting backend.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error while contacting backend.";
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

export async function runScraperAction(
  _previousState: ScraperActionState,
  formData: FormData
): Promise<ScraperActionState> {
  const rawForm = normalizeFormData(formData);
  const parsed = formSchema.safeParse(rawForm);

  if (!parsed.success) {
    return {
      form: rawForm,
      response: null,
      error: parsed.error.issues[0]?.message ?? "Invalid form payload.",
    };
  }

  const values = parsed.data;
  const urls = splitByWhitespace(values.urls);

  if (urls.length === 0) {
    return {
      form: values,
      response: null,
      error: "Add at least one URL.",
    };
  }

  const sites = splitByWhitespace(values.sites).map((site) => site.toLowerCase());
  const timeoutValue = values.timeoutSeconds.trim();
  const validatedTimeoutSeconds = timeoutValue
    ? parseBoundedInteger(timeoutValue, {
        min: 1,
        max: 120,
      })
    : undefined;

  if (validatedTimeoutSeconds === null) {
    return {
      form: values,
      response: null,
      error: "Timeout must be an integer between 1 and 120 seconds.",
    };
  }

  const timeoutSeconds = validatedTimeoutSeconds;

  try {
    if (values.endpointMode === "discover") {
      const maxPages = parseBoundedInteger(values.maxPages, {
        min: 1,
        max: 300,
      });
      const maxDepth = parseBoundedInteger(values.maxDepth, {
        min: 0,
        max: 5,
      });

      if (maxPages === null) {
        return {
          form: values,
          response: null,
          error: "Max pages must be an integer between 1 and 300.",
        };
      }

      if (maxDepth === null) {
        return {
          form: values,
          response: null,
          error: "Max depth must be an integer between 0 and 5.",
        };
      }

      const payload: DiscoverRequest = {
        start_urls: urls,
        fetch_mode: values.fetchMode,
        max_pages: maxPages,
        max_depth: maxDepth,
      };

      if (sites.length > 0) {
        payload.sites = sites;
      }

      if (timeoutSeconds !== undefined) {
        payload.timeout_seconds = timeoutSeconds;
      }

      const response = await postBackendJson<DiscoverResponse, DiscoverRequest>(
        "/api/v1/discover",
        payload
      );

      return {
        form: values,
        response,
        error: null,
      };
    }

    const payload: ScrapesRequest = {
      urls,
      fetch_mode: values.fetchMode,
    };

    if (sites.length > 0) {
      payload.sites = sites;
    }

    if (timeoutSeconds !== undefined) {
      payload.timeout_seconds = timeoutSeconds;
    }

    const response = await postBackendJson<ScrapesResponse, ScrapesRequest>(
      "/api/v1/scrapes",
      payload
    );

    return {
      form: values,
      response,
      error: null,
    };
  } catch (error) {
    return {
      form: values,
      response: null,
      error: mapError(error),
    };
  }
}
