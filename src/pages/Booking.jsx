



// src/pages/Booking.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { getPublishedPolicies } from "../api/adminPolicy";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import Seo, { SITE_URL } from "../components/Seo";

const BOOKING_PATH = "/booking-policy";

export default function Booking() {
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
        console.error("Failed to load booking policy:", err);

        if (!mounted) return;

        setError(
          "Unable to load the booking policy right now. Please try again later."
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

  // ============================================================
  // BOOKING POLICIES
  // ============================================================

  const bookingPolicies = useMemo(() => {
    return policies
      .filter(
        (policy) =>
          policy?.policy_type === "booking" &&
          policy?.status === "published"
      )
      .sort(
        (a, b) =>
          Number(a?.display_order ?? 0) -
          Number(b?.display_order ?? 0)
      );
  }, [policies]);

  // ============================================================
  // ACCORDION
  // ============================================================

  const toggleItem = (id) => {
    setOpenItems((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  // ============================================================
  // SEO
  // ============================================================

  const pageDescription =
    "Read Manyara Prive Vacations booking policy, including booking requirements, payments, reservations and applicable conditions for travel packages.";

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Booking Policy | Manyara Prive Vacations",
        url: `${SITE_URL}${BOOKING_PATH}`,
        description: pageDescription,
        isPartOf: {
          "@type": "WebSite",
          name: "Manyara Prive Vacations",
          url: SITE_URL,
        },
        about: {
          "@type": "Thing",
          name: "Travel Booking Policy",
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
            name: "Booking Policy",
            item: `${SITE_URL}${BOOKING_PATH}`,
          },
        ],
      },
    ],
    [pageDescription]
  );

  return (
    <>
      <Seo
        title="Booking Policy"
        description={pageDescription}
        path={BOOKING_PATH}
        type="website"
        jsonLd={jsonLd}
      />

      <main className="min-h-screen bg-ivory text-navy">
        {/* ========================================================
            HERO
        ========================================================= */}

        <section
          className="relative overflow-hidden border-b border-navy/10 bg-petal-gradient"
          aria-labelledby="booking-page-title"
        >
          {/* Decorative background elements */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-navy/5 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              {/* Eyebrow */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-white/70 px-3.5 py-2 shadow-sm backdrop-blur-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
                  <CalendarCheck
                    className="h-4 w-4 text-accent"
                    aria-hidden="true"
                  />
                </span>

                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/65">
                  Travel Policies
                </span>
              </div>

              {/* Heading */}
              <h1
                id="booking-page-title"
                className="max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-navy sm:text-5xl lg:text-6xl"
              >
                Booking Policy
              </h1>

              {/* Accent line */}
              <div
                className="mt-5 h-1 w-16 rounded-full bg-accent"
                aria-hidden="true"
              />

              <p className="mt-6 max-w-2xl text-sm leading-7 text-navy/65 sm:text-base sm:leading-8">
                Please review our booking requirements, payment terms and
                applicable conditions before confirming your travel booking
                with Manyara Prive Vacations a Trip Holiday.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            BOOKING POLICY CONTENT
        ========================================================= */}

        <section
          className="relative py-10 sm:py-14 lg:py-16"
          aria-labelledby="booking-policy-heading"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2
              id="booking-policy-heading"
              className="sr-only"
            >
              Booking Policy
            </h2>

            {/* ====================================================
                LOADING
            ==================================================== */}

            {loading && (
              <div
                className="flex items-center justify-center rounded-2xl border border-navy/10 bg-white px-6 py-16 shadow-[0_10px_35px_rgba(6,27,69,0.05)]"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="flex items-center gap-3 text-navy/60">
                  <Loader2
                    className="h-5 w-5 animate-spin text-accent"
                    aria-hidden="true"
                  />

                  <span className="text-sm">
                    Loading booking policy...
                  </span>
                </div>
              </div>
            )}

            {/* ====================================================
                ERROR
            ==================================================== */}

            {!loading && error && (
              <div
                className="rounded-2xl border border-red-200/80 bg-red-50/80 p-5 shadow-sm"
                role="alert"
              >
                <p className="text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* ====================================================
                EMPTY STATE
            ==================================================== */}

            {!loading &&
              !error &&
              bookingPolicies.length === 0 && (
                <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center shadow-[0_10px_35px_rgba(6,27,69,0.05)] sm:p-10">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <CalendarCheck
                      className="h-7 w-7 text-accent"
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-navy">
                    Booking Policy
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-navy/55">
                    Our booking policy is currently being updated.
                  </p>
                </div>
              )}

            {/* ====================================================
                BOOKING POLICY ACCORDION
            ==================================================== */}

            {!loading &&
              !error &&
              bookingPolicies.length > 0 && (
                <div className="space-y-4">
                  {bookingPolicies.map((policy, index) => {
                    const isOpen = Boolean(
                      openItems[policy?.id]
                    );

                    return (
                      <article
                        key={policy?.id}
                        className={[
                          "group overflow-hidden rounded-2xl border bg-white transition-all duration-300",
                          isOpen
                            ? "border-accent/25 shadow-[0_14px_40px_rgba(6,27,69,0.08)]"
                            : "border-navy/10 shadow-[0_8px_25px_rgba(6,27,69,0.04)] hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-[0_12px_32px_rgba(6,27,69,0.07)]",
                        ].join(" ")}
                      >
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleItem(policy?.id)
                          }
                          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6 sm:py-6"
                          aria-expanded={isOpen}
                          aria-controls={`booking-policy-${policy?.id}`}
                        >
                          <div className="flex min-w-0 items-start gap-4">
                            {/* Number */}
                            <span
                              className={[
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                                isOpen
                                  ? "bg-accent text-white"
                                  : "bg-accent/10 text-accent",
                              ].join(" ")}
                            >
                              {String(index + 1).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            {/* Question */}
                            <h3 className="pt-1 text-sm font-semibold leading-6 text-navy sm:text-base">
                              {policy?.question}
                            </h3>
                          </div>

                          {/* Chevron */}
                          <span
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                              isOpen
                                ? "bg-accent/10 text-accent"
                                : "bg-navy/[0.04] text-navy/45 group-hover:bg-accent/10 group-hover:text-accent",
                            ].join(" ")}
                          >
                            {isOpen ? (
                              <ChevronUp
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronDown
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        </button>

                        {/* Accordion Content */}
                        {isOpen && (
                          <div
                            id={`booking-policy-${policy?.id}`}
                            className="border-t border-navy/10 bg-petal-gradient px-5 py-5 sm:px-6 sm:py-6"
                          >
                            <div className="border-l-2 border-accent/30 pl-4 sm:pl-5">
                              <p className="whitespace-pre-line text-sm leading-7 text-navy/65 sm:text-[15px] sm:leading-7">
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

            {/* ====================================================
                RELATED POLICIES
            ==================================================== */}

            <div className="mt-12 border-t border-navy/10 pt-7 sm:mt-14">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/40">
                  Related Policies
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/terms-and-conditions"
                  className="group inline-flex items-center rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm font-medium text-navy shadow-sm transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                >
                  Terms &amp; Conditions
                </Link>

                <Link
                  to="/cancellation"
                  className="group inline-flex items-center rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm font-medium text-navy shadow-sm transition-all hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                >
                  Cancellation Policy
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            FAQ
        ========================================================= */}

        <FAQSection />

        {/* ========================================================
            FOOTER
        ========================================================= */}

        <Footer />
      </main>
    </>
  );
}





