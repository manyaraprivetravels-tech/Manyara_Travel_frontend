

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
} from "lucide-react";
import { getPublishedPolicies } from "../api/adminPolicy";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import Seo, { SITE_URL } from "../components/Seo";

const TERMS_PATH = "/terms-and-conditions";

export default function TermsAndConditions() {
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
        console.error(
          "Failed to load terms and conditions:",
          err
        );

        if (!mounted) return;

        setError(
          "Unable to load the terms and conditions right now. Please try again later."
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

  const termsPolicies = useMemo(() => {
    return policies
      .filter(
        (policy) =>
          policy?.policy_type === "terms_conditions" &&
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
    "Read Manyara Prive Vacations terms and conditions for travel bookings, package reservations, payments, services and applicable booking requirements.";

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Terms & Conditions | Manyara Prive Vacations",
        url: `${SITE_URL}${TERMS_PATH}`,
        description: pageDescription,
        isPartOf: {
          "@type": "WebSite",
          name: "Manyara Prive Vacations",
          url: SITE_URL,
        },
        about: {
          "@type": "Thing",
          name: "Travel Booking Terms and Conditions",
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
            name: "Terms & Conditions",
            item: `${SITE_URL}${TERMS_PATH}`,
          },
        ],
      },
    ],
    [pageDescription]
  );

  return (
    <>
      <Seo
        title="Terms & Conditions"
        description={pageDescription}
        path={TERMS_PATH}
        type="website"
        jsonLd={jsonLd}
      />

      <main className="min-h-screen bg-background text-text">
        {/* =========================================================
            HERO
        ========================================================== */}
        <section
          className="relative overflow-hidden border-b border-divider bg-petal-gradient"
          aria-labelledby="terms-page-title"
        >
          {/* Decorative brand shapes */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-200/35 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-rose-100/45 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute right-[18%] top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/70 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              {/* Breadcrumb */}
              <nav
                aria-label="Breadcrumb"
                className="mb-7 flex flex-wrap items-center gap-2 text-xs font-medium text-text-secondary sm:text-sm"
              >
                <Link
                  to="/"
                  className="transition-colors hover:text-link"
                >
                  Home
                </Link>

                <span
                  className="text-ink-300"
                  aria-hidden="true"
                >
                  /
                </span>

                <span className="text-ink-600">
                  Terms &amp; Conditions
                </span>
              </nav>

              {/* Eyebrow */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/75 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-dark shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-xs">
                <FileText
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />

                Company Policies
              </div>

              <h1
                id="terms-page-title"
                className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-text-dark sm:text-5xl lg:text-6xl"
              >
                Terms &amp;
                <span className="block text-primary">
                  Conditions
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
                Please review the terms and conditions that apply
                to bookings, travel packages, payments and services
                provided by Manyara Prive Vacations a Trip Holiday.
              </p>

              {/* Small visual rule */}
              <div className="mt-7 flex items-center gap-2">
                <span className="h-1 w-10 rounded-full bg-primary" />
                <span className="h-1 w-2 rounded-full bg-rose-300" />
                <span className="h-1 w-2 rounded-full bg-rose-200" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            TERMS CONTENT
        ========================================================== */}
        <section
          className="bg-white py-10 sm:py-14 lg:py-16"
          aria-labelledby="terms-policy-heading"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2
              id="terms-policy-heading"
              className="sr-only"
            >
              Terms and Conditions
            </h2>

            {/* Loading */}
            {loading && (
              <div
                className="flex items-center justify-center rounded-[1.75rem] border border-divider bg-surface px-6 py-16"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="flex items-center gap-3 text-text-secondary">
                  <Loader2
                    className="h-5 w-5 animate-spin text-primary"
                    aria-hidden="true"
                  />

                  <span className="text-sm">
                    Loading terms and conditions...
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div
                className="rounded-[1.5rem] border border-error/20 bg-error-bg p-5 sm:p-6"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <FileText
                    className="mt-0.5 h-5 w-5 shrink-0 text-error"
                    aria-hidden="true"
                  />

                  <p className="text-sm leading-6 text-error-text">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Empty */}
            {!loading &&
              !error &&
              termsPolicies.length === 0 && (
                <div className="rounded-[1.75rem] border border-divider bg-surface p-8 text-center shadow-travel-card sm:p-10">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-primary">
                    <FileText
                      className="h-7 w-7"
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-5 font-display text-2xl font-semibold text-text-dark">
                    Terms &amp; Conditions
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                    Our terms and conditions are currently being
                    updated.
                  </p>
                </div>
              )}

            {/* Policies */}
            {!loading &&
              !error &&
              termsPolicies.length > 0 && (
                <div className="space-y-3">
                  {termsPolicies.map((policy, index) => {
                    const isOpen = Boolean(
                      openItems[policy?.id]
                    );

                    return (
                      <article
                        key={policy?.id}
                        className={`overflow-hidden rounded-[1.35rem] border bg-white transition-all duration-300 ${
                          isOpen
                            ? "border-rose-200 shadow-travel-hover"
                            : "border-divider shadow-travel-card hover:border-rose-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleItem(policy?.id)
                          }
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-soft sm:px-6 sm:py-5"
                          aria-expanded={isOpen}
                          aria-controls={`terms-policy-${policy?.id}`}
                        >
                          <div className="flex min-w-0 items-start gap-3.5">
                            {/* Number */}
                            <span
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                                isOpen
                                  ? "bg-primary text-white"
                                  : "bg-rose-50 text-primary"
                              }`}
                            >
                              {String(index + 1).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <h3
                              className={`text-sm font-semibold leading-6 transition-colors sm:text-base ${
                                isOpen
                                  ? "text-primary-dark"
                                  : "text-text-dark"
                              }`}
                            >
                              {policy?.question}
                            </h3>
                          </div>

                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                              isOpen
                                ? "bg-rose-100 text-primary"
                                : "bg-surface-strong text-ink-500"
                            }`}
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
                            id={`terms-policy-${policy?.id}`}
                            className="border-t border-divider bg-surface-soft/45 px-5 py-5 sm:px-6 sm:py-6"
                          >
                            <div className="relative pl-4 sm:pl-5">
                              <div
                                className="absolute bottom-0 left-0 top-0 w-0.5 rounded-full bg-rose-300"
                                aria-hidden="true"
                              />

                              <p className="whitespace-pre-line text-sm leading-7 text-text sm:text-base sm:leading-8">
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

            {/* =====================================================
                RELATED POLICIES
            ====================================================== */}
            <div className="mt-10 border-t border-divider pt-7 sm:mt-12 sm:pt-8">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Helpful information
                </p>

                <h2 className="mt-1.5 font-display text-2xl font-semibold text-text-dark sm:text-3xl">
                  Related policies
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/cancellation"
                  className="inline-flex items-center rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text transition-all hover:border-primary hover:bg-rose-50 hover:text-primary"
                >
                  Cancellation Policy
                </Link>

                <Link
                  to="/bookings"
                  className="inline-flex items-center rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text transition-all hover:border-primary hover:bg-rose-50 hover:text-primary"
                >
                  Booking Policy
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FAQSection />

        <Footer />
      </main>
    </>
  );
}




