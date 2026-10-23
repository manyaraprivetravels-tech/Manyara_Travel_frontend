
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ban,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  FileText,
} from "lucide-react";
import { getPublishedPolicies } from "../api/adminPolicy";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import Seo, { SITE_URL } from "../components/Seo";

const CANCELLATION_PATH = "/cancellation";

export default function Cancellation() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    let mounted = true;

    const loadPolicies = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPublishedPolicies();

        if (!mounted) return;

        setPolicies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load cancellation policy:", err);

        if (!mounted) return;

        setError(
          "Unable to load the cancellation policy right now. Please try again later."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPolicies();

    return () => {
      mounted = false;
    };
  }, []);

  const cancellationPolicies = useMemo(() => {
    return policies
      .filter(
        (policy) =>
          policy?.policy_type === "cancellation" &&
          policy?.status === "published"
      )
      .sort(
        (a, b) =>
          Number(a?.display_order ?? 0) -
          Number(b?.display_order ?? 0)
      );
  }, [policies]);

  const toggleItem = (id) => {
    setOpenItems((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const pageDescription =
    "Read Manyara Prive Vacations  booking and cancellation policy, including applicable cancellation terms, conditions and booking requirements.";

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Booking & Cancellation Policy | Manyara Prive Vacations",
        url: `${SITE_URL}${CANCELLATION_PATH}`,
        description: pageDescription,
        isPartOf: {
          "@type": "WebSite",
          name: "Manyara Prive Vacations",
          url: SITE_URL,
        },
        about: {
          "@type": "Thing",
          name: "Booking and Cancellation Policy",
        },
      },
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
            name: "Booking & Cancellation Policy",
            item: `${SITE_URL}${CANCELLATION_PATH}`,
          },
        ],
      },
    ],
    [pageDescription]
  );

  return (
    <>
      <Seo
        title="Booking & Cancellation Policy"
        description={pageDescription}
        path={CANCELLATION_PATH}
        type="website"
        jsonLd={jsonLd}
      />

      <main className="min-h-screen bg-ivory text-navy">
        {/* ============================================================
            HERO
        ============================================================ */}
        <section
          className="relative overflow-hidden border-b border-navy/10 bg-petal-gradient"
          aria-labelledby="cancellation-page-title"
        >
          {/* Decorative background elements */}
          <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-navy-900/10 blur-3xl" />

          <div className="pointer-events-none absolute right-[18%] top-[35%] h-32 w-32 rounded-full border border-orange-500/10" />

          <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-2 text-xs font-medium text-navy/50 sm:text-sm"
            >
              <Link
                to="/"
                className="transition-colors hover:text-orange-600"
              >
                Home
              </Link>

              <span className="text-navy/25">/</span>

              <span className="text-navy/75">
                Cancellation Policy
              </span>
            </nav>

            <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
              {/* Hero copy */}
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/15 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700 shadow-sm backdrop-blur sm:text-xs">
                  <Ban
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  Travel Policy
                </div>

                <h1
                  id="cancellation-page-title"
                  className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl"
                >
                  Booking &amp;
                  <span className="block text-orange-600">
                    Cancellation Policy
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-navy/65 sm:text-base sm:leading-8">
                  Please review our booking and cancellation terms
                  before confirming your travel plans with Manyara Prive Vacations a Trip
                  Holiday.
                </p>
              </div>

              {/* Hero visual card */}
              <div className="hidden lg:block">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-[2rem] border border-white/80 bg-white/65 shadow-xl shadow-navy/5 backdrop-blur">
                  <div className="absolute inset-3 rounded-[1.5rem] border border-orange-500/10" />

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                    <Ban
                      className="h-9 w-9"
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            POLICY CONTENT
        ============================================================ */}
        <section
          className="relative bg-ivory py-10 sm:py-14 lg:py-20"
          aria-labelledby="cancellation-policy-heading"
        >
          <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
            <h2
              id="cancellation-policy-heading"
              className="sr-only"
            >
              Booking and Cancellation Terms
            </h2>

            {/* Intro */}
            <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600 sm:text-sm">
                  Before you book
                </p>

                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
                  Important booking information
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-navy/50 sm:text-right">
                Please read each section carefully so you understand
                the applicable cancellation terms for your journey.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div
                className="rounded-[1.75rem] border border-navy/10 bg-white/75 px-6 py-16 shadow-sm"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="flex flex-col items-center justify-center gap-4 text-navy/55">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                  </div>

                  <span className="text-sm font-medium">
                    Loading cancellation policy...
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div
                className="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 sm:p-8"
                role="alert"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <Ban
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-red-900">
                      Unable to load policy
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty */}
            {!loading &&
              !error &&
              cancellationPolicies.length === 0 && (
                <div className="rounded-[1.75rem] border border-navy/10 bg-white p-8 text-center shadow-sm sm:p-12">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                    <FileText
                      className="h-6 w-6"
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-5 font-display text-xl font-semibold text-navy-900 sm:text-2xl">
                    Booking &amp; Cancellation Policy
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-navy/50">
                    Our cancellation policy is currently being
                    updated. Please check back again shortly.
                  </p>
                </div>
              )}

            {/* Policy accordion */}
            {!loading &&
              !error &&
              cancellationPolicies.length > 0 && (
                <div className="space-y-4">
                  {cancellationPolicies.map((policy, index) => {
                    const isOpen = Boolean(
                      openItems[policy?.id]
                    );

                    return (
                      <article
                        key={policy?.id}
                        className={[
                          "group overflow-hidden rounded-[1.5rem] border bg-white transition-all duration-300",
                          isOpen
                            ? "border-orange-500/20 shadow-lg shadow-navy/5"
                            : "border-navy/10 shadow-sm hover:border-orange-500/15 hover:shadow-md",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleItem(policy?.id)
                          }
                          className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-7 sm:py-6"
                          aria-expanded={isOpen}
                          aria-controls={`cancellation-policy-${policy?.id}`}
                        >
                          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                            {/* Number */}
                            <span
                              className={[
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-10 sm:w-10",
                                isOpen
                                  ? "bg-orange-600 text-white"
                                  : "bg-orange-500/10 text-orange-600",
                              ].join(" ")}
                            >
                              {String(index + 1).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <div className="min-w-0 pt-1">
                              <h3
                                className={[
                                  "text-sm font-semibold leading-6 transition-colors sm:text-base sm:leading-7",
                                  isOpen
                                    ? "text-navy-900"
                                    : "text-navy-800",
                                ].join(" ")}
                              >
                                {policy?.question}
                              </h3>

                              {!isOpen && (
                                <span className="mt-1 block text-xs font-medium text-navy/35">
                                  View policy details
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Chevron */}
                          <span
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
                              isOpen
                                ? "bg-navy-900 text-white"
                                : "bg-navy/5 text-navy/45 group-hover:bg-orange-500/10 group-hover:text-orange-600",
                            ].join(" ")}
                          >
                            {isOpen ? (
                              <ChevronUp
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronDown
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        </button>

                        {isOpen && (
                          <div
                            id={`cancellation-policy-${policy?.id}`}
                            className="border-t border-navy/10 bg-[#fcfaf6] px-5 py-6 sm:px-7 sm:py-7"
                          >
                            <div className="flex gap-4">
                              <div className="mt-1 hidden h-12 w-px shrink-0 bg-orange-500/30 sm:block" />

                              <p className="whitespace-pre-line text-sm leading-7 text-navy/65 sm:text-base sm:leading-8">
                                {policy?.answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

            {/* ========================================================
                RELATED POLICIES
            ========================================================= */}
            <div className="mt-12 rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-sm sm:mt-14 sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                    More information
                  </p>

                  <h3 className="mt-1.5 font-display text-xl font-semibold text-navy-900">
                    Explore our booking policies
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-navy/50">
                    Review the other policies that may apply to your
                    booking.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Link
                    to="/terms-and-conditions"
                    className="inline-flex items-center justify-center rounded-full border border-navy/10 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 transition-all hover:border-orange-500/30 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Terms &amp; Conditions
                  </Link>

                  <Link
                    to="/bookings"
                    className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-800"
                  >
                    Booking Policy

                    <ArrowRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </div>

            {/* Helpful note */}
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-orange-500/10 bg-orange-50/60 px-5 py-4">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />

              <p className="text-xs leading-6 text-navy/55 sm:text-sm">
                Cancellation terms can vary depending on the travel
                package, booking date and applicable supplier
                conditions. Please refer to the specific terms
                provided with your booking.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            FAQ
        ============================================================ */}
        <FAQSection />

        {/* ============================================================
            FOOTER
        ============================================================ */}
        <Footer />
      </main>
    </>
  );
}



