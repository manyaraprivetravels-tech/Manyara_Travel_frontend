

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Filter,
  ImageOff,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { getPackages } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import useLoadMore from "../hooks/useLoadMore";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import FAQSection from "../components/FAQSection";
import LoadMoreButton from "../components/LoadMoreButton";
import { RevealGroup } from "../components/Reveal";

/* ==========================================================
   BRAND
   ========================================================== */

const BRAND_NAME = "Manyara Prive Vacations";

const SITE_URL = (
  import.meta.env.VITE_SITE_URL || window.location.origin
).replace(/\/$/, "");

/* ==========================================================
   CONSTANTS
   ========================================================== */

/*
 * Cards shown first, and added on each "Load more" click.
 * The grid has 2 columns, so an even number avoids a
 * half-empty last row.
 */
const PAGE_SIZE = 16;

const PACKAGE_TYPE_LABELS = {
  pilgrimage: "Pilgrimage",
  mountains_adventure: "Mountains & Adventure",
  romantic: "Romantic",
  international: "International",
  beach: "Beach",
  family: "Family",
  wildlife_nature: "Wildlife & Nature",
};

const REGION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
];

const PACKAGE_COLLECTIONS = [
  {
    value: "all",
    label: "All Packages",
    description: `Explore all available holiday packages from ${BRAND_NAME}.`,
  },
  {
    value: "new",
    label: "New",
    description:
      "Discover our newest holiday packages and recently added travel experiences.",
  },
  {
    value: "most-visited",
    label: "Most Visited",
    description:
      "Explore holiday packages for destinations loved and visited by travellers.",
  },
  {
    value: "featured",
    label: "Featured",
    description: `Explore handpicked featured holiday packages from ${BRAND_NAME}.`,
  },
  {
    value: "recommended",
    label: "Recommended",
    description:
      "Discover holiday packages recommended for memorable travel experiences.",
  },
  {
    value: "trending",
    label: "Trending",
    description:
      "Explore trending holiday packages and popular travel experiences.",
  },
  {
    value: "popular",
    label: "Popular",
    description: `Discover popular holiday packages selected by ${BRAND_NAME}.`,
  },
];

const COLLECTION_FLAG_MAP = {
  new: "is_new",
  "most-visited": "is_most_visited",
  featured: "is_featured",
  recommended: "is_recommended",
  trending: "is_trending",
  popular: "is_popular",
};

const PRICE_OPTIONS = [
  {
    value: "all",
    label: "Any price",
  },
  {
    value: "under-25000",
    label: "Under ₹25,000",
  },
  {
    value: "25000-50000",
    label: "₹25,000 – ₹50,000",
  },
  {
    value: "50000-100000",
    label: "₹50,000 – ₹1,00,000",
  },
  {
    value: "100000-plus",
    label: "Above ₹1,00,000",
  },
];

const PRICE_TESTS = {
  "under-25000": (price) => price < 25000,
  "25000-50000": (price) => price >= 25000 && price <= 50000,
  "50000-100000": (price) => price >= 50000 && price <= 100000,
  "100000-plus": (price) => price > 100000,
};

const DURATION_OPTIONS = [
  {
    value: "all",
    label: "Any duration",
  },
  {
    value: "1-3",
    label: "1 – 3 days",
  },
  {
    value: "4-7",
    label: "4 – 7 days",
  },
  {
    value: "8-14",
    label: "8 – 14 days",
  },
  {
    value: "15-plus",
    label: "15+ days",
  },
];

const DURATION_TESTS = {
  "1-3": (days) => days >= 1 && days <= 3,
  "4-7": (days) => days >= 4 && days <= 7,
  "8-14": (days) => days >= 8 && days <= 14,
  "15-plus": (days) => days >= 15,
};

const SORT_OPTIONS = [
  {
    value: "recommended",
    label: "Recommended",
  },
  {
    value: "price-low",
    label: "Price: Low to High",
  },
  {
    value: "price-high",
    label: "Price: High to Low",
  },
  {
    value: "duration-short",
    label: "Duration: Shortest",
  },
  {
    value: "duration-long",
    label: "Duration: Longest",
  },
  {
    value: "newest",
    label: "Newest",
  },
];

/* ==========================================================
   THEME
   ========================================================== */

const INPUT =
  "w-full rounded-xl border border-rose-200/80 bg-white/80 px-4 py-3 text-sm text-text-dark outline-none transition-all placeholder:text-muted focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md";

/* ==========================================================
   NORMALIZERS
   ========================================================== */

const TYPE_ALIASES = {
  mountains_and_adventure: "mountains_adventure",
  mountain_adventure: "mountains_adventure",
  mountains: "mountains_adventure",
  adventure: "mountains_adventure",
  wildlife_and_nature: "wildlife_nature",
  wildlife: "wildlife_nature",
  nature: "wildlife_nature",
};

const normalizePackageType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s-]+/g, "_");

  return TYPE_ALIASES[normalized] || normalized;
};

const normalizeRegion = (value) => {
  const region = String(value || "")
    .trim()
    .toLowerCase();

  return region === "domestic" || region === "international"
    ? region
    : "all";
};

/*
 * Uses the backend `region` field. Until every API response
 * includes it, falls back to the old package_type rule so the
 * page keeps working during the rollout.
 */
const getPackageRegion = (pkg) => {
  const region = String(pkg?.region || "")
    .trim()
    .toLowerCase();

  if (region === "domestic" || region === "international") {
    return region;
  }

  return normalizePackageType(pkg?.package_type || pkg?.type) ===
    "international"
    ? "international"
    : "domestic";
};

const normalizeDestination = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const COLLECTION_ALIASES = {
  newest: "new",
  recommendation: "recommended",
  mostvisited: "most-visited",
  "most-visited-packages": "most-visited",
};

const normalizeCollection = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  const collection = COLLECTION_ALIASES[normalized] || normalized;

  return PACKAGE_COLLECTIONS.some(
    (item) => item.value === collection
  )
    ? collection
    : "all";
};

/* ==========================================================
   HELPERS
   ========================================================== */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

function getSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;

  return [];
}

const isPublished = (pkg) =>
  pkg?.status === undefined ||
  pkg?.status === "published" ||
  pkg?.is_published === true;

const getImageUrl = (image) =>
  typeof image === "string" ? image : image?.url || "";

const getPackageImage = (pkg) => {
  if (Array.isArray(pkg?.images)) {
    const first = pkg.images
      .map(getImageUrl)
      .find(Boolean);

    if (first) return first;
  }

  return (
    getImageUrl(pkg?.image) ||
    pkg?.image_url ||
    ""
  );
};

const getPackageTypeLabel = (type) => {
  const normalized = normalizePackageType(type);

  return (
    PACKAGE_TYPE_LABELS[normalized] ||
    String(type || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Holiday"
  );
};

const formatPrice = (price) => {
  const number = Number(price);

  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "Price on request";
  }

  return Number.isFinite(number)
    ? `₹${number.toLocaleString("en-IN")}`
    : "Price on request";
};

const formatDuration = (days, nights) => {
  if (
    !days ||
    nights === undefined ||
    nights === null
  ) {
    return "Flexible";
  }

  return `${days} ${
    Number(days) === 1 ? "day" : "days"
  } / ${nights} ${
    Number(nights) === 1 ? "night" : "nights"
  }`;
};

/* ==========================================================
   FILTER + SORT
   ========================================================== */

function matchesFilters(pkg, f) {
  const packageType = normalizePackageType(
    pkg?.package_type || pkg?.type
  );

  if (f.searchTerm) {
    const searchable = [
      pkg?.title,
      pkg?.destination,
      pkg?.slug,
      pkg?.description,
      PACKAGE_TYPE_LABELS[packageType],
    ];

    const found = searchable.some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(f.searchTerm)
    );

    if (!found) return false;
  }

  if (f.region && getPackageRegion(pkg) !== f.region) {
    return false;
  }

  if (
    f.packageType &&
    packageType !== f.packageType
  ) {
    return false;
  }

  if (
    f.destination &&
    normalizeDestination(pkg?.destination) !==
      f.destination
  ) {
    return false;
  }

  if (
    f.collectionFlag &&
    pkg?.[f.collectionFlag] !== true
  ) {
    return false;
  }

  if (f.priceRange !== "all") {
    const price = Number(pkg?.price);

    if (
      !Number.isFinite(price) ||
      !PRICE_TESTS[f.priceRange](price)
    ) {
      return false;
    }
  }

  if (f.durationRange !== "all") {
    const days = Number(pkg?.duration_days);

    if (
      !Number.isFinite(days) ||
      !DURATION_TESTS[f.durationRange](days)
    ) {
      return false;
    }
  }

  return true;
}

const SORTERS = {
  "price-low": (a, b) =>
    toNumber(a?.price) - toNumber(b?.price),

  "price-high": (a, b) =>
    toNumber(b?.price) - toNumber(a?.price),

  "duration-short": (a, b) =>
    toNumber(a?.duration_days) -
    toNumber(b?.duration_days),

  "duration-long": (a, b) =>
    toNumber(b?.duration_days) -
    toNumber(a?.duration_days),

  newest: (a, b) =>
    toNumber(
      new Date(b?.created_at || 0).getTime()
    ) -
    toNumber(
      new Date(a?.created_at || 0).getTime()
    ),

  recommended: (a, b) => {
    const order =
      toNumber(
        a?.display_order,
        Number.MAX_SAFE_INTEGER
      ) -
      toNumber(
        b?.display_order,
        Number.MAX_SAFE_INTEGER
      );

    if (order) return order;

    if (
      Boolean(a?.is_recommended) !==
      Boolean(b?.is_recommended)
    ) {
      return a?.is_recommended ? -1 : 1;
    }

    if (
      Boolean(a?.is_featured) !==
      Boolean(b?.is_featured)
    ) {
      return a?.is_featured ? -1 : 1;
    }

    return (
      toNumber(a?.id) - toNumber(b?.id)
    );
  },
};

/* ==========================================================
   PAGE TEXT + SEO
   ========================================================== */

function getPageContext({
  destination,
  packageType,
  collection,
  region,
}) {
  const collectionItem =
    PACKAGE_COLLECTIONS.find(
      (item) => item.value === collection
    ) || PACKAGE_COLLECTIONS[0];

  const typeLabel = packageType
    ? getPackageTypeLabel(packageType)
    : "";

  const typeLower = typeLabel.toLowerCase();

  const collectionLower =
    collectionItem.label.toLowerCase();

  const regionLabel =
    region === "domestic"
      ? "Domestic"
      : region === "international"
        ? "International"
        : "";

  const regionPrefix = regionLabel
    ? `${regionLabel} `
    : "";

  const regionPrefixLower = regionPrefix.toLowerCase();

  if (destination !== "all") {
    return {
      title: `${destination} Packages`,
      description: `Explore all available holiday packages for ${destination} from ${BRAND_NAME}. Compare destinations, durations and prices.`,
      seoTitle: `${destination} Holiday Packages | ${BRAND_NAME}`,
      seoDescription: `Explore ${destination} holiday packages from ${BRAND_NAME}. Discover available travel experiences, durations and prices.`,
      emptyMessage: `There are currently no packages available for ${destination} matching your selected filters.`,
      typeLabel,
      collectionLabel: collectionItem.label,
    };
  }

  if (packageType) {
    return {
      title: `${regionPrefix}${typeLabel} Packages`,
      description: `Explore ${regionPrefixLower}${typeLower} holiday packages from ${BRAND_NAME}. Discover curated destinations, experiences, durations and prices.`,
      seoTitle: `${regionPrefix}${typeLabel} Holiday Packages | ${BRAND_NAME}`,
      seoDescription: `Explore ${regionPrefixLower}${typeLower} holiday packages from ${BRAND_NAME}. Discover curated destinations, travel experiences, durations and prices.`,
      emptyMessage: `There are currently no ${regionPrefixLower}${typeLower} packages matching your selected filters.`,
      typeLabel,
      collectionLabel: collectionItem.label,
    };
  }

  if (regionLabel) {
    return {
      title: `${regionLabel} Holiday Packages`,
      description: `Explore ${regionLabel.toLowerCase()} holiday packages from ${BRAND_NAME}. Discover curated destinations, experiences, durations and prices.`,
      seoTitle: `${regionLabel} Holiday Packages | ${BRAND_NAME}`,
      seoDescription: `Explore ${regionLabel.toLowerCase()} holiday packages from ${BRAND_NAME}. Discover curated travel experiences, durations and prices.`,
      emptyMessage: `There are currently no ${regionLabel.toLowerCase()} packages matching your selected filters.`,
      typeLabel,
      collectionLabel: collectionItem.label,
    };
  }

  if (collection !== "all") {
    return {
      title: `${collectionItem.label} Holiday Packages`,
      description: collectionItem.description,
      seoTitle: `${collectionItem.label} Holiday Packages | ${BRAND_NAME}`,
      seoDescription: `Explore ${collectionLower} holiday packages from ${BRAND_NAME}. Discover curated destinations, travel experiences, durations and prices.`,
      emptyMessage: `There are currently no ${collectionLower} packages matching your selected filters.`,
      typeLabel,
      collectionLabel: collectionItem.label,
    };
  }

  return {
    title: "Find the right holiday package for your journey",
    description:
      "Explore holiday packages by destination, package type, price and duration.",
    seoTitle: `Holiday Packages | ${BRAND_NAME}`,
    seoDescription: `Explore holiday packages from ${BRAND_NAME}. Discover curated travel experiences, destinations, durations and prices.`,
    emptyMessage:
      "Try changing your search or filters to find available packages.",
    typeLabel,
    collectionLabel: collectionItem.label,
  };
}

/* ==========================================================
   PACKAGE CARD
   ========================================================== */

function PackageCard({ pkg }) {
  const imageUrl = getPackageImage(pkg);

  const href = `/packages/${encodeURIComponent(
    pkg?.slug || pkg?.id
  )}`;

  const typeLabel = getPackageTypeLabel(
    pkg?.package_type || pkg?.type
  );

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-rose-100 bg-white shadow-[0_8px_30px_rgba(122,76,86,0.07)] transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-200 hover:shadow-[0_18px_45px_rgba(122,76,86,0.12)]">
      <Link to={href} className="block">
        {/* IMAGE */}
        <div className="relative aspect-[16/10] overflow-hidden bg-rose-50">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={
                pkg?.title ||
                "Holiday package"
              }
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-rose-50">
              <ImageOff
                className="h-8 w-8 text-rose-300"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Image bottom overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#3c1f29]/25 to-transparent"
          />

          {/* Package type */}
          <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-[#fffaf8]/95 px-3 py-1.5 text-xs font-semibold text-[#633b46] shadow-sm backdrop-blur-md">
            {typeLabel}
          </span>

          {/* Badges */}
          <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2">
            {pkg?.is_new && (
              <span className="rounded-full bg-[#9f5f70] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                New
              </span>
            )}

            {pkg?.is_featured && (
              <span className="rounded-full bg-[#704552] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                Featured
              </span>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#8b6872]">
            <MapPin
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />

            <span>
              {pkg?.destination || "India"}
            </span>
          </div>

          <h2 className="mt-2 line-clamp-2 font-display text-2xl font-semibold leading-snug text-[#3c2930] transition-colors group-hover:text-primary">
            {pkg?.title || "Holiday Package"}
          </h2>

          {pkg?.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#765f66]">
              {pkg.description}
            </p>
          )}

          <div className="mt-5 flex items-end justify-between gap-4 border-t border-rose-100 pt-4">
            <div>
              <p className="text-xs text-[#9a7b83]">
                Package Cost
              </p>

              <p className="mt-0.5 text-lg font-bold text-primary">
                {formatPrice(pkg?.price)}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#765f66]">
              <Clock
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />

              <span>
                {formatDuration(
                  pkg?.duration_days,
                  pkg?.duration_nights
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            View Package

            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ==========================================================
   PACKAGE SKELETON
   ========================================================== */

function PackageSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[1.5rem] border border-rose-100 bg-white"
      aria-hidden="true"
    >
      <div className="aspect-[16/10] animate-pulse bg-rose-100/70" />

      <div className="space-y-4 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-rose-100" />

        <div className="h-6 w-4/5 animate-pulse rounded bg-rose-100" />

        <div className="h-4 w-full animate-pulse rounded bg-rose-100" />

        <div className="h-4 w-2/3 animate-pulse rounded bg-rose-100" />

        <div className="flex justify-between border-t border-rose-100 pt-4">
          <div className="h-6 w-28 animate-pulse rounded bg-rose-100" />

          <div className="h-5 w-20 animate-pulse rounded bg-rose-100" />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   FILTER SELECT
   ========================================================== */

function FilterSelect({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-xs font-semibold text-[#765f66]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          aria-label={
            label ? undefined : ariaLabel
          }
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`${INPUT} appearance-none pr-10`}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/* ==========================================================
   TOP FILTERS
   Region switch + package-type chips for the selected region
   ========================================================== */

function TopFilters({
  region,
  onRegion,
  regionCounts,
  packageType,
  onType,
  typeOptions,
}) {
  const chip = (active) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "border-[#8f5666] bg-[#8f5666] text-white shadow-[0_5px_18px_rgba(143,86,102,0.20)]"
        : "border-rose-100 bg-white text-[#765f66] shadow-sm hover:border-[#c995a3] hover:bg-[#fff8f8] hover:text-[#8f5666]"
    }`;

  const count = (active, value) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        active
          ? "bg-white/20"
          : "bg-rose-50 text-[#8f5666]"
      }`}
    >
      {value}
    </span>
  );

  const regionName =
    REGION_OPTIONS.find(
      (item) => item.value === region
    )?.label || "All";

  return (
    <div className="mb-8 space-y-5 sm:mb-10">
      {/* REGION */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a06473]">
          Where to?
        </p>

        <div
          role="group"
          aria-label="Filter by region"
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {REGION_OPTIONS.map((item) => {
            const active = region === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onRegion(item.value)}
                aria-pressed={active}
                className={chip(active)}
              >
                {item.label}
                {count(
                  active,
                  regionCounts[item.value] ?? 0
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TYPES for the selected region */}
      {typeOptions.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a06473]">
            {region === "all"
              ? "Package type"
              : `${regionName} package types`}
          </p>

          <div
            role="group"
            aria-label="Filter by package type"
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            <button
              type="button"
              onClick={() => onType("")}
              aria-pressed={!packageType}
              className={chip(!packageType)}
            >
              All types
            </button>

            {typeOptions.map((item) => {
              const active =
                packageType === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    onType(active ? "" : item.value)
                  }
                  aria-pressed={active}
                  className={chip(active)}
                >
                  {item.label}
                  {count(active, item.count)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   FILTERS (sidebar / mobile drawer)
   ========================================================== */

function Filters({
  idPrefix,
  search,
  onSearch,
  destination,
  onDestination,
  destinationOptions,
  priceRange,
  onPrice,
  durationRange,
  onDuration,
  showReset,
  onReset,
}) {
  return (
    <div className="space-y-5">
      {/* SEARCH */}
      <div>
        <label
          htmlFor={`${idPrefix}-search`}
          className="mb-2 block text-xs font-semibold text-[#765f66]"
        >
          Search
        </label>

        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a47b85]"
            aria-hidden="true"
          />

          <input
            id={`${idPrefix}-search`}
            type="search"
            value={search}
            onChange={(event) =>
              onSearch(event.target.value)
            }
            placeholder="Search packages..."
            className={`${INPUT} px-10`}
          />
        </div>
      </div>

      {/* DESTINATION */}
      <FilterSelect
        id={`${idPrefix}-destination`}
        label="Destination"
        value={destination}
        onChange={onDestination}
        options={destinationOptions}
      />

      {/* PRICE */}
      <FilterSelect
        id={`${idPrefix}-price`}
        label="Price"
        value={priceRange}
        onChange={onPrice}
        options={PRICE_OPTIONS}
      />

      {/* DURATION */}
      <FilterSelect
        id={`${idPrefix}-duration`}
        label="Duration"
        value={durationRange}
        onChange={onDuration}
        options={DURATION_OPTIONS}
      />

      {/* RESET */}
      {showReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-[#633b46] transition-all hover:border-primary hover:bg-[#fff5f6] hover:text-primary"
        >
          <X
            className="h-4 w-4"
            aria-hidden="true"
          />

          Clear Filters
        </button>
      )}
    </div>
  );
}

/* ==========================================================
   PAGE
   ========================================================== */

export default function PackagesPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  /*
   * URL is the single source of truth for
   * collection, region, type and destination.
   */

  const collection = normalizeCollection(
    searchParams.get("collection")
  );

  const rawRegion = normalizeRegion(
    searchParams.get("region")
  );

  const rawType = normalizePackageType(
    searchParams.get("type")
  );

  /*
   * Old links like /packages?type=international now map to
   * the International region instead of a package type.
   */
  const legacyInternational =
    rawType === "international";

  const region =
    legacyInternational && rawRegion === "all"
      ? "international"
      : rawRegion;

  const packageType = legacyInternational
    ? ""
    : rawType;

  const urlDestination = (
    searchParams.get("destination") || ""
  ).trim();

  /*
   * Cached data:
   * instant on repeat visits,
   * updates itself when fresh.
   */

  const {
    data,
    loading,
    error,
  } = useQuery(getPackages);

  const packages = useMemo(
    () =>
      getSafeArray(data).filter(isPublished),
    [data]
  );

  const [search, setSearch] = useState("");

  const [priceRange, setPriceRange] =
    useState("all");

  const [durationRange, setDurationRange] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("recommended");

  const [
    mobileFiltersOpen,
    setMobileFiltersOpen,
  ] = useState(false);

  /* ========================================================
     REGION + TYPE OPTIONS
     ======================================================== */

  const regionPackages = useMemo(
    () =>
      region === "all"
        ? packages
        : packages.filter(
            (pkg) =>
              getPackageRegion(pkg) === region
          ),
    [packages, region]
  );

  const regionCounts = useMemo(() => {
    const counts = {
      all: packages.length,
      domestic: 0,
      international: 0,
    };

    packages.forEach((pkg) => {
      counts[getPackageRegion(pkg)] += 1;
    });

    return counts;
  }, [packages]);

  const typeOptions = useMemo(() => {
    const counts = new Map();

    regionPackages.forEach((pkg) => {
      const type = normalizePackageType(
        pkg?.package_type || pkg?.type
      );

      // "international" is covered by the region switch
      if (!type || type === "international") {
        return;
      }

      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return [...counts.entries()]
      .map(([value, count]) => ({
        value,
        count,
        label: getPackageTypeLabel(value),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label)
      );
  }, [regionPackages]);

  /* ========================================================
     DESTINATION OPTIONS
     ======================================================== */

  const destinationOptions = useMemo(() => {
    const unique = new Map();

    regionPackages.forEach((pkg) => {
      const name = String(
        pkg?.destination || ""
      ).trim();

      const key = normalizeDestination(name);

      if (name && !unique.has(key)) {
        unique.set(key, name);
      }
    });

    return [
      {
        value: "all",
        label: "All destinations",
      },

      ...[...unique.values()]
        .sort((a, b) =>
          a.localeCompare(b)
        )
        .map((name) => ({
          value: name,
          label: name,
        })),
    ];
  }, [regionPackages]);

  /* ========================================================
     DESTINATION FROM URL
     ======================================================== */

  const destination = useMemo(() => {
    if (
      !urlDestination ||
      urlDestination.toLowerCase() === "all"
    ) {
      return "all";
    }

    const match = destinationOptions.find(
      (option) =>
        option.value !== "all" &&
        normalizeDestination(option.value) ===
          normalizeDestination(urlDestination)
    );

    return match
      ? match.value
      : urlDestination;
  }, [
    urlDestination,
    destinationOptions,
  ]);

  /* ========================================================
     FILTERED PACKAGES
     ======================================================== */

  const filteredPackages = useMemo(() => {
    const filters = {
      searchTerm: search
        .trim()
        .toLowerCase(),

      region: region === "all" ? "" : region,

      packageType,

      destination:
        destination === "all"
          ? ""
          : normalizeDestination(
              destination
            ),

      collectionFlag:
        COLLECTION_FLAG_MAP[collection] || "",

      priceRange,

      durationRange,
    };

    return packages
      .filter((pkg) =>
        matchesFilters(pkg, filters)
      )
      .sort(
        SORTERS[sortBy] ||
          SORTERS.recommended
      );
  }, [
    packages,
    search,
    region,
    packageType,
    destination,
    collection,
    priceRange,
    durationRange,
    sortBy,
  ]);

  /* ========================================================
     LOAD MORE
     Show the first PAGE_SIZE packages, then reveal more on
     each "Load more" click. Goes back to the first batch
     whenever any filter, search or sort changes.
     ======================================================== */

  const { visible, remaining, loadMore } = useLoadMore(
    filteredPackages,
    {
      pageSize: PAGE_SIZE,
      resetKey: [
        search,
        region,
        packageType,
        destination,
        collection,
        priceRange,
        durationRange,
        sortBy,
      ].join("|"),
    }
  );

  /* ========================================================
     PAGE CONTEXT
     ======================================================== */

  const context = getPageContext({
    destination,
    packageType,
    collection,
    region,
  });

  const activeFilterCount = [
    search.trim(),
    region !== "all",
    destination !== "all",
    packageType,
    priceRange !== "all",
    durationRange !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters =
    activeFilterCount > 0;

  /* ========================================================
     URL UPDATES
     ======================================================== */

  const updateParams = (changes) => {
    const params =
      new URLSearchParams(searchParams);

    Object.entries(changes).forEach(
      ([key, value]) => {
        if (
          !value ||
          value === "all"
        ) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
    );

    setSearchParams(params, {
      replace: true,
    });
  };

  const handleCollectionChange = (
    value
  ) =>
    updateParams({
      collection:
        normalizeCollection(value),
    });

  const handleDestinationChange = (
    value
  ) =>
    updateParams({
      destination: value,
    });

  /*
   * Changing region clears type and destination, because
   * they may not exist in the other region.
   */
  const handleRegionChange = (value) =>
    updateParams({
      region: normalizeRegion(value),
      type: "",
      destination: "",
    });

  const handleTypeChange = (value) =>
    updateParams({
      type: value,
    });

  /* ========================================================
     RESET FILTERS
     ======================================================== */

  const resetFilters = () => {
    setSearch("");
    setPriceRange("all");
    setDurationRange("all");
    setSortBy("recommended");

    updateParams({
      destination: "",
      type: "",
      region: "",
    });
  };

  /* ========================================================
     MOBILE FILTER DRAWER
     ======================================================== */

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    document.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [mobileFiltersOpen]);

  /* ========================================================
     FILTER PROPS
     ======================================================== */

  const filterProps = {
    search,
    onSearch: setSearch,

    destination,
    onDestination:
      handleDestinationChange,

    destinationOptions,

    priceRange,
    onPrice: setPriceRange,

    durationRange,
    onDuration: setDurationRange,

    showReset: hasActiveFilters,
    onReset: resetFilters,
  };

  const resultLabel =
    filteredPackages.length === 1
      ? "package"
      : "packages";

  /* ========================================================
     RENDER
     ======================================================== */

  return (
    <>
      {/* ====================================================
          SEO
          ==================================================== */}

      <Seo
        title={context.seoTitle}
        description={context.seoDescription}
        canonical={`${SITE_URL}/packages`}
      />

      <main className="min-h-screen bg-[#fffaf9]">
        {/* ==================================================
            HERO
            ================================================== */}

        <section className="relative overflow-hidden border-b border-rose-100 bg-gradient-to-br from-[#fff9f7] via-[#fdf1f3] to-[#f8e8ec]">
          {/* Decorative glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#b56f7f]/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-[#d9a8b3]/15 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <div className="max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-rose-200 bg-white/65 px-3.5 py-1.5 backdrop-blur-sm">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f5666] sm:text-xs">
                  Explore with {BRAND_NAME}
                </span>
              </div>

              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-[#3c2930] sm:text-5xl lg:text-[3.5rem]">
                {context.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#765f66] sm:text-base">
                {context.description}
              </p>

              <div className="mt-6 h-px w-20 bg-[#b56f7f]/40" />
            </div>
          </div>
        </section>

        {/* ==================================================
            CONTENT
            ================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-11">
          {/* ==================================================
              TOP FILTERS: REGION + TYPE
              ================================================== */}

          <TopFilters
            region={region}
            onRegion={handleRegionChange}
            regionCounts={regionCounts}
            packageType={packageType}
            onType={handleTypeChange}
            typeOptions={typeOptions}
          />

          {/* ==================================================
              COLLECTION TABS
              ================================================== */}

          <div className="mb-8 sm:mb-10">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a06473]">
                Discover your next escape
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold text-[#3c2930]">
                Explore our packages
              </h2>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {PACKAGE_COLLECTIONS.map(
                (item) => {
                  const active =
                    collection ===
                    item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        handleCollectionChange(
                          item.value
                        )
                      }
                      aria-pressed={active}
                      className={`inline-flex shrink-0 items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        active
                          ? "border-[#8f5666] bg-[#8f5666] text-white shadow-[0_5px_18px_rgba(143,86,102,0.20)]"
                          : "border-rose-100 bg-white text-[#765f66] shadow-sm hover:border-[#c995a3] hover:bg-[#fff8f8] hover:text-[#8f5666]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* ==================================================
              ACTIVE URL CONTEXT
              ================================================== */}

          {destination !== "all" && (
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8cbd1] bg-[#fff4f5] px-3 py-1.5 text-xs font-semibold text-[#8f5666]">
                <MapPin
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />

                {destination}
              </span>
            </div>
          )}

          {/* ==================================================
              MOBILE FILTER BUTTON
              ================================================== */}

          <div className="mb-6 lg:hidden">
            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(
                  true
                )
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-3.5 font-semibold text-[#5d414a] shadow-sm transition-all hover:border-[#b56f7f] hover:bg-[#fff7f8]"
            >
              <SlidersHorizontal
                className="h-4 w-4"
                aria-hidden="true"
              />

              Filters

              {hasActiveFilters && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8f5666] px-1.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* ==================================================
              MAIN GRID
              ================================================== */}

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
            {/* ==================================================
                DESKTOP SIDEBAR
                ================================================== */}

            <aside className="sticky top-[calc(var(--top-info-height,0px)+6rem)] hidden lg:block">
              <div className="rounded-[1.5rem] border border-rose-100 bg-[#fffafa] p-5 shadow-[0_8px_30px_rgba(122,76,86,0.06)]">
                <div className="mb-5 flex items-center gap-2">
                  <Filter
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />

                  <h2 className="font-semibold text-[#4a323a]">
                    Filter Packages
                  </h2>
                </div>

                <Filters
                  idPrefix="desktop"
                  {...filterProps}
                />
              </div>
            </aside>

            {/* ==================================================
                RESULTS
                ================================================== */}

            <div className="min-w-0">
              {/* RESULT HEADER */}

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {!loading &&
                    !error && (
                      <>
                        <p className="text-sm text-[#765f66]">
                          Showing{" "}
                          <span className="font-semibold text-[#4a323a]">
                            {
                              filteredPackages.length
                            }
                          </span>{" "}
                          {resultLabel}
                        </p>

                        {collection !==
                          "all" && (
                          <p className="mt-1 text-xs text-[#9a7b83]">
                            Collection:{" "}
                            <span className="font-semibold text-[#765f66]">
                              {
                                context.collectionLabel
                              }
                            </span>
                          </p>
                        )}
                      </>
                    )}
                </div>

                <div className="w-full sm:w-56">
                  <FilterSelect
                    id="sort-packages"
                    ariaLabel="Sort packages"
                    value={sortBy}
                    onChange={setSortBy}
                    options={SORT_OPTIONS}
                  />
                </div>
              </div>

              {/* ==================================================
                  LOADING
                  ================================================== */}

              {loading && (
                <div
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6"
                  role="status"
                  aria-label="Loading packages"
                >
                  {[1, 2, 3, 4, 5, 6].map(
                    (key) => (
                      <PackageSkeleton
                        key={key}
                      />
                    )
                  )}
                </div>
              )}

              {/* ==================================================
                  ERROR
                  ================================================== */}

              {!loading &&
                error &&
                packages.length === 0 && (
                  <div
                    role="alert"
                    className="rounded-[1.5rem] border border-[#e8cbd1] bg-[#fff2f4] p-6 text-center sm:p-8"
                  >
                    <p className="font-semibold text-[#4a323a]">
                      Couldn't load
                      packages
                    </p>

                    <p className="mt-2 text-sm text-[#a35c6d]">
                      {error?.response?.data
                        ?.detail ||
                        error?.message ||
                        "Unable to load packages right now."}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        window.location.reload()
                      }
                      className={`${PRIMARY_BUTTON} mt-5`}
                    >
                      Try Again

                      <ArrowRight
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )}

              {/* ==================================================
                  EMPTY
                  ================================================== */}

              {!loading &&
                !error &&
                filteredPackages.length ===
                  0 && (
                  <div className="rounded-[1.5rem] border border-rose-100 bg-gradient-to-br from-[#fffafa] to-[#fdf0f3] p-8 text-center shadow-[0_8px_30px_rgba(122,76,86,0.05)] sm:p-12">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-200 bg-white">
                      <Search
                        className="h-6 w-6 text-primary"
                        aria-hidden="true"
                      />
                    </div>

                    <h2 className="mt-4 font-display text-3xl font-semibold text-[#3c2930]">
                      No packages found
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm text-[#765f66]">
                      {
                        context.emptyMessage
                      }
                    </p>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={
                          resetFilters
                        }
                        className={`${PRIMARY_BUTTON} mt-5`}
                      >
                        Clear Filters

                        <X
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </div>
                )}

              {/* ==================================================
                  PACKAGES + LOAD MORE
                  ================================================== */}

              {!loading &&
                filteredPackages.length >
                  0 && (
                  <>
                    <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                      {visible.map(
                        (pkg) => (
                          <PackageCard
                            key={
                              pkg?.id ??
                              pkg?.slug
                            }
                            pkg={pkg}
                          />
                        )
                      )}
                    </RevealGroup>

                    <LoadMoreButton
                      shown={visible.length}
                      total={
                        filteredPackages.length
                      }
                      remaining={remaining}
                      pageSize={PAGE_SIZE}
                      onClick={loadMore}
                    />
                  </>
                )}
            </div>
          </div>
        </section>
      </main>

      {/* ======================================================
          MOBILE FILTER DRAWER
          ====================================================== */}

      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-[90] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filter packages"
        >
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
            className="absolute inset-0 bg-[#3c2930]/40 backdrop-blur-[2px]"
          />

          {/* DRAWER */}

          <div className="absolute right-0 top-0 flex h-full w-[min(90vw,380px)] flex-col bg-[#fffafa] shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between gap-4 border-b border-rose-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Filter
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />

                <h2 className="font-semibold text-[#4a323a]">
                  Filter Packages
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f9e8ec] transition-colors hover:bg-[#f3dce2]"
                aria-label="Close filters"
              >
                <X
                  className="h-5 w-5 text-[#4a323a]"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* FILTER CONTENT */}

            <div className="flex-1 overflow-y-auto p-5">
              <Filters
                idPrefix="mobile"
                {...filterProps}
              />
            </div>

            {/* FOOTER */}

            <div className="border-t border-rose-100 bg-white/80 p-5">
              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    false
                  )
                }
                className="w-full rounded-xl bg-[#8f5666] px-5 py-3.5 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#7c4858] hover:shadow-md"
              >
                Show{" "}
                {filteredPackages.length}{" "}
                {filteredPackages.length ===
                1
                  ? "Package"
                  : "Packages"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          FAQ
          ====================================================== */}

      <FAQSection category="packages" />

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <Footer />
    </>
  );
}























































// import { useEffect, useMemo, useState } from "react";
// import { Link, useSearchParams } from "react-router-dom";
// import {
//   ArrowRight,
//   ChevronDown,
//   Clock,
//   Filter,
//   ImageOff,
//   MapPin,
//   Search,
//   SlidersHorizontal,
//   X,
// } from "lucide-react";

// import { getPackages } from "../api/content";
// import { useQuery } from "../hooks/useQuery";
// import Footer from "../components/Footer";
// import Seo from "../components/Seo";
// import FAQSection from "../components/FAQSection";
// import { RevealGroup } from "../components/Reveal";

// /* ==========================================================
//    BRAND
//    ========================================================== */

// const BRAND_NAME = "Manyara Prive Vacations";

// const SITE_URL = (
//   import.meta.env.VITE_SITE_URL || window.location.origin
// ).replace(/\/$/, "");

// /* ==========================================================
//    CONSTANTS
//    ========================================================== */

// const PACKAGE_TYPE_LABELS = {
//   pilgrimage: "Pilgrimage",
//   mountains_adventure: "Mountains & Adventure",
//   romantic: "Romantic",
//   international: "International",
//   beach: "Beach",
//   family: "Family",
//   wildlife_nature: "Wildlife & Nature",
// };

// const REGION_OPTIONS = [
//   { value: "all", label: "All" },
//   { value: "domestic", label: "Domestic" },
//   { value: "international", label: "International" },
// ];

// const PACKAGE_COLLECTIONS = [
//   {
//     value: "all",
//     label: "All Packages",
//     description: `Explore all available holiday packages from ${BRAND_NAME}.`,
//   },
//   {
//     value: "new",
//     label: "New",
//     description:
//       "Discover our newest holiday packages and recently added travel experiences.",
//   },
//   {
//     value: "most-visited",
//     label: "Most Visited",
//     description:
//       "Explore holiday packages for destinations loved and visited by travellers.",
//   },
//   {
//     value: "featured",
//     label: "Featured",
//     description: `Explore handpicked featured holiday packages from ${BRAND_NAME}.`,
//   },
//   {
//     value: "recommended",
//     label: "Recommended",
//     description:
//       "Discover holiday packages recommended for memorable travel experiences.",
//   },
//   {
//     value: "trending",
//     label: "Trending",
//     description:
//       "Explore trending holiday packages and popular travel experiences.",
//   },
//   {
//     value: "popular",
//     label: "Popular",
//     description: `Discover popular holiday packages selected by ${BRAND_NAME}.`,
//   },
// ];

// const COLLECTION_FLAG_MAP = {
//   new: "is_new",
//   "most-visited": "is_most_visited",
//   featured: "is_featured",
//   recommended: "is_recommended",
//   trending: "is_trending",
//   popular: "is_popular",
// };

// const PRICE_OPTIONS = [
//   {
//     value: "all",
//     label: "Any price",
//   },
//   {
//     value: "under-25000",
//     label: "Under ₹25,000",
//   },
//   {
//     value: "25000-50000",
//     label: "₹25,000 – ₹50,000",
//   },
//   {
//     value: "50000-100000",
//     label: "₹50,000 – ₹1,00,000",
//   },
//   {
//     value: "100000-plus",
//     label: "Above ₹1,00,000",
//   },
// ];

// const PRICE_TESTS = {
//   "under-25000": (price) => price < 25000,
//   "25000-50000": (price) => price >= 25000 && price <= 50000,
//   "50000-100000": (price) => price >= 50000 && price <= 100000,
//   "100000-plus": (price) => price > 100000,
// };

// const DURATION_OPTIONS = [
//   {
//     value: "all",
//     label: "Any duration",
//   },
//   {
//     value: "1-3",
//     label: "1 – 3 days",
//   },
//   {
//     value: "4-7",
//     label: "4 – 7 days",
//   },
//   {
//     value: "8-14",
//     label: "8 – 14 days",
//   },
//   {
//     value: "15-plus",
//     label: "15+ days",
//   },
// ];

// const DURATION_TESTS = {
//   "1-3": (days) => days >= 1 && days <= 3,
//   "4-7": (days) => days >= 4 && days <= 7,
//   "8-14": (days) => days >= 8 && days <= 14,
//   "15-plus": (days) => days >= 15,
// };

// const SORT_OPTIONS = [
//   {
//     value: "recommended",
//     label: "Recommended",
//   },
//   {
//     value: "price-low",
//     label: "Price: Low to High",
//   },
//   {
//     value: "price-high",
//     label: "Price: High to Low",
//   },
//   {
//     value: "duration-short",
//     label: "Duration: Shortest",
//   },
//   {
//     value: "duration-long",
//     label: "Duration: Longest",
//   },
//   {
//     value: "newest",
//     label: "Newest",
//   },
// ];

// /* ==========================================================
//    THEME
//    ========================================================== */

// const INPUT =
//   "w-full rounded-xl border border-rose-200/80 bg-white/80 px-4 py-3 text-sm text-text-dark outline-none transition-all placeholder:text-muted focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20";

// const PRIMARY_BUTTON =
//   "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md";

// /* ==========================================================
//    NORMALIZERS
//    ========================================================== */

// const TYPE_ALIASES = {
//   mountains_and_adventure: "mountains_adventure",
//   mountain_adventure: "mountains_adventure",
//   mountains: "mountains_adventure",
//   adventure: "mountains_adventure",
//   wildlife_and_nature: "wildlife_nature",
//   wildlife: "wildlife_nature",
//   nature: "wildlife_nature",
// };

// const normalizePackageType = (value) => {
//   const normalized = String(value || "")
//     .trim()
//     .toLowerCase()
//     .replace(/&/g, "and")
//     .replace(/[\s-]+/g, "_");

//   return TYPE_ALIASES[normalized] || normalized;
// };

// const normalizeRegion = (value) => {
//   const region = String(value || "")
//     .trim()
//     .toLowerCase();

//   return region === "domestic" || region === "international"
//     ? region
//     : "all";
// };

// /*
//  * Uses the backend `region` field. Until every API response
//  * includes it, falls back to the old package_type rule so the
//  * page keeps working during the rollout.
//  */
// const getPackageRegion = (pkg) => {
//   const region = String(pkg?.region || "")
//     .trim()
//     .toLowerCase();

//   if (region === "domestic" || region === "international") {
//     return region;
//   }

//   return normalizePackageType(pkg?.package_type || pkg?.type) ===
//     "international"
//     ? "international"
//     : "domestic";
// };

// const normalizeDestination = (value) =>
//   String(value || "")
//     .trim()
//     .toLowerCase()
//     .replace(/\s+/g, " ");

// const COLLECTION_ALIASES = {
//   newest: "new",
//   recommendation: "recommended",
//   mostvisited: "most-visited",
//   "most-visited-packages": "most-visited",
// };

// const normalizeCollection = (value) => {
//   const normalized = String(value || "")
//     .trim()
//     .toLowerCase()
//     .replace(/[\s_]+/g, "-");

//   const collection = COLLECTION_ALIASES[normalized] || normalized;

//   return PACKAGE_COLLECTIONS.some(
//     (item) => item.value === collection
//   )
//     ? collection
//     : "all";
// };

// /* ==========================================================
//    HELPERS
//    ========================================================== */

// const toNumber = (value, fallback = 0) => {
//   const number = Number(value);

//   return Number.isFinite(number) ? number : fallback;
// };

// function getSafeArray(value) {
//   if (Array.isArray(value)) return value;
//   if (Array.isArray(value?.items)) return value.items;
//   if (Array.isArray(value?.data)) return value.data;

//   return [];
// }

// const isPublished = (pkg) =>
//   pkg?.status === undefined ||
//   pkg?.status === "published" ||
//   pkg?.is_published === true;

// const getImageUrl = (image) =>
//   typeof image === "string" ? image : image?.url || "";

// const getPackageImage = (pkg) => {
//   if (Array.isArray(pkg?.images)) {
//     const first = pkg.images
//       .map(getImageUrl)
//       .find(Boolean);

//     if (first) return first;
//   }

//   return (
//     getImageUrl(pkg?.image) ||
//     pkg?.image_url ||
//     ""
//   );
// };

// const getPackageTypeLabel = (type) => {
//   const normalized = normalizePackageType(type);

//   return (
//     PACKAGE_TYPE_LABELS[normalized] ||
//     String(type || "")
//       .replace(/[_-]+/g, " ")
//       .replace(/\b\w/g, (char) => char.toUpperCase()) ||
//     "Holiday"
//   );
// };

// const formatPrice = (price) => {
//   const number = Number(price);

//   if (
//     price === null ||
//     price === undefined ||
//     price === ""
//   ) {
//     return "Price on request";
//   }

//   return Number.isFinite(number)
//     ? `₹${number.toLocaleString("en-IN")}`
//     : "Price on request";
// };

// const formatDuration = (days, nights) => {
//   if (
//     !days ||
//     nights === undefined ||
//     nights === null
//   ) {
//     return "Flexible";
//   }

//   return `${days} ${
//     Number(days) === 1 ? "day" : "days"
//   } / ${nights} ${
//     Number(nights) === 1 ? "night" : "nights"
//   }`;
// };

// /* ==========================================================
//    FILTER + SORT
//    ========================================================== */

// function matchesFilters(pkg, f) {
//   const packageType = normalizePackageType(
//     pkg?.package_type || pkg?.type
//   );

//   if (f.searchTerm) {
//     const searchable = [
//       pkg?.title,
//       pkg?.destination,
//       pkg?.slug,
//       pkg?.description,
//       PACKAGE_TYPE_LABELS[packageType],
//     ];

//     const found = searchable.some((value) =>
//       String(value || "")
//         .toLowerCase()
//         .includes(f.searchTerm)
//     );

//     if (!found) return false;
//   }

//   if (f.region && getPackageRegion(pkg) !== f.region) {
//     return false;
//   }

//   if (
//     f.packageType &&
//     packageType !== f.packageType
//   ) {
//     return false;
//   }

//   if (
//     f.destination &&
//     normalizeDestination(pkg?.destination) !==
//       f.destination
//   ) {
//     return false;
//   }

//   if (
//     f.collectionFlag &&
//     pkg?.[f.collectionFlag] !== true
//   ) {
//     return false;
//   }

//   if (f.priceRange !== "all") {
//     const price = Number(pkg?.price);

//     if (
//       !Number.isFinite(price) ||
//       !PRICE_TESTS[f.priceRange](price)
//     ) {
//       return false;
//     }
//   }

//   if (f.durationRange !== "all") {
//     const days = Number(pkg?.duration_days);

//     if (
//       !Number.isFinite(days) ||
//       !DURATION_TESTS[f.durationRange](days)
//     ) {
//       return false;
//     }
//   }

//   return true;
// }

// const SORTERS = {
//   "price-low": (a, b) =>
//     toNumber(a?.price) - toNumber(b?.price),

//   "price-high": (a, b) =>
//     toNumber(b?.price) - toNumber(a?.price),

//   "duration-short": (a, b) =>
//     toNumber(a?.duration_days) -
//     toNumber(b?.duration_days),

//   "duration-long": (a, b) =>
//     toNumber(b?.duration_days) -
//     toNumber(a?.duration_days),

//   newest: (a, b) =>
//     toNumber(
//       new Date(b?.created_at || 0).getTime()
//     ) -
//     toNumber(
//       new Date(a?.created_at || 0).getTime()
//     ),

//   recommended: (a, b) => {
//     const order =
//       toNumber(
//         a?.display_order,
//         Number.MAX_SAFE_INTEGER
//       ) -
//       toNumber(
//         b?.display_order,
//         Number.MAX_SAFE_INTEGER
//       );

//     if (order) return order;

//     if (
//       Boolean(a?.is_recommended) !==
//       Boolean(b?.is_recommended)
//     ) {
//       return a?.is_recommended ? -1 : 1;
//     }

//     if (
//       Boolean(a?.is_featured) !==
//       Boolean(b?.is_featured)
//     ) {
//       return a?.is_featured ? -1 : 1;
//     }

//     return (
//       toNumber(a?.id) - toNumber(b?.id)
//     );
//   },
// };

// /* ==========================================================
//    PAGE TEXT + SEO
//    ========================================================== */

// function getPageContext({
//   destination,
//   packageType,
//   collection,
//   region,
// }) {
//   const collectionItem =
//     PACKAGE_COLLECTIONS.find(
//       (item) => item.value === collection
//     ) || PACKAGE_COLLECTIONS[0];

//   const typeLabel = packageType
//     ? getPackageTypeLabel(packageType)
//     : "";

//   const typeLower = typeLabel.toLowerCase();

//   const collectionLower =
//     collectionItem.label.toLowerCase();

//   const regionLabel =
//     region === "domestic"
//       ? "Domestic"
//       : region === "international"
//         ? "International"
//         : "";

//   const regionPrefix = regionLabel
//     ? `${regionLabel} `
//     : "";

//   const regionPrefixLower = regionPrefix.toLowerCase();

//   if (destination !== "all") {
//     return {
//       title: `${destination} Packages`,
//       description: `Explore all available holiday packages for ${destination} from ${BRAND_NAME}. Compare destinations, durations and prices.`,
//       seoTitle: `${destination} Holiday Packages | ${BRAND_NAME}`,
//       seoDescription: `Explore ${destination} holiday packages from ${BRAND_NAME}. Discover available travel experiences, durations and prices.`,
//       emptyMessage: `There are currently no packages available for ${destination} matching your selected filters.`,
//       typeLabel,
//       collectionLabel: collectionItem.label,
//     };
//   }

//   if (packageType) {
//     return {
//       title: `${regionPrefix}${typeLabel} Packages`,
//       description: `Explore ${regionPrefixLower}${typeLower} holiday packages from ${BRAND_NAME}. Discover curated destinations, experiences, durations and prices.`,
//       seoTitle: `${regionPrefix}${typeLabel} Holiday Packages | ${BRAND_NAME}`,
//       seoDescription: `Explore ${regionPrefixLower}${typeLower} holiday packages from ${BRAND_NAME}. Discover curated destinations, travel experiences, durations and prices.`,
//       emptyMessage: `There are currently no ${regionPrefixLower}${typeLower} packages matching your selected filters.`,
//       typeLabel,
//       collectionLabel: collectionItem.label,
//     };
//   }

//   if (regionLabel) {
//     return {
//       title: `${regionLabel} Holiday Packages`,
//       description: `Explore ${regionLabel.toLowerCase()} holiday packages from ${BRAND_NAME}. Discover curated destinations, experiences, durations and prices.`,
//       seoTitle: `${regionLabel} Holiday Packages | ${BRAND_NAME}`,
//       seoDescription: `Explore ${regionLabel.toLowerCase()} holiday packages from ${BRAND_NAME}. Discover curated travel experiences, durations and prices.`,
//       emptyMessage: `There are currently no ${regionLabel.toLowerCase()} packages matching your selected filters.`,
//       typeLabel,
//       collectionLabel: collectionItem.label,
//     };
//   }

//   if (collection !== "all") {
//     return {
//       title: `${collectionItem.label} Holiday Packages`,
//       description: collectionItem.description,
//       seoTitle: `${collectionItem.label} Holiday Packages | ${BRAND_NAME}`,
//       seoDescription: `Explore ${collectionLower} holiday packages from ${BRAND_NAME}. Discover curated destinations, travel experiences, durations and prices.`,
//       emptyMessage: `There are currently no ${collectionLower} packages matching your selected filters.`,
//       typeLabel,
//       collectionLabel: collectionItem.label,
//     };
//   }

//   return {
//     title: "Find the right holiday package for your journey",
//     description:
//       "Explore holiday packages by destination, package type, price and duration.",
//     seoTitle: `Holiday Packages | ${BRAND_NAME}`,
//     seoDescription: `Explore holiday packages from ${BRAND_NAME}. Discover curated travel experiences, destinations, durations and prices.`,
//     emptyMessage:
//       "Try changing your search or filters to find available packages.",
//     typeLabel,
//     collectionLabel: collectionItem.label,
//   };
// }

// /* ==========================================================
//    PACKAGE CARD
//    ========================================================== */

// function PackageCard({ pkg }) {
//   const imageUrl = getPackageImage(pkg);

//   const href = `/packages/${encodeURIComponent(
//     pkg?.slug || pkg?.id
//   )}`;

//   const typeLabel = getPackageTypeLabel(
//     pkg?.package_type || pkg?.type
//   );

//   return (
//     <article className="group overflow-hidden rounded-[1.5rem] border border-rose-100 bg-white shadow-[0_8px_30px_rgba(122,76,86,0.07)] transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-200 hover:shadow-[0_18px_45px_rgba(122,76,86,0.12)]">
//       <Link to={href} className="block">
//         {/* IMAGE */}
//         <div className="relative aspect-[16/10] overflow-hidden bg-rose-50">
//           {imageUrl ? (
//             <img
//               src={imageUrl}
//               alt={
//                 pkg?.title ||
//                 "Holiday package"
//               }
//               className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
//               loading="lazy"
//             />
//           ) : (
//             <div className="flex h-full w-full items-center justify-center bg-rose-50">
//               <ImageOff
//                 className="h-8 w-8 text-rose-300"
//                 aria-hidden="true"
//               />
//             </div>
//           )}

//           {/* Image bottom overlay */}
//           <div
//             aria-hidden="true"
//             className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#3c1f29]/25 to-transparent"
//           />

//           {/* Package type */}
//           <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-[#fffaf8]/95 px-3 py-1.5 text-xs font-semibold text-[#633b46] shadow-sm backdrop-blur-md">
//             {typeLabel}
//           </span>

//           {/* Badges */}
//           <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2">
//             {pkg?.is_new && (
//               <span className="rounded-full bg-[#9f5f70] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
//                 New
//               </span>
//             )}

//             {pkg?.is_featured && (
//               <span className="rounded-full bg-[#704552] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
//                 Featured
//               </span>
//             )}
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div className="p-5">
//           <div className="flex items-center gap-1.5 text-xs font-medium text-[#8b6872]">
//             <MapPin
//               className="h-3.5 w-3.5 text-primary"
//               aria-hidden="true"
//             />

//             <span>
//               {pkg?.destination || "India"}
//             </span>
//           </div>

//           <h2 className="mt-2 line-clamp-2 font-display text-2xl font-semibold leading-snug text-[#3c2930] transition-colors group-hover:text-primary">
//             {pkg?.title || "Holiday Package"}
//           </h2>

//           {pkg?.description && (
//             <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#765f66]">
//               {pkg.description}
//             </p>
//           )}

//           <div className="mt-5 flex items-end justify-between gap-4 border-t border-rose-100 pt-4">
//             <div>
//               <p className="text-xs text-[#9a7b83]">
//                 Package Cost
//               </p>

//               <p className="mt-0.5 text-lg font-bold text-primary">
//                 {formatPrice(pkg?.price)}
//               </p>
//             </div>

//             <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#765f66]">
//               <Clock
//                 className="h-4 w-4 text-primary"
//                 aria-hidden="true"
//               />

//               <span>
//                 {formatDuration(
//                   pkg?.duration_days,
//                   pkg?.duration_nights
//                 )}
//               </span>
//             </div>
//           </div>

//           <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
//             View Package

//             <ArrowRight
//               className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
//               aria-hidden="true"
//             />
//           </div>
//         </div>
//       </Link>
//     </article>
//   );
// }

// /* ==========================================================
//    PACKAGE SKELETON
//    ========================================================== */

// function PackageSkeleton() {
//   return (
//     <div
//       className="overflow-hidden rounded-[1.5rem] border border-rose-100 bg-white"
//       aria-hidden="true"
//     >
//       <div className="aspect-[16/10] animate-pulse bg-rose-100/70" />

//       <div className="space-y-4 p-5">
//         <div className="h-3 w-24 animate-pulse rounded bg-rose-100" />

//         <div className="h-6 w-4/5 animate-pulse rounded bg-rose-100" />

//         <div className="h-4 w-full animate-pulse rounded bg-rose-100" />

//         <div className="h-4 w-2/3 animate-pulse rounded bg-rose-100" />

//         <div className="flex justify-between border-t border-rose-100 pt-4">
//           <div className="h-6 w-28 animate-pulse rounded bg-rose-100" />

//           <div className="h-5 w-20 animate-pulse rounded bg-rose-100" />
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ==========================================================
//    FILTER SELECT
//    ========================================================== */

// function FilterSelect({
//   id,
//   label,
//   ariaLabel,
//   value,
//   onChange,
//   options,
// }) {
//   return (
//     <div>
//       {label && (
//         <label
//           htmlFor={id}
//           className="mb-2 block text-xs font-semibold text-[#765f66]"
//         >
//           {label}
//         </label>
//       )}

//       <div className="relative">
//         <select
//           id={id}
//           aria-label={
//             label ? undefined : ariaLabel
//           }
//           value={value}
//           onChange={(event) =>
//             onChange(event.target.value)
//           }
//           className={`${INPUT} appearance-none pr-10`}
//         >
//           {options.map((option) => (
//             <option
//               key={option.value}
//               value={option.value}
//             >
//               {option.label}
//             </option>
//           ))}
//         </select>

//         <ChevronDown
//           className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
//           aria-hidden="true"
//         />
//       </div>
//     </div>
//   );
// }

// /* ==========================================================
//    TOP FILTERS
//    Region switch + package-type chips for the selected region
//    ========================================================== */

// function TopFilters({
//   region,
//   onRegion,
//   regionCounts,
//   packageType,
//   onType,
//   typeOptions,
// }) {
//   const chip = (active) =>
//     `inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
//       active
//         ? "border-[#8f5666] bg-[#8f5666] text-white shadow-[0_5px_18px_rgba(143,86,102,0.20)]"
//         : "border-rose-100 bg-white text-[#765f66] shadow-sm hover:border-[#c995a3] hover:bg-[#fff8f8] hover:text-[#8f5666]"
//     }`;

//   const count = (active, value) => (
//     <span
//       className={`rounded-full px-2 py-0.5 text-xs ${
//         active
//           ? "bg-white/20"
//           : "bg-rose-50 text-[#8f5666]"
//       }`}
//     >
//       {value}
//     </span>
//   );

//   const regionName =
//     REGION_OPTIONS.find(
//       (item) => item.value === region
//     )?.label || "All";

//   return (
//     <div className="mb-8 space-y-5 sm:mb-10">
//       {/* REGION */}
//       <div>
//         <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a06473]">
//           Where to?
//         </p>

//         <div
//           role="group"
//           aria-label="Filter by region"
//           className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
//         >
//           {REGION_OPTIONS.map((item) => {
//             const active = region === item.value;

//             return (
//               <button
//                 key={item.value}
//                 type="button"
//                 onClick={() => onRegion(item.value)}
//                 aria-pressed={active}
//                 className={chip(active)}
//               >
//                 {item.label}
//                 {count(
//                   active,
//                   regionCounts[item.value] ?? 0
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* TYPES for the selected region */}
//       {typeOptions.length > 0 && (
//         <div>
//           <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a06473]">
//             {region === "all"
//               ? "Package type"
//               : `${regionName} package types`}
//           </p>

//           <div
//             role="group"
//             aria-label="Filter by package type"
//             className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
//           >
//             <button
//               type="button"
//               onClick={() => onType("")}
//               aria-pressed={!packageType}
//               className={chip(!packageType)}
//             >
//               All types
//             </button>

//             {typeOptions.map((item) => {
//               const active =
//                 packageType === item.value;

//               return (
//                 <button
//                   key={item.value}
//                   type="button"
//                   onClick={() =>
//                     onType(active ? "" : item.value)
//                   }
//                   aria-pressed={active}
//                   className={chip(active)}
//                 >
//                   {item.label}
//                   {count(active, item.count)}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ==========================================================
//    FILTERS (sidebar / mobile drawer)
//    ========================================================== */

// function Filters({
//   idPrefix,
//   search,
//   onSearch,
//   destination,
//   onDestination,
//   destinationOptions,
//   priceRange,
//   onPrice,
//   durationRange,
//   onDuration,
//   showReset,
//   onReset,
// }) {
//   return (
//     <div className="space-y-5">
//       {/* SEARCH */}
//       <div>
//         <label
//           htmlFor={`${idPrefix}-search`}
//           className="mb-2 block text-xs font-semibold text-[#765f66]"
//         >
//           Search
//         </label>

//         <div className="relative">
//           <Search
//             className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a47b85]"
//             aria-hidden="true"
//           />

//           <input
//             id={`${idPrefix}-search`}
//             type="search"
//             value={search}
//             onChange={(event) =>
//               onSearch(event.target.value)
//             }
//             placeholder="Search packages..."
//             className={`${INPUT} px-10`}
//           />
//         </div>
//       </div>

//       {/* DESTINATION */}
//       <FilterSelect
//         id={`${idPrefix}-destination`}
//         label="Destination"
//         value={destination}
//         onChange={onDestination}
//         options={destinationOptions}
//       />

//       {/* PRICE */}
//       <FilterSelect
//         id={`${idPrefix}-price`}
//         label="Price"
//         value={priceRange}
//         onChange={onPrice}
//         options={PRICE_OPTIONS}
//       />

//       {/* DURATION */}
//       <FilterSelect
//         id={`${idPrefix}-duration`}
//         label="Duration"
//         value={durationRange}
//         onChange={onDuration}
//         options={DURATION_OPTIONS}
//       />

//       {/* RESET */}
//       {showReset && (
//         <button
//           type="button"
//           onClick={onReset}
//           className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-[#633b46] transition-all hover:border-primary hover:bg-[#fff5f6] hover:text-primary"
//         >
//           <X
//             className="h-4 w-4"
//             aria-hidden="true"
//           />

//           Clear Filters
//         </button>
//       )}
//     </div>
//   );
// }

// /* ==========================================================
//    PAGE
//    ========================================================== */

// export default function PackagesPage() {
//   const [searchParams, setSearchParams] =
//     useSearchParams();

//   /*
//    * URL is the single source of truth for
//    * collection, region, type and destination.
//    */

//   const collection = normalizeCollection(
//     searchParams.get("collection")
//   );

//   const rawRegion = normalizeRegion(
//     searchParams.get("region")
//   );

//   const rawType = normalizePackageType(
//     searchParams.get("type")
//   );

//   /*
//    * Old links like /packages?type=international now map to
//    * the International region instead of a package type.
//    */
//   const legacyInternational =
//     rawType === "international";

//   const region =
//     legacyInternational && rawRegion === "all"
//       ? "international"
//       : rawRegion;

//   const packageType = legacyInternational
//     ? ""
//     : rawType;

//   const urlDestination = (
//     searchParams.get("destination") || ""
//   ).trim();

//   /*
//    * Cached data:
//    * instant on repeat visits,
//    * updates itself when fresh.
//    */

//   const {
//     data,
//     loading,
//     error,
//   } = useQuery(getPackages);

//   const packages = useMemo(
//     () =>
//       getSafeArray(data).filter(isPublished),
//     [data]
//   );

//   const [search, setSearch] = useState("");

//   const [priceRange, setPriceRange] =
//     useState("all");

//   const [durationRange, setDurationRange] =
//     useState("all");

//   const [sortBy, setSortBy] =
//     useState("recommended");

//   const [
//     mobileFiltersOpen,
//     setMobileFiltersOpen,
//   ] = useState(false);

//   /* ========================================================
//      REGION + TYPE OPTIONS
//      ======================================================== */

//   const regionPackages = useMemo(
//     () =>
//       region === "all"
//         ? packages
//         : packages.filter(
//             (pkg) =>
//               getPackageRegion(pkg) === region
//           ),
//     [packages, region]
//   );

//   const regionCounts = useMemo(() => {
//     const counts = {
//       all: packages.length,
//       domestic: 0,
//       international: 0,
//     };

//     packages.forEach((pkg) => {
//       counts[getPackageRegion(pkg)] += 1;
//     });

//     return counts;
//   }, [packages]);

//   const typeOptions = useMemo(() => {
//     const counts = new Map();

//     regionPackages.forEach((pkg) => {
//       const type = normalizePackageType(
//         pkg?.package_type || pkg?.type
//       );

//       // "international" is covered by the region switch
//       if (!type || type === "international") {
//         return;
//       }

//       counts.set(type, (counts.get(type) || 0) + 1);
//     });

//     return [...counts.entries()]
//       .map(([value, count]) => ({
//         value,
//         count,
//         label: getPackageTypeLabel(value),
//       }))
//       .sort((a, b) =>
//         a.label.localeCompare(b.label)
//       );
//   }, [regionPackages]);

//   /* ========================================================
//      DESTINATION OPTIONS
//      ======================================================== */

//   const destinationOptions = useMemo(() => {
//     const unique = new Map();

//     regionPackages.forEach((pkg) => {
//       const name = String(
//         pkg?.destination || ""
//       ).trim();

//       const key = normalizeDestination(name);

//       if (name && !unique.has(key)) {
//         unique.set(key, name);
//       }
//     });

//     return [
//       {
//         value: "all",
//         label: "All destinations",
//       },

//       ...[...unique.values()]
//         .sort((a, b) =>
//           a.localeCompare(b)
//         )
//         .map((name) => ({
//           value: name,
//           label: name,
//         })),
//     ];
//   }, [regionPackages]);

//   /* ========================================================
//      DESTINATION FROM URL
//      ======================================================== */

//   const destination = useMemo(() => {
//     if (
//       !urlDestination ||
//       urlDestination.toLowerCase() === "all"
//     ) {
//       return "all";
//     }

//     const match = destinationOptions.find(
//       (option) =>
//         option.value !== "all" &&
//         normalizeDestination(option.value) ===
//           normalizeDestination(urlDestination)
//     );

//     return match
//       ? match.value
//       : urlDestination;
//   }, [
//     urlDestination,
//     destinationOptions,
//   ]);

//   /* ========================================================
//      FILTERED PACKAGES
//      ======================================================== */

//   const filteredPackages = useMemo(() => {
//     const filters = {
//       searchTerm: search
//         .trim()
//         .toLowerCase(),

//       region: region === "all" ? "" : region,

//       packageType,

//       destination:
//         destination === "all"
//           ? ""
//           : normalizeDestination(
//               destination
//             ),

//       collectionFlag:
//         COLLECTION_FLAG_MAP[collection] || "",

//       priceRange,

//       durationRange,
//     };

//     return packages
//       .filter((pkg) =>
//         matchesFilters(pkg, filters)
//       )
//       .sort(
//         SORTERS[sortBy] ||
//           SORTERS.recommended
//       );
//   }, [
//     packages,
//     search,
//     region,
//     packageType,
//     destination,
//     collection,
//     priceRange,
//     durationRange,
//     sortBy,
//   ]);

//   /* ========================================================
//      PAGE CONTEXT
//      ======================================================== */

//   const context = getPageContext({
//     destination,
//     packageType,
//     collection,
//     region,
//   });

//   const activeFilterCount = [
//     search.trim(),
//     region !== "all",
//     destination !== "all",
//     packageType,
//     priceRange !== "all",
//     durationRange !== "all",
//   ].filter(Boolean).length;

//   const hasActiveFilters =
//     activeFilterCount > 0;

//   /* ========================================================
//      URL UPDATES
//      ======================================================== */

//   const updateParams = (changes) => {
//     const params =
//       new URLSearchParams(searchParams);

//     Object.entries(changes).forEach(
//       ([key, value]) => {
//         if (
//           !value ||
//           value === "all"
//         ) {
//           params.delete(key);
//         } else {
//           params.set(key, value);
//         }
//       }
//     );

//     setSearchParams(params, {
//       replace: true,
//     });
//   };

//   const handleCollectionChange = (
//     value
//   ) =>
//     updateParams({
//       collection:
//         normalizeCollection(value),
//     });

//   const handleDestinationChange = (
//     value
//   ) =>
//     updateParams({
//       destination: value,
//     });

//   /*
//    * Changing region clears type and destination, because
//    * they may not exist in the other region.
//    */
//   const handleRegionChange = (value) =>
//     updateParams({
//       region: normalizeRegion(value),
//       type: "",
//       destination: "",
//     });

//   const handleTypeChange = (value) =>
//     updateParams({
//       type: value,
//     });

//   /* ========================================================
//      RESET FILTERS
//      ======================================================== */

//   const resetFilters = () => {
//     setSearch("");
//     setPriceRange("all");
//     setDurationRange("all");
//     setSortBy("recommended");

//     updateParams({
//       destination: "",
//       type: "",
//       region: "",
//     });
//   };

//   /* ========================================================
//      MOBILE FILTER DRAWER
//      ======================================================== */

//   useEffect(() => {
//     if (!mobileFiltersOpen) {
//       return undefined;
//     }

//     const onKeyDown = (event) => {
//       if (event.key === "Escape") {
//         setMobileFiltersOpen(false);
//       }
//     };

//     const previousOverflow =
//       document.body.style.overflow;

//     document.body.style.overflow =
//       "hidden";

//     document.addEventListener(
//       "keydown",
//       onKeyDown
//     );

//     return () => {
//       document.body.style.overflow =
//         previousOverflow;

//       document.removeEventListener(
//         "keydown",
//         onKeyDown
//       );
//     };
//   }, [mobileFiltersOpen]);

//   /* ========================================================
//      FILTER PROPS
//      ======================================================== */

//   const filterProps = {
//     search,
//     onSearch: setSearch,

//     destination,
//     onDestination:
//       handleDestinationChange,

//     destinationOptions,

//     priceRange,
//     onPrice: setPriceRange,

//     durationRange,
//     onDuration: setDurationRange,

//     showReset: hasActiveFilters,
//     onReset: resetFilters,
//   };

//   const resultLabel =
//     filteredPackages.length === 1
//       ? "package"
//       : "packages";

//   /* ========================================================
//      RENDER
//      ======================================================== */

//   return (
//     <>
//       {/* ====================================================
//           SEO
//           ==================================================== */}

//       <Seo
//         title={context.seoTitle}
//         description={context.seoDescription}
//         canonical={`${SITE_URL}/packages`}
//       />

//       <main className="min-h-screen bg-[#fffaf9]">
//         {/* ==================================================
//             HERO
//             ================================================== */}

//         <section className="relative overflow-hidden border-b border-rose-100 bg-gradient-to-br from-[#fff9f7] via-[#fdf1f3] to-[#f8e8ec]">
//           {/* Decorative glow */}
//           <div
//             aria-hidden="true"
//             className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#b56f7f]/10 blur-3xl"
//           />

//           <div
//             aria-hidden="true"
//             className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-[#d9a8b3]/15 blur-3xl"
//           />

//           <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
//             <div className="max-w-4xl">
//               <div className="inline-flex items-center rounded-full border border-rose-200 bg-white/65 px-3.5 py-1.5 backdrop-blur-sm">
//                 <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f5666] sm:text-xs">
//                   Explore with {BRAND_NAME}
//                 </span>
//               </div>

//               <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-[#3c2930] sm:text-5xl lg:text-[3.5rem]">
//                 {context.title}
//               </h1>

//               <p className="mt-4 max-w-2xl text-sm leading-7 text-[#765f66] sm:text-base">
//                 {context.description}
//               </p>

//               <div className="mt-6 h-px w-20 bg-[#b56f7f]/40" />
//             </div>
//           </div>
//         </section>

//         {/* ==================================================
//             CONTENT
//             ================================================== */}

//         <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-11">
//           {/* ==================================================
//               TOP FILTERS: REGION + TYPE
//               ================================================== */}

//           <TopFilters
//             region={region}
//             onRegion={handleRegionChange}
//             regionCounts={regionCounts}
//             packageType={packageType}
//             onType={handleTypeChange}
//             typeOptions={typeOptions}
//           />

//           {/* ==================================================
//               COLLECTION TABS
//               ================================================== */}

//           <div className="mb-8 sm:mb-10">
//             <div className="mb-4">
//               <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a06473]">
//                 Discover your next escape
//               </p>

//               <h2 className="mt-1 font-display text-xl font-semibold text-[#3c2930]">
//                 Explore our packages
//               </h2>
//             </div>

//             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
//               {PACKAGE_COLLECTIONS.map(
//                 (item) => {
//                   const active =
//                     collection ===
//                     item.value;

//                   return (
//                     <button
//                       key={item.value}
//                       type="button"
//                       onClick={() =>
//                         handleCollectionChange(
//                           item.value
//                         )
//                       }
//                       aria-pressed={active}
//                       className={`inline-flex shrink-0 items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
//                         active
//                           ? "border-[#8f5666] bg-[#8f5666] text-white shadow-[0_5px_18px_rgba(143,86,102,0.20)]"
//                           : "border-rose-100 bg-white text-[#765f66] shadow-sm hover:border-[#c995a3] hover:bg-[#fff8f8] hover:text-[#8f5666]"
//                       }`}
//                     >
//                       {item.label}
//                     </button>
//                   );
//                 }
//               )}
//             </div>
//           </div>

//           {/* ==================================================
//               ACTIVE URL CONTEXT
//               ================================================== */}

//           {destination !== "all" && (
//             <div className="mb-6 flex flex-wrap gap-2">
//               <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8cbd1] bg-[#fff4f5] px-3 py-1.5 text-xs font-semibold text-[#8f5666]">
//                 <MapPin
//                   className="h-3.5 w-3.5"
//                   aria-hidden="true"
//                 />

//                 {destination}
//               </span>
//             </div>
//           )}

//           {/* ==================================================
//               MOBILE FILTER BUTTON
//               ================================================== */}

//           <div className="mb-6 lg:hidden">
//             <button
//               type="button"
//               onClick={() =>
//                 setMobileFiltersOpen(
//                   true
//                 )
//               }
//               className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-3.5 font-semibold text-[#5d414a] shadow-sm transition-all hover:border-[#b56f7f] hover:bg-[#fff7f8]"
//             >
//               <SlidersHorizontal
//                 className="h-4 w-4"
//                 aria-hidden="true"
//               />

//               Filters

//               {hasActiveFilters && (
//                 <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8f5666] px-1.5 text-xs text-white">
//                   {activeFilterCount}
//                 </span>
//               )}
//             </button>
//           </div>

//           {/* ==================================================
//               MAIN GRID
//               ================================================== */}

//           <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
//             {/* ==================================================
//                 DESKTOP SIDEBAR
//                 ================================================== */}

//             <aside className="sticky top-[calc(var(--top-info-height,0px)+6rem)] hidden lg:block">
//               <div className="rounded-[1.5rem] border border-rose-100 bg-[#fffafa] p-5 shadow-[0_8px_30px_rgba(122,76,86,0.06)]">
//                 <div className="mb-5 flex items-center gap-2">
//                   <Filter
//                     className="h-4 w-4 text-primary"
//                     aria-hidden="true"
//                   />

//                   <h2 className="font-semibold text-[#4a323a]">
//                     Filter Packages
//                   </h2>
//                 </div>

//                 <Filters
//                   idPrefix="desktop"
//                   {...filterProps}
//                 />
//               </div>
//             </aside>

//             {/* ==================================================
//                 RESULTS
//                 ================================================== */}

//             <div className="min-w-0">
//               {/* RESULT HEADER */}

//               <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                 <div>
//                   {!loading &&
//                     !error && (
//                       <>
//                         <p className="text-sm text-[#765f66]">
//                           Showing{" "}
//                           <span className="font-semibold text-[#4a323a]">
//                             {
//                               filteredPackages.length
//                             }
//                           </span>{" "}
//                           {resultLabel}
//                         </p>

//                         {collection !==
//                           "all" && (
//                           <p className="mt-1 text-xs text-[#9a7b83]">
//                             Collection:{" "}
//                             <span className="font-semibold text-[#765f66]">
//                               {
//                                 context.collectionLabel
//                               }
//                             </span>
//                           </p>
//                         )}
//                       </>
//                     )}
//                 </div>

//                 <div className="w-full sm:w-56">
//                   <FilterSelect
//                     id="sort-packages"
//                     ariaLabel="Sort packages"
//                     value={sortBy}
//                     onChange={setSortBy}
//                     options={SORT_OPTIONS}
//                   />
//                 </div>
//               </div>

//               {/* ==================================================
//                   LOADING
//                   ================================================== */}

//               {loading && (
//                 <div
//                   className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6"
//                   role="status"
//                   aria-label="Loading packages"
//                 >
//                   {[1, 2, 3, 4, 5, 6].map(
//                     (key) => (
//                       <PackageSkeleton
//                         key={key}
//                       />
//                     )
//                   )}
//                 </div>
//               )}

//               {/* ==================================================
//                   ERROR
//                   ================================================== */}

//               {!loading &&
//                 error &&
//                 packages.length === 0 && (
//                   <div
//                     role="alert"
//                     className="rounded-[1.5rem] border border-[#e8cbd1] bg-[#fff2f4] p-6 text-center sm:p-8"
//                   >
//                     <p className="font-semibold text-[#4a323a]">
//                       Couldn't load
//                       packages
//                     </p>

//                     <p className="mt-2 text-sm text-[#a35c6d]">
//                       {error?.response?.data
//                         ?.detail ||
//                         error?.message ||
//                         "Unable to load packages right now."}
//                     </p>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         window.location.reload()
//                       }
//                       className={`${PRIMARY_BUTTON} mt-5`}
//                     >
//                       Try Again

//                       <ArrowRight
//                         className="h-4 w-4"
//                         aria-hidden="true"
//                       />
//                     </button>
//                   </div>
//                 )}

//               {/* ==================================================
//                   EMPTY
//                   ================================================== */}

//               {!loading &&
//                 !error &&
//                 filteredPackages.length ===
//                   0 && (
//                   <div className="rounded-[1.5rem] border border-rose-100 bg-gradient-to-br from-[#fffafa] to-[#fdf0f3] p-8 text-center shadow-[0_8px_30px_rgba(122,76,86,0.05)] sm:p-12">
//                     <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-200 bg-white">
//                       <Search
//                         className="h-6 w-6 text-primary"
//                         aria-hidden="true"
//                       />
//                     </div>

//                     <h2 className="mt-4 font-display text-3xl font-semibold text-[#3c2930]">
//                       No packages found
//                     </h2>

//                     <p className="mx-auto mt-2 max-w-md text-sm text-[#765f66]">
//                       {
//                         context.emptyMessage
//                       }
//                     </p>

//                     {hasActiveFilters && (
//                       <button
//                         type="button"
//                         onClick={
//                           resetFilters
//                         }
//                         className={`${PRIMARY_BUTTON} mt-5`}
//                       >
//                         Clear Filters

//                         <X
//                           className="h-4 w-4"
//                           aria-hidden="true"
//                         />
//                       </button>
//                     )}
//                   </div>
//                 )}

//               {/* ==================================================
//                   PACKAGES
//                   ================================================== */}

//               {!loading &&
//                 filteredPackages.length >
//                   0 && (
//                   <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
//                     {filteredPackages.map(
//                       (pkg) => (
//                         <PackageCard
//                           key={
//                             pkg?.id ??
//                             pkg?.slug
//                           }
//                           pkg={pkg}
//                         />
//                       )
//                     )}
//                   </RevealGroup>
//                 )}
//             </div>
//           </div>
//         </section>
//       </main>

//       {/* ======================================================
//           MOBILE FILTER DRAWER
//           ====================================================== */}

//       {mobileFiltersOpen && (
//         <div
//           className="fixed inset-0 z-[90] lg:hidden"
//           role="dialog"
//           aria-modal="true"
//           aria-label="Filter packages"
//         >
//           {/* BACKDROP */}

//           <button
//             type="button"
//             aria-label="Close filters"
//             onClick={() =>
//               setMobileFiltersOpen(false)
//             }
//             className="absolute inset-0 bg-[#3c2930]/40 backdrop-blur-[2px]"
//           />

//           {/* DRAWER */}

//           <div className="absolute right-0 top-0 flex h-full w-[min(90vw,380px)] flex-col bg-[#fffafa] shadow-2xl">
//             {/* HEADER */}

//             <div className="flex items-center justify-between gap-4 border-b border-rose-100 px-5 py-4">
//               <div className="flex items-center gap-2">
//                 <Filter
//                   className="h-4 w-4 text-primary"
//                   aria-hidden="true"
//                 />

//                 <h2 className="font-semibold text-[#4a323a]">
//                   Filter Packages
//                 </h2>
//               </div>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setMobileFiltersOpen(
//                     false
//                   )
//                 }
//                 className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f9e8ec] transition-colors hover:bg-[#f3dce2]"
//                 aria-label="Close filters"
//               >
//                 <X
//                   className="h-5 w-5 text-[#4a323a]"
//                   aria-hidden="true"
//                 />
//               </button>
//             </div>

//             {/* FILTER CONTENT */}

//             <div className="flex-1 overflow-y-auto p-5">
//               <Filters
//                 idPrefix="mobile"
//                 {...filterProps}
//               />
//             </div>

//             {/* FOOTER */}

//             <div className="border-t border-rose-100 bg-white/80 p-5">
//               <button
//                 type="button"
//                 onClick={() =>
//                   setMobileFiltersOpen(
//                     false
//                   )
//                 }
//                 className="w-full rounded-xl bg-[#8f5666] px-5 py-3.5 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#7c4858] hover:shadow-md"
//               >
//                 Show{" "}
//                 {filteredPackages.length}{" "}
//                 {filteredPackages.length ===
//                 1
//                   ? "Package"
//                   : "Packages"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ======================================================
//           FAQ
//           ====================================================== */}

//       <FAQSection category="packages" />

//       {/* ======================================================
//           FOOTER
//           ====================================================== */}

//       <Footer />
//     </>
//   );
// }







