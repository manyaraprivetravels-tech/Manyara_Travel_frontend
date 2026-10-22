
import { useEffect, useRef, useState } from "react";

import {
  getAllPackagesAdmin,
  getPackageStatsAdmin,
  createPackage,
  updatePackage,
  deletePackage,
} from "../../api/adminPackages";

import { getAllMostVisitedAdmin } from "../../api/adminMostVisited";

import { getAllSeasonedDestinations } from "../../api/adminSeasonedVisit";

import ImageUploadField from "../../components/admin/ImageUploadField";


// =========================================================
// PAGINATION
// =========================================================

const PAGE_SIZE = 10;
const MAX_LIMIT = 200; // must match backend Query(..., le=200)

// =========================================================
// REGIONS
// =========================================================

const REGION_TABS = [
  { value: "all", label: "All" },
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
];

const REGION_OPTIONS = REGION_TABS.filter((r) => r.value !== "all");

// =========================================================
// PACKAGE TYPES
// =========================================================

const PACKAGE_TYPES = [
  { value: "pilgrimage", label: "Pilgrimage" },
  { value: "mountains_adventure", label: "Mountains & Adventure" },
  { value: "romantic", label: "Romantic" },
  { value: "international", label: "International" },
  { value: "beach", label: "Beach" },
  { value: "family", label: "Family" },
  { value: "wildlife_nature", label: "Wildlife & Nature" },
];

// =========================================================
// DISCOVERY OPTIONS
// =========================================================

const DISCOVERY_OPTIONS = [
  { key: "is_popular", label: "Popular", description: "Show in Popular Packages" },
  { key: "is_recommended", label: "Recommended", description: "Show in Recommended Packages" },
  { key: "is_trending", label: "Trending", description: "Show in Trending Packages" },
  { key: "is_featured", label: "Featured", description: "Show in Featured Packages" },
  { key: "is_new", label: "New", description: "Show in New Packages" },
  { key: "is_most_visited", label: "Most Visited", description: "Show in Most Visited Packages" },
];

// =========================================================
// EMPTY FORM
// =========================================================

const EMPTY_FORM = {
  title: "",

  // Destination
  destination_type: "regular",
  destination: "",
  destination_id: "",
  seasoned_destination_id: "",

  // Package
  region: "domestic",
  package_type: "family",
  display_order: 0,
  price: "",
  duration_days: "",
  duration_nights: "",
  description: "",
  status: "draft",

  // Discovery
  is_popular: false,
  is_recommended: false,
  is_trending: false,
  is_featured: false,
  is_new: false,
  is_most_visited: false,

  // Content
  images: [],
  itinerary: [],
  facilities: [],
  inclusions: [],
  exclusions: [],

  // Policies
  terms_and_conditions: "",
  cancellation_policy: "",
};

const freshForm = () => ({
  ...EMPTY_FORM,
  images: [],
  itinerary: [],
  facilities: [],
  inclusions: [],
  exclusions: [],
});

// Stable keys for itinerary rows and package images (so removing a middle
// item never shifts upload / preview state onto the wrong one).
let keyCounter = 0;
const newKey = () => `key-${Date.now()}-${keyCounter++}`;

// =========================================================
// STYLES
// =========================================================

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all placeholder:text-placeholder focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

const SELECT_CLASS =
  "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all focus:border-rose-300 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-surface";

const TEXTAREA_CLASS =
  "w-full min-w-0 resize-none rounded-xl border border-border bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-800 outline-none transition-all placeholder:text-placeholder focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-ink-800";

const HELP_CLASS = "mt-1.5 text-xs leading-relaxed text-ink-500";

const SECTION_TITLE = "font-display text-2xl font-semibold tracking-tight text-ink-800";

// =========================================================
// HELPERS
// =========================================================

function getDestinationName(destination) {
  return destination?.place_name || destination?.name || destination?.title || "";
}

function getImageUrl(image) {
  if (typeof image === "string") return image;
  return image?.url || "";
}

function toItems(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
    ? data.data
    : [];
}

function getApiError(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== "body").join(".")
          : "";

        return field
          ? `${field}: ${item?.msg || "Validation error"}`
          : item?.msg || "Validation error";
      })
      .join("\n");
  }

  if (typeof detail === "string") return detail;

  return error?.message || fallback;
}

// =========================================================
// SMALL COMPONENTS
// =========================================================

function StatCard({ label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>

      <p
        className={`mt-1 font-display text-3xl font-semibold ${
          accent ? "text-rose-600" : "text-ink-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ title, hint }) {
  return (
    <div className="mb-4">
      <h3 className={SECTION_TITLE}>{title}</h3>
      {hint && <p className="mt-1 text-xs leading-5 text-ink-500">{hint}</p>}
    </div>
  );
}

function DestinationTypeCard({ active, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-rose-300 bg-rose-50 shadow-travel-card"
          : "border-border bg-white hover:border-rose-200 hover:bg-rose-50/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            active ? "border-rose-600 bg-rose-600" : "border-border bg-white"
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>

        <span>
          <span className="block text-sm font-bold text-ink-800">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-ink-500">{text}</span>
        </span>
      </div>
    </button>
  );
}

function ListSection({
  title,
  hint,
  placeholder,
  emptyText,
  removeLabel,
  items,
  onAdd,
  onChange,
  onRemove,
}) {
  return (
    <section className="border-t border-border pt-7">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className={SECTION_TITLE}>{title}</h3>
          <p className="mt-1 text-xs text-ink-500">{hint}</p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
        >
          + Add
        </button>
      </div>

      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder={placeholder}
              className={INPUT_CLASS}
            />

            <button
              type="button"
              onClick={() => onRemove(index)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
              aria-label={removeLabel}
            >
              ×
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}

// =========================================================
// COMPONENT
// =========================================================

export default function PackagesManage() {
  const [packages, setPackages] = useState([]);

  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    featured: 0,
  });

  const [destinations, setDestinations] = useState([]);

  const [seasonedDestinations, setSeasonedDestinations] = useState([]);

  // Loaders
  const [loading, setLoading] = useState(true); // first load
  const [loadingMore, setLoadingMore] = useState(false); // "Load more"
  const [refreshing, setRefreshing] = useState(false); // filters / after save
  const [deletingId, setDeletingId] = useState(null);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [seasonedLoading, setSeasonedLoading] = useState(true);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [typeFilter, setTypeFilter] = useState("all");

  const [regionFilter, setRegionFilter] = useState("all");

  // Image uploads currently running (so Save can't run mid-upload)
  const [busyUploads, setBusyUploads] = useState(() => new Set());

  const requestIdRef = useRef(0);

  const initialLoadDone = useRef(false);

  const uploading = busyUploads.size > 0;

  const trackUpload = (key) => (isBusy) =>
    setBusyUploads((prev) => {
      if (prev.has(key) === isBusy) return prev;

      const next = new Set(prev);
      if (isBusy) next.add(key);
      else next.delete(key);

      return next;
    });

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    regionFilter !== "all";

  // =========================================================
  // LOAD PACKAGES (server-side pagination + filters)
  // =========================================================

  // Debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);

    return () => clearTimeout(t);
  }, [search]);

  const fetchPackages = async ({ skip = 0, limit = PAGE_SIZE, mode } = {}) => {
    const resolvedMode = mode || (initialLoadDone.current ? "refresh" : "initial");

    // Ignore out-of-order responses (fast typing / quick filter changes)
    const requestId = ++requestIdRef.current;

    try {
      if (resolvedMode === "initial") setLoading(true);
      if (resolvedMode === "more") setLoadingMore(true);
      if (resolvedMode === "refresh") setRefreshing(true);

      const data = await getAllPackagesAdmin({
        skip,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter,
        package_type: typeFilter,
        region: regionFilter,
      });

      if (requestId !== requestIdRef.current) return;

      const items = toItems(data);

      setPackages((prev) => {
        if (resolvedMode !== "more") return items;

        const seen = new Set(prev.map((p) => p.id));

        return [...prev, ...items.filter((p) => !seen.has(p.id))];
      });

      setTotal(Array.isArray(data) ? items.length : data?.total ?? items.length);

      initialLoadDone.current = true;
      setError("");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error("Failed to load packages:", err);

      setError(getApiError(err, "Could not load packages."));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  };

  // First load + whenever search / filters change → back to page 1
  useEffect(() => {
    fetchPackages({ skip: 0, limit: PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, typeFilter, regionFilter]);

  const handleLoadMore = () =>
    fetchPackages({
      skip: packages.length,
      limit: PAGE_SIZE,
      mode: "more",
    });

  // After save / delete: reload everything already loaded
  const reloadCurrent = () =>
    fetchPackages({
      skip: 0,
      limit: Math.min(Math.max(packages.length, PAGE_SIZE), MAX_LIMIT),
      mode: "refresh",
    });

  const hasMore = packages.length < total;

  // =========================================================
  // LOAD STATS (summary cards)
  // =========================================================

  const loadStats = async () => {
    try {
      setStats(await getPackageStatsAdmin());
    } catch (err) {
      console.error("Failed to load package stats:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // =========================================================
  // LOAD MOST VISITED DESTINATIONS
  // =========================================================

  const loadDestinations = async () => {
    try {
      setDestinationsLoading(true);

      const data = await getAllMostVisitedAdmin();

      setDestinations(toItems(data));
    } catch (err) {
      console.error("Failed to load destinations:", err);

      setDestinations([]);

      setError(getApiError(err, "Could not load Most Visited destinations."));
    } finally {
      setDestinationsLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  // =========================================================
  // LOAD SEASONAL DESTINATIONS
  // =========================================================

  const loadSeasonedDestinations = async () => {
    try {
      setSeasonedLoading(true);

      const data = await getAllSeasonedDestinations();

      setSeasonedDestinations(toItems(data));
    } catch (err) {
      console.error("Failed to load seasonal destinations:", err);

      setSeasonedDestinations([]);

      // Seasonal destinations are optional.
      // Package management can still continue.
    } finally {
      setSeasonedLoading(false);
    }
  };

  useEffect(() => {
    loadSeasonedDestinations();
  }, []);

  // =========================================================
  // FORM HELPERS
  // =========================================================

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleDiscovery = (field) => {
    setForm((current) => ({ ...current, [field]: !current[field] }));
  };

  // =========================================================
  // DESTINATION TYPE
  // =========================================================

  const handleDestinationTypeChange = (type) => {
    setForm((current) => ({
      ...current,
      destination_type: type,

      destination_id: type === "regular" ? current.destination_id : "",

      seasoned_destination_id:
        type === "seasonal" ? current.seasoned_destination_id : "",

      destination: type === "seasonal" ? "" : current.destination,
    }));

    setError("");
  };

  const handleRegularDestinationChange = (selectedValue) => {
    const selectedId = Number(selectedValue);

    const selected = destinations.find(
      (destination) => Number(destination?.id) === selectedId
    );

    setForm((current) => ({
      ...current,
      destination_type: "regular",
      destination_id: selectedId || "",
      seasoned_destination_id: "",
      destination: getDestinationName(selected),
    }));
  };

  const handleSeasonalDestinationChange = (selectedValue) => {
    setForm((current) => ({
      ...current,
      destination_type: "seasonal",
      destination_id: "",
      seasoned_destination_id: selectedValue || "",
      destination: "",
    }));
  };

  // =========================================================
  // OPEN CREATE
  // =========================================================

  const openCreate = () => {
    setForm({
      ...freshForm(),
      // Default to the region tab currently open
      region: regionFilter !== "all" ? regionFilter : "domestic",
    });

    setBusyUploads(new Set());

    setError("");

    setEditing({});
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEdit = (pkg) => {
    const seasonalId =
      pkg?.seasoned_destination_id ?? pkg?.seasoned_destination_obj?.id ?? "";

    const regularId = pkg?.destination_id ?? pkg?.destination_obj?.id ?? "";

    const isSeasonal = Boolean(seasonalId) && !Boolean(regularId);

    setForm({
      title: pkg?.title || "",

      destination_type: isSeasonal ? "seasonal" : "regular",

      destination: isSeasonal ? "" : pkg?.destination || "",

      destination_id: isSeasonal ? "" : regularId,

      seasoned_destination_id: isSeasonal ? seasonalId : "",

      region: pkg?.region || "domestic",

      package_type: pkg?.package_type || "family",

      display_order: pkg?.display_order ?? 0,

      price: pkg?.price ?? "",

      duration_days: pkg?.duration_days ?? "",

      duration_nights:
        pkg?.duration_nights ??
        ((Number(pkg?.duration_days) || 0) > 0
          ? Math.max(Number(pkg.duration_days) - 1, 0)
          : ""),

      description: pkg?.description || "",

      status: pkg?.status || "draft",

      is_popular: Boolean(pkg?.is_popular),
      is_recommended: Boolean(pkg?.is_recommended),
      is_trending: Boolean(pkg?.is_trending),
      is_featured: Boolean(pkg?.is_featured),
      is_new: Boolean(pkg?.is_new),
      is_most_visited: Boolean(pkg?.is_most_visited),

      // _key is UI-only (stable identity for each tile) and is NOT sent
      images: Array.isArray(pkg?.images)
        ? pkg.images
            .map((img) => (typeof img === "string" ? { url: img } : img))
            .filter((img) => img?.url)
            .map((img) => ({ ...img, _key: newKey() }))
        : [],

      itinerary: Array.isArray(pkg?.itinerary)
        ? pkg.itinerary.map((item, index) => ({
            _key: newKey(),
            day: index + 1,
            title: item?.title || "",
            description: item?.description || "",
            image: getImageUrl(item?.image) || null,
          }))
        : [],

      facilities: Array.isArray(pkg?.facilities) ? pkg.facilities : [],

      inclusions: Array.isArray(pkg?.inclusions) ? pkg.inclusions : [],

      exclusions: Array.isArray(pkg?.exclusions) ? pkg.exclusions : [],

      terms_and_conditions: pkg?.terms_and_conditions || "",

      cancellation_policy: pkg?.cancellation_policy || "",
    });

    setBusyUploads(new Set());

    setError("");

    setEditing(pkg);
  };

  // =========================================================
  // RESOLVE LEGACY NORMAL DESTINATION
  // =========================================================
  //
  // Only applies to old normal packages that have a
  // destination name but no destination_id.
  // Never applies to seasonal packages.
  // =========================================================

  useEffect(() => {
    if (
      form.destination_type !== "regular" ||
      form.destination_id ||
      !form.destination ||
      destinations.length === 0
    ) {
      return;
    }

    const normalized = form.destination.trim().toLowerCase();

    const match = destinations.find((destination) => {
      const name = getDestinationName(destination);

      return name.trim().toLowerCase() === normalized;
    });

    if (match?.id) {
      setForm((current) => ({
        ...current,
        destination_type: "regular",
        destination_id: Number(match.id),
        seasoned_destination_id: "",
        destination: getDestinationName(match) || current.destination,
      }));
    }
  }, [destinations, form.destination, form.destination_id, form.destination_type]);

  // =========================================================
  // ITINERARY
  // =========================================================

  const addItineraryDay = () => {
    setForm((current) => ({
      ...current,

      itinerary: [
        ...current.itinerary,
        {
          _key: newKey(),
          day: current.itinerary.length + 1,
          title: "",
          description: "",
          image: null,
        },
      ],
    }));
  };

  const updateItineraryDay = (index, field, value) => {
    setForm((current) => ({
      ...current,

      itinerary: current.itinerary.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItineraryDay = (index) => {
    setForm((current) => ({
      ...current,

      itinerary: current.itinerary
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, day: i + 1 })),
    }));
  };

  // Called by the day's ImageUploadField: a new / re-cropped image, or null (removed).
  const setItineraryImage = (index, img) => {
    setForm((current) => ({
      ...current,

      itinerary: current.itinerary.map((item, i) =>
        i === index ? { ...item, image: img?.url || null } : item
      ),
    }));
  };

  // =========================================================
  // PACKAGE IMAGES
  // =========================================================

  const addImage = (img) => {
    if (!img?.url) return;

    setForm((current) => ({
      ...current,
      images: [...current.images, { ...img, _key: newKey() }],
    }));
  };

  // Re-cropped / replaced image: keep the same tile identity
  const replaceImage = (index, img) => {
    if (!img?.url) return;

    setForm((current) => ({
      ...current,
      images: current.images.map((item, i) =>
        i === index ? { ...img, _key: item._key } : item
      ),
    }));
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  };

  const makeCover = (index) => {
    setForm((current) => {
      const next = [...current.images];
      const [picked] = next.splice(index, 1);

      return { ...current, images: [picked, ...next] };
    });
  };

  // =========================================================
  // LIST FIELDS
  // =========================================================

  const addListItem = (field) => {
    setForm((current) => ({
      ...current,
      [field]: [...current[field], ""],
    }));
  };

  const updateListItem = (field, index, value) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeListItem = (field, index) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter((_, i) => i !== index),
    }));
  };

  // =========================================================
  // SAVE PACKAGE
  // =========================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (uploading) {
      setError("Please wait for image uploads to finish.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // -----------------------------------------------------
      // BASIC VALIDATION
      // -----------------------------------------------------

      if (!form.title.trim()) {
        setError("Package title is required.");
        return;
      }

      // -----------------------------------------------------
      // REGION VALIDATION
      // -----------------------------------------------------

      if (!REGION_OPTIONS.some((r) => r.value === form.region)) {
        setError("Please select a region (Domestic or International).");
        return;
      }

      // -----------------------------------------------------
      // DESTINATION VALIDATION
      // -----------------------------------------------------

      if (
        form.destination_type !== "regular" &&
        form.destination_type !== "seasonal"
      ) {
        setError("Please select a destination type.");
        return;
      }

      if (form.destination_type === "regular" && !Number(form.destination_id)) {
        setError("Please select a regular destination.");
        return;
      }

      if (
        form.destination_type === "seasonal" &&
        !Number(form.seasoned_destination_id)
      ) {
        setError("Please select a seasonal destination.");
        return;
      }

      // -----------------------------------------------------
      // PRICE
      // -----------------------------------------------------

      if (!Number(form.price) || Number(form.price) <= 0) {
        setError("Price must be greater than 0.");
        return;
      }

      // -----------------------------------------------------
      // DURATION
      // -----------------------------------------------------

      if (!Number(form.duration_days) || Number(form.duration_days) < 1) {
        setError("Duration (days) must be at least 1.");
        return;
      }

      // -----------------------------------------------------
      // DESTINATION IDS
      // -----------------------------------------------------

      const normalDestinationId =
        form.destination_type === "regular" ? Number(form.destination_id) : null;

      const seasonalDestinationId =
        form.destination_type === "seasonal"
          ? Number(form.seasoned_destination_id)
          : null;

      // -----------------------------------------------------
      // PAYLOAD
      // -----------------------------------------------------

      const payload = {
        title: form.title.trim(),

        // IMPORTANT:
        // We intentionally DO NOT send `destination`.
        // Backend derives it from the selected normal destination.
        // Seasonal packages get destination = NULL.

        destination_id: normalDestinationId,

        seasoned_destination_id: seasonalDestinationId,

        region: form.region,

        package_type: form.package_type,

        display_order: Number(form.display_order) || 0,

        price: Number(form.price),

        duration_days: Number(form.duration_days),

        duration_nights: Number(
          form.duration_nights || Math.max(Number(form.duration_days) - 1, 0)
        ),

        description: form.description.trim() || null,

        status: form.status,

        // Discovery
        is_popular: Boolean(form.is_popular),
        is_recommended: Boolean(form.is_recommended),
        is_trending: Boolean(form.is_trending),
        is_featured: Boolean(form.is_featured),
        is_new: Boolean(form.is_new),
        is_most_visited: Boolean(form.is_most_visited),

        // Images (_key is UI-only and is NOT sent)
        images: form.images
          .filter((img) => Boolean(img?.url))
          .map((img) => ({
            url: img.url,
            ...(img?.public_id ? { public_id: img.public_id } : {}),
          })),

        // Itinerary (_key is UI-only and is NOT sent)
        itinerary: form.itinerary.map((item, index) => ({
          day: index + 1,
          title: item?.title?.trim() || "",
          description: item?.description?.trim() || "",
          image: item?.image || null,
        })),

        // Lists
        facilities: form.facilities.map((item) => item.trim()).filter(Boolean),

        inclusions: form.inclusions.map((item) => item.trim()).filter(Boolean),

        exclusions: form.exclusions.map((item) => item.trim()).filter(Boolean),

        // Policies
        terms_and_conditions: form.terms_and_conditions.trim() || null,

        cancellation_policy: form.cancellation_policy.trim() || null,
      };

      // UPDATE
      if (editing?.id) {
        await updatePackage(editing.id, payload);
      }

      // CREATE
      else {
        await createPackage(payload);
      }

      setEditing(null);

      setForm(freshForm());

      await Promise.all([reloadCurrent(), loadStats()]);
    } catch (err) {
      console.error("Package save failed:", err);

      setError(getApiError(err, "Failed to save package."));
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this package? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(id);

      await deletePackage(id);

      await Promise.all([reloadCurrent(), loadStats()]);
    } catch (err) {
      console.error("Package delete failed:", err);

      setError(getApiError(err, "Could not delete package."));
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setEditing(null);

    setForm(freshForm());

    setBusyUploads(new Set());

    setError("");
  };

  // =========================================================
  // DISCOVERY LABELS
  // =========================================================

  const getDiscoveryLabels = (pkg) =>
    DISCOVERY_OPTIONS.filter((option) => Boolean(pkg?.[option.key]));

  // =========================================================
  // DESTINATION DISPLAY
  // =========================================================

  const getPackageDestinationName = (pkg) => {
    if (pkg?.seasoned_destination_id) {
      const match = seasonedDestinations.find(
        (d) => Number(d?.id) === Number(pkg.seasoned_destination_id)
      );

      return getDestinationName(match) || "Seasonal destination";
    }

    return pkg?.destination || "—";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full w-full min-w-0 overflow-x-hidden bg-background p-3 sm:p-5 md:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full bg-rose-500" />

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
              Manyara Prive Vacations
            </span>
          </div>

          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-800 sm:text-5xl">
            Packages
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-500">
            Create and manage travel packages, destinations, visibility sections,
            itineraries and package policies.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-travel-hover focus:outline-none focus:ring-4 focus:ring-rose-100 sm:w-auto"
        >
          <span className="text-lg leading-none transition-transform duration-200 group-hover:rotate-90">
            +
          </span>

          New Package
        </button>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && !editing && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-error/20 bg-error-bg px-4 py-3.5 text-sm text-error-text shadow-travel-card">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
            !
          </span>

          <p className="whitespace-pre-line leading-6">{error}</p>
        </div>
      )}

      {/* =====================================================
          SUMMARY (from /packages/admin/stats)
      ====================================================== */}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Packages" value={stats.total} />
        <StatCard label="Published" value={stats.published} accent />
        <StatCard label="Drafts" value={stats.draft} />
        <StatCard label="Featured" value={stats.featured} accent />
      </div>

      {/* =====================================================
          REGION TABS (top filter)
      ====================================================== */}

      <div
        role="tablist"
        aria-label="Filter packages by region"
        className="mb-4 inline-flex max-w-full overflow-x-auto rounded-2xl border border-border bg-white p-1 shadow-travel-card"
      >
        {REGION_TABS.map((tab) => {
          const active = regionFilter === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRegionFilter(tab.value)}
              className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-bold transition-colors ${
                active
                  ? "bg-rose-600 text-white shadow-brand"
                  : "text-ink-600 hover:bg-rose-50 hover:text-rose-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =====================================================
          FILTER BAR
      ====================================================== */}

      <div className="mb-5 rounded-2xl border border-border bg-white p-3 shadow-travel-card sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search package or destination..."
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="all">All Package Types</option>

            {PACKAGE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-ink-500">
            Showing <span className="font-bold text-ink-700">{packages.length}</span>{" "}
            of <span className="font-bold text-ink-700">{total}</span>{" "}
            {hasActiveFilters ? "matching packages" : "packages"}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setTypeFilter("all");
                setRegionFilter("all");
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          PACKAGE TABLE
      ====================================================== */}

      {loading ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-travel-card">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-rose-100 border-t-rose-600" />

          <p className="text-sm font-medium text-ink-500">Loading packages...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-travel-card">
          <div className="border-b border-border bg-surface-alt px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-800">
                  Package Catalogue
                </h2>

                <p className="text-xs text-ink-500">
                  Manage package content and website visibility.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {refreshing && (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-100 border-t-rose-600" />
                    Updating...
                  </span>
                )}

                <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                  {total} package{total === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`w-full overflow-x-auto transition-opacity duration-200 ${
              refreshing ? "pointer-events-none opacity-50" : "opacity-100"
            }`}
          >
            <table className="w-full min-w-[1150px] text-sm">
              <thead className="bg-surface text-[11px] uppercase tracking-[0.12em] text-ink-500">
                <tr>
                  <th className="px-5 py-3.5 text-left font-bold">Package</th>
                  <th className="px-5 py-3.5 text-left font-bold">Region</th>
                  <th className="px-5 py-3.5 text-left font-bold">Destination</th>
                  <th className="px-5 py-3.5 text-left font-bold">Type</th>
                  <th className="px-5 py-3.5 text-left font-bold">Price</th>
                  <th className="px-5 py-3.5 text-left font-bold">Visibility</th>
                  <th className="px-5 py-3.5 text-left font-bold">Status</th>
                  <th className="px-5 py-3.5 text-right font-bold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {packages.map((pkg) => {
                  const labels = getDiscoveryLabels(pkg);

                  const isSeasonal = Boolean(pkg?.seasoned_destination_id);

                  const isDeleting = deletingId === pkg.id;

                  const thumb = getImageUrl(pkg?.images?.[0]);

                  return (
                    <tr
                      key={pkg.id}
                      className="border-t border-border transition-colors hover:bg-surface-alt"
                    >
                      {/* PACKAGE */}

                      <td className="px-5 py-4">
                        <div className="flex max-w-[280px] items-center gap-3">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-xl bg-surface object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-lg text-rose-600">
                              ✦
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink-800">
                              {pkg.title}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-ink-500">
                              {pkg.duration_days} days {pkg.duration_nights ?? 0} nights
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* REGION */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                            pkg.region === "international"
                              ? "border-sky-100 bg-sky-50 text-sky-700"
                              : "border-rose-100 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {pkg.region === "international" ? "International" : "Domestic"}
                        </span>
                      </td>

                      {/* DESTINATION */}

                      <td className="px-5 py-4">
                        <span className="text-ink-700">
                          {getPackageDestinationName(pkg)}
                        </span>

                        <span
                          className={`mt-1 block text-[11px] font-semibold ${
                            isSeasonal ? "text-rose-600" : "text-ink-400"
                          }`}
                        >
                          {isSeasonal ? "Seasonal destination" : "Regular destination"}
                        </span>
                      </td>

                      {/* PACKAGE TYPE */}

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                          {PACKAGE_TYPES.find((type) => type.value === pkg.package_type)
                            ?.label ||
                            pkg.package_type ||
                            "Family"}
                        </span>
                      </td>

                      {/* PRICE */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-semibold text-ink-800">
                          ₹{Number(pkg.price).toLocaleString("en-IN")}
                        </span>

                        <span className="block text-[11px] text-ink-400">
                          starting price
                        </span>
                      </td>

                      {/* VISIBILITY */}

                      <td className="px-5 py-4">
                        <div className="flex max-w-[260px] flex-wrap gap-1.5">
                          {labels.length > 0 ? (
                            labels.map((option) => (
                              <span
                                key={option.key}
                                className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
                              >
                                {option.label}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-ink-400">No labels</span>
                          )}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            pkg.status === "published"
                              ? "bg-success-bg text-success-text"
                              : "bg-surface-strong text-ink-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              pkg.status === "published" ? "bg-success" : "bg-ink-400"
                            }`}
                          />

                          {pkg.status === "published" ? "Published" : "Draft"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(pkg)}
                            disabled={isDeleting}
                            className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:border-rose-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(pkg.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-error/15 bg-error-bg px-3 py-1.5 text-xs font-bold text-error-text transition-colors hover:border-error/25 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting && (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-error-text/30 border-t-error-text" />
                            )}

                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {packages.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl text-rose-600">
                          ✦
                        </div>

                        <p className="font-display text-xl font-semibold text-ink-800">
                          No packages found
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-500">
                          Try changing your filters or create a new travel package.
                        </p>

                        {!hasActiveFilters && (
                          <button
                            type="button"
                            onClick={openCreate}
                            className="mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-brand transition-colors hover:bg-rose-700"
                          >
                            Create First Package
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ---------- FOOTER: count + load more ---------- */}

          {packages.length > 0 && (
            <div className="flex flex-col items-center gap-3 border-t border-border bg-surface-alt px-4 py-4 sm:flex-row sm:justify-between sm:px-5">
              <p className="text-xs text-ink-500">
                Showing <span className="font-bold text-ink-700">{packages.length}</span>{" "}
                of <span className="font-bold text-ink-700">{total}</span> packages
              </p>

              {hasMore && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore || refreshing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {loadingMore && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
                  )}

                  {loadingMore
                    ? "Loading..."
                    : `Load ${Math.min(PAGE_SIZE, total - packages.length)} more`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl sm:h-[94vh] sm:rounded-3xl">
            {/* MODAL HEADER */}

            <div className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-6 rounded-full bg-rose-500" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">
                      Package Manager
                    </span>
                  </div>

                  <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-800">
                    {editing?.id ? "Edit Package" : "Create New Package"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-ink-500 sm:text-sm">
                    Manage package content, destinations, itinerary, images and
                    website visibility.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* FORM */}

            <form onSubmit={handleSave} className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-7 p-4 sm:p-6 lg:p-8">
                {/* =============================================
                    BASIC DETAILS
                ============================================== */}

                <section className="rounded-2xl border border-border bg-surface-alt p-4 sm:p-5">
                  <SectionHeader
                    title="Basic Details"
                    hint="Define the main package information, pricing and destination."
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* TITLE */}

                    <div className="sm:col-span-2">
                      <label htmlFor="package-title" className={LABEL_CLASS}>
                        Package Title
                      </label>

                      <input
                        id="package-title"
                        required
                        value={form.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="Example: Kerala 5 Days Premium Package"
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* DESTINATION TYPE */}

                    <div className="sm:col-span-2">
                      <label className={LABEL_CLASS}>
                        Destination Type
                        <span className="ml-1 text-rose-600">*</span>
                      </label>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DestinationTypeCard
                          active={form.destination_type === "regular"}
                          title="Regular Destination"
                          text="Use a normal destination from Most Visited."
                          onClick={() => handleDestinationTypeChange("regular")}
                        />

                        <DestinationTypeCard
                          active={form.destination_type === "seasonal"}
                          title="Seasonal Destination"
                          text="Use a destination available for a specific season."
                          onClick={() => handleDestinationTypeChange("seasonal")}
                        />
                      </div>

                      <p className={HELP_CLASS}>
                        A package belongs to exactly one destination type.
                      </p>
                    </div>

                    {/* REGULAR DESTINATION */}

                    {form.destination_type === "regular" && (
                      <div className="sm:col-span-2">
                        <label htmlFor="package-destination" className={LABEL_CLASS}>
                          Regular Destination
                          <span className="ml-1 text-rose-600">*</span>
                        </label>

                        <select
                          id="package-destination"
                          required
                          value={form.destination_id}
                          disabled={destinationsLoading}
                          onChange={(e) => handleRegularDestinationChange(e.target.value)}
                          className={SELECT_CLASS}
                        >
                          <option value="">
                            {destinationsLoading
                              ? "Loading destinations..."
                              : "Select destination"}
                          </option>

                          {destinations.map((destination) => (
                            <option key={destination.id} value={destination.id}>
                              {getDestinationName(destination)}
                            </option>
                          ))}
                        </select>

                        <p className={HELP_CLASS}>
                          Select the normal destination from Most Visited.
                        </p>
                      </div>
                    )}

                    {/* SEASONAL DESTINATION */}

                    {form.destination_type === "seasonal" && (
                      <div className="sm:col-span-2">
                        <label htmlFor="seasonal-destination" className={LABEL_CLASS}>
                          Seasonal Destination
                          <span className="ml-1 text-rose-600">*</span>
                        </label>

                        <select
                          id="seasonal-destination"
                          required
                          value={form.seasoned_destination_id}
                          disabled={seasonedLoading}
                          onChange={(e) => handleSeasonalDestinationChange(e.target.value)}
                          className={SELECT_CLASS}
                        >
                          <option value="">
                            {seasonedLoading
                              ? "Loading seasonal destinations..."
                              : "Select seasonal destination"}
                          </option>

                          {seasonedDestinations
                            .filter(
                              (destination) =>
                                destination?.status === undefined ||
                                destination?.status === "published"
                            )
                            .map((destination) => (
                              <option key={destination.id} value={destination.id}>
                                {getDestinationName(destination)}
                              </option>
                            ))}
                        </select>

                        <p className={HELP_CLASS}>
                          This package will be associated only with the selected
                          seasonal destination.
                        </p>
                      </div>
                    )}

                    {/* REGION */}

                    <div>
                      <label htmlFor="package-region" className={LABEL_CLASS}>
                        Region
                        <span className="ml-1 text-rose-600">*</span>
                      </label>

                      <select
                        id="package-region"
                        required
                        value={form.region}
                        onChange={(e) => updateField("region", e.target.value)}
                        className={SELECT_CLASS}
                      >
                        {REGION_OPTIONS.map((region) => (
                          <option key={region.value} value={region.value}>
                            {region.label}
                          </option>
                        ))}
                      </select>

                      <p className={HELP_CLASS}>
                        Domestic (within India) or International.
                      </p>
                    </div>

                    {/* PACKAGE TYPE */}

                    <div>
                      <label htmlFor="package-type" className={LABEL_CLASS}>
                        Package Type
                      </label>

                      <select
                        id="package-type"
                        value={form.package_type}
                        onChange={(e) => updateField("package_type", e.target.value)}
                        className={SELECT_CLASS}
                      >
                        {PACKAGE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* STATUS */}

                    <div>
                      <label htmlFor="package-status" className={LABEL_CLASS}>
                        Publishing Status
                      </label>

                      <select
                        id="package-status"
                        value={form.status}
                        onChange={(e) => updateField("status", e.target.value)}
                        className={SELECT_CLASS}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    {/* PRICE */}

                    <div>
                      <label htmlFor="package-price" className={LABEL_CLASS}>
                        Package cost (₹)
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-500">
                          ₹
                        </span>

                        <input
                          id="package-price"
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => updateField("price", e.target.value)}
                          placeholder="25000"
                          className={`${INPUT_CLASS} pl-8`}
                        />
                      </div>
                    </div>

                    {/* DISPLAY ORDER */}

                    <div>
                      <label htmlFor="package-order" className={LABEL_CLASS}>
                        Display Order
                      </label>

                      <input
                        id="package-order"
                        type="number"
                        min="0"
                        value={form.display_order}
                        onChange={(e) => updateField("display_order", e.target.value)}
                        placeholder="0"
                        className={INPUT_CLASS}
                      />

                      <p className={HELP_CLASS}>Lower numbers appear first.</p>
                    </div>

                    {/* DAYS */}

                    <div>
                      <label htmlFor="package-days" className={LABEL_CLASS}>
                        Duration — Days
                      </label>

                      <input
                        id="package-days"
                        type="number"
                        required
                        min="1"
                        value={form.duration_days}
                        onChange={(e) => updateField("duration_days", e.target.value)}
                        placeholder="5"
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* NIGHTS */}

                    <div>
                      <label htmlFor="package-nights" className={LABEL_CLASS}>
                        Duration — Nights
                      </label>

                      <input
                        id="package-nights"
                        type="number"
                        required
                        min="0"
                        value={form.duration_nights}
                        onChange={(e) => updateField("duration_nights", e.target.value)}
                        placeholder="4"
                        className={INPUT_CLASS}
                      />

                      <p className={HELP_CLASS}>
                        Usually days minus one. Example: 5 days = 4 nights.
                      </p>
                    </div>
                  </div>
                </section>

                {/* =============================================
                    DISCOVERY / VISIBILITY
                ============================================== */}

                <section className="rounded-2xl border border-rose-100 bg-brand-gradient p-4 sm:p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                      ✦
                    </span>

                    <div>
                      <h3 className={SECTION_TITLE}>Website Visibility</h3>

                      <p className="text-xs text-ink-500">
                        Choose where this package should appear.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {DISCOVERY_OPTIONS.map((option) => {
                      const checked = Boolean(form[option.key]);

                      return (
                        <label
                          key={option.key}
                          className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                            checked
                              ? "border-rose-200 bg-white shadow-travel-card"
                              : "border-border/70 bg-white/70 hover:border-rose-100 hover:bg-white"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-all ${
                              checked
                                ? "border-rose-600 bg-rose-600 text-white"
                                : "border-border bg-white text-transparent"
                            }`}
                          >
                            {checked && "✓"}
                          </span>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDiscovery(option.key)}
                            className="sr-only"
                          />

                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-ink-800">
                              {option.label}
                            </span>

                            <span className="mt-0.5 block text-xs leading-5 text-ink-500">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/80 bg-white/75 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
                      Current discovery labels
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {DISCOVERY_OPTIONS.filter((option) => form[option.key]).map(
                        (option) => (
                          <span
                            key={option.key}
                            className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100"
                          >
                            {option.label}
                          </span>
                        )
                      )}

                      {DISCOVERY_OPTIONS.every((option) => !form[option.key]) && (
                        <span className="text-xs text-ink-400">
                          No discovery sections selected.
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                {/* =============================================
                    DESCRIPTION
                ============================================== */}

                <section>
                  <SectionHeader
                    title="Package Description"
                    hint="Give travellers a clear overview of the experience."
                  />

                  <textarea
                    rows={6}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe the destination, experience, highlights and what makes this package special..."
                    className={TEXTAREA_CLASS}
                  />
                </section>

                {/* =============================================
                    ITINERARY
                ============================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className={SECTION_TITLE}>Day-by-Day Itinerary</h3>

                      <p className="mt-1 text-xs leading-5 text-ink-500">
                        Add activities, descriptions and a dedicated image for each
                        day. Every day image is cropped to the same landscape shape
                        (4:3), so all days look identical on the website and in the
                        downloaded PDF.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addItineraryDay}
                      className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-brand transition-all hover:bg-rose-700 sm:w-auto"
                    >
                      + Add Day
                    </button>
                  </div>

                  {form.itinerary.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-rose-200 bg-brand-gradient p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-rose-600 shadow-sm">
                        ✦
                      </div>

                      <p className="font-semibold text-ink-700">No itinerary days yet</p>

                      <p className="mt-1 text-xs text-ink-500">
                        Click “Add Day” to create Day 1.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {form.itinerary.map((item, index) => (
                      <div
                        key={item._key || index}
                        className="overflow-hidden rounded-2xl border border-border bg-white shadow-travel-card"
                      >
                        {/* DAY HEADER */}

                        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-alt px-4 py-3.5 sm:px-5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white shadow-sm">
                              {index + 1}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-ink-800">
                                Day {index + 1}
                              </p>

                              <p className="truncate text-xs text-ink-500">
                                {item?.title?.trim() || `Day ${index + 1} itinerary details`}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItineraryDay(index)}
                            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-error-text transition-colors hover:bg-error-bg"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="p-4 sm:p-5">
                          {/* DAY TITLE */}

                          <div className="mb-4">
                            <label className={LABEL_CLASS}>Day {index + 1} Title</label>

                            <input
                              required
                              value={item?.title || ""}
                              onChange={(e) =>
                                updateItineraryDay(index, "title", e.target.value)
                              }
                              placeholder="Example: Arrival in Kochi & Local Sightseeing"
                              className={INPUT_CLASS}
                            />
                          </div>

                          {/* DAY DESCRIPTION */}

                          <div className="mb-5">
                            <label className={LABEL_CLASS}>
                              Day {index + 1} Description
                            </label>

                            <textarea
                              required
                              rows={4}
                              value={item?.description || ""}
                              onChange={(e) =>
                                updateItineraryDay(index, "description", e.target.value)
                              }
                              placeholder="Describe activities, sightseeing, meals, transfers and experiences for this day..."
                              className={TEXTAREA_CLASS}
                            />
                          </div>

                          {/* DAY IMAGE
                              Same 4:3 frame for every day. The photo fills it
                              (no empty space); Crop lets you choose what shows. */}

                          <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <label className="text-sm font-bold text-ink-800">
                                Day {index + 1} Image
                              </label>

                              {item?.image && (
                                <span className="rounded-full bg-success-bg px-2.5 py-1 text-[10px] font-bold text-success-text">
                                  Image added
                                </span>
                              )}
                            </div>

                            <ImageUploadField
                              value={item?.image ? { url: item.image } : null}
                              onChange={(img) => setItineraryImage(index, img)}
                              label=""
                              size="lg"
                              onBusyChange={trackUpload(
                                `day-image-${item._key || index}`
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {form.itinerary.length > 0 && (
                    <button
                      type="button"
                      onClick={addItineraryDay}
                      className="mt-4 w-full rounded-xl border border-dashed border-rose-200 bg-rose-50/50 py-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50"
                    >
                      + Add Day {form.itinerary.length + 1}
                    </button>
                  )}
                </section>

                {/* =============================================
                    PACKAGE IMAGES
                ============================================== */}

                <section className="border-t border-border pt-7">
                  <SectionHeader
                    title="Package Images"
                    hint="The first image is the large cover on the package page. Every image is cropped to landscape 16:9, so it fills its frame with nothing cut off. A “Trimmed” tag means an older photo is not 16:9 yet: click Crop on it to choose what shows."
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {form.images.map((img, index) => (
                      <div key={img._key} className="min-w-0">
                        <ImageUploadField
                          value={img}
                          onChange={(result) =>
                            result ? replaceImage(index, result) : removeImage(index)
                          }
                          label=""
                         
                          onBusyChange={trackUpload(`package-image-${img._key}`)}
                        />

                        <ImageUploadField
                          value={null}
                          onChange={addImage}
                          label=""
                          resetOnSuccess
                          onBusyChange={trackUpload("package-image-new")}
                        />

                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold ${
                              index === 0 ? "text-rose-600" : "text-ink-500"
                            }`}
                          >
                            {index === 0 ? "Cover image" : `Image ${index + 1}`}
                          </span>

                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => makeCover(index)}
                              className="text-xs font-semibold text-rose-600 hover:underline"
                            >
                              Set as cover
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add slot: same 16:9 shape, clears itself after each upload */}
                    <div className="min-w-0">
                      <ImageUploadField
                        value={null}
                        onChange={addImage}
                        label=""
                        
                        resetOnSuccess
                        onBusyChange={trackUpload("package-image-new")}
                      />

                      <p className="mt-1.5 text-xs text-ink-400">
                        {form.images.length === 0 ? "Add cover image" : "Add image"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* =============================================
                    FACILITIES / INCLUSIONS / EXCLUSIONS
                ============================================== */}

                <ListSection
                  title="Facilities"
                  hint="Hotel, breakfast, transport, AC, guide, etc."
                  placeholder="Example: Breakfast included"
                  emptyText="No facilities added."
                  removeLabel="Remove facility"
                  items={form.facilities}
                  onAdd={() => addListItem("facilities")}
                  onChange={(i, v) => updateListItem("facilities", i, v)}
                  onRemove={(i) => removeListItem("facilities", i)}
                />

                <ListSection
                  title="Inclusions"
                  hint="What is included in the package?"
                  placeholder="Example: 4 nights hotel accommodation"
                  emptyText="No inclusions added."
                  removeLabel="Remove inclusion"
                  items={form.inclusions}
                  onAdd={() => addListItem("inclusions")}
                  onChange={(i, v) => updateListItem("inclusions", i, v)}
                  onRemove={(i) => removeListItem("inclusions", i)}
                />

                <ListSection
                  title="Exclusions"
                  hint="What is not included?"
                  placeholder="Example: Flight tickets"
                  emptyText="No exclusions added."
                  removeLabel="Remove exclusion"
                  items={form.exclusions}
                  onAdd={() => addListItem("exclusions")}
                  onChange={(i, v) => updateListItem("exclusions", i, v)}
                  onRemove={(i) => removeListItem("exclusions", i)}
                />

                {/* =============================================
                    TERMS
                ============================================== */}

                <section className="border-t border-border pt-7">
                  <SectionHeader
                    title="Terms & Conditions"
                    hint="Package-specific terms shown to travellers."
                  />

                  <textarea
                    rows={7}
                    value={form.terms_and_conditions}
                    onChange={(e) => updateField("terms_and_conditions", e.target.value)}
                    placeholder="Enter package terms and conditions..."
                    className={TEXTAREA_CLASS}
                  />
                </section>

                {/* =============================================
                    CANCELLATION
                ============================================== */}

                <section className="border-t border-border pt-7">
                  <SectionHeader
                    title="Cancellation Policy"
                    hint="Explain cancellation and refund rules for this package."
                  />

                  <textarea
                    rows={7}
                    value={form.cancellation_policy}
                    onChange={(e) => updateField("cancellation_policy", e.target.value)}
                    placeholder="Enter cancellation policy..."
                    className={TEXTAREA_CLASS}
                  />
                </section>

                {/* ERROR */}

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-error/20 bg-error-bg px-4 py-3.5 text-sm text-error-text">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
                      !
                    </span>

                    <p className="whitespace-pre-line leading-6">{error}</p>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}

              <div className="sticky bottom-0 z-20 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                  {uploading && (
                    <span className="text-center text-xs font-semibold text-rose-600 sm:mr-auto sm:text-left">
                      Uploading images… please wait before saving.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink-600 transition-colors hover:bg-surface disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-brand transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}

                    {saving
                      ? "Saving..."
                      : uploading
                      ? "Uploading..."
                      : editing?.id
                      ? "Update Package"
                      : "Save Package"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

