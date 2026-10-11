import { useEffect, useState } from "react";
import {
  Mail,
  PhoneCall,
  MapPin,
  Plane,
  ExternalLink,
  ArrowRight,
  Send,
  Headphones,
  Sparkles,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";


import { ADDRESS_LANDMARK_PARTS } from "../utils/Address";
import { getSiteSettings } from "../api/content";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";
import EnquiryForm from "./EnquiryForm";

const BRAND_NAME = "Manyara Privé Vacations";

const DEFAULT_ADDRESS = "India";

const EMPTY_SETTINGS = {
  email_address: "",
  phone_number: "",
  whatsapp_number: "",
  company_address: DEFAULT_ADDRESS,
  show_address_landmark:false,
  address_url: "",
};

function getMapsLink(rawUrl, address) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return "";
  }

  if (parsed.protocol !== "https:") return "";

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  const isShortLink =
    host === "maps.app.goo.gl" ||
    (host === "goo.gl" && path.startsWith("/maps"));

  const isGoogleMaps =
    isShortLink ||
    host === "maps.google.com" ||
    ((host === "www.google.com" ||
      host === "google.com" ||
      host === "www.google.co.in" ||
      host === "google.co.in") &&
      path.startsWith("/maps"));

  if (!isGoogleMaps) return "";

  // Embed links cannot be opened in a tab. Covers /maps/embed?pb=...,
  // /maps/embed/v1/... and the older ...?output=embed form. Use the place
  // name inside the link when it has one, else the company address.
  const output = (parsed.searchParams.get("output") || "").toLowerCase();
  const isEmbed =
    path.includes("/maps/embed") || output === "embed" || output === "svembed";

  if (isEmbed) {
    // Embed ?pb=... links carry the place's ID and coordinates, so the exact
    // business listing can be rebuilt from them. The ID's second half (after
    // the colon, which may be written as %3A) is the Google Maps CID.
    const cidMatch = value.match(/!1s0x[0-9a-f]+(?::|%3A)0x([0-9a-f]+)/i);

    if (cidMatch) {
      try {
        return `https://www.google.com/maps?cid=${BigInt(
          `0x${cidMatch[1]}`
        ).toString()}`;
      } catch {
        /* fall through to coordinates */
      }
    }

    const coordMatch = value.match(
      /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/
    );

    if (coordMatch) {
      return `https://www.google.com/maps/search/?api=1&query=${coordMatch[2]},${coordMatch[1]}`;
    }

    const fromLink = (
      parsed.searchParams.get("q") ||
      parsed.searchParams.get("destination") ||
      ""
    ).trim();
    const cleanAddress = String(address || "").trim();

    const query =
      fromLink ||
      (cleanAddress && cleanAddress !== DEFAULT_ADDRESS ? cleanAddress : "");

    if (!query) return "";

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query
    )}`;
  }

  return parsed.href;
}

const Contact = () => {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [enquiry, setEnquiry] = useState(false);

  // ============================================================
  // LOAD SITE SETTINGS
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const data = await getSiteSettings();

        if (!mounted) return;

        setSettings({
          email_address: data?.email_address || "",
          phone_number: data?.phone_number || "",
          whatsapp_number: data?.whatsapp_number || "",
          company_address:
            data?.company_address || DEFAULT_ADDRESS,
          show_address_landmark: data?.show_address_landmark === true,
          address_url: data?.address_url || "",
        });
      } catch (error) {
        console.error("Failed to load contact settings:", error);

        if (mounted) {
          setSettings(EMPTY_SETTINGS);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // SETTINGS
  // ============================================================

  // Email comes only from Admin → Website Settings
  const companyEmail =
    settings?.email_address?.trim() || "";

  const phoneNumber =
    settings?.phone_number?.trim() || "";

  const whatsappNumber =
    settings?.whatsapp_number?.trim() || "";

  const companyAddress =
    settings?.company_address?.trim() || DEFAULT_ADDRESS;

  const addressNotes = settings.show_address_landmark
  ? ADDRESS_LANDMARK_PARTS
  : [];

  const addressUrl =
    settings?.address_url?.trim() || "";

  // ============================================================
  // CLEAN PHONE / WHATSAPP NUMBERS
  // ============================================================

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");

  // ============================================================
  // CONTACT URLS
  // ============================================================

  const phoneHref = phoneDigits
    ? `tel:+${phoneDigits}`
    : "#";

  const whatsappMessage = `Hello ${BRAND_NAME}, I would like to know more about your travel packages.`;

  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : "#";

  const emailHref = companyEmail ? `mailto:${companyEmail}` : "#";

  // ============================================================
  // GOOGLE MAPS LINK (embed links are converted, see getMapsLink)
  // ============================================================

  const mapsHref = getMapsLink(addressUrl, companyAddress);

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-background text-text-dark">
      {/* =========================================================
          HERO / CONTACT INTRO
      ========================================================== */}

      <section className="relative w-full overflow-hidden bg-gradient-to-b from-background to-primary-lighter py-12 sm:py-16 lg:py-20">
        {/* Soft decorative glow */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(232,40,111,0.10),transparent_70%)]"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(232,40,111,0.055),transparent_70%)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* =====================================================
                LEFT CONTENT
            ====================================================== */}

            <div className="text-center lg:text-left">
              {/* Label */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/15 bg-surface-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-hover sm:text-xs">
                <Plane
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>Contact Us</span>
              </div>

              {/* Heading */}
              <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-text-dark sm:text-5xl lg:mx-0 lg:text-[3.5rem]">
                Let&apos;s plan your
                <span className="block text-accent">
                  next journey.
                </span>
              </h1>

              {/* Description */}
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7 lg:mx-0">
                Have questions about a destination, package, or
                custom trip? Our travel experts are here to help you
                create a memorable journey that fits your interests
                and budget.
              </p>

              {/* Support highlights */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted sm:text-sm lg:justify-start">
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

              {/* Small supporting text */}
              <p className="mt-5 text-xs text-muted sm:text-sm">
                Available for travel enquiries, package details &
                trip planning.
              </p>
            </div>

            {/* =====================================================
                RIGHT — CONTACT DETAILS CARD
            ====================================================== */}

            <div className="relative">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-divider bg-white px-5 py-7 shadow-[0_15px_50px_rgba(47,42,51,0.07)] sm:rounded-[2rem] sm:px-7 sm:py-9 lg:px-9 lg:py-10">
                {/* Top hairline */}
                <div
                  className="pointer-events-none absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-accent-bright/40"
                  aria-hidden="true"
                />

                {/* Quiet glow */}
                <div
                  className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(232,40,111,0.08),transparent_70%)]"
                  aria-hidden="true"
                />

                <div className="relative z-10">
                  {/* Card heading */}
                  <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-hover sm:text-xs">
                      Get in touch
                    </p>

                    <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-text-dark sm:text-3xl">
                      We&apos;re here to help
                    </h2>
                  </div>

                  {loading ? (
                    /* =================================================
                       LOADING SKELETON
                    ================================================== */

                    <div className="space-y-4">
                      <div className="h-[72px] animate-pulse rounded-2xl bg-surface-soft" />
                      <div className="h-[72px] animate-pulse rounded-2xl bg-surface-soft" />
                      <div className="h-[72px] animate-pulse rounded-2xl bg-surface-soft" />
                      <div className="h-[88px] animate-pulse rounded-2xl bg-surface-soft" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* =================================================
                          PHONE
                      ================================================== */}

                      <div className="group flex items-start gap-3.5 rounded-2xl border border-divider bg-background px-4 py-4 transition-colors duration-200 hover:border-accent/20 hover:bg-surface-soft">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/8">
                          <PhoneCall
                            className="h-5 w-5 text-accent"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0 pt-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                            Phone
                          </p>

                          {phoneNumber ? (
                            <a
                              href={phoneHref}
                              className="mt-1 inline-flex break-words text-sm font-semibold text-text-dark transition-colors hover:text-accent-hover sm:text-base"
                            >
                              {phoneNumber}
                            </a>
                          ) : (
                            <p className="mt-1 text-sm text-muted">
                              Contact number unavailable
                            </p>
                          )}
                        </div>
                      </div>

                      {/* =================================================
                          WHATSAPP
                      ================================================== */}

                      <div className="group flex items-start gap-3.5 rounded-2xl border border-divider bg-background px-4 py-4 transition-colors duration-200 hover:border-[#128C7E]/20 hover:bg-[#128C7E]/[0.025]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#128C7E]/10">
                          <FaWhatsapp
                            className="h-5 w-5 text-[#128C7E]"
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0 pt-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                            WhatsApp
                          </p>

                          {whatsappDigits ? (
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex break-words text-sm font-semibold text-[#128C7E] transition-colors hover:text-[#0F766B] sm:text-base"
                            >
                              {whatsappNumber}
                            </a>
                          ) : (
                            <p className="mt-1 text-sm text-muted">
                              WhatsApp unavailable
                            </p>
                          )}
                        </div>
                      </div>

                      {/* =================================================
                          EMAIL
                      ================================================== */}

                      <div className="group flex items-start gap-3.5 rounded-2xl border border-divider bg-background px-4 py-4 transition-colors duration-200 hover:border-accent/20 hover:bg-surface-soft">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/8">
                          <Mail
                            className="h-5 w-5 text-accent"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0 pt-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                            Email
                          </p>

                          {companyEmail ? (
                            <a
                              href={emailHref}
                              className="mt-1 inline-block break-words text-sm font-semibold text-text-dark transition-colors hover:text-accent-hover sm:text-base"
                            >
                              {companyEmail}
                            </a>
                          ) : (
                            <p className="mt-1 text-sm text-muted">
                              Email unavailable
                            </p>
                          )}
                        </div>
                      </div>

                      {/* =================================================
                          ADDRESS
                      ================================================== */}

                      <div className="group flex items-start gap-3.5 rounded-2xl border border-divider bg-background px-4 py-4 transition-colors duration-200 hover:border-accent/20 hover:bg-surface-soft">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/8">
                          <MapPin
                            className="h-5 w-5 text-accent"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0 pt-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                            Address
                          </p>

                          <p className="mt-1 text-sm font-semibold leading-6 text-text-dark sm:text-base">
                            {companyAddress}
                          </p>

                          {addressNotes.length > 0 && (
                              <ul className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-snug text-text-secondary">
                                {addressNotes.map((note, index) => (
                                  <li key={note} className="inline-flex items-center gap-2">
                                    {index > 0 && (
                                      <span
                                        className="h-1 w-1 shrink-0 rounded-full bg-accent/50"
                                        aria-hidden="true"
                                      />
                                    )}
                                    <span className="break-words">{note}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                          {mapsHref && (
                            <a
                              href={mapsHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-hover transition-colors hover:text-text-dark sm:text-sm"
                            >
                              View on Google Maps

                              <ExternalLink
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      QUICK ACTIONS
                  ================================================== */}

                  {!loading && (
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      {phoneDigits && (
                        <a
                          href={phoneHref}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2"
                        >
                          <PhoneCall
                            className="h-4 w-4"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          Call Us
                        </a>
                      )}

                      {whatsappDigits && (
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-[#128C7E] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(18,140,126,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0F766B] focus:outline-none focus:ring-2 focus:ring-[#128C7E]/40 focus:ring-offset-2"
                        >
                          <FaWhatsapp
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA SECTION
      ========================================================== */}

      <section className="relative w-full bg-background py-10 sm:py-14 lg:py-18">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-divider bg-white px-5 py-8 shadow-[0_15px_50px_rgba(47,42,51,0.045)] sm:rounded-[2rem] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            {/* Decorative glow */}
            <div
              className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(232,40,111,0.07),transparent_70%)]"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              {/* Content */}
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/8">
                  <Plane
                    className="h-5 w-5 text-accent"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </div>

                <h2 className="font-display text-3xl font-semibold tracking-tight text-text-dark sm:text-4xl">
                  Ready to plan your next trip?
                </h2>

                <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                  Tell us where you want to go, and our travel team
                  can help you turn your ideas into a memorable
                  journey.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                {/* Enquire */}
                <button
                  type="button"
                  onClick={() => setEnquiry(true)}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 sm:w-auto sm:px-6"
                >
                  <Send
                    className="h-4 w-4"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  Enquire Now
                </button>

                {/* Packages */}
                <Link
                  to="/packages"
                  className="group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-text-dark transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-soft hover:text-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 sm:w-auto sm:px-6"
                >
                  View Packages

                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ENQUIRY MODAL
      ========================================================== */}

      {enquiry && (
        <EnquiryForm
          onClose={() => setEnquiry(false)}
        />
      )}

      {/* =========================================================
          FAQ
      ========================================================== */}

      <FAQSection />

      {/* =========================================================
          FOOTER
      ========================================================== */}

      <Footer />
    </div>
  );
};

export default Contact;