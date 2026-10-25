




import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Quote, Star } from "lucide-react";

import { scrollToSection } from "../../utils/scrollToSection";
import { getSafeArray } from "../../utils/packages";
import { cld } from "../../utils/cloudinary";
import { getTestimonialBySlug, getTestimonials } from "../../api/content";
import { useQuery } from "../../hooks/useQuery";
import ReviewSubmitForm from "../../components/ReviewSubmitForm";
import FAQSection from "../../components/FAQSection";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import { RevealGroup } from "../../components/Reveal";

/* ==================================================================
   BRAND + HELPERS
================================================================== */

const BRAND_NAME = "Manyara Prive Vacations";

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

function getImageUrl(image) {
  return typeof image === "string" ? image.trim() : cleanText(image?.url);
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

function formatDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function truncateText(text, maxLength = 155) {
  const value = cleanText(text);
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

/* The form section uses scroll-mt so it stops below the fixed header. */
const scrollToReviewForm = () => scrollToSection("share-review");

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

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
   REVIEW CARD (used in "More reviews")
================================================================== */

function ReviewCard({ item }) {
  const name = cleanText(item?.customer_name) || "Traveller";
  const meta = [
    cleanText(item?.customer_city),
    cleanText(item?.package_title) || cleanText(item?.destination),
  ]
    .filter(Boolean)
    .join(" · ");
  const imageUrl = getImageUrl(item?.image);
  const slug = cleanText(item?.slug);

  return (
    <article className="card-lift relative flex h-full flex-col gap-4 rounded-2xl border border-divider bg-card p-6 shadow-travel-card hover:border-secondary-light hover:shadow-travel-hover">
      <Quote
        className="absolute right-5 top-5 h-8 w-8 text-surface-soft"
        aria-hidden="true"
      />

      <StarRating rating={item?.rating} />

      <p className="line-clamp-6 flex-1 text-sm leading-relaxed text-text">
        “{cleanText(item?.review)}”
      </p>

      <div className="flex items-center gap-3 border-t border-divider pt-4">
        {imageUrl ? (
          <img
            src={cld(imageUrl, 100)}
            alt={`${name} profile`}
            loading="lazy"
            decoding="async"
            width="44"
            height="44"
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-xs font-semibold text-primary-dark"
            aria-hidden="true"
          >
            {getInitials(name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-dark">{name}</p>
          {meta && <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>}
        </div>
      </div>

      {slug && (
        <Link
          to={`/reviews/${encodeURIComponent(slug)}`}
          aria-label={`Read full review from ${name}`}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-divider bg-surface px-4 py-2.5 text-sm font-semibold text-text-dark transition-colors hover:border-primary hover:bg-primary hover:text-white"
        >
          Read Full Review
          <ArrowRight className="arrow-shift h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

/* Shown only when nothing is cached yet. */
function ReviewCardSkeleton() {
  return (
    <div
      className="flex h-64 animate-pulse flex-col gap-4 rounded-2xl border border-divider bg-card p-6"
      aria-hidden="true"
    >
      <div className="h-4 w-24 rounded bg-primary/10" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3 rounded bg-primary/10" />
        <div className="h-3 rounded bg-primary/10" />
        <div className="h-3 w-3/4 rounded bg-primary/10" />
      </div>
      <div className="flex items-center gap-3 border-t border-divider pt-4">
        <div className="h-11 w-11 rounded-full bg-primary/10" />
        <div className="h-3 w-32 rounded bg-primary/10" />
      </div>
    </div>
  );
}

/* ==================================================================
   PURE HELPERS (SEO)
================================================================== */

function getReviewDetails(review, slug) {
  const customerName = cleanText(review?.customer_name) || "Traveller";
  const destination = cleanText(review?.destination);
  const packageTitle = cleanText(review?.package_title);
  const reviewText = cleanText(review?.review);
  const canonicalSlug = cleanText(review?.slug) || cleanText(slug);
  const path = `/reviews/${encodeURIComponent(canonicalSlug)}`;

  return {
    customerName,
    customerCity: cleanText(review?.customer_city),
    destination,
    /* Only worth showing when it adds something beyond the destination. */
    packageTitle:
      packageTitle && packageTitle.toLowerCase() !== destination.toLowerCase()
        ? packageTitle
        : "",
    reviewText,
    rating: Number(review?.rating) || 0,
    image: getImageUrl(review?.image),
    createdAt: review?.created_at,
    createdDate: formatDate(review?.created_at),
    path,
    canonicalUrl: `${SITE_URL}${path}`,
    heading: destination
      ? `${customerName}'s experience in ${destination}`
      : `${customerName}'s travel experience`,
    seoTitle: `${customerName}'s ${
      destination ? `${destination} ` : ""
    }Travel Review | ${BRAND_NAME}`,
    seoDescription:
      truncateText(reviewText, 155) ||
      `Read ${customerName}'s travel experience with ${BRAND_NAME}.`,
  };
}

function buildStructuredData(d) {
  const url = d.canonicalUrl;

  const itemReviewed = d.packageTitle
    ? {
        "@type": "TouristTrip",
        name: d.packageTitle,
        ...(d.destination && {
          itinerary: { "@type": "Place", name: d.destination },
        }),
        provider: { "@type": "TravelAgency", name: BRAND_NAME },
      }
    : d.destination
      ? { "@type": "Place", name: d.destination }
      : { "@type": "TravelAgency", name: BRAND_NAME };

  const reviewSchema = {
    "@type": "Review",
    "@id": `${url}#review`,
    url,
    name: `${d.customerName}'s ${d.destination || "travel"} review`,
    author: { "@type": "Person", name: d.customerName },
    reviewBody: d.reviewText,
    reviewRating: {
      "@type": "Rating",
      ratingValue: d.rating,
      bestRating: 5,
      worstRating: 1,
    },
    itemReviewed,
  };

  if (d.createdDate) reviewSchema.datePublished = d.createdAt;
  if (d.image) reviewSchema.image = d.image;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: d.seoTitle,
        description: d.seoDescription,
        mainEntity: { "@id": `${url}#review` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      reviewSchema,
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Reviews",
            item: `${SITE_URL}/reviews`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: d.destination
              ? `${d.customerName} – ${d.destination}`
              : d.customerName,
            item: url,
          },
        ],
      },
    ],
  };
}

/* ==================================================================
   SMALL COMPONENTS
================================================================== */

function Avatar({ name, className = "h-12 w-12 text-sm" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-surface-soft font-bold text-primary-dark ${className}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Loading review"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="h-4 w-24 rounded bg-primary/10" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <div className="h-6 w-40 rounded-full bg-primary/10" />
            <div className="h-10 w-3/4 rounded bg-primary/10" />
            <div className="h-10 w-1/2 rounded bg-primary/10" />
            <div className="h-24 rounded bg-primary/10" />
          </div>
          <div className="h-80 rounded-3xl bg-primary/10" />
        </div>
      </div>
    </div>
  );
}

/* Missing review (404) vs. a real loading problem */
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
              className={`${BUTTON} min-h-[44px]`}
            >
              Try again
            </button>
          )}

          <Link
            to="/reviews"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Reviews
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   PAGE
================================================================== */

export default function ReviewDetail() {
  const { slug } = useParams();

  /* Cached data: instant on repeat visits, updates itself when fresh. */
  const { data, loading, error } = useQuery(getTestimonialBySlug, slug);
  const review = data?.data ?? data ?? null;

  const { data: allReviews, loading: loadingRelated } =
    useQuery(getTestimonials);

  const d = useMemo(() => getReviewDetails(review, slug), [review, slug]);

  const structuredData = useMemo(
    () => (review ? buildStructuredData(d) : null),
    [review, d]
  );

  const relatedReviews = useMemo(() => {
    const currentSlug = cleanText(review?.slug);

    return getSafeArray(allReviews)
      .filter((item) => {
        const itemSlug = cleanText(item?.slug);
        if (!itemSlug || itemSlug === currentSlug) return false;
        return !(review?.id && item?.id === review.id);
      })
      .slice(0, 6);
  }, [allReviews, review]);

  /* --------------------------------------------------
     STATES
  -------------------------------------------------- */
  if (loading) {
    return <DetailSkeleton />;
  }

  if (!review) {
    const status = error?.response?.status;
    const isRealError = Boolean(error) && status !== 404;

    if (isRealError) {
      console.error("Failed to load review:", slug, error);

      return (
        <StateMessage
          title="We couldn't load this review"
          message="Something went wrong while loading this page. Please check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <>
        <Seo
          title={`Review Not Found | ${BRAND_NAME}`}
          path={d.path}
          noindex
        />

        <StateMessage
          code="404"
          title="Review not found"
          message="This review may no longer be available or the link may be incorrect."
        />
      </>
    );
  }

  /* --------------------------------------------------
     MAIN

     NOTE (sticky intro): the page wrapper uses
     overflow-x-clip, NOT overflow-x-hidden, so
     position: sticky keeps working in the review form.
  -------------------------------------------------- */
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Seo
        title={d.seoTitle}
        description={d.seoDescription}
        canonical={d.canonicalUrl}
        path={d.path}
        image={d.image || undefined}
        type="article"
        jsonLd={structuredData}
      />

      <main>
        {/* ------------------------------ Hero ------------------------------ */}
        <section className="relative overflow-hidden border-b border-divider bg-petal-gradient">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <Link
              to="/reviews"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              All Reviews
            </Link>

            <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
              <div className="min-w-0 max-w-3xl">
                <span className="inline-flex rounded-full border border-divider bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-dark">
                  Traveller Review
                </span>

                {d.destination && (
                  <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {d.destination}
                  </p>
                )}

                {d.packageTitle && (
                  <p className="mt-1 text-sm text-text-secondary">
                    Package:{" "}
                    <span className="font-semibold text-text-dark">
                      {d.packageTitle}
                    </span>
                  </p>
                )}

                <h1 className="mt-3 break-words font-display text-4xl font-semibold leading-tight text-text-display sm:text-5xl lg:text-6xl">
                  {d.heading}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-3">
                    <StarRating rating={d.rating} size="lg" />
                    <span className="font-bold text-text-dark">
                      {d.rating}/5
                    </span>
                  </div>

                  {d.customerCity && (
                    <span className="text-sm text-text-secondary">
                      Traveller from {d.customerCity}
                    </span>
                  )}

                  {d.createdDate && (
                    <span className="text-sm text-muted">{d.createdDate}</span>
                  )}
                </div>

                <blockquote className="mt-7 max-w-2xl border-l-4 border-secondary pl-5 font-display text-xl leading-8 text-text sm:text-2xl sm:leading-9">
                  “{truncateText(d.reviewText, 260)}”
                </blockquote>

                <button
                  type="button"
                  onClick={scrollToReviewForm}
                  className="group mt-8 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2"
                >
                  Share Your Experience
                  <ArrowRight className="arrow-shift h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="rounded-3xl border border-divider bg-card p-3 shadow-travel-card">
                <div className="overflow-hidden rounded-2xl">
                  {d.image ? (
                    <img
                      src={cld(d.image, 800)}
                      alt={`${d.customerName}'s review photo`}
                      className="h-64 w-full object-cover sm:h-72"
                      fetchPriority="high"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-petal-gradient sm:h-72">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-card font-display text-4xl font-semibold text-primary-dark shadow-brand">
                        {getInitials(d.customerName)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4">
                  <Avatar name={d.customerName} className="h-11 w-11 text-sm" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-text-dark">
                      {d.customerName}
                    </p>
                    {d.customerCity && (
                      <p className="truncate text-sm text-muted">
                        {d.customerCity}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- Full review -------------------------- */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-3xl border border-divider bg-card p-6 shadow-travel-card sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                  Full Review
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-text-dark">
                  {d.customerName}'s travel experience
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <StarRating rating={d.rating} />
                <span className="text-sm font-bold text-text-dark">
                  {d.rating}/5
                </span>
              </div>
            </div>

            <p className="mt-7 whitespace-pre-line break-words border-t border-divider pt-7 text-base leading-8 text-text sm:text-lg">
              {d.reviewText}
            </p>

            <div className="mt-8 flex items-center gap-4 rounded-2xl bg-surface p-4">
              <Avatar name={d.customerName} />
              <div className="min-w-0">
                <p className="font-bold text-text-dark">{d.customerName}</p>
                <p className="truncate text-sm text-muted">
                  {[d.customerCity, d.packageTitle || d.destination]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------- Review form -------------------------- */}
        <section
          id="share-review"
          className="scroll-mt-[calc(var(--top-info-height,0px)+6rem)] border-y border-divider bg-surface-soft"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <ReviewSubmitForm />
          </div>
        </section>

        {/* --------------------------- More reviews ------------------------- */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                Traveller Stories
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-text-dark">
                More Traveller Reviews
              </h2>
              <p className="mt-2 max-w-2xl text-text">
                Discover experiences shared by other travellers who explored
                destinations with {BRAND_NAME}.
              </p>
            </div>

            <Link
              to="/reviews"
              className="group inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-link"
            >
              <span className="link-reveal">View All Reviews</span>
              <ArrowRight className="arrow-shift h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {loadingRelated && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((key) => (
                <ReviewCardSkeleton key={key} />
              ))}
            </div>
          )}

          {!loadingRelated && relatedReviews.length > 0 && (
            <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedReviews.map((item) => (
                <ReviewCard key={item.id ?? item.slug} item={item} />
              ))}
            </RevealGroup>
          )}

          {!loadingRelated && relatedReviews.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-divider bg-card p-8 text-center text-text">
              More traveller reviews will appear here as they are published.
            </div>
          )}
        </section>
      </main>

      <FAQSection />
      <Footer />
    </div>
  );
}






