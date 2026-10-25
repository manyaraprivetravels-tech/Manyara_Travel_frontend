


import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  IndianRupee,
  MapPin,
  MessageSquareHeart,
  PackageCheck,
  Send,
} from "lucide-react";

import { getMostVisitedBySlug } from "../../api/content";
import { useQuery } from "../../hooks/useQuery";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import EnquiryForm from "../EnquiryForm";
import FAQSection from "../../components/FAQSection";
import ReviewFormModal from "../../components/ReviewFormModal";
import { RevealGroup } from "../../components/Reveal";

/* =========================================================
   BRAND
========================================================= */

const BRAND_NAME = "Manyara Prive Vacations";

/* Same button language as PackageDetail */
const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70";

/* =========================================================
   HELPERS
   (outside the component so they are stable and can be
   used inside useMemo without dependency warnings)
========================================================= */

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image.url || image.secure_url || "";
  }

  return "";
};

const getPackageImage = (pkg) => {
  const images = Array.isArray(pkg?.images) ? pkg.images : [];
  const firstImage = images[0];

  if (typeof firstImage === "string" && firstImage.trim()) {
    return firstImage;
  }

  if (firstImage && typeof firstImage === "object") {
    return firstImage.url || firstImage.secure_url || "";
  }

  if (pkg?.image) {
    return getImageUrl(pkg.image);
  }

  return "";
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "Contact us";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return String(price);
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

const hasNumericPrice = (price) =>
  price !== null &&
  price !== undefined &&
  price !== "" &&
  !Number.isNaN(Number(price));

/* =========================================================
   SMALL COMPONENTS
========================================================= */

/*
  FullImage
  Shows the whole photo, never cropped, never blurred.

  - w-full h-auto: fills the width of its frame and keeps its own aspect
    ratio, so normal landscape photos have no empty space at all.
  - max-h-* (passed in className) + object-contain: only a very tall photo
    hits the cap; it is then shown whole and centred inside the frame.

  Always put it inside a frame with overflow-hidden and bg-surface-soft.
*/
function FullImage({ src, alt, eager = false, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`block h-auto w-full object-contain ${className}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function InfoCard({ icon, label, title, children }) {
  return (
    <div className="min-w-0 rounded-2xl border border-divider bg-surface p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary sm:h-11 sm:w-11">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted sm:text-sm">{label}</p>
          <h3 className="text-base font-bold text-text-dark sm:text-lg">
            {title}
          </h3>
        </div>
      </div>

      {children}
    </div>
  );
}

/* Shown only when nothing is cached yet. */
function DetailSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Loading destination"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-48 rounded bg-primary/10" />
        <div className="mt-8 h-5 w-40 rounded bg-primary/10" />
        <div className="mt-4 h-12 w-3/4 rounded bg-primary/10" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="aspect-[4/3] rounded-3xl bg-primary/10 sm:aspect-[16/9]" />
            <div className="h-8 w-56 rounded bg-primary/10" />
            <div className="h-4 rounded bg-primary/10" />
            <div className="h-4 rounded bg-primary/10" />
            <div className="h-4 w-2/3 rounded bg-primary/10" />
          </div>
          <div className="h-72 rounded-3xl bg-primary/10" />
        </div>
      </div>
    </div>
  );
}

/* Missing destination (404) vs. a real loading problem */
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
              className={`${PRIMARY_BUTTON} min-h-[44px] px-5 py-3`}
            >
              Try again
            </button>
          )}

          <Link
            to="/destinations"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Destinations
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function DestinationDetail() {
  const { slug } = useParams();

  /* Cached data: instant on repeat visits, updates itself when fresh. */
  const { data, loading, error } = useQuery(getMostVisitedBySlug, slug);
  const place = data?.data ?? data ?? null;

  const [enquiry, setEnquiry] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const destinationImage = useMemo(
    () => getImageUrl(place?.image),
    [place]
  );

  /* --------------------------------------------------
     PACKAGES
  -------------------------------------------------- */
  const destinationPackages = useMemo(() => {
    if (!Array.isArray(place?.packages)) {
      return [];
    }

    return place.packages
      .filter(
        (pkg) =>
          pkg?.status === undefined ||
          pkg?.status === "published" ||
          pkg?.is_published === true
      )
      .filter((pkg) => Boolean(pkg?.slug))
      .sort((a, b) => {
        // Most Visited packages first
        const mostVisitedDiff =
          Number(Boolean(b?.is_most_visited)) -
          Number(Boolean(a?.is_most_visited));

        if (mostVisitedDiff !== 0) {
          return mostVisitedDiff;
        }

        // Then display order
        const orderDiff =
          Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0);

        if (orderDiff !== 0) {
          return orderDiff;
        }

        // Finally ID
        return Number(a?.id ?? 0) - Number(b?.id ?? 0);
      });
  }, [place]);

  /* --------------------------------------------------
     PRICE
  -------------------------------------------------- */
  const hasStartingPrice =
    place?.starting_from !== null &&
    place?.starting_from !== undefined &&
    place?.starting_from !== "";

  const formattedPrice = hasStartingPrice
    ? formatPrice(place.starting_from)
    : "Contact us";

  /* --------------------------------------------------
     SEO
  -------------------------------------------------- */
  const seoDescription =
    place?.description ||
    `Explore ${
      place?.place_name || "this destination"
    } with ${BRAND_NAME}. Discover travel experiences, attractions, best time to visit and holiday packages.`;

  const destinationPath = `/destinations/${place?.slug || slug}`;

  const canonicalUrl = `${SITE_URL}${destinationPath}`;

  /* --------------------------------------------------
     JSON-LD
  -------------------------------------------------- */
  const jsonLd = useMemo(() => {
    if (!place) return null;

    const packageItems = destinationPackages.map((pkg) => {
      const image = getPackageImage(pkg);

      return {
        "@type": "Product",
        name: pkg?.title,
        url: `${SITE_URL}/packages/${pkg.slug}`,
        description: pkg?.description || undefined,
        image: image ? [image] : undefined,
        ...(hasNumericPrice(pkg?.price)
          ? {
              offers: {
                "@type": "Offer",
                price: Number(pkg.price),
                priceCurrency: "INR",
                url: `${SITE_URL}/packages/${pkg.slug}`,
                availability: "https://schema.org/InStock",
              },
            }
          : {}),
      };
    });

    return [
      {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        name: place.place_name,
        description: seoDescription,
        image: destinationImage ? [destinationImage] : [],
        url: canonicalUrl,
      },

      ...(packageItems.length > 0
        ? [
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `Holiday Packages in ${place.place_name}`,
              itemListElement: packageItems.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item,
              })),
            },
          ]
        : []),

      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Destinations",
            item: `${SITE_URL}/destinations`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: place.place_name,
            item: canonicalUrl,
          },
        ],
      },
    ];
  }, [
    place,
    destinationPackages,
    seoDescription,
    destinationImage,
    canonicalUrl,
  ]);

  /* --------------------------------------------------
     STATES
  -------------------------------------------------- */
  if (loading) {
    return <DetailSkeleton />;
  }

  if (!place) {
    const status = error?.response?.status;
    const isRealError = Boolean(error) && status !== 404;

    if (isRealError) {
      console.error("Failed to load destination:", slug, error);

      return (
        <StateMessage
          title="We couldn't load this destination"
          message="Something went wrong while loading this page. Please check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <StateMessage
        code="404"
        title="Destination not found"
        message="The destination you are looking for may have been removed or is no longer available."
      />
    );
  }

  /* --------------------------------------------------
     MAIN

     NOTE (sticky sidebar): the page wrapper uses
     overflow-x-clip, NOT overflow-x-hidden.
     overflow-x-hidden turns the wrapper into a scroll
     container, which silently breaks position: sticky on
     the sidebar.
  -------------------------------------------------- */
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      {/* ==================================================
          SEO
      ================================================== */}
      <Seo
        title={`${place.place_name} — Travel Guide & Packages | ${BRAND_NAME}`}
        description={seoDescription}
        canonical={canonicalUrl}
        path={destinationPath}
        image={destinationImage}
        type="website"
        jsonLd={jsonLd}
      />

      {/* ==================================================
          BREADCRUMB
      ================================================== */}
      <section className="border-b border-divider bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 overflow-hidden py-3 text-xs text-muted sm:gap-2 sm:py-4 sm:text-sm"
          >
            <Link to="/" className="shrink-0 transition hover:text-primary">
              Home
            </Link>

            <ChevronRight
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />

            <Link
              to="/destinations"
              className="shrink-0 transition hover:text-primary"
            >
              Destinations
            </Link>

            <ChevronRight
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />

            <span className="truncate font-medium text-text-dark">
              {place.place_name}
            </span>
          </nav>
        </div>
      </section>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}
      <main className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        {/* BACK */}
        <Link
          to="/destinations"
          className="group mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Back to Destinations
        </Link>

        {/* ==================================================
            DESTINATION HEADER
        ================================================== */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary sm:mb-3 sm:text-base">
            <MapPin className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />

            <span className="truncate">{place.place_name}</span>
          </div>

          <h1 className="break-words font-display text-4xl font-semibold leading-tight tracking-tight text-text-display sm:text-5xl lg:text-6xl">
            Explore {place.place_name}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:mt-4 sm:text-base lg:text-lg">
            Discover the beauty, experiences and unforgettable moments waiting
            for you in {place.place_name}.
          </p>
        </section>

        {/* ==================================================
            CONTENT + SIDEBAR
            items-start + self-start keep the sidebar able to stick.
            Sticky starts at lg; below that it flows normally.
        ================================================== */}
        <div className="grid grid-cols-1 items-start gap-8 pb-16 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:gap-14">
          {/* ==================================================
              LEFT CONTENT
          ================================================== */}
          <div className="min-w-0 space-y-10 sm:space-y-12 lg:space-y-14">
            {/* COVER IMAGE
                Fills the full width of the column, so a normal landscape
                photo has no empty space. Nothing is cropped. Only a very
                tall photo reaches the height cap; it is then shown whole
                and centred. */}
            <section>
              {destinationImage ? (
                <div className="overflow-hidden rounded-2xl bg-surface-soft shadow-travel-card sm:rounded-3xl">
                  <FullImage
                    src={destinationImage}
                    alt={`${place.place_name} — popular travel destination`}
                    eager
                    className="max-h-[24rem] sm:max-h-[32rem] lg:max-h-[40rem]"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-soft shadow-travel-card sm:rounded-3xl">
                  <MapPin className="h-12 w-12 text-placeholder" aria-hidden="true" />
                </div>
              )}
            </section>

            {/* ABOUT */}
            {place.description && (
              <section>
                <h2 className="mb-4 font-display text-3xl font-semibold text-text-dark sm:mb-5">
                  About {place.place_name}
                </h2>

                <div className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base sm:leading-8 lg:text-lg">
                  {place.description}
                </div>
              </section>
            )}

            {/* TRAVEL INFORMATION */}
            {(place.best_time_to_visit || hasStartingPrice) && (
              <section>
                <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark sm:mb-6">
                  Travel Information
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  {place.best_time_to_visit && (
                    <InfoCard
                      icon={
                        <CalendarDays className="h-5 w-5" aria-hidden="true" />
                      }
                      label="Best Time"
                      title="Best Time to Visit"
                    >
                      <p className="text-sm leading-6 text-text sm:text-base">
                        {place.best_time_to_visit}
                      </p>
                    </InfoCard>
                  )}

                  {hasStartingPrice && (
                    <InfoCard
                      icon={
                        <IndianRupee className="h-5 w-5" aria-hidden="true" />
                      }
                      label="Starting From"
                      title="Holiday Packages"
                    >
                      <p className="font-display text-3xl font-semibold text-primary">
                        {formattedPrice}
                      </p>

                      <p className="mt-1 text-xs text-muted sm:text-sm">
                        Package price starts from
                      </p>
                    </InfoCard>
                  )}
                </div>
              </section>
            )}

            {/* HOLIDAY PACKAGES */}
            <section id="holiday-packages">
              <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <PackageCheck className="h-5 w-5" aria-hidden="true" />

                    <span className="text-sm font-semibold">
                      Holiday Packages
                    </span>
                  </div>

                  <h2 className="font-display text-3xl font-semibold text-text-dark">
                    Holiday Packages in {place.place_name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-text-secondary sm:text-base">
                    Explore holiday packages available for {place.place_name}{" "}
                    and choose the experience that suits your travel plans.
                  </p>
                </div>

                {destinationPackages.length > 0 && (
                  <Link
                    to="/packages"
                    className="group inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-link"
                  >
                    <span className="link-reveal">View All Packages</span>
                    <ChevronRight
                      className="arrow-shift h-4 w-4"
                      aria-hidden="true"
                    />
                  </Link>
                )}
              </div>

              {destinationPackages.length > 0 ? (
                <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  {destinationPackages.map((pkg) => {
                    const packageImage = getPackageImage(pkg);

                    const hasNights =
                      pkg.duration_nights !== null &&
                      pkg.duration_nights !== undefined;

                    return (
                      <article
                        key={pkg.id ?? pkg.slug}
                        className="card-lift h-full rounded-2xl"
                      >
                        <Link
                          to={`/packages/${encodeURIComponent(pkg.slug)}`}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card hover:border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          {/* PACKAGE IMAGE (card thumbnail: fixed ratio so the grid stays even) */}
                          <div className="img-zoom relative aspect-[16/10] shrink-0 bg-surface-strong">
                            {packageImage ? (
                              <img
                                src={packageImage}
                                alt={pkg.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                width="800"
                                height="500"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-surface-soft">
                                <PackageCheck
                                  className="h-9 w-9 text-placeholder"
                                  aria-hidden="true"
                                />
                              </div>
                            )}

                            {pkg.is_most_visited && (
                              <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-primary-dark shadow-travel-card">
                                Most Visited
                              </span>
                            )}
                          </div>

                          {/* PACKAGE CONTENT */}
                          <div className="flex flex-1 flex-col p-5">
                            <h3 className="line-clamp-2 font-display text-xl font-semibold leading-tight text-text-dark transition-colors duration-300 group-hover:text-primary">
                              {pkg.title}
                            </h3>

                            {pkg.description && (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
                                {pkg.description}
                              </p>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary sm:text-sm">
                              {pkg.duration_days && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3
                                    className="h-4 w-4 text-accent"
                                    aria-hidden="true"
                                  />

                                  {pkg.duration_days}{" "}
                                  {Number(pkg.duration_days) === 1
                                    ? "Day"
                                    : "Days"}
                                  {hasNights &&
                                    ` / ${pkg.duration_nights} ${
                                      Number(pkg.duration_nights) === 1
                                        ? "Night"
                                        : "Nights"
                                    }`}
                                </span>
                              )}

                              {pkg.package_type && (
                                <span className="capitalize">
                                  {String(pkg.package_type).replaceAll(
                                    "_",
                                    " "
                                  )}
                                </span>
                              )}
                            </div>

                            <div className="mt-auto flex items-end justify-between gap-4 border-t border-divider pt-4">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-muted">
                                  Starting from
                                </p>

                                <p className="mt-0.5 font-display text-2xl font-semibold leading-none text-primary">
                                  {formatPrice(pkg.price)}
                                </p>
                              </div>

                              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-link">
                                View package
                                <ChevronRight
                                  className="arrow-shift h-4 w-4"
                                  aria-hidden="true"
                                />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </RevealGroup>
              ) : (
                <div className="rounded-2xl border border-dashed border-divider bg-card p-6 text-center sm:p-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
                    <PackageCheck
                      className="h-6 w-6 text-placeholder"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-3 font-display text-xl font-semibold text-text-dark">
                    Packages coming soon
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                    We are currently preparing holiday packages for{" "}
                    {place.place_name}. You can still contact our travel team to
                    plan your trip.
                  </p>

                  <button
                    type="button"
                    onClick={() => setEnquiry(true)}
                    className="group mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
                  >
                    Plan My Trip
                    <Send className="arrow-shift h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </section>

            {/* WHY VISIT */}
            <section>
              <div className="rounded-2xl bg-surface-soft p-5 sm:rounded-3xl sm:p-7 lg:p-8">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <MapPin className="h-5 w-5" aria-hidden="true" />

                  <span className="text-sm font-semibold">
                    Travel Highlights
                  </span>
                </div>

                <h2 className="mb-4 font-display text-3xl font-semibold text-text-dark">
                  Why Visit {place.place_name}?
                </h2>

                <p className="text-sm leading-7 text-text sm:text-base">
                  Experience the unique landscapes, local culture, memorable
                  attractions and incredible experiences that make{" "}
                  {place.place_name} a wonderful holiday destination.
                </p>
              </div>
            </section>
          </div>

          {/* ==================================================
              RIGHT SIDEBAR
              Sticky ONLY on desktop (lg+). Offset follows the fixed
              header, same as PackageDetail.
          ================================================== */}
          <aside className="w-full self-start lg:sticky lg:top-[calc(var(--top-info-height,0px)+6rem)]">
            <div className="rounded-2xl border border-divider bg-card p-5 shadow-travel-card sm:rounded-3xl sm:p-6 lg:p-7">
              {/* DISCOVER CARD (light brand gradient, not a dark block) */}
              <div className="relative mb-5 overflow-hidden rounded-2xl border border-primary/10 bg-brand-gradient p-5 sm:p-6">
                <div className="relative">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-travel-card">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Discover
                  </p>

                  <h2 className="mb-2 font-display text-2xl font-semibold text-text-dark">
                    Explore {place.place_name}
                  </h2>

                  <p className="text-sm leading-6 text-text-secondary">
                    Visit breathtaking places, experience local culture and
                    create unforgettable memories.
                  </p>
                </div>
              </div>

              {/* SUPPORT TEXT */}
              <div className="rounded-xl bg-surface p-4">
                <p className="text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
                  Need help planning your trip to{" "}
                  <strong className="text-text-dark">
                    {place.place_name}
                  </strong>
                  ? Our travel team can help create a personalized holiday for
                  you.
                </p>

                <button
                  type="button"
                  onClick={() => setEnquiry(true)}
                  className="group mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2"
                >
                  Enquire Now
                  <Send className="arrow-shift h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ==================================================
          REVIEW CTA
          Full-width band BELOW <main>, above the FAQ
          (same as PackageDetail).
      ================================================== */}
      <section className="border-y border-divider bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-6 rounded-2xl border border-divider bg-card p-6 shadow-travel-card sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
                Traveller experiences
              </p>

              <h2 className="mt-2 font-display text-3xl font-semibold text-text-dark">
                Your Valuable Review
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-text sm:text-base">
                Share your experience with {BRAND_NAME} and help future
                travellers plan their journey.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReview(true)}
              className={`${PRIMARY_BUTTON} min-h-[44px] shrink-0 px-5 py-3.5`}
            >
              <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
              Your Valuable Review
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          FAQ
      ================================================== */}
      <section className="w-full">
        <FAQSection category="most_visited" />
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}
      <Footer />

      {/* ==================================================
          ENQUIRY MODAL
      ================================================== */}
      {enquiry && (
        <EnquiryForm
          destination={place}
          showPackageType={false}
          onClose={() => setEnquiry(false)}
        />
      )}

      {/* ==================================================
          REVIEW MODAL
      ================================================== */}
      {showReview && (
        <ReviewFormModal
          open={showReview}
          onClose={() => setShowReview(false)}
          onSubmitted={() => setShowReview(false)}
        />
      )}
    </div>
  );
}





