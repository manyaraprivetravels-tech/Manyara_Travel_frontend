import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Code2,
} from "lucide-react";
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaWhatsapp,
  FaTwitter,
} from "react-icons/fa";

import { getSiteSettings } from "../api/content";


const BRAND_NAME = "Manyara Privé Vacations";

const DEFAULT_ADDRESS = "India";
const SOCIAL_SLOTS = [1, 2, 3, 4];

const EMPTY_SETTINGS = {
  email_address: "",
  phone_number: "",
  whatsapp_number: "",
  company_address: DEFAULT_ADDRESS,
  address_landmark: "",
  show_address_landmark: false,
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
    (
      [
        "www.google.com",
        "google.com",
        "www.google.co.in",
        "google.co.in",
      ].includes(host) &&
      path.startsWith("/maps")
    );

  if (!isGoogleMaps) return "";

  const output = (
    parsed.searchParams.get("output") || ""
  ).toLowerCase();

  const isEmbed =
    path.includes("/maps/embed") ||
    output === "embed" ||
    output === "svembed";

  if (isEmbed) {
    // Recover the Google Maps place CID when present.
    const cidMatch = value.match(
      /!1s0x[0-9a-f]+(?::|%3A)0x([0-9a-f]+)/i
    );

    if (cidMatch) {
      try {
        return `https://www.google.com/maps?cid=${BigInt(
          `0x${cidMatch[1]}`
        ).toString()}`;
      } catch {
        // Fall through to coordinate or address handling.
      }
    }

    // Recover coordinates from an embedded Maps URL.
    const coordMatch = value.match(
      /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/i
    );

    if (coordMatch) {
      return (
        "https://www.google.com/maps/search/?api=1&query=" +
        `${coordMatch[2]},${coordMatch[1]}`
      );
    }

    const fromLink = (
      parsed.searchParams.get("q") ||
      parsed.searchParams.get("destination") ||
      ""
    ).trim();

    const cleanAddress = String(address || "").trim();

    const query =
      fromLink ||
      (
        cleanAddress && cleanAddress !== DEFAULT_ADDRESS
          ? cleanAddress
          : ""
      );

    if (!query) return "";

    return (
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(query)
    );
  }

  return parsed.href;
}

/**
 * Generate a map preview from the address configured in Admin Settings.
 * The preview URL is separate from the external Maps link.
 */
function getMapsEmbedUrl(address) {
  const cleanAddress = String(address || "").trim();

  if (!cleanAddress) return "";

  return (
    "https://www.google.com/maps?q=" +
    encodeURIComponent(cleanAddress) +
    "&output=embed"
  );
}

function getSocialIcon(name = "", url = "") {
  const value = `${name} ${url}`.toLowerCase();

  if (value.includes("instagram")) return FaInstagram;
  if (value.includes("facebook")) return FaFacebookF;

  if (
    value.includes("youtube") ||
    value.includes("youtu.be")
  ) {
    return FaYoutube;
  }

  if (
    value.includes("twitter") ||
    value.includes("x.com") ||
    name.trim().toLowerCase() === "x"
  ) {
    return FaTwitter;
  }

  return null;
}

function SocialLink({ name, url }) {
  const Icon = getSocialIcon(name, url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      title={name}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/15 text-ivory/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
    >
      {Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <span className="text-xs font-semibold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </a>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="transition-colors duration-200 hover:text-accent focus:outline-none focus:text-accent"
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        // Same API used by the Contact page.
        const data = await getSiteSettings();

        if (!mounted) return;

        setSettings({
          email_address: data?.email_address || "",
          phone_number: data?.phone_number || "",
          whatsapp_number: data?.whatsapp_number || "",
          company_address:
            data?.company_address || DEFAULT_ADDRESS,
          address_landmark: data?.address_landmark || "",
          show_address_landmark: data?.show_address_landmark === true,
          address_url: data?.address_url || "",
        });
      } catch (error) {
        console.error(
          "Failed to load footer settings:",
          error
        );

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

  // These keys intentionally match Contact.jsx.

  // Email comes only from Admin → Website Settings
  const companyEmail = String(
    settings?.email_address || ""
  ).trim();

  const phoneNumber = String(
    settings?.phone_number || ""
  ).trim();

  const whatsappNumber = String(
    settings?.whatsapp_number || ""
  ).trim();

  const companyAddress =
    String(
      settings?.company_address || DEFAULT_ADDRESS
    ).trim() || DEFAULT_ADDRESS;

  // Shown only when ticked in Admin and the text is not empty
  const addressLandmark = settings.show_address_landmark
    ? String(settings.address_landmark || "").trim()
    : "";

  const addressUrl = String(
    settings?.address_url || ""
  ).trim();

  // Use the same Google Maps conversion logic as Contact.jsx.
  const mapsHref = getMapsLink(
    addressUrl,
    companyAddress
  );

  // The map preview is based on the same displayed admin address.
  const mapsEmbedUrl = getMapsEmbedUrl(companyAddress);

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");

  const phoneHref = phoneDigits
    ? `tel:+${phoneDigits}`
    : "";

  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        `Hello ${BRAND_NAME}, I would like to know more about your travel packages.`
      )}`
    : "";

  // Social links are loaded from the existing admin settings keys.
  const socials = SOCIAL_SLOTS.map((number) => ({
    name: String(
      settings?.[`top_bar_social_${number}_name`] || ""
    ).trim(),
    url: String(
      settings?.[`top_bar_social_${number}_url`] || ""
    ).trim(),
  })).filter((item) => {
    try {
      const parsed = new URL(item.url);

      return (
        Boolean(item.url) &&
        ["https:", "http:"].includes(parsed.protocol)
      );
    } catch {
      return false;
    }
  });

  return (
    <footer className="relative overflow-hidden bg-navy-dark text-ivory/70">
      {/* Main footer content */}
      <div className="mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4 lg:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              aria-label={`${BRAND_NAME} home`}
              className="mb-4 inline-flex max-w-full items-center rounded-xl border border-white/15 bg-[#EEF1F5] px-3 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.16)] transition-transform duration-200 hover:-translate-y-0.5 sm:px-4 sm:py-2.5"
            >
              <img
                src="/images/manyara_logo.webp"
                alt={BRAND_NAME}
                loading="lazy"
                className="h-auto max-h-20 w-40 object-contain sm:max-h-18 sm:w-40 md:max-h-16 md:w-40"
                //className="h-auto w-40 object-contain sm:w-44 md:w-48"
              />
            </Link>

            <p className="max-w-sm text-sm leading-6 text-ivory/65">
              Discover exceptional destinations and thoughtfully
              curated vacations designed to make every journey
              memorable.
            </p>

            {/* Social links configured through Admin Settings */}
            {socials.length > 0 && (
              <div className="mt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ivory/80">
                  Follow Us
                </p>

                <div className="flex flex-wrap items-center gap-2.5">
                  {socials.map((item) => (
                    <SocialLink
                      key={`${item.name}-${item.url}`}
                      name={item.name || "Social media"}
                      url={item.url}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Explore */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-ivory">
              Explore
            </h2>

            <ul className="space-y-3 text-sm">
              <li>
                <FooterLink to="/destinations">
                  Destinations
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/seasoned-destinations">
                  Travel by Season
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/packages">
                  Explore Packages
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/happy-moments">
                  Happy Moments
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/blog">
                  Travel Blog
                </FooterLink>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-ivory">
              Company
            </h2>

            <ul className="space-y-3 text-sm">
              <li>
                <FooterLink to="/about">
                  About Us
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/contact">
                  Contact Us
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/reviews">
                  Reviews
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/terms-and-conditions">
                  Terms &amp; Conditions
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/bookings">
                  Booking Policy
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/cancellation">
                  Cancellation Policy
                </FooterLink>
              </li>
            </ul>
          </div>

          {/* Contact details */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-ivory">
              Get in Touch
            </h2>

            <ul className="space-y-4 text-sm">
              {/* Email */}
              {companyEmail && (
                <li className="flex items-start gap-3">
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />

                  <a
                    href={`mailto:${companyEmail}`}
                    className="break-all transition-colors hover:text-accent"
                  >
                    {companyEmail}
                  </a>
                </li>
              )}

              {/* Phone */}
              {phoneNumber && (
                <li className="flex items-start gap-3">
                  <Phone
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />

                  <a
                    href={phoneHref}
                    className="break-words transition-colors hover:text-accent"
                  >
                    {phoneNumber}
                  </a>
                </li>
              )}

              {/* WhatsApp */}
              {whatsappHref && (
                <li className="flex items-start gap-3">
                  <FaWhatsapp
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />

                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Policies and location map */}
        <div className="mt-9 border-t border-ivory/10 pt-7 sm:mt-11 sm:pt-9">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            {/* Google Maps preview */}
            <div className="min-w-0">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-ivory sm:text-lg">
                    Find Our Location
                  </h2>

                  <address className="mt-3 flex items-start gap-2.5 text-sm not-italic leading-relaxed text-ivory/75">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      aria-hidden="true"
                    />

                    <div className="min-w-0">
                      <p className="break-words font-medium text-ivory/85">
                        {companyAddress}
                      </p>

                      {addressLandmark && (
                        <p className="mt-1.5 break-words text-xs leading-snug text-ivory/55">
                          {addressLandmark}
                        </p>
                      )}
                    </div>
                  </address>
                </div>

                {!loading && mapsHref && (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-full border border-ivory/15 px-4 py-2 text-xs font-semibold text-ivory transition-all duration-200 hover:border-accent hover:bg-accent sm:text-sm"
                  >
                    <MapPin
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    View On Google Maps
                    <ExternalLink
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6 lg:px-8">
          <p className="text-xs leading-5 text-ivory/50">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>


              <a
              href="https://vssgowritechonline.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Designed and developed by VSS Gowri Tech Online Private Limited"
              className="inline-flex items-center justify-center gap-1.5 text-xs leading-5 text-ivory/50 transition-colors duration-200 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
            >

             
              <span>
                Designed &amp; Developed by{" "}
                <span className="font-medium text-ivory/70">
                  VSS Gowri Tech Online Private Limited
                </span>
              </span>
              {/* <ExternalLink
                className="h-3 w-3 shrink-0 opacity-70"
                aria-hidden="true"
              /> */}
            </a>

          <p className="text-xs leading-5 text-ivory/40">
            Travel. Explore. Create memories.
          </p>
        </div>
      </div>
    </footer>
  );
}