// Build email-safe submission artifacts (no .js/.jsx inside folders you might zip).
// Run: npm run bundle:email

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "email-attach");
const BUNDLE_JSON = path.join(ROOT, "library-submission-bundle.json");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "dist-ssr",
  "email-attach",
]);

const SKIP_FILES = new Set([
  "library-submission-bundle.json",
  "public.zip",
  "create-submission-bundle.js",
]);

const SCRIPT_EXT = new Set([".js", ".jsx", ".mjs", ".cjs", ".sh"]);

const TEXT_EXT = new Set([
  ".json",
  ".html",
  ".css",
  ".md",
  ".txt",
  ".svg",
  ".gitignore",
  ".oxlintrc.json",
]);

function shouldInclude(rel) {
  if (SKIP_FILES.has(path.basename(rel))) return false;
  const parts = rel.split(/[/\\]/);
  if (parts.some((p) => SKIP_DIRS.has(p) || p === "tools")) return false;
  if (rel.endsWith(".pdf") || rel.endsWith(".zip")) return false;
  return true;
}

function walk(dir, base = "") {
  const entries = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${name.name}` : name.name;
    const full = path.join(dir, name.name);
    if (!shouldInclude(rel)) continue;
    if (name.isDirectory()) {
      entries.push(...walk(full, rel.replace(/\\/g, "/")));
    } else {
      entries.push(rel.replace(/\\/g, "/"));
    }
  }
  return entries;
}

/** Script sources become .txt so Gmail is less likely to block a ZIP of this folder. */
function emailSafePath(rel) {
  const ext = path.extname(rel);
  if (SCRIPT_EXT.has(ext)) return `${rel}.txt`;
  return rel;
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function rmOutDir() {
  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const files = walk(ROOT).sort();
const bundle = {
  generatedAt: new Date().toISOString(),
  project: "library-management-assignment",
  note: "Restore paths: strip trailing .txt from keys ending in .js.txt / .jsx.txt / .sh.txt",
  files: {},
};
const manifest = { originalToEmailSafe: {}, emailSafeToOriginal: {} };

rmOutDir();

for (const rel of files) {
  const full = path.join(ROOT, rel);
  const ext = path.extname(rel);
  const isText =
    TEXT_EXT.has(ext) ||
    SCRIPT_EXT.has(ext) ||
    rel === ".gitignore" ||
    rel.endsWith(".oxlintrc.json");

  if (!isText) {
    const buf = fs.readFileSync(full);
    const safeRel = emailSafePath(rel);
    const outPath = path.join(OUT_DIR, "sources", safeRel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buf);
    bundle.files[rel] = {
      encoding: "base64",
      content: buf.toString("base64"),
      sha256: createHash("sha256").update(buf).digest("hex"),
    };
    continue;
  }

  const text = fs.readFileSync(full, "utf8");
  const safeRel = emailSafePath(rel);
  manifest.originalToEmailSafe[rel] = `sources/${safeRel}`;
  manifest.emailSafeToOriginal[`sources/${safeRel}`] = rel;

  writeText(path.join(OUT_DIR, "sources", safeRel), text);

  const bundleKey = SCRIPT_EXT.has(ext) ? safeRel : rel;
  bundle.files[bundleKey] = {
    encoding: "utf8",
    originalPath: rel,
    content: text,
  };
}

writeText(
  path.join(OUT_DIR, "MANIFEST.json"),
  JSON.stringify(manifest, null, 2),
);

writeText(
  path.join(OUT_DIR, "README-FOR-RECIPIENT.txt"),
  `LIBRARY ASSIGNMENT — HOW TO OPEN THIS PACKAGE
==============================================

Gmail blocks many ZIP files that contain .js or .sh scripts.

YOU MAY RECEIVE ONE OF:
  A) This folder (or a ZIP of email-attach/) — scripts are renamed to *.txt
  B) library-submission-bundle.json only (attach that single file)

OPTION A — Rename scripts back
------------------------------
Inside sources/, rename each script file by removing the extra ".txt":
  src/library.js.txt        -> src/library.js
  src/commands.js.txt       -> src/commands.js
  src/library.test.js.txt   -> src/library.test.js
  src/main.jsx.txt          -> src/main.jsx
  src/App.jsx.txt           -> src/App.jsx
  vite.config.js.txt        -> vite.config.js
  start.sh.txt              -> start.sh   (if present)

See MANIFEST.json for the full mapping.

Then:
  npm install
  npm run dev
  npm test

OPTION B — From library-submission-bundle.json
----------------------------------------------
Ask the sender for restore steps, or use the GitHub link they provide.

OPTION C — GitHub (preferred if offered)
----------------------------------------
Clone the repo they link; do not use email attachments.

Do NOT attach public.zip to email — use this package or the JSON file instead.
`,
);

fs.writeFileSync(BUNDLE_JSON, JSON.stringify(bundle), "utf8");

console.log(`Wrote ${OUT_DIR}/ (email-safe sources + MANIFEST)`);
console.log(`Wrote ${BUNDLE_JSON}`);
console.log(`Files included: ${files.length}`);
console.log("");
console.log("To email:");
console.log("  1. Attach library-submission-bundle.json  (single file, usually allowed)");
console.log("  2. OR zip the email-attach folder and attach (scripts are .txt inside)");
console.log("  3. OR paste GitHub link — best option");