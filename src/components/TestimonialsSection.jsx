

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Star,
  Quote,
  MessageSquareHeart,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getTestimonials } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import ReviewFormModal from "./ReviewFormModal";
import { cld, cldSrcSet } from "../utils/cloudinary";
/* =========================================================
   CONSTANTS
========================================================= */

const CARD_BASIS =
  "min-w-0 shrink-0 basis-[88%] snap-start lg:basis-[calc(50%-14px)]";

const CARD_RADIUS = "rounded-[1.75rem] sm:rounded-[2rem]";

const NAV_BUTTON =
  "flex h-12 w-12 items-center justify-center rounded-full border border-champagne/70 bg-white text-text-dark shadow-travel-card transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const TEXT_LINK =
  "inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-text-dark transition-colors duration-300 hover:text-primary";

/* =========================================================
   HELPERS
========================================================= */

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") return image.trim();

  return (
    image?.secure_url ||
    image?.url ||
    image?.image_url ||
    image?.src ||
    ""
  );
}

function getInitials(name) {
  return (
    name
      ?.trim()
      ?.split(/\s+/)
      ?.map((part) => part[0])
      ?.slice(0, 2)
      ?.join("")
      ?.toUpperCase() || "TR"
  );
}

/* Supports: [...], { items }, { data }, { data: { items } }, { results } */
function normalizeTestimonials(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/* =========================================================
   STAR RATING
========================================================= */

const Stars = memo(function Stars({ rating }) {
  const safeRating = Math.min(5, Math.max(0, Number(rating) || 0));

  return (
    <div
      className="flex items-center gap-0.5 text-accent"
      aria-label={`${safeRating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="h-4 w-4"
          fill={star <= safeRating ? "currentColor" : "none"}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      ))}
    </div>
  );
});

/* =========================================================
   TESTIMONIAL CARD

   Photo on the left, review on the right (stacked on phones).
   Mouse: active on hover. Touch: active briefly on tap.
========================================================= */

const TestimonialCard = memo(function TestimonialCard({ item, index }) {
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  const name = item?.customer_name || "Traveller";
  const city = item?.customer_city || "";
  const destination = item?.destination || "";
  const review = item?.review || "A wonderful travel experience.";
  const imageUrl = getImageUrl(
    item?.image ?? item?.customer_image ?? item?.photo,
  );
  const initials = getInitials(name);
  const reviewSlug = item?.slug;

  const hasRating = Number(item?.rating) > 0;

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

  return (
    <div
      data-active={active ? "true" : "false"}
      data-testimonial-card
      className={`${CARD_BASIS} group`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <Link
        to={reviewSlug ? `/reviews/${reviewSlug}` : "/reviews"}
        aria-label={`Read ${name}'s review`}
        className={`block h-full w-full ${CARD_RADIUS} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4`}
      >
        <article
          className={`relative flex h-full w-full flex-col overflow-hidden border border-champagne/60 bg-white shadow-travel-card transition-[transform,box-shadow,border-color] duration-500 ease-soft sm:min-h-[22rem] sm:flex-row ${CARD_RADIUS} group-data-[active=true]:-translate-y-1.5 group-data-[active=true]:border-champagne group-data-[active=true]:shadow-travel-hover`}
        >
          {/* =================================================
              CUSTOMER PHOTO
          ================================================= */}

          <div className="relative isolate h-56 shrink-0 overflow-hidden bg-champagne-light sm:h-auto sm:w-[40%]">
            {imageUrl ? (
              <img
                src={cld(imageUrl, 700)}
                srcSet={cldSrcSet(imageUrl, [400, 700, 1000])}
                sizes="(max-width: 640px) 100vw, 40vw"
                alt={`${name}${destination ? ` in ${destination}` : ""}`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-soft group-data-[active=true]:scale-[1.08]"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-champagne-light to-champagne"
                aria-hidden="true"
              >
                <span className="font-display text-6xl font-medium italic text-primary/80">
                  {initials}
                </span>
              </div>
            )}

            {/* Readability gradient for the destination chip */}
            {destination && (
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900/70 to-transparent"
                aria-hidden="true"
              />
            )}

            {/* Destination chip */}
            {destination && (
              <span className="absolute bottom-3 left-3 right-3 inline-flex max-w-full items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
                <MapPin
                  className="h-3.5 w-3.5 shrink-0 text-champagne"
                  aria-hidden="true"
                />
                <span className="truncate">{destination}</span>
              </span>
            )}
          </div>

          {/* =================================================
              REVIEW
          ================================================= */}

          <div className="relative flex min-w-0 flex-1 flex-col p-5 sm:p-6">
            <Quote
              className="pointer-events-none absolute right-4 top-4 h-9 w-9 text-champagne/70 transition-colors duration-500 group-data-[active=true]:text-primary/15 sm:right-5 sm:top-5"
              aria-hidden="true"
            />

            {hasRating && (
              <div className="relative z-10">
                <Stars rating={item?.rating} />
              </div>
            )}

            <p className="relative z-10 mt-3 line-clamp-6 flex-1 font-display text-[1.1rem] font-medium leading-[1.55] tracking-[-0.005em] text-text-display sm:text-[1.15rem]">
              “{review}”
            </p>

            {/* Customer */}
            <div className="relative z-10 mt-5 flex min-w-0 items-center gap-3 border-t border-champagne/60 pt-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[1.05rem] font-semibold leading-tight text-text-display">
                  {name}
                </p>

                {city && (
                  <p className="mt-0.5 truncate text-xs leading-5 text-text-secondary sm:text-sm">
                    {city}
                  </p>
                )}
              </div>

              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-champagne bg-white text-primary transition-all duration-500 group-data-[active=true]:border-primary group-data-[active=true]:bg-primary group-data-[active=true]:text-white group-data-[active=true]:shadow-brand"
                aria-hidden="true"
              >
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
});

/* =========================================================
   SKELETON
========================================================= */

function TestimonialSkeleton() {
  return (
    <div className={CARD_BASIS} aria-hidden="true">
      <div
        className={`flex min-h-[22rem] animate-pulse flex-col overflow-hidden border border-champagne/40 bg-white sm:flex-row ${CARD_RADIUS}`}
      >
        <div className="h-56 bg-surface-strong sm:h-auto sm:w-[40%]" />

        <div className="flex-1 p-5 sm:p-6">
          <div className="h-4 w-28 rounded bg-surface-strong" />

          <div className="mt-6 space-y-3">
            <div className="h-4 w-full rounded bg-surface-strong" />
            <div className="h-4 w-11/12 rounded bg-surface-strong" />
            <div className="h-4 w-4/5 rounded bg-surface-strong" />
          </div>

          <div className="mt-10 space-y-2 border-t border-champagne/40 pt-4">
            <div className="h-3 w-24 rounded bg-surface-strong" />
            <div className="h-3 w-32 rounded bg-surface-strong" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN SECTION
========================================================= */

export default function TestimonialsSection() {
  const [reviewOpen, setReviewOpen] = useState(false);

  const carouselRef = useRef(null);

  const { data, loading, error } = useQuery(getTestimonials);

  const testimonials = useMemo(
    () => normalizeTestimonials(data).filter(Boolean),
    [data],
  );

  useEffect(() => {
    if (error && !loading && testimonials.length === 0) {
      console.error("Testimonials loading failed:", error);
    }
  }, [error, loading, testimonials.length]);

  const openReviewForm = useCallback(() => setReviewOpen(true), []);
  const closeReviewForm = useCallback(() => setReviewOpen(false), []);

  const scrollCarousel = useCallback((direction) => {
    const container = carouselRef.current;
    if (!container) return;

    const firstCard = container.querySelector("[data-testimonial-card]");
    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const style = window.getComputedStyle(container);
    const gap = parseFloat(style.columnGap || style.gap || "0") || 0;

    container.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }, []);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="relative isolate w-full overflow-x-clip bg-gradient-to-b from-surface-alt via-champagne-light/30 to-surface-soft py-14 antialiased [contain-intrinsic-size:auto_760px] [content-visibility:auto] sm:py-20 lg:py-24"
    >
      {/* Top champagne line */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne to-transparent"
        aria-hidden="true"
      />

      {/* Background glow */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(200,19,94,0.055)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8 flex items-end justify-between gap-6 sm:mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span
                className="h-px w-8 shrink-0 bg-champagne"
                aria-hidden="true"
              />

              <MessageSquareHeart
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />

              <span className="truncate text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
                Real trips, real words
              </span>
            </div>

            <h2
              id="testimonials-title"
              className="mt-4 font-display text-[2.6rem] font-medium leading-[1.03] tracking-[-0.015em] text-text-display [text-wrap:balance] sm:text-[3.25rem] lg:text-[3.75rem]"
            >
              Traveller{" "}
              <em className="font-medium italic text-primary">Stories</em>
            </h2>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-secondary sm:text-base sm:leading-7">
              Real words from real travellers, with their own photos, who
              explored with Manyara Prive Vacations.
            </p>
          </div>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            {testimonials.length > 0 && (
              <Link to="/reviews" className={`mr-2 ${TEXT_LINK}`}>
                View Reviews
                <ArrowRight
                  className="h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />
              </Link>
            )}

            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              aria-label="Previous testimonials"
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
              aria-label="Next testimonials"
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

        {/* Mobile review button */}
        <div className="mb-6 sm:hidden">
          <button
            type="button"
            onClick={openReviewForm}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-300 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
            Share Your Experience
          </button>
        </div>

        {/* LOADING / EMPTY / CAROUSEL */}
        {loading && testimonials.length === 0 ? (
          <div
            className="-mx-4 flex gap-5 overflow-hidden px-4 sm:mx-0 sm:gap-7 sm:px-0"
            role="status"
            aria-label="Loading traveller stories"
          >
            {[1, 2].map((item) => (
              <TestimonialSkeleton key={item} />
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <div className="rounded-3xl border border-champagne/70 bg-white p-8 text-center shadow-travel-card sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-champagne-light text-primary">
              <MessageSquareHeart className="h-7 w-7" aria-hidden="true" />
            </div>

            <h3 className="mt-5 font-display text-2xl font-medium text-text-display">
              Be the first to share your journey
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-secondary">
              Your experience can help other travellers discover their next
              escape.
            </p>

            <button
              type="button"
              onClick={openReviewForm}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
              Write a Review
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            {error && (
              <p className="mt-4 text-xs text-text-secondary/70">
                Reviews are temporarily unavailable.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="relative">
              <div
                ref={carouselRef}
                className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-6 pt-3 [scrollbar-width:none] sm:mx-0 sm:gap-7 sm:px-1 sm:pb-8 [&::-webkit-scrollbar]:hidden"
              >
                {testimonials.map((testimonial, index) => (
                  <TestimonialCard
                    key={
                      testimonial?.id ??
                      testimonial?.slug ??
                      `${testimonial?.customer_name ?? "review"}-${index}`
                    }
                    item={testimonial}
                    index={index}
                  />
                ))}
              </div>

              {/* Mobile swipe hint */}
              {testimonials.length > 1 && (
                <div
                  className="mt-1 flex items-center justify-center gap-2 sm:hidden"
                  aria-hidden="true"
                >
                  <span className="h-px w-8 bg-champagne" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-secondary">
                    Swipe
                  </span>
                  <span className="h-px w-8 bg-champagne" />
                </div>
              )}
            </div>

            {/* Mobile view all */}
            <div className="mt-6 flex justify-center sm:hidden">
              <Link to="/reviews" className={TEXT_LINK}>
                View All Reviews
                <ArrowRight
                  className="h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </>
        )}

        {/* Desktop review CTA */}
        {testimonials.length > 0 && (
          <div className="mt-6 hidden justify-center sm:flex lg:mt-8">
            <button
              type="button"
              onClick={openReviewForm}
              className="group inline-flex items-center gap-2.5 rounded-full border border-champagne bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-text-dark shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white hover:shadow-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <MessageSquareHeart
                className="h-4 w-4 text-primary transition-colors duration-300 group-hover:text-white"
                aria-hidden="true"
              />
              Share Your Experience
              <ArrowRight
                className="h-3.5 w-3.5 text-primary transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>

      <ReviewFormModal open={reviewOpen} onClose={closeReviewForm} />
    </section>
  );
}


























































// import {
//   memo,
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import {
//   Star,
//   Quote,
//   MessageSquareHeart,
//   ArrowRight,
//   ArrowUpRight,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import { Link } from "react-router-dom";

// import { getTestimonials } from "../api/content";
// import { useQuery } from "../hooks/useQuery";
// import ReviewFormModal from "./ReviewFormModal";

// /* =========================================================
//    CONSTANTS
// ========================================================= */

// const CARD_BASIS =
//   "min-w-0 shrink-0 basis-[88%] snap-start sm:basis-[calc(50%-12px)] lg:basis-[calc(25%-21px)]";

// const CARD_RADIUS =
//   "rounded-t-[2rem] rounded-b-[1.5rem] sm:rounded-t-[2.5rem] sm:rounded-b-[1.75rem]";

// /* =========================================================
//    HELPERS
// ========================================================= */

// /*
//  * Desktop:
//  *   Active while the pointer is over the card.
//  *
//  * Tablet / Mobile:
//  *   Active when the card is sufficiently visible in the
//  *   viewport. This gives touch devices the same visual
//  *   reaction without depending on :hover.
//  */
// function isHoverDevice() {
//   return (
//     typeof window !== "undefined" &&
//     typeof window.matchMedia === "function" &&
//     window.matchMedia("(hover: hover) and (pointer: fine)").matches
//   );
// }

// function useCardActive(ref) {
//   const [active, setActive] = useState(false);

//   useEffect(() => {
//     const element = ref.current;

//     if (!element) return undefined;

//     if (isHoverDevice()) {
//       const handleEnter = () => setActive(true);
//       const handleLeave = () => setActive(false);

//       element.addEventListener("mouseenter", handleEnter);
//       element.addEventListener("mouseleave", handleLeave);

//       return () => {
//         element.removeEventListener("mouseenter", handleEnter);
//         element.removeEventListener("mouseleave", handleLeave);
//       };
//     }

//     if (typeof IntersectionObserver === "undefined") {
//       return undefined;
//     }

//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         setActive(entry.isIntersecting);
//       },
//       {
//         rootMargin: "-25% -12% -25% -12%",
//         threshold: 0.25,
//       }
//     );

//     observer.observe(element);

//     return () => observer.disconnect();
//   }, [ref]);

//   return active;
// }

// function getImageUrl(image) {
//   if (!image) return "";

//   if (typeof image === "string") {
//     return image;
//   }

//   return image?.url || image?.src || "";
// }

// function getInitials(name) {
//   return (
//     name
//       ?.trim()
//       ?.split(/\s+/)
//       ?.map((part) => part[0])
//       ?.slice(0, 2)
//       ?.join("")
//       ?.toUpperCase() || "TR"
//   );
// }

// /*
//  * Supports common API response structures:
//  *
//  * [...]
//  * { items: [...] }
//  * { data: [...] }
//  * { data: { items: [...] } }
//  * { results: [...] }
//  */
// function normalizeTestimonials(data) {
//   if (Array.isArray(data)) {
//     return data;
//   }

//   if (Array.isArray(data?.items)) {
//     return data.items;
//   }

//   if (Array.isArray(data?.data)) {
//     return data.data;
//   }

//   if (Array.isArray(data?.data?.items)) {
//     return data.data.items;
//   }

//   if (Array.isArray(data?.results)) {
//     return data.results;
//   }

//   return [];
// }

// /* =========================================================
//    STAR RATING
// ========================================================= */

// const Stars = memo(function Stars({ rating }) {
//   const safeRating = Math.min(
//     5,
//     Math.max(0, Number(rating) || 0)
//   );

//   return (
//     <div
//       className="flex items-center gap-0.5 text-accent"
//       aria-label={`${safeRating} out of 5 stars`}
//     >
//       {[1, 2, 3, 4, 5].map((star) => (
//         <Star
//           key={star}
//           className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
//           fill={star <= safeRating ? "currentColor" : "none"}
//           strokeWidth={1.7}
//           aria-hidden="true"
//         />
//       ))}
//     </div>
//   );
// });

// /* =========================================================
//    TESTIMONIAL CARD
// ========================================================= */

// const TestimonialCard = memo(function TestimonialCard({
//   item,
//   index,
// }) {
//   const cardRef = useRef(null);
//   const active = useCardActive(cardRef);

//   const name = item?.customer_name || "Traveller";
//   const city = item?.customer_city || "Traveller";
//   const destination = item?.destination || "";
//   const review = item?.review || "A wonderful travel experience.";
//   const imageUrl = getImageUrl(item?.image);
//   const initials = getInitials(name);
//   const reviewSlug = item?.slug;

//   const number = String(index + 1).padStart(2, "0");

//   return (
//     <div
//       ref={cardRef}
//       data-active={active}
//       data-testimonial-card
//       className={`${CARD_BASIS} group`}
//     >
//       <Link
//         to={reviewSlug ? `/reviews/${reviewSlug}` : "/reviews"}
//         aria-label={`Read ${name}'s review`}
//         className="
//           block
//           h-full
//           w-full
//           rounded-[2rem]
//           focus:outline-none
//           focus-visible:ring-2
//           focus-visible:ring-accent
//           focus-visible:ring-offset-4
//         "
//       >
//         <article
//           className={`
//             relative
//             flex
//             min-h-[340px]
//             w-full
//             flex-col
//             overflow-hidden
//             border
//             border-champagne/60
//             bg-white
//             p-5
//             shadow-travel-card
//             transition-[transform,box-shadow,border-color]
//             duration-500
//             ease-soft
//             ${CARD_RADIUS}
//             group-data-[active=true]:-translate-y-2
//             group-data-[active=true]:border-accent/40
//             group-data-[active=true]:shadow-[0_28px_55px_-24px_rgba(200,19,94,0.35)]
//             sm:min-h-[350px]
//             sm:p-6
//             lg:min-h-[365px]
//           `}
//         >
//           {/* =================================================
//               DECORATIVE QUOTE
//           ================================================= */}

//           <Quote
//             className="
//               pointer-events-none
//               absolute
//               right-5
//               top-5
//               h-10
//               w-10
//               text-champagne/60
//               transition-all
//               duration-500
//               group-data-[active=true]:scale-110
//               group-data-[active=true]:text-accent/15
//               sm:right-6
//               sm:top-6
//               sm:h-11
//               sm:w-11
//             "
//             aria-hidden="true"
//           />

//           {/* =================================================
//               NUMBER + LABEL
//           ================================================= */}

//           <div className="relative z-10 flex items-center gap-3">
//             <span
//               className="
//                 font-display
//                 text-base
//                 font-medium
//                 italic
//                 leading-none
//                 text-accent
//                 sm:text-lg
//               "
//             >
//               N° {number}
//             </span>

//             <span
//               className="
//                 h-px
//                 flex-1
//                 bg-champagne
//                 transition-colors
//                 duration-500
//                 group-data-[active=true]:bg-accent/50
//               "
//               aria-hidden="true"
//             />

//             <Stars rating={item?.rating} />
//           </div>

//           {/* =================================================
//               REVIEW
//           ================================================= */}

//           <div className="relative z-10 mt-5 flex-1 sm:mt-6">
//             <p
//               className="
//                 line-clamp-6
//                 pr-4
//                 font-display
//                 text-[1.08rem]
//                 font-medium
//                 leading-[1.55]
//                 tracking-[-0.01em]
//                 text-text-display
//                 sm:text-[1.18rem]
//                 sm:leading-[1.6]
//               "
//             >
//               “{review}”
//             </p>
//           </div>

//           {/* =================================================
//               CUSTOMER
//           ================================================= */}

//           <div
//             className="
//               relative
//               z-10
//               mt-6
//               flex
//               min-w-0
//               items-center
//               gap-3
//               border-t
//               border-champagne/60
//               pt-4
//               sm:mt-7
//               sm:pt-5
//             "
//           >
//             {/* Profile image */}

//             {imageUrl ? (
//               <img
//                 src={imageUrl}
//                 alt={`${name} profile`}
//                 loading={index < 2 ? "eager" : "lazy"}
//                 decoding="async"
//                 fetchPriority={index === 0 ? "high" : "low"}
//                 width="48"
//                 height="48"
//                 draggable={false}
//                 className="
//                   h-11
//                   w-11
//                   shrink-0
//                   rounded-full
//                   border
//                   border-champagne
//                   object-cover
//                   transition-transform
//                   duration-500
//                   group-data-[active=true]:scale-105
//                   sm:h-12
//                   sm:w-12
//                 "
//               />
//             ) : (
//               <div
//                 className="
//                   flex
//                   h-11
//                   w-11
//                   shrink-0
//                   items-center
//                   justify-center
//                   rounded-full
//                   border
//                   border-champagne
//                   bg-champagne-light
//                   font-display
//                   text-sm
//                   font-medium
//                   text-accent
//                   sm:h-12
//                   sm:w-12
//                 "
//                 aria-hidden="true"
//               >
//                 {initials}
//               </div>
//             )}

//             {/* Name */}

//             <div className="min-w-0 flex-1">
//               <p
//                 className="
//                   truncate
//                   font-display
//                   text-base
//                   font-medium
//                   leading-tight
//                   text-text-display
//                   sm:text-[17px]
//                 "
//               >
//                 {name}
//               </p>

//               <p
//                 className="
//                   mt-1
//                   truncate
//                   text-xs
//                   leading-5
//                   text-text-secondary
//                   sm:text-sm
//                 "
//               >
//                 {city}

//                 {destination && (
//                   <>
//                     <span className="mx-1.5 text-champagne">·</span>
//                     {destination}
//                   </>
//                 )}
//               </p>
//             </div>

//             {/* Arrow */}

//             <span
//               className="
//                 flex
//                 h-9
//                 w-9
//                 shrink-0
//                 items-center
//                 justify-center
//                 rounded-full
//                 border
//                 border-champagne
//                 bg-white
//                 text-accent
//                 transition-all
//                 duration-500
//                 group-data-[active=true]:border-accent
//                 group-data-[active=true]:bg-accent
//                 group-data-[active=true]:text-white
//                 group-data-[active=true]:shadow-brand
//               "
//               aria-hidden="true"
//             >
//               <ArrowUpRight
//                 className="
//                   h-4
//                   w-4
//                   transition-transform
//                   duration-500
//                   group-data-[active=true]:rotate-3
//                 "
//               />
//             </span>
//           </div>

//           {/* =================================================
//               SUBTLE ACTIVE GLOW
//           ================================================= */}

//           <div
//             className="
//               pointer-events-none
//               absolute
//               -right-20
//               -top-20
//               h-40
//               w-40
//               rounded-full
//               bg-accent/10
//               opacity-0
//               blur-3xl
//               transition-opacity
//               duration-700
//               group-data-[active=true]:opacity-100
//             "
//             aria-hidden="true"
//           />
//         </article>
//       </Link>
//     </div>
//   );
// });

// /* =========================================================
//    SKELETON
// ========================================================= */

// function TestimonialSkeleton() {
//   return (
//     <div className={CARD_BASIS} aria-hidden="true">
//       <div
//         className={`
//           min-h-[340px]
//           animate-pulse
//           border
//           border-champagne/40
//           bg-white
//           ${CARD_RADIUS}
//           sm:min-h-[350px]
//         `}
//       >
//         <div className="p-5 sm:p-6">
//           <div className="h-4 w-28 rounded bg-surface-strong" />
//           <div className="mt-8 space-y-3">
//             <div className="h-4 w-full rounded bg-surface-strong" />
//             <div className="h-4 w-11/12 rounded bg-surface-strong" />
//             <div className="h-4 w-4/5 rounded bg-surface-strong" />
//           </div>

//           <div className="mt-16 flex items-center gap-3 border-t border-champagne/40 pt-5">
//             <div className="h-12 w-12 rounded-full bg-surface-strong" />
//             <div className="space-y-2">
//               <div className="h-3 w-24 rounded bg-surface-strong" />
//               <div className="h-3 w-32 rounded bg-surface-strong" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    MAIN SECTION
// ========================================================= */

// export default function TestimonialsSection() {
//   const [reviewOpen, setReviewOpen] = useState(false);

//   const carouselRef = useRef(null);

//   const { data, loading, error } = useQuery(getTestimonials);

//   /* =========================================================
//      NORMALIZE + CLEAN DATA
//   ========================================================= */

//   const testimonials = useMemo(() => {
//     const list = normalizeTestimonials(data);

//     return list.filter(Boolean);
//   }, [data]);

//   /* =========================================================
//      DEBUG
     
//      Keep this while testing. Remove after confirming the API.
//   ========================================================= */

//   useEffect(() => {
//     if (error) {
//       console.error("Testimonials API error:", error);
//     }

//     if (data !== undefined) {
//       console.log("Testimonials API response:", data);
//       console.log("Normalized testimonials:", testimonials);
//     }
//   }, [data, error, testimonials]);

//   /* =========================================================
//      REVIEW MODAL
//   ========================================================= */

//   const openReviewForm = useCallback(() => {
//     setReviewOpen(true);
//   }, []);

//   const closeReviewForm = useCallback(() => {
//     setReviewOpen(false);
//   }, []);

//   /* =========================================================
//      CAROUSEL
//   ========================================================= */

//   const scrollCarousel = useCallback((direction) => {
//     const container = carouselRef.current;

//     if (!container) return;

//     const firstCard = container.querySelector(
//       "[data-testimonial-card]"
//     );

//     if (!firstCard) return;

//     const cardWidth = firstCard.getBoundingClientRect().width;

//     const style = window.getComputedStyle(container);

//     const gap =
//       parseFloat(style.columnGap || style.gap || "0") || 0;

//     const amount = cardWidth + gap;

//     container.scrollBy({
//       left: direction === "right" ? amount : -amount,
//       behavior: "smooth",
//     });
//   }, []);

//   /* =========================================================
//      ERROR
     
//      IMPORTANT:
//      Never silently remove the entire section.
//   ========================================================= */

//   if (error && !loading && testimonials.length === 0) {
//     console.error("Testimonials loading failed:", error);
//   }

//   /* =========================================================
//      RENDER
//   ========================================================= */

//   return (
//     <section
//       id="testimonials"
//       aria-labelledby="testimonials-title"
//       className="
//         relative
//         isolate
//         w-full
//         overflow-x-clip
//         bg-gradient-to-b
//         from-surface-alt
//         via-champagne-light/30
//         to-surface-soft
//         py-16
//         antialiased
//         sm:py-24
//         lg:py-28
//       "
//     >
//       {/* Top champagne line */}

//       <div
//         className="
//           absolute
//           inset-x-0
//           top-0
//           h-px
//           bg-gradient-to-r
//           from-transparent
//           via-champagne
//           to-transparent
//         "
//         aria-hidden="true"
//       />

//       {/* Background glow */}

//       <div
//         className="
//           absolute
//           inset-0
//           -z-10
//           bg-[radial-gradient(ellipse_at_15%_0%,rgba(200,19,94,0.055)_0%,transparent_55%)]
//         "
//         aria-hidden="true"
//       />

//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         {/* =================================================
//             HEADER
//         ================================================= */}

//         <div
//           className="
//             mb-10
//             flex
//             items-end
//             justify-between
//             gap-6
//             sm:mb-14
//           "
//         >
//           <div className="max-w-2xl">
//             {/* Eyebrow */}

//             <div className="flex items-center gap-3">
//               <span
//                 className="h-px w-8 shrink-0 bg-champagne"
//                 aria-hidden="true"
//               />

//               <MessageSquareHeart
//                 className="h-4 w-4 shrink-0 text-primary"
//                 aria-hidden="true"
//               />

//               <span
//                 className="
//                   truncate
//                   text-[11px]
//                   font-medium
//                   uppercase
//                   tracking-[0.24em]
//                   text-primary
//                   sm:text-xs
//                 "
//               >
//                 Real trips, real words
//               </span>
//             </div>

//             {/* Heading */}

//             <h2
//               id="testimonials-title"
//               className="
//                 mt-4
//                 font-display
//                 text-[2.6rem]
//                 font-medium
//                 leading-[1.03]
//                 tracking-[-0.015em]
//                 text-text-display
//                 [text-wrap:balance]
//                 sm:text-[3.25rem]
//                 lg:text-[3.75rem]
//               "
//             >
//               Traveller{" "}
//               <em className="font-medium italic text-primary">
//                 Stories
//               </em>
//             </h2>

//             {/* Description */}

//             <p
//               className="
//                 mt-4
//                 max-w-xl
//                 text-[15px]
//                 leading-relaxed
//                 text-text-secondary
//                 sm:text-base
//                 sm:leading-7
//               "
//             >
//               Real experiences from travellers who explored
//               destinations with On a Trip Holiday.
//             </p>
//           </div>

//           {/* =================================================
//               DESKTOP ACTIONS
//           ================================================= */}

//           <div className="hidden shrink-0 items-center gap-3 sm:flex">
//             {testimonials.length > 0 && (
//               <Link
//                 to="/reviews"
//                 className="
//                   mr-2
//                   inline-flex
//                   items-center
//                   gap-2
//                   text-[12px]
//                   font-semibold
//                   uppercase
//                   tracking-[0.18em]
//                   text-text-dark
//                   transition-colors
//                   duration-300
//                   hover:text-primary
//                 "
//               >
//                 <span className="relative pb-1">
//                   View Reviews

//                   <span
//                     className="
//                       absolute
//                       inset-x-0
//                       bottom-0
//                       h-px
//                       origin-left
//                       scale-x-0
//                       bg-primary
//                       transition-transform
//                       duration-500
//                       hover:scale-x-100
//                     "
//                     aria-hidden="true"
//                   />
//                 </span>

//                 <ArrowRight
//                   className="h-3.5 w-3.5 text-primary"
//                   aria-hidden="true"
//                 />
//               </Link>
//             )}

//             <button
//               type="button"
//               onClick={() => scrollCarousel("left")}
//               aria-label="Previous testimonials"
//               className="
//                 flex
//                 h-12
//                 w-12
//                 items-center
//                 justify-center
//                 rounded-full
//                 border
//                 border-champagne/70
//                 bg-white
//                 text-text-dark
//                 shadow-travel-card
//                 transition-all
//                 duration-300
//                 hover:border-primary
//                 hover:bg-primary
//                 hover:text-white
//                 focus:outline-none
//                 focus-visible:ring-2
//                 focus-visible:ring-primary
//                 focus-visible:ring-offset-2
//               "
//             >
//               <ChevronLeft
//                 className="h-5 w-5"
//                 strokeWidth={2.25}
//                 aria-hidden="true"
//               />
//             </button>

//             <button
//               type="button"
//               onClick={() => scrollCarousel("right")}
//               aria-label="Next testimonials"
//               className="
//                 flex
//                 h-12
//                 w-12
//                 items-center
//                 justify-center
//                 rounded-full
//                 border
//                 border-champagne/70
//                 bg-white
//                 text-text-dark
//                 shadow-travel-card
//                 transition-all
//                 duration-300
//                 hover:border-primary
//                 hover:bg-primary
//                 hover:text-white
//                 focus:outline-none
//                 focus-visible:ring-2
//                 focus-visible:ring-primary
//                 focus-visible:ring-offset-2
//               "
//             >
//               <ChevronRight
//                 className="h-5 w-5"
//                 strokeWidth={2.25}
//                 aria-hidden="true"
//               />
//             </button>
//           </div>
//         </div>

//         {/* =================================================
//             REVIEW BUTTON
//         ================================================= */}

//         <div className="mb-8 sm:hidden">
//           <button
//             type="button"
//             onClick={openReviewForm}
//             className="
//               inline-flex
//               w-full
//               items-center
//               justify-center
//               gap-2
//               rounded-xl
//               bg-primary
//               px-5
//               py-3
//               text-sm
//               font-semibold
//               text-white
//               shadow-brand
//               transition-all
//               duration-300
//               active:scale-[0.98]
//               focus:outline-none
//               focus-visible:ring-2
//               focus-visible:ring-primary
//               focus-visible:ring-offset-2
//             "
//           >
//             <MessageSquareHeart
//               className="h-4 w-4"
//               aria-hidden="true"
//             />

//             Share Your Experience
//           </button>
//         </div>

//         {/* =================================================
//             LOADING
//         ================================================= */}

//         {loading && testimonials.length === 0 ? (
//           <div
//             className="
//               -mx-4
//               flex
//               gap-5
//               overflow-hidden
//               px-4
//               sm:mx-0
//               sm:gap-7
//               sm:px-0
//             "
//             role="status"
//             aria-label="Loading traveller stories"
//           >
//             {[1, 2, 3, 4].map((item) => (
//               <TestimonialSkeleton key={item} />
//             ))}
//           </div>
//         ) : testimonials.length === 0 ? (
//           /* =================================================
//              EMPTY / ERROR STATE
//           ================================================= */

//           <div
//             className="
//               rounded-t-[2rem]
//               rounded-b-3xl
//               border
//               border-champagne/70
//               bg-white
//               p-8
//               text-center
//               shadow-travel-card
//               sm:p-12
//             "
//           >
//             <div
//               className="
//                 mx-auto
//                 flex
//                 h-14
//                 w-14
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-champagne-light
//                 text-primary
//               "
//             >
//               <MessageSquareHeart
//                 className="h-7 w-7"
//                 aria-hidden="true"
//               />
//             </div>

//             <h3
//               className="
//                 mt-5
//                 font-display
//                 text-2xl
//                 font-medium
//                 text-text-display
//               "
//             >
//               Be the first to share your journey
//             </h3>

//             <p
//               className="
//                 mx-auto
//                 mt-3
//                 max-w-md
//                 text-sm
//                 leading-6
//                 text-text-secondary
//               "
//             >
//               Your experience can help other travellers
//               discover their next escape.
//             </p>

//             <button
//               type="button"
//               onClick={openReviewForm}
//               className="
//                 mt-6
//                 inline-flex
//                 items-center
//                 gap-2
//                 rounded-full
//                 bg-primary
//                 px-6
//                 py-3
//                 text-sm
//                 font-semibold
//                 text-white
//                 shadow-brand
//                 transition-all
//                 duration-300
//                 hover:-translate-y-0.5
//                 hover:bg-accent-hover
//                 hover:shadow-lg
//                 focus:outline-none
//                 focus-visible:ring-2
//                 focus-visible:ring-primary
//                 focus-visible:ring-offset-2
//               "
//             >
//               <MessageSquareHeart
//                 className="h-4 w-4"
//                 aria-hidden="true"
//               />

//               Write a Review

//               <ArrowRight
//                 className="h-4 w-4"
//                 aria-hidden="true"
//               />
//             </button>

//             {error && (
//               <p className="mt-4 text-xs text-text-secondary/70">
//                 Reviews are temporarily unavailable.
//               </p>
//             )}
//           </div>
//         ) : (
//           <>
//             {/* =================================================
//                 CAROUSEL
//             ================================================= */}

//             <div className="relative">
//               <div
//                 ref={carouselRef}
//                 className="
//                   -mx-4
//                   flex
//                   snap-x
//                   snap-mandatory
//                   gap-5
//                   overflow-x-auto
//                   scroll-smooth
//                   px-4
//                   pb-8
//                   pt-3
//                   [scrollbar-width:none]
//                   [&::-webkit-scrollbar]:hidden
//                   sm:mx-0
//                   sm:gap-7
//                   sm:px-1
//                   sm:pb-12
//                 "
//               >
//                 {testimonials.map((testimonial, index) => (
//                   <TestimonialCard
//                     key={
//                       testimonial?.id ??
//                       testimonial?.slug ??
//                       `${testimonial?.customer_name ?? "review"}-${index}`
//                     }
//                     item={testimonial}
//                     index={index}
//                   />
//                 ))}
//               </div>

//               {/* =================================================
//                   MOBILE SWIPE HINT
//               ================================================= */}

//               {testimonials.length > 1 && (
//                 <div
//                   className="
//                     mt-1
//                     flex
//                     items-center
//                     justify-center
//                     gap-2
//                     sm:hidden
//                   "
//                   aria-hidden="true"
//                 >
//                   <span className="h-px w-8 bg-champagne" />
//                   <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-secondary">
//                     Swipe
//                   </span>
//                   <span className="h-px w-8 bg-champagne" />
//                 </div>
//               )}
//             </div>

//             {/* =================================================
//                 MOBILE VIEW ALL
//             ================================================= */}

//             <div className="mt-7 flex justify-center sm:hidden">
//               <Link
//                 to="/reviews"
//                 className="
//                   inline-flex
//                   items-center
//                   gap-2
//                   text-[12px]
//                   font-semibold
//                   uppercase
//                   tracking-[0.18em]
//                   text-text-dark
//                   transition-colors
//                   duration-300
//                   hover:text-primary
//                 "
//               >
//                 View All Reviews

//                 <ArrowRight
//                   className="h-3.5 w-3.5 text-primary"
//                   aria-hidden="true"
//                 />
//               </Link>
//             </div>
//           </>
//         )}

//         {/* =================================================
//             DESKTOP REVIEW CTA
//         ================================================= */}

//         {testimonials.length > 0 && (
//           <div className="mt-10 hidden justify-center sm:flex lg:mt-12">
//             <button
//               type="button"
//               onClick={openReviewForm}
//               className="
//                 group
//                 inline-flex
//                 items-center
//                 gap-2.5
//                 rounded-full
//                 border
//                 border-champagne
//                 bg-white
//                 px-6
//                 py-3
//                 text-[12px]
//                 font-semibold
//                 uppercase
//                 tracking-[0.18em]
//                 text-text-dark
//                 shadow-sm
//                 transition-all
//                 duration-300
//                 hover:-translate-y-0.5
//                 hover:border-primary
//                 hover:bg-primary
//                 hover:text-white
//                 hover:shadow-brand
//                 focus:outline-none
//                 focus-visible:ring-2
//                 focus-visible:ring-primary
//                 focus-visible:ring-offset-2
//               "
//             >
//               <MessageSquareHeart
//                 className="
//                   h-4
//                   w-4
//                   text-primary
//                   transition-colors
//                   duration-300
//                   group-hover:text-white
//                 "
//                 aria-hidden="true"
//               />

//               Share Your Experience

//               <ArrowRight
//                 className="
//                   h-3.5
//                   w-3.5
//                   text-primary
//                   transition-all
//                   duration-300
//                   group-hover:translate-x-1
//                   group-hover:text-white
//                 "
//                 aria-hidden="true"
//               />
//             </button>
//           </div>
//         )}
//       </div>

//       {/* =================================================
//           REVIEW FORM
//       ================================================= */}

//       <ReviewFormModal
//         open={reviewOpen}
//         onClose={closeReviewForm}
//       />
//     </section>
//   );
// }





