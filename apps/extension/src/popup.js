const api = globalThis.browser ?? globalThis.chrome;
const DEFAULT_APP_URL = "https://dealvinci.com";
const state = {
  appUrl: DEFAULT_APP_URL,
  tab: null,
  token: null,
  refreshToken: null,
  trackerType: "monitor",
  direction: "drop",
  pageMeta: null,
  duplicate: null,
  duplicateCheckPending: false,
};

const elements = {
  status: document.querySelector("#status"),
  signedOut: document.querySelector("#signedOut"),
  trackerPanel: document.querySelector("#trackerPanel"),
  connectButton: document.querySelector("#connectButton"),
  disconnectButton: document.querySelector("#disconnectButton"),
  connectionBadge: document.querySelector("#connectionBadge"),
  pageInitial: document.querySelector("#pageInitial"),
  tabTitle: document.querySelector("#tabTitle"),
  tabUrl: document.querySelector("#tabUrl"),
  tabPrice: document.querySelector("#tabPrice"),
  targetField: document.querySelector("#targetField"),
  targetInput: document.querySelector("#targetInput"),
  addButton: document.querySelector("#addButton"),
};

function storageGet(keys) {
  return new Promise((resolve) => api.storage.local.get(keys, resolve));
}

function storageSet(values) {
  return new Promise((resolve) => api.storage.local.set(values, resolve));
}

function storageRemove(keys) {
  return new Promise((resolve) => api.storage.local.remove(keys, resolve));
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

function queryActiveTab() {
  return new Promise((resolve) => {
    api.tabs.query({ active: true, currentWindow: true }, ([tab]) => resolve(tab ?? null));
  });
}

function runtimeSendMessage(message) {
  return new Promise((resolve, reject) => {
    api.runtime.sendMessage(message, (response) => {
      const runtimeError = api.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve(response);
    });
  });
}

function extractPageMetadata() {
  function text(value) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  }

  function getMetaContent(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const content = text(element?.getAttribute("content") || element?.textContent || "");
      if (content) {
        return content;
      }
    }
    return "";
  }

  function findJsonLdPrice() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const visit = (value) => {
      if (!value || typeof value !== "object") {
        return null;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          const found = visit(item);
          if (found) return found;
        }
        return null;
      }

      const record = value;
      const offers = record.offers;
      if (offers) {
        const offerList = Array.isArray(offers) ? offers : [offers];
        for (const offer of offerList) {
          if (offer && typeof offer === "object" && offer.price) {
            return {
              amount: text(String(offer.price)),
              currency: text(String(offer.priceCurrency || "")),
            };
          }
        }
      }
      return null;
    };

    for (const script of scripts) {
      try {
        const found = visit(JSON.parse(script.textContent || "{}"));
        if (found?.amount) {
          return found;
        }
      } catch {
        // Ignore malformed merchant JSON-LD.
      }
    }
    return null;
  }

  function findVisiblePrice() {
    const selectors = [
      ".a-price .a-offscreen",
      "[data-testid*='price' i]",
      "[class*='price' i]",
      "[id*='price' i]",
      "[itemprop='price']",
    ];

    const currencyPattern = /(?:[$€£₺]\s?\d[\d.,\s]*|\d[\d.,\s]*(?:TL|TRY|USD|EUR|GBP|₺|€|\$|£))/i;
    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector)).slice(0, 30);
      for (const element of elements) {
        const value = text(element.getAttribute("content") || element.textContent || "");
        const match = value.match(currencyPattern);
        if (match?.[0]) {
          return match[0].trim();
        }
      }
    }

    const bodyText = text(document.body?.innerText || "").slice(0, 20000);
    return bodyText.match(currencyPattern)?.[0]?.trim() || "";
  }

  const metaAmount = getMetaContent([
    "meta[property='product:price:amount']",
    "meta[property='og:price:amount']",
    "meta[name='twitter:data1']",
    "meta[itemprop='price']",
  ]);
  const metaCurrency = getMetaContent([
    "meta[property='product:price:currency']",
    "meta[property='og:price:currency']",
    "meta[itemprop='priceCurrency']",
  ]);
  const jsonLdPrice = findJsonLdPrice();
  const rawPrice = metaAmount || jsonLdPrice?.amount || findVisiblePrice();
  const rawCurrency = metaCurrency || jsonLdPrice?.currency || "";

  return {
    price: rawPrice,
    currency: rawCurrency,
  };
}

function executePageMetadataScript(tabId) {
  if (!api.scripting?.executeScript || !tabId) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const options = {
      target: { tabId },
      func: extractPageMetadata,
    };

    const handleResults = (results) => {
      const runtimeError = api.runtime.lastError;
      if (runtimeError) {
        resolve(null);
        return;
      }
      resolve(results?.[0]?.result ?? null);
    };

    try {
      const maybePromise = api.scripting.executeScript(options, handleResults);
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then((results) => resolve(results?.[0]?.result ?? null)).catch(() => resolve(null));
      }
    } catch {
      try {
        api.scripting.executeScript(options).then((results) => {
          resolve(results?.[0]?.result ?? null);
        }).catch(() => resolve(null));
      } catch {
        resolve(null);
      }
    }
  });
}

async function readPageMetadata() {
  if (!state.tab?.id || !state.tab?.url || !isTrackableUrl(state.tab.url)) {
    state.pageMeta = null;
    return;
  }

  state.pageMeta = await executePageMetadataScript(state.tab.id);
}

function showStatus(message, kind = "") {
  elements.status.textContent = message;
  elements.status.className = `status ${kind}`.trim();
  elements.status.hidden = false;
}

function getErrorMessage(error, fallback) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (!message) {
    return fallback;
  }

  if (message.includes("fetch_failed") || message.includes("Failed to fetch")) {
    return "Could not read this product page yet. Try another product URL or use the dashboard.";
  }

  if (message.includes("tracker limit")) {
    return "Limit reached. Remove an item or upgrade your plan.";
  }

  if (message.toLowerCase().includes("telegram")) {
    return "Connect Telegram in Dealvinci before adding items.";
  }

  return message;
}

function isAuthExpiredMessage(message) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid bearer") ||
    normalized.includes("unauthorized") ||
    normalized.includes("missing extension token") ||
    normalized.includes("session expired") ||
    normalized.includes("token expired")
  );
}

async function clearExtensionSession() {
  state.token = null;
  state.refreshToken = null;
  await storageRemove(["dealvinciToken", "dealvinciRefreshToken", "dealvinciTokenExpiresAt"]);
}

function clearStatus() {
  elements.status.hidden = true;
  elements.status.textContent = "";
}

function isTrackableUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getTabHost() {
  try {
    return new URL(state.tab?.url || "").hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getPageInitial() {
  const host = getTabHost();
  if (host) {
    return host[0] || "D";
  }
  return "D";
}

function formatDetectedPrice(meta) {
  const rawPrice = String(meta?.price || "").trim();
  if (!rawPrice) {
    return "";
  }

  const rawCurrency = String(meta?.currency || "").trim().toUpperCase();
  const currencyPrefix = rawCurrency === "TRY" ? "₺" : rawCurrency === "USD" ? "$" : rawCurrency === "EUR" ? "€" : "";
  if (currencyPrefix && !rawPrice.includes(currencyPrefix)) {
    return `${currencyPrefix}${rawPrice}`;
  }
  if (rawCurrency && !rawPrice.toUpperCase().includes(rawCurrency) && !currencyPrefix) {
    return `${rawPrice} ${rawCurrency}`;
  }
  return rawPrice;
}

function isTokenExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }

  const expiryMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiryMs)) {
    return false;
  }

  return expiryMs <= Date.now() + 15_000;
}

function updateSegmentButtons() {
  document.querySelectorAll("[data-type]").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === state.trackerType);
    button.disabled = Boolean(state.duplicate);
  });
  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.classList.toggle("active", button.dataset.direction === state.direction);
    button.disabled = Boolean(state.duplicate);
  });
  elements.targetField.hidden = state.trackerType !== "alert";
  elements.targetInput.disabled = Boolean(state.duplicate);
}

function render() {
  const authenticated = Boolean(state.token);
  elements.signedOut.hidden = authenticated;
  elements.trackerPanel.hidden = !authenticated;
  elements.connectionBadge.textContent = authenticated ? "Connected" : "Disconnected";
  elements.connectionBadge.classList.toggle("connected", authenticated);

  if (state.tab) {
    elements.tabTitle.textContent = state.tab.title || "Current page";
    elements.tabUrl.textContent = getTabHost() || state.tab.url || "";
    elements.pageInitial.textContent = getPageInitial();
    const detectedPrice = formatDetectedPrice(state.pageMeta);
    elements.tabPrice.textContent = detectedPrice;
    elements.tabPrice.hidden = !detectedPrice;
  }

  const canTrack = authenticated && state.tab?.url && isTrackableUrl(state.tab.url);
  elements.addButton.disabled = !canTrack;
  if (state.duplicateCheckPending) {
    elements.addButton.disabled = true;
    elements.addButton.textContent = "Checking...";
  } else if (state.duplicate) {
    elements.addButton.disabled = false;
    elements.addButton.textContent = "Open tracker";
  } else if (elements.addButton.textContent !== "Adding..." && elements.addButton.textContent !== "Added") {
    elements.addButton.textContent = "Add to Dealvinci";
  }
  updateSegmentButtons();
}

async function connect() {
  clearStatus();
  elements.connectButton.disabled = true;
  elements.connectButton.textContent = "Connecting...";

  try {
    const response = await runtimeSendMessage({
      type: "dealvinci.connect",
      appUrl: state.appUrl,
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Could not connect Dealvinci.");
    }

    state.token = response.result.accessToken;
    state.refreshToken = response.result.refreshToken;
    showStatus("Connected to Dealvinci.", "success");
    render();
  } catch (error) {
    showStatus(getErrorMessage(error, "Authentication failed."), "error");
  } finally {
    elements.connectButton.disabled = false;
    elements.connectButton.textContent = "Connect Dealvinci";
  }
}

async function refreshToken() {
  if (!state.refreshToken) {
    return false;
  }

  const response = await fetch(new URL("/api/extension/auth/refresh", state.appUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: state.refreshToken }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    return false;
  }

  state.token = payload.access_token;
  state.refreshToken = payload.refresh_token ?? state.refreshToken;
  await storageSet({
    dealvinciToken: state.token,
    dealvinciRefreshToken: state.refreshToken,
    dealvinciTokenExpiresAt: payload.expires_at ?? null,
  });
  return true;
}

async function handleExpiredSession() {
  await clearExtensionSession();
  render();
  showStatus("Session expired. Connect Dealvinci again to continue.", "error");
}

function getTrackerDashboardUrl(itemId) {
  const dashboardUrl = new URL("/dashboard", state.appUrl);
  if (itemId) {
    dashboardUrl.searchParams.set("tracker", itemId);
  }
  return dashboardUrl.toString();
}

function openDuplicateTracker() {
  api.tabs.create({ url: getTrackerDashboardUrl(state.duplicate?.item_id) });
}

async function getDuplicateTracker() {
  return fetch(new URL(`/api/extension/tracked-items?url=${encodeURIComponent(state.tab.url)}`, state.appUrl), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });
}

async function checkDuplicateTracker() {
  if (!state.token || !state.tab?.url || !isTrackableUrl(state.tab.url)) {
    state.duplicate = null;
    return;
  }

  state.duplicateCheckPending = true;
  render();
  try {
    let response = await getDuplicateTracker();
    if (response.status === 401 && (await refreshToken())) {
      response = await getDuplicateTracker();
    }
    const payload = await response.json();
    if (!response.ok) {
      if (response.status === 401 || isAuthExpiredMessage(payload.detail || "")) {
        await handleExpiredSession();
      }
      return;
    }

    state.duplicate = payload.duplicate ?? null;
    if (state.duplicate) {
      showStatus("Already tracking this product.", "success");
    }
  } catch {
    state.duplicate = null;
  } finally {
    state.duplicateCheckPending = false;
    render();
  }
}

async function postTracker() {
  return fetch(new URL("/api/extension/tracked-items", state.appUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${state.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: state.tab.url,
      title: state.tab.title ?? null,
      type: state.trackerType,
      direction: state.direction,
      target_amount: state.trackerType === "alert" ? elements.targetInput.value : null,
    }),
  });
}

async function addTracker() {
  if (state.duplicate) {
    openDuplicateTracker();
    return;
  }

  clearStatus();
  if (!state.token || !state.tab?.url || !isTrackableUrl(state.tab.url)) {
    showStatus("Open a supported product page first.", "error");
    return;
  }

  if (state.trackerType === "alert" && !elements.targetInput.value.trim()) {
    showStatus("Target price is required for Price Alert.", "error");
    return;
  }

  elements.addButton.disabled = true;
  elements.addButton.textContent = "Adding...";
  try {
    let response = await postTracker();
    if (response.status === 401 && (await refreshToken())) {
      response = await postTracker();
    }
    const payload = await response.json();
    if (!response.ok) {
      if (response.status === 401 || isAuthExpiredMessage(payload.detail || "")) {
        await handleExpiredSession();
        return;
      }
      if (response.status === 409 && payload.duplicate) {
        state.duplicate = payload.duplicate;
        showStatus("Already tracking this product.", "success");
        render();
        return;
      }
      throw new Error(payload.detail || "Could not add this product.");
    }
    showStatus("Added to Dealvinci.", "success");
    elements.addButton.textContent = "Added";
    setTimeout(() => {
      elements.addButton.textContent = "Add to Dealvinci";
    }, 1200);
  } catch (error) {
    const message = getErrorMessage(error, "Could not add this product.");
    if (isAuthExpiredMessage(message)) {
      await handleExpiredSession();
      return;
    }
    showStatus(message, "error");
  } finally {
    if (elements.addButton.textContent !== "Added") {
      elements.addButton.textContent = "Add to Dealvinci";
    }
    render();
  }
}

async function disconnect() {
  if (state.token) {
    await fetch(new URL("/api/extension/auth/session", state.appUrl), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${state.token}` },
    }).catch(() => undefined);
  }

  await clearExtensionSession();
  showStatus("Disconnected.", "success");
  render();
}

async function init() {
  const stored = await storageGet([
    "dealvinciAppUrl",
    "dealvinciToken",
    "dealvinciRefreshToken",
    "dealvinciTokenExpiresAt",
    "dealvinciLastAuthStatus",
    "dealvinciLastAuthDetail",
    "dealvinciLastAuthAt",
  ]);
  state.appUrl = resolveStoredAppUrl(stored.dealvinciAppUrl);
  if (stored.dealvinciAppUrl !== state.appUrl) {
    await storageSet({ dealvinciAppUrl: state.appUrl });
  }
  if (stored.dealvinciToken && isTokenExpired(stored.dealvinciTokenExpiresAt)) {
    await clearExtensionSession();
    showStatus("Session expired. Connect Dealvinci again to continue.", "error");
  } else {
    state.token = stored.dealvinciToken || null;
    state.refreshToken = stored.dealvinciRefreshToken || null;
  }
  state.tab = await queryActiveTab();
  await readPageMetadata();
  render();
  await checkDuplicateTracker();

  if (state.tab?.url && !isTrackableUrl(state.tab.url)) {
    showStatus("This browser page cannot be tracked.", "error");
  }
}

elements.connectButton.addEventListener("click", connect);
elements.disconnectButton.addEventListener("click", disconnect);
elements.addButton.addEventListener("click", addTracker);
document.querySelectorAll("[data-type]").forEach((button) => {
  button.addEventListener("click", () => {
    state.trackerType = button.dataset.type;
    updateSegmentButtons();
  });
});
document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    state.direction = button.dataset.direction;
    updateSegmentButtons();
  });
});

void init();
