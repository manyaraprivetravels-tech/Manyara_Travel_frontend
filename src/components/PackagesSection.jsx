

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gem,
  ImageOff,
  MapPin,
  PackageOpen,
  Sparkles,
} from "lucide-react";

import { getPackages } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { Reveal, useInView } from "./Reveal";

/* =========================================================
   PACKAGES: "MADE TO MEASURE"

   One compact section instead of six carousels.
   - Left column (desktop): heading, collection tabs, arrows, view all.
   - Right column: one carousel of mat-framed journey cards.
   - Tabs only appear for collections that actually have packages.
   - Other collections (Most Visited, Trending, Popular) live on
     /packages?collection=<key>, which "View all journeys" links to.

   Visual language is deliberately different from its neighbours:
     Seasonal     -> full-bleed photo cards
     Most Visited -> arch windows
     Packages     -> framed "print" cards, details on a light card
========================================================= */

const PACKAGE_PLACEHOLDER = "/images/package-placeholder.webp";

const BRAND_NAME = "Manyara Privé Vacations";

/* Home-page collections. Order = tab order. Add a row to show another. */
const COLLECTIONS = [
  {
    key: "featured",
    flag: "is_featured",
    icon: Gem,
    tab: "Signature",
    description: `Our signature edit, handpicked by the ${BRAND_NAME} team.`,
  },
  {
    key: "recommended",
    flag: "is_recommended",
    icon: Award,
    tab: "Handpicked",
    description: "Thoughtfully chosen journeys for your next getaway.",
  },
  {
    key: "new",
    flag: "is_new",
    icon: Sparkles,
    tab: "New",
    description: "Fresh escapes, added to our collection this season.",
  },
];

/* Phones show the next card peeking so people know to swipe */
const CARD_BASIS =
  "min-w-0 shrink-0 basis-[78%] snap-start sm:basis-[calc(50%-10px)] xl:basis-[calc(44%-12px)]";

const NAV_BUTTON =
  "hidden h-12 w-12 items-center justify-center rounded-full border border-champagne/70 bg-white text-text-dark shadow-travel-card transition-all duration-300 hover:border-ink hover:bg-ink hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 lg:flex";

const VIEW_ALL =
  "group inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-champagne/60 bg-white px-5 text-sm font-semibold tracking-wide text-text-dark transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/* =========================================================
   HELPERS
========================================================= */

const isTruthy = (value) =>
  value === true || value === 1 || value === "1" || value === "true";

const isPublishedPackage = (packageItem) => {
  const status = String(packageItem?.status ?? "")
    .trim()
    .toLowerCase();

  return (
    status === "" ||
    status === "published" ||
    packageItem?.is_published === true
  );
};

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (typeof image === "object") return image?.url || image?.src || "";
  return "";
};

const getPackageImage = (packageItem) => {
  if (!packageItem) return PACKAGE_PLACEHOLDER;

  if (Array.isArray(packageItem.images)) {
    for (const image of packageItem.images) {
      const imageUrl = getImageUrl(image);
      if (imageUrl) return imageUrl;
    }
  }

  return (
    getImageUrl(packageItem.image) ||
    getImageUrl(packageItem.cover_image) ||
    getImageUrl(packageItem.coverImage) ||
    PACKAGE_PLACEHOLDER
  );
};

const getDuration = (packageItem) => {
  if (!packageItem) return "";

  if (packageItem.duration) return String(packageItem.duration);

  const days = Number(packageItem.duration_days);
  const nights = Number(packageItem.duration_nights);

  if (days > 0 && nights >= 0) {
    return `${days} ${days === 1 ? "Day" : "Days"} / ${nights} ${
      nights === 1 ? "Night" : "Nights"
    }`;
  }
  if (days > 0) return `${days} ${days === 1 ? "Day" : "Days"}`;
  if (nights > 0) return `${nights} ${nights === 1 ? "Night" : "Nights"}`;

  return "";
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "";

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) return String(price);

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

/* First usable short line a package offers, if any. */
const getHighlight = (packageItem) => {
  const candidates = [
    packageItem?.tagline,
    packageItem?.subtitle,
    packageItem?.short_description,
    packageItem?.summary,
  ];
  const found = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );
  return found ? found.trim() : "";
};

const getPackageKey = (packageItem, index) =>
  packageItem?.id ||
  packageItem?.slug ||
  `${packageItem?.title || "package"}-${index}`;

const sortByOrder = (a, b) =>
  Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0);

/* Last word set in italic, same treatment as the hero. */
function renderTitle(text) {
  const words = String(text).trim().split(/\s+/);
  if (words.length < 3) return text;
  const last = words.pop();
  return (
    <>
      {words.join(" ")}{" "}
      <em className="font-normal italic text-ink/70">{last}</em>
    </>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function PackageCardSkeleton() {
  return (
    <div className={CARD_BASIS} aria-hidden="true">
      <div className="animate-pulse rounded-[1.75rem] border border-champagne/50 bg-white p-1.5">
        <div className="aspect-[10/11] w-full rounded-[1.4rem] bg-surface-strong" />
        <div className="space-y-3 px-4 pb-4 pt-5">
          <div className="h-3 w-24 rounded bg-surface-strong" />
          <div className="h-7 w-3/4 rounded bg-surface-strong" />
          <div className="h-4 w-full rounded bg-surface-strong" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PACKAGE CARD

   A white mat frames the photo like a print. Duration sits on the
   photo; destination, title, one-line highlight and price sit on the
   light card below, so text never fights the image.
   Hover (mouse) or press (touch) lifts the card and slowly zooms the photo.
========================================================= */

const PackageCard = memo(function PackageCard({ packageItem, badge }) {
  const [imageFailed, setImageFailed] = useState(false);

  const image = getPackageImage(packageItem);
  const title = packageItem?.title || packageItem?.name || "Travel Package";
  const destination = packageItem?.destination || packageItem?.location || "";
  const duration = getDuration(packageItem);
  const highlight = getHighlight(packageItem);
  const price = formatPrice(
    packageItem?.price_per_person ??
      packageItem?.price ??
      packageItem?.starting_price ??
      packageItem?.starting_from
  );
  const slug = packageItem?.slug;

  const BadgeIcon = badge?.icon;

  const frameClass =
    "group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-[1.75rem]";

  const content = (
    <div className="flex h-full flex-col rounded-[1.75rem] border border-champagne/70 bg-white p-1.5 shadow-travel-card transition-[transform,box-shadow,border-color] duration-500 ease-soft group-hover:-translate-y-1.5 group-hover:border-champagne group-hover:shadow-[0_30px_50px_-24px_rgba(47,42,51,0.45)] group-active:-translate-y-1">
      {/* PHOTO */}
      <div className="relative aspect-[10/11] w-full shrink-0 transform-gpu overflow-hidden rounded-[1.4rem] bg-surface-strong">
        {!imageFailed ? (
          <img
            src={cld(item.image, 700)}
           srcSet={cldSrcSet(item.image, [400, 700, 1000])}
            alt=""
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            draggable={false}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-soft group-hover:scale-[1.07] group-active:scale-[1.07]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-surface-soft"
            aria-label="Package image unavailable"
          >
            <ImageOff className="h-8 w-8 text-placeholder" aria-hidden="true" />
          </div>
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-[#14100F]/60 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Secondary collection badge (only if the package belongs to another one) */}
        {badge && (
          <span className="absolute left-3.5 top-3.5 inline-flex h-8 items-center gap-2 rounded-full border border-white/30 bg-ink/50 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white sm:bg-ink/35 sm:backdrop-blur-md">
            <BadgeIcon
              className="h-3.5 w-3.5 text-champagne"
              aria-hidden="true"
            />
            {badge.tab}
          </span>
        )}

        {duration && (
          <span className="absolute bottom-3.5 left-3.5 inline-flex h-8 max-w-[85%] items-center gap-2 rounded-full bg-white/90 px-3 text-[12px] font-medium text-text-dark">
            <Clock3
              className="h-3.5 w-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate">{duration}</span>
          </span>
        )}
      </div>

      {/* DETAILS */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-5 text-left antialiased">
        {destination && (
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate text-[11px] font-medium uppercase tracking-[0.22em]">
              {destination}
            </span>
          </div>
        )}

        <h3 className="mt-2 line-clamp-2 font-display text-[1.7rem] font-medium leading-[1.08] tracking-[-0.005em] text-text-display [text-wrap:balance] sm:text-[1.6rem] lg:text-[1.75rem]">
          {title}
        </h3>

        {highlight && (
          <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-text-secondary">
            {highlight}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-champagne/50 pt-4">
          <div className="min-w-0 pt-4">
            {price ? (
              <>
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-secondary">
                  From
                </p>
                <p className="mt-1 font-display text-[1.6rem] font-normal leading-none tracking-tight text-text-display tabular-nums">
                  {price}
                </p>
              </>
            ) : (
              <p className="font-display text-lg italic text-text-secondary">
                Price on request
              </p>
            )}
          </div>

          <span
            className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-champagne/70 bg-white text-text-dark transition-all duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-champagne group-active:border-ink group-active:bg-ink group-active:text-champagne"
            aria-hidden="true"
          >
            <ArrowUpRight className="h-[18px] w-[18px]" />
          </span>
        </div>
      </div>
    </div>
  );

  const label = `${title}${destination ? `, ${destination}` : ""}`;

  return slug ? (
    <Link to={`/packages/${slug}`} className={frameClass} aria-label={label}>
      {content}
    </Link>
  ) : (
    <article className={frameClass} aria-label={label}>
      {content}
    </article>
  );
});

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PackagesSection() {
  /* Same cache system as the rest of the public site. */
  const {
    data: packageResponse,
    loading,
    error: queryError,
  } = useQuery(getPackages);

  const packages = useMemo(() => {
    if (Array.isArray(packageResponse)) return packageResponse;
    if (Array.isArray(packageResponse?.items)) return packageResponse.items;
    if (Array.isArray(packageResponse?.packages)) return packageResponse.packages;
    if (Array.isArray(packageResponse?.data)) return packageResponse.data;
    return [];
  }, [packageResponse]);

  const publishedPackages = useMemo(
    () => packages.filter(isPublishedPackage),
    [packages]
  );

  const errorMessage =
    queryError?.message || (typeof queryError === "string" ? queryError : "");

  /* ---------- Tabs: only collections that have packages ---------- */

  const tabs = useMemo(
    () =>
      COLLECTIONS.map((collection) => ({
        collection,
        items: publishedPackages
          .filter((packageItem) => isTruthy(packageItem?.[collection.flag]))
          .sort(sortByOrder),
      })).filter((tab) => tab.items.length > 0),
    [publishedPackages]
  );

  const [activeKey, setActiveKey] = useState(null);

  const activeTab =
    tabs.find((tab) => tab.collection.key === activeKey) || tabs[0] || null;

  const activeCollection = activeTab?.collection || null;
  const items = activeTab?.items || [];
  const activeCollectionKey = activeCollection?.key;

  /* Badge shows another collection the package belongs to (never the open tab). */
  const getBadge = useCallback(
    (packageItem) =>
      COLLECTIONS.find(
        (collection) =>
          collection.key !== activeCollectionKey &&
          isTruthy(packageItem?.[collection.flag])
      ) || null,
    [activeCollectionKey]
  );

  /* ---------- Carousel ---------- */

  const carouselRef = useRef(null);
  const progressRef = useRef(null);
  const rafRef = useRef(0);
  const [revealRef, inView] = useInView();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* Booleans only change at the edges, and the progress bar is written
     straight to the DOM, so scrolling never re-renders the cards. */
  const updateScrollState = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;

    const maxScroll = Math.max(
      0,
      container.scrollWidth - container.clientWidth
    );
    const currentScroll = container.scrollLeft;
    const threshold = 4;

    setCanScrollLeft(currentScroll > threshold);
    setCanScrollRight(currentScroll < maxScroll - threshold);

    if (progressRef.current) {
      const progress = maxScroll > 0 ? currentScroll / maxScroll : 0;
      progressRef.current.style.transform = `translateX(${progress * 200}%)`;
    }
  }, []);

  /* One update per animation frame, however many scroll events fire. */
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      updateScrollState();
    });
  }, [updateScrollState]);

  /* Measure on mount, on resize and whenever the visible set changes. */
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return undefined;

    updateScrollState();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollState);
      return () => window.removeEventListener("resize", updateScrollState);
    }

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateScrollState, items.length, loading, activeCollectionKey]);

  /* Switching tabs starts the new row from the first card. */
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    container.scrollTo({ left: 0, behavior: "instant" });
    updateScrollState();
  }, [activeCollectionKey, updateScrollState]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const scrollCarousel = useCallback((direction) => {
    const container = carouselRef.current;
    if (!container) return;

    const card = container.querySelector("[data-package-card]");
    if (!card) return;

    const cardWidth = card.getBoundingClientRect().width;
    const computedStyle = window.getComputedStyle(container);
    const gap =
      parseFloat(computedStyle.columnGap || computedStyle.gap || "0") || 0;

    container.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }, []);

  const viewAllHref = activeCollection
    ? `/packages?collection=${activeCollection.key}`
    : "/packages";

  const canScroll = canScrollLeft || canScrollRight;
  const hasContent = !loading && !errorMessage && tabs.length > 0;

  return (
    <section
      id="packages"
      aria-labelledby="packages-section-title"
      className="relative isolate w-full overflow-x-clip bg-gradient-to-b from-background to-surface-alt py-16 antialiased sm:py-20 lg:py-24"
    >
      {/* Top hairline + soft champagne wash, matching the sections above */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_0%_100%,rgba(232,210,180,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] xl:gap-16">
          {/* =================================================
              LEFT: HEADING, TABS, CONTROLS
          ================================================= */}
          <div className="lg:sticky lg:top-28">
            <Reveal className="max-w-2xl lg:max-w-none">
              <div className="flex items-center gap-3">
                <span
                  className="h-px w-8 shrink-0 bg-champagne"
                  aria-hidden="true"
                />
                <span className="truncate text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
                  {BRAND_NAME}
                </span>
              </div>

              <h2
                id="packages-section-title"
                className="mt-4 font-display text-[2.6rem] font-medium leading-[1.03] tracking-[-0.015em] text-text-display [text-wrap:balance] sm:text-[3.25rem] lg:text-[3rem] xl:text-[3.5rem]"
              >
                {renderTitle("Journeys made to measure")}
              </h2>

              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-secondary sm:text-base sm:leading-7">
                Every itinerary is planned end to end by our travel team, from
                the first idea to the journey home.
              </p>
            </Reveal>

            {/* TABS */}
            {hasContent && tabs.length > 1 && (
              <div
                role="tablist"
                aria-label="Journey collections"
                className="-mx-4 mt-7 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {tabs.map(({ collection }) => {
                  const TabIcon = collection.icon;
                  const selected = collection.key === activeCollectionKey;

                  return (
                    <button
                      key={collection.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveKey(collection.key)}
                      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold tracking-wide transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        selected
                          ? "border-ink bg-ink text-champagne"
                          : "border-champagne/60 bg-white text-text-dark hover:border-ink"
                      }`}
                    >
                      <TabIcon className="h-4 w-4" aria-hidden="true" />
                      {collection.tab}
                    </button>
                  );
                })}
              </div>
            )}

            {hasContent && activeCollection && (
              <p
                key={activeCollection.key}
                className="mt-4 max-w-xl text-sm leading-6 text-text-secondary"
              >
                {activeCollection.description}
              </p>
            )}

            {/* DESKTOP CONTROLS */}
            {hasContent && (
              <div className="mt-8 hidden items-center gap-3 lg:flex">
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  disabled={!canScrollLeft}
                  aria-label="Previous journeys"
                  className={NAV_BUTTON}
                >
                  <ChevronLeft
                    className="h-5 w-5"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  disabled={!canScrollRight}
                  aria-label="Next journeys"
                  className={NAV_BUTTON}
                >
                  <ChevronRight
                    className="h-5 w-5"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </button>

                <Link to={viewAllHref} className={`${VIEW_ALL} ml-2`}>
                  View all journeys
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            )}
          </div>

          {/* =================================================
              RIGHT: CAROUSEL / STATES
          ================================================= */}
          <div
            ref={revealRef}
            data-inview={inView}
            className="mt-10 min-w-0 lg:mt-0"
          >
            {/* LOADING */}
            {loading && (
              <div
                className="-mx-4 flex gap-4 overflow-hidden px-4 sm:mx-0 sm:gap-5 sm:px-1 lg:gap-6"
                role="status"
                aria-label="Loading journeys"
              >
                {[1, 2, 3].map((item) => (
                  <PackageCardSkeleton key={item} />
                ))}
              </div>
            )}

            {/* ERROR */}
            {!loading && errorMessage && (
              <div className="rounded-3xl border border-error/20 bg-error-bg px-6 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white">
                  <PackageOpen
                    className="h-5 w-5 text-error"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-error-text">
                  Unable to load journeys
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-error-text">
                  Please refresh the page and try again.
                </p>
              </div>
            )}

            {/* EMPTY */}
            {!loading && !errorMessage && tabs.length === 0 && (
              <div className="rounded-3xl border border-dashed border-champagne/60 bg-card px-5 py-12 text-center sm:px-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-champagne/60 bg-white">
                  <PackageOpen
                    className="h-6 w-6 text-placeholder"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-display text-2xl font-medium text-text-display">
                  New journeys coming soon
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  We are preparing our next collection of journeys. Please
                  check back soon.
                </p>
              </div>
            )}

            {/* CAROUSEL */}
            {hasContent && (
              <>
                <div
                  ref={carouselRef}
                  onScroll={handleScroll}
                  role="tabpanel"
                  className="-mx-4 flex w-full snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-8 pt-2 sm:mx-0 sm:scroll-pl-0 sm:gap-5 sm:px-1 lg:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {items.map((packageItem, index) => (
                    <div
                      key={getPackageKey(packageItem, index)}
                      data-package-card
                      className={`${CARD_BASIS} reveal-item`}
                      style={{ "--i": Math.min(index, 6) }}
                    >
                      <PackageCard
                        packageItem={packageItem}
                        badge={getBadge(packageItem)}
                      />
                    </div>
                  ))}
                </div>

                {/* PHONE / TABLET FOOTER: swipe progress + view all */}
                <div className="mt-1 flex items-center gap-4 lg:hidden">
                  {canScroll ? (
                    <div
                      className="h-0.5 flex-1 overflow-hidden rounded-full bg-champagne/40"
                      aria-hidden="true"
                    >
                      <div
                        ref={progressRef}
                        className="h-full w-1/3 rounded-full bg-ink/70 will-change-transform"
                      />
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <Link to={viewAllHref} className={VIEW_ALL}>
                    View all journeys
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}





