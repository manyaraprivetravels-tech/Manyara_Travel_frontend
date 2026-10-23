


import { memo, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  MessageSquareHeart,
  Quote,
  Star,
} from "lucide-react";

import Seo, { SITE_URL } from "../components/Seo";
import { scrollToSection } from "../utils/scrollToSection";
import { getSafeArray } from "../utils/packages";
import { cld, cldSrcSet } from "../utils/cloudinary";
import { getTestimonials } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import ReviewSubmitForm from "../components/ReviewSubmitForm";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";

/* ==================================================================
   HELPERS
================================================================== */

const BRAND_NAME = "Manyara Prive Vacations";

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") return image.trim();

  return (
    cleanText(image?.secure_url) ||
    cleanText(image?.url) ||
    cleanText(image?.image_url) ||
    cleanText(image?.src)
  );
}

function getInitials(name) {
  return (
    cleanText(name)
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "MP"
  );
}

/* Detail page URL. Uses the slug when the API provides one, otherwise the id. */
const getReviewPath = (item) => {
  const key = item?.slug ?? item?.id ?? null;
  return key === null ? null : `/reviews/${encodeURIComponent(key)}`;
};

/* The form section uses scroll-mt so it stops below the fixed header. */
const scrollToReviewForm = () => scrollToSection("share-review");

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

/* ==================================================================
   STAR RATING
================================================================== */

const SIZES = {
  md: "h-4 w-4",
  lg: "h-5 w-5 sm:h-6 sm:w-6",
};

function StarRating({ rating = 0, size = "md" }) {
  const value = Math.min(5, Math.max(0, Number(rating) || 0));

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${SIZES[size]} ${
            star <= value ? "text-accent-bright" : "text-ink-300"
          }`}
          fill={star <= value ? "currentColor" : "none"}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/* ==================================================================
   REVIEW CARD

   The whole card is one stretched link to the review's detail page.
   Photo on the left, review on the right (stacked on phones).
================================================================== */

const ReviewCard = memo(function ReviewCard({ item }) {
  const name = cleanText(item?.customer_name) || "Traveller";
  const city = cleanText(item?.customer_city);
  /* Prefer the package name; older reviews only have a destination. */
  const destination = cleanText(item?.destination);
  const packageTitle = cleanText(item?.package_title);
  const placeLabel = packageTitle || destination;
  const review = cleanText(item?.review);
  const imageUrl = getImageUrl(
    item?.image ?? item?.customer_image ?? item?.photo,
  );
  const hasRating = Number(item?.rating) > 0;
  const href = getReviewPath(item);

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-[1.75rem] border border-champagne/60 bg-card shadow-travel-card transition-[transform,box-shadow,border-color] duration-500 ease-soft hover:-translate-y-1 hover:border-champagne hover:shadow-travel-hover sm:min-h-[16rem] sm:flex-row">
      {/* ------------------------ Customer photo ------------------------ */}
      <div className="relative isolate h-52 shrink-0 overflow-hidden bg-champagne-light sm:h-auto sm:w-[38%]">
        {imageUrl ? (
          <img
            src={cld(imageUrl, 700)}
            srcSet={cldSrcSet(imageUrl, [400, 700, 1000])}
            sizes="(max-width: 640px) 100vw, 400px"
            alt={`${name}${placeLabel ? ` in ${placeLabel}` : ""}`}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-soft group-hover:scale-[1.06]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-champagne-light to-champagne"
            aria-hidden="true"
          >
            <span className="font-display text-6xl font-medium italic text-primary/80">
              {getInitials(name)}
            </span>
          </div>
        )}

        {placeLabel && (
          <>
            <div
              className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900/70 to-transparent"
              aria-hidden="true"
            />

            <span className="absolute inset-x-3 bottom-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 text-champagne"
                aria-hidden="true"
              />
              <span className="truncate">{placeLabel}</span>
            </span>
          </>
        )}
      </div>

      {/* ---------------------------- Review ---------------------------- */}
      <div className="relative flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <Quote
          className="pointer-events-none absolute right-4 top-4 h-9 w-9 text-champagne/70 sm:right-5 sm:top-5"
          aria-hidden="true"
        />

        {hasRating && (
          <div className="relative z-10">
            <StarRating rating={item?.rating} />
          </div>
        )}

        <p className="relative z-10 mt-3 line-clamp-5 flex-1 whitespace-pre-line break-words font-display text-[1.1rem] font-medium leading-[1.55] tracking-[-0.005em] text-text-display sm:text-[1.15rem]">
          “{review}”
        </p>

        {/* Customer + call to action */}
        <div className="relative z-10 mt-5 flex min-w-0 items-end justify-between gap-3 border-t border-champagne/60 pt-4">
          <div className="min-w-0">
            <p className="truncate font-display text-[1.05rem] font-semibold leading-tight text-text-display">
              {name}
            </p>

            {city && (
              <p className="mt-0.5 truncate text-xs leading-5 text-text-secondary sm:text-sm">
                {city}
              </p>
            )}
          </div>

          {href && (
            <span
              className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary transition-colors duration-300 group-hover:text-primary-dark"
              aria-hidden="true"
            >
              Read full
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </div>

      {/* Stretched link: makes the whole card clickable. */}
      {href && (
        <Link
          to={href}
          className="absolute inset-0 z-20 rounded-[1.75rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="sr-only">
            Read {name}'s full review{placeLabel ? ` of ${placeLabel}` : ""}
          </span>
        </Link>
      )}
    </article>
  );
});

/* Shown only on the very first visit, before anything is cached. */
function ReviewCardSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col overflow-hidden rounded-[1.75rem] border border-champagne/40 bg-card sm:min-h-[16rem] sm:flex-row"
      aria-hidden="true"
    >
      <div className="h-52 bg-surface-strong sm:h-auto sm:w-[38%]" />

      <div className="flex-1 space-y-3 p-5 sm:p-6">
        <div className="h-4 w-24 rounded bg-surface-strong" />
        <div className="h-4 rounded bg-surface-strong" />
        <div className="h-4 rounded bg-surface-strong" />
        <div className="h-4 w-3/4 rounded bg-surface-strong" />
        <div className="mt-6 h-3 w-32 rounded bg-surface-strong" />
      </div>
    </div>
  );
}

/* ==================================================================
   REVIEWS GRID

   items-start so cards of different heights don't stretch each other.
================================================================== */

const GRID = "grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-2";

function ReviewsGrid({ reviews, loading, error }) {
  if (loading) {
    return (
      <div className={GRID}>
        {[1, 2, 3, 4].map((key) => (
          <ReviewCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-champagne/60 bg-card p-8 text-center text-sm text-text"
      >
        Unable to load reviews right now. Please try again in a moment.
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-3xl border border-champagne/60 bg-card p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-champagne-light">
          <MessageSquareHeart
            className="h-7 w-7 text-primary"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-5 font-display text-2xl font-medium text-text-display">
          Be the first to share your experience
        </h3>

        <p className="mx-auto mb-6 mt-2 max-w-md text-sm text-text-secondary">
          Your experience can help other travellers plan their next journey.
        </p>

        <button type="button" onClick={scrollToReviewForm} className={BUTTON}>
          <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
          Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className={GRID}>
      {reviews.map((item, index) => (
        <ReviewCard key={item?.id ?? item?.slug ?? index} item={item} />
      ))}
    </div>
  );
}

/* ==================================================================
   PAGE
================================================================== */

const BREADCRUMB_JSON_LD = {
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "Reviews",
      item: `${SITE_URL}/reviews`,
    },
  ],
};

export default function TestimonialsPage() {
  const { data, loading, error } = useQuery(getTestimonials);
  const reviews = useMemo(() => getSafeArray(data), [data]);
  const { hash } = useLocation();

  /* Breadcrumb + a list of the review pages, so crawlers can find each one. */
  const jsonLd = useMemo(() => {
    const listed = reviews.filter((r) => cleanText(r?.slug)).slice(0, 20);

    return {
      "@context": "https://schema.org",
      "@graph": [
        BREADCRUMB_JSON_LD,
        {
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/reviews#webpage`,
          url: `${SITE_URL}/reviews`,
          name: "Traveller Reviews",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: listed.map((r, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${SITE_URL}/reviews/${encodeURIComponent(r.slug)}`,
              name: `${cleanText(r.customer_name) || "Traveller"}'s ${
                cleanText(r.package_title) || cleanText(r.destination) || "travel"
              } review`,
            })),
          },
        },
      ],
    };
  }, [reviews]);

  /* Links like /reviews#share-review (from a review's detail page). */
  useEffect(() => {
    if (hash !== "#share-review") return undefined;
    const timer = setTimeout(scrollToReviewForm, 150);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <Seo
        title="Traveller Reviews"
        description={`Read genuine experiences from travellers who explored the world with ${BRAND_NAME}.`}
        path="/reviews"
        jsonLd={jsonLd}
      />

      <main className="min-h-screen w-full bg-background">
        {/* ------------------------------ Hero ------------------------------ */}
        <section className="relative border-b border-champagne/50 bg-gradient-to-b from-white via-white to-surface-soft/60">
          <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-12">
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Home
            </Link>

            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span
                  className="h-px w-8 shrink-0 bg-champagne"
                  aria-hidden="true"
                />
                <MessageSquareHeart
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
                  Real trips, real words
                </p>
              </div>

              <h1 className="mt-3 font-display text-[2.8rem] font-medium leading-[1.03] tracking-[-0.015em] text-text-display sm:text-[3.5rem]">
                What Travellers{" "}
                <em className="font-medium italic text-primary">Say</em>
              </h1>

              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-text-secondary sm:text-base">
                Discover genuine experiences shared by travellers who explored
                the world with {BRAND_NAME}.
              </p>
            </div>
          </div>
        </section>

        {/* ----------------------------- Reviews ---------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="h-px w-8 shrink-0 bg-champagne"
                  aria-hidden="true"
                />
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
                  Traveller experiences
                </p>
              </div>

              <h2 className="mt-2 font-display text-[2rem] font-medium leading-tight text-text-display sm:text-[2.4rem]">
                Reviews from our{" "}
                <em className="font-medium italic text-primary">travellers</em>
              </h2>
            </div>

            <button
              type="button"
              onClick={scrollToReviewForm}
              className={`${BUTTON} shrink-0`}
            >
              <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
              Your Valuable Review
            </button>
          </div>

          <ReviewsGrid reviews={reviews} loading={loading} error={error} />
        </section>

        {/* --------------------------- Review form -------------------------- */}
        <section
          id="share-review"
          className="scroll-mt-[calc(var(--top-info-height,0px)+6rem)] border-y border-champagne/50 bg-surface-soft"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
            <ReviewSubmitForm />
          </div>
        </section>
      </main>

      <FAQSection />
      <Footer />
    </>
  );
}





