
import api from "./axios";



const FRESH_FOR = 5 * 60 * 1000; // no request at all inside this window
const SHORT_FRESH_FOR = 60 * 1000; // for data that changes often
const MAX_AGE = 24 * 60 * 60 * 1000; // never show cached data older than this

/* Bump the version when an API response shape changes, so returning
   visitors do not load old-shaped data. */
const PREFIX = "manyara_cache:v1:";

/* Other tabs listen for this key (see Hero.jsx) and refetch. */
const HERO_UPDATED_KEY = "manyara:hero-updated";

const memory = new Map(); // key -> { data, timestamp }
const pending = new Map(); // key -> Promise (shared in-flight request)
const listeners = new Map(); // key -> Set of callbacks

/* ------------------------------------------------------------
   localStorage helpers (every call is safe if storage is blocked)
   ------------------------------------------------------------ */

const storageKey = (key) => PREFIX + key;

function readStored(key) {
  try {
    const entry = JSON.parse(localStorage.getItem(storageKey(key)));
    return entry && "data" in entry && "timestamp" in entry ? entry : null;
  } catch {
    return null;
  }
}

function writeStored(key, entry) {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch (error) {
    console.warn(`Could not cache "${key}":`, error);
  }
}

/* Remove every stored entry whose key (without prefix) matches. */
function removeStored(matches) {
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const full = localStorage.key(i);
      if (full?.startsWith(PREFIX) && matches(full.slice(PREFIX.length))) {
        doomed.push(full);
      }
    }
    doomed.forEach((full) => localStorage.removeItem(full));
  } catch (error) {
    console.warn("Could not clear cache:", error);
  }
}

/* Drop entries older than MAX_AGE once per page load, so the slug keys
   do not pile up in the visitor's browser. */
function pruneStored() {
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const full = localStorage.key(i);
      if (!full?.startsWith(PREFIX)) continue;
      const entry = readStored(full.slice(PREFIX.length));
      if (!entry || Date.now() - entry.timestamp > MAX_AGE) doomed.push(full);
    }
    doomed.forEach((full) => localStorage.removeItem(full));
  } catch {
    /* ignore */
  }
}

pruneStored();

/* ------------------------------------------------------------
   Core
   ------------------------------------------------------------ */

function getEntry(key) {
  const entry = memory.get(key) ?? readStored(key);
  if (!entry || Date.now() - entry.timestamp > MAX_AGE) return null;

  memory.set(key, entry);
  return entry;
}

/* Save to memory + localStorage and tell anyone watching this key. */
function save(key, data) {
  const entry = { data, timestamp: Date.now() };
  memory.set(key, entry);
  writeStored(key, entry);
  listeners.get(key)?.forEach((callback) => callback(data));
}

/* One request per key at a time, however many callers ask. */
function fetchAndSave(key, requestFn) {
  if (!pending.has(key)) {
    pending.set(
      key,
      Promise.resolve()
        .then(requestFn)
        .then((data) => {
          save(key, data);
          return data;
        })
        .finally(() => pending.delete(key))
    );
  }
  return pending.get(key);
}

function cachedRequest(key, requestFn, freshFor = FRESH_FOR) {
  const entry = getEntry(key);

  if (!entry) return fetchAndSave(key, requestFn);

  if (Date.now() - entry.timestamp >= freshFor) {
    fetchAndSave(key, requestFn).catch((error) =>
      console.warn(`Background refresh failed for "${key}":`, error)
    );
  }

  return Promise.resolve(entry.data);
}

/* Always hits the API, ignoring the freshness window. If a request for
   this key is already in flight (it may have started before an admin
   save), wait for it and then fetch again so the result is current. */
function forceRequest(key, requestFn) {
  if (pending.has(key)) {
    return pending
      .get(key)
      .catch(() => {})
      .then(() => fetchAndSave(key, requestFn));
  }
  return fetchAndSave(key, requestFn);
}

/* Synchronous read: lets a component show cached data on its very
   first render, with no loader flash. Returns undefined when empty. */
export const peekCache = (key) => getEntry(key)?.data;

/* Called whenever fresh data is saved for this key. */
export function subscribe(key, callback) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => listeners.get(key)?.delete(callback);
}

export const clearCache = (key) => {
  memory.delete(key);
  removeStored((k) => k === key);
};

export const clearCacheByPrefix = (prefix) => {
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  removeStored((k) => k.startsWith(prefix));
};

/* Only our own entries are removed, never localStorage.clear(). */
export const clearAllCache = () => {
  memory.clear();
  removeStored(() => true);
};

/* ------------------------------------------------------------
   Query factory
   query(keyOf, fetcher, freshFor) gives a function that behaves like
   before (returns a Promise) plus:
     .key()      cache key for the arguments (useQuery)
     .peek()     synchronous cache read
     .refresh()  force a network fetch, save and notify subscribers
   ------------------------------------------------------------ */

function query(keyOf, fetcher, freshFor) {
  const fn = (...args) =>
    cachedRequest(keyOf(...args), () => fetcher(...args), freshFor);

  fn.key = keyOf;
  fn.peek = (...args) => peekCache(keyOf(...args));
  fn.refresh = (...args) =>
    forceRequest(keyOf(...args), () => fetcher(...args));
  return fn;
}

const get = (url, config) => api.get(url, config).then((res) => res.data);
const slugOf = (slug) => encodeURIComponent(slug);

/* ============================================================
   PACKAGES
   Edited often, so these refresh after 1 minute.
   ============================================================ */

export const getPackages = query(
  (params = {}) => `packages:${JSON.stringify(params)}`,
  (params = {}) => get("/packages", { params }),
  SHORT_FRESH_FOR
);

export const getPackageById = query(
  (id) => `package:${id}`,
  (id) => get(`/packages/${id}`),
  SHORT_FRESH_FOR
);

export const getPackageBySlug = query(
  (slug) => `package-slug:${slug}`,
  (slug) => get(`/packages/slug/${slugOf(slug)}`),
  SHORT_FRESH_FOR
);

export const getPackagesByCollection = query(
  (collection) => `packages-collection:${collection}`,
  (collection) => get("/packages", { params: { collection } }),
  SHORT_FRESH_FOR
);


export const invalidatePackages = () => {
  clearCacheByPrefix("packages:");
  clearCacheByPrefix("package:");
  clearCacheByPrefix("packages-collection:");
};

/* ============================================================
   TESTIMONIALS
   ============================================================ */

export const getTestimonials = query(
  () => "testimonials",
  () => get("/testimonials")
);

/* Not cached. A new testimonial is usually reviewed before it shows,
   so the list is left alone. */
export const createTestimonial = (payload) =>
  api.post("/testimonials", payload).then((res) => res.data);

export const getTestimonialBySlug = query(
  (slug) => `testimonial-slug:${slug}`,
  (slug) => get(`/testimonials/${slugOf(slug)}`)
);

/* ============================================================
   FAQS / MOST VISITED
   Most-visited destinations are edited often, so they refresh
   after 1 minute. FAQs stay on the 5 minute window.
   ============================================================ */

export const getFaqs = query(
  () => "faqs",
  () => get("/faqs")
);

export const getMostVisited = query(
  () => "most-visited",
  () => get("/most-visited"),
  SHORT_FRESH_FOR
);

export const getMostVisitedBySlug = query(
  (slug) => `most-visited-slug:${slug}`,
  (slug) => get(`/most-visited/slug/${slugOf(slug)}`),
  SHORT_FRESH_FOR
);

/* Call after any admin create / update / delete of a most-visited
   destination. */
export const invalidateMostVisited = () => clearCacheByPrefix("most-visited");

/* ============================================================
   BLOGS
   ============================================================ */

export const getBlogs = query(
  () => "blogs",
  () => get("/blogs")
);

export const getBlogBySlug = query(
  (slug) => `blog-slug:${slug}`,
  (slug) => get(`/blogs/slug/${slugOf(slug)}`)
);

const invalidateBlogs = () => {
  clearCache("blogs");
  clearCacheByPrefix("blog-slug:");
};

/* ---------------- Admin blogs ----------------
   NOT cached: the admin list includes drafts, which should not be kept
   in the browser's localStorage, and admins always need the latest. */

export const getAllBlogs = () => get("/blogs/admin/all");

export const createBlog = (payload) =>
  api.post("/blogs/admin", payload).then((res) => {
    invalidateBlogs();
    return res.data;
  });

export const updateBlog = (id, payload) =>
  api.put(`/blogs/admin/${id}`, payload).then((res) => {
    invalidateBlogs();
    return res.data;
  });

export const deleteBlog = (id) =>
  api.delete(`/blogs/admin/${id}`).then((res) => {
    invalidateBlogs();
    return res;
  });

/* ============================================================
   HAPPY MOMENTS
   ============================================================ */

export const getHappyMoments = query(
  () => "happy-moments",
  () => get("/happy-moments")
);

export const getFeaturedHappyMoments = query(
  (limit = 6) => `happy-moments-featured:${limit}`,
  (limit = 6) => get("/happy-moments/featured", { params: { limit } })
);

export const getHappyMomentBySlug = query(
  (slug) => `happy-moment-slug:${slug}`,
  (slug) => get(`/happy-moments/${slugOf(slug)}`)
);

/* Matches "happy-moments", "happy-moments-featured:" and
   "happy-moment-slug:" in one go. */
const invalidateHappyMoments = () => clearCacheByPrefix("happy-moment");

export const createHappyMoment = (payload) =>
  api.post("/happy-moments/admin", payload).then((res) => {
    invalidateHappyMoments();
    return res.data;
  });

export const updateHappyMoment = (id, payload) =>
  api.put(`/happy-moments/admin/${id}`, payload).then((res) => {
    invalidateHappyMoments();
    return res.data;
  });

export const deleteHappyMoment = (id) =>
  api.delete(`/happy-moments/admin/${id}`).then((res) => {
    invalidateHappyMoments();
    return res;
  });

/* ============================================================
   ABOUT
   ============================================================ */

export const getAbout = query(
  () => "about",
  () => get("/about")
);

export const getLeadership = query(
  () => "leadership",
  () => get("/about/leadership")
);

export const getLeadershipBySlug = query(
  (slug) => `leadership-slug:${slug}`,
  (slug) => get(`/about/leadership/${slugOf(slug)}`)
);

export const getTeamMembers = query(
  () => "team-members",
  () => get("/about/team")
);

export const getTeamMemberBySlug = query(
  (slug) => `team-member-slug:${slug}`,
  (slug) => get(`/about/team/${slugOf(slug)}`)
);

/* ============================================================
   SITE SETTINGS
   ============================================================ */

export const getSiteSettings = query(
  () => "site-settings",
  () => get("/settings")
);

/* After an update, the new settings replace the cache and every
   screen showing them (for example the top bar) updates at once. */
export const updateSiteSettings = (payload) =>
  api.put("/settings/admin", payload).then((res) => {
    save("site-settings", res.data);
    return res.data;
  });

/* ============================================================
   PACKAGE BATCHES
   Dates and seats change often, so these refresh after 1 minute.
   ============================================================ */

export const getUpcomingBatches = query(
  () => "upcoming-batches",
  () => get("/package-batches/upcoming"),
  SHORT_FRESH_FOR
);

export const getBatchBySlug = query(
  (slug) => `batch-slug:${slug}`,
  (slug) => get(`/package-batches/slug/${slugOf(slug)}`),
  SHORT_FRESH_FOR
);

export const getBatchesByPackage = query(
  (packageId) => `batches-package:${packageId}`,
  (packageId) => get(`/package-batches/package/${packageId}`),
  SHORT_FRESH_FOR
);

/* Call after any admin create / update / delete of a batch. */
export const invalidateBatches = () => {
  clearCache("upcoming-batches");
  clearCacheByPrefix("batch-slug:");
  clearCacheByPrefix("batches-package:");
};



/* ============================================================
   SEASONED DESTINATIONS
   Edited by admin, so they refresh after 1 minute.
   ============================================================ */

export const getSeasonedDestinations = query(
  () => "seasoned-destinations",
  () => get("/seasoned-destinations"),
  SHORT_FRESH_FOR
);

export const getSeasonedDestinationBySlug = query(
  (slug) => `seasoned-destination-slug:${slug}`,
  (slug) => get(`/seasoned-destinations/${slugOf(slug)}`),
  SHORT_FRESH_FOR
);

/* Matches "seasoned-destinations" and "seasoned-destination-slug:" */
export const invalidateSeasonedDestinations = () =>
  clearCacheByPrefix("seasoned-destination");

/* ============================================================
   HERO
   Home-page carousel slides. Edited often, so it refreshes after
   1 minute. Admin writes below clear the cache and tell other open
   tabs to refetch.
   ============================================================ */

export const getHero = query(
  () => "hero",
  () => get("/hero"),
  SHORT_FRESH_FOR
);

/* Clears the cached slides and pings other tabs (the browser only
   fires "storage" events in tabs other than the one that wrote). */
const invalidateHero = () => {
  clearCache("hero");
  try {
    localStorage.setItem(HERO_UPDATED_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};

/* ------------------------------------------------------------
   Admin Hero APIs
   Admin data is NOT cached because the admin needs the latest
   draft/published state immediately.
   ------------------------------------------------------------ */

export const getAllHeroSlides = () =>
  api.get("/hero/admin/all").then((res) => res.data);

/**
 * Create Hero slide.
 *
 * Backend:
 * POST /hero/admin
 */
export const createHeroSlide = (payload) =>
  api.post("/hero/admin", payload).then((res) => {
    invalidateHero();
    return res.data;
  });

/**
 * Update Hero slide.
 *
 * Backend:
 * PUT /hero/admin/{id}
 */
export const updateHeroSlide = (id, payload) =>
  api.put(`/hero/admin/${id}`, payload).then((res) => {
    invalidateHero();
    return res.data;
  });

/**
 * Delete Hero slide.
 *
 * Backend:
 * DELETE /hero/admin/{id}
 *
 * Backend returns HTTP 204, so there is no response body.
 */
export const deleteHeroSlide = (id) =>
  api.delete(`/hero/admin/${id}`).then((res) => {
    invalidateHero();
    return res;
  });

