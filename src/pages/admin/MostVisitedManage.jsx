import { useEffect, useRef, useState } from "react";
import {
  getMostVisitedPaged,
  getMostVisitedStatsAdmin,
  createMostVisited,
  updateMostVisited,
  deleteMostVisited,
} from "../../api/adminMostVisited";
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
  description: "",
  best_time_to_visit: "",
  starting_from: "",
  display_order: 0,
  image: null,
  status: "published",
};

// =========================================================
// HELPERS
// =========================================================

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

// =========================================================
// COMPONENT
// =========================================================

export default function MostVisitedManage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });

  // Loaders
  const [loading, setLoading] = useState(true); // first load
  const [loadingMore, setLoadingMore] = useState(false); // "Load more"
  const [refreshing, setRefreshing] = useState(false); // filters / after save
  const [deletingId, setDeletingId] = useState(null);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const requestIdRef = useRef(0);
  const initialLoadDone = useRef(false);

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

      const data = await getMostVisitedPaged({
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

      console.error("Failed to load destinations:", err);

      setError(getApiError(err, "Could not load destinations."));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  };

  // First load + whenever search / filter change → back to page 1
  useEffect(() => {
    fetchItems({ skip: 0, limit: PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const handleLoadMore = () =>
    fetchItems({ skip: items.length, limit: PAGE_SIZE, mode: "more" });

  // After save / delete: reload everything already loaded
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
      setStats(await getMostVisitedStatsAdmin());
    } catch (err) {
      console.error("Failed to load destination stats:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // =========================================================
  // OPEN CREATE / EDIT
  // =========================================================

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      image: null,
    });
    setError("");
    setEditing({});
  };

  const openEdit = (m) => {
    setForm({
      place_name: m.place_name || "",
      description: m.description || "",
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

  // =========================================================
  // SAVE
  // =========================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.image) {
      setError("Please upload an image — it's required for this entry.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        display_order: Number(form.display_order),
        // Send null when the admin leaves Starting From empty
        starting_from:
          form.starting_from === "" ? null : Number(form.starting_from),
      };

      if (editing.id) {
        await updateMostVisited(editing.id, payload);
      } else {
        await createMostVisited(payload);
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
    if (!window.confirm("Delete this destination?")) return;

    try {
      setDeletingId(id);

      await deleteMostVisited(id);

      await Promise.all([reloadCurrent(), loadStats()]);
    } catch (err) {
      setError(getApiError(err, "Could not delete destination"));
    } finally {
      setDeletingId(null);
    }
  };

  const closeModal = () => {
    if (saving) return;

    setEditing(null);
    setError("");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy">
          Most Visited
        </h1>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Destination
        </button>
      </div>

      {/* Page-level error (load / delete failures) */}
      {error && !editing && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold">
            !
          </span>

          <p className="whitespace-pre-line break-words">{error}</p>
        </div>
      )}

      {/* Summary (from /most-visited/admin/stats) */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-navy/10 p-3 sm:p-4">
          <p className="text-xs text-navy/50">Total</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-navy">
            {stats.total}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-navy/10 p-3 sm:p-4">
          <p className="text-xs text-navy/50">Published</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-navy">
            {stats.published}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-navy/10 p-3 sm:p-4">
          <p className="text-xs text-navy/50">Drafts</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-semibold text-navy">
            {stats.draft}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-navy/10 p-3 sm:p-4 mb-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by place name..."
            className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-navy/15 text-sm min-w-0"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-navy/15 text-sm min-w-0"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-navy/50">
            Showing <span className="font-semibold text-navy">{items.length}</span>{" "}
            of <span className="font-semibold text-navy">{total}</span>{" "}
            {hasActiveFilters ? "matching destinations" : "destinations"}
          </p>

          <div className="flex items-center gap-3">
            {refreshing && (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-navy/60">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy/15 border-t-navy" />
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
                className="text-xs font-semibold text-secondary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Destination List */}
      {loading ? (
        <div className="rounded-xl border border-navy/10 bg-white p-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-navy/15 border-t-navy" />
          <p className="text-navy/50 text-sm">Loading destinations…</p>
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 transition-opacity duration-200 ${
              refreshing ? "pointer-events-none opacity-50" : "opacity-100"
            }`}
          >
            {items.map((m) => {
              const isDeleting = deletingId === m.id;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-navy/10 overflow-hidden min-w-0"
                >
                  {/* Image */}
                  <div className="relative h-40 sm:h-36 md:h-40 bg-surface">
                    {m.image?.url && (
                      <img
                        src={m.image.url}
                        alt={m.place_name}
                        className="w-full h-full object-cover"
                      />
                    )}

                    <span
                      className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        m.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-white/90 text-navy/60"
                      }`}
                    >
                      {m.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 min-w-0">
                    <p className="font-semibold text-navy text-sm sm:text-base break-words">
                      {m.place_name}
                    </p>
                    <p className="text-xs text-navy/40 mt-0.5">
                      Order: {m.display_order}
                    </p>

                    {/* Description */}
                    {m.description && (
                      <p className="text-xs text-navy/60 mt-2 line-clamp-2 break-words">
                        {m.description}
                      </p>
                    )}

                    {/* Best Time */}
                    {m.best_time_to_visit && (
                      <p className="text-xs text-navy/60 mt-2 break-words">
                        <span className="font-medium">Best time:</span>{" "}
                        {m.best_time_to_visit}
                      </p>
                    )}

                    {/* Starting From */}
                    {m.starting_from !== null &&
                      m.starting_from !== undefined && (
                        <p className="text-xs text-navy/60 mt-1 break-words">
                          <span className="font-medium">Starting from:</span> ₹
                          {Number(m.starting_from).toLocaleString("en-IN")}
                        </p>
                      )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        onClick={() => openEdit(m)}
                        disabled={isDeleting}
                        className="w-full sm:w-auto text-secondary text-sm font-medium hover:underline text-left sm:text-center py-1 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={isDeleting}
                        className="inline-flex w-full sm:w-auto items-center gap-1.5 text-red-600 text-sm font-medium hover:underline text-left sm:text-center py-1 disabled:cursor-not-allowed disabled:opacity-60"
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
                <p className="text-navy/40 text-sm">
                  {hasActiveFilters
                    ? "No destinations match your filters."
                    : "No destinations yet."}
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
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-navy/15 bg-white px-6 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy/15 border-t-navy" />
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
        <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-ivory rounded-xl sm:rounded-2xl w-full max-w-md h-[96vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-ivory px-4 sm:px-6 py-4 border-b border-navy/10">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-navy break-words">
                {editing.id ? "Edit Destination" : "New Destination"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              {/* Place Name */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Place Name
                </label>
                <input
                  required
                  value={form.place_name}
                  onChange={(e) =>
                    setForm({ ...form, place_name: e.target.value })
                  }
                  placeholder="e.g. Kasol"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Short description about the destination"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
                />
              </div>

              {/* Best Time */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Best Time to Visit
                </label>
                <input
                  type="text"
                  value={form.best_time_to_visit}
                  onChange={(e) =>
                    setForm({ ...form, best_time_to_visit: e.target.value })
                  }
                  placeholder="e.g. March to June, September to November"
                  maxLength={255}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
                />
              </div>

              {/* Starting From */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Starting From (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.starting_from}
                  onChange={(e) =>
                    setForm({ ...form, starting_from: e.target.value })
                  }
                  placeholder="e.g. 12999"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({ ...form, display_order: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
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

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 break-words whitespace-pre-line">
                  {error}
                </p>
              )}

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory/40 border-t-ivory" />
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