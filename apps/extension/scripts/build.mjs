import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const target = process.argv[2] ?? "all";
const targets = target === "all" ? ["chrome", "firefox"] : [target];

const manifests = {
  chrome: {
    manifest_version: 3,
    name: "Dealvinci",
    description: "Add the current product page to Dealvinci.",
    version: "0.1.0",
    action: {
      default_popup: "popup.html",
      default_title: "Dealvinci"
    },
    background: {
      service_worker: "background.js",
      type: "module"
    },
    permissions: ["activeTab", "identity", "scripting", "storage", "tabs", "webNavigation"],
    host_permissions: [
      "https://*.chromiumapp.org/*",
      "https://*.extensions.allizom.org/*",
      "https://api.dealvinci.com/*",
      "https://dealvinci.com/*",
      "https://www.dealvinci.com/*"
    ]
  },
  firefox: {
    manifest_version: 3,
    name: "Dealvinci",
    description: "Add the current product page to Dealvinci.",
    version: "0.1.0",
    action: {
      default_popup: "popup.html",
      default_title: "Dealvinci"
    },
    background: {
      scripts: ["background.js"],
      type: "module"
    },
    permissions: ["activeTab", "identity", "scripting", "storage", "tabs", "webNavigation"],
    host_permissions: [
      "https://*.chromiumapp.org/*",
      "https://*.extensions.allizom.org/*",
      "https://api.dealvinci.com/*",
      "https://dealvinci.com/*",
      "https://www.dealvinci.com/*"
    ],
    browser_specific_settings: {
      gecko: {
        id: "tracker@dealvinci.com",
        strict_min_version: "109.0"
      }
    }
  }
};

for (const current of targets) {
  if (!(current in manifests)) {
    throw new Error(`Unknown extension target: ${current}`);
  }

  const outDir = join(root, "dist", current);
  await rm(outDir, { force: true, recursive: true });
  await mkdir(outDir, { recursive: true });
  await cp(join(root, "src"), outDir, { recursive: true });
  await writeFile(
    join(outDir, "manifest.json"),
    `${JSON.stringify(manifests[current], null, 2)}\n`
  );
}
