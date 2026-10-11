

import { memo, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageSquareHeart,
  Quote,
  Send,
  Star,
} from "lucide-react";

import Seo, { SITE_URL } from "../components/Seo";
import { scrollToSection } from "../utils/scrollToSection";
import { createTestimonial, getMostVisited, getTestimonials } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import ImageUploadField from "../components/admin/ImageUploadField";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";

/* ==================================================================
   HELPERS
================================================================== */

const BRAND_NAME = "Manyara Prive Vacations";

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

function getSafeArray(value) {
  if (Array.isArray(value)) return value;

  for (const key of ["items", "data", "results"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }

  return [];
}

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

/* Detail page URL. Must match getReviewKey() in TestimonialDetailPage.jsx.
   Uses the slug when the API provides one, otherwise the id. */
const getReviewPath = (item) => {
  const key = item?.slug ?? item?.id ?? null;
  return key === null ? null : `/reviews/${encodeURIComponent(key)}`;
};

function buildDestinations(data) {
  const seen = new Set();

  return getSafeArray(data)
    .map((item) => ({
      item,
      name:
        cleanText(item?.place_name) ||
        cleanText(item?.destination) ||
        cleanText(item?.name) ||
        cleanText(item?.title),
    }))
    .filter(({ name }) => name)
    .sort(
      (a, b) =>
        Number(a.item?.display_order ?? 0) - Number(b.item?.display_order ?? 0),
    )
    .filter(({ name }) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ name }) => name);
}

/* The form section uses scroll-mt so it stops below the fixed header. */
const scrollToReviewForm = () => scrollToSection("share-review");

/* ==================================================================
   STAR RATING
================================================================== */

const SIZES = {
  md: "h-4 w-4",
  lg: "h-5 w-5 sm:h-6 sm:w-6",
};

/* Read-only stars. Filled stars use the bright logo pink (decorative),
   so the rating is also always available as text via aria-label. */
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

   The whole card is one link to the review's detail page (a single
   stretched link, so keyboard and screen-reader users get one stop per
   card). Photo on the left, review on the right (stacked on phones).
   The preview is clamped; the full text lives on the detail page.
================================================================== */

const ReviewCard = memo(function ReviewCard({ item }) {
  const name = cleanText(item?.customer_name) || "Traveller";
  const city = cleanText(item?.customer_city);
  const destination = cleanText(item?.destination);
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
            src={imageUrl}
            alt={`${name}${destination ? ` in ${destination}` : ""}`}
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

        {destination && (
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
              <span className="truncate">{destination}</span>
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
          aria-label={`Read ${name}'s full review${
            destination ? ` of ${destination}` : ""
          }`}
          className="absolute inset-0 z-20 rounded-[1.75rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />
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
   REVIEW FORM
================================================================== */

const INITIAL_FORM = {
  customer_name: "",
  customer_city: "",
  destination: "",
  rating: 5,
  review: "",
};

const INTRO_POINTS = [
  {
    Icon: MessageSquareHeart,
    title: "Share your experience",
    text: "Tell us what made your trip memorable.",
  },
  {
    Icon: Star,
    title: "Rate your experience",
    text: "Give your honest rating from 1 to 5 stars.",
  },
  {
    Icon: CheckCircle2,
    title: "Pending approval",
    text: "Reviews are checked before appearing publicly.",
  },
];

/* One class string for every text field keeps the form consistent. */
const INPUT =
  "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-text-dark outline-none transition placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-surface";

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

/* ------------------------------------------------------------------ */

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-text-dark"
      >
        {label}
      </label>
      {children}
      {hint}
    </div>
  );
}

function RatingInput({ value, onChange, disabled }) {
  return (
    <div
      role="radiogroup"
      aria-label="Your rating"
      className="flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          className="rounded-lg p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed"
        >
          <Star
            className={`h-7 w-7 ${
              star <= value ? "text-accent-bright" : "text-ink-300"
            }`}
            fill={star <= value ? "currentColor" : "none"}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

function SuccessCard({ onReset }) {
  return (
    <div
      role="status"
      className="rounded-3xl border border-success/30 bg-success-bg p-6 text-center sm:p-8 lg:p-10"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-card">
        <CheckCircle2 className="h-9 w-9 text-success" aria-hidden="true" />
      </div>

      <h2 className="mt-6 font-display text-3xl font-semibold text-text-dark">
        Thank You!
      </h2>

      <p className="mt-3 text-base font-medium text-text">
        Thank you for your valuable response!
      </p>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
        Your review has been submitted successfully. Our team will review your
        response before publishing it on our website.
      </p>

      <div className="mx-auto mt-5 max-w-sm rounded-xl border border-divider bg-card px-4 py-3">
        <p className="text-xs text-muted">Review status</p>
        <p className="mt-1 text-sm font-semibold text-text-dark">
          Pending approval
        </p>
      </div>

      <button type="button" onClick={onReset} className={`${BUTTON} mt-6 px-7`}>
        <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
        Write Another Review
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ReviewForm() {
  const {
    data: mostVisited,
    loading: loadingPlaces,
    error: placesError,
  } = useQuery(getMostVisited);

  const places = useMemo(() => buildDestinations(mostVisited), [mostVisited]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  };

  const handleChange = (event) => update(event.target.name, event.target.value);

  function validate() {
    if (cleanText(form.customer_name).length < 2)
      return "Please enter your name.";
    if (cleanText(form.customer_city).length < 2)
      return "Please enter your city.";
    if (!cleanText(form.destination))
      return "Please select the place you visited.";
    if (cleanText(form.review).length < 10)
      return "Please write at least 10 characters for your review.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createTestimonial({
        customer_name: cleanText(form.customer_name),
        customer_city: cleanText(form.customer_city),
        destination: cleanText(form.destination),
        rating: Number(form.rating),
        review: cleanText(form.review),
        image: image || null,
      });

      setForm(INITIAL_FORM);
      setImage(null);
      setSuccess(true);
    } catch (err) {
      console.error("Failed to submit testimonial:", err);

      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Unable to submit your review. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return <SuccessCard onReset={() => setSuccess(false)} />;

  const noPlaces = !loadingPlaces && places.length === 0;

  let placeHint = "Select the destination you actually visited.";
  if (noPlaces) placeHint = "No destinations are currently available.";
  if (noPlaces && placesError)
    placeHint = "Unable to load available destinations. Please try again.";

  return (
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-start lg:gap-12">
      {/* ---------------------------- Intro ---------------------------- */}
      <div className="min-w-0 lg:sticky lg:top-[calc(var(--top-info-height,0px)+6rem)]">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 shrink-0 bg-champagne" aria-hidden="true" />
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
            Share your experience
          </p>
        </div>

        <h2 className="mt-3 font-display text-[2.4rem] font-medium leading-[1.05] tracking-[-0.01em] text-text-display sm:text-[2.8rem]">
          Your Valuable{" "}
          <em className="font-medium italic text-primary">Review</em>
        </h2>

        <p className="mt-4 max-w-lg text-sm leading-7 text-text-secondary sm:text-base">
          Tell future travellers about your experience with {BRAND_NAME}.
        </p>

        <ul className="mt-6 space-y-5">
          {INTRO_POINTS.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-champagne/70 bg-white text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-dark">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ----------------------------- Form ---------------------------- */}
      <form
        onSubmit={handleSubmit}
        className="min-w-0 space-y-5 rounded-3xl border border-champagne/60 bg-card p-5 shadow-travel-card sm:p-7 lg:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="customer_name" label="Your Name">
            <input
              id="customer_name"
              name="customer_name"
              type="text"
              value={form.customer_name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              placeholder="Enter your name"
              autoComplete="name"
              disabled={submitting}
              className={INPUT}
            />
          </Field>

          <Field id="customer_city" label="Your City">
            <input
              id="customer_city"
              name="customer_city"
              type="text"
              value={form.customer_city}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              placeholder="e.g. Hyderabad"
              autoComplete="address-level2"
              disabled={submitting}
              className={INPUT}
            />
          </Field>
        </div>

        <Field
          id="destination"
          label="Place Visited"
          hint={
            <p
              className={`mt-1.5 text-xs ${
                noPlaces && placesError ? "text-error-text" : "text-muted"
              }`}
            >
              {placeHint}
            </p>
          }
        >
          <div className="relative">
            <select
              id="destination"
              name="destination"
              value={form.destination}
              onChange={handleChange}
              required
              disabled={submitting || loadingPlaces}
              className={`${INPUT} appearance-none pr-10`}
            >
              <option value="">
                {loadingPlaces
                  ? "Loading destinations..."
                  : "Select the place you visited"}
              </option>
              {places.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
          </div>
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-text-dark">
            Your Rating
          </p>
          <RatingInput
            value={Number(form.rating)}
            onChange={(value) => update("rating", value)}
            disabled={submitting}
          />
          <p className="mt-1 text-xs text-muted">{form.rating} out of 5 stars</p>
        </div>

        <Field id="review" label="Your Review">
          <textarea
            id="review"
            name="review"
            value={form.review}
            onChange={handleChange}
            required
            minLength={10}
            maxLength={3000}
            rows={6}
            placeholder="Tell us about your travel experience..."
            disabled={submitting}
            className={`${INPUT} resize-y leading-6`}
          />
          <div className="mt-1 flex justify-end text-xs text-muted">
            {form.review.length}/3000
          </div>
        </Field>

        <div className="rounded-2xl border border-champagne/60 bg-surface p-4 sm:p-5">
          <ImageUploadField
            value={image}
            onChange={setImage}
            label="Your Photo (Optional)"
          />
          <p className="mt-2 text-xs text-muted">
            You can share a photo from your trip, but this is completely
            optional.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-error/30 bg-error-bg px-4 py-3 text-sm text-error-text"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || loadingPlaces || places.length === 0}
          className={`${BUTTON} w-full`}
        >
          {submitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit Your Review
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted">
          Your review will be published after our team reviews it.
        </p>
      </form>
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

const LIST_JSON_LD = {
  "@context": "https://schema.org",
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
        jsonLd={LIST_JSON_LD}
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
            <ReviewForm />
          </div>
        </section>
      </main>

      <FAQSection />
      <Footer />
    </>
  );
}





