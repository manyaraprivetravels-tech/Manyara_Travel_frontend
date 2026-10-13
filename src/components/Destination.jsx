

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
  ChevronLeft,
  ChevronRight,
  Globe2,
} from "lucide-react";

import {cld,cldSrcSet} from "../utils/cloudinary";

import { getMostVisited, getPackages } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { Reveal, useInView } from "./Reveal";

const ARCH_OUTER = "rounded-t-[999px] rounded-b-[1.75rem]";
const ARCH_INNER = "rounded-t-[999px] rounded-b-[1.4rem]";

/* Phones show the next card peeking so users know to swipe */
const CARD_BASIS =
  "min-w-0 shrink-0 basis-[74%] snap-start sm:basis-[calc(50%-14px)] lg:basis-[calc(25%-21px)]";

const NAV_BUTTON =
  "hidden h-12 w-12 items-center justify-center rounded-full border border-champagne/70 bg-white text-text-dark shadow-travel-card transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 sm:flex";

  /* Cards shown on the home page. The rest live on the full destinations page. */
const HOME_LIMIT = 6;

/* =========================================================
   HELPERS
========================================================= */

const getPlaceImage = (place) =>
  place?.image?.url ||
  (typeof place?.image === "string" ? place.image : "");

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "";

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) return String(price);

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

const getPlaceKey = (place) => place?.id ?? place?.slug;

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

/* "Dubai, UAE" -> ["dubai", "uae"] */
const splitDestination = (value) =>
  normalize(value)
    .split(/\s*[,/|&]\s*|\s+[-–]\s+/)
    .filter(Boolean);

const isPublishedPackage = (packageItem) => {
  const status = normalize(packageItem?.status);

  return (
    status === "" ||
    status === "published" ||
    packageItem?.is_published === true
  );
};

/* Price stored directly on the destination, if the API sends one. */
const PLACE_PRICE_FIELDS = [
  "starting_price",
  "starts_from",
  "starting_from",
  "min_price",
  "price_from",
  "price",
];

const getPlaceOwnPrice = (place) => {
  for (const field of PLACE_PRICE_FIELDS) {
    const value = place?.[field];

    if (value === null || value === undefined || value === "") continue;

    const numeric = Number(value);

    if (Number.isNaN(numeric) || numeric > 0) {
      return { amount: value, perPerson: false };
    }
  }

  return null;
};

/* First positive price on a package. */
const getPackagePrice = (packageItem) => {
  const candidates = [
    ["price_per_person", true],
    ["price", false],
    ["starting_price", false],
    ["starting_from", false],
  ];

  for (const [field, perPerson] of candidates) {
    const numeric = Number(packageItem?.[field]);

    if (!Number.isNaN(numeric) && numeric > 0) {
      return { amount: numeric, perPerson };
    }
  }

  return null;
};

const packageBelongsToPlace = (packageItem, place) => {
  const destination = packageItem?.destination;
  const destinationIsObject = destination && typeof destination === "object";

  const destinationId =
    packageItem?.destination_id ??
    (destinationIsObject ? destination.id : undefined);

  if (
    destinationId !== undefined &&
    destinationId !== null &&
    place?.id !== undefined &&
    place?.id !== null &&
    String(destinationId) === String(place.id)
  ) {
    return true;
  }

  const destinationSlug =
    packageItem?.destination_slug ||
    (destinationIsObject ? destination.slug : "");

  if (
    destinationSlug &&
    place?.slug &&
    normalize(destinationSlug) === normalize(place.slug)
  ) {
    return true;
  }

  const placeName = normalize(place?.place_name);
  if (!placeName) return false;

  const destinationName = destinationIsObject
    ? destination.place_name || destination.name
    : destination ?? packageItem?.location;

  return splitDestination(destinationName).includes(placeName);
};

/* =========================================================
   SKELETON
========================================================= */

function AtlasSkeleton() {
  return (
    <div className={CARD_BASIS} aria-hidden="true">
      <div
        className={`aspect-[3/4] w-full animate-pulse border border-champagne/50 bg-surface-strong ${ARCH_OUTER}`}
      />

      <div className="mt-5 h-7 w-3/4 animate-pulse rounded bg-surface-strong" />

      <div className="mt-5 h-8 w-1/2 animate-pulse rounded bg-surface-strong" />
    </div>
  );
}

/* =========================================================
   DESTINATION CARD
========================================================= */

const AtlasCard = memo(function AtlasCard({
  place,
  index,
  price,
  perPerson,
  priceLoading,
}) {
  const [active, setActive] = useState(false);
  const releaseTimerRef = useRef(null);

  const imageUrl = getPlaceImage(place);
  const name = place?.place_name || "Destination";
  const priceText = formatPrice(price);

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearReleaseTimer, [clearReleaseTimer]);

  /* Mouse: active while the pointer is over the card. */
  const handlePointerEnter = useCallback((event) => {
    if (event.pointerType !== "touch") setActive(true);
  }, []);

  const handlePointerLeave = useCallback((event) => {
    if (event.pointerType !== "touch") setActive(false);
  }, []);

  /* Touch: active while pressed, settles shortly after release. */
  const handlePointerDown = useCallback(
    (event) => {
      if (event.pointerType !== "touch") return;
      clearReleaseTimer();
      setActive(true);
    },
    [clearReleaseTimer]
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (event.pointerType !== "touch") return;
      clearReleaseTimer();
      releaseTimerRef.current = window.setTimeout(() => {
        setActive(false);
        releaseTimerRef.current = null;
      }, 700);
    },
    [clearReleaseTimer]
  );

  /* The browser took over the touch (user started scrolling). */
  const handlePointerCancel = useCallback(
    (event) => {
      if (event.pointerType !== "touch") return;
      clearReleaseTimer();
      setActive(false);
    },
    [clearReleaseTimer]
  );

  return (
    <div
      data-active={active ? "true" : "false"}
      data-destination-card
      className={`${CARD_BASIS} reveal-item group`}
      style={{ "--i": Math.min(index, 6) }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <Link
        to={`/destinations/${place.slug}`}
        aria-label={`Explore ${name}${
          priceText ? `, starts from ${priceText}` : ""
        }`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
      >
        {/* =====================================================
            ARCH WINDOW
        ===================================================== */}

        <div
          className={`
            relative
            border
            border-champagne/70
            bg-white
            p-1.5
            shadow-travel-card
            transition-[border-color,box-shadow,transform]
            duration-500
            ease-soft
            ${ARCH_OUTER}

            ${
              active
                ? "-translate-y-1.5 border-primary/50 shadow-[0_30px_50px_-24px_rgba(200,19,94,0.45)]"
                : ""
            }
          `}
        >
          <div
            className={`
              relative
              aspect-[3/4]
              w-full
              transform-gpu
              overflow-hidden
              bg-surface-strong
              ${ARCH_INNER}
            `}
          >
            {imageUrl ? (
              <img
                src={cld(imageUrl, 700)}
                srcSet={cldSrcSet(imageUrl, [400, 700, 1000])}
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                alt={`${name}, popular travel destination`}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                draggable={false}
                className={`
                  h-full
                  w-full
                  object-cover
                  transition-transform
                  duration-[1400ms]
                  ease-soft
                  ${active ? "scale-[1.1]" : "scale-100"}
                `}
              />
            ) : (
              <div className="h-full w-full bg-brand-gradient" />
            )}

            {/* Soft plum fade */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#1F0A15]/55 via-transparent to-transparent"
              aria-hidden="true"
            />

            {/* Explore round button */}
            <span
              className={`
                absolute
                bottom-5
                left-1/2
                flex
                h-12
                w-12
                -translate-x-1/2
                items-center
                justify-center
                rounded-full
                bg-white/95
                text-primary
                shadow-brand
                transition-all
                duration-500
                ease-soft
                ${
                  active
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0"
                }
              `}
              aria-hidden="true"
            >
              <ArrowUpRight className="h-5 w-5" />
            </span>

            {/* Active glow */}
            <div
              className={`
                pointer-events-none
                absolute
                inset-0
                rounded-[inherit]
                transition-opacity
                duration-500
                ${active ? "opacity-100" : "opacity-0"}
              `}
              style={{
                boxShadow: "inset 0 0 45px rgba(200,19,94,0.20)",
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* =====================================================
            CAPTION
        ===================================================== */}

        <div className="px-1 pt-5 antialiased">
          {/* NAME */}
          <h3 className="font-display text-[1.85rem] font-medium leading-[1.05] tracking-[-0.01em] text-text-display [text-wrap:balance] sm:text-[2rem]">
            {name}
          </h3>

          {/* DESCRIPTION */}
          {place?.description && (
            <p className="mt-2.5 line-clamp-2 text-[14px] leading-6 text-text-secondary">
              {place.description}
            </p>
          )}

          {/* PRICE + EXPLORE */}
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-champagne/50 pt-4">
            <div className="min-h-[3.1rem] min-w-0">
              {priceText ? (
                <>
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-secondary">
                    Starts from
                  </p>

                  <p
                    className={`
                      mt-1.5
                      font-display
                      text-[1.7rem]
                      font-medium
                      leading-none
                      tracking-tight
                      tabular-nums
                      transition-colors
                      duration-500
                      ${active ? "text-primary" : "text-text-display"}
                    `}
                  >
                    {priceText}

                    {perPerson && (
                      <span className="ml-1.5 font-sans text-[11px] font-normal tracking-normal text-text-secondary">
                        per person
                      </span>
                    )}
                  </p>
                </>
              ) : priceLoading ? (
                <div className="space-y-2" aria-hidden="true">
                  <div className="h-2.5 w-20 animate-pulse rounded bg-surface-strong" />
                  <div className="h-6 w-28 animate-pulse rounded bg-surface-strong" />
                </div>
              ) : (
                <p className="pt-3 font-display text-lg italic leading-none text-text-secondary">
                  Price on request
                </p>
              )}
            </div>

            <span className="mb-0.5 inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-text-dark">
              <span className="relative pb-1">
                Explore

                <span
                  className={`
                    absolute
                    inset-x-0
                    bottom-0
                    h-px
                    origin-left
                    bg-primary
                    transition-transform
                    duration-500
                    ease-soft
                    ${active ? "scale-x-100" : "scale-x-0"}
                  `}
                  aria-hidden="true"
                />
              </span>

              <ArrowRight
                className={`
                  h-3.5
                  w-3.5
                  text-primary
                  transition-transform
                  duration-300
                  ${active ? "translate-x-1" : "translate-x-0"}
                `}
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
});

/* =========================================================
   VIEW ALL CARD
========================================================= */

const ViewAllCard = memo(function ViewAllCard({ total, index }) {
  return (
    <div
      className={`${CARD_BASIS} reveal-item group`}
      style={{ "--i": Math.min(index, 6) }}
    >
      <Link
        to="/destinations"
        aria-label={`View all ${total} destinations`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
      >
        <div
          className={`relative border border-champagne/70 bg-white p-1.5 shadow-travel-card transition-[border-color,box-shadow,transform] duration-500 ease-soft group-hover:-translate-y-1.5 group-hover:border-primary/50 ${ARCH_OUTER}`}
        >
          <div
            className={`relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden bg-brand-gradient px-6 text-center ${ARCH_INNER}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-brand transition-transform duration-500 ease-soft group-hover:scale-110">
              <Globe2 className="h-7 w-7" aria-hidden="true" />
            </span>

            <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.24em] text-primary">
              {total} destinations
            </p>

            <h3 className="mt-2 font-display text-[1.85rem] font-medium leading-[1.05] tracking-[-0.01em] text-text-display [text-wrap:balance] sm:text-[2rem]">
              View All Destinations
            </h3>

            <p className="mt-3 text-[14px] leading-6 text-text-secondary">
              Discover every place we plan journeys to.
            </p>

            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white shadow-brand transition-colors group-hover:bg-primary-hover">
              Explore all
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
});

/* =========================================================
   MAIN SECTION
========================================================= */

export default function DestinationSection() {
  /*
   * Project's cached useQuery:
   * instant from cache and refreshes quietly.
   */
  const { data, loading, error } = useQuery(getMostVisited);

  /* Same cached query the Packages section uses (no extra request). */
  const { data: packageResponse, loading: packagesLoading } =
    useQuery(getPackages);

  /* =========================================================
     DATA
  ========================================================= */

  // const visiblePlaces = useMemo(() => {
  //   const list = Array.isArray(data)
  //     ? data
  //     : Array.isArray(data?.items)
  //       ? data.items
  //       : [];

  //   return list
  //     .filter((place) => place?.slug)
  //     .sort(
  //       (a, b) =>
  //         Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0)
  //     );
  // }, [data]);



  const allPlaces = useMemo(() => {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  return list
    .filter((place) => place?.slug)
    .sort(
      (a, b) => Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0)
    );
}, [data]);

/* Only the first few cards are rendered on the home page */
const visiblePlaces = useMemo(() => allPlaces.slice(0, HOME_LIMIT), [allPlaces]);

const showViewAll = allPlaces.length > HOME_LIMIT;


  const publishedPackages = useMemo(() => {
    const list = Array.isArray(packageResponse)
      ? packageResponse
      : Array.isArray(packageResponse?.items)
        ? packageResponse.items
        : Array.isArray(packageResponse?.packages)
          ? packageResponse.packages
          : Array.isArray(packageResponse?.data)
            ? packageResponse.data
            : [];

    return list.filter(isPublishedPackage);
  }, [packageResponse]);

  /* "Starts from" price for each destination. */
  const priceByPlace = useMemo(() => {
    const map = new Map();

    visiblePlaces.forEach((place) => {
      const own = getPlaceOwnPrice(place);

      if (own) {
        map.set(getPlaceKey(place), own);
        return;
      }

      let lowest = null;

      publishedPackages.forEach((packageItem) => {
        if (!packageBelongsToPlace(packageItem, place)) return;

        const candidate = getPackagePrice(packageItem);
        if (!candidate) return;

        if (!lowest || candidate.amount < lowest.amount) {
          lowest = candidate;
        }
      });

      map.set(getPlaceKey(place), lowest);
    });

    return map;
  }, [visiblePlaces, publishedPackages]);

  /* =========================================================
     CAROUSEL
  ========================================================= */

  const carouselRef = useRef(null);
  const progressRef = useRef(null);
  const rafRef = useRef(0);

  const [revealRef, inView] = useInView();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = carouselRef.current;

    if (!container) return;

    const maxScroll = Math.max(
      0,
      container.scrollWidth - container.clientWidth
    );

    const current = container.scrollLeft;
    const threshold = 4;

    setCanScrollLeft(current > threshold);
    setCanScrollRight(current < maxScroll - threshold);

    /* Progress is written straight to the DOM so scrolling never
       re-renders the cards. */
    if (progressRef.current) {
      const progress = maxScroll > 0 ? current / maxScroll : 0;

      progressRef.current.style.transform = `translateX(${progress * 200}%)`;
    }
  }, []);

  /* One update per animation frame. */
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      updateScrollState();
    });
  }, [updateScrollState]);

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
  }, [updateScrollState, visiblePlaces.length, loading]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollCarousel = useCallback((direction) => {
    const container = carouselRef.current;

    if (!container) return;

    const firstCard = container.querySelector("[data-destination-card]");

    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;

    const style = window.getComputedStyle(container);

    const gap = parseFloat(style.columnGap || style.gap || "0") || 0;

    const cardsPerView = Math.max(
      1,
      Math.round((container.clientWidth + gap) / (cardWidth + gap))
    );

    const amount = (cardWidth + gap) * cardsPerView;

    container.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }, []);

  /* =========================================================
     ERROR / EMPTY
  ========================================================= */

  if (error && !loading && visiblePlaces.length === 0) {
    console.error("Most visited destinations loading failed:", error);

    return null;
  }

  if (!loading && visiblePlaces.length === 0) {
    return null;
  }

  const canScroll = canScrollLeft || canScrollRight;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      id="most-visited"
      aria-labelledby="most-visited-title"
      className="
        relative
        isolate
        w-full
        overflow-x-clip
        bg-gradient-to-b
        from-surface-alt
        via-champagne-light/30
        to-surface-soft
        py-16
        antialiased
        [contain-intrinsic-size:auto_820px]
        sm:py-24
        lg:py-28
      "
    >
      {/* TOP HAIRLINE */}
      <div
        className="
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-champagne
          to-transparent
        "
        aria-hidden="true"
      />

      {/* BACKGROUND GLOW */}
      <div
        className="
          absolute
          inset-0
          -z-10
          bg-[radial-gradient(ellipse_at_85%_0%,rgba(200,19,94,0.06)_0%,transparent_55%)]
        "
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-10 flex items-end justify-between gap-6 sm:mb-14">
          <Reveal className="max-w-2xl">
            {/* EYEBROW */}
            <div className="flex items-center gap-3">
              <span
                className="h-px w-8 shrink-0 bg-champagne"
                aria-hidden="true"
              />

              <Globe2
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />

              <span className="truncate text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
                Where everyone&apos;s headed
              </span>
            </div>

            {/* TITLE */}
            <h2
              id="most-visited-title"
              className="
                mt-4
                font-display
                text-[2.6rem]
                font-medium
                leading-[1.03]
                tracking-[-0.015em]
                text-text-display
                [text-wrap:balance]
                sm:text-[3.25rem]
                lg:text-[3.75rem]
              "
            >
              Most Loved{" "}
              <em className="font-medium italic text-primary">Escapes</em>
            </h2>

            {/* DESCRIPTION */}
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-secondary sm:text-base sm:leading-7">
              Places travellers return to again and again. See what each
              journey starts from, then explore the packages planned for it.
            </p>
          </Reveal>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              disabled={!canScrollLeft}
              aria-label="Previous destinations"
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
              aria-label="Next destinations"
              className={NAV_BUTTON}
            >
              <ChevronRight
                className="h-5 w-5"
                strokeWidth={2.25}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div
            className="
              -mx-4
              flex
              gap-5
              overflow-hidden
              px-4
              sm:mx-0
              sm:gap-7
              sm:px-0
            "
            role="status"
            aria-label="Loading destinations"
          >
            {[1, 2, 3, 4].map((item) => (
              <AtlasSkeleton key={item} />
            ))}
          </div>
        ) : (
          <div
            ref={revealRef}
            data-inview={inView}
            className="relative w-full"
          >

            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="
                -mx-4
                flex
                snap-x
                snap-mandatory
                scroll-pl-4
                gap-5
                overflow-x-auto
                scroll-smooth
                px-4
                pb-10
                pt-3
                sm:mx-0
                sm:w-full
                sm:scroll-pl-0
                sm:gap-7
                sm:px-1
                lg:pb-12
                [&::-webkit-scrollbar]:hidden
                [-ms-overflow-style:none]
                [scrollbar-width:none]
              "
            >
              {visiblePlaces.map((place, index) => {
                const priceInfo = priceByPlace.get(getPlaceKey(place));

                return (
                  <AtlasCard
                    key={getPlaceKey(place)}
                    place={place}
                    index={index}
                    price={priceInfo?.amount ?? ""}
                    perPerson={Boolean(priceInfo?.perPerson)}
                    priceLoading={packagesLoading && !priceInfo}
                  />
                );
              })}

              {showViewAll && (
  <ViewAllCard total={allPlaces.length} index={visiblePlaces.length} />
)}

            </div>

            {/* MOBILE SWIPE PROGRESS */}
            {canScroll && (
              <div
                className="
                  mt-1
                  h-0.5
                  overflow-hidden
                  rounded-full
                  bg-champagne/40
                  sm:hidden
                "
                aria-hidden="true"
              >
                <div
                  ref={progressRef}
                  className="
                    h-full
                    w-1/3
                    rounded-full
                    bg-primary
                    will-change-transform
                  "
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}





