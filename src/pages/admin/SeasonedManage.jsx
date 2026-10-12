
import { useEffect, useRef, useState } from "react";
import {
  getSeasonedDestinationsPaged,
  getSeasonedDestinationsStatsAdmin,
  createSeasonedDestination,
  updateSeasonedDestination,
  deleteSeasonedDestination,
  renumberSeasonedDestinations,
} from "../../api/adminSeasonedVisit";
import ImageUploadField from "../../components/admin/ImageUploadField";

// =========================================================
// PAGINATION
// =========================================================

const PAGE_SIZE = 12; // fits the 2 / 3 / 4 column card grid evenly
const MAX_LIMIT = 200; // must match backend Query(..., le=200)

// =========================================================
// FORM
// =========================================================

const EMPTY_FORM = {
  place_name: "",
  slug: "",
  description: "",
  season_label: "",
  season_start_date: "",
  season_end_date: "",
  best_time_to_visit: "",
  starting_from: "",
  display_order: 0,
  image: null,
  status: "published",
};

// =========================================================
// HELPERS
// =========================================================

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180);

// "2026-06-01" -> local date (avoids the UTC day-shift of new Date(string))
const formatDate = (value) => {
  if (!value) return "";

  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);

  if (!y || !m || !d) return "";

  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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

  if (typeof detail === "string") {
    return detail;
  }

  return error?.message || fallback;
}

const fieldClass =
  "w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-border bg-input text-sm text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-placeholder transition";

const filterFieldClass =
  "w-full min-w-0 px-3 sm:px-4 py-2.5 rounded-lg border border-border bg-input text-sm text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-placeholder transition";

const labelClass = "block text-sm font-medium text-text-dark mb-1.5";
const hintClass = "text-xs text-muted mt-1";

// =========================================================
// COMPONENT
// =========================================================

export default function SeasonedManage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });

  // Loaders
  const [loading, setLoading] = useState(true); // first load
  const [loadingMore, setLoadingMore] = useState(false); // "Load more"
  const [refreshing, setRefreshing] = useState(false); // filters / after save
  const [deletingId, setDeletingId] = useState(null);
  const [renumbering, setRenumbering] = useState(false);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const requestIdRef = useRef(0);
  const initialLoadDone = useRef(false);

  const isEditingExisting = Boolean(editing?.id);
  const hasActiveFilters = Boolean(search) || statusFilter !== "all";

  // =========================================================
  // LOAD (server-side pagination + filters)
  // =========================================================

  // Debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);

    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = async ({ skip = 0, limit = PAGE_SIZE, mode } = {}) => {
    const resolvedMode =
      mode || (initialLoadDone.current ? "refresh" : "initial");

    // Ignore out-of-order responses (fast typing / quick filter changes)
    const requestId = ++requestIdRef.current;

    try {
      if (resolvedMode === "initial") setLoading(true);
      if (resolvedMode === "more") setLoadingMore(true);
      if (resolvedMode === "refresh") setRefreshing(true);

      const data = await getSeasonedDestinationsPaged({
        skip,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter,
      });

      if (requestId !== requestIdRef.current) return;

      const list = Array.isArray(data) ? data : data?.items ?? [];

      setItems((prev) => {
        if (resolvedMode !== "more") return list;

        const seen = new Set(prev.map((p) => p.id));

        return [...prev, ...list.filter((p) => !seen.has(p.id))];
      });

      setTotal(Array.isArray(data) ? list.length : data?.total ?? list.length);

      initialLoadDone.current = true;
      setError("");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error("Failed to load seasonal destinations:", err);

      setError(getApiError(err, "Could not load destinations."));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  };

  // First load + whenever search / filter change -> back to page 1
  useEffect(() => {
    fetchItems({ skip: 0, limit: PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const handleLoadMore = () =>
    fetchItems({ skip: items.length, limit: PAGE_SIZE, mode: "more" });

  // After save / delete / renumber: reload everything already loaded
  const reloadCurrent = () =>
    fetchItems({
      skip: 0,
      limit: Math.min(Math.max(items.length, PAGE_SIZE), MAX_LIMIT),
      mode: "refresh",
    });

  const hasMore = items.length < total;

  // =========================================================
  // LOAD STATS (summary cards)
  // =========================================================

  const loadStats = async () => {
    try {
      setStats(await getSeasonedDestinationsStatsAdmin());
    } catch (err) {
      console.error("Failed to load seasonal destination stats:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // =========================================================
  // OPEN CREATE / EDIT
  // =========================================================

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError("");
    setEditing({});
  };

  const openEdit = (m) => {
    setForm({
      place_name: m.place_name || "",
      slug: m.slug || "",
      description: m.description || "",
      season_label: m.season_label || "",
      season_start_date: m.season_start_date || "",
      season_end_date: m.season_end_date || "",
      best_time_to_visit: m.best_time_to_visit || "",
      starting_from:
        m.starting_from !== null && m.starting_from !== undefined
          ? m.starting_from
          : "",
      display_order: m.display_order ?? 0,
      image: m.image || null,
      status: m.status || "published",
    });
    setError("");
    setEditing(m);
  };

  const closeModal = () => {
    if (saving) return;

    setEditing(null);
    setError("");
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.image) {
      setError("Please upload an image — it's required for this entry.");
      return;
    }

    if (
      form.season_start_date &&
      form.season_end_date &&
      form.season_end_date < form.season_start_date
    ) {
      setError("Season end date can't be before the start date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Was the place renamed while editing?
      const nameChanged =
        isEditingExisting &&
        form.place_name.trim() !== (editing.place_name || "").trim();

      const payload = {
        ...form,
        // New entry or renamed place: build the slug from the name.
        // Unchanged name: keep the current slug (it may carry a suffix
        // like "-2" that the API added to keep it unique).
        slug:
          isEditingExisting && !nameChanged
            ? form.slug
            : slugify(form.place_name),
        display_order: Number(form.display_order) || 0,
        description: form.description || null,
        season_label: form.season_label || null,
        season_start_date: form.season_start_date || null,
        season_end_date: form.season_end_date || null,
        best_time_to_visit: form.best_time_to_visit || null,
        starting_from:
          form.starting_from === "" ? null : Number(form.starting_from),
      };

      if (isEditingExisting) {
        await updateSeasonedDestination(editing.id, payload);
      } else {
        await createSeasonedDestination(payload);
      }

      setEditing(null);

      await Promise.all([reloadCurrent(), loadStats()]);
    } catch (err) {
      setError(getApiError(err, "Could not save entry"));
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this seasonal destination? Packages linked to it are kept and just unlinked."
      )
    )
      return;

    try {
      setDeletingId(id);
      setError("");

      await deleteSeasonedDestination(id);

      await Promise.all([reloadCurrent(), loadStats()]);
    } catch (err) {
      setError(getApiError(err, "Could not delete destination"));
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // RENUMBER
  // =========================================================

  const handleRenumber = async () => {
    setRenumbering(true);
    setError("");

    try {
      await renumberSeasonedDestinations();

      await reloadCurrent();
    } catch (err) {
      setError(getApiError(err, "Could not renumber display order"));
    } finally {
      setRenumbering(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold text-text-display">
          Seasonal Destinations
        </h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {stats.total > 1 && (
            <button
              type="button"
              onClick={handleRenumber}
              disabled={renumbering || refreshing}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-white text-sm font-medium text-text hover:border-primary hover:text-primary disabled:opacity-60 transition-colors"
            >
              {renumbering && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-primary" />
              )}

              {renumbering ? "Renumbering…" : "Fix order numbers"}
            </button>
          )}

          <button
            onClick={openCreate}
            className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-brand transition-colors"
          >
            + New Destination
          </button>
        </div>
      </div>

      {/* Page-level error (load / delete failures) */}
      {error && !editing && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error-text"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold">
            !
          </span>

          <p className="whitespace-pre-line break-words">{error}</p>
        </div>
      )}

      {/* Summary (from /admin/stats) */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card rounded-xl border border-divider p-3 sm:p-4">
          <p className="text-xs text-muted">Total</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-text-display">
            {stats.total}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-divider p-3 sm:p-4">
          <p className="text-xs text-muted">Published</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-text-display">
            {stats.published}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-divider p-3 sm:p-4">
          <p className="text-xs text-muted">Drafts</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-text-display">
            {stats.draft}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-xl border border-divider p-3 sm:p-4 mb-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by place or season label..."
            className={filterFieldClass}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={filterFieldClass}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">
            Showing{" "}
            <span className="font-semibold text-text-dark">{items.length}</span>{" "}
            of <span className="font-semibold text-text-dark">{total}</span>{" "}
            {hasActiveFilters ? "matching destinations" : "destinations"}
          </p>

          <div className="flex items-center gap-3">
            {refreshing && (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-primary" />
                Updating...
              </span>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-xs font-semibold text-link hover:text-link-hover hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Destination List */}
      {loading ? (
        <div className="rounded-xl border border-divider bg-card p-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-muted text-sm">Loading destinations…</p>
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 transition-opacity duration-200 ${
              refreshing || renumbering
                ? "pointer-events-none opacity-50"
                : "opacity-100"
            }`}
          >
            {items.map((m) => {
              const isDeleting = deletingId === m.id;

              return (
                <div
                  key={m.id}
                  className="bg-card rounded-xl border border-divider shadow-travel-card overflow-hidden min-w-0"
                >
                  {/* Image */}
                  <div className="relative h-40 sm:h-36 md:h-40 bg-surface">
                    {m.image?.url && (
                      <img
                        src={m.image.url}
                        alt={m.place_name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    )}

                    {m.season_label && (
                      <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-travel-card">
                        {m.season_label}
                      </span>
                    )}

                    <span
                      className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        m.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-warning-bg text-warning-text"
                      }`}
                    >
                      {m.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 min-w-0">
                    <p className="font-semibold text-text-dark text-sm sm:text-base break-words">
                      {m.place_name}
                    </p>

                    <p className="text-xs text-muted mt-0.5 break-all">
                      /{m.slug}
                    </p>

                    <p className="text-xs text-muted mt-0.5">
                      Order: {m.display_order}
                    </p>

                    {m.description && (
                      <p className="text-xs text-text mt-2 line-clamp-2 break-words">
                        {m.description}
                      </p>
                    )}

                    {(m.season_start_date || m.season_end_date) && (
                      <p className="text-xs text-text mt-2 break-words">
                        <span className="font-medium">Season:</span>{" "}
                        {formatDate(m.season_start_date) || "—"} to{" "}
                        {formatDate(m.season_end_date) || "—"}
                      </p>
                    )}

                    {m.best_time_to_visit && (
                      <p className="text-xs text-text mt-1 break-words">
                        <span className="font-medium">Best time:</span>{" "}
                        {m.best_time_to_visit}
                      </p>
                    )}

                    {m.starting_from !== null &&
                      m.starting_from !== undefined && (
                        <p className="text-xs text-text mt-1 break-words">
                          <span className="font-medium">Starting from:</span> ₹
                          {Number(m.starting_from).toLocaleString("en-IN")}
                        </p>
                      )}

                    <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        onClick={() => openEdit(m)}
                        disabled={isDeleting}
                        className="w-full sm:w-auto text-link hover:text-link-hover text-sm font-medium hover:underline text-left sm:text-center py-1 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={isDeleting}
                        className="inline-flex w-full sm:w-auto items-center gap-1.5 text-error-text text-sm font-medium hover:underline text-left sm:text-center py-1 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                        )}

                        {isDeleting ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="col-span-full py-8 text-center">
                <p className="text-muted text-sm">
                  {hasActiveFilters
                    ? "No seasonal destinations match your filters."
                    : "No seasonal destinations yet. Add your first one."}
                </p>
              </div>
            )}
          </div>

          {/* Load more */}
          {items.length > 0 && hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore || refreshing}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border bg-white px-6 py-2.5 text-sm font-semibold text-text-dark transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                )}

                {loadingMore
                  ? "Loading…"
                  : `Load ${Math.min(PAGE_SIZE, total - items.length)} more`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center p-2 sm:p-4 z-[70]">
          <div className="bg-card rounded-xl sm:rounded-2xl w-full max-w-md h-[96vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto shadow-travel-hover">
            <div className="sticky top-0 z-10 bg-card px-4 sm:px-6 py-4 border-b border-divider">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-text-display break-words">
                {isEditingExisting
                  ? "Edit Seasonal Destination"
                  : "New Seasonal Destination"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              {/* Place Name */}
              <div>
                <label className={labelClass}>Place Name</label>
                <input
                  required
                  maxLength={150}
                  value={form.place_name}
                  onChange={(e) =>
                    setForm({ ...form, place_name: e.target.value })
                  }
                  placeholder="e.g. Munnar"
                  className={fieldClass}
                />
                <p className={hintClass}>
                  The page URL is created from the place name
                  {isEditingExisting && " and updates if you rename it"}.
                </p>
              </div>

              {/* Season Label */}
              <div>
                <label className={labelClass}>Season Label</label>
                <input
                  maxLength={150}
                  value={form.season_label}
                  onChange={(e) =>
                    setForm({ ...form, season_label: e.target.value })
                  }
                  placeholder="e.g. Monsoon Magic"
                  className={fieldClass}
                />
                <p className={hintClass}>
                  Destinations with the same label are grouped together on the
                  public page.
                </p>
              </div>

              {/* Season dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Season Starts</label>
                  <input
                    type="date"
                    value={form.season_start_date}
                    onChange={(e) =>
                      setForm({ ...form, season_start_date: e.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Season Ends</label>
                  <input
                    type="date"
                    min={form.season_start_date || undefined}
                    value={form.season_end_date}
                    onChange={(e) =>
                      setForm({ ...form, season_end_date: e.target.value })
                    }
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Why is this place great in this season?"
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {/* Best Time */}
              <div>
                <label className={labelClass}>Best Time to Visit</label>
                <input
                  type="text"
                  maxLength={255}
                  value={form.best_time_to_visit}
                  onChange={(e) =>
                    setForm({ ...form, best_time_to_visit: e.target.value })
                  }
                  placeholder="e.g. June to September"
                  className={fieldClass}
                />
              </div>

              {/* Starting From */}
              <div>
                <label className={labelClass}>Starting From (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.starting_from}
                  onChange={(e) =>
                    setForm({ ...form, starting_from: e.target.value })
                  }
                  placeholder="e.g. 12999"
                  className={fieldClass}
                />
              </div>

              {/* Display Order */}
              <div>
                <label className={labelClass}>Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({ ...form, display_order: e.target.value })
                  }
                  className={fieldClass}
                />
                <p className={hintClass}>
                  Position in the full list (1 = first). Leave 0 to add it last.
                  Other destinations shift automatically.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={fieldClass}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Image */}
              <ImageUploadField
                value={form.image}
                onChange={(img) => setForm({ ...form, image: img })}
                label="Destination Image"
              />

              {error && (
                <p
                  role="alert"
                  className="text-sm text-error-text break-words whitespace-pre-line"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-surface-strong disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent text-white shadow-brand hover:bg-accent-hover disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}














































// import { useEffect, useState } from "react";
// import {
//   getAllSeasonedDestinations,
//   createSeasonedDestination,
//   updateSeasonedDestination,
//   deleteSeasonedDestination,
//   renumberSeasonedDestinations,
// } from "../../api/adminSeasonedVisit";
// import ImageUploadField from "../../components/admin/ImageUploadField";

// const EMPTY_FORM = {
//   place_name: "",
//   slug: "",
//   description: "",
//   season_label: "",
//   season_start_date: "",
//   season_end_date: "",
//   best_time_to_visit: "",
//   starting_from: "",
//   display_order: 0,
//   image: null,
//   status: "published",
// };

// const slugify = (text) =>
//   text
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9\s-]/g, "")
//     .replace(/\s+/g, "-")
//     .replace(/-+/g, "-")
//     .slice(0, 180);

// const formatDate = (value) =>
//   value
//     ? new Date(value).toLocaleDateString("en-IN", {
//         day: "numeric",
//         month: "short",
//         year: "numeric",
//       })
//     : "";

// const getErrorMessage = (err, fallback) => {
//   const detail = err?.response?.data?.detail;
//   if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
//   return detail || fallback;
// };

// const fieldClass =
//   "w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-border bg-input text-sm text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-placeholder transition";

// const labelClass = "block text-sm font-medium text-text-dark mb-1.5";
// const hintClass = "text-xs text-muted mt-1";

// export default function SeasonedManage() {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(null);
//   const [form, setForm] = useState(EMPTY_FORM);
//   const [saving, setSaving] = useState(false);
//   const [renumbering, setRenumbering] = useState(false);
//   const [error, setError] = useState("");

//   const load = () => {
//     setLoading(true);
//     getAllSeasonedDestinations()
//       .then((data) =>
//         setItems(data.sort((a, b) => a.display_order - b.display_order))
//       )
//       .catch((err) =>
//         setError(getErrorMessage(err, "Could not load destinations"))
//       )
//       .finally(() => setLoading(false));
//   };

//   useEffect(load, []);

//   const isEditingExisting = Boolean(editing?.id);

//   const openCreate = () => {
//     setForm(EMPTY_FORM);
//     setError("");
//     setEditing({});
//   };

//   const openEdit = (m) => {
//     setForm({
//       place_name: m.place_name || "",
//       slug: m.slug || "",
//       description: m.description || "",
//       season_label: m.season_label || "",
//       season_start_date: m.season_start_date || "",
//       season_end_date: m.season_end_date || "",
//       best_time_to_visit: m.best_time_to_visit || "",
//       starting_from:
//         m.starting_from !== null && m.starting_from !== undefined
//           ? m.starting_from
//           : "",
//       display_order: m.display_order ?? 0,
//       image: m.image || null,
//       status: m.status || "published",
//     });
//     setError("");
//     setEditing(m);
//   };

//   const handleSave = async (e) => {
//     e.preventDefault();

//     if (!form.image) {
//       setError("Please upload an image — it's required for this entry.");
//       return;
//     }

//     if (
//       form.season_start_date &&
//       form.season_end_date &&
//       form.season_end_date < form.season_start_date
//     ) {
//       setError("Season end date can't be before the start date.");
//       return;
//     }

//     setSaving(true);
//     setError("");

//     try {
//       // Was the place renamed while editing?
//       const nameChanged =
//         isEditingExisting &&
//         form.place_name.trim() !== (editing.place_name || "").trim();

//       const payload = {
//         ...form,
//         // New entry or renamed place: build the slug from the name.
//         // Unchanged name: keep the current slug (it may carry a suffix
//         // like "-2" that the API added to keep it unique).
//         slug:
//           isEditingExisting && !nameChanged
//             ? form.slug
//             : slugify(form.place_name),
//         display_order: Number(form.display_order) || 0,
//         description: form.description || null,
//         season_label: form.season_label || null,
//         season_start_date: form.season_start_date || null,
//         season_end_date: form.season_end_date || null,
//         best_time_to_visit: form.best_time_to_visit || null,
//         starting_from:
//           form.starting_from === "" ? null : Number(form.starting_from),
//       };

//       if (isEditingExisting) {
//         await updateSeasonedDestination(editing.id, payload);
//       } else {
//         await createSeasonedDestination(payload);
//       }

//       setEditing(null);
//       load();
//     } catch (err) {
//       setError(getErrorMessage(err, "Could not save entry"));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (
//       !confirm(
//         "Delete this seasonal destination? Packages linked to it are kept and just unlinked."
//       )
//     )
//       return;

//     try {
//       await deleteSeasonedDestination(id);
//       load();
//     } catch (err) {
//       setError(getErrorMessage(err, "Could not delete destination"));
//     }
//   };

//   const handleRenumber = async () => {
//     setRenumbering(true);
//     setError("");

//     try {
//       await renumberSeasonedDestinations();
//       load();
//     } catch (err) {
//       setError(getErrorMessage(err, "Could not renumber display order"));
//     } finally {
//       setRenumbering(false);
//     }
//   };

//   return (
//     <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
//       {/* Header */}
//       <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
//         <h1 className="font-display text-2xl font-semibold text-text-display">
//           Seasonal Destinations
//         </h1>

//         <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
//           {items.length > 1 && (
//             <button
//               type="button"
//               onClick={handleRenumber}
//               disabled={renumbering}
//               className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border bg-white text-sm font-medium text-text hover:border-primary hover:text-primary disabled:opacity-60 transition-colors"
//             >
//               {renumbering ? "Renumbering…" : "Fix order numbers"}
//             </button>
//           )}

//           <button
//             onClick={openCreate}
//             className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-brand transition-colors"
//           >
//             + New Destination
//           </button>
//         </div>
//       </div>

//       {error && !editing && (
//         <p role="alert" className="text-sm text-error-text mb-4 break-words">
//           {error}
//         </p>
//       )}

//       {/* Destination List */}
//       {loading ? (
//         <p className="text-muted text-sm">Loading…</p>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
//           {items.map((m) => (
//             <div
//               key={m.id}
//               className="bg-card rounded-xl border border-divider shadow-travel-card overflow-hidden min-w-0"
//             >
//               {/* Image */}
//               <div className="relative h-40 sm:h-36 md:h-40 bg-surface">
//                 {m.image?.url && (
//                   <img
//                     src={m.image.url}
//                     alt={m.place_name}
//                     className="w-full h-full object-cover"
//                   />
//                 )}

//                 {m.season_label && (
//                   <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-travel-card">
//                     {m.season_label}
//                   </span>
//                 )}

//                 {m.status === "draft" && (
//                   <span className="absolute right-2 top-2 rounded-full bg-warning-bg px-2.5 py-1 text-[11px] font-semibold text-warning-text">
//                     Draft
//                   </span>
//                 )}
//               </div>

//               {/* Content */}
//               <div className="p-3 sm:p-4 min-w-0">
//                 <p className="font-semibold text-text-dark text-sm sm:text-base break-words">
//                   {m.place_name}
//                 </p>

//                 <p className="text-xs text-muted mt-0.5 break-all">
//                   /{m.slug}
//                 </p>

//                 <p className="text-xs text-muted mt-0.5">
//                   Order: {m.display_order}
//                 </p>

//                 {m.description && (
//                   <p className="text-xs text-text mt-2 line-clamp-2 break-words">
//                     {m.description}
//                   </p>
//                 )}

//                 {(m.season_start_date || m.season_end_date) && (
//                   <p className="text-xs text-text mt-2 break-words">
//                     <span className="font-medium">Season:</span>{" "}
//                     {formatDate(m.season_start_date) || "—"} to{" "}
//                     {formatDate(m.season_end_date) || "—"}
//                   </p>
//                 )}

//                 {m.best_time_to_visit && (
//                   <p className="text-xs text-text mt-1 break-words">
//                     <span className="font-medium">Best time:</span>{" "}
//                     {m.best_time_to_visit}
//                   </p>
//                 )}

//                 {m.starting_from !== null && m.starting_from !== undefined && (
//                   <p className="text-xs text-text mt-1 break-words">
//                     <span className="font-medium">Starting from:</span> ₹
//                     {Number(m.starting_from).toLocaleString("en-IN")}
//                   </p>
//                 )}

//                 <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:gap-3">
//                   <button
//                     onClick={() => openEdit(m)}
//                     className="w-full sm:w-auto text-link hover:text-link-hover text-sm font-medium hover:underline text-left sm:text-center py-1"
//                   >
//                     Edit
//                   </button>

//                   <button
//                     onClick={() => handleDelete(m.id)}
//                     className="w-full sm:w-auto text-error-text text-sm font-medium hover:underline text-left sm:text-center py-1"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {items.length === 0 && (
//             <div className="col-span-full py-8 text-center">
//               <p className="text-muted text-sm">
//                 No seasonal destinations yet. Add your first one.
//               </p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Create / Edit Modal */}
//       {editing !== null && (
//         <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center p-2 sm:p-4 z-[70]">
//           <div className="bg-card rounded-xl sm:rounded-2xl w-full max-w-md h-[96vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto shadow-travel-hover">
//             <div className="sticky top-0 z-10 bg-card px-4 sm:px-6 py-4 border-b border-divider">
//               <h2 className="font-display text-lg sm:text-xl font-semibold text-text-display break-words">
//                 {isEditingExisting
//                   ? "Edit Seasonal Destination"
//                   : "New Seasonal Destination"}
//               </h2>
//             </div>

//             <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
//               {/* Place Name */}
//               <div>
//                 <label className={labelClass}>Place Name</label>
//                 <input
//                   required
//                   maxLength={150}
//                   value={form.place_name}
//                   onChange={(e) =>
//                     setForm({ ...form, place_name: e.target.value })
//                   }
//                   placeholder="e.g. Munnar"
//                   className={fieldClass}
//                 />
//                 <p className={hintClass}>
//                   The page URL is created from the place name
//                   {isEditingExisting && " and updates if you rename it"}.
//                 </p>
//               </div>

//               {/* Season Label */}
//               <div>
//                 <label className={labelClass}>Season Label</label>
//                 <input
//                   maxLength={150}
//                   value={form.season_label}
//                   onChange={(e) =>
//                     setForm({ ...form, season_label: e.target.value })
//                   }
//                   placeholder="e.g. Monsoon Magic"
//                   className={fieldClass}
//                 />
//                 <p className={hintClass}>
//                   Destinations with the same label are grouped together on the
//                   public page.
//                 </p>
//               </div>

//               {/* Season dates */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className={labelClass}>Season Starts</label>
//                   <input
//                     type="date"
//                     value={form.season_start_date}
//                     onChange={(e) =>
//                       setForm({ ...form, season_start_date: e.target.value })
//                     }
//                     className={fieldClass}
//                   />
//                 </div>

//                 <div>
//                   <label className={labelClass}>Season Ends</label>
//                   <input
//                     type="date"
//                     min={form.season_start_date || undefined}
//                     value={form.season_end_date}
//                     onChange={(e) =>
//                       setForm({ ...form, season_end_date: e.target.value })
//                     }
//                     className={fieldClass}
//                   />
//                 </div>
//               </div>

//               {/* Description */}
//               <div>
//                 <label className={labelClass}>Description</label>
//                 <textarea
//                   rows={3}
//                   value={form.description}
//                   onChange={(e) =>
//                     setForm({ ...form, description: e.target.value })
//                   }
//                   placeholder="Why is this place great in this season?"
//                   className={`${fieldClass} resize-none`}
//                 />
//               </div>

//               {/* Best Time */}
//               <div>
//                 <label className={labelClass}>Best Time to Visit</label>
//                 <input
//                   type="text"
//                   maxLength={255}
//                   value={form.best_time_to_visit}
//                   onChange={(e) =>
//                     setForm({ ...form, best_time_to_visit: e.target.value })
//                   }
//                   placeholder="e.g. June to September"
//                   className={fieldClass}
//                 />
//               </div>

//               {/* Starting From */}
//               <div>
//                 <label className={labelClass}>Starting From (₹)</label>
//                 <input
//                   type="number"
//                   min="0"
//                   step="0.01"
//                   value={form.starting_from}
//                   onChange={(e) =>
//                     setForm({ ...form, starting_from: e.target.value })
//                   }
//                   placeholder="e.g. 12999"
//                   className={fieldClass}
//                 />
//               </div>

//               {/* Display Order */}
//               <div>
//                 <label className={labelClass}>Display Order</label>
//                 <input
//                   type="number"
//                   min="0"
//                   value={form.display_order}
//                   onChange={(e) =>
//                     setForm({ ...form, display_order: e.target.value })
//                   }
//                   className={fieldClass}
//                 />
//                 <p className={hintClass}>
//                   Position in the list (1 = first). Leave 0 to add it last.
//                   Other destinations shift automatically.
//                 </p>
//               </div>

//               {/* Status */}
//               <div>
//                 <label className={labelClass}>Status</label>
//                 <select
//                   value={form.status}
//                   onChange={(e) =>
//                     setForm({ ...form, status: e.target.value })
//                   }
//                   className={fieldClass}
//                 >
//                   <option value="published">Published</option>
//                   <option value="draft">Draft</option>
//                 </select>
//               </div>

//               {/* Image */}
//               <ImageUploadField
//                 value={form.image}
//                 onChange={(img) => setForm({ ...form, image: img })}
//                 label="Destination Image"
//               />

//               {error && (
//                 <p role="alert" className="text-sm text-error-text break-words">
//                   {error}
//                 </p>
//               )}

//               <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => setEditing(null)}
//                   className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-surface-strong"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent text-white shadow-brand hover:bg-accent-hover disabled:opacity-60"
//                 >
//                   {saving ? "Saving…" : "Save"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






























