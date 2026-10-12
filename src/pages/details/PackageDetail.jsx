


import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Download,
  FileText,
  IndianRupee,
  MapPin,
  MessageSquareHeart,
  ShieldCheck,
  X,
} from "lucide-react";

import { getPackageBySlug } from "../../api/content";
import { useQuery } from "../../hooks/useQuery";
import Footer from "../../components/Footer";
import Seo from "../../components/Seo";
import FAQSection from "../../components/FAQSection";
import EnquiryForm from "../EnquiryForm";
import ReviewFormModal from "../../components/ReviewFormModal";
import generatePackagePDF from "../../components/PackageItineraryPDF";

/* =========================================================
   BRAND
   Written in Title Case. Set VITE_SITE_URL in .env so SEO
   links use your real domain.
========================================================= */

const BRAND_NAME = "Manyara Prive Vacations";

const SITE_URL = (
  import.meta.env.VITE_SITE_URL || window.location.origin
).replace(/\/$/, "");

const PACKAGE_TYPE_LABELS = {
  pilgrimage: "Pilgrimage",
  mountains_adventure: "Mountains & Adventure",
  romantic: "Romantic",
  international: "International",
  beach: "Beach",
  family: "Family",
  wildlife_nature: "Wildlife & Nature",
};

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70";

/* =========================================================
   HELPERS
========================================================= */

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image.trim();

  return image.url || image.secure_url || image.src || image.image_url || "";
};

const getTextValue = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;

  return (
    item.name || item.title || item.description || item.text || item.value || ""
  );
};

/* Seasonal packages are saved with destination = null, so fall back
   to the seasonal destination object when the API returns it. */
const getPlaceName = (place) =>
  place?.place_name || place?.name || place?.title || "";

/* Accepts an array, or a comma separated string */
const getListItems = (value) => {
  const items = Array.isArray(value) ? value.map(getTextValue) : [value];

  return items
    .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
    .map((part) => part.trim())
    .filter(Boolean);
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "Price on request";
  }

  const number = Number(price);
  if (Number.isNaN(number)) return String(price);

  return `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

/* "5 Days / 4 nights" */
const formatDuration = (days, nights) => {
  const numericDays = Number(days);
  if (!numericDays || Number.isNaN(numericDays)) return "";

  const daysText = `${numericDays} ${numericDays === 1 ? "Day" : "Days"}`;

  if (nights === undefined || nights === null) return daysText;

  return `${daysText} / ${nights} ${Number(nights) === 1 ? "night" : "nights"}`;
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

/*
  FullImage
  Shows the WHOLE image (object-contain, never cropped). A blurred,
  dimmed copy of the same image fills any empty space so portrait or
  odd-ratio photos still look polished.
  The parent must be `relative overflow-hidden`.
*/
function FullImage({ src, alt, eager = false, imgClassName = "" }) {
  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />

      <img
        src={src}
        alt={alt}
        className={`relative mx-auto block ${imgClassName}`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </>
  );
}

/* Elegant section title: small gold-toned eyebrow, serif heading, hairline */
function SectionHeading({ eyebrow, title, aside }) {
  return (
    <div className="mb-6 sm:mb-7">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {eyebrow}
            </p>
          )}

          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-text-dark sm:text-4xl">
            {title}
          </h2>
        </div>

        {aside && <span className="shrink-0 pb-1 text-sm text-muted">{aside}</span>}
      </div>

      <div className="mt-3 flex items-center gap-3" aria-hidden="true">
        <span className="h-px w-12 bg-champagne" />
        <span className="h-1.5 w-1.5 rotate-45 bg-champagne" />
        <span className="h-px flex-1 bg-gradient-to-r from-champagne/60 to-transparent" />
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-divider bg-surface p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-travel-card">
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
      </div>

      <p className="break-words font-display text-2xl font-semibold leading-snug text-text-dark">
        {value}
      </p>
    </div>
  );
}

function SidebarInfo({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-lighter text-primary">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <p className="break-words font-semibold text-text-dark">{value}</p>
      </div>
    </div>
  );
}

function PolicyCard({ type, onClick }) {
  const isTerms = type === "terms";
  const Icon = isTerms ? FileText : ShieldCheck;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-divider bg-card p-5 text-left transition-all duration-200 hover:border-primary hover:shadow-travel-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-lighter text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold text-text-dark">
            {isTerms ? "Terms & Conditions" : "Cancellation Policy"}
          </h3>

          <p className="mt-1 text-sm text-muted">
            {isTerms
              ? "View booking terms and important information"
              : "View cancellation and refund information"}
          </p>
        </div>

        <ChevronRight
          className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

/* Shown only on the very first visit, before anything is cached. */
function DetailSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Loading package details"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-48 rounded bg-primary/10" />
        <div className="mt-8 h-5 w-40 rounded bg-primary/10" />
        <div className="mt-4 h-12 w-3/4 rounded bg-primary/10" />
        <div className="mt-8 aspect-[4/3] rounded-3xl bg-primary/10 sm:aspect-[16/9]" />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="h-8 w-56 rounded bg-primary/10" />
            <div className="h-4 rounded bg-primary/10" />
            <div className="h-4 rounded bg-primary/10" />
            <div className="h-4 w-2/3 rounded bg-primary/10" />
          </div>
          <div className="h-80 rounded-3xl bg-primary/10" />
        </div>
      </div>
    </div>
  );
}

/* Missing package (404) vs. a real loading problem */
function StateMessage({ title, message, onRetry }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-lighter">
          <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>

        <h1 className="mb-3 font-display text-4xl font-semibold text-text-dark">
          {title}
        </h1>

        <p className="mx-auto mb-8 max-w-md text-text">{message}</p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`${PRIMARY_BUTTON} px-5 py-3`}
            >
              Try again
            </button>
          )}

          <Link to="/packages" className={`${PRIMARY_BUTTON} px-5 py-3`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Packages
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function PackageDetail() {
  const { slug } = useParams();

  /* Cached data: instant on repeat visits, updates itself when fresh. */
  const { data, loading, error } = useQuery(getPackageBySlug, slug);
  const pkg = data?.data ?? data ?? null;

  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  /* Floating "Download Itinerary" button (mobile + tablet).
     Small sentinel elements are observed instead of the whole (very tall)
     page content, so it works for 10-12 day itineraries too. */
  const heroEndRef = useRef(null);
  const asideRef = useRef(null);
  const reviewSectionRef = useRef(null);
  const faqSectionRef = useRef(null);
  const [showFloatingDownload, setShowFloatingDownload] = useState(false);

  /* ---------------------------------------------------------
     Floating button: visible once the cover has scrolled away,
     hidden while the sidebar card, review CTA or FAQ is on
     screen, and while a modal is open.
  --------------------------------------------------------- */

  useEffect(() => {
    if (loading || !pkg) {
      setShowFloatingDownload(false);
      return undefined;
    }

    const flags = {
      pastHero: false,
      asideVisible: false,
      reviewVisible: false,
      faqVisible: false,
    };

    const update = () =>
      setShowFloatingDownload(
        flags.pastHero &&
          !flags.asideVisible &&
          !flags.reviewVisible &&
          !flags.faqVisible &&
          !showEnquiry &&
          !showReview
      );

    /* threshold 0 on SMALL elements: independent of page height */
    const watch = (element, handler) => {
      if (!element) return null;

      const observer = new IntersectionObserver(([entry]) => {
        handler(entry);
        update();
      });

      observer.observe(element);
      return observer;
    };

    const observers = [
      watch(heroEndRef.current, (entry) => {
        flags.pastHero =
          !entry.isIntersecting && entry.boundingClientRect.top < 0;
      }),
      watch(asideRef.current, (entry) => {
        flags.asideVisible = entry.isIntersecting;
      }),
      watch(reviewSectionRef.current, (entry) => {
        flags.reviewVisible = entry.isIntersecting;
      }),
      watch(faqSectionRef.current, (entry) => {
        flags.faqVisible = entry.isIntersecting;
      }),
    ].filter(Boolean);

    update();

    return () => observers.forEach((observer) => observer.disconnect());
  }, [loading, pkg, showEnquiry, showReview]);

  /* Close the policy popup with Escape */
  useEffect(() => {
    if (!activePolicy) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setActivePolicy(null);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activePolicy]);

  /* ---------------------------------------------------------
     Derived content
  --------------------------------------------------------- */

  const destinationName = useMemo(
    () =>
      pkg?.destination ||
      getPlaceName(pkg?.seasoned_destination_obj) ||
      getPlaceName(pkg?.seasoned_destination) ||
      "",
    [pkg]
  );

  const packageImages = useMemo(() => {
    if (!pkg?.images) return [];

    const images = Array.isArray(pkg.images) ? pkg.images : [pkg.images];
    return images.map(getImageUrl).filter(Boolean);
  }, [pkg]);

  const itinerary = useMemo(() => {
    if (!Array.isArray(pkg?.itinerary)) return [];

    return [...pkg.itinerary]
      .sort((a, b) => Number(a?.day || 0) - Number(b?.day || 0))
      .map((item, index) => ({
        ...item,
        day: item?.day || index + 1,
        title: item?.title || "",
        description: item?.description || "",
        image: getImageUrl(item?.image),
      }));
  }, [pkg]);

  const facilities = useMemo(() => getListItems(pkg?.facilities), [pkg]);
  const inclusions = useMemo(() => getListItems(pkg?.inclusions), [pkg]);
  const exclusions = useMemo(() => getListItems(pkg?.exclusions), [pkg]);

  const formattedPrice = formatPrice(pkg?.price);
  const hasPrice =
    pkg?.price !== null && pkg?.price !== undefined && pkg?.price !== "";

  const durationLabel = formatDuration(pkg?.duration_days, pkg?.duration_nights);

  const packageTypeLabel = useMemo(() => {
    if (!pkg?.package_type) return "";

    return (
      PACKAGE_TYPE_LABELS[pkg.package_type] ||
      String(pkg.package_type)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  }, [pkg]);

  const itineraryDaysLabel = `${itinerary.length} ${
    itinerary.length === 1 ? "Day" : "Days"
  }`;

  /* ---------------------------------------------------------
     SEO
  --------------------------------------------------------- */

  const seoDescription =
    pkg?.description ||
    `Explore ${pkg?.title || "this holiday package"} with ${BRAND_NAME}.`;

  const canonicalUrl = `${SITE_URL}/packages/${encodeURIComponent(slug || "")}`;

  const jsonLd = useMemo(() => {
    if (!pkg) return null;

    return {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: pkg.title,
      description: seoDescription,
      url: canonicalUrl,
      provider: { "@type": "TravelAgency", name: BRAND_NAME },
      touristType: [
        "Leisure travelers",
        "Families",
        "Couples",
        "Adventure travelers",
      ],
      ...(packageImages[0] ? { image: [packageImages[0]] } : {}),
      ...(hasPrice
        ? {
            offers: {
              "@type": "Offer",
              price: Number(pkg.price),
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: canonicalUrl,
            },
          }
        : {}),
    };
  }, [pkg, packageImages, seoDescription, canonicalUrl, hasPrice]);

  /* ---------------------------------------------------------
     Actions
  --------------------------------------------------------- */

  const openDownloadForm = () => {
    setShowEnquiry(true);
    setShowFloatingDownload(false);
  };

  const openReview = () => {
    setShowReview(true);
    setShowFloatingDownload(false);
  };

  const handleDownloadPackagePDF = async () => {
    if (!pkg || downloadingPDF) return;

    try {
      setDownloadingPDF(true);
      /* destination fallback so seasonal packages still show a location */
      await generatePackagePDF({ ...pkg, destination: destinationName });
    } catch (pdfError) {
      console.error("Package PDF generation failed:", pdfError);
      window.alert("Unable to generate the itinerary PDF. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  /* Download Itinerary -> enquiry form -> enquiry saved -> onSuccess -> PDF.
     EnquiryForm gets downloadItinerary={false} so the PDF is not made twice. */
  const handleEnquirySuccess = () => handleDownloadPackagePDF();

  /* ---------------------------------------------------------
     States
  --------------------------------------------------------- */

  if (loading) return <DetailSkeleton />;

  if (!pkg) {
    const status = error?.response?.status;
    const isRealError = Boolean(error) && status !== 404;

    if (isRealError) {
      return (
        <StateMessage
          title="We couldn't load this package"
          message="Something went wrong while loading this page. Please check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <StateMessage
        title="Package Not Found"
        message="The package you are looking for may have been removed or is no longer available."
      />
    );
  }

  /* ---------------------------------------------------------
     Page
  --------------------------------------------------------- */

  return (
    <>
      <Seo
        title={`${pkg.title} | ${BRAND_NAME}`}
        description={seoDescription}
        canonical={canonicalUrl}
        image={packageImages[0]}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen overflow-x-clip bg-background">
        {/* BREADCRUMB */}
        <section className="border-b border-divider bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-sm text-muted"
            >
              <Link to="/" className="transition hover:text-primary">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              <Link to="/packages" className="transition hover:text-primary">
                Packages
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="max-w-[220px] truncate font-medium text-text-dark sm:max-w-none">
                {pkg.title}
              </span>
            </nav>
          </div>
        </section>

        {/* PACKAGE CONTENT AREA */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="pt-6 sm:pt-8">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Packages
            </Link>
          </div>

          {/* TITLE */}
          <section className="pb-6 pt-5 sm:pt-7">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              {destinationName && (
                <div className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary sm:text-[13px]">
                  <MapPin className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span className="truncate">{destinationName}</span>
                </div>
              )}

              {packageTypeLabel && (
                <span className="inline-flex items-center rounded-full border border-champagne bg-champagne-light px-3 py-1.5 text-xs font-semibold text-text-dark sm:text-sm">
                  {packageTypeLabel}
                </span>
              )}
            </div>

            <h1 className="break-words font-display text-4xl font-semibold leading-[1.1] tracking-tight text-text-display sm:text-5xl lg:text-6xl">
              {pkg.title}
            </h1>

            {durationLabel && (
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-text-secondary sm:text-base">
                <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                <span>{durationLabel}</span>
              </div>
            )}
          </section>

          {/* COVER IMAGE
              Whole image is always visible (object-contain). A blurred copy
              fills any empty space. No 21:9 / 2.4:1 crop. */}
          <section className="pb-8 sm:pb-10">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-strong shadow-travel-card sm:aspect-[16/9] sm:rounded-3xl">
              {packageImages.length > 0 ? (
                <FullImage
                  src={packageImages[0]}
                  alt={pkg.title}
                  eager
                  imgClassName="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-soft">
                  <MapPin className="h-12 w-12 text-ink-300" aria-hidden="true" />
                </div>
              )}
            </div>
          </section>

          {/* Sentinel: the floating button appears once this scrolls out of view */}
          <div ref={heroEndRef} aria-hidden="true" className="h-px" />

          {/* DESCRIPTION */}
          {pkg.description && (
            <section className="pb-10 sm:pb-12">
              <SectionHeading eyebrow="The Experience" title="About This Package" />

              <p className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base sm:leading-8">
                {pkg.description}
              </p>
            </section>
          )}

          {/* TWO COLUMNS */}
          <div className="grid grid-cols-1 items-start gap-8 pb-16 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:gap-14">
            {/* LEFT */}
            <div className="min-w-0">
              {/* PACKAGE INFORMATION */}
              <section className="mb-10 sm:mb-12">
                <SectionHeading eyebrow="At a Glance" title="Package Information" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {durationLabel && (
                    <InfoCard
                      icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
                      label="Duration"
                      value={durationLabel}
                    />
                  )}

                  {destinationName && (
                    <InfoCard
                      icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                      label="Destination"
                      value={destinationName}
                    />
                  )}

                  {packageTypeLabel && (
                    <InfoCard
                      icon={<Compass className="h-5 w-5" aria-hidden="true" />}
                      label="Package Type"
                      value={packageTypeLabel}
                    />
                  )}

                  <InfoCard
                    icon={<IndianRupee className="h-5 w-5" aria-hidden="true" />}
                    label="Starting From"
                    value={formattedPrice}
                  />
                </div>
              </section>

              {/* ITINERARY */}
              {itinerary.length > 0 && (
                <section className="mb-10 sm:mb-12">
                  <SectionHeading
                    eyebrow="Your Journey"
                    title="Itinerary"
                    aside={itineraryDaysLabel}
                  />

                  <div className="space-y-5 sm:space-y-6">
                    {itinerary.map((item, index) => (
                      <article
                        key={`${item.day}-${index}`}
                        className="overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card sm:rounded-3xl"
                      >
                        <div className="flex items-start gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-lighter text-primary">
                            <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">
                              Day
                            </span>
                            <span className="font-display text-2xl font-semibold leading-none">
                              {String(item.day).padStart(2, "0")}
                            </span>
                          </div>

                          <div className="min-w-0 pt-1">
                            <h3 className="break-words font-display text-2xl font-semibold leading-snug text-text-dark sm:text-[1.7rem]">
                              {item.title || `Day ${item.day}`}
                            </h3>
                          </div>
                        </div>

                        {/* Height follows the image: nothing is cropped */}
                        {item.image && (
                          <div className="relative mt-5 overflow-hidden bg-surface-strong">
                            <FullImage
                              src={item.image}
                              alt={`${pkg.title} - Day ${item.day}`}
                              imgClassName="h-auto max-h-[32rem] w-full object-contain"
                            />
                          </div>
                        )}

                        {item.description && (
                          <div className="p-5 sm:p-6">
                            <p className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base sm:leading-8">
                              {item.description}
                            </p>
                          </div>
                        )}

                        {!item.image && !item.description && (
                          <div className="pb-5 sm:pb-6" />
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* FACILITIES */}
              {facilities.length > 0 && (
                <section className="mb-10 sm:mb-12">
                  <SectionHeading eyebrow="Comforts" title="Facilities" />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {facilities.map((facility, index) => (
                      <div
                        key={`${facility}-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-divider bg-card p-4"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <span className="min-w-0 break-words text-sm text-text sm:text-base">
                          {facility}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* INCLUSIONS / EXCLUSIONS */}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <section className="mb-10 sm:mb-12">
                  <SectionHeading eyebrow="The Details" title="What’s Included" />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {inclusions.length > 0 && (
                      <div className="rounded-2xl border border-success/30 bg-success-bg/50 p-5 sm:p-6">
                        <h3 className="mb-5 font-display text-2xl font-semibold text-text-dark">
                          Inclusions
                        </h3>

                        <ul className="space-y-3">
                          {inclusions.map((item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="flex items-start gap-3 text-sm text-text sm:text-base"
                            >
                              <Check
                                className="mt-0.5 h-5 w-5 shrink-0 text-success"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 break-words">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {exclusions.length > 0 && (
                      <div className="rounded-2xl border border-error/30 bg-error-bg/50 p-5 sm:p-6">
                        <h3 className="mb-5 font-display text-2xl font-semibold text-text-dark">
                          Exclusions
                        </h3>

                        <ul className="space-y-3">
                          {exclusions.map((item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="flex items-start gap-3 text-sm text-text sm:text-base"
                            >
                              <X
                                className="mt-0.5 h-5 w-5 shrink-0 text-error"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 break-words">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* TERMS & CANCELLATION */}
              {(pkg.terms_and_conditions || pkg.cancellation_policy) && (
                <section className="mb-10 sm:mb-12">
                  <SectionHeading eyebrow="Good to Know" title="Important Information" />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {pkg.terms_and_conditions && (
                      <PolicyCard
                        type="terms"
                        onClick={() => setActivePolicy("terms")}
                      />
                    )}

                    {pkg.cancellation_policy && (
                      <PolicyCard
                        type="cancellation"
                        onClick={() => setActivePolicy("cancellation")}
                      />
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT SIDEBAR
                Sticky on desktop only. The wrapper uses overflow-x-clip (not
                -hidden) so position: sticky keeps working. */}
            <aside
              ref={asideRef}
              className="w-full self-start lg:sticky lg:top-[calc(var(--top-info-height,0px)+6rem)]"
            >
              <div className="rounded-2xl border border-divider bg-card p-5 shadow-travel-card sm:rounded-3xl sm:p-6 lg:p-7">
                {/* PRICE */}
                <div className="mb-5 rounded-2xl border border-primary/10 bg-brand-gradient p-5">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Starting from
                  </p>

                  <div className="flex flex-wrap items-end gap-2">
                    <span className="font-display text-4xl font-semibold leading-none text-text-dark sm:text-5xl">
                      {formattedPrice}
                    </span>

                    {hasPrice && (
                      <span className="pb-1 text-sm text-text-secondary">/ person</span>
                    )}
                  </div>
                </div>

                {/* SUMMARY */}
                <div className="space-y-4 pb-5">
                  {durationLabel && (
                    <SidebarInfo
                      icon={<Clock className="h-5 w-5" aria-hidden="true" />}
                      label="Duration"
                      value={durationLabel}
                    />
                  )}

                  {destinationName && (
                    <SidebarInfo
                      icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                      label="Destination"
                      value={destinationName}
                    />
                  )}

                  {packageTypeLabel && (
                    <SidebarInfo
                      icon={<Compass className="h-5 w-5" aria-hidden="true" />}
                      label="Package Type"
                      value={packageTypeLabel}
                    />
                  )}

                  {itinerary.length > 0 && (
                    <SidebarInfo
                      icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
                      label="Itinerary"
                      value={itineraryDaysLabel}
                    />
                  )}
                </div>

                {/* ACTIONS */}
                <div className="space-y-3 border-t border-divider pt-5">
                  <button
                    type="button"
                    onClick={openDownloadForm}
                    disabled={downloadingPDF}
                    className={`${PRIMARY_BUTTON} w-full px-5 py-3.5 shadow-brand`}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {downloadingPDF ? "Preparing..." : "Download Itinerary"}
                  </button>

                  <Link
                    to="/packages"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3.5 font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
                  >
                    View More Packages
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  <p className="pt-1 text-center text-xs leading-5 text-muted">
                    Submit your details and receive your personalized trip
                    itinerary.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>

        {/* REVIEW CTA */}
        <section
          ref={reviewSectionRef}
          className="border-y border-divider bg-surface-soft"
        >
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="flex flex-col gap-6 rounded-2xl border border-divider bg-card p-6 shadow-travel-card sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  Traveller experiences
                </p>

                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text-dark sm:text-4xl">
                  Your Valuable Review
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-text sm:text-base">
                  Share your experience with {BRAND_NAME} and help future
                  travellers plan their journey.
                </p>
              </div>

              <button
                type="button"
                onClick={openReview}
                className={`${PRIMARY_BUTTON} shrink-0 px-5 py-3.5`}
              >
                <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
                Your Valuable Review
              </button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section ref={faqSectionRef}>
          <FAQSection category="packages" />
        </section>

        <Footer />

        {/* FLOATING DOWNLOAD (mobile + tablet) */}
        {showFloatingDownload && (
          <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-[80] sm:left-6 lg:hidden">
            <button
              type="button"
              onClick={openDownloadForm}
              disabled={downloadingPDF}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 sm:px-5 sm:py-3.5 sm:text-base"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span>{downloadingPDF ? "Preparing..." : "Download Itinerary"}</span>
            </button>
          </div>
        )}

        {/* ENQUIRY / DOWNLOAD FORM */}
        {showEnquiry && (
          <EnquiryForm
            pkg={pkg}
            destination={destinationName || null}
            onClose={() => setShowEnquiry(false)}
            onSuccess={handleEnquirySuccess}
            downloadItinerary={false}
          />
        )}

        {/* REVIEW MODAL */}
        {showReview && (
          <ReviewFormModal
            open={showReview}
            pkg={pkg}
            onClose={() => setShowReview(false)}
            onSubmitted={() => setShowReview(false)}
          />
        )}

        {/* TERMS / CANCELLATION POPUP */}
        {activePolicy && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 p-3 backdrop-blur-sm sm:p-4"
            onClick={() => setActivePolicy(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
          >
            <div
              className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl sm:rounded-3xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-divider px-5 py-5 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-lighter text-primary">
                    {activePolicy === "terms" ? (
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2
                      id="policy-modal-title"
                      className="font-display text-2xl font-semibold text-text-dark"
                    >
                      {activePolicy === "terms"
                        ? "Terms & Conditions"
                        : "Cancellation Policy"}
                    </h2>

                    <p className="text-xs text-muted sm:text-sm">
                      {activePolicy === "terms"
                        ? "Important booking information"
                        : "Cancellation and refund information"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePolicy(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface transition hover:bg-surface-soft"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-text-dark" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
                <div className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base">
                  {activePolicy === "terms"
                    ? pkg.terms_and_conditions
                    : pkg.cancellation_policy}
                </div>
              </div>

              <div className="shrink-0 border-t border-divider bg-surface px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={() => setActivePolicy(null)}
                  className={`${PRIMARY_BUTTON} w-full px-6 py-3 sm:ml-auto sm:w-auto`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}











































// import { useEffect, useMemo, useRef, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   CalendarDays,
//   Check,
//   ChevronRight,
//   Clock,
//   Download,
//   FileText,
//   MapPin,
//   MessageSquareHeart,
//   ShieldCheck,
//   X,
// } from "lucide-react";

// import { getPackageBySlug } from "../../api/content";
// import { useQuery } from "../../hooks/useQuery";
// import Footer from "../../components/Footer";
// import Seo from "../../components/Seo";
// import FAQSection from "../../components/FAQSection";
// import EnquiryForm from "../EnquiryForm";
// import ReviewFormModal from "../../components/ReviewFormModal";
// import generatePackagePDF from "../../components/PackageItineraryPDF";

// /* =========================================================
//    BRAND
//    Written in Title Case. Set VITE_SITE_URL in .env so SEO
//    links use your real domain.
// ========================================================= */

// const BRAND_NAME = "Manyara Prive Vacations";

// const SITE_URL = (
//   import.meta.env.VITE_SITE_URL || window.location.origin
// ).replace(/\/$/, "");

// const PACKAGE_TYPE_LABELS = {
//   pilgrimage: "Pilgrimage",
//   mountains_adventure: "Mountains & Adventure",
//   romantic: "Romantic",
//   international: "International",
//   beach: "Beach",
//   family: "Family",
//   wildlife_nature: "Wildlife & Nature",
// };

// const PRIMARY_BUTTON =
//   "inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70";

// /* =========================================================
//    HELPERS
// ========================================================= */

// const getImageUrl = (image) => {
//   if (!image) return "";
//   if (typeof image === "string") return image.trim();

//   return (
//     image.url || image.secure_url || image.src || image.image_url || ""
//   );
// };

// const getTextValue = (item) => {
//   if (!item) return "";
//   if (typeof item === "string") return item;

//   return (
//     item.name || item.title || item.description || item.text || item.value || ""
//   );
// };

// /* Accepts an array, or a comma separated string */
// const getListItems = (value) => {
//   const items = Array.isArray(value) ? value.map(getTextValue) : [value];

//   return items
//     .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
//     .map((part) => part.trim())
//     .filter(Boolean);
// };

// const formatPrice = (price) => {
//   if (price === null || price === undefined || price === "") {
//     return "Price on request";
//   }

//   const number = Number(price);
//   if (Number.isNaN(number)) return String(price);

//   return `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// };

// /* "5 Days / 4 nights" */
// const formatDuration = (days, nights) => {
//   const numericDays = Number(days);
//   if (!numericDays || Number.isNaN(numericDays)) return "";

//   const daysText = `${numericDays} ${numericDays === 1 ? "Day" : "Days"}`;

//   if (nights === undefined || nights === null) return daysText;

//   return `${daysText} / ${nights} ${Number(nights) === 1 ? "night" : "nights"}`;
// };

// /* =========================================================
//    SMALL COMPONENTS
// ========================================================= */

// function InfoCard({ icon, label, value }) {
//   return (
//     <div className="min-w-0 rounded-2xl border border-divider bg-surface p-5">
//       <div className="mb-2 flex items-center gap-3">
//         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
//           {icon}
//         </div>
//         <span className="text-sm text-muted">{label}</span>
//       </div>

//       <p className="break-words font-bold text-text-dark">{value}</p>
//     </div>
//   );
// }

// function SidebarInfo({ icon, label, value }) {
//   return (
//     <div className="flex min-w-0 items-center gap-3">
//       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-lighter text-primary">
//         {icon}
//       </div>

//       <div className="min-w-0">
//         <p className="text-xs text-muted">{label}</p>
//         <p className="break-words font-semibold text-text-dark">{value}</p>
//       </div>
//     </div>
//   );
// }

// function PolicyCard({ type, onClick }) {
//   const isTerms = type === "terms";
//   const Icon = isTerms ? FileText : ShieldCheck;

//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className="group w-full rounded-2xl border border-divider bg-card p-5 text-left transition-all duration-200 hover:border-primary hover:shadow-travel-card sm:p-6"
//     >
//       <div className="flex items-center gap-4">
//         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-lighter text-primary transition-colors group-hover:bg-primary group-hover:text-white">
//           <Icon className="h-6 w-6" aria-hidden="true" />
//         </div>

//         <div className="min-w-0 flex-1">
//           <h3 className="text-base font-bold text-text-dark sm:text-lg">
//             {isTerms ? "Terms & Conditions" : "Cancellation Policy"}
//           </h3>

//           <p className="mt-1 text-sm text-muted">
//             {isTerms
//               ? "View booking terms and important information"
//               : "View cancellation and refund information"}
//           </p>
//         </div>

//         <ChevronRight
//           className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-primary"
//           aria-hidden="true"
//         />
//       </div>
//     </button>
//   );
// }

// /* Shown only on the very first visit, before anything is cached. */
// function DetailSkeleton() {
//   return (
//     <div
//       className="min-h-screen bg-background"
//       role="status"
//       aria-label="Loading package details"
//     >
//       <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
//         <div className="h-4 w-48 rounded bg-primary/10" />
//         <div className="mt-8 h-5 w-40 rounded bg-primary/10" />
//         <div className="mt-4 h-12 w-3/4 rounded bg-primary/10" />
//         <div className="mt-8 aspect-[16/9] rounded-3xl bg-primary/10 sm:aspect-[21/9]" />

//         <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
//           <div className="space-y-4">
//             <div className="h-8 w-56 rounded bg-primary/10" />
//             <div className="h-4 rounded bg-primary/10" />
//             <div className="h-4 rounded bg-primary/10" />
//             <div className="h-4 w-2/3 rounded bg-primary/10" />
//           </div>
//           <div className="h-80 rounded-3xl bg-primary/10" />
//         </div>
//       </div>
//     </div>
//   );
// }

// function NotFound({ message }) {
//   return (
//     <div className="min-h-screen bg-background">
//       <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
//         <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-lighter">
//           <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
//         </div>

//         <h1 className="mb-3 font-display text-4xl font-semibold text-text-dark">
//           Package Not Found
//         </h1>

//         <p className="mb-8 text-text">
//           {message || "The package you are looking for does not exist."}
//         </p>

//         <Link to="/packages" className={`${PRIMARY_BUTTON} px-5 py-3`}>
//           <ArrowLeft className="h-4 w-4" aria-hidden="true" />
//           Back to Packages
//         </Link>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    PAGE
// ========================================================= */

// export default function PackageDetail() {
//   const { slug } = useParams();

//   /* Cached data: instant on repeat visits, updates itself when fresh. */
//   const { data, loading, error } = useQuery(getPackageBySlug, slug);
//   const pkg = data?.data ?? data ?? null;

//   const [showEnquiry, setShowEnquiry] = useState(false);
//   const [showReview, setShowReview] = useState(false);
//   const [activePolicy, setActivePolicy] = useState(null);
//   const [downloadingPDF, setDownloadingPDF] = useState(false);

//   /* Floating "Download Itinerary" button (mobile + tablet) */
//   const packageAreaRef = useRef(null);
//   const faqSectionRef = useRef(null);
//   const [showFloatingDownload, setShowFloatingDownload] = useState(false);

//   /* ---------------------------------------------------------
//      Floating button: visible while the package is on screen,
//      hidden near the FAQ and while a modal is open.
//   --------------------------------------------------------- */

//   useEffect(() => {
//     const packageElement = packageAreaRef.current;
//     const faqElement = faqSectionRef.current;

//     if (loading || !pkg || !packageElement) {
//       setShowFloatingDownload(false);
//       return undefined;
//     }

//     let packageVisible = false;
//     let faqVisible = false;

//     const update = () =>
//       setShowFloatingDownload(
//         packageVisible && !faqVisible && !showEnquiry && !showReview
//       );

//     const packageObserver = new IntersectionObserver(
//       ([entry]) => {
//         packageVisible = entry.isIntersecting;
//         update();
//       },
//       { threshold: 0.08, rootMargin: "-10% 0px -15% 0px" }
//     );

//     const faqObserver = faqElement
//       ? new IntersectionObserver(
//           ([entry]) => {
//             faqVisible = entry.isIntersecting;
//             update();
//           },
//           { threshold: 0.05, rootMargin: "0px 0px -10% 0px" }
//         )
//       : null;

//     packageObserver.observe(packageElement);
//     if (faqObserver) faqObserver.observe(faqElement);

//     return () => {
//       packageObserver.disconnect();
//       if (faqObserver) faqObserver.disconnect();
//     };
//   }, [loading, pkg, showEnquiry, showReview]);

//   /* Close the policy popup with Escape */
//   useEffect(() => {
//     if (!activePolicy) return undefined;

//     const onKeyDown = (event) => {
//       if (event.key === "Escape") setActivePolicy(null);
//     };

//     document.addEventListener("keydown", onKeyDown);
//     return () => document.removeEventListener("keydown", onKeyDown);
//   }, [activePolicy]);

//   /* ---------------------------------------------------------
//      Derived content
//   --------------------------------------------------------- */

//   const packageImages = useMemo(() => {
//     if (!pkg?.images) return [];

//     const images = Array.isArray(pkg.images) ? pkg.images : [pkg.images];
//     return images.map(getImageUrl).filter(Boolean);
//   }, [pkg]);

//   const itinerary = useMemo(() => {
//     if (!Array.isArray(pkg?.itinerary)) return [];

//     return [...pkg.itinerary]
//       .sort((a, b) => Number(a?.day || 0) - Number(b?.day || 0))
//       .map((item, index) => ({
//         ...item,
//         day: item?.day || index + 1,
//         title: item?.title || "",
//         description: item?.description || "",
//         image: getImageUrl(item?.image),
//       }));
//   }, [pkg]);

//   const facilities = useMemo(() => getListItems(pkg?.facilities), [pkg]);
//   const inclusions = useMemo(() => getListItems(pkg?.inclusions), [pkg]);
//   const exclusions = useMemo(() => getListItems(pkg?.exclusions), [pkg]);

//   const formattedPrice = formatPrice(pkg?.price);
//   const hasPrice =
//     pkg?.price !== null && pkg?.price !== undefined && pkg?.price !== "";

//   const durationLabel = formatDuration(pkg?.duration_days, pkg?.duration_nights);

//   const packageTypeLabel = useMemo(() => {
//     if (!pkg?.package_type) return "";

//     return (
//       PACKAGE_TYPE_LABELS[pkg.package_type] ||
//       String(pkg.package_type)
//         .replaceAll("_", " ")
//         .replace(/\b\w/g, (letter) => letter.toUpperCase())
//     );
//   }, [pkg]);

//   const itineraryDaysLabel = `${itinerary.length} ${
//     itinerary.length === 1 ? "Day" : "Days"
//   }`;

//   /* ---------------------------------------------------------
//      SEO
//   --------------------------------------------------------- */

//   const seoDescription =
//     pkg?.description ||
//     `Explore ${pkg?.title || "this holiday package"} with ${BRAND_NAME}.`;

//   const canonicalUrl = `${SITE_URL}/packages/${encodeURIComponent(slug || "")}`;

//   const jsonLd = useMemo(() => {
//     if (!pkg) return null;

//     return {
//       "@context": "https://schema.org",
//       "@type": "TouristTrip",
//       name: pkg.title,
//       description: seoDescription,
//       url: canonicalUrl,
//       provider: { "@type": "TravelAgency", name: BRAND_NAME },
//       touristType: [
//         "Leisure travelers",
//         "Families",
//         "Couples",
//         "Adventure travelers",
//       ],
//       ...(packageImages[0] ? { image: [packageImages[0]] } : {}),
//       ...(hasPrice
//         ? {
//             offers: {
//               "@type": "Offer",
//               price: Number(pkg.price),
//               priceCurrency: "INR",
//               availability: "https://schema.org/InStock",
//               url: canonicalUrl,
//             },
//           }
//         : {}),
//     };
//   }, [pkg, packageImages, seoDescription, canonicalUrl, hasPrice]);

//   /* ---------------------------------------------------------
//      Actions
//   --------------------------------------------------------- */

//   const openDownloadForm = () => {
//     setShowEnquiry(true);
//     setShowFloatingDownload(false);
//   };

//   const openReview = () => {
//     setShowReview(true);
//     setShowFloatingDownload(false);
//   };

//   const handleDownloadPackagePDF = async () => {
//     if (!pkg || downloadingPDF) return;

//     try {
//       setDownloadingPDF(true);
//       await generatePackagePDF(pkg);
//     } catch (pdfError) {
//       console.error("Package PDF generation failed:", pdfError);
//       window.alert("Unable to generate the itinerary PDF. Please try again.");
//     } finally {
//       setDownloadingPDF(false);
//     }
//   };

//   /* Download Itinerary -> enquiry form -> enquiry saved -> onSuccess -> PDF.
//      EnquiryForm gets downloadItinerary={false} so the PDF is not made twice. */
//   const handleEnquirySuccess = () => handleDownloadPackagePDF();

//   /* ---------------------------------------------------------
//      States
//   --------------------------------------------------------- */

//   if (loading) return <DetailSkeleton />;

//   if (!pkg) {
//     return (
//       <NotFound
//         message={
//           error?.response?.data?.detail ||
//           error?.message ||
//           "The package you are looking for does not exist."
//         }
//       />
//     );
//   }

//   /* ---------------------------------------------------------
//      Page
//   --------------------------------------------------------- */

//   return (
//     <>
//       <Seo
//         title={`${pkg.title} | ${BRAND_NAME}`}
//         description={seoDescription}
//         canonical={canonicalUrl}
//         image={packageImages[0]}
//         jsonLd={jsonLd}
//       />

//       <div className="min-h-screen overflow-x-clip bg-background">
//         {/* BREADCRUMB */}
//         <section className="border-b border-divider bg-surface">
//           <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
//             <nav
//               aria-label="Breadcrumb"
//               className="flex flex-wrap items-center gap-2 text-sm text-muted"
//             >
//               <Link to="/" className="transition hover:text-primary">
//                 Home
//               </Link>
//               <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
//               <Link to="/packages" className="transition hover:text-primary">
//                 Packages
//               </Link>
//               <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
//               <span className="max-w-[220px] truncate font-medium text-text-dark sm:max-w-none">
//                 {pkg.title}
//               </span>
//             </nav>
//           </div>
//         </section>

//         {/* PACKAGE CONTENT AREA */}
//         <main
//           ref={packageAreaRef}
//           className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
//         >
//           <div className="pt-6 sm:pt-8">
//             <Link
//               to="/packages"
//               className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover"
//             >
//               <ArrowLeft className="h-4 w-4" aria-hidden="true" />
//               Back to Packages
//             </Link>
//           </div>

//           {/* TITLE */}
//           <section className="pb-6 pt-5 sm:pt-7">
//             <div className="mb-4 flex flex-wrap items-center gap-2">
//               {pkg.destination && (
//                 <div className="inline-flex items-center gap-2 text-text">
//                   <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
//                   <span>{pkg.destination}</span>
//                 </div>
//               )}

//               {packageTypeLabel && (
//                 <>
//                   <span className="text-ink-300" aria-hidden="true">
//                     •
//                   </span>
//                   <span className="inline-flex items-center rounded-full bg-primary-lighter px-3 py-1.5 text-xs font-semibold text-primary-dark sm:text-sm">
//                     {packageTypeLabel}
//                   </span>
//                 </>
//               )}
//             </div>

//             <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-text-display sm:text-5xl lg:text-6xl">
//               {pkg.title}
//             </h1>

//             {durationLabel && (
//               <div className="mt-5 inline-flex items-center gap-2 text-sm text-text-secondary sm:text-base">
//                 <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
//                 <span>{durationLabel}</span>
//               </div>
//             )}
//           </section>

//           {/* COVER IMAGE */}
//           <section className="pb-8 sm:pb-10">
//             <div className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl bg-surface sm:aspect-[21/9] sm:rounded-3xl lg:aspect-[2.4/1]">
//               {packageImages.length > 0 ? (
//                 <img
//                   src={packageImages[0]}
//                   alt={pkg.title}
//                   className="h-full w-full object-cover"
//                   loading="eager"
//                   decoding="async"
//                 />
//               ) : (
//                 <MapPin className="h-12 w-12 text-ink-300" aria-hidden="true" />
//               )}
//             </div>
//           </section>

//           {/* DESCRIPTION */}
//           {pkg.description && (
//             <section className="pb-10 sm:pb-12">
//               <h2 className="mb-4 font-display text-3xl font-semibold text-text-dark">
//                 About This Package
//               </h2>

//               <p className="whitespace-pre-line text-sm leading-7 text-text sm:text-base sm:leading-8">
//                 {pkg.description}
//               </p>
//             </section>
//           )}

//           {/* TWO COLUMNS */}
//           <div className="grid grid-cols-1 items-start gap-8 pb-16 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:gap-14">
//             {/* LEFT */}
//             <div className="min-w-0">
//               {/* PACKAGE INFORMATION */}
//               <section className="mb-10 sm:mb-12">
//                 <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark">
//                   Package Information
//                 </h2>

//                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                   {durationLabel && (
//                     <InfoCard
//                       icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
//                       label="Duration"
//                       value={durationLabel}
//                     />
//                   )}

//                   {pkg.destination && (
//                     <InfoCard
//                       icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
//                       label="Destination"
//                       value={pkg.destination}
//                     />
//                   )}

//                   {packageTypeLabel && (
//                     <InfoCard
//                       icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
//                       label="Package Type"
//                       value={packageTypeLabel}
//                     />
//                   )}

//                   <InfoCard
//                     icon={<Clock className="h-5 w-5" aria-hidden="true" />}
//                     label="Starting From"
//                     value={formattedPrice}
//                   />
//                 </div>
//               </section>

//               {/* ITINERARY */}
//               {itinerary.length > 0 && (
//                 <section className="mb-10 sm:mb-12">
//                   <div className="mb-6 flex items-center justify-between gap-4">
//                     <h2 className="font-display text-3xl font-semibold text-text-dark">
//                       Itinerary
//                     </h2>
//                     <span className="text-sm text-muted">{itineraryDaysLabel}</span>
//                   </div>

//                   <div className="space-y-5 sm:space-y-6">
//                     {itinerary.map((item, index) => (
//                       <article
//                         key={`${item.day}-${index}`}
//                         className="overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card sm:rounded-3xl"
//                       >
//                         <div className="px-5 pt-5 sm:px-6 sm:pt-6">
//                           <span className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white sm:text-sm">
//                             Day {item.day}
//                           </span>
//                         </div>

//                         {item.title && (
//                           <div className="px-5 pt-3 sm:px-6">
//                             <h3 className="font-display text-2xl font-semibold text-text-dark">
//                               {item.title}
//                             </h3>
//                           </div>
//                         )}

//                         {item.image && (
//                           <div className="mt-5 aspect-[16/9] overflow-hidden bg-surface sm:aspect-[2/1]">
//                             <img
//                               src={item.image}
//                               alt={`${pkg.title} - Day ${item.day}`}
//                               className="h-full w-full object-cover"
//                               loading="lazy"
//                               decoding="async"
//                             />
//                           </div>
//                         )}

//                         {item.description && (
//                           <div className="p-5 sm:p-6">
//                             <p className="whitespace-pre-line text-sm leading-7 text-text sm:text-base">
//                               {item.description}
//                             </p>
//                           </div>
//                         )}
//                       </article>
//                     ))}
//                   </div>
//                 </section>
//               )}

//               {/* FACILITIES */}
//               {facilities.length > 0 && (
//                 <section className="mb-10 sm:mb-12">
//                   <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark">
//                     Facilities
//                   </h2>

//                   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//                     {facilities.map((facility, index) => (
//                       <div
//                         key={`${facility}-${index}`}
//                         className="flex items-start gap-3 rounded-xl border border-divider bg-card p-4"
//                       >
//                         <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
//                           <Check className="h-4 w-4" aria-hidden="true" />
//                         </div>
//                         <span className="text-sm text-text sm:text-base">
//                           {facility}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </section>
//               )}

//               {/* INCLUSIONS / EXCLUSIONS */}
//               {(inclusions.length > 0 || exclusions.length > 0) && (
//                 <section className="mb-10 sm:mb-12">
//                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                     {inclusions.length > 0 && (
//                       <div className="rounded-2xl border border-success/30 bg-success-bg/50 p-5 sm:p-6">
//                         <h2 className="mb-5 font-display text-2xl font-semibold text-text-dark">
//                           Inclusions
//                         </h2>

//                         <ul className="space-y-3">
//                           {inclusions.map((item, index) => (
//                             <li
//                               key={`${item}-${index}`}
//                               className="flex items-start gap-3 text-sm text-text sm:text-base"
//                             >
//                               <Check
//                                 className="mt-0.5 h-5 w-5 shrink-0 text-success"
//                                 aria-hidden="true"
//                               />
//                               <span>{item}</span>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}

//                     {exclusions.length > 0 && (
//                       <div className="rounded-2xl border border-error/30 bg-error-bg/50 p-5 sm:p-6">
//                         <h2 className="mb-5 font-display text-2xl font-semibold text-text-dark">
//                           Exclusions
//                         </h2>

//                         <ul className="space-y-3">
//                           {exclusions.map((item, index) => (
//                             <li
//                               key={`${item}-${index}`}
//                               className="flex items-start gap-3 text-sm text-text sm:text-base"
//                             >
//                               <X
//                                 className="mt-0.5 h-5 w-5 shrink-0 text-error"
//                                 aria-hidden="true"
//                               />
//                               <span>{item}</span>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                 </section>
//               )}

//               {/* TERMS & CANCELLATION */}
//               {(pkg.terms_and_conditions || pkg.cancellation_policy) && (
//                 <section className="mb-10 sm:mb-12">
//                   <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark">
//                     Important Information
//                   </h2>

//                   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                     {pkg.terms_and_conditions && (
//                       <PolicyCard
//                         type="terms"
//                         onClick={() => setActivePolicy("terms")}
//                       />
//                     )}

//                     {pkg.cancellation_policy && (
//                       <PolicyCard
//                         type="cancellation"
//                         onClick={() => setActivePolicy("cancellation")}
//                       />
//                     )}
//                   </div>
//                 </section>
//               )}
//             </div>

//             {/* RIGHT SIDEBAR */}
//             <aside className="w-full self-start lg:sticky lg:top-[calc(var(--top-info-height,0px)+6rem)]">
//               <div className="rounded-2xl border border-divider bg-card p-5 shadow-travel-card sm:rounded-3xl sm:p-6 lg:p-7">
//                 {/* PRICE */}
//                 <div className="border-b border-divider pb-5">
//                   <p className="mb-1 text-sm text-muted">Starting from</p>

//                   <div className="flex flex-wrap items-end gap-2">
//                     <span className="text-3xl font-extrabold text-primary sm:text-4xl">
//                       {formattedPrice}
//                     </span>

//                     {hasPrice && (
//                       <span className="pb-1 text-sm text-muted">/ person</span>
//                     )}
//                   </div>
//                 </div>

//                 {/* SUMMARY */}
//                 <div className="space-y-4 py-5">
//                   {durationLabel && (
//                     <SidebarInfo
//                       icon={<Clock className="h-5 w-5" aria-hidden="true" />}
//                       label="Duration"
//                       value={durationLabel}
//                     />
//                   )}

//                   {pkg.destination && (
//                     <SidebarInfo
//                       icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
//                       label="Destination"
//                       value={pkg.destination}
//                     />
//                   )}

//                   {packageTypeLabel && (
//                     <SidebarInfo
//                       icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
//                       label="Package Type"
//                       value={packageTypeLabel}
//                     />
//                   )}

//                   {itinerary.length > 0 && (
//                     <SidebarInfo
//                       icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
//                       label="Itinerary"
//                       value={itineraryDaysLabel}
//                     />
//                   )}
//                 </div>

//                 {/* ACTIONS */}
//                 <div className="space-y-3">
//                   <button
//                     type="button"
//                     onClick={openDownloadForm}
//                     disabled={downloadingPDF}
//                     className={`${PRIMARY_BUTTON} w-full px-5 py-3.5 shadow-sm`}
//                   >
//                     <Download className="h-4 w-4" aria-hidden="true" />
//                     {downloadingPDF ? "Preparing..." : "Download Itinerary"}
//                   </button>

//                   <Link
//                     to="/packages"
//                     className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3.5 font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
//                   >
//                     View More Packages
//                     <ChevronRight className="h-4 w-4" aria-hidden="true" />
//                   </Link>
//                 </div>

//                 {/* TRUST */}
//                 <div className="mt-5 border-t border-divider pt-5">
//                   <div className="flex items-start gap-3">
//                     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
//                       <Download className="h-5 w-5" aria-hidden="true" />
//                     </div>

//                     <div>
//                       <p className="text-sm font-semibold text-text-dark">
//                         Get your personalized itinerary
//                       </p>
//                       <p className="mt-1 text-xs leading-5 text-muted">
//                         Submit your details and receive your personalized trip
//                         itinerary.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </aside>
//           </div>
//         </main>

//         {/* REVIEW CTA */}
//         <section className="border-y border-divider bg-surface-soft">
//           <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
//             <div className="flex flex-col gap-6 rounded-2xl border border-divider bg-card p-6 shadow-travel-card sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
//               <div className="min-w-0">
//                 <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
//                   Traveller experiences
//                 </p>

//                 <h2 className="mt-2 font-display text-3xl font-semibold text-text-dark">
//                   Your Valuable Review
//                 </h2>

//                 <p className="mt-2 max-w-2xl text-sm text-text sm:text-base">
//                   Share your experience with {BRAND_NAME} and help future
//                   travellers plan their journey.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={openReview}
//                 className={`${PRIMARY_BUTTON} shrink-0 px-5 py-3.5`}
//               >
//                 <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
//                 Your Valuable Review
//               </button>
//             </div>
//           </div>
//         </section>

//         {/* FAQ */}
//         <section ref={faqSectionRef}>
//           <FAQSection category="packages" />
//         </section>

//         <Footer />

//         {/* FLOATING DOWNLOAD (mobile + tablet) */}
//         {showFloatingDownload && (
//           <div className="fixed bottom-5 left-4 z-[80] sm:left-6 lg:hidden">
//             <button
//               type="button"
//               onClick={openDownloadForm}
//               disabled={downloadingPDF}
//               className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 sm:px-5 sm:py-3.5 sm:text-base"
//             >
//               <Download className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
//               <span>{downloadingPDF ? "Preparing..." : "Download Itinerary"}</span>
//             </button>
//           </div>
//         )}

//         {/* ENQUIRY / DOWNLOAD FORM */}
//         {showEnquiry && (
//           <EnquiryForm
//             pkg={pkg}
//             destination={pkg?.destination || null}
//             onClose={() => setShowEnquiry(false)}
//             onSuccess={handleEnquirySuccess}
//             downloadItinerary={false}
//           />
//         )}

//         {/* REVIEW MODAL */}
//         {showReview && (
//           <ReviewFormModal
//             open={showReview}
//             pkg={pkg}
//             onClose={() => setShowReview(false)}
//             onSubmitted={() => setShowReview(false)}
//           />
//         )}

//         {/* TERMS / CANCELLATION POPUP */}
//         {activePolicy && (
//           <div
//             className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 p-3 backdrop-blur-sm sm:p-4"
//             onClick={() => setActivePolicy(null)}
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="policy-modal-title"
//           >
//             <div
//               className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl sm:rounded-3xl"
//               onClick={(event) => event.stopPropagation()}
//             >
//               <div className="flex shrink-0 items-center justify-between gap-4 border-b border-divider px-5 py-5 sm:px-7">
//                 <div className="flex min-w-0 items-center gap-3">
//                   <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-lighter text-primary">
//                     {activePolicy === "terms" ? (
//                       <FileText className="h-5 w-5" aria-hidden="true" />
//                     ) : (
//                       <ShieldCheck className="h-5 w-5" aria-hidden="true" />
//                     )}
//                   </div>

//                   <div className="min-w-0">
//                     <h2
//                       id="policy-modal-title"
//                       className="font-display text-2xl font-semibold text-text-dark"
//                     >
//                       {activePolicy === "terms"
//                         ? "Terms & Conditions"
//                         : "Cancellation Policy"}
//                     </h2>

//                     <p className="text-xs text-muted sm:text-sm">
//                       {activePolicy === "terms"
//                         ? "Important booking information"
//                         : "Cancellation and refund information"}
//                     </p>
//                   </div>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() => setActivePolicy(null)}
//                   className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface transition hover:bg-surface-soft"
//                   aria-label="Close"
//                 >
//                   <X className="h-5 w-5 text-text-dark" aria-hidden="true" />
//                 </button>
//               </div>

//               <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
//                 <div className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base">
//                   {activePolicy === "terms"
//                     ? pkg.terms_and_conditions
//                     : pkg.cancellation_policy}
//                 </div>
//               </div>

//               <div className="shrink-0 border-t border-divider bg-surface px-5 py-4 sm:px-7">
//                 <button
//                   type="button"
//                   onClick={() => setActivePolicy(null)}
//                   className={`${PRIMARY_BUTTON} w-full px-6 py-3 sm:ml-auto sm:w-auto`}
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// }



















































// // import { useEffect, useMemo, useRef, useState } from "react";
// // import { Link, useParams } from "react-router-dom";
// // import {
// //   ArrowLeft,
// //   CalendarDays,
// //   Check,
// //   ChevronRight,
// //   Clock,
// //   Download,
// //   FileText,
// //   MapPin,
// //   MessageSquareHeart,
// //   ShieldCheck,
// //   X,
// // } from "lucide-react";

// // import { getPackageBySlug } from "../../api/content";
// // import { useQuery } from "../../hooks/useQuery";
// // import Footer from "../../components/Footer";
// // import Seo, { SITE_URL } from "../../components/Seo";
// // import FAQSection from "../../components/FAQSection";
// // import EnquiryForm from "../EnquiryForm";
// // import ReviewFormModal from "../../components/ReviewFormModal";
// // import generatePackagePDF from "../../components/PackageItineraryPDF";
// // import { RevealGroup } from "../../components/Reveal";

// // /* =========================================================
// //    BRAND
// // ========================================================= */

// // const BRAND_NAME = "Manyara Prive Vacations";

// // const PACKAGE_TYPE_LABELS = {
// //   pilgrimage: "Pilgrimage",
// //   mountains_adventure: "Mountains & Adventure",
// //   romantic: "Romantic",
// //   international: "International",
// //   beach: "Beach",
// //   family: "Family",
// //   wildlife_nature: "Wildlife & Nature",
// // };

// // /* Same button language as DestinationDetail */
// // const PRIMARY_BUTTON =
// //   "inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70";

// // /* =========================================================
// //    HELPERS
// // ========================================================= */

// // const getImageUrl = (image) => {
// //   if (!image) return "";
// //   if (typeof image === "string") return image.trim();

// //   return image.url || image.secure_url || image.src || image.image_url || "";
// // };

// // const getTextValue = (item) => {
// //   if (!item) return "";
// //   if (typeof item === "string") return item;

// //   return (
// //     item.name || item.title || item.description || item.text || item.value || ""
// //   );
// // };

// // /* Accepts an array, or a comma separated string */
// // const getListItems = (value) => {
// //   const items = Array.isArray(value) ? value.map(getTextValue) : [value];

// //   return items
// //     .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
// //     .map((part) => part.trim())
// //     .filter(Boolean);
// // };

// // const hasNumericPrice = (price) =>
// //   price !== null &&
// //   price !== undefined &&
// //   price !== "" &&
// //   !Number.isNaN(Number(price));

// // const formatPrice = (price) => {
// //   if (price === null || price === undefined || price === "") {
// //     return "Price on request";
// //   }

// //   const number = Number(price);
// //   if (Number.isNaN(number)) return String(price);

// //   return `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// // };

// // /* "5 Days / 4 nights" */
// // const formatDuration = (days, nights) => {
// //   const numericDays = Number(days);
// //   if (!numericDays || Number.isNaN(numericDays)) return "";

// //   const daysText = `${numericDays} ${numericDays === 1 ? "Day" : "Days"}`;

// //   if (nights === undefined || nights === null) return daysText;

// //   return `${daysText} / ${nights} ${Number(nights) === 1 ? "night" : "nights"}`;
// // };

// // /* =========================================================
// //    SMALL COMPONENTS
// // ========================================================= */

// // /*
// //   FullImage
// //   Shows the WHOLE image (object-contain, never cropped).
// //   A blurred, dimmed copy of the same image fills any empty
// //   space so portrait / odd-ratio photos still look polished.
// // */
// // function FullImage({ src, alt, eager = false, imgClassName = "" }) {
// //   return (
// //     <>
// //       <img
// //         src={src}
// //         alt=""
// //         aria-hidden="true"
// //         className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
// //         loading={eager ? "eager" : "lazy"}
// //         decoding="async"
// //       />

// //       <img
// //         src={src}
// //         alt={alt}
// //         className={`relative mx-auto block ${imgClassName}`}
// //         {...(eager
// //           ? { fetchPriority: "high", loading: "eager" }
// //           : { loading: "lazy" })}
// //         decoding="async"
// //       />
// //     </>
// //   );
// // }

// // function InfoCard({ icon, label, value }) {
// //   return (
// //     <div className="min-w-0 rounded-2xl border border-divider bg-surface p-5 sm:p-6">
// //       <div className="mb-3 flex items-center gap-3">
// //         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary sm:h-11 sm:w-11">
// //           {icon}
// //         </div>

// //         <p className="text-xs text-muted sm:text-sm">{label}</p>
// //       </div>

// //       <p className="break-words text-base font-bold text-text-dark sm:text-lg">
// //         {value}
// //       </p>
// //     </div>
// //   );
// // }

// // function SidebarInfo({ icon, label, value }) {
// //   return (
// //     <div className="flex min-w-0 items-center gap-3">
// //       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary">
// //         {icon}
// //       </div>

// //       <div className="min-w-0">
// //         <p className="text-xs text-muted">{label}</p>
// //         <p className="break-words font-semibold text-text-dark">{value}</p>
// //       </div>
// //     </div>
// //   );
// // }

// // function PolicyCard({ type, onClick }) {
// //   const isTerms = type === "terms";
// //   const Icon = isTerms ? FileText : ShieldCheck;

// //   return (
// //     <button
// //       type="button"
// //       onClick={onClick}
// //       className="card-lift group w-full rounded-2xl border border-divider bg-card p-5 text-left transition-all duration-200 hover:border-primary hover:shadow-travel-card focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:p-6"
// //     >
// //       <div className="flex items-center gap-4">
// //         <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
// //           <Icon className="h-6 w-6" aria-hidden="true" />
// //         </div>

// //         <div className="min-w-0 flex-1">
// //           <h3 className="text-base font-bold text-text-dark sm:text-lg">
// //             {isTerms ? "Terms & Conditions" : "Cancellation Policy"}
// //           </h3>

// //           <p className="mt-1 text-sm text-muted">
// //             {isTerms
// //               ? "View booking terms and important information"
// //               : "View cancellation and refund information"}
// //           </p>
// //         </div>

// //         <ChevronRight
// //           className="arrow-shift h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-primary"
// //           aria-hidden="true"
// //         />
// //       </div>
// //     </button>
// //   );
// // }

// // /* Shown only on the very first visit, before anything is cached. */
// // function DetailSkeleton() {
// //   return (
// //     <div
// //       className="min-h-screen bg-background"
// //       role="status"
// //       aria-label="Loading package details"
// //     >
// //       <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
// //         <div className="h-4 w-48 rounded bg-primary/10" />
// //         <div className="mt-8 h-5 w-40 rounded bg-primary/10" />
// //         <div className="mt-4 h-12 w-3/4 rounded bg-primary/10" />
// //         <div className="mt-8 aspect-[4/3] rounded-3xl bg-primary/10 sm:aspect-[16/9]" />

// //         <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
// //           <div className="space-y-4">
// //             <div className="h-8 w-56 rounded bg-primary/10" />
// //             <div className="h-4 rounded bg-primary/10" />
// //             <div className="h-4 rounded bg-primary/10" />
// //             <div className="h-4 w-2/3 rounded bg-primary/10" />
// //           </div>
// //           <div className="h-80 rounded-3xl bg-primary/10" />
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // /* Missing package (404) vs. a real loading problem */
// // function StateMessage({ title, message, code, onRetry }) {
// //   return (
// //     <div className="min-h-[100dvh] bg-background">
// //       <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
// //         {code && (
// //           <p className="mb-3 font-display text-6xl font-semibold text-primary/30">
// //             {code}
// //           </p>
// //         )}

// //         <h1 className="mb-3 font-display text-3xl font-semibold text-text-dark sm:text-4xl">
// //           {title}
// //         </h1>

// //         <p className="mx-auto mb-8 max-w-md text-text">{message}</p>

// //         <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
// //           {onRetry && (
// //             <button
// //               type="button"
// //               onClick={onRetry}
// //               className={`${PRIMARY_BUTTON} min-h-[44px] px-5 py-3`}
// //             >
// //               Try again
// //             </button>
// //           )}

// //           <Link
// //             to="/packages"
// //             className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
// //           >
// //             <ArrowLeft className="h-4 w-4" aria-hidden="true" />
// //             Back to Packages
// //           </Link>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // /* =========================================================
// //    PAGE
// // ========================================================= */

// // export default function PackageDetail() {
// //   const { slug } = useParams();

// //   /* Cached data: instant on repeat visits, updates itself when fresh. */
// //   const { data, loading, error } = useQuery(getPackageBySlug, slug);
// //   const pkg = data?.data ?? data ?? null;

// //   const [showEnquiry, setShowEnquiry] = useState(false);
// //   const [showReview, setShowReview] = useState(false);
// //   const [activePolicy, setActivePolicy] = useState(null);
// //   const [downloadingPDF, setDownloadingPDF] = useState(false);

// //   /* Floating "Download Itinerary" button (mobile + tablet) */
// //   const packageAreaRef = useRef(null);
// //   const faqSectionRef = useRef(null);
// //   const [showFloatingDownload, setShowFloatingDownload] = useState(false);

// //   /* --------------------------------------------------
// //      Floating button: visible while the package is on
// //      screen, hidden near the FAQ and while a modal is open.
// //   -------------------------------------------------- */
// //   useEffect(() => {
// //     const packageElement = packageAreaRef.current;
// //     const faqElement = faqSectionRef.current;

// //     if (loading || !pkg || !packageElement) {
// //       setShowFloatingDownload(false);
// //       return undefined;
// //     }

// //     let packageVisible = false;
// //     let faqVisible = false;

// //     const update = () =>
// //       setShowFloatingDownload(
// //         packageVisible && !faqVisible && !showEnquiry && !showReview
// //       );

// //     const packageObserver = new IntersectionObserver(
// //       ([entry]) => {
// //         packageVisible = entry.isIntersecting;
// //         update();
// //       },
// //       { threshold: 0.08, rootMargin: "-10% 0px -15% 0px" }
// //     );

// //     const faqObserver = faqElement
// //       ? new IntersectionObserver(
// //           ([entry]) => {
// //             faqVisible = entry.isIntersecting;
// //             update();
// //           },
// //           { threshold: 0.05, rootMargin: "0px 0px -10% 0px" }
// //         )
// //       : null;

// //     packageObserver.observe(packageElement);
// //     if (faqObserver) faqObserver.observe(faqElement);

// //     return () => {
// //       packageObserver.disconnect();
// //       if (faqObserver) faqObserver.disconnect();
// //     };
// //   }, [loading, pkg, showEnquiry, showReview]);

// //   /* Close the policy popup with Escape */
// //   useEffect(() => {
// //     if (!activePolicy) return undefined;

// //     const onKeyDown = (event) => {
// //       if (event.key === "Escape") setActivePolicy(null);
// //     };

// //     document.addEventListener("keydown", onKeyDown);
// //     return () => document.removeEventListener("keydown", onKeyDown);
// //   }, [activePolicy]);

// //   /* --------------------------------------------------
// //      DERIVED CONTENT
// //   -------------------------------------------------- */
// //   const packageImages = useMemo(() => {
// //     if (!pkg?.images) return [];

// //     const images = Array.isArray(pkg.images) ? pkg.images : [pkg.images];
// //     return images.map(getImageUrl).filter(Boolean);
// //   }, [pkg]);

// //   const itinerary = useMemo(() => {
// //     if (!Array.isArray(pkg?.itinerary)) return [];

// //     return [...pkg.itinerary]
// //       .sort((a, b) => Number(a?.day || 0) - Number(b?.day || 0))
// //       .map((item, index) => ({
// //         ...item,
// //         day: item?.day || index + 1,
// //         title: item?.title || "",
// //         description: item?.description || "",
// //         image: getImageUrl(item?.image),
// //       }));
// //   }, [pkg]);

// //   const facilities = useMemo(() => getListItems(pkg?.facilities), [pkg]);
// //   const inclusions = useMemo(() => getListItems(pkg?.inclusions), [pkg]);
// //   const exclusions = useMemo(() => getListItems(pkg?.exclusions), [pkg]);

// //   const hasPrice = hasNumericPrice(pkg?.price);
// //   const formattedPrice = formatPrice(pkg?.price);

// //   const durationLabel = formatDuration(pkg?.duration_days, pkg?.duration_nights);

// //   const packageTypeLabel = useMemo(() => {
// //     if (!pkg?.package_type) return "";

// //     return (
// //       PACKAGE_TYPE_LABELS[pkg.package_type] ||
// //       String(pkg.package_type)
// //         .replaceAll("_", " ")
// //         .replace(/\b\w/g, (letter) => letter.toUpperCase())
// //     );
// //   }, [pkg]);

// //   const itineraryDaysLabel = `${itinerary.length} ${
// //     itinerary.length === 1 ? "Day" : "Days"
// //   }`;

// //   const coverImage = packageImages[0] || "";

// //   /* --------------------------------------------------
// //      SEO
// //   -------------------------------------------------- */
// //   const seoDescription =
// //     pkg?.description ||
// //     `Explore ${
// //       pkg?.title || "this holiday package"
// //     } with ${BRAND_NAME}. View the itinerary, inclusions, duration and starting price.`;

// //   const packagePath = `/packages/${encodeURIComponent(pkg?.slug || slug || "")}`;
// //   const canonicalUrl = `${SITE_URL}${packagePath}`;

// //   /* --------------------------------------------------
// //      JSON-LD
// //   -------------------------------------------------- */
// //   const jsonLd = useMemo(() => {
// //     if (!pkg) return null;

// //     return [
// //       {
// //         "@context": "https://schema.org",
// //         "@type": "TouristTrip",
// //         name: pkg.title,
// //         description: seoDescription,
// //         url: canonicalUrl,
// //         provider: { "@type": "TravelAgency", name: BRAND_NAME },
// //         touristType: [
// //           "Leisure travelers",
// //           "Families",
// //           "Couples",
// //           "Adventure travelers",
// //         ],
// //         ...(coverImage ? { image: [coverImage] } : {}),
// //         ...(hasPrice
// //           ? {
// //               offers: {
// //                 "@type": "Offer",
// //                 price: Number(pkg.price),
// //                 priceCurrency: "INR",
// //                 availability: "https://schema.org/InStock",
// //                 url: canonicalUrl,
// //               },
// //             }
// //           : {}),
// //       },

// //       {
// //         "@context": "https://schema.org",
// //         "@type": "BreadcrumbList",
// //         itemListElement: [
// //           {
// //             "@type": "ListItem",
// //             position: 1,
// //             name: "Home",
// //             item: SITE_URL,
// //           },
// //           {
// //             "@type": "ListItem",
// //             position: 2,
// //             name: "Packages",
// //             item: `${SITE_URL}/packages`,
// //           },
// //           {
// //             "@type": "ListItem",
// //             position: 3,
// //             name: pkg.title,
// //             item: canonicalUrl,
// //           },
// //         ],
// //       },
// //     ];
// //   }, [pkg, coverImage, seoDescription, canonicalUrl, hasPrice]);

// //   /* --------------------------------------------------
// //      ACTIONS
// //   -------------------------------------------------- */
// //   const openDownloadForm = () => {
// //     setShowEnquiry(true);
// //     setShowFloatingDownload(false);
// //   };

// //   const openReview = () => {
// //     setShowReview(true);
// //     setShowFloatingDownload(false);
// //   };

// //   const handleDownloadPackagePDF = async () => {
// //     if (!pkg || downloadingPDF) return;

// //     try {
// //       setDownloadingPDF(true);
// //       await generatePackagePDF(pkg);
// //     } catch (pdfError) {
// //       console.error("Package PDF generation failed:", pdfError);
// //       window.alert("Unable to generate the itinerary PDF. Please try again.");
// //     } finally {
// //       setDownloadingPDF(false);
// //     }
// //   };

// //   /* Download Itinerary -> enquiry form -> enquiry saved -> onSuccess -> PDF.
// //      EnquiryForm gets downloadItinerary={false} so the PDF is not made twice. */
// //   const handleEnquirySuccess = () => handleDownloadPackagePDF();

// //   /* --------------------------------------------------
// //      STATES
// //   -------------------------------------------------- */
// //   if (loading) {
// //     return <DetailSkeleton />;
// //   }

// //   if (!pkg) {
// //     const status = error?.response?.status;
// //     const isRealError = Boolean(error) && status !== 404;

// //     if (isRealError) {
// //       console.error("Failed to load package:", slug, error);

// //       return (
// //         <StateMessage
// //           title="We couldn't load this package"
// //           message="Something went wrong while loading this page. Please check your connection and try again."
// //           onRetry={() => window.location.reload()}
// //         />
// //       );
// //     }

// //     return (
// //       <StateMessage
// //         code="404"
// //         title="Package not found"
// //         message="The package you are looking for may have been removed or is no longer available."
// //       />
// //     );
// //   }

// //   /* --------------------------------------------------
// //      MAIN

// //      NOTE (sticky sidebar): the page wrapper uses
// //      overflow-x-clip, NOT overflow-x-hidden.
// //      overflow-x-hidden turns the wrapper into a scroll
// //      container, which silently breaks position: sticky on
// //      the sidebar.
// //   -------------------------------------------------- */
// //   return (
// //     <div className="min-h-screen overflow-x-clip bg-background">
// //       {/* ==================================================
// //           SEO
// //       ================================================== */}
// //       <Seo
// //         title={`${pkg.title} | ${BRAND_NAME}`}
// //         description={seoDescription}
// //         canonical={canonicalUrl}
// //         path={packagePath}
// //         image={coverImage}
// //         type="website"
// //         jsonLd={jsonLd}
// //       />

// //       {/* ==================================================
// //           BREADCRUMB
// //       ================================================== */}
// //       <section className="border-b border-divider bg-surface">
// //         <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
// //           <nav
// //             aria-label="Breadcrumb"
// //             className="flex items-center gap-1.5 overflow-hidden py-3 text-xs text-muted sm:gap-2 sm:py-4 sm:text-sm"
// //           >
// //             <Link to="/" className="shrink-0 transition hover:text-primary">
// //               Home
// //             </Link>

// //             <ChevronRight
// //               className="h-3.5 w-3.5 shrink-0"
// //               aria-hidden="true"
// //             />

// //             <Link
// //               to="/packages"
// //               className="shrink-0 transition hover:text-primary"
// //             >
// //               Packages
// //             </Link>

// //             <ChevronRight
// //               className="h-3.5 w-3.5 shrink-0"
// //               aria-hidden="true"
// //             />

// //             <span className="truncate font-medium text-text-dark">
// //               {pkg.title}
// //             </span>
// //           </nav>
// //         </div>
// //       </section>

// //       {/* ==================================================
// //           MAIN CONTENT
// //       ================================================== */}
// //       <main
// //         ref={packageAreaRef}
// //         className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6"
// //       >
// //         {/* BACK */}
// //         <Link
// //           to="/packages"
// //           className="group mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover"
// //         >
// //           <ArrowLeft
// //             className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
// //             aria-hidden="true"
// //           />
// //           Back to Packages
// //         </Link>

// //         {/* ==================================================
// //             PACKAGE HEADER
// //         ================================================== */}
// //         <section className="mb-6 sm:mb-8 lg:mb-10">
// //           <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mb-3">
// //             {pkg.destination && (
// //               <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-primary sm:text-base">
// //                 <MapPin
// //                   className="h-[18px] w-[18px] shrink-0"
// //                   aria-hidden="true"
// //                 />
// //                 <span className="truncate">{pkg.destination}</span>
// //               </div>
// //             )}

// //             {packageTypeLabel && (
// //               <span className="inline-flex items-center rounded-full bg-surface-soft px-3 py-1.5 text-xs font-semibold text-primary-dark sm:text-sm">
// //                 {packageTypeLabel}
// //               </span>
// //             )}
// //           </div>

// //           <h1 className="break-words font-display text-4xl font-semibold leading-tight tracking-tight text-text-display sm:text-5xl lg:text-6xl">
// //             {pkg.title}
// //           </h1>

// //           {durationLabel && (
// //             <div className="mt-3 inline-flex items-center gap-2 text-sm text-text-secondary sm:mt-4 sm:text-base lg:text-lg">
// //               <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
// //               <span>{durationLabel}</span>
// //             </div>
// //           )}
// //         </section>

// //         {/* ==================================================
// //             HERO IMAGE
// //             Full image, never cropped (object-contain). A blurred
// //             copy fills any empty space. No 21:9 breakpoint.
// //         ================================================== */}
// //         <section className="mb-8 sm:mb-10 lg:mb-14">
// //           <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-strong shadow-travel-card sm:aspect-[16/9] sm:rounded-3xl">
// //             {coverImage ? (
// //               <FullImage
// //                 src={coverImage}
// //                 alt={pkg.title}
// //                 eager
// //                 imgClassName="h-full w-full object-contain"
// //               />
// //             ) : (
// //               <div className="flex h-full w-full items-center justify-center bg-surface-soft">
// //                 <MapPin
// //                   className="h-12 w-12 text-placeholder"
// //                   aria-hidden="true"
// //                 />
// //               </div>
// //             )}
// //           </div>
// //         </section>

// //         {/* ==================================================
// //             CONTENT + SIDEBAR
// //             items-start + self-start keep the sidebar able to stick.
// //             Sticky starts at lg; below that it flows normally.
// //         ================================================== */}
// //         <div className="grid grid-cols-1 items-start gap-8 pb-16 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:gap-14">
// //           {/* ==================================================
// //               LEFT CONTENT
// //           ================================================== */}
// //           <div className="min-w-0 space-y-10 sm:space-y-12 lg:space-y-14">
// //             {/* ABOUT */}
// //             {pkg.description && (
// //               <section>
// //                 <h2 className="mb-4 font-display text-3xl font-semibold text-text-dark sm:mb-5">
// //                   About This Package
// //                 </h2>

// //                 <div className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base sm:leading-8 lg:text-lg">
// //                   {pkg.description}
// //                 </div>
// //               </section>
// //             )}

// //             {/* PACKAGE INFORMATION */}
// //             <section>
// //               <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark sm:mb-6">
// //                 Package Information
// //               </h2>

// //               <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
// //                 {durationLabel && (
// //                   <InfoCard
// //                     icon={
// //                       <CalendarDays className="h-5 w-5" aria-hidden="true" />
// //                     }
// //                     label="Duration"
// //                     value={durationLabel}
// //                   />
// //                 )}

// //                 {pkg.destination && (
// //                   <InfoCard
// //                     icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
// //                     label="Destination"
// //                     value={pkg.destination}
// //                   />
// //                 )}

// //                 {packageTypeLabel && (
// //                   <InfoCard
// //                     icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
// //                     label="Package Type"
// //                     value={packageTypeLabel}
// //                   />
// //                 )}

// //                 <InfoCard
// //                   icon={<Clock className="h-5 w-5" aria-hidden="true" />}
// //                   label="Starting From"
// //                   value={formattedPrice}
// //                 />
// //               </RevealGroup>
// //             </section>

// //             {/* ITINERARY
// //                 Uses a plain div instead of RevealGroup so the days are
// //                 always visible immediately (RevealGroup was leaving this
// //                 tall section hidden until a scroll/re-render). */}
// //             {itinerary.length > 0 && (
// //               <section id="itinerary">
// //                 <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
// //                   <h2 className="font-display text-3xl font-semibold text-text-dark">
// //                     Itinerary
// //                   </h2>

// //                   <span className="text-sm text-muted">{itineraryDaysLabel}</span>
// //                 </div>

// //                 <div className="space-y-5 sm:space-y-6">
// //                   {itinerary.map((item, index) => (
// //                     <article
// //                       key={`${item.day}-${index}`}
// //                       className="overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card sm:rounded-3xl"
// //                     >
// //                       <div className="px-5 pt-5 sm:px-6 sm:pt-6">
// //                         <span className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white sm:text-sm">
// //                           Day {item.day}
// //                         </span>
// //                       </div>

// //                       {item.title && (
// //                         <div className="px-5 pt-3 sm:px-6">
// //                           <h3 className="font-display text-2xl font-semibold text-text-dark">
// //                             {item.title}
// //                           </h3>
// //                         </div>
// //                       )}

// //                       {/* Image height follows the image: nothing is cropped */}
// //                       {item.image && (
// //                         <div className="relative mt-5 overflow-hidden bg-surface-strong">
// //                           <FullImage
// //                             src={item.image}
// //                             alt={`${pkg.title} - Day ${item.day}`}
// //                             imgClassName="h-auto max-h-[32rem] w-full object-contain"
// //                           />
// //                         </div>
// //                       )}

// //                       {item.description && (
// //                         <div className="p-5 sm:p-6">
// //                           <p className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base">
// //                             {item.description}
// //                           </p>
// //                         </div>
// //                       )}
// //                     </article>
// //                   ))}
// //                 </div>
// //               </section>
// //             )}

// //             {/* FACILITIES */}
// //             {facilities.length > 0 && (
// //               <section>
// //                 <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark sm:mb-6">
// //                   Facilities
// //                 </h2>

// //                 <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
// //                   {facilities.map((facility, index) => (
// //                     <div
// //                       key={`${facility}-${index}`}
// //                       className="flex items-start gap-3 rounded-xl border border-divider bg-card p-4"
// //                     >
// //                       <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
// //                         <Check className="h-4 w-4" aria-hidden="true" />
// //                       </div>

// //                       <span className="text-sm text-text sm:text-base">
// //                         {facility}
// //                       </span>
// //                     </div>
// //                   ))}
// //                 </RevealGroup>
// //               </section>
// //             )}

// //             {/* INCLUSIONS / EXCLUSIONS */}
// //             {(inclusions.length > 0 || exclusions.length > 0) && (
// //               <section>
// //                 <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
// //                   {inclusions.length > 0 && (
// //                     <div className="rounded-2xl border border-success/30 bg-success-bg/50 p-5 sm:p-6">
// //                       <h2 className="mb-5 font-display text-2xl font-semibold text-text-dark">
// //                         Inclusions
// //                       </h2>

// //                       <ul className="space-y-3">
// //                         {inclusions.map((item, index) => (
// //                           <li
// //                             key={`${item}-${index}`}
// //                             className="flex items-start gap-3 text-sm text-text sm:text-base"
// //                           >
// //                             <Check
// //                               className="mt-0.5 h-5 w-5 shrink-0 text-success"
// //                               aria-hidden="true"
// //                             />
// //                             <span className="min-w-0 break-words">{item}</span>
// //                           </li>
// //                         ))}
// //                       </ul>
// //                     </div>
// //                   )}

// //                   {exclusions.length > 0 && (
// //                     <div className="rounded-2xl border border-error/30 bg-error-bg/50 p-5 sm:p-6">
// //                       <h2 className="mb-5 font-display text-2xl font-semibold text-text-dark">
// //                         Exclusions
// //                       </h2>

// //                       <ul className="space-y-3">
// //                         {exclusions.map((item, index) => (
// //                           <li
// //                             key={`${item}-${index}`}
// //                             className="flex items-start gap-3 text-sm text-text sm:text-base"
// //                           >
// //                             <X
// //                               className="mt-0.5 h-5 w-5 shrink-0 text-error"
// //                               aria-hidden="true"
// //                             />
// //                             <span className="min-w-0 break-words">{item}</span>
// //                           </li>
// //                         ))}
// //                       </ul>
// //                     </div>
// //                   )}
// //                 </RevealGroup>
// //               </section>
// //             )}

// //             {/* TERMS & CANCELLATION */}
// //             {(pkg.terms_and_conditions || pkg.cancellation_policy) && (
// //               <section>
// //                 <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark sm:mb-6">
// //                   Important Information
// //                 </h2>

// //                 <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
// //                   {pkg.terms_and_conditions && (
// //                     <PolicyCard
// //                       type="terms"
// //                       onClick={() => setActivePolicy("terms")}
// //                     />
// //                   )}

// //                   {pkg.cancellation_policy && (
// //                     <PolicyCard
// //                       type="cancellation"
// //                       onClick={() => setActivePolicy("cancellation")}
// //                     />
// //                   )}
// //                 </RevealGroup>
// //               </section>
// //             )}
// //           </div>

// //           {/* ==================================================
// //               RIGHT SIDEBAR
// //               Sticky ONLY on desktop (lg+). Offset follows the fixed
// //               header, same as DestinationDetail.
// //           ================================================== */}
// //           <aside className="w-full self-start lg:sticky lg:top-[calc(var(--top-info-height,0px)+6rem)]">
// //             <div className="rounded-2xl border border-divider bg-card p-5 shadow-travel-card sm:rounded-3xl sm:p-6 lg:p-7">
// //               {/* PRICE (light brand gradient, not a dark block) */}
// //               <div className="relative mb-5 overflow-hidden rounded-2xl border border-primary/10 bg-brand-gradient p-5 sm:p-6">
// //                 <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
// //                   Starting from
// //                 </p>

// //                 <div className="flex flex-wrap items-end gap-2">
// //                   <span className="font-display text-4xl font-semibold leading-none text-text-dark">
// //                     {formattedPrice}
// //                   </span>

// //                   {hasPrice && (
// //                     <span className="pb-0.5 text-sm text-text-secondary">
// //                       / person
// //                     </span>
// //                   )}
// //                 </div>
// //               </div>

// //               {/* SUMMARY */}
// //               <div className="space-y-4 pb-5">
// //                 {durationLabel && (
// //                   <SidebarInfo
// //                     icon={<Clock className="h-5 w-5" aria-hidden="true" />}
// //                     label="Duration"
// //                     value={durationLabel}
// //                   />
// //                 )}

// //                 {pkg.destination && (
// //                   <SidebarInfo
// //                     icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
// //                     label="Destination"
// //                     value={pkg.destination}
// //                   />
// //                 )}

// //                 {packageTypeLabel && (
// //                   <SidebarInfo
// //                     icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
// //                     label="Package Type"
// //                     value={packageTypeLabel}
// //                   />
// //                 )}

// //                 {itinerary.length > 0 && (
// //                   <SidebarInfo
// //                     icon={
// //                       <CalendarDays className="h-5 w-5" aria-hidden="true" />
// //                     }
// //                     label="Itinerary"
// //                     value={itineraryDaysLabel}
// //                   />
// //                 )}
// //               </div>

// //               {/* ACTIONS */}
// //               <div className="rounded-xl bg-surface p-4">
// //                 <p className="text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
// //                   Get your personalized itinerary for{" "}
// //                   <strong className="text-text-dark">{pkg.title}</strong>.
// //                   Submit your details and our travel team will take care of the
// //                   rest.
// //                 </p>

// //                 <div className="mt-5 space-y-3">
// //                   <button
// //                     type="button"
// //                     onClick={openDownloadForm}
// //                     disabled={downloadingPDF}
// //                     className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
// //                   >
// //                     <Download className="h-4 w-4" aria-hidden="true" />
// //                     {downloadingPDF ? "Preparing..." : "Download Itinerary"}
// //                   </button>

// //                   <Link
// //                     to="/packages"
// //                     className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
// //                   >
// //                     View More Packages
// //                     <ChevronRight
// //                       className="arrow-shift h-4 w-4"
// //                       aria-hidden="true"
// //                     />
// //                   </Link>
// //                 </div>
// //               </div>
// //             </div>
// //           </aside>
// //         </div>
// //       </main>

// //       {/* ==================================================
// //           REVIEW CTA
// //           Full-width band BELOW <main>, above the FAQ
// //           (same as DestinationDetail).
// //       ================================================== */}
// //       <section className="border-y border-divider bg-surface-soft">
// //         <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
// //           <div className="flex flex-col gap-6 rounded-2xl border border-divider bg-card p-6 shadow-travel-card sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
// //             <div className="min-w-0">
// //               <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
// //                 Traveller experiences
// //               </p>

// //               <h2 className="mt-2 font-display text-3xl font-semibold text-text-dark">
// //                 Your Valuable Review
// //               </h2>

// //               <p className="mt-2 max-w-2xl text-sm text-text sm:text-base">
// //                 Share your experience with {BRAND_NAME} and help future
// //                 travellers plan their journey.
// //               </p>
// //             </div>

// //             <button
// //               type="button"
// //               onClick={openReview}
// //               className={`${PRIMARY_BUTTON} min-h-[44px] shrink-0 px-5 py-3.5`}
// //             >
// //               <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
// //               Your Valuable Review
// //             </button>
// //           </div>
// //         </div>
// //       </section>

// //       {/* ==================================================
// //           FAQ
// //       ================================================== */}
// //       <section ref={faqSectionRef} className="w-full">
// //         <FAQSection category="packages" />
// //       </section>

// //       {/* ==================================================
// //           FOOTER
// //       ================================================== */}
// //       <Footer />

// //       {/* ==================================================
// //           FLOATING DOWNLOAD (mobile + tablet)
// //       ================================================== */}
// //       {showFloatingDownload && (
// //         <div className="fixed bottom-5 left-4 z-[80] sm:left-6 lg:hidden">
// //           <button
// //             type="button"
// //             onClick={openDownloadForm}
// //             disabled={downloadingPDF}
// //             className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 sm:px-5 sm:py-3.5 sm:text-base"
// //           >
// //             <Download className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
// //             <span>{downloadingPDF ? "Preparing..." : "Download Itinerary"}</span>
// //           </button>
// //         </div>
// //       )}

// //       {/* ==================================================
// //           ENQUIRY / DOWNLOAD FORM
// //       ================================================== */}
// //       {showEnquiry && (
// //         <EnquiryForm
// //           pkg={pkg}
// //           destination={pkg?.destination || null}
// //           onClose={() => setShowEnquiry(false)}
// //           onSuccess={handleEnquirySuccess}
// //           downloadItinerary={false}
// //         />
// //       )}

// //       {/* ==================================================
// //           REVIEW MODAL
// //       ================================================== */}
// //       {showReview && (
// //         <ReviewFormModal
// //           open={showReview}
// //           pkg={pkg}
// //           onClose={() => setShowReview(false)}
// //           onSubmitted={() => setShowReview(false)}
// //         />
// //       )}

// //       {/* ==================================================
// //           TERMS / CANCELLATION POPUP
// //       ================================================== */}
// //       {activePolicy && (
// //         <div
// //           className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 p-3 backdrop-blur-sm sm:p-4"
// //           onClick={() => setActivePolicy(null)}
// //           role="dialog"
// //           aria-modal="true"
// //           aria-labelledby="policy-modal-title"
// //         >
// //           <div
// //             className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl sm:rounded-3xl"
// //             onClick={(event) => event.stopPropagation()}
// //           >
// //             <div className="flex shrink-0 items-center justify-between gap-4 border-b border-divider px-5 py-5 sm:px-7">
// //               <div className="flex min-w-0 items-center gap-3">
// //                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary">
// //                   {activePolicy === "terms" ? (
// //                     <FileText className="h-5 w-5" aria-hidden="true" />
// //                   ) : (
// //                     <ShieldCheck className="h-5 w-5" aria-hidden="true" />
// //                   )}
// //                 </div>

// //                 <div className="min-w-0">
// //                   <h2
// //                     id="policy-modal-title"
// //                     className="font-display text-2xl font-semibold text-text-dark"
// //                   >
// //                     {activePolicy === "terms"
// //                       ? "Terms & Conditions"
// //                       : "Cancellation Policy"}
// //                   </h2>

// //                   <p className="text-xs text-muted sm:text-sm">
// //                     {activePolicy === "terms"
// //                       ? "Important booking information"
// //                       : "Cancellation and refund information"}
// //                   </p>
// //                 </div>
// //               </div>

// //               <button
// //                 type="button"
// //                 onClick={() => setActivePolicy(null)}
// //                 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface transition hover:bg-surface-soft"
// //                 aria-label="Close"
// //               >
// //                 <X className="h-5 w-5 text-text-dark" aria-hidden="true" />
// //               </button>
// //             </div>

// //             <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
// //               <div className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base">
// //                 {activePolicy === "terms"
// //                   ? pkg.terms_and_conditions
// //                   : pkg.cancellation_policy}
// //               </div>
// //             </div>

// //             <div className="shrink-0 border-t border-divider bg-surface px-5 py-4 sm:px-7">
// //               <button
// //                 type="button"
// //                 onClick={() => setActivePolicy(null)}
// //                 className={`${PRIMARY_BUTTON} min-h-[44px] w-full px-6 py-3 sm:ml-auto sm:w-auto`}
// //               >
// //                 Close
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }


















