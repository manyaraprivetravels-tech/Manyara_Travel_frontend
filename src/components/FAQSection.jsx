


import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronDown, HelpCircle } from "lucide-react";
import { getFaqs } from "../api/content";

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div
      className={`
        overflow-hidden
        rounded-xl
        border
        transition-all
        duration-200
        ${
          isOpen
            ? "border-accent/20 bg-white shadow-[0_6px_20px_rgba(161,13,72,0.06)]"
            : "border-border bg-white/70"
        }
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="
          flex w-full items-center justify-between
          gap-3
          px-4 py-4
          text-left
          sm:gap-4
          sm:px-5 sm:py-5
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-accent/30
          focus-visible:ring-inset
        "
      >
        <span
          className={`
            pr-2
            text-sm
            font-medium
            leading-6
            sm:text-base
            md:text-lg
            transition-colors
            duration-200
            ${
              isOpen
                ? "text-rose-700"
                : "text-navy"
            }
          `}
        >
          {faq.question}
        </span>

        <span
          className={`
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-full
            transition-all
            duration-200
            ${
              isOpen
                ? "bg-accent/10 text-accent"
                : "bg-surface-soft text-secondary"
            }
          `}
          aria-hidden="true"
        >
          <ChevronDown
            className={`
              h-4 w-4
              transition-transform
              duration-200
              ${isOpen ? "rotate-180" : ""}
            `}
          />
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="h-px bg-divider" />

          <p
            className="
              pt-3
              pr-8
              text-sm
              leading-6
              text-navy/65
              sm:pt-4
              sm:pr-10
              sm:text-base
              sm:leading-relaxed
            "
          >
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQSection({ category = "general" }) {
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);

  // ============================================================
  // LOAD FAQS
  // ============================================================

  useEffect(() => {
    let mounted = true;

    getFaqs()
      .then((data) => {
        if (!mounted) return;

        const filteredFaqs = data
          .filter(
            (faq) => (faq.category || "general") === category
          )
          .sort(
            (a, b) =>
              (a.display_order ?? 0) - (b.display_order ?? 0)
          );

        setFaqs(filteredFaqs);
      })
      .catch((error) => {
        console.error("Failed to load FAQs:", error);

        if (mounted) {
          setFaqs([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [category]);

  // ============================================================
  // RESET OPEN FAQ WHEN CATEGORY CHANGES
  // ============================================================

  useEffect(() => {
    setOpenId(null);
  }, [category]);

  // ============================================================
  // FAQ JSON-LD
  // ============================================================

  const faqJsonLd = useMemo(() => {
    if (faqs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }, [faqs]);

  // ============================================================
  // NO FAQS
  // ============================================================

  if (faqs.length === 0) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    // <section
    //   id={category === "general" ? "faqs" : undefined}
    //   className="
    //     w-full
    //     scroll-mt-20
    //     bg-surface-alt
    //     py-10
    //     sm:py-12
    //     lg:py-14
    //   "
    // >


          <section
        id={category === "general" ? "faqs" : undefined}
        className="relative w-full bg-gradient-to-b from-primary-lighter to-surface-alt py-12 sm:py-14 lg:py-16"
      >
        
            {faqJsonLd && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(faqJsonLd)}
          </script>
        </Helmet>
      )}

      <div
        className="
          mx-auto
          w-full
          max-w-4xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* ======================================================
            SECTION HEADING
        ====================================================== */}

        <div className="mb-6 text-center sm:mb-7 lg:mb-8">
          <div
            className="
              mb-2
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-full
              border
              border-accent/15
              bg-surface-soft
              px-3
              py-1.5
              text-accent-hover
              sm:gap-2
              sm:px-3.5
            "
          >
            <HelpCircle
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
              aria-hidden="true"
            />

            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.14em]
                sm:text-xs
              "
            >
              Good to know
            </span>
          </div>

          <h2
            className="
              mt-2
              font-display
              text-2xl
              font-semibold
              leading-tight
              tracking-tight
              text-navy
              sm:text-3xl
              lg:text-4xl
            "
          >
            Frequently Asked Questions
          </h2>

          <p
            className="
              mx-auto
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-navy/55
              sm:mt-3
              sm:text-base
            "
          >
            Find answers to some of the most common questions
            about our travel packages and services.
          </p>
        </div>

        {/* ======================================================
            FAQ LIST
        ====================================================== */}

        <div
          className="
            mx-auto
            flex
            w-full
            max-w-3xl
            flex-col
            gap-2.5
            sm:gap-3
          "
        >
          {faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() =>
                setOpenId(
                  openId === faq.id ? null : faq.id
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}






















