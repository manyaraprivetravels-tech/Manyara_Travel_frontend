

import { useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFeaturedHappyMoments } from "../api/content";
import { useQuery } from "../hooks/useQuery";

import { cld, cldSrcSet } from "../utils/cloudinary";

const AUTO_SCROLL_INTERVAL = 2800;
const AUTO_SCROLL_DURATION = 800;

/*
 * Responsive card sizing (must match the gap classes on the scroller):
 * mobile -> 1 card   (gap-5)
 * sm     -> 2 cards  (gap-6 = 24px)
 * lg     -> 4 cards  (gap-7 = 28px)
 */
const CARD_SIZE_CLASSES =
  "min-w-0 shrink-0 grow-0 basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(25%-21px)]";

const CARD_SHELL =
  "overflow-hidden rounded-3xl border border-champagne/60 bg-white shadow-travel-card";

export default function HappyMomentsSection() {
  const navigate = useNavigate();

  const carouselRef = useRef(null);
  const animationFrameRef = useRef(null);
  const autoScrollTimerRef = useRef(null);
  const isPausedRef = useRef(false);
  const reducedMotionRef = useRef(false);

  /* ============================================================
     HAPPY MOMENTS QUERY
     ============================================================ */

  const { data: momentsData, loading, error } = useQuery(
    getFeaturedHappyMoments,
    6
  );

  const moments = Array.isArray(momentsData)
    ? [...momentsData]
        .sort((a, b) => (a?.display_order ?? 0) - (b?.display_order ?? 0))
        .slice(0, 6)
    : [];

  /* ============================================================
     CAROUSEL MEASUREMENTS
     ============================================================ */

  const getCarouselGap = (container) => {
    if (!container) return 0;

    const styles = window.getComputedStyle(container);
    const gap = parseFloat(styles.columnGap || styles.gap || "0");

    return Number.isFinite(gap) ? gap : 0;
  };

  const getMeasurements = () => {
    const container = carouselRef.current;

    if (!container || moments.length === 0) return null;

    const firstCard = container.querySelector("[data-happy-moment-card]");
    if (!firstCard) return null;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const step = cardWidth + getCarouselGap(container);

    return { container, step, setWidth: moments.length * step };
  };

  /* ============================================================
     INFINITE LOOP RESET  ([copy 1] [copy 2] [copy 3])
     ============================================================ */

  const resetInfinitePosition = () => {
    const measurements = getMeasurements();
    if (!measurements) return;

    const { container, setWidth } = measurements;

    if (container.scrollLeft >= setWidth * 2) {
      container.scrollLeft -= setWidth;
    }

    if (container.scrollLeft < setWidth * 0.5) {
      container.scrollLeft += setWidth;
    }
  };

  const alignToNearestCard = () => {
    const measurements = getMeasurements();
    if (!measurements) return;

    const { container, step } = measurements;
    container.scrollLeft = Math.round(container.scrollLeft / step) * step;
  };

  /* ============================================================
     SCROLL ONE CARD (auto or manual, either direction)
     ============================================================ */

  const scheduleNextScroll = () => {
    if (
      isPausedRef.current ||
      reducedMotionRef.current ||
      moments.length === 0
    ) {
      return;
    }

    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }

    autoScrollTimerRef.current = setTimeout(() => {
      scrollByCard(1, false);
    }, AUTO_SCROLL_INTERVAL);
  };

  const scrollByCard = (direction = 1, manual = false) => {
    const measurements = getMeasurements();

    if (!measurements || (!manual && isPausedRef.current)) return;

    // Ignore clicks while a scroll animation is already running.
    if (animationFrameRef.current) return;

    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }

    const { container, step } = measurements;

    const startPosition = container.scrollLeft;
    const targetPosition = startPosition + direction * step;
    const startTime = performance.now();

    const animate = (currentTime) => {
      if (!manual && isPausedRef.current) {
        animationFrameRef.current = null;
        return;
      }

      const progress = Math.min(
        (currentTime - startTime) / AUTO_SCROLL_DURATION,
        1
      );

      // easeInOutCubic: a slower, more graceful glide
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      container.scrollLeft =
        startPosition + (targetPosition - startPosition) * eased;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        resetInfinitePosition();
        scheduleNextScroll();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  /* ============================================================
     PAUSE / RESUME
     ============================================================ */

  const pauseCarousel = () => {
    isPausedRef.current = true;

    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const resumeCarousel = () => {
    isPausedRef.current = false;

    alignToNearestCard();
    scheduleNextScroll();
  };

  /* ============================================================
     EFFECTS
     ============================================================ */

  // Respect reduced-motion preference (autoplay off, arrows still work)
  useEffect(() => {
    reducedMotionRef.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  // Start in the middle copy and begin autoplay
  useEffect(() => {
    if (loading || moments.length === 0) return;

    const frame = requestAnimationFrame(() => {
      const measurements = getMeasurements();
      if (!measurements) return;

      measurements.container.scrollLeft = measurements.setWidth;
      scheduleNextScroll();
    });

    return () => {
      cancelAnimationFrame(frame);

      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, moments.length]);

  // Re-measure on resize
  useEffect(() => {
    if (loading || moments.length === 0) return;

    const handleResize = () => {
      const measurements = getMeasurements();
      if (!measurements) return;

      pauseCarousel();
      measurements.container.scrollLeft = measurements.setWidth;
      isPausedRef.current = false;
      scheduleNextScroll();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, moments.length]);

  // Final cleanup
  useEffect(() => {
    return () => {
      if (autoScrollTimerRef.current) clearTimeout(autoScrollTimerRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /* ============================================================
     NAVIGATION
     ============================================================ */

  const openMoment = (slug) => {
    if (!slug) return;
    navigate(`/happy-moments/${slug}`);
  };

  /* ============================================================
     ERROR / EMPTY
     ============================================================ */

  if (!loading && (error || moments.length === 0)) {
    return null;
  }

  const carouselMoments = [...moments, ...moments, ...moments];

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <section
      id="happy-moments"
      className="relative w-full overflow-x-clip bg-gradient-to-b from-surface via-white to-surface-soft py-16 sm:py-20 lg:py-28"
    >
      {/* Atmosphere: two faint glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(242,88,143,0.10),transparent_70%)]" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(232,210,180,0.35),transparent_70%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =====================================================
            SECTION HEADER
        ====================================================== */}
        <div className="mb-10 text-center sm:mb-12 lg:mb-14">
          <p className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-champagne sm:w-12" />
            Real trips · Real people
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-champagne sm:w-12" />
          </p>

          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-text-display sm:text-5xl lg:text-6xl">
            Happy <span className="font-medium italic">Moments</span>
          </h2>

          <div
            className="mt-5 flex items-center justify-center gap-2.5"
            aria-hidden="true"
          >
            <span className="h-px w-10 bg-champagne" />
            <Heart className="h-3.5 w-3.5 text-accent-bright" fill="currentColor" />
            <span className="h-px w-10 bg-champagne" />
          </div>

          <p className="mx-auto mt-5 max-w-xl px-2 text-[15px] leading-7 text-text-secondary sm:px-0 sm:text-base">
            Cherished memories from travellers who journeyed with Manyara
            Privé Vacations.
          </p>
        </div>

        {/* =====================================================
            LOADING
        ====================================================== */}
        {loading ? (
          <div className="flex gap-5 overflow-hidden py-4 sm:gap-6 lg:gap-7">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className={`${CARD_SIZE_CLASSES} ${CARD_SHELL}`}>
                <div className="aspect-[4/3] w-full animate-pulse bg-surface-strong" />

                <div className="space-y-3 p-5 lg:p-6">
                  <div className="h-5 w-4/5 animate-pulse rounded bg-surface-strong" />
                  <div className="h-px w-10 bg-champagne" />
                  <div className="h-4 w-full animate-pulse rounded bg-surface-strong" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-surface-strong" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* =================================================
                CAROUSEL
            ================================================== */}
            <div
              className="relative -my-4 w-full"
              onMouseEnter={pauseCarousel}
              onMouseLeave={resumeCarousel}
              onFocus={pauseCarousel}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  resumeCarousel();
                }
              }}
            >
              <div
                ref={carouselRef}
                className="flex w-full gap-5 overflow-x-hidden py-4 sm:gap-6 lg:gap-7"
              >
                {carouselMoments.map((moment, index) => {
                  const imageUrl = moment?.image?.url;
                  const placeName = moment?.place_name?.trim();
                  const title = moment?.title?.trim();
                  const shortCaption = moment?.short_caption?.trim();
                  const slug = moment?.slug;

                  return (
                    <article
                      key={`${moment?.id}-${index}`}
                      data-happy-moment-card
                      onClick={() => openMoment(slug)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openMoment(slug);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={
                        title
                          ? `View ${title}`
                          : placeName
                            ? `View happy moment from ${placeName}`
                            : "View happy travel moment"
                      }
                      className={`group ${CARD_SIZE_CLASSES} ${CARD_SHELL} cursor-pointer transition-all duration-500 ease-soft hover:-translate-y-1.5 hover:border-champagne hover:shadow-travel-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface`}
                    >
                      {/* ======================================
                          IMAGE
                      ======================================= */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-strong">
                        {imageUrl ? (
                          <img
                            src={cld(imageUrl, 600)}
                            srcSet={cldSrcSet(imageUrl, [400, 600, 900])}
                            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 35vw, 25vw"
                            loading={index < 4 ? "eager" : "lazy"}
                            decoding="async"
                            alt={
                              title
                                ? `${title} — Manyara Privé Vacations`
                                : placeName
                                  ? `Traveller enjoying a trip in ${placeName} with Manyara Privé Vacations`
                                  : "Happy traveller moment with Manyara Privé Vacations"
                            }
                            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-soft group-hover:scale-[1.06]"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center bg-surface-soft"
                            aria-hidden="true"
                          >
                            <Heart className="h-10 w-10 text-accent/20" />
                          </div>
                        )}

                        {/* Cinematic bottom gradient */}
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent"
                          aria-hidden="true"
                        />

                        {/* Fine inner frame */}
                        <div
                          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
                          aria-hidden="true"
                        />

                        {/* Heart badge */}
                        <span
                          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-accent shadow-travel-card backdrop-blur-sm"
                          aria-hidden="true"
                        >
                          <Heart className="h-4 w-4" fill="currentColor" />
                        </span>

                        {/* Location label */}
                        {placeName && (
                          <p className="absolute inset-x-4 bottom-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white sm:inset-x-5 sm:bottom-5">
                            <MapPin
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">{placeName}</span>
                          </p>
                        )}
                      </div>

                      {/* ======================================
                          CONTENT
                      ======================================= */}
                      <div className="p-5 lg:p-6">
                        {title && (
                          <h3 className="line-clamp-2 font-display text-[22px] font-semibold leading-[1.15] text-text-dark lg:text-2xl">
                            {title}
                          </h3>
                        )}

                        <span
                          className="mt-3 block h-px w-10 bg-champagne"
                          aria-hidden="true"
                        />

                        <p className="mt-3 line-clamp-3 font-display text-[18px] font-medium italic leading-relaxed text-ink-700">
                          {shortCaption
                            ? `\u201C${shortCaption}\u201D`
                            : "A beautiful travel memory with Manyara Privé Vacations."}
                        </p>

                        {/* Footer */}
                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-divider pt-4">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                            Read story
                          </span>

                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-champagne text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white"
                            aria-hidden="true"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* =================================================
                CONTROLS + VIEW ALL
            ================================================== */}
            <div className="mt-10 flex items-center justify-center gap-3 sm:mt-12">
              <button
                type="button"
                onClick={() => scrollByCard(-1, true)}
                aria-label="Previous happy moment"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-champagne bg-white text-primary shadow-travel-card transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/happy-moments")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-white shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 sm:px-7"
              >
                View all moments
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => scrollByCard(1, true)}
                aria-label="Next happy moment"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-champagne bg-white text-primary shadow-travel-card transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
