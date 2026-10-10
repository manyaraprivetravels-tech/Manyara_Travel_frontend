



import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  MapPin,
  Sun,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getSeasonedDestinations } from "../api/content";
import Seo, { SITE_URL } from "../components/Seo";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";
import { RevealGroup } from "../components/Reveal";

/* =========================================================
   CONFIG
   Change DETAIL_BASE if your destination detail route differs.
========================================================= */

const DETAIL_BASE = "/seasoned-destinations";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3));
const MONTH_LETTERS = MONTH_NAMES.map((name) => name[0]);

/* =========================================================
   MONTH HELPERS

   Every destination gets a set of months (0 = Jan ... 11 = Dec)
   in which it is good to visit. It is built from:
     1. the season start / end dates (the year is ignored, so a
        season keeps working every year), and
     2. the months written in "best time to visit"
        (for example "Oct - Mar" or "June, July and August").
   Both are combined, so a destination shows up for any month
   its admin described.
========================================================= */

const MONTH_PATTERN =
  "\\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\b";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/* Adds from..to, wrapping past December (Nov -> Feb = Nov, Dec, Jan, Feb). */
function addMonthRange(set, from, to) {
  let month = from;

  for (let step = 0; step < 12; step += 1) {
    set.add(month);
    if (month === to) break;
    month = (month + 1) % 12;
  }
}

function parseDateOnly(value) {
  if (!value) return null;

  const stringValue = String(value);

  // Avoid timezone shifts for backend date-only values.
  const match = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthsFromSeasonDates(item) {
  const set = new Set();
  const start = parseDateOnly(item?.season_start_date);
  const end = parseDateOnly(item?.season_end_date);

  if (start && end) {
    const spanDays = Math.abs(end - start) / 86400000;

    // A full year or more means "all year"
    if (spanDays >= 360) {
      for (let i = 0; i < 12; i += 1) set.add(i);
      return set;
    }

    addMonthRange(set, start.getMonth(), end.getMonth());
    return set;
  }

  const single = start || end;
  if (single) set.add(single.getMonth());

  return set;
}

function getMonthsFromText(text) {
  const value = String(text || "");
  const set = new Set();
  const pattern = new RegExp(MONTH_PATTERN, "gi");
  const found = [];

  let match = pattern.exec(value);

  while (match) {
    found.push({
      month: MONTH_KEYS.indexOf(match[1].slice(0, 3).toLowerCase()),
      start: match.index,
      end: match.index + match[0].length,
    });
    match = pattern.exec(value);
  }

  found.forEach((token, index) => {
    if (token.month < 0) return;

    set.add(token.month);

    if (index === 0) return;

    // "Oct - Mar" / "October to March" -> everything in between
    const gap = value.slice(found[index - 1].end, token.start);

    if (/^\s*(?:to|till|until|through|thru|-|–|—)\s*$/i.test(gap)) {
      addMonthRange(set, found[index - 1].month, token.month);
    }
  });

  return set;
}

function getDestinationMonths(item) {
  const set = getMonthsFromSeasonDates(item);

  getMonthsFromText(item?.best_time_to_visit).forEach((month) => set.add(month));

  return set;
}

/* =========================================================
   HELPERS
========================================================= */

function getImageUrl(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (typeof image === "object") return image?.url || image?.secure_url || "";
  return "";
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "Contact us";
  }
  const numericPrice = Number(value);
  if (Number.isNaN(numericPrice)) return String(value);
  return `₹${numericPrice.toLocaleString("en-IN")}`;
}

function formatShortDate(value) {
  const date = parseDateOnly(value);
  if (!date) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getSeasonRange(item) {
  const start = formatShortDate(item?.season_start_date);
  const end = formatShortDate(item?.season_end_date);
  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "";
}

/* =========================================================
   DESTINATION CARD
========================================================= */

function DestinationCard({ item, months, selectedMonth, currentMonth }) {
  const placeName = item?.place_name?.trim() || "Destination";
  const slug = item?.slug?.trim() || "";
  const image = getImageUrl(item?.image);
  const description = item?.description?.trim() || "";
  const bestTime = item?.best_time_to_visit?.trim() || "";
  const seasonLabel = item?.season_label?.trim() || "";
  const seasonRange = getSeasonRange(item);
  const inSeason = months.has(currentMonth);

  // Public URL needs a slug
  if (!slug) return null;

  const monthList = MONTH_NAMES.filter((_, index) => months.has(index)).join(", ");

  return (
    <Link
      to={`${DETAIL_BASE}/${slug}`}
      className="
        group
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-4xl
        border
        border-divider
        bg-card
        shadow-travel-card
        transition-all
        duration-500
        hover:-translate-y-1
        hover:border-secondary-light
        hover:shadow-travel-hover
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-primary/30
        focus-visible:ring-offset-2
      "
    >
      {/* IMAGE */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-strong">
        {image ? (
          <img
            src={image}
            alt={`${placeName} — seasonal travel destination`}
            loading="lazy"
            decoding="async"
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-700
              ease-soft
              group-hover:scale-105
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-petal-gradient">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-travel-card">
              <MapPin className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/65 via-ink-900/10 to-transparent" />

        {/* Season label */}
        {seasonLabel && (
          <div
            className="
              absolute
              left-4
              top-4
              inline-flex
              max-w-[65%]
              items-center
              gap-1.5
              rounded-full
              border
              border-white/30
              bg-white/90
              px-3
              py-1.5
              text-[11px]
              font-semibold
              text-primary
              shadow-sm
              backdrop-blur-sm
            "
          >
            <Sun className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{seasonLabel}</span>
          </div>
        )}

        {/* In season now */}
        {inSeason && (
          <div
            className="
              absolute
              right-4
              top-4
              inline-flex
              items-center
              gap-1.5
              rounded-full
              bg-success-bg
              px-3
              py-1.5
              text-[11px]
              font-semibold
              text-success-text
              shadow-sm
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            In season now
          </div>
        )}

        {/* Destination name */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-semibold">{placeName}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div>
          <h3
            className="
              font-display
              text-[1.7rem]
              font-semibold
              leading-tight
              text-text-dark
              transition-colors
              duration-300
              group-hover:text-primary
              sm:text-3xl
            "
          >
            Explore {placeName}
          </h3>

          {description && (
            <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-text-secondary">
              {description}
            </p>
          )}
        </div>

        {/* Season dates + best time */}
        {(seasonRange || bestTime) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {seasonRange && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-medium text-text-secondary">
                <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Season: {seasonRange}</span>
              </div>
            )}
            {bestTime && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-medium text-text-secondary">
                <Sun className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Best time: {bestTime}</span>
              </div>
            )}
          </div>
        )}

        {/* Month bar: which months are good, at a glance */}
        {months.size > 0 && (
          <div
            className="mt-4"
            role="img"
            aria-label={`Good to visit in ${monthList}`}
          >
            <div className="grid grid-cols-12 gap-1">
              {MONTH_LETTERS.map((letter, index) => {
                const on = months.has(index);
                const picked = index === selectedMonth;

                return (
                  <div
                    key={MONTH_NAMES[index]}
                    className="flex flex-col items-center gap-1"
                    title={MONTH_NAMES[index]}
                  >
                    <span
                      className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                        on ? "bg-primary" : "bg-surface-strong"
                      } ${picked ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}
                    />
                    <span
                      className={`text-[9px] font-medium leading-none ${
                        picked ? "text-primary" : "text-muted"
                      }`}
                    >
                      {letter}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRICE + CTA */}
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-4 border-t border-divider pt-4">
            <div>
              <p className="text-xs text-muted">Starting from</p>
              <p className="mt-0.5 font-display text-2xl font-semibold leading-none text-primary sm:text-3xl">
                {formatPrice(item?.starting_from)}
              </p>
            </div>

            <span
              className="
                inline-flex
                shrink-0
                items-center
                gap-1.5
                rounded-full
                border
                border-primary/15
                bg-primary-lighter
                px-3
                py-2
                text-xs
                font-semibold
                text-primary
                transition-all
                duration-300
                group-hover:bg-primary
                group-hover:text-white
              "
            >
              View details
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   SKELETON CARD
========================================================= */

function DestinationSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-4xl border border-divider bg-card shadow-travel-card"
      aria-hidden="true"
    >
      <div className="aspect-[4/3] animate-pulse bg-surface-strong" />

      <div className="space-y-4 p-5 sm:p-6">
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-surface-strong" />

        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-surface-strong" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-surface-strong" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface-strong" />
        </div>

        <div className="h-7 w-32 animate-pulse rounded-full bg-surface-strong" />

        <div className="border-t border-divider pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 h-3 w-20 animate-pulse rounded bg-surface-strong" />
              <div className="h-7 w-24 animate-pulse rounded bg-surface-strong" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded-full bg-surface-strong" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SEASONAL DESTINATIONS PAGE

   Filters (both are kept in the URL, so a filtered view can be
   shared and the back button works):
     ?month=october   month dropdown / "This month"
     ?season=Winter   season pills
   The SEO canonical path stays /seasoned-destinations.
========================================================= */

export default function SeasonedPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentMonth = new Date().getMonth();

  useEffect(() => {
    let mounted = true;

    const loadPlaces = async () => {
      try {
        setLoading(true);

        const response = await getSeasonedDestinations();

        // Support: [...], { data: [...] }, { items: [...] }
        const data = response?.data ?? response?.items ?? response ?? [];

        if (!mounted) return;

        const destinationList = Array.isArray(data) ? data : [];

        // Public API returns published items; this is a safety net
        const published = destinationList.filter(
          (item) => item?.status === undefined || item?.status === "published"
        );

        // Keep the admin-controlled display order
        published.sort(
          (a, b) => Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0)
        );

        setPlaces(published);
      } catch (error) {
        console.error("Failed to load seasonal destinations:", error);
        if (mounted) setPlaces([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPlaces();

    return () => {
      mounted = false;
    };
  }, []);

  // Each destination with the months it is good to visit
  const entries = useMemo(
    () => places.map((item) => ({ item, months: getDestinationMonths(item) })),
    [places]
  );

  // Unique season labels, in display order
  const seasonLabels = useMemo(() => {
    const labels = [];
    places.forEach((p) => {
      const label = p?.season_label?.trim();
      if (label && !labels.includes(label)) labels.push(label);
    });
    return labels;
  }, [places]);

  /* ---------- Filter state (from the URL) ---------- */

  const monthParam = (searchParams.get("month") || "").toLowerCase();
  const selectedMonth = MONTH_NAMES.findIndex(
    (name) => name.toLowerCase() === monthParam
  ); // -1 = any month

  const seasonParam = searchParams.get("season") || "All";
  const activeSeason =
    seasonParam === "All" || seasonLabels.includes(seasonParam)
      ? seasonParam
      : "All";

  const updateFilters = (patch) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });

    setSearchParams(next, { replace: true });
  };

  const selectMonth = (index) =>
    updateFilters({ month: index >= 0 ? MONTH_NAMES[index].toLowerCase() : "" });

  const selectSeason = (label) =>
    updateFilters({ season: label === "All" ? "" : label });

  const clearFilters = () => updateFilters({ month: "", season: "" });

  /* ---------- Filtering ---------- */

  const seasonFiltered = useMemo(
    () =>
      activeSeason === "All"
        ? entries
        : entries.filter(
            ({ item }) => item?.season_label?.trim() === activeSeason
          ),
    [entries, activeSeason]
  );

  // How many destinations are good in each month (respecting the season pill),
  // so the dropdown never sends people to an empty result.
  const monthCounts = useMemo(() => {
    const counts = Array(12).fill(0);

    seasonFiltered.forEach(({ months }) => {
      months.forEach((month) => {
        counts[month] += 1;
      });
    });

    return counts;
  }, [seasonFiltered]);

  const visibleEntries = useMemo(
    () =>
      selectedMonth < 0
        ? seasonFiltered
        : seasonFiltered.filter(({ months }) => months.has(selectedMonth)),
    [seasonFiltered, selectedMonth]
  );

  // When a month has nothing, suggest the closest months that do
  const nearbyMonths = useMemo(() => {
    if (selectedMonth < 0 || visibleEntries.length > 0) return [];

    const distance = (month) =>
      Math.min(
        (month - selectedMonth + 12) % 12,
        (selectedMonth - month + 12) % 12
      );

    return MONTH_NAMES.map((_, index) => index)
      .filter((index) => index !== selectedMonth && monthCounts[index] > 0)
      .sort((a, b) => distance(a) - distance(b))
      .slice(0, 3);
  }, [selectedMonth, visibleEntries.length, monthCounts]);

  const filtersActive = selectedMonth >= 0 || activeSeason !== "All";

  /* =======================================================
     SEO
  ======================================================== */

  const seoPath = DETAIL_BASE;
  const seoDescription =
    "Find the best time to visit every destination. Browse seasonal travel destinations by month or season, check season dates and best months to travel, and explore holiday packages from Manyara Prive Vacations.";

  const seoJsonLd = useMemo(() => {
    const pageUrl = `${SITE_URL}${seoPath}`;

    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Seasonal Destinations",
            item: pageUrl,
          },
        ],
      },
    ];

    const listed = places.filter((p) => p?.slug?.trim());

    if (listed.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Seasonal Destinations",
        description: seoDescription,
        url: pageUrl,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: listed.length,
          itemListElement: listed.map((p, index) => {
            const image = getImageUrl(p.image);
            return {
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "TouristDestination",
                name: p.place_name,
                url: `${SITE_URL}${DETAIL_BASE}/${p.slug}`,
                ...(p.description ? { description: p.description } : {}),
                ...(image ? { image } : {}),
              },
            };
          }),
        },
      });
    }

    return schemas;
  }, [places]);

  // Use the first destination photo for social sharing when it is a full URL
  const firstImage = getImageUrl(places[0]?.image);
  const seoImage = /^https?:\/\//.test(firstImage) ? firstImage : undefined;

  return (
    <>
      <Seo
        title="Seasonal Destinations: Best Places to Visit by Month and Season"
        description={seoDescription}
        path={seoPath}
        image={seoImage}
        jsonLd={seoJsonLd}
      />

      <main className="min-h-screen bg-background">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-divider bg-petal-gradient">
          <div
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-secondary-lighter opacity-70 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-primary-lighter opacity-60 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-11 lg:px-8 lg:py-16">
            <Link
              to="/"
              className="
                group
                mb-7
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-divider
                bg-white/80
                px-3.5
                py-2
                text-sm
                font-medium
                text-text-secondary
                shadow-sm
                backdrop-blur-sm
                transition-all
                duration-300
                hover:border-primary/20
                hover:bg-white
                hover:text-primary
              "
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              Back to Home
            </Link>

            <div className="max-w-3xl">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-primary/15
                  bg-white/75
                  px-3.5
                  py-2
                  text-xs
                  font-semibold
                  text-primary
                  shadow-sm
                  backdrop-blur-sm
                "
              >
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                Travel by season
              </div>

              <h1
                className="
                  mt-5
                  max-w-3xl
                  font-display
                  text-4xl
                  font-semibold
                  leading-[0.98]
                  tracking-tight
                  text-text-display
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                The right place for every season.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
                Every destination is at its best at a different time of year. Pick the month you
                want to travel, see when each place peaks, and plan your trip around the weather
                you want.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Month-wise picks
                </span>
                <span className="hidden h-3 w-px bg-divider sm:block" />
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-bright" />
                  Best time to visit
                </span>
                <span className="hidden h-3 w-px bg-divider sm:block" />
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Holiday packages
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* DESTINATIONS SECTION */}
        <section className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-tight text-text-dark sm:text-4xl">
                Plan by month or season
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
                Choose the month you want to travel, or a season, to see the destinations that
                shine in it.
              </p>
            </div>

            {!loading && places.length > 0 && (
              <div
                className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-soft px-3.5 py-2 text-xs font-semibold text-primary"
                aria-live="polite"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {visibleEntries.length}{" "}
                {visibleEntries.length === 1 ? "destination" : "destinations"}
                {selectedMonth >= 0 && ` in ${MONTH_NAMES[selectedMonth]}`}
              </div>
            )}
          </div>

          {/* FILTER BAR */}
          {!loading && places.length > 0 && (
            <div className="mb-7 rounded-3xl border border-divider bg-card p-4 shadow-travel-card sm:mb-9 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {/* Month dropdown */}
                <div className="relative sm:w-72">
                  <label htmlFor="month-filter" className="sr-only">
                    Month you want to travel
                  </label>

                  <CalendarDays
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
                    aria-hidden="true"
                  />

                  <select
                    id="month-filter"
                    value={selectedMonth >= 0 ? String(selectedMonth) : ""}
                    onChange={(event) =>
                      selectMonth(
                        event.target.value === "" ? -1 : Number(event.target.value)
                      )
                    }
                    className="
                      h-11
                      w-full
                      cursor-pointer
                      appearance-none
                      rounded-full
                      border
                      border-border
                      bg-white
                      pl-11
                      pr-10
                      text-sm
                      font-medium
                      text-text-dark
                      shadow-sm
                      outline-none
                      transition-colors
                      duration-300
                      hover:border-primary/40
                      focus:border-primary
                      focus-visible:ring-2
                      focus-visible:ring-primary/30
                    "
                  >
                    <option value="">Any month</option>

                    {MONTH_NAMES.map((name, index) => (
                      <option
                        key={name}
                        value={index}
                        disabled={monthCounts[index] === 0 && index !== selectedMonth}
                      >
                        {name} ({monthCounts[index]})
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                    aria-hidden="true"
                  />
                </div>

                {/* This month shortcut */}
                <button
                  type="button"
                  onClick={() =>
                    selectMonth(selectedMonth === currentMonth ? -1 : currentMonth)
                  }
                  disabled={
                    monthCounts[currentMonth] === 0 && selectedMonth !== currentMonth
                  }
                  aria-pressed={selectedMonth === currentMonth}
                  className={`
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    border
                    px-4
                    text-sm
                    font-medium
                    transition-all
                    duration-300
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    ${
                      selectedMonth === currentMonth
                        ? "border-primary bg-primary text-white shadow-brand"
                        : "border-border bg-white text-text-secondary hover:border-primary/40 hover:text-primary"
                    }
                  `}
                >
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  This month ({MONTH_SHORT[currentMonth]})
                </button>

                {/* Clear */}
                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="
                      inline-flex
                      h-11
                      items-center
                      justify-center
                      gap-1.5
                      rounded-full
                      px-3
                      text-sm
                      font-semibold
                      text-primary
                      transition-colors
                      duration-300
                      hover:text-primary-hover
                      sm:ml-auto
                    "
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Clear filters
                  </button>
                )}
              </div>

              {/* Season pills */}
              {seasonLabels.length > 1 && (
                <div
                  className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4"
                  role="tablist"
                  aria-label="Filter by season"
                >
                  {["All", ...seasonLabels].map((label) => {
                    const active = activeSeason === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => selectSeason(label)}
                        className={`
                          rounded-full
                          border
                          px-4
                          py-2
                          text-sm
                          font-medium
                          transition-all
                          duration-300
                          ${
                            active
                              ? "border-primary bg-primary text-white shadow-brand"
                              : "border-border bg-white text-text-secondary hover:border-primary/40 hover:text-primary"
                          }
                        `}
                      >
                        {label === "All" ? "All seasons" : label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <DestinationSkeleton key={item} />
              ))}
            </div>
          ) : places.length === 0 ? (
            /* EMPTY STATE */
            <div className="relative overflow-hidden rounded-4xl border border-divider bg-petal-gradient px-6 py-14 text-center shadow-travel-card sm:px-10 sm:py-16">
              <div
                className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-white/60 blur-2xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-secondary-lighter opacity-60 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-travel-card">
                  <Sun className="h-7 w-7" aria-hidden="true" />
                </div>

                <h3 className="mt-5 font-display text-3xl font-semibold text-text-dark">
                  No seasonal destinations yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  Our season-by-season picks will appear here once they are added and published
                  by our team.
                </p>

                <Link
                  to="/packages"
                  className="
                    mt-7
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-primary
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-brand
                    transition-all
                    duration-300
                    hover:bg-primary-hover
                    hover:shadow-orange
                  "
                >
                  Explore Packages
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : visibleEntries.length === 0 ? (
            /* NOTHING MATCHES THE FILTERS */
            <div className="rounded-4xl border border-dashed border-primary/20 bg-surface-soft px-6 py-12 text-center sm:px-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-travel-card">
                <CalendarDays className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="mt-5 font-display text-2xl font-semibold text-text-dark sm:text-3xl">
                {selectedMonth >= 0
                  ? `Nothing peaks in ${MONTH_NAMES[selectedMonth]} yet`
                  : "No destinations match these filters"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                {nearbyMonths.length > 0
                  ? "Try a nearby month, or look at every destination."
                  : "Try another season, or look at every destination."}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {nearbyMonths.map((index) => (
                  <button
                    key={MONTH_NAMES[index]}
                    type="button"
                    onClick={() => selectMonth(index)}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-all duration-300 hover:border-primary/40 hover:text-primary"
                  >
                    {MONTH_NAMES[index]} ({monthCounts[index]})
                  </button>
                ))}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-brand transition-colors duration-300 hover:bg-primary-hover"
                >
                  Show all destinations
                </button>
              </div>
            </div>
          ) : (
            /* DESTINATION CARDS
               The key remounts the group so the reveal replays after filtering */
            <RevealGroup
              key={`${activeSeason}-${selectedMonth}`}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
            >
              {visibleEntries.map(({ item, months }) => (
                <DestinationCard
                  key={item?.id ?? item?.slug}
                  item={item}
                  months={months}
                  selectedMonth={selectedMonth}
                  currentMonth={currentMonth}
                />
              ))}
            </RevealGroup>
          )}
        </section>

        {/* CLOSING BAND */}
        {!loading && places.length > 0 && (
          <section className="px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-4xl border border-primary/10 bg-brand-gradient px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-text-dark sm:text-3xl">
                    Found a season you love?
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    See the holiday packages planned for it.
                  </p>
                </div>

                <Link
                  to="/packages"
                  className="
                    group
                    inline-flex
                    w-fit
                    shrink-0
                    items-center
                    gap-2
                    rounded-full
                    bg-primary
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-brand
                    transition-all
                    duration-300
                    hover:bg-primary-hover
                  "
                >
                  Explore all packages
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FAQ */}
      <FAQSection category="seasonal" />

      {/* FOOTER */}
      <Footer />
    </>
  );
}


