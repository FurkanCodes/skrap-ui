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
    version: "0.1.1",
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
      "https://dealvinci.com/*",
      "https://www.dealvinci.com/*",
      "https://pjihdkpbepamoaomgiegbbcdkkcnlnjk.chromiumapp.org/*"
    ]
  },
  firefox: {
    manifest_version: 3,
    name: "Dealvinci",
    description: "Add the current product page to Dealvinci.",
    version: "0.1.1",
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
      "https://dealvinci.com/*",
      "https://www.dealvinci.com/*",
      "https://67c41b859dabf7e02c3ffd9daa31960e35b9c954.extensions.allizom.org/*"
    ],
    browser_specific_settings: {
      gecko: {
        id: "tracker@dealvinci.com",
        strict_min_version: "142.0",
        data_collection_permissions: {
          required: [
            "personallyIdentifyingInfo",
            "authenticationInfo",
            "browsingActivity",
            "websiteContent"
          ]
        }
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
