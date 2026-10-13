import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://manyaraprivevacations.com";
const API_BASE = (
  process.env.VITE_API_BASE_URL || "https://manyara-travel-backend-2yco.onrender.com"
).replace(/\/$/, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Render may be asleep during the build, so allow a long wait and retry. */
async function fetchJson(url, attempts = 3) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn(`[sitemap] ${url} attempt ${i}/${attempts}: ${err.message}`);
      if (i < attempts) await sleep(4000 * i);
    }
  }
  return [];
}

const toList = (data) => {
  if (Array.isArray(data)) return data;
  for (const key of ["items", "data", "packages"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

const isPublished = (item) => {
  const status = String(item?.status ?? "").trim().toLowerCase();
  return status === "" || status === "published" || item?.is_published === true;
};

const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const lastmodOf = (item) => {
  const raw = item?.updated_at || item?.created_at;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toISOString().slice(0, 10)
    : "";
};

function entry(pathname, item) {
  const lastmod = lastmodOf(item);
  return `  <url><loc>${esc(SITE_URL + pathname)}</loc>${
    lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
  }</url>`;
}

const section = (base, list) =>
  toList(list)
    .filter((item) => item?.slug && isPublished(item))
    .map((item) => entry(`${base}/${encodeURIComponent(item.slug)}`, item));

async function main() {
  const [packages, destinations, seasonal, blogs] = await Promise.all([
    fetchJson(`${API_BASE}/packages`),
    fetchJson(`${API_BASE}/most-visited`),
    fetchJson(`${API_BASE}/seasoned-destinations`),
    fetchJson(`${API_BASE}/blogs`),
  ]);

  const staticPaths = [
    "/",
    "/about",
    "/packages",
    "/destinations",
    "/seasoned-destinations",
    "/blog",
  ];

  const entries = [
    ...staticPaths.map((p) => entry(p)),
    ...section("/packages", packages),
    ...section("/destinations", destinations),
    ...section("/seasoned-destinations", seasonal),
    ...section("/blog", blogs),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${entries.join("\n")}\n</urlset>\n`;

  const outPath = path.join(__dirname, "..", "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf-8");
  console.log(`[sitemap] Wrote ${entries.length} URLs to ${outPath}`);

  if (entries.length === staticPaths.length) {
    console.warn("[sitemap] API returned nothing, so only static pages are listed.");
  }
}

main();