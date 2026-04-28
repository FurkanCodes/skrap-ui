/* global chrome */

const DEFAULT_APP_URL = "https://dealvinci.com";

function storageSet(values) {
  return new Promise((resolve) => chrome.storage.local.set(values, resolve));
}

function tabsCreate(options) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(options, (tab) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve(tab);
    });
  });
}

function tabsRemove(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.remove(tabId, () => resolve());
  });
}

async function writeAuthStatus(status, detail = null) {
  await storageSet({
    dealvinciLastAuthStatus: status,
    dealvinciLastAuthDetail: detail,
    dealvinciLastAuthAt: new Date().toISOString(),
  });
}

function resolveStoredAppUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_APP_URL;
  }

  try {
    const parsed = new URL(value);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return DEFAULT_APP_URL;
    }
    return parsed.origin;
  } catch {
    return DEFAULT_APP_URL;
  }
}

function launchWebAuthFlow(url) {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({ interactive: true, url }, (responseUrl) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve(responseUrl);
    });
  });
}

function getRedirectUrl() {
  if (typeof chrome.identity.getRedirectURL === "function") {
    return chrome.identity.getRedirectURL("dealvinci");
  }
  return `${chrome.runtime.getURL("")}dealvinci`;
}

async function exchangeCallbackUrl(responseUrl, normalizedAppUrl, redirectUri, authState) {
  if (!responseUrl) {
    throw new Error("Authorization did not return a callback.");
  }

  await writeAuthStatus("callback", { responseUrl });
  console.info("[dealvinci] auth callback", { responseUrl });

  const parsed = new URL(responseUrl);
  if (parsed.searchParams.get("state") !== authState) {
    throw new Error("Authentication state mismatch.");
  }

  const callbackError = parsed.searchParams.get("error");
  if (callbackError) {
    throw new Error(parsed.searchParams.get("error_description") || callbackError);
  }

  const code = parsed.searchParams.get("code");
  if (!code) {
    throw new Error("Missing extension auth code.");
  }

  const response = await fetch(new URL("/api/extension/auth/exchange", normalizedAppUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "Could not connect Dealvinci.");
  }

  await storageSet({
    dealvinciAppUrl: normalizedAppUrl,
    dealvinciToken: payload.access_token,
    dealvinciRefreshToken: payload.refresh_token ?? null,
    dealvinciTokenExpiresAt: payload.expires_at ?? null,
  });
  await writeAuthStatus("connected", { expiresAt: payload.expires_at ?? null });
  console.info("[dealvinci] auth connected", { expiresAt: payload.expires_at ?? null });

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiresAt: payload.expires_at ?? null,
  };
}

function launchTabAuthFlow(url, normalizedAppUrl, redirectUri, authState) {
  return new Promise((resolve, reject) => {
    let authTabId = null;
    let settled = false;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Authorization timed out. Try connecting again."));
    }, 5 * 60 * 1000);

    function cleanup() {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      chrome.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate);
    }

    async function finish(responseUrl) {
      try {
        const result = await exchangeCallbackUrl(
          responseUrl,
          normalizedAppUrl,
          redirectUri,
          authState
        );
        cleanup();
        if (authTabId !== null) {
          await tabsRemove(authTabId);
        }
        resolve(result);
      } catch (error) {
        cleanup();
        reject(error);
      }
    }

    function onBeforeNavigate(details) {
      if (authTabId === null || details.tabId !== authTabId || details.frameId !== 0) {
        return;
      }

      if (details.url.startsWith(redirectUri)) {
        void finish(details.url);
      }
    }

    chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);

    void tabsCreate({ url, active: true })
      .then((tab) => {
        authTabId = tab.id ?? null;
        if (authTabId === null) {
          cleanup();
          reject(new Error("Could not open authorization tab."));
        }
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });
}

async function connectDealvinci(appUrl) {
  const normalizedAppUrl = resolveStoredAppUrl(appUrl);
  const authState = crypto.randomUUID();
  const redirectUri = getRedirectUrl();
  const connectUrl = new URL("/extension/connect", normalizedAppUrl);
  connectUrl.searchParams.set("redirect_uri", redirectUri);
  connectUrl.searchParams.set("state", authState);

  await writeAuthStatus("started", { appUrl: normalizedAppUrl, redirectUri });
  console.info("[dealvinci] auth started", { appUrl: normalizedAppUrl, redirectUri });

  try {
    const responseUrl = await launchWebAuthFlow(connectUrl.toString());
    return await exchangeCallbackUrl(responseUrl, normalizedAppUrl, redirectUri, authState);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authorization failed.";
    if (!message.includes("Authorization page could not be loaded")) {
      throw error;
    }

    await writeAuthStatus("fallback_tab", { reason: message });
    console.info("[dealvinci] auth fallback tab", { reason: message });
    return launchTabAuthFlow(connectUrl.toString(), normalizedAppUrl, redirectUri, authState);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["dealvinciAppUrl"], (stored) => {
    const appUrl = resolveStoredAppUrl(stored.dealvinciAppUrl);
    if (stored.dealvinciAppUrl !== appUrl) {
      chrome.storage.local.set({ dealvinciAppUrl: DEFAULT_APP_URL });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "dealvinci.connect") {
    return false;
  }

  void connectDealvinci(message.appUrl)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      void writeAuthStatus("failed", { message });
      console.error("[dealvinci] auth failed", error);
      sendResponse({
        ok: false,
        error: message,
      });
    });

  return true;
});
