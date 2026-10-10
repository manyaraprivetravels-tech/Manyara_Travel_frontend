

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageOff,
  MapPin,
  Sparkles,
} from "lucide-react";

import { getUpcomingBatches } from "../api/content";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import FAQSection from "../components/FAQSection";
import { RevealGroup } from "../components/Reveal";

/* ============================================================
   HELPERS
   ============================================================ */

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image?.url || "";
  }

  return "";
};

const getBatchImage = (batch) => {
  const images = batch?.package?.images;

  if (!Array.isArray(images) || images.length === 0) {
    return "";
  }

  return images.map(getImageUrl).find(Boolean) || "";
};

const formatDate = (dateString) => {
  if (!dateString) {
    return "Date on request";
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

const formatPrice = (price) => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "Price on request";
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

const getDurationText = (batch) => {
  const days = Number(batch?.duration_days);
  const nights = Number(batch?.duration_nights);

  if (Number.isFinite(days) && Number.isFinite(nights)) {
    return `${days} ${days === 1 ? "day" : "days"} / ${nights} ${
      nights === 1 ? "night" : "nights"
    }`;
  }

  if (Number.isFinite(days)) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  if (Number.isFinite(nights)) {
    return `${nights} ${nights === 1 ? "night" : "nights"}`;
  }

  return "Flexible duration";
};

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
      return "border-success/20 bg-success-bg text-success-text";

    case "limited":
      return "border-warning/20 bg-warning-bg text-warning-text";

    case "almost_full":
      return "border-warning/20 bg-warning-bg text-warning-text";

    case "full":
      return "border-error/20 bg-error-bg text-error-text";

    case "closed":
      return "border-divider bg-surface text-text-secondary";

    default:
      return "border-divider bg-surface text-text-secondary";
  }
};

/* ============================================================
   BATCH CARD
   ============================================================ */

function BatchCard({ batch }) {
  const [imageError, setImageError] = useState(false);

  const imageUrl = getBatchImage(batch);

  const batchHref = batch?.slug
    ? `/batches/${encodeURIComponent(batch.slug)}`
    : `/batches/${batch?.id}`;

  const packageTitle =
    batch?.package?.title || "Holiday Package";

  const destination =
    batch?.package?.destination || "India";

  const availability =
    batch?.availability || "open";

  return (
    <article
      className="
        group flex h-full flex-col overflow-hidden
        rounded-4xl
        border border-divider
        bg-card
        shadow-travel-card
        transition-all duration-500 ease-soft
        hover:-translate-y-1.5
        hover:border-secondary-light
        hover:shadow-travel-hover
      "
    >
      <Link
        to={batchHref}
        className="flex h-full flex-col"
        aria-label={`View ${packageTitle} trip details`}
      >
        {/* ==================================================
            IMAGE
            ================================================== */}

        <div
          className="
            relative aspect-[16/9] w-full shrink-0 overflow-hidden
            bg-surface
          "
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={`${packageTitle} - ${destination}`}
              className="
                h-full w-full object-cover
                transition-transform duration-700 ease-soft
                group-hover:scale-[1.045]
              "
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="
                flex h-full w-full items-center justify-center
                bg-petal-gradient
              "
            >
              <div
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-full
                  border border-primary/10
                  bg-white/80
                  text-primary/60
                "
              >
                <ImageOff
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {/* Soft image overlay */}
          <div
            className="
              pointer-events-none absolute inset-0
              bg-gradient-to-t
              from-ink-900/65
              via-ink-900/10
              to-transparent
            "
          />

          {/* Availability */}
          <div className="absolute left-4 top-4">
            <span
              className={`
                inline-flex items-center gap-1.5
                rounded-full
                border
                px-3 py-1.5
                text-[10px] font-semibold
                tracking-wide
                shadow-sm
                backdrop-blur-md
                ${getAvailabilityClasses(availability)}
              `}
            >
              {availability === "open" && (
                <CheckCircle2
                  className="h-3 w-3"
                  aria-hidden="true"
                />
              )}

              {getAvailabilityLabel(availability)}
            </span>
          </div>

          {/* Destination */}
          <div
            className="
              absolute bottom-4 left-4 right-4
              flex min-w-0 items-center gap-1.5
              text-xs font-medium text-white
            "
          >
            <MapPin
              className="h-3.5 w-3.5 shrink-0 text-secondary-light"
              aria-hidden="true"
            />

            <span className="truncate">
              {destination}
            </span>
          </div>
        </div>

        {/* ==================================================
            CONTENT
            ================================================== */}

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {/* Destination */}
          <div
            className="
              flex items-center gap-1.5
              text-[10px] font-semibold uppercase
              tracking-[0.14em]
              text-muted
            "
          >
            <MapPin
              className="h-3.5 w-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />

            <span className="truncate">
              {destination}
            </span>
          </div>

          {/* Title */}
          <h2
            className="
              mt-2
              line-clamp-2
              font-display
              text-xl
              font-semibold
              leading-[1.15]
              text-text-dark
              transition-colors duration-300
              group-hover:text-primary
              sm:text-[22px]
            "
          >
            {packageTitle}
          </h2>

          {/* Dates */}
          <div
            className="
              mt-5
              grid grid-cols-2 gap-4
              border-t border-divider
              pt-4
            "
          >
            {/* Departure */}
            <div className="min-w-0">
              <div
                className="
                  flex items-center gap-1.5
                  text-[10px] font-semibold uppercase
                  tracking-[0.12em]
                  text-muted
                "
              >
                <CalendarDays
                  className="h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />

                <span>Departure</span>
              </div>

              <p
                className="
                  mt-1.5 truncate
                  text-xs font-semibold
                  text-text-dark
                  sm:text-sm
                "
              >
                {formatDate(batch?.departure_date)}
              </p>
            </div>

            {/* Return */}
            <div className="min-w-0">
              <div
                className="
                  flex items-center gap-1.5
                  text-[10px] font-semibold uppercase
                  tracking-[0.12em]
                  text-muted
                "
              >
                <CalendarDays
                  className="h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />

                <span>Return</span>
              </div>

              <p
                className="
                  mt-1.5 truncate
                  text-xs font-semibold
                  text-text-dark
                  sm:text-sm
                "
              >
                {formatDate(batch?.return_date)}
              </p>
            </div>
          </div>

          {/* Price + Duration */}
          <div
            className="
              mt-5
              flex items-end justify-between gap-4
            "
          >
            {/* Price */}
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted sm:text-xs">
                Starting from
              </p>

              <p
                className="
                  mt-0.5 truncate
                  font-display
                  text-xl
                  font-bold
                  leading-none
                  text-primary
                  sm:text-[22px]
                "
              >
                {formatPrice(batch?.price_per_person)}
              </p>

              {batch?.price_per_person !== null &&
                batch?.price_per_person !== undefined && (
                  <p className="mt-1 text-[10px] text-muted sm:text-xs">
                    per person
                  </p>
                )}
            </div>

            {/* Duration */}
            <div
              className="
                flex max-w-[48%]
                items-center justify-end gap-1.5
                text-right
                text-[11px] font-medium
                text-text-secondary
                sm:text-xs
              "
            >
              <Clock3
                className="h-3.5 w-3.5 shrink-0 text-primary/80"
                aria-hidden="true"
              />

              <span className="line-clamp-2">
                {getDurationText(batch)}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div
            className="
              mt-auto
              flex items-center justify-between gap-3
              border-t border-divider
              pt-5
              sm:mt-6
            "
          >
            <span
              className="
                text-xs font-semibold
                text-primary
                transition-colors duration-300
                group-hover:text-primary-dark
                sm:text-sm
              "
            >
              View Trip Details
            </span>

            <span
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-full
                bg-primary/10
                text-primary
                transition-all duration-300
                group-hover:bg-primary
                group-hover:text-white
                group-hover:shadow-brand
              "
            >
              <ArrowRight
                className="
                  h-3.5 w-3.5
                  transition-transform duration-300
                  group-hover:translate-x-0.5
                "
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ============================================================
   BATCH SKELETON
   ============================================================ */

function BatchSkeleton() {
  return (
    <div
      className="
        overflow-hidden
        rounded-4xl
        border border-divider
        bg-card
        shadow-travel-card
      "
      aria-hidden="true"
    >
      {/* Image */}
      <div
        className="
          aspect-[16/9]
          animate-pulse
          bg-surface-strong
        "
      />

      {/* Content */}
      <div className="space-y-4 p-5 sm:p-6">
        <div
          className="
            h-3 w-24
            animate-pulse
            rounded-full
            bg-primary/10
          "
        />

        <div className="space-y-2">
          <div
            className="
              h-5 w-[88%]
              animate-pulse
              rounded-full
              bg-primary/10
            "
          />

          <div
            className="
              h-5 w-[62%]
              animate-pulse
              rounded-full
              bg-primary/10
            "
          />
        </div>

        <div
          className="
            grid grid-cols-2 gap-3
            border-t border-divider
            pt-4
          "
        >
          <div className="space-y-2">
            <div
              className="
                h-3 w-20
                animate-pulse
                rounded-full
                bg-primary/10
              "
            />

            <div
              className="
                h-4 w-24
                animate-pulse
                rounded-full
                bg-primary/10
              "
            />
          </div>

          <div className="space-y-2">
            <div
              className="
                h-3 w-16
                animate-pulse
                rounded-full
                bg-primary/10
              "
            />

            <div
              className="
                h-4 w-24
                animate-pulse
                rounded-full
                bg-primary/10
              "
            />
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <div
              className="
                h-3 w-20
                animate-pulse
                rounded-full
                bg-primary/10
              "
            />

            <div
              className="
                h-6 w-28
                animate-pulse
                rounded-full
                bg-primary/10
              "
            />
          </div>

          <div
            className="
              h-4 w-24
              animate-pulse
              rounded-full
              bg-primary/10
            "
          />
        </div>

        <div
          className="
            flex justify-between
            border-t border-divider
            pt-4
          "
        >
          <div
            className="
              h-4 w-28
              animate-pulse
              rounded-full
              bg-primary/10
            "
          />

          <div
            className="
              h-8 w-8
              animate-pulse
              rounded-full
              bg-primary/10
            "
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SEO STRUCTURED DATA
   ============================================================ */

function BatchStructuredData({ batches, siteUrl }) {
  const itemList = batches.map((batch, index) => {
    const title =
      batch?.package?.title || "Holiday Package";

    const destination =
      batch?.package?.destination || "India";

    const slug = batch?.slug
      ? encodeURIComponent(batch.slug)
      : batch?.id;

    return {
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/batches/${slug}`,
      name: `${title} - ${destination}`,
    };
  });

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Upcoming Trips - Manyara Prive Vacations",
      description:
        "Upcoming scheduled trips, departures and holiday packages from Manyara Prive Vacations.",
      numberOfItems: batches.length,
      itemListElement: itemList,
    },

    ...batches.slice(0, 20).map((batch) => {
      const title =
        batch?.package?.title || "Holiday Package";

      const destination =
        batch?.package?.destination || "India";

      const slug = batch?.slug
        ? encodeURIComponent(batch.slug)
        : batch?.id;

      return {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: title,
        description: `Upcoming ${title} trip to ${destination}.`,
        url: `${siteUrl}/batches/${slug}`,
        touristType: "Leisure travelers",

        itinerary: {
          "@type": "ItemList",
          name: title,
        },

        offers:
          batch?.price_per_person !== null &&
          batch?.price_per_person !== undefined
            ? {
                "@type": "Offer",
                price: Number(batch.price_per_person),
                priceCurrency: "INR",
                availability:
                  batch?.availability === "full"
                    ? "https://schema.org/SoldOut"
                    : "https://schema.org/InStock",
              }
            : undefined,
      };
    }),
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`batch-schema-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(schema)}
        </script>
      ))}
    </>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==========================================================
     FETCH
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadBatches = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getUpcomingBatches();

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
          ? response.data
          : [];

        if (!cancelled) {
          setBatches(data);
        }
      } catch (err) {
        console.error(
          "Failed to load upcoming batches:",
          err
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              "Unable to load upcoming trips right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBatches();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     SEO
     ========================================================== */

  const siteUrl =
    import.meta.env.VITE_SITE_URL ||
    "https://manyaravacation.com";

  const canonicalUrl = `${siteUrl}/batches`;

  const seoTitle =
    "Upcoming Trips & Holiday Batches | Manyara Prive Vacations";

  const seoDescription =
    "Explore upcoming trips and scheduled holiday batches from Manyara Prive Vacations. Check departure dates, return dates, destinations, trip durations and prices.";

  /* ==========================================================
     SUMMARY
     ========================================================== */

  const tripCountText = useMemo(() => {
    if (batches.length === 1) {
      return "1 upcoming trip";
    }

    return `${batches.length} upcoming trips`;
  }, [batches.length]);

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
      />

      {!loading && batches.length > 0 && (
        <BatchStructuredData
          batches={batches}
          siteUrl={siteUrl}
        />
      )}

      <main className="min-h-screen bg-background">
        {/* ====================================================
            HERO
            ==================================================== */}

        <section
          className="
            relative overflow-hidden
            border-b border-divider
            bg-petal-gradient
          "
        >
          {/* Decorative glow */}
          <div
            className="
              pointer-events-none
              absolute -right-24 -top-24
              h-72 w-72
              rounded-full
              bg-primary/10
              blur-3xl
            "
            aria-hidden="true"
          />

          <div
            className="
              pointer-events-none
              absolute -bottom-28 -left-24
              h-72 w-72
              rounded-full
              bg-secondary/20
              blur-3xl
            "
            aria-hidden="true"
          />

          <div
            className="
              relative mx-auto max-w-7xl
              px-4 py-10
              sm:px-6 sm:py-12
              lg:px-8 lg:py-16
            "
          >
            <div className="max-w-3xl">
              {/* Eyebrow */}
              <div
                className="
                  inline-flex items-center gap-2
                  rounded-full
                  border border-primary/10
                  bg-white/75
                  px-3.5 py-1.5
                  text-[10px] font-semibold
                  uppercase tracking-[0.16em]
                  text-primary
                  shadow-sm
                  backdrop-blur-sm
                  sm:text-xs
                "
              >
                <Sparkles
                  className="h-3.5 w-3.5 text-accent-bright"
                  aria-hidden="true"
                />

                Upcoming journeys
              </div>

              {/* Heading */}
              <h1
                className="
                  mt-4
                  font-display
                  text-4xl
                  font-semibold
                  leading-[0.98]
                  tracking-[-0.02em]
                  text-text-display
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                Upcoming Trips
                <span className="block text-primary">
                  Made for the Journey.
                </span>
              </h1>

              {/* Description */}
              <p
                className="
                  mt-5
                  max-w-2xl
                  text-sm
                  leading-6
                  text-text-secondary
                  sm:text-base
                  sm:leading-7
                "
              >
                Explore scheduled departures, destinations,
                travel dates and thoughtfully planned holiday
                packages for your next journey.
              </p>

              {/* Small trust line */}
              <div
                className="
                  mt-6
                  flex flex-wrap items-center gap-x-5 gap-y-2
                  text-xs font-medium
                  text-muted
                "
              >
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-success"
                    aria-hidden="true"
                  />
                  Scheduled departures
                </span>

                <span className="hidden h-3 w-px bg-divider sm:block" />

                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    className="h-3.5 w-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Clear travel dates
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            RESULTS
            ==================================================== */}

        <section
          className="
            bg-background
            py-10
            sm:py-12
            lg:py-14
          "
        >
          <div
            className="
              mx-auto max-w-7xl
              px-4
              sm:px-6
              lg:px-8
            "
          >
            {/* Results heading */}
            {!loading &&
              !error &&
              batches.length > 0 && (
                <div
                  className="
                    mb-7
                    flex items-end
                    justify-between gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.16em]
                        text-primary
                      "
                    >
                      Plan your next escape
                    </p>

                    <h2
                      className="
                        mt-1
                        font-display
                        text-2xl
                        font-semibold
                        text-text-dark
                        sm:text-3xl
                      "
                    >
                      Scheduled Departures
                    </h2>

                    <p
                      className="
                        mt-1.5
                        text-xs
                        text-muted
                        sm:text-sm
                      "
                    >
                      {tripCountText}
                    </p>
                  </div>
                </div>
              )}

            {/* =================================================
                LOADING
                ================================================= */}

            {loading && (
              <div
                className="
                  grid grid-cols-1 gap-5
                  sm:grid-cols-2
                  lg:grid-cols-3
                  xl:gap-6
                "
              >
                {Array.from({ length: 6 }).map(
                  (_, index) => (
                    <BatchSkeleton key={index} />
                  )
                )}
              </div>
            )}

            {/* =================================================
                ERROR
                ================================================= */}

            {!loading && error && (
              <div
                role="alert"
                className="
                  mx-auto max-w-xl
                  rounded-4xl
                  border border-error/20
                  bg-error-bg
                  p-7
                  text-center
                  sm:p-9
                "
              >
                <div
                  className="
                    mx-auto
                    flex h-12 w-12
                    items-center justify-center
                    rounded-full
                    bg-white
                    text-error
                    shadow-sm
                  "
                >
                  <ImageOff
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <h2
                  className="
                    mt-4
                    font-display
                    text-xl
                    font-semibold
                    text-text-dark
                    sm:text-2xl
                  "
                >
                  Couldn't load upcoming trips
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-error-text
                  "
                >
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="
                    mt-6
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    bg-primary
                    px-5 py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-brand
                    transition-all duration-300
                    hover:bg-primary-hover
                    hover:-translate-y-0.5
                  "
                >
                  Try Again

                  <ArrowRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
            )}

            {/* =================================================
                EMPTY
                ================================================= */}

            {!loading &&
              !error &&
              batches.length === 0 && (
                <div
                  className="
                    mx-auto max-w-xl
                    rounded-4xl
                    border border-divider
                    bg-petal-gradient
                    p-8
                    text-center
                    sm:p-10
                  "
                >
                  <div
                    className="
                      mx-auto
                      flex h-14 w-14
                      items-center justify-center
                      rounded-full
                      border border-primary/10
                      bg-white
                      text-primary
                      shadow-sm
                    "
                  >
                    <CalendarDays
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <h2
                    className="
                      mt-5
                      font-display
                      text-2xl
                      font-semibold
                      text-text-dark
                    "
                  >
                    No Upcoming Trips
                  </h2>

                  <p
                    className="
                      mx-auto mt-2
                      max-w-md
                      text-sm
                      leading-6
                      text-text-secondary
                    "
                  >
                    There are currently no upcoming trips
                    available. Please check back soon for
                    new departures.
                  </p>

                  <Link
                    to="/packages"
                    className="
                      mt-6
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      bg-primary
                      px-5 py-2.5
                      text-sm
                      font-semibold
                      text-white
                      shadow-brand
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:bg-primary-hover
                    "
                  >
                    Explore Packages

                    <ArrowRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              )}

            {/* =================================================
                BATCH GRID
                ================================================= */}

            {!loading &&
              !error &&
              batches.length > 0 && (
                <RevealGroup
                  className="
                    grid grid-cols-1 gap-5
                    sm:grid-cols-2
                    lg:grid-cols-3
                    xl:gap-6
                  "
                >
                  {batches.map((batch) => (
                    <BatchCard
                      key={batch?.id || batch?.slug}
                      batch={batch}
                    />
                  ))}
                </RevealGroup>
              )}
          </div>
        </section>
      </main>

      {/* ======================================================
          FAQ
          ====================================================== */}

      <FAQSection  />

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <Footer />
    </>
  );
}



