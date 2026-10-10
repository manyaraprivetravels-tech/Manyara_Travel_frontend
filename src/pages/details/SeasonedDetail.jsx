

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  MessageSquareHeart,
  PackageCheck,
  Send,
  Sun,
} from "lucide-react";

import { getSeasonedDestinationBySlug } from "../../api/content";
import { useQuery } from "../../hooks/useQuery";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import EnquiryForm from "../EnquiryForm";
import FAQSection from "../../components/FAQSection";
import ReviewFormModal from "../../components/ReviewFormModal";
import { RevealGroup } from "../../components/Reveal";

/* =========================================================
   CONFIG
   DETAIL_BASE must match the route you register and the one
   used by the cards on the listing page.
========================================================= */

const BRAND_NAME = "Manyara Prive Vacations";
const DETAIL_BASE = "/seasonal-destinations";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* =========================================================
   HELPERS
========================================================= */

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (typeof image === "object") return image.url || image.secure_url || "";
  return "";
};

const getPackageImage = (pkg) => {
  const images = Array.isArray(pkg?.images) ? pkg.images : [];
  const firstImage = images[0];

  if (typeof firstImage === "string" && firstImage.trim()) return firstImage;

  if (firstImage && typeof firstImage === "object") {
    return firstImage.url || firstImage.secure_url || "";
  }

  if (pkg?.image) return getImageUrl(pkg.image);

  return "";
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "Contact us";
  }
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) return String(price);
  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

const hasNumericPrice = (price) =>
  price !== null &&
  price !== undefined &&
  price !== "" &&
  !Number.isNaN(Number(price));

/* "YYYY-MM-DD" -> local Date (avoids timezone day shifts) */
const parseDate = (value) => {
  if (!value || typeof value !== "string") return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatLongDate = (date) =>
  date
    ? date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

const dayDiff = (from, to) =>
  Math.round((to.getTime() - from.getTime()) / 86400000);

/* Months (0-11) the season covers, including ranges that cross new year */
function getSeasonMonths(start, end) {
  const months = new Set();

  if (start && end) {
    let y = start.getFullYear();
    let m = start.getMonth();

    for (let i = 0; i < 12; i += 1) {
      months.add(m);
      if (y === end.getFullYear() && m === end.getMonth()) break;
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
  } else if (start) {
    months.add(start.getMonth());
  } else if (end) {
    months.add(end.getMonth());
  }

  return months;
}

function getSeasonStatus(start, end) {
  if (!start && !end) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start && today < start) {
    const days = dayDiff(today, start);
    return {
      state: "upcoming",
      text: days === 1 ? "Season opens tomorrow" : `Season opens in ${days} days`,
    };
  }

  if (end && today > end) {
    return { state: "ended", text: "This season window has ended" };
  }

  if (end) {
    const left = dayDiff(today, end);
    return {
      state: "active",
      text:
        left === 0
          ? "In season now · last day"
          : `In season now · ${left} ${left === 1 ? "day" : "days"} left`,
    };
  }

  return { state: "active", text: "In season now" };
}

const STATUS_STYLES = {
  active: "bg-success-bg text-success-text",
  upcoming: "bg-info-bg text-info-text",
  ended: "bg-surface-strong text-text-secondary",
};

/* =========================================================
   SEASON WINDOW — the standout element.
   A 12-month ribbon with the season's months filled in and
   the current month marked.
========================================================= */

function SeasonWindow({ place, start, end }) {
  const months = useMemo(() => getSeasonMonths(start, end), [start, end]);
  const status = useMemo(() => getSeasonStatus(start, end), [start, end]);

  const hasDates = months.size > 0;
  const currentMonth = new Date().getMonth();

  if (!hasDates && !place?.best_time_to_visit) return null;

  const activeMonthNames = MONTHS.filter((_, i) => months.has(i));

  return (
    <section
      aria-labelledby="season-window-heading"
      className="relative z-10 -mt-10 rounded-2xl border border-divider bg-card p-5 shadow-travel-hover sm:-mt-14 sm:rounded-3xl sm:p-7"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id="season-window-heading"
            className="font-display text-2xl font-semibold text-text-dark sm:text-3xl"
          >
            When to go
          </h2>

          {(start || end) && (
            <p className="mt-1 text-sm text-text-secondary sm:text-base">
              {start && end
                ? `${formatLongDate(start)} to ${formatLongDate(end)}`
                : start
                ? `From ${formatLongDate(start)}`
                : `Until ${formatLongDate(end)}`}
            </p>
          )}
        </div>

        {status && (
          <span
            className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold sm:text-sm ${
              STATUS_STYLES[status.state]
            }`}
          >
            {status.state === "active" && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-success"
                aria-hidden="true"
              />
            )}
            {status.text}
          </span>
        )}
      </div>

      {hasDates && (
        <>
          <ol
            className="mt-5 grid grid-cols-6 gap-1.5 sm:grid-cols-12 sm:gap-2"
            aria-label={`Season runs ${activeMonthNames.join(", ")}`}
          >
            {MONTHS.map((month, index) => {
              const inSeason = months.has(index);
              const isNow = index === currentMonth;

              return (
                <li
                  key={month}
                  className={`relative rounded-lg py-2.5 text-center text-xs font-semibold transition-colors sm:py-3 sm:text-sm ${
                    inSeason
                      ? "bg-primary text-white shadow-brand"
                      : "bg-surface-strong text-muted"
                  } ${isNow ? "ring-2 ring-accent-bright ring-offset-2" : ""}`}
                  aria-current={isNow ? "date" : undefined}
                >
                  {month}
                </li>
              );
            })}
          </ol>

          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm bg-primary"
                aria-hidden="true"
              />
              Season months
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm ring-2 ring-accent-bright"
                aria-hidden="true"
              />
              This month
            </span>
          </p>
        </>
      )}

      {place?.best_time_to_visit && (
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-surface-soft p-4">
          <CalendarDays
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-dark">
              Best time to visit
            </p>
            <p className="mt-0.5 text-sm leading-6 text-text">
              {place.best_time_to_visit}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   STATES
========================================================= */

function DetailSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Loading destination"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-48 rounded bg-primary/10" />
        <div className="mt-8 aspect-[4/3] rounded-3xl bg-primary/10 sm:aspect-[16/9] lg:aspect-[21/9]" />
        <div className="relative -mt-12 h-48 rounded-3xl bg-primary/10" />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="h-8 w-56 rounded bg-primary/10" />
            <div className="h-4 rounded bg-primary/10" />
            <div className="h-4 rounded bg-primary/10" />
            <div className="h-4 w-2/3 rounded bg-primary/10" />
          </div>
          <div className="h-72 rounded-3xl bg-primary/10" />
        </div>
      </div>
    </div>
  );
}

function StateMessage({ title, message, code, onRetry }) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        {code && (
          <p className="mb-3 font-display text-6xl font-semibold text-primary/30">
            {code}
          </p>
        )}

        <h1 className="mb-3 font-display text-3xl font-semibold text-text-dark sm:text-4xl">
          {title}
        </h1>

        <p className="mx-auto mb-8 max-w-md text-text">{message}</p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`${PRIMARY_BUTTON} min-h-[44px] px-5 py-3`}
            >
              Try again
            </button>
          )}

          <Link
            to={DETAIL_BASE}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Seasonal Destinations
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SeasonedDetail() {
  const { slug } = useParams();

  const { data, loading, error } = useQuery(getSeasonedDestinationBySlug, slug);
  const place = data?.data ?? data ?? null;

  const [enquiry, setEnquiry] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const destinationImage = useMemo(() => getImageUrl(place?.image), [place]);

  const seasonStart = useMemo(
    () => parseDate(place?.season_start_date),
    [place]
  );
  const seasonEnd = useMemo(() => parseDate(place?.season_end_date), [place]);

  const seasonLabel = place?.season_label?.trim() || "";

  /* --------------------------------------------------
     PACKAGES
  -------------------------------------------------- */
  const destinationPackages = useMemo(() => {
    if (!Array.isArray(place?.packages)) return [];

    return place.packages
      .filter(
        (pkg) =>
          pkg?.status === undefined ||
          pkg?.status === "published" ||
          pkg?.is_published === true
      )
      .filter((pkg) => Boolean(pkg?.slug))
      .sort((a, b) => {
        const orderDiff =
          Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return Number(a?.id ?? 0) - Number(b?.id ?? 0);
      });
  }, [place]);

  const hasStartingPrice =
    place?.starting_from !== null &&
    place?.starting_from !== undefined &&
    place?.starting_from !== "";

  /* --------------------------------------------------
     SEO
  -------------------------------------------------- */
  const seoDescription =
    place?.description ||
    `Plan a ${seasonLabel ? `${seasonLabel} ` : "seasonal "}holiday in ${
      place?.place_name || "this destination"
    } with ${BRAND_NAME}. See season dates, the best time to visit and holiday packages.`;

  const destinationPath = `${DETAIL_BASE}/${place?.slug || slug}`;
  const canonicalUrl = `${SITE_URL}${destinationPath}`;

  const jsonLd = useMemo(() => {
    if (!place) return null;

    const packageItems = destinationPackages.map((pkg) => {
      const image = getPackageImage(pkg);

      return {
        "@type": "Product",
        name: pkg?.title,
        url: `${SITE_URL}/packages/${pkg.slug}`,
        image: image ? [image] : undefined,
        ...(hasNumericPrice(pkg?.price)
          ? {
              offers: {
                "@type": "Offer",
                price: Number(pkg.price),
                priceCurrency: "INR",
                url: `${SITE_URL}/packages/${pkg.slug}`,
                availability: "https://schema.org/InStock",
              },
            }
          : {}),
      };
    });

    return [
      {
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        name: place.place_name,
        description: seoDescription,
        image: destinationImage ? [destinationImage] : [],
        url: canonicalUrl,
      },

      ...(packageItems.length > 0
        ? [
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `Holiday Packages in ${place.place_name}`,
              itemListElement: packageItems.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item,
              })),
            },
          ]
        : []),

      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Seasonal Destinations",
            item: `${SITE_URL}${DETAIL_BASE}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: place.place_name,
            item: canonicalUrl,
          },
        ],
      },
    ];
  }, [place, destinationPackages, seoDescription, destinationImage, canonicalUrl]);

  /* --------------------------------------------------
     STATES
  -------------------------------------------------- */
  if (loading) return <DetailSkeleton />;

  if (!place) {
    const status = error?.response?.status;
    const isRealError = Boolean(error) && status !== 404;

    if (isRealError) {
      console.error("Failed to load seasonal destination:", slug, error);

      return (
        <StateMessage
          title="We couldn't load this destination"
          message="Something went wrong while loading this page. Please check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <StateMessage
        code="404"
        title="Destination not found"
        message="This destination may have been removed or is no longer available."
      />
    );
  }

  /* --------------------------------------------------
     MAIN
     overflow-x-clip (not hidden) keeps the sticky sidebar working.
  -------------------------------------------------- */
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Seo
        title={
          seasonLabel
            ? `${place.place_name} in ${seasonLabel} — Travel Guide & Packages`
            : `${place.place_name} — Seasonal Travel Guide & Packages`
        }
        description={seoDescription}
        path={destinationPath}
        image={destinationImage || undefined}
        type="website"
        jsonLd={jsonLd}
      />

      {/* BREADCRUMB */}
      <section className="border-b border-divider bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 overflow-hidden py-3 text-xs text-muted sm:gap-2 sm:py-4 sm:text-sm"
          >
            <Link to="/" className="shrink-0 transition hover:text-primary">
              Home
            </Link>

            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

            <Link
              to={DETAIL_BASE}
              className="shrink-0 transition hover:text-primary"
            >
              Seasonal Destinations
            </Link>

            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

            <span className="truncate font-medium text-text-dark">
              {place.place_name}
            </span>
          </nav>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <Link
          to={DETAIL_BASE}
          className="group mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Back to Seasonal Destinations
        </Link>

        {/* ==================================================
            HERO: photo with the title on it; the season window
            overlaps its lower edge.
        ================================================== */}
        <section>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-petal-gradient shadow-travel-card sm:aspect-[16/9] sm:rounded-3xl lg:aspect-[21/9]">
            {destinationImage ? (
              <img
                src={destinationImage}
                alt={`${place.place_name} — seasonal travel destination`}
                className="h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
                width="1400"
                height="600"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <MapPin className="h-12 w-12 text-primary/40" aria-hidden="true" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/15 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 pb-14 sm:p-8 sm:pb-20 lg:p-10 lg:pb-24">
              {seasonLabel && (
                <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-travel-card sm:text-sm">
                  <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{seasonLabel}</span>
                </span>
              )}

              <h1 className="mt-3 break-words font-display text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {place.place_name}
              </h1>
            </div>
          </div>

          <div className="px-2 sm:px-6 lg:px-10">
            <SeasonWindow place={place} start={seasonStart} end={seasonEnd} />
          </div>
        </section>

        {/* ==================================================
            CONTENT + SIDEBAR
        ================================================== */}
        <div className="mt-10 grid grid-cols-1 items-start gap-8 pb-16 sm:mt-12 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:gap-14">
          {/* LEFT */}
          <div className="min-w-0 space-y-10 sm:space-y-12 lg:space-y-14">
            {place.description && (
              <section>
                <h2 className="mb-4 font-display text-3xl font-semibold text-text-dark sm:mb-5">
                  {seasonLabel
                    ? `${place.place_name} in ${seasonLabel}`
                    : `About ${place.place_name}`}
                </h2>

                <div className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base sm:leading-8 lg:text-lg">
                  {place.description}
                </div>
              </section>
            )}

            {/* PACKAGES */}
            <section id="holiday-packages">
              <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-3xl font-semibold text-text-dark">
                    Holiday packages in {place.place_name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-text-secondary sm:text-base">
                    Packages planned for {place.place_name}. Pick the one that fits your
                    dates and travel style.
                  </p>
                </div>

                {destinationPackages.length > 0 && (
                  <Link
                    to="/packages"
                    className="group inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-link"
                  >
                    <span className="link-reveal">View all packages</span>
                    <ChevronRight className="arrow-shift h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>

              {destinationPackages.length > 0 ? (
                <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  {destinationPackages.map((pkg) => {
                    const packageImage = getPackageImage(pkg);

                    const hasNights =
                      pkg.duration_nights !== null &&
                      pkg.duration_nights !== undefined;

                    return (
                      <article
                        key={pkg.id ?? pkg.slug}
                        className="card-lift h-full rounded-2xl"
                      >
                        <Link
                          to={`/packages/${encodeURIComponent(pkg.slug)}`}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card hover:border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <div className="img-zoom relative aspect-[16/10] shrink-0 bg-surface-strong">
                            {packageImage ? (
                              <img
                                src={packageImage}
                                alt={pkg.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                width="800"
                                height="500"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-surface-soft">
                                <PackageCheck
                                  className="h-9 w-9 text-placeholder"
                                  aria-hidden="true"
                                />
                              </div>
                            )}

                            {pkg.is_popular && (
                              <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-primary-dark shadow-travel-card">
                                Popular
                              </span>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <h3 className="line-clamp-2 font-display text-xl font-semibold leading-tight text-text-dark transition-colors duration-300 group-hover:text-primary">
                              {pkg.title}
                            </h3>

                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary sm:text-sm">
                              {pkg.duration_days && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3
                                    className="h-4 w-4 text-accent"
                                    aria-hidden="true"
                                  />
                                  {pkg.duration_days}{" "}
                                  {Number(pkg.duration_days) === 1 ? "Day" : "Days"}
                                  {hasNights &&
                                    ` / ${pkg.duration_nights} ${
                                      Number(pkg.duration_nights) === 1
                                        ? "Night"
                                        : "Nights"
                                    }`}
                                </span>
                              )}

                              {pkg.package_type && (
                                <span className="capitalize">
                                  {String(pkg.package_type).replaceAll("_", " ")}
                                </span>
                              )}
                            </div>

                            <div className="mt-auto flex items-end justify-between gap-4 border-t border-divider pt-4">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-muted">
                                  Starting from
                                </p>
                                <p className="mt-0.5 font-display text-2xl font-semibold leading-none text-primary">
                                  {formatPrice(pkg.price)}
                                </p>
                              </div>

                              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-link">
                                View package
                                <ChevronRight
                                  className="arrow-shift h-4 w-4"
                                  aria-hidden="true"
                                />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </RevealGroup>
              ) : (
                <div className="rounded-2xl border border-dashed border-divider bg-card p-6 text-center sm:p-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
                    <PackageCheck
                      className="h-6 w-6 text-placeholder"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-3 font-display text-xl font-semibold text-text-dark">
                    Packages coming soon
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                    We are preparing holiday packages for {place.place_name}. You can still
                    contact our travel team to plan your trip.
                  </p>

                  <button
                    type="button"
                    onClick={() => setEnquiry(true)}
                    className="group mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
                  >
                    Plan my trip
                    <Send className="arrow-shift h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT SIDEBAR (sticky on lg+) */}
          <aside className="w-full self-start lg:sticky lg:top-[calc(var(--top-info-height,0px)+6rem)]">
            <div className="rounded-2xl border border-divider bg-card p-5 shadow-travel-card sm:rounded-3xl sm:p-6 lg:p-7">
              <div className="rounded-2xl border border-primary/10 bg-brand-gradient p-5 sm:p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-travel-card">
                  <Sun className="h-5 w-5" aria-hidden="true" />
                </div>

                <h2 className="font-display text-2xl font-semibold text-text-dark">
                  {seasonLabel
                    ? `Plan your ${seasonLabel} trip`
                    : `Plan your trip to ${place.place_name}`}
                </h2>

                {hasStartingPrice && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-text-secondary">
                      Packages start from
                    </p>
                    <p className="mt-0.5 font-display text-4xl font-semibold leading-none text-primary">
                      {formatPrice(place.starting_from)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-xl bg-surface p-4">
                <p className="text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
                  Want help timing your visit to{" "}
                  <strong className="text-text-dark">{place.place_name}</strong>? Our travel
                  team can build a trip around the season for you.
                </p>

                <button
                  type="button"
                  onClick={() => setEnquiry(true)}
                  className="group mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2"
                >
                  Enquire now
                  <Send className="arrow-shift h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* REVIEW CTA */}
      <section className="border-y border-divider bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-6 rounded-2xl border border-divider bg-card p-6 shadow-travel-card sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-semibold text-text-dark">
                Your valuable review
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-text sm:text-base">
                Share your experience with {BRAND_NAME} and help future travellers plan
                their journey.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReview(true)}
              className={`${PRIMARY_BUTTON} min-h-[44px] shrink-0 px-5 py-3.5`}
            >
              <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
              Write a review
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full">
        <FAQSection category="seasonal" />
      </section>

      <Footer />

      {enquiry && (
        <EnquiryForm
          destination={place}
          showPackageType={false}
          onClose={() => setEnquiry(false)}
        />
      )}

      {showReview && (
        <ReviewFormModal
          open={showReview}
          onClose={() => setShowReview(false)}
          onSubmitted={() => setShowReview(false)}
        />
      )}
    </div>
  );
}

