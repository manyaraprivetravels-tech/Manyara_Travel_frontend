import { useEffect, useRef, useState } from "react";
import {
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Package as PackageIcon,
  MapPin,
  Phone,
  Users,
  CalendarDays,
  Moon,
  MessageSquareText,
  UserRound,
  Hash,
  Compass,
  Search,
} from "lucide-react";

import {
  getEnquiriesPaged,
  getEnquiryStatsAdmin,
  deleteEnquiry,
} from "../../api/enquiries";

// ============================================================
// PAGINATION
// ============================================================

const PAGE_SIZE = 10;
const MAX_LIMIT = 200; // must match backend Query(..., le=200)

// ============================================================
// PACKAGE TYPE LABELS
// ============================================================

const PACKAGE_TYPE_LABELS = {
  pilgrimage: "Pilgrimage",
  mountains_adventure: "Mountains & Adventure",
  family: "Family",
  beach: "Beach",
  romantic: "Romantic Sites",
  wildlife_nature: "Wildlife & Nature",
  international: "International",
  custom: "Custom",
};

const getPackageTypeLabel = (value) => {
  if (!value) return "-";

  return (
    PACKAGE_TYPE_LABELS[value] ||
    String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
};

// ============================================================
// HELPERS
// ============================================================

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border border-divider bg-white px-3.5 py-2.5 text-sm text-text-dark outline-none transition placeholder:text-muted focus:border-primary/40 focus:ring-4 focus:ring-rose-100";

const getApiError = (err, fallback) => {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || "Validation error").join("\n");
  }

  return fallback;
};

const formatDate = (date) => {
  if (!date) return "-";

  const raw = String(date).trim();

  // Normalize MySQL datetime:
  // "2026-10-06 07:30:00" -> "2026-10-06T07:30:00Z"
  // If API already sends timezone/Z, preserve it.
  let normalized = raw.replace(" ", "T");

  if (!/[zZ]$|[+-]\d{2}:\d{2}$/.test(normalized)) {
    normalized += "Z";
  }

  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatTravelDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// SMALL UI HELPERS
// ============================================================

const DetailItem = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`min-w-0 ${className}`}>
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} strokeWidth={1.8} className="text-primary" />}

      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
    </div>

    <p className="mt-1.5 text-sm font-medium leading-5 text-text-dark break-words">
      {value ?? "-"}
    </p>
  </div>
);

const StatPill = ({ label, value }) => (
  <div className="rounded-xl border border-divider bg-surface-soft px-3 py-2.5">
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
      {label}
    </p>

    <p className="mt-0.5 text-sm font-semibold text-text-dark">
      {value ?? "-"}
    </p>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function EnquiriesManage() {
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    last_24h: 0,
    last_7_days: 0,
    custom: 0,
  });

  // Loaders
  const [loading, setLoading] = useState(true); // first load
  const [loadingMore, setLoadingMore] = useState(false); // "Load more"
  const [refreshing, setRefreshing] = useState(false); // filters / refresh / after delete
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const requestIdRef = useRef(0);
  const initialLoadDone = useRef(false);

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // ==========================================================
  // FETCH (server-side pagination + filters)
  // ==========================================================

  // Debounce search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);

    return () => clearTimeout(t);
  }, [search]);

  const fetchEnquiries = async ({
    skip = 0,
    limit = PAGE_SIZE,
    mode,
  } = {}) => {
    const resolvedMode =
      mode || (initialLoadDone.current ? "refresh" : "initial");

    // Ignore out-of-order responses (fast typing / quick filter changes)
    const requestId = ++requestIdRef.current;

    try {
      if (resolvedMode === "initial") setLoading(true);
      if (resolvedMode === "more") setLoadingMore(true);
      if (resolvedMode === "refresh") setRefreshing(true);

      const data = await getEnquiriesPaged({
        skip,
        limit,
        search: debouncedSearch || undefined,
        package_type: typeFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      if (requestId !== requestIdRef.current) return;

      const list = Array.isArray(data) ? data : data?.items ?? [];

      setEnquiries((prev) => {
        if (resolvedMode !== "more") return list;

        const seen = new Set(prev.map((e) => e.id));

        return [...prev, ...list.filter((e) => !seen.has(e.id))];
      });

      setTotal(Array.isArray(data) ? list.length : data?.total ?? list.length);

      initialLoadDone.current = true;
      setError("");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error("Failed to fetch enquiries:", err);

      setError(
        getApiError(err, "Failed to load enquiries. Please try again.")
      );
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
    fetchEnquiries({ skip: 0, limit: PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, typeFilter, dateFrom, dateTo]);

  const handleLoadMore = () =>
    fetchEnquiries({
      skip: enquiries.length,
      limit: PAGE_SIZE,
      mode: "more",
    });

  // Reload everything already loaded (after delete / manual refresh)
  const reloadCurrent = () =>
    fetchEnquiries({
      skip: 0,
      limit: Math.min(Math.max(enquiries.length, PAGE_SIZE), MAX_LIMIT),
      mode: "refresh",
    });

  const hasMore = enquiries.length < total;

  // ==========================================================
  // STATS (summary cards)
  // ==========================================================

  const loadStats = async () => {
    try {
      setStats(await getEnquiryStatsAdmin());
    } catch (err) {
      console.error("Failed to load enquiry stats:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // ==========================================================
  // REFRESH BUTTON
  // ==========================================================

  const handleRefresh = () => {
    reloadCurrent();
    loadStats();
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this enquiry?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await deleteEnquiry(id);

      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry(null);
      }

      await Promise.all([reloadCurrent(), loadStats()]);
    } catch (err) {
      console.error("Failed to delete enquiry:", err);

      alert(getApiError(err, "Failed to delete enquiry. Please try again."));
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full min-w-0 overflow-x-hidden bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-5 overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card">
        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-rose-100/60 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-8 rounded-full bg-accent" />

                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Manyara Privé Vacations
                </span>
              </div>

              <h1 className="font-display text-3xl font-semibold leading-tight text-text-dark sm:text-4xl">
                Customer Enquiries
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Manage travel enquiries submitted through your website and
                review customer requirements.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading || refreshing ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <RefreshCw size={17} />
              )}

              Refresh
            </button>
          </div>
        </div>

        {/* ====================================================
            SUMMARY (from /enquiries/admin/stats)
        ==================================================== */}

        <div className="grid grid-cols-2 border-t border-divider sm:grid-cols-4">
          <div className="border-b border-r border-divider px-5 py-4 sm:border-b-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Total Enquiries
            </p>

            <p className="mt-1 text-2xl font-semibold text-text-dark">
              {stats.total}
            </p>
          </div>

          <div className="border-b border-divider px-5 py-4 sm:border-b-0 sm:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Last 24 Hours
            </p>

            <p className="mt-1 text-2xl font-semibold text-primary">
              {stats.last_24h}
            </p>
          </div>

          <div className="border-r border-divider px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Last 7 Days
            </p>

            <p className="mt-1 text-2xl font-semibold text-text-dark">
              {stats.last_7_days}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Custom Enquiries
            </p>

            <p className="mt-1 text-2xl font-semibold text-text-dark">
              {stats.custom}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="mb-5 rounded-2xl border border-divider bg-card p-3 shadow-travel-card sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_210px_150px_150px]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, destination, package..."
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={INPUT_CLASS}
            aria-label="Filter by package type"
          >
            <option value="all">All Types</option>

            {Object.entries(PACKAGE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className={INPUT_CLASS}
            aria-label="Received from date"
            title="Received from"
          />

          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className={INPUT_CLASS}
            aria-label="Received to date"
            title="Received to"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-muted">
            Showing{" "}
            <span className="font-semibold text-text-dark">
              {enquiries.length}
            </span>{" "}
            of <span className="font-semibold text-text-dark">{total}</span>{" "}
            {hasActiveFilters ? "matching enquiries" : "enquiries"}
            <span className="ml-2 hidden text-muted sm:inline">
              (date filters use the date received)
            </span>
          </p>

          <div className="flex items-center gap-3">
            {refreshing && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                <Loader2 size={13} className="animate-spin" />
                Updating...
              </span>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-error/20 bg-error-bg px-4 py-3 text-sm text-error-text">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-error" />

          <p className="whitespace-pre-line break-words">{error}</p>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="rounded-2xl border border-divider bg-card py-20 text-center shadow-travel-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>

          <p className="mt-4 text-sm font-medium text-muted">
            Loading enquiries...
          </p>
        </div>
      ) : enquiries.length === 0 ? (
        /* ====================================================
           EMPTY
           ==================================================== */

        <div className="rounded-2xl border border-divider bg-card px-6 py-16 text-center shadow-travel-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-soft">
            <MessageSquareText size={28} className="text-primary" />
          </div>

          <h2 className="mt-5 font-display text-2xl font-semibold text-text-dark">
            {hasActiveFilters ? "No matching enquiries" : "No enquiries yet"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {hasActiveFilters
              ? "Try changing or clearing your filters."
              : "Customer enquiries will appear here once visitors submit their travel requirements through the website."}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl border border-primary/15 bg-surface-soft px-4 py-2 text-sm font-semibold text-primary transition hover:bg-rose-100"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={`transition-opacity duration-200 ${
              refreshing ? "pointer-events-none opacity-50" : "opacity-100"
            }`}
          >
            {/* ==================================================
                DESKTOP / TABLET
                ================================================== */}

            <div className="hidden overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px]">
                  <thead className="border-b border-divider bg-surface">
                    <tr>
                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Customer
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Package
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Type
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Destination
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Contact
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Travellers
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Travel Date
                      </th>

                      <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Submitted
                      </th>

                      <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {enquiries.map((enquiry) => (
                      <tr
                        key={enquiry.id}
                        className="border-b border-divider transition-colors last:border-0 hover:bg-surface-soft/60"
                      >
                        {/* CUSTOMER */}

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary">
                              <UserRound size={16} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-text-dark">
                                {enquiry.name}
                              </p>

                              <p className="mt-0.5 text-xs text-muted">
                                Enquiry #{enquiry.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PACKAGE */}

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <PackageIcon
                              size={16}
                              className="shrink-0 text-primary"
                            />

                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate text-sm font-semibold text-text-dark">
                                {enquiry.package_title ||
                                  (enquiry.package_id
                                    ? "Package"
                                    : "General Enquiry")}
                              </p>

                              {enquiry.package_id != null && (
                                <p className="mt-0.5 text-xs text-muted">
                                  Package #{enquiry.package_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* PACKAGE TYPE */}

                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-primary/15 bg-surface-soft px-2.5 py-1 text-xs font-semibold text-primary">
                            {getPackageTypeLabel(enquiry.package_type)}
                          </span>
                        </td>

                        {/* DESTINATION */}

                        <td className="px-4 py-4">
                          <div className="flex max-w-[150px] items-center gap-1.5 text-sm text-text">
                            <MapPin
                              size={14}
                              className="shrink-0 text-accent"
                            />

                            <span className="truncate">
                              {enquiry.destination || "-"}
                            </span>
                          </div>
                        </td>

                        {/* CONTACT */}

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-text">
                            <Phone
                              size={14}
                              className="shrink-0 text-primary"
                            />

                            <span>{enquiry.phone}</span>
                          </div>
                        </td>

                        {/* TRAVELLERS */}

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-lg bg-surface-strong px-2 py-1 text-xs font-medium text-text-dark">
                              {enquiry.adults ?? 0} Adults
                            </span>

                            <span className="rounded-lg bg-surface-strong px-2 py-1 text-xs font-medium text-text-dark">
                              {enquiry.kids ?? 0} Kids
                            </span>
                          </div>
                        </td>

                        {/* TRAVEL DATE */}

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-text">
                            <CalendarDays size={14} className="text-primary" />

                            {formatTravelDate(enquiry.travel_date)}
                          </div>
                        </td>

                        {/* SUBMITTED */}

                        <td className="px-4 py-4 text-sm text-muted">
                          {formatDate(enquiry.created_at)}
                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedEnquiry(enquiry)}
                              className="rounded-lg border border-primary/15 bg-surface-soft px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-rose-100"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(enquiry.id)}
                              disabled={deletingId === enquiry.id}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-error/15 bg-error-bg px-3 py-2 text-sm font-semibold text-error-text transition hover:bg-error/10 disabled:opacity-60"
                            >
                              {deletingId === enquiry.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}

                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ==================================================
                MOBILE CARDS
                ================================================== */}

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {enquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card"
                >
                  {/* CARD HEADER */}

                  <div className="border-b border-divider bg-surface-soft px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                          <UserRound size={18} />
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-text-dark">
                            {enquiry.name}
                          </h2>

                          <p className="mt-0.5 text-xs text-muted">
                            Enquiry #{enquiry.id}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-primary/15 bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Enquiry
                      </span>
                    </div>
                  </div>

                  {/* PACKAGE */}

                  <div className="p-4">
                    <div className="rounded-xl border border-divider bg-surface p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-primary">
                          <PackageIcon size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                            Package
                          </p>

                          <p className="mt-1 text-sm font-semibold text-text-dark">
                            {enquiry.package_title ||
                              (enquiry.package_id
                                ? "Package"
                                : "General Enquiry")}
                          </p>

                          {enquiry.package_id != null && (
                            <p className="mt-0.5 text-xs text-muted">
                              Package #{enquiry.package_id}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-2.5 py-1 text-xs font-semibold text-primary">
                          <Compass size={12} />
                          {getPackageTypeLabel(enquiry.package_type)}
                        </span>

                        {enquiry.seasoned_id != null && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-divider bg-card px-2.5 py-1 text-xs font-medium text-muted">
                            <Hash size={12} />
                            Season #{enquiry.seasoned_id}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DETAILS */}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <DetailItem
                        icon={MapPin}
                        label="Destination"
                        value={enquiry.destination || "-"}
                      />

                      <DetailItem
                        icon={Phone}
                        label="Phone"
                        value={enquiry.phone}
                      />

                      <DetailItem
                        icon={Users}
                        label="Adults"
                        value={enquiry.adults ?? 0}
                      />

                      <DetailItem
                        icon={Users}
                        label="Kids"
                        value={enquiry.kids ?? 0}
                      />

                      <DetailItem
                        icon={Moon}
                        label="Nights"
                        value={enquiry.nights ?? "-"}
                      />

                      <DetailItem
                        icon={CalendarDays}
                        label="Travel Date"
                        value={formatTravelDate(enquiry.travel_date)}
                      />
                    </div>

                    {/* SUBMITTED */}

                    <div className="mt-4 border-t border-divider pt-4">
                      <DetailItem
                        label="Submitted"
                        value={formatDate(enquiry.created_at)}
                      />
                    </div>

                    {/* MESSAGE */}

                    {enquiry.message && (
                      <div className="mt-4 rounded-xl border border-primary/10 bg-surface-soft p-3.5">
                        <div className="flex items-center gap-2">
                          <MessageSquareText
                            size={14}
                            className="text-primary"
                          />

                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                            Requirements
                          </p>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-text break-words">
                          {enquiry.message}
                        </p>
                      </div>
                    )}

                    {/* ACTIONS */}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="rounded-xl border border-primary/15 bg-surface-soft px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-rose-100"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(enquiry.id)}
                        disabled={deletingId === enquiry.id}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-error/15 bg-error-bg px-3 py-2.5 text-sm font-semibold text-error-text transition hover:bg-error/10 disabled:opacity-60"
                      >
                        {deletingId === enquiry.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}

                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================================================
              FOOTER: count + load more
              ================================================== */}

          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-divider bg-card px-4 py-4 shadow-travel-card sm:flex-row sm:justify-between sm:px-5">
            <p className="text-xs text-muted">
              Showing{" "}
              <span className="font-semibold text-text-dark">
                {enquiries.length}
              </span>{" "}
              of <span className="font-semibold text-text-dark">{total}</span>{" "}
              enquiries
            </p>

            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore || refreshing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-surface-soft px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loadingMore && <Loader2 size={16} className="animate-spin" />}

                {loadingMore
                  ? "Loading..."
                  : `Load ${Math.min(
                      PAGE_SIZE,
                      total - enquiries.length
                    )} more`}
              </button>
            )}
          </div>
        </>
      )}

      {/* ======================================================
          DETAILS MODAL
          ====================================================== */}

      {selectedEnquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-2 backdrop-blur-sm sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEnquiry(null);
            }
          }}
        >
          <div className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-hover sm:max-h-[92vh] sm:rounded-3xl">
            {/* MODAL HEADER */}

            <div className="relative shrink-0 overflow-hidden border-b border-divider bg-surface-soft px-4 py-4 sm:px-6 sm:py-5">
              <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-rose-200/40 blur-3xl" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-7 rounded-full bg-accent" />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                      Manyara Privé Vacations
                    </span>
                  </div>

                  <h2 className="mt-1 font-display text-2xl font-semibold text-text-dark sm:text-3xl">
                    Enquiry Details
                  </h2>

                  <p className="mt-0.5 text-xs text-muted sm:text-sm">
                    Enquiry #{selectedEnquiry.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="shrink-0 rounded-xl border border-divider bg-card p-2 text-muted transition hover:border-primary/20 hover:bg-surface-soft hover:text-primary"
                  aria-label="Close enquiry details"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* MODAL CONTENT */}

            <div className="overflow-y-auto p-4 sm:p-6">
              {/* CUSTOMER HERO */}

              <div className="rounded-2xl border border-divider bg-surface p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary">
                    <UserRound size={21} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Customer
                    </p>

                    <h3 className="mt-0.5 truncate font-display text-2xl font-semibold text-text-dark">
                      {selectedEnquiry.name}
                    </h3>

                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                      <Phone size={13} />
                      {selectedEnquiry.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* PACKAGE */}

              <div className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-6 rounded-full bg-accent" />

                  <h3 className="text-sm font-semibold text-text-dark">
                    Travel Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-divider bg-card p-4">
                    <DetailItem
                      icon={PackageIcon}
                      label="Package"
                      value={
                        selectedEnquiry.package_title ||
                        (selectedEnquiry.package_id
                          ? `Package #${selectedEnquiry.package_id}`
                          : "General Enquiry")
                      }
                    />
                  </div>

                  <div className="rounded-xl border border-divider bg-card p-4">
                    <DetailItem
                      icon={Hash}
                      label="Season ID"
                      value={selectedEnquiry.seasoned_id ?? "-"}
                    />
                  </div>

                  <div className="rounded-xl border border-divider bg-card p-4">
                    <DetailItem
                      icon={Compass}
                      label="Package Type"
                      value={getPackageTypeLabel(selectedEnquiry.package_type)}
                    />
                  </div>

                  <div className="rounded-xl border border-divider bg-card p-4">
                    <DetailItem
                      icon={MapPin}
                      label="Destination"
                      value={selectedEnquiry.destination || "-"}
                    />
                  </div>
                </div>
              </div>

              {/* TRAVELLERS */}

              <div className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-6 rounded-full bg-accent" />

                  <h3 className="text-sm font-semibold text-text-dark">
                    Traveller Requirements
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatPill label="Adults" value={selectedEnquiry.adults ?? 0} />

                  <StatPill label="Kids" value={selectedEnquiry.kids ?? 0} />

                  <StatPill
                    label="Nights"
                    value={selectedEnquiry.nights ?? "-"}
                  />

                  <StatPill
                    label="Travel Date"
                    value={formatTravelDate(selectedEnquiry.travel_date)}
                  />
                </div>
              </div>

              {/* MESSAGE */}

              <div className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-6 rounded-full bg-accent" />

                  <h3 className="text-sm font-semibold text-text-dark">
                    Requirements
                  </h3>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-surface-soft p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <MessageSquareText
                      size={18}
                      className="mt-0.5 shrink-0 text-primary"
                    />

                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-text sm:text-base">
                      {selectedEnquiry.message || "No message provided."}
                    </p>
                  </div>
                </div>
              </div>

              {/* SUBMITTED */}

              <div className="mt-5 rounded-xl border border-divider bg-surface p-4">
                <DetailItem
                  icon={CalendarDays}
                  label="Submitted Date & Time"
                  value={formatDate(selectedEnquiry.created_at)}
                />
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="shrink-0 border-t border-divider bg-card p-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-primary-dark sm:float-right sm:w-auto sm:min-w-[120px]"
              >
                Close
              </button>

              <div className="clear-both" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}