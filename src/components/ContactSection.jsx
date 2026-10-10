
import { PhoneCall, Plane, ArrowRight, Headphones, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";

import { getSiteSettings } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { RevealGroup } from "./Reveal";

const BRAND_NAME = "Manyara Privé Vacations";

export default function ContactSection() {
  // ============================================================
  // SITE SETTINGS (shared cached query, same as the rest of the site)
  // ============================================================

  const { data: settings, loading } = useQuery(getSiteSettings);

  const phoneNumber = settings?.phone_number?.trim() || "";
  const whatsappNumber = settings?.whatsapp_number?.trim() || "";

  // ============================================================
  // CLEAN NUMBERS
  // ============================================================

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");

  // ============================================================
  // CONTACT URLS
  // ============================================================

  const phoneUrl = phoneDigits ? `tel:+${phoneDigits}` : "#";

  const whatsappMessage = `Hello ${BRAND_NAME}, I would like to know more about your travel packages.`;

  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : "#";

  return (
    <section
      id="contact"
      className="relative w-full overflow-x-clip bg-gradient-to-b from-background to-primary-lighter py-14 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            CONTACT CARD
        ======================================================== */}

        <div className="relative overflow-hidden rounded-[1.75rem] border border-divider bg-white px-5 py-10 shadow-[0_15px_50px_rgba(47,42,51,0.06)] sm:rounded-[2rem] sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          {/* ======================================================
              SOFT DECORATION (one quiet glow + one hairline)
          ====================================================== */}

          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(232,40,111,0.09),transparent_70%)]"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-accent-bright/40"
            aria-hidden="true"
          />

          {/* Direct children reveal one after another */}
          <RevealGroup className="relative z-10 text-center">
            {/* ====================================================
                LABEL
            ==================================================== */}

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/15 bg-surface-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-hover sm:text-xs">
                <Plane
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>Contact Us</span>
              </div>
            </div>

            {/* ====================================================
                HEADING
            ==================================================== */}

            <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-text-dark sm:text-4xl lg:text-[2.75rem]">
              Ready to Plan Your Next Journey?
            </h2>

            {/* ====================================================
                DESCRIPTION
            ==================================================== */}

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:mt-4 sm:text-base sm:leading-7">
              Have questions about a destination, package, or custom trip? Our
              travel experts are here to help you plan a memorable journey that
              fits your interests and budget.
            </p>

            {/* ====================================================
                SUPPORT HIGHLIGHTS
            ==================================================== */}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted sm:mt-6 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Headphones
                  className="h-4 w-4 text-accent"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                Travel assistance
              </span>

              <span
                className="hidden h-1 w-1 rounded-full bg-border-strong sm:block"
                aria-hidden="true"
              />

              <span className="inline-flex items-center gap-1.5">
                <Sparkles
                  className="h-4 w-4 text-accent"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                Personalized trips
              </span>
            </div>

            {/* ====================================================
                CONTACT BUTTONS
                Call = brand accent (primary CTA)
            ==================================================== */}

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
              {/* PHONE (primary) */}
              {phoneDigits && (
                <a
                  href={phoneUrl}
                  aria-label={`Call ${BRAND_NAME}`}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-white sm:w-auto sm:px-6"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <PhoneCall
                      className="h-3.5 w-3.5"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </span>

                  <span>Call Us</span>
                </a>
              )}

              {/* WHATSAPP
                  Deeper WhatsApp green so white text stays readable */}
              {whatsappDigits && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with ${BRAND_NAME} on WhatsApp`}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#128C7E] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(18,140,126,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0F766B] focus:outline-none focus:ring-2 focus:ring-[#128C7E]/40 focus:ring-offset-2 focus:ring-offset-white sm:w-auto sm:px-6"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#128C7E]">
                    <FaWhatsapp className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>

                  <span>WhatsApp</span>
                </a>
              )}

              {/* CONTACT PAGE */}
              <Link
                to="/contact"
                className="group inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-soft hover:text-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 focus:ring-offset-white sm:w-auto sm:px-6"
              >
                <span>More Contact Details</span>

                <ArrowRight
                  className="arrow-shift h-4 w-4 shrink-0"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* ====================================================
                SUPPORTING TEXT
            ==================================================== */}

            <p className="mt-5 text-xs text-muted sm:mt-6 sm:text-sm">
              Available for travel enquiries, package details &amp; trip
              planning
              {!loading && (phoneDigits || whatsappDigits)
                ? ". We\u2019re happy to help you plan your next trip."
                : ""}
            </p>
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}





