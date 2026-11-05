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
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sun,
} from "lucide-react";
import { cld, cldSrcSet } from "../utils/cloudinary";

import { getSeasonedDestinations } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { Reveal, useInView } from "./Reveal";

/* =========================================================
   TRAVEL BY SEASON — HOMEPAGE SECTION

   - Same data as the Seasoned destinations page.
   - Cards open /seasoned-destinations/<slug>.
   - Each card shows "Starts from" (starting_from) in a
     white footer strip.
   - Destinations currently in season appear first.
   - Mouse: active on hover. Touch: active briefly on tap.
   - Cards never move up or down: only the image zoom, ring
     and shadow respond, so every card stays on the same line.
========================================================= */

const SEASONAL_BASE = "/seasoned-destinations";
const MAX_CARDS = 8;

/* Section spacing. Change these two values to open or close the gap
   above and below the section (use "py-0" to remove it completely). */
const SECTION_PADDING = "py-6 sm:py-8 lg:py-10";
const HEADER_MARGIN = "mb-6 sm:mb-8";

/* Gaps: gap-4 (16px) on phones, gap-5 (20px) from sm, gap-6 (24px) from lg.
   The basis values below subtract exactly that share of the gaps:
   2 cards -> 20px / 2 = 10px, 4 cards -> 3 x 24px / 4 = 18px. */
const CARD_BASIS =
  "min-w-0 shrink-0 basis-[80%] snap-start sm:basis-[calc(50%-10px)] lg:basis-[calc(25%-18px)]";

const CARD_HEIGHT = "h-[27rem] sm:h-[28rem] lg:h-[29rem]";

const NAV_BUTTON =
  "hidden h-11 w-11 items-center justify-center rounded-full border border-champagne/70 bg-white text-text-dark shadow-travel-card transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 sm:flex";

/* =========================================================
   HELPERS
========================================================= */

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image.trim();

  if (typeof image === "object") {
    return (
      image.secure_url ||
      image.url ||
      image.image_url ||
      image.public_url ||
      ""
    );
  }

  return "";
};

const parseDateOnly = (value) => {
  if (!value) return null;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  // Date-only strings are built locally to avoid timezone shifts.
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatShortDate = (value) => {
  const date = parseDateOnly(value);
  return date ? dateFormatter.format(date) : "";
};

const getSeasonRange = (item) => {
  const start = formatShortDate(item?.season_start_date);
  const end = formatShortDate(item?.season_end_date);

  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;

  return "";
};

const isInSeasonNow = (item, today) => {
  const start = parseDateOnly(item?.season_start_date);
  const end = parseDateOnly(item?.season_end_date);

  if (!start && !end) return false;

  if (start && today < start) return false;

  if (end) {
    end.setHours(23, 59, 59, 999);
    if (today > end) return false;
  }

  return true;
};

/* Backend sends `starting_from` as a Decimal, which JSON turns
   into a string like "45000.00". Returns "₹45,000" or "". */
const getStartingPrice = (item) => {
  const raw = item?.starting_from;

  if (raw === null || raw === undefined || raw === "") return "";

  const num = Number(raw);

  if (!Number.isFinite(num) || num <= 0) return "";

  return `₹${numberFormatter.format(num)}`;
};

const normalizeResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

/* =========================================================
   SEASONAL CARD
========================================================= */

const SeasonalCard = memo(function SeasonalCard({
  item,
  index,
  inSeason,
}) {
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  const placeName =
    typeof item?.place_name === "string" && item.place_name.trim()
      ? item.place_name.trim()
      : "Destination";

  const slug =
    typeof item?.slug === "string" ? item.slug.trim() : "";

  const image = getImageUrl(item?.image);

  const seasonLabel =
    typeof item?.season_label === "string"
      ? item.season_label.trim()
      : "";

  const bestTime =
    typeof item?.best_time_to_visit === "string"
      ? item.best_time_to_visit.trim()
      : "";

  const seasonRange = getSeasonRange(item);
  const price = getStartingPrice(item);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const clearTouchTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerEnter = useCallback((e) => {
    if (e.pointerType !== "touch") setActive(true);
  }, []);

  const handlePointerLeave = useCallback((e) => {
    if (e.pointerType !== "touch") setActive(false);
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      if (e.pointerType !== "touch") return;
      clearTouchTimer();
      setActive(true);
    },
    [clearTouchTimer],
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (e.pointerType !== "touch") return;
      clearTouchTimer();
      timerRef.current = window.setTimeout(() => {
        setActive(false);
        timerRef.current = null;
      }, 900);
    },
    [clearTouchTimer],
  );

  const handlePointerCancel = useCallback(
    (e) => {
      if (e.pointerType !== "touch") return;
      clearTouchTimer();
      setActive(false);
    },
    [clearTouchTimer],
  );

  if (!slug) return null;

  return (
    <div
      data-seasonal-card
      data-active={active ? "true" : "false"}
      className={`${CARD_BASIS} reveal-item group`}
      style={{ "--i": Math.min(index, 6) }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <Link
        to={`${SEASONAL_BASE}/${slug}`}
        aria-label={`${placeName}${seasonLabel ? `, ${seasonLabel}` : ""}${
          price ? `, starts from ${price}` : ""
        }`}
        className={`relative isolate flex ${CARD_HEIGHT} transform-gpu flex-col overflow-hidden rounded-3xl bg-card shadow-travel-card ring-1 ring-divider transition-[box-shadow,--tw-ring-color] duration-500 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group-data-[active=true]:shadow-travel-hover group-data-[active=true]:ring-champagne`}
      >
        {/* =================================================
            IMAGE AREA
        ================================================= */}

        <div className="relative isolate min-h-0 flex-1 overflow-hidden bg-ink">
          {/* Image */}
          <div className="absolute inset-0 -z-20" aria-hidden="true">
            {image ? (
              <img
                src={cld(image, 700)}
                srcSet={cldSrcSet(image, [400, 700, 1000])}
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw"
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-[1400ms] ease-soft group-data-[active=true]:scale-[1.08]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-soft">
                <MapPin className="h-8 w-8 text-placeholder" />
              </div>
            )}
          </div>

          {/* Readability gradient (a little stronger at the bottom so the
              text block stays readable on bright photos) */}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/90 via-ink-900/25 to-ink-900/25"
            aria-hidden="true"
          />

          {/* Champagne light on active */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] h-3/4 bg-[radial-gradient(ellipse_at_50%_110%,rgba(232,210,180,0.4)_0%,transparent_70%)] opacity-0 transition-opacity duration-700 group-data-[active=true]:opacity-100"
            aria-hidden="true"
          />

          {/*
            Season label.
            When the "In season" chip is shown, the label stops short of it:
            100% minus both side insets, the chip (~6.5rem) and a small gap.
          */}
          {seasonLabel && (
            <span
              className={`absolute left-4 top-4 z-20 inline-flex h-8 items-center gap-1.5 rounded-full border border-white/30 bg-ink/50 px-3 text-[13px] font-medium leading-none text-white sm:bg-ink/35 sm:backdrop-blur-md ${
                inSeason
                  ? "max-w-[calc(100%-8.5rem)]"
                  : "max-w-[calc(100%-2rem)]"
              }`}
            >
              <Sun
                className="h-3.5 w-3.5 shrink-0 text-champagne transition-transform duration-700 group-data-[active=true]:rotate-45"
                aria-hidden="true"
              />
              <span className="truncate">{seasonLabel}</span>
            </span>
          )}

          {/* In season */}
          {inSeason && (
            <span className="absolute right-4 top-4 z-20 inline-flex h-8 items-center gap-2 rounded-full bg-champagne px-3 text-[13px] font-semibold leading-none text-ink">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              In season
            </span>
          )}

          {/* Details: name first, then the facts under it, all left aligned */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col p-5 text-left antialiased sm:p-6">
            <h3 className="line-clamp-2 font-display text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.005em] text-white [text-wrap:balance] lg:text-[1.8rem]">
              {placeName}
            </h3>

            {bestTime && (
              <p className="mt-2 flex items-center gap-2 text-[14px] font-medium leading-snug text-champagne">
                <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Best in {bestTime}</span>
              </p>
            )}

            {seasonRange && (
              <p className="mt-1.5 flex items-center gap-2 text-[14px] leading-snug text-white/85">
                <CalendarDays
                  className="h-4 w-4 shrink-0 text-champagne"
                  aria-hidden="true"
                />
                <span className="truncate">Season: {seasonRange}</span>
              </p>
            )}
          </div>
        </div>

        {/* =================================================
            FOOTER — STARTING PRICE + CTA
            Fixed height, so the price strip sits on the same line in
            every card. Price uses Inter (font-sans) with tabular
            lining numerals so six-digit prices such as ₹1,25,000 stay
            level and are not truncated on phones.
        ================================================= */}

        <div className="flex h-[4.75rem] shrink-0 items-center justify-between gap-3 border-t border-champagne/60 bg-card px-5 sm:px-6">
          <div className="min-w-0">
            {price ? (
              <>
                <p className="text-[12px] font-medium leading-none text-muted">
                  Starts from
                </p>

                <p className="mt-1.5 truncate font-sans text-[1.4rem] font-semibold leading-none tracking-tight text-primary tabular-nums sm:text-[1.5rem]">
                  {price}
                </p>
              </>
            ) : (
              <p className="text-[14px] font-medium leading-none text-muted">
                Plan this season
              </p>
            )}
          </div>

          <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-primary/30 bg-primary-lighter px-3.5 text-[14px] font-semibold leading-none text-primary transition-colors duration-300 group-data-[active=true]:border-primary group-data-[active=true]:bg-primary group-data-[active=true]:text-white sm:px-4">
            Explore
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-data-[active=true]:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </div>
  );
});

/* =========================================================
   VIEW ALL TILE
========================================================= */

function ViewAllTile() {
  return (
    <div className={`${CARD_BASIS} reveal-item`} style={{ "--i": 6 }}>
      <Link
        to={SEASONAL_BASE}
        className={`group relative isolate flex ${CARD_HEIGHT} flex-col justify-between overflow-hidden rounded-3xl border border-champagne/70 bg-petal-gradient p-6 text-left shadow-travel-card transition-[border-color,box-shadow] duration-500 ease-soft hover:border-champagne hover:shadow-travel-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-7`}
      >
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 -z-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(232,210,180,0.55)_0%,transparent_70%)] transition-transform duration-700 group-hover:scale-125"
          aria-hidden="true"
        />

        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-champagne bg-white text-primary">
          <Sun className="h-5 w-5" aria-hidden="true" />
        </span>

        <div>
          <p className="text-[14px] font-medium leading-none text-primary">
            Every season
          </p>

          <h3 className="mt-2.5 font-display text-[1.8rem] font-semibold leading-[1.15] tracking-[-0.005em] text-text-display [text-wrap:balance] lg:text-[2rem]">
            See all seasonal destinations
          </h3>

          <p className="mt-2.5 text-[14px] leading-6 text-text-secondary">
            Filter by season, check dates, starting prices and the best
            months to travel.
          </p>

          <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-primary bg-primary px-5 text-[14px] font-semibold leading-none text-white shadow-brand transition-colors duration-300 group-hover:bg-primary-dark">
            View all
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </div>
  );
}

/* =========================================================
   MAIN SECTION
========================================================= */

export default function SeasonalSection() {
  const { data, loading, error } = useQuery(getSeasonedDestinations);

  /* Published only, sorted by display_order, in-season first.
     In-season flag is computed once per item. */
  const places = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list = normalizeResponse(data)
      .filter(
        (item) =>
          item?.slug &&
          (item?.status === undefined || item?.status === "published"),
      )
      .sort(
        (a, b) =>
          Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0),
      )
      .map((item) => ({ item, inSeason: isInSeasonNow(item, today) }));

    return [
      ...list.filter((entry) => entry.inSeason),
      ...list.filter((entry) => !entry.inSeason),
    ].slice(0, MAX_CARDS);
  }, [data]);

  /* -------------------------------------------------------
     CAROUSEL
  ------------------------------------------------------- */

  const carouselRef = useRef(null);
  const progressRef = useRef(null);
  const rafRef = useRef(null);

  const [revealRef, inView] = useInView();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;

    const maxScroll = Math.max(
      0,
      container.scrollWidth - container.clientWidth,
    );
    const current = container.scrollLeft;
    const threshold = 4;

    setCanScrollLeft(current > threshold);
    setCanScrollRight(current < maxScroll - threshold);

    if (progressRef.current) {
      const progress = maxScroll > 0 ? current / maxScroll : 0;
      progressRef.current.style.transform = `translateX(${progress * 200}%)`;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateScrollState();
    });
  }, [updateScrollState]);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return undefined;

    updateScrollState();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollState);
      return () =>
        window.removeEventListener("resize", updateScrollState);
    }

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(container);

    return () => observer.disconnect();
  }, [updateScrollState, places.length, loading]);

  useEffect(
    () => () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const scrollCarousel = useCallback((direction) => {
    const container = carouselRef.current;
    if (!container) return;

    const firstCard = container.querySelector("[data-seasonal-card]");
    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const style = window.getComputedStyle(container);
    const gap =
      parseFloat(style.columnGap || style.gap || "0") || 0;

    container.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }, []);

  /* -------------------------------------------------------
     EMPTY / ERROR — section stays hidden
  ------------------------------------------------------- */

  /* The section only exists when there is at least one published seasonal
     destination. Nothing is drawn (no heading, no skeleton) while the first
     load is pending, when the request fails, or when the list is empty.
     A background refresh keeps showing the current cards. */
  const initialLoading = loading && data == null;

  if (initialLoading) return null;

  if (error && places.length === 0) {
    console.error("Seasonal destinations loading failed:", error);
    return null;
  }

  if (places.length === 0) return null;

  const canScroll = canScrollLeft || canScrollRight;

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section
      id="seasonal-destinations"
      aria-labelledby="seasonal-title"
      className={`relative isolate w-full overflow-x-clip bg-gradient-to-b from-surface-alt to-background antialiased ${SECTION_PADDING}`}
    >
      {/* Top hairline */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne to-transparent"
        aria-hidden="true"
      />

      {/* Soft champagne wash */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(232,210,180,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div
          className={`${HEADER_MARGIN} flex items-end justify-between gap-6`}
        >
          <Reveal className="max-w-2xl text-left">
            <div className="flex items-center gap-2">
              <Sun
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate text-[14px] font-medium leading-none text-primary">
                Travel by season
              </span>
            </div>

            <h2
              id="seasonal-title"
              className="mt-2.5 font-display text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.015em] text-text-display [text-wrap:balance] sm:text-[3rem] lg:text-[3.4rem]"
            >
              The right place for every season
            </h2>

            <p className="mt-2.5 max-w-xl text-[15px] leading-7 text-text-secondary [text-wrap:pretty] sm:text-base">
              Every destination peaks at a different time of year. See
              what is in season now, check starting prices and plan your
              trip around the weather you want.
            </p>

            <Link
              to={SEASONAL_BASE}
              className="group mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-champagne/70 bg-white px-5 text-[14px] font-semibold leading-none text-text-dark transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              View all seasons
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>

          {/* Desktop navigation */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              disabled={!canScrollLeft}
              aria-label="Previous seasonal destinations"
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
              aria-label="Next seasonal destinations"
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

        {/* CAROUSEL */}
        <div
          ref={revealRef}
          data-inview={inView}
          className="relative w-full"
        >
          {/*
            On phones the width is automatic so the negative margins stretch
            the scroller edge to edge (a fixed w-full would ignore them and
            cut the peeking card off early); from sm it is w-full again.
            pt-1 / pb-2 only leave room for the card shadow, which the
            scroll container would otherwise clip.
          */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 items-stretch gap-4 overflow-x-auto scroll-smooth px-4 pb-2 pt-1 sm:mx-0 sm:w-full sm:scroll-pl-0 sm:gap-5 sm:px-1 lg:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {places.map(({ item, inSeason }, index) => (
              <SeasonalCard
                key={item?.id ?? item?.slug}
                item={item}
                index={index}
                inSeason={inSeason}
              />
            ))}

            <ViewAllTile />
          </div>

          {/* Mobile swipe progress */}
          {canScroll && (
            <div
              className="mt-3 h-0.5 overflow-hidden rounded-full bg-champagne/50 sm:hidden"
              aria-hidden="true"
            >
              <div
                ref={progressRef}
                className="h-full w-1/3 rounded-full bg-primary/70 will-change-transform"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}