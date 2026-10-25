

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  IndianRupee,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getUpcomingBatches } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { Reveal, useInView } from "./Reveal";

/* =========================================================
   FORMAT HELPERS
========================================================= */

const formatDate = (dateString) => {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* Day / month / year pieces for the departure-date tile */
const getDateParts = (dateString) => {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    day: date.toLocaleDateString("en-IN", { day: "2-digit" }),
    month: date.toLocaleDateString("en-IN", { month: "short" }),
    year: date.toLocaleDateString("en-IN", { year: "numeric" }),
  };
};

const hasNumericPrice = (price) =>
  price !== null &&
  price !== undefined &&
  price !== "" &&
  !Number.isNaN(Number(price));

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "On Request";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return numericPrice.toLocaleString("en-IN");
};

const getDurationText = (batch) => {
  const days = batch?.duration_days;
  const nights = batch?.duration_nights;

  if (days && nights) {
    return `${days} Days / ${nights} Nights`;
  }

  if (days) {
    return `${days} Days`;
  }

  if (nights) {
    return `${nights} Nights`;
  }

  return "Duration on request";
};

/* =========================================================
   AVAILABILITY
   Small-text colours use the *-text tokens (AA contrast).
========================================================= */

const getAvailabilityLabel = (availability) => {
  switch (availability) {
    case "open":
      return "Available";
    case "limited":
      return "Limited Seats";
    case "almost_full":
      return "Almost Full";
    case "full":
      return "Fully Booked";
    case "closed":
      return "Closed";
    default:
      return "Availability on request";
  }
};

const getAvailabilityClasses = (availability) => {
  switch (availability) {
    case "open":
      return "bg-success-bg text-success-text";
    case "limited":
      return "bg-warning-bg text-warning-text";
    case "almost_full":
      return "bg-primary-lighter text-primary-hover";
    case "full":
      return "bg-error-bg text-error-text";
    case "closed":
    default:
      return "bg-surface-strong text-muted";
  }
};

/* =========================================================
   PACKAGE IMAGE
========================================================= */

const PLACEHOLDER = "/images/placeholder-travel.webp";

const getPackageImage = (batch) => {
  const images = batch?.package?.images ?? [];

  if (!Array.isArray(images) || images.length === 0) {
    return PLACEHOLDER;
  }

  const firstImage = images[0];

  if (typeof firstImage === "string") {
    return firstImage;
  }

  if (firstImage?.url) {
    return firstImage.url;
  }

  return PLACEHOLDER;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function UpcomingBatchesSection() {
  const navigate = useNavigate();

  /*
   * IMPORTANT:
   * Uses the project's custom useQuery cache (NOT TanStack Query).
   * Cached data appears immediately when available, while
   * getUpcomingBatches() refreshes in the background.
   */
  const {
    data,
    error: queryError,
    loading,
  } = useQuery(getUpcomingBatches);

  const batches = Array.isArray(data) ? data : [];

  const error = queryError
    ? "Unable to load upcoming trips right now. Please try again later."
    : "";

  const carouselRef = useRef(null);
  const [revealRef, inView] = useInView();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* =========================================================
     UPDATE CAROUSEL STATE
  ========================================================= */
  const updateScrollState = useCallback(() => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const maxScroll = container.scrollWidth - container.clientWidth;
    const currentScroll = container.scrollLeft;
    const threshold = 4;

    setCanScrollLeft(currentScroll > threshold);
    setCanScrollRight(currentScroll < maxScroll - threshold);
  }, []);

  /* =========================================================
     INITIAL + RESPONSIVE CAROUSEL CHECK
  ========================================================= */
  useEffect(() => {
    if (loading || error || batches.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      updateScrollState();
    });

    window.addEventListener("resize", updateScrollState);
    window.addEventListener("orientationchange", updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollState);
      window.removeEventListener("orientationchange", updateScrollState);
    };
  }, [loading, error, batches.length, updateScrollState]);

  /* =========================================================
     SCROLL CAROUSEL
  ========================================================= */
  const scrollCarousel = (direction) => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const firstCard = container.querySelector("[data-batch-card]");

    if (!firstCard) {
      return;
    }

    const cardWidth = firstCard.getBoundingClientRect().width;
    const computedStyle = window.getComputedStyle(container);
    const gap = parseFloat(computedStyle.columnGap || computedStyle.gap || "0");

    const containerWidth = container.clientWidth;

    const cardsPerView = Math.max(
      1,
      Math.round((containerWidth + gap) / (cardWidth + gap))
    );

    const scrollAmount = (cardWidth + gap) * cardsPerView;

    container.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  /* =========================================================
     BATCH CLICK
  ========================================================= */
  const handleBatchClick = (batch) => {
    if (!batch?.slug) {
      return;
    }

    navigate(`/batches/${encodeURIComponent(batch.slug)}`);
  };

  return (
    <section
      id="upcoming-batches"
      className="relative w-full overflow-x-clip bg-gradient-to-b from-surface-soft to-surface py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =================================================
            SECTION HEADER
        ================================================= */}
        <Reveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <span className="mb-3 inline-flex items-center rounded-full border border-accent-light bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark">
            Upcoming Trips
          </span>

          <h2 className="font-display text-3xl font-semibold leading-tight text-text-dark sm:text-4xl lg:text-5xl">
            Your Next Journey Starts Here
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text sm:text-base">
            Discover our upcoming departures and choose the trip that fits your
            plans. Reserve your spot and get ready for an unforgettable
            experience.
          </p>
        </Reveal>

        {/* =================================================
            LOADING
        ================================================= */}
        {loading && (
          <div className="relative w-full">
            <div className="flex w-full gap-5 overflow-hidden pb-3 sm:gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="min-w-0 shrink-0 basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(25%-18px)]"
                >
                  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-travel-card">
                    <div className="h-56 animate-pulse bg-ink-100" />

                    <div className="space-y-4 p-5">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-ink-100" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-ink-100" />
                      <div className="h-4 w-full animate-pulse rounded bg-ink-100" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-ink-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}
        {!loading && error && (
          <div className="rounded-2xl border border-error/20 bg-error-bg px-6 py-10 text-center">
            <p className="text-sm font-medium text-error-text">{error}</p>
          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}
        {!loading && !error && batches.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-travel-card">
            <CalendarDays
              className="mx-auto mb-4 h-10 w-10 text-muted"
              aria-hidden="true"
            />

            <h3 className="font-display text-lg font-semibold text-text-dark">
              No Upcoming Trips
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
              We don&apos;t have any upcoming departures available at the
              moment. Please check back soon for new trips.
            </p>
          </div>
        )}

        {/* =================================================
            BATCH CAROUSEL
        ================================================= */}
        {!loading && !error && batches.length > 0 && (
          <div
            ref={revealRef}
            data-inview={inView}
            className="relative w-full"
          >
            {/* LEFT CHEVRON */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                aria-label="Previous upcoming trips"
                className="absolute left-0 top-1/2 z-30 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-text-dark shadow-travel-card transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-alt sm:h-12 sm:w-12"
              >
                <ChevronLeft
                  className="h-6 w-6"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </button>
            )}

            {/* HORIZONTAL BATCH CAROUSEL
                pt/pb + negative margins leave room for the hover lift. */}
            <div
              ref={carouselRef}
              onScroll={updateScrollState}
              className="-mb-3 -mt-2 flex w-full snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-6 pt-2 sm:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {batches.map((batch, index) => {
                const packageData = batch?.package;

                const title = packageData?.title || "Travel Package";
                const destination = packageData?.destination || "Destination";
                const image = getPackageImage(batch);
                const departure = getDateParts(batch?.departure_date);
                const priceAvailable = hasNumericPrice(batch?.price_per_person);

                return (
                  <div
                    key={batch?.id}
                    data-batch-card
                    className="card-lift reveal-item min-w-0 shrink-0 basis-full snap-start rounded-2xl sm:basis-[calc(50%-12px)] lg:basis-[calc(25%-18px)]"
                    style={{ "--i": Math.min(index, 6) }}
                  >
                    <article
                      role="button"
                      tabIndex={0}
                      onClick={() => handleBatchClick(batch)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleBatchClick(batch);
                        }
                      }}
                      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-travel-card hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-alt"
                    >
                      {/* ======================================
                          IMAGE
                      ====================================== */}
                      <div className="img-zoom relative h-56 shrink-0">
                        <img
                          src={image}
                          alt={title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = PLACEHOLDER;
                          }}
                        />

                        {/* Soft image overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                        {/* Availability */}
                        <div className="absolute left-4 top-4">
                          <span
                            className={`inline-flex rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${getAvailabilityClasses(
                              batch?.availability
                            )}`}
                          >
                            {getAvailabilityLabel(batch?.availability)}
                          </span>
                        </div>

                        {/* Departure date tile */}
                        {departure && (
                          <div
                            className="absolute right-4 top-4 min-w-[3.25rem] rounded-xl bg-white px-2.5 py-1.5 text-center shadow-travel-card"
                            aria-hidden="true"
                          >
                            <p className="text-[0.65rem] font-semibold uppercase leading-none tracking-wider text-primary">
                              {departure.month}
                            </p>
                            <p className="mt-1 font-display text-2xl font-semibold leading-none text-text-dark">
                              {departure.day}
                            </p>
                          </div>
                        )}

                        {/* Destination */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5 text-sm font-medium text-white">
                          <MapPin
                            className="h-4 w-4 shrink-0 text-accent-light"
                            aria-hidden="true"
                          />
                          <span className="truncate">{destination}</span>
                        </div>
                      </div>

                      {/* ======================================
                          CARD CONTENT
                      ====================================== */}
                      <div className="flex flex-1 flex-col p-5">
                        {/* Package Title */}
                        <h3 className="line-clamp-2 min-h-[3.5rem] font-display text-lg font-semibold leading-7 text-text-dark transition-colors group-hover:text-accent-dark">
                          {title}
                        </h3>

                        {/* Batch Details */}
                        <div className="mt-3 space-y-2.5">
                          {/* Dates */}
                          <div className="flex items-center gap-2.5 text-sm font-medium text-text-dark">
                            <CalendarDays
                              className="h-4 w-4 shrink-0 text-accent"
                              aria-hidden="true"
                            />
                            <span>
                              {formatDate(batch?.departure_date)}
                              {" – "}
                              {formatDate(batch?.return_date)}
                            </span>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-2.5 text-sm text-text">
                            <Clock3
                              className="h-4 w-4 shrink-0 text-accent"
                              aria-hidden="true"
                            />
                            <span>{getDurationText(batch)}</span>
                          </div>
                        </div>

                        {/* ======================================
                            TICKET STUB: price + arrow
                            dashed divider = perforation
                        ====================================== */}
                        <div className="mt-auto flex items-end justify-between border-t border-dashed border-border-strong pt-4">
                          <div>
                            <p className="text-xs font-medium text-muted">
                              Starting from
                            </p>

                            <div className="mt-1 flex items-center">
                              {priceAvailable && (
                                <IndianRupee
                                  className="h-4 w-4 text-text-dark"
                                  aria-hidden="true"
                                />
                              )}

                              <span className="text-lg font-bold text-text-dark">
                                {formatPrice(batch?.price_per_person)}
                              </span>

                              {priceAvailable && (
                                <span className="ml-1 text-xs text-muted">
                                  / person
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-soft text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                            <ArrowRight
                              className="arrow-shift h-5 w-5"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>

            {/* RIGHT CHEVRON */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                aria-label="Next upcoming trips"
                className="absolute right-0 top-1/2 z-30 flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-text-dark shadow-travel-card transition-all duration-200 hover:scale-105 hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-alt sm:h-12 sm:w-12"
              >
                <ChevronRight
                  className="h-6 w-6"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


