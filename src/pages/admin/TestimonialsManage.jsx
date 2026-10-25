

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Package, Search } from "lucide-react";
import {
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../../api/adminTestimonials";
import { getPackages } from "../../api/content";
import { useQuery } from "../../hooks/useQuery";
import { cld } from "../../utils/cloudinary";
import {
  getPackageDestination,
  getPackageRegion,
  getPackageTypeLabel,
  getSafeArray,
  normalizePackageType,
} from "../../utils/packages";
import ImageUploadField from "../../components/admin/ImageUploadField";
import PackagePicker from "../../components/PackagePicker";

const EMPTY_FORM = {
  customer_name: "",
  customer_city: "",
  destination: "",
  rating: 5,
  review: "",
  status: "draft",
  image: null,
  pkg: null,
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Pending" },
  { value: "published", label: "Published" },
];

const REGION_FILTERS = [
  { value: "all", label: "All regions" },
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
];

const FIELD =
  "w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/10";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/* FastAPI sends detail as a string, or as a list for validation errors. */
function getErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const text = detail
      .map((item) => {
        const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "";
        return item?.msg ? `${field ? `${field}: ` : ""}${item.msg}` : "";
      })
      .filter(Boolean)
      .join(" · ");
    if (text) return text;
  }

  return fallback;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const hasPackage = (t) => Boolean(t?.package_id || t?.package_slug || t?.package_title);

/* Rebuild a package object for the picker from what the review stored.
   Uses the live package (so the photo shows) when it still exists. */
function buildPackageFromReview(t, packages) {
  if (!hasPackage(t)) return null;

  const live = packages.find(
    (p) =>
      (t.package_id != null && p.id === t.package_id) ||
      (t.package_slug && p.slug === t.package_slug)
  );
  if (live) return live;

  return {
    id: t.package_id ?? null,
    slug: t.package_slug ?? null,
    title: t.package_title || t.destination,
    package_type: t.package_type || null,
    region: t.region || null,
    destination: t.destination,
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function TestimonialsManage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pkgTouched, setPkgTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* Same cached package list as the public site; used to show the photo. */
  const { data: packageData } = useQuery(getPackages);
  const packages = useMemo(() => getSafeArray(packageData), [packageData]);

  const load = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError("");

    getAllTestimonialsAdmin()
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setItems([]);
        setError(getErrorMessage(err, "Could not load testimonials"));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------- counts + filtering ---------- */

  const counts = useMemo(
    () => ({
      all: items.length,
      draft: items.filter((t) => t.status !== "published").length,
      published: items.filter((t) => t.status === "published").length,
    }),
    [items]
  );

  const visibleItems = useMemo(() => {
    const tokens = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

    return items.filter((t) => {
      if (statusFilter === "draft" && t.status === "published") return false;
      if (statusFilter === "published" && t.status !== "published") return false;

      if (regionFilter !== "all" && String(t.region || "").toLowerCase() !== regionFilter) {
        return false;
      }

      if (!tokens.length) return true;

      const haystack = [
        t.customer_name,
        t.customer_city,
        t.destination,
        t.package_title,
        t.review,
      ]
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => haystack.includes(token));
    });
  }, [items, statusFilter, regionFilter, search]);

  /* ---------- modal ---------- */

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setPkgTouched(false);
    setEditing({});
    setError("");
  };

  const openEdit = (t) => {
    setForm({
      customer_name: t.customer_name || "",
      customer_city: t.customer_city || "",
      destination: t.destination || "",
      rating: t.rating || 5,
      review: t.review || "",
      status: t.status || "draft",
      image: t.image || null,
      pkg: buildPackageFromReview(t, packages),
    });

    setPkgTouched(false);
    setEditing(t);
    setError("");
  };

  const closeModal = () => {
    setEditing(null);
    setError("");
    setPkgTouched(false);
    setForm({ ...EMPTY_FORM });
  };

  const handlePackageChange = (pkg) => {
    setPkgTouched(true);

    setForm((previous) => ({
      ...previous,
      pkg,
      /* Picking a package fills the destination; clearing keeps what is typed. */
      destination: pkg
        ? getPackageDestination(pkg) || pkg.title || previous.destination
        : previous.destination,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_city: form.customer_city.trim(),
        destination: form.destination.trim(),
        rating: Number(form.rating),
        review: form.review.trim(),
        status: form.status,
        image: form.image,
      };

      /* On edit, only touch the package fields if the admin changed the package. */
      if (!editing?.id || pkgTouched) {
        const pkg = form.pkg;

        payload.package_id = pkg?.id ?? null;
        payload.package_slug = pkg?.slug ?? null;
        payload.package_title = pkg?.title ?? null;
        payload.package_type = pkg
          ? normalizePackageType(pkg.package_type || pkg.type) || null
          : null;
        payload.region = pkg ? getPackageRegion(pkg) : null;
      }

      if (editing?.id) {
        await updateTestimonial(editing.id, payload);
      } else {
        await createTestimonial(payload);
      }

      closeModal();
      load(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save testimonial"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this testimonial?")) {
      return;
    }

    try {
      await deleteTestimonial(id);
      load(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete testimonial"));
    }
  };

  /* One-click publish / unpublish from the card. */
  const handleTogglePublish = async (t) => {
    setBusyId(t.id);
    setError("");

    try {
      await updateTestimonial(t.id, {
        status: t.status === "published" ? "draft" : "published",
      });
      load(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update status"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-navy">
            Testimonials
          </h1>

          <p className="text-sm text-navy/50 mt-1">
            Review what customers wrote about each package, then publish it to the website.
            {counts.draft > 0 && (
              <span className="ml-1 font-semibold text-navy/70">
                {counts.draft} waiting for approval.
              </span>
            )}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Testimonial
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Filter by status"
          className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
        >
          {STATUS_TABS.map((tab) => {
            const selected = statusFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setStatusFilter(tab.value)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? "border-navy bg-navy text-ivory"
                    : "border-navy/15 bg-white text-navy/70 hover:border-navy/40"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs ${selected ? "text-ivory/70" : "text-navy/40"}`}>
                  {counts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            aria-label="Filter by region"
            className="rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm outline-none focus:border-navy/40"
          >
            {REGION_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, package, review…"
              aria-label="Search testimonials"
              className="w-full sm:w-64 rounded-lg border border-navy/15 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-navy/40"
            />
          </div>
        </div>
      </div>

      {/* Global Error */}
      {error && editing === null && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-sm text-red-600 break-words">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-navy/50 text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {visibleItems.map((t) => {
            const linked = hasPackage(t);
            const packageName = t.package_title || "";
            const typeLabel = t.package_type ? getPackageTypeLabel(t.package_type) : "";
            const region = String(t.region || "").toLowerCase();
            const published = t.status === "published";

            return (
              <div
                key={t.id}
                className="flex min-w-0 flex-col rounded-xl border border-navy/10 bg-white p-4"
              >
                {/* Customer + Status */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy break-words">{t.customer_name}</p>

                    {t.customer_city && (
                      <p className="text-xs text-navy/50 mt-0.5 break-words">{t.customer_city}</p>
                    )}

                    <p
                      className="text-xs text-accent-hover mt-1"
                      aria-label={`${t.rating} out of 5 stars`}
                    >
                      {"★".repeat(t.rating)}
                      {"☆".repeat(5 - t.rating)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {published ? "Published" : "Pending"}
                  </span>
                </div>

                {/* Reviewed package */}
                <div
                  className={`mt-3 rounded-lg border px-3 py-2.5 ${
                    linked ? "border-navy/10 bg-surface" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/50">
                    <Package className="h-3 w-3" aria-hidden="true" />
                    Reviewed package
                  </p>

                  {linked ? (
                    <>
                      <p className="mt-1 text-sm font-semibold text-navy break-words">
                        {packageName || t.destination}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {t.destination && (
                          <span className="inline-flex items-center gap-1 text-xs text-navy/60">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {t.destination}
                          </span>
                        )}

                        {typeLabel && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-navy/70 border border-navy/10">
                            {typeLabel}
                          </span>
                        )}

                        {region && (
                          <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[11px] font-medium capitalize text-navy/70">
                            {region}
                          </span>
                        )}
                      </div>

                      {t.package_slug && (
                        <a
                          href={`/packages/${encodeURIComponent(t.package_slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                        >
                          View package
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-sm font-semibold text-navy break-words">
                        {t.destination || "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700">
                        No package linked. Open Edit to choose one.
                      </p>
                    </>
                  )}
                </div>

                {/* Review */}
                <p className="text-sm text-navy/70 mt-3 line-clamp-4 break-words flex-1">
                  {t.review}
                </p>

                {/* Photo + date */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  {t.image?.url ? (
                    <img
                      src={cld(t.image.url, 100)}
                      alt={t.customer_name}
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span />
                  )}

                  {t.created_at && (
                    <span className="text-xs text-navy/40">
                      Submitted {formatDate(t.created_at)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-navy/10 pt-3">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(t)}
                    disabled={busyId === t.id}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      published
                        ? "border border-navy/20 text-navy/70 hover:bg-surface"
                        : "bg-navy text-ivory hover:bg-navy-light"
                    }`}
                  >
                    {busyId === t.id ? "Saving…" : published ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    onClick={() => openEdit(t)}
                    className="text-secondary text-sm font-medium hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-red-600 text-sm font-medium hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

          {visibleItems.length === 0 && (
            <p className="text-navy/40 col-span-full text-sm">
              {items.length === 0
                ? "No testimonials yet."
                : "No testimonials match these filters."}
            </p>
          )}
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-ivory rounded-xl sm:rounded-2xl w-full max-w-lg h-[96vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-ivory px-4 sm:px-6 py-4 border-b border-navy/10">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-navy break-words">
                  {editing?.id ? "Edit Testimonial" : "New Testimonial"}
                </h2>

                <button
                  type="button"
                  onClick={closeModal}
                  className="shrink-0 text-navy/50 hover:text-navy text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              {/* Customer Name */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Customer Name
                </label>

                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className={FIELD}
                />
              </div>

              {/* Customer City */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Customer City
                </label>

                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.customer_city}
                  onChange={(e) => setForm({ ...form, customer_city: e.target.value })}
                  placeholder="e.g. Hyderabad, Telangana"
                  className={FIELD}
                />
              </div>

              {/* Package */}
              <PackagePicker
                idPrefix="admin"
                value={form.pkg}
                onChange={handlePackageChange}
                label="Package reviewed"
                required={false}
                disabled={saving}
              />

              {/* Destination */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Destination
                </label>

                <input
                  required
                  minLength={2}
                  maxLength={150}
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="Filled in when you pick a package, e.g. Manali"
                  className={FIELD}
                />

                <p className="mt-1 text-xs text-navy/40">
                  Shown on the website. Used in the review's web address when it is first created.
                </p>
              </div>

              {/* Rating */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">Rating</label>

                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className={FIELD}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
              </div>

              {/* Review */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">Review</label>

                <textarea
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={5}
                  value={form.review}
                  onChange={(e) => setForm({ ...form, review: e.target.value })}
                  placeholder="Write the customer's testimonial..."
                  className={`${FIELD} resize-y`}
                />
              </div>

              {/* Status */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">Status</label>

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={FIELD}
                >
                  <option value="draft">Draft (pending)</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Image */}
              <div className="min-w-0">
                <ImageUploadField
                  value={form.image}
                  onChange={(img) => setForm({ ...form, image: img })}
                  label="Customer Photo (optional)"
                />
              </div>

              {/* Form Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-3 sm:px-4 py-3">
                  <p className="text-sm text-red-600 break-words">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60 disabled:cursor-not-allowed"
                >
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








