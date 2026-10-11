

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa";

import EnquiryForm from "../EnquiryForm";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import { getLeadershipBySlug } from "../../api/content";
import FAQSection from "../../components/FAQSection";

/* ============================================================
   HELPERS
   ============================================================ */

const getImageUrl = (image) => {
  if (!image) return null;

  if (typeof image === "string") {
    return image.trim() || null;
  }

  if (typeof image === "object" && image?.url) {
    return image.url;
  }

  return null;
};

const cleanText = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const getSafeUrl = (value) => {
  const text = cleanText(value);

  if (!text) return null;

  // Only allow HTTP/HTTPS URLs.
  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  return null;
};

const getInitials = (name) => {
  const value = cleanText(name);

  if (!value) return "MP";

  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getExperienceText = (years) => {
  const value = Number(years);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return `${value}+ ${value === 1 ? "year" : "years"} experience`;
};

const getWhatsAppUrl = (value) => {
  const text = cleanText(value);

  if (!text) return null;

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  const digits = text.replace(/[^\d]/g, "");

  if (!digits) return null;

  return `https://wa.me/${digits}`;
};

/* ============================================================
   SOCIAL LINK
   ============================================================ */

function SocialLink({ href, label, children, className = "" }) {
  const url = getSafeUrl(href);

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`
        inline-flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-full
        border
        border-navy/10
        bg-white/80
        text-navy
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-1
        hover:border-accent/30
        hover:bg-accent
        hover:text-white
        hover:shadow-md
        ${className}
      `}
    >
      {children}
    </a>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function LeadershipDetail() {
  const { slug } = useParams();

  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  /* ==========================================================
     FETCH LEADERSHIP PROFILE
     ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadLeadership = async () => {
      if (!slug) {
        if (mounted) {
          setLeader(null);
          setErrorMessage("Leadership profile was not found.");
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getLeadershipBySlug(slug);

        if (!mounted) return;

        setLeader(data || null);

        if (!data) {
          setErrorMessage("Leadership profile was not found.");
        }
      } catch (error) {
        console.error("Failed to load leadership profile:", error);

        if (!mounted) return;

        setLeader(null);

        const status = error?.response?.status;

        if (status === 404) {
          setErrorMessage(
            "This leadership profile could not be found."
          );
        } else {
          setErrorMessage(
            "Unable to load this leadership profile right now. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLeadership();

    return () => {
      mounted = false;
    };
  }, [slug]);

  /* ==========================================================
     NORMALIZED DATA
     ========================================================== */

  const name =
    cleanText(leader?.name) || "Leadership Team";

  const designation =
    cleanText(leader?.designation) ||
    "Manyara Prive Vacations";

  const shortBio = cleanText(leader?.short_bio);
  const fullBio = cleanText(leader?.full_bio);
  const companyMessage = cleanText(leader?.company_message);

  const email = cleanText(leader?.email);
  const phone = cleanText(leader?.phone);
  const whatsapp = cleanText(leader?.whatsapp);

  const imageUrl = getImageUrl(leader?.image);

  const experienceText = getExperienceText(
    leader?.experience_years
  );

  const linkedin = getSafeUrl(leader?.linkedin);
  const instagram = getSafeUrl(leader?.instagram);
  const facebook = getSafeUrl(leader?.facebook);
  const whatsappUrl = getWhatsAppUrl(whatsapp);

  const biography = fullBio || shortBio;

  /* ==========================================================
     SEO
     ========================================================== */

  const seoTitle = useMemo(() => {
    if (!leader) {
      return "Leadership";
    }

    return `${name} — ${designation}`;
  }, [leader, name, designation]);

  const seoDescription = useMemo(() => {
    const description = fullBio || shortBio;

    if (description) {
      return description.length > 155
        ? `${description.slice(0, 152).trim()}...`
        : description;
    }

    return `${name}, ${designation} at Manyara Prive Vacations. Learn about the leadership, experience, and vision behind Manyara Prive Vacations.`;
  }, [fullBio, shortBio, name, designation]);

  const canonicalPath = `/about/leadership/${slug || ""}`;

  const jsonLd = useMemo(() => {
    if (!leader) {
      return [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Leadership | Manyara Prive Vacations",
          url: `${SITE_URL}${canonicalPath}`,
        },
      ];
    }

    const personSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      jobTitle: designation,
      description: seoDescription,
      url: `${SITE_URL}${canonicalPath}`,
    };

    if (imageUrl) {
      personSchema.image = imageUrl;
    }

    if (email) {
      personSchema.email = `mailto:${email}`;
    }

    if (phone) {
      personSchema.telephone = phone;
    }

    const sameAs = [];

    if (linkedin) sameAs.push(linkedin);
    if (instagram) sameAs.push(instagram);
    if (facebook) sameAs.push(facebook);

    if (sameAs.length > 0) {
      personSchema.sameAs = sameAs;
    }

    return [
      {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        name: `${name} — ${designation}`,
        url: `${SITE_URL}${canonicalPath}`,
        description: seoDescription,
        mainEntity: {
          "@type": "Person",
          name,
          jobTitle: designation,
          url: `${SITE_URL}${canonicalPath}`,
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      },
      personSchema,
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
            name: "About Us",
            item: `${SITE_URL}/about`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name,
            item: `${SITE_URL}${canonicalPath}`,
          },
        ],
      },
    ];
  }, [
    leader,
    name,
    designation,
    seoDescription,
    canonicalPath,
    imageUrl,
    email,
    phone,
    linkedin,
    instagram,
    facebook,
  ]);

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-ivory">
        <Seo
          title="Leadership"
          description="Meet the leadership team behind Manyara Prive Vacations."
          path={canonicalPath}
        />

        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="animate-pulse">
            <div className="mb-8 h-4 w-28 rounded-full bg-navy/10" />

            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className="aspect-[4/5] w-full rounded-[2rem] bg-navy/10" />

              <div>
                <div className="mb-4 h-4 w-36 rounded-full bg-navy/10" />

                <div className="mb-5 h-10 w-3/4 rounded-xl bg-navy/10 sm:h-14" />

                <div className="space-y-3">
                  <div className="h-4 w-full rounded bg-navy/10" />
                  <div className="h-4 w-11/12 rounded bg-navy/10" />
                  <div className="h-4 w-4/5 rounded bg-navy/10" />
                </div>

                <div className="mt-7 h-12 w-48 rounded-full bg-navy/10" />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* ==========================================================
     ERROR / NOT FOUND
     ========================================================== */

  if (!leader) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-ivory">
        <Seo
          title="Leadership profile not found"
          description="The requested Manyara Prive Vacations leadership profile could not be found."
          path={canonicalPath}
          noindex
        />

        <main className="flex min-h-[65vh] items-center justify-center px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7EDE5] text-accent">
              <UserRound
                className="h-7 w-7"
                aria-hidden="true"
              />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent sm:text-sm">
              Leadership
            </p>

            <h1 className="mt-3 font-display text-3xl font-semibold text-navy sm:text-4xl">
              Leadership profile not found
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-navy/60 sm:text-base">
              {errorMessage ||
                "The leadership profile you are looking for is unavailable."}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/about"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-navy
                  px-6
                  py-3.5
                  font-semibold
                  text-white
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-primary-hover
                "
              >
                <ArrowLeft
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Back to About
              </Link>

              <Link
                to="/"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-navy/15
                  bg-white
                  px-6
                  py-3.5
                  font-semibold
                  text-navy
                  transition-all
                  hover:-translate-y-0.5
                  hover:border-navy/30
                "
              >
                Go Home
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* ==========================================================
     MAIN PAGE
     ========================================================== */

  return (
    <div className="min-h-screen overflow-x-hidden bg-ivory">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={canonicalPath}
        image={imageUrl || undefined}
        type="profile"
        jsonLd={jsonLd}
      />

      {/* ======================================================
          HERO
          ====================================================== */}

      <section className="relative overflow-hidden bg-petal-gradient">
        {/* Decorative background elements */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-accent/5
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-32
            -left-24
            h-80
            w-80
            rounded-full
            bg-[#C8A47A]/10
            blur-3xl
          "
        />

        <div className="relative mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          {/* Breadcrumb */}

          <nav
            aria-label="Breadcrumb"
            className="
              mb-7
              flex
              flex-wrap
              items-center
              gap-x-2
              gap-y-1
              text-xs
              text-navy/50
              sm:mb-10
              sm:text-sm
            "
          >
            <Link
              to="/"
              className="transition-colors hover:text-accent"
            >
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <Link
              to="/about"
              className="transition-colors hover:text-accent"
            >
              About Us
            </Link>

            <span aria-hidden="true">/</span>

            <span className="max-w-[190px] truncate font-medium text-navy/70 sm:max-w-none">
              {name}
            </span>
          </nav>

          {/* Profile */}

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 xl:gap-20">
            {/* IMAGE */}

            <div className="w-full min-w-0">
              <div
                className="
                  relative
                  mx-auto
                  aspect-[4/5]
                  w-full
                  max-w-xl
                  overflow-hidden
                  rounded-[2rem]
                  border
                  border-white/80
                  bg-white/60
                  shadow-[0_24px_70px_rgba(6,27,69,0.12)]
                  lg:mx-0
                "
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`${name} — ${designation}`}
                    className="
                      absolute
                      inset-0
                      h-full
                      w-full
                      object-cover
                    "
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div
                    className="
                      absolute
                      inset-0
                      flex
                      items-center
                      justify-center
                      bg-gradient-to-br
                      from-[#F7EDE5]
                      via-white
                      to-[#EEE9E0]
                    "
                  >
                    <div
                      className="
                        flex
                        h-28
                        w-28
                        items-center
                        justify-center
                        rounded-full
                        bg-navy
                        font-display
                        text-3xl
                        font-semibold
                        text-white
                        shadow-xl
                        sm:h-36
                        sm:w-36
                        sm:text-4xl
                      "
                    >
                      {getInitials(name)}
                    </div>
                  </div>
                )}

                {/* Image gradient */}

                <div
                  aria-hidden="true"
                  className="
                    absolute
                    inset-x-0
                    bottom-0
                    h-40
                    bg-gradient-to-t
                    from-navy/65
                    via-navy/15
                    to-transparent
                  "
                />

                {/* Image label */}

                <div
                  className="
                    absolute
                    bottom-4
                    left-4
                    right-4
                    rounded-2xl
                    border
                    border-white/20
                    bg-navy/80
                    px-4
                    py-3
                    shadow-lg
                    backdrop-blur-md
                    sm:bottom-5
                    sm:left-5
                    sm:right-5
                    sm:px-5
                    sm:py-3.5
                  "
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E8CFAE] sm:text-xs">
                    Manyara Prive Vacations
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-white sm:text-base">
                    {designation}
                  </p>
                </div>
              </div>
            </div>

            {/* CONTENT */}

            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-white/70 px-3.5 py-2 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs">
                  Our leadership
                </span>
              </div>

              <h1
                className="
                  max-w-2xl
                  font-display
                  text-4xl
                  font-semibold
                  leading-[1.05]
                  tracking-[-0.02em]
                  text-navy
                  sm:text-5xl
                  md:text-6xl
                  lg:text-6xl
                  xl:text-7xl
                "
              >
                {name}
              </h1>

              <p className="mt-3 text-base font-medium text-navy/60 sm:text-lg lg:text-xl">
                {designation}
              </p>

              {shortBio && (
                <p
                  className="
                    mt-5
                    max-w-2xl
                    text-sm
                    leading-7
                    text-navy/65
                    sm:mt-6
                    sm:text-base
                    sm:leading-8
                  "
                >
                  {shortBio}
                </p>
              )}

              {/* Experience */}

              {experienceText && (
                <div className="mt-6 sm:mt-7">
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2.5
                      rounded-full
                      border
                      border-navy/10
                      bg-white/75
                      px-4
                      py-2.5
                      shadow-sm
                    "
                  >
                    <BriefcaseBusiness
                      className="h-4.5 w-4.5 text-accent"
                      aria-hidden="true"
                    />

                    <span className="text-sm font-medium text-navy/75">
                      {experienceText}
                    </span>
                  </div>
                </div>
              )}

              {/* Contact */}

              {(email || phone || whatsappUrl) && (
                <div className="mt-7 flex flex-wrap gap-2.5 sm:mt-8">
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-full
                        bg-accent
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-white
                        shadow-sm
                        transition-all
                        hover:-translate-y-0.5
                        hover:bg-accent-hover
                        hover:shadow-md
                      "
                    >
                      <Mail
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      Email
                    </a>
                  )}

                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-full
                        border
                        border-navy/15
                        bg-white/75
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-navy
                        shadow-sm
                        transition-all
                        hover:-translate-y-0.5
                        hover:border-navy/30
                        hover:bg-white
                      "
                    >
                      <Phone
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      Call
                    </a>
                  )}

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-full
                        border
                        border-[#25D366]/20
                        bg-white/75
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-[#188B45]
                        shadow-sm
                        transition-all
                        hover:-translate-y-0.5
                        hover:border-[#25D366]/40
                        hover:bg-[#25D366]
                        hover:text-white
                      "
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

              {/* Social links */}

              {(linkedin || instagram || facebook) && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2.5">
                    {linkedin && (
                      <SocialLink
                        href={linkedin}
                        label={`${name} on LinkedIn`}
                      >
                        <FaLinkedinIn
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </SocialLink>
                    )}

                    {instagram && (
                      <SocialLink
                        href={instagram}
                        label={`${name} on Instagram`}
                      >
                        <FaInstagram
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </SocialLink>
                    )}

                    {facebook && (
                      <SocialLink
                        href={facebook}
                        label={`${name} on Facebook`}
                      >
                        <FaFacebookF
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </SocialLink>
                    )}
                  </div>
                </div>
              )}

              {/* Small trust line */}

              <div className="mt-7 flex items-center gap-2 text-xs text-navy/45 sm:text-sm">
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />

                <span>
                  Thoughtful journeys, personal attention.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          PROFILE DETAILS
          ====================================================== */}

      <main>
        {biography && (
          <section className="bg-white">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.28fr_0.72fr] lg:gap-14">
                {/* Section label */}

                <div>
                  <div className="sticky top-24">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
                      Profile
                    </p>

                    <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-navy sm:text-3xl">
                      About {name}
                    </h2>
                  </div>
                </div>

                {/* Biography */}

                <div
                  className="
                    max-w-3xl
                    text-sm
                    leading-7
                    text-navy/65
                    sm:text-base
                    sm:leading-8
                  "
                >
                  <div className="mb-6 h-px w-14 bg-accent/50 lg:hidden" />

                  <p className="whitespace-pre-line">
                    {biography}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            COMPANY MESSAGE
            ==================================================== */}

        {companyMessage && (
          <section className="bg-petal-gradient">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[2rem]
                  border
                  border-navy/8
                  bg-white/85
                  p-6
                  shadow-[0_20px_60px_rgba(6,27,69,0.07)]
                  backdrop-blur-sm
                  sm:p-8
                  lg:p-10
                "
              >
                {/* Decorative quote */}

                <div
                  aria-hidden="true"
                  className="
                    absolute
                    -right-4
                    -top-12
                    font-display
                    text-[13rem]
                    leading-none
                    text-accent/5
                    select-none
                  "
                >
                  “
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-accent" />

                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
                      A message from our leadership
                    </p>
                  </div>

                  <blockquote
                    className="
                      mt-5
                      max-w-4xl
                      font-display
                      text-xl
                      leading-relaxed
                      text-navy
                      sm:text-2xl
                      lg:text-3xl
                    "
                  >
                    “{companyMessage}”
                  </blockquote>

                  <div className="mt-7 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7EDE5] text-accent">
                      <UserRound
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy sm:text-base">
                        {name}
                      </p>

                      <p className="truncate text-xs text-navy/50 sm:text-sm">
                        {designation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            CONTACT / TRUST
            ==================================================== */}


      {(experienceText || email || phone || whatsappUrl) && (
        <section className="relative overflow-hidden border-y border-navy/8 bg-petal-gradient">
          {/* Decorative background details */}
          <div
            className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-navy/5 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            {/* Section heading */}
            <div className="mb-8 max-w-2xl sm:mb-10">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-accent" aria-hidden="true" />

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
                  Connect with us
                </p>
              </div>

              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-4xl">
                Get in touch
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-navy/60 sm:text-base">
                Have a question about your journey? Our team is here to help
                you plan it with care.
              </p>
            </div>

            {/* Contact cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Experience */}
              {experienceText && (
                <div className="group relative overflow-hidden rounded-[1.5rem] border border-navy/10 bg-white/75 p-5 shadow-[0_8px_30px_rgba(6,27,69,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/20 hover:shadow-[0_16px_40px_rgba(6,27,69,0.08)] sm:p-6">
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/5 transition-transform duration-500 group-hover:scale-125"
                    aria-hidden="true"
                  />

                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                      <BriefcaseBusiness
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>

                    <p className="font-display text-2xl font-semibold tracking-tight text-navy sm:text-[1.7rem]">
                      {experienceText}
                    </p>

                    <p className="mt-1.5 text-sm text-navy/50">
                      Professional experience
                    </p>
                  </div>
                </div>
              )}

              {/* Email */}
              {email && (
                <div className="group relative overflow-hidden rounded-[1.5rem] border border-navy/10 bg-white/75 p-5 shadow-[0_8px_30px_rgba(6,27,69,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/20 hover:shadow-[0_16px_40px_rgba(6,27,69,0.08)] sm:p-6">
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/5 transition-transform duration-500 group-hover:scale-125"
                    aria-hidden="true"
                  />

                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                      <Mail
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>

                    <p className="text-sm font-semibold text-navy sm:text-base">
                      Email
                    </p>

                    <a
                      href={`mailto:${email}`}
                      className="mt-2 block break-words text-sm leading-6 text-navy/60 transition-colors duration-200 hover:text-accent"
                    >
                      {email}
                    </a>
                  </div>
                </div>
              )}

              {/* Phone / WhatsApp */}
              {(phone || whatsappUrl) && (
                <div className="group relative overflow-hidden rounded-[1.5rem] border border-navy/10 bg-white/75 p-5 shadow-[0_8px_30px_rgba(6,27,69,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/20 hover:shadow-[0_16px_40px_rgba(6,27,69,0.08)] sm:p-6">
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/5 transition-transform duration-500 group-hover:scale-125"
                    aria-hidden="true"
                  />

                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                      <Phone
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>

                    <p className="text-sm font-semibold text-navy sm:text-base">
                      Contact
                    </p>

                    <div className="mt-2 space-y-2">
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="block text-sm text-navy/60 transition-colors duration-200 hover:text-accent"
                        >
                          {phone}
                        </a>
                      )}

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#188B45] transition-colors duration-200 hover:text-[#0D7135]"
                        >
                          <FaWhatsapp
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          WhatsApp available
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

        {/* ====================================================
            CTA
            ==================================================== */}
          <section className="bg-rose-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[2rem]
                  border
                  border-[#7A2948]/10
                  bg-primary-lighter
                  px-5
                  py-10
                  text-center
                  shadow-[0_18px_50px_rgba(82,25,48,0.08)]
                  sm:px-8
                  sm:py-12
                  lg:px-12
                  lg:py-14
                "
              >
                {/* Decorative glow — darker so it is visible on the rose background */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -right-20
                    -top-24
                    h-56
                    w-56
                    rounded-full
                    blur-3xl
                  "
                />

                {/* Secondary decorative glow */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -bottom-24
                    -left-20
                    h-48
                    w-48
                    rounded-full
                    bg-[#C8A47A]/20
                    blur-3xl
                  "
                />

                {/* Subtle inner border */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-3
                    rounded-[1.7rem]
                    border
                    border-white/40
                  "
                />

                <div className="relative z-10">
                  {/* Brand label */}
                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.22em]
                      text-[#7A2948]
                      sm:text-xs
                    "
                  >
                    Manyara Prive Vacations
                  </p>

                  {/* Heading */}
                  <h2
                    className="
                      mx-auto
                      mt-2
                      max-w-2xl
                      font-display
                      text-2xl
                      font-semibold
                      leading-tight
                      text-[#17213A]
                      sm:text-3xl
                      lg:text-4xl
                    "
                  >
                    Let&apos;s plan a journey worth remembering.
                  </h2>

                  {/* Description */}
                  <p
                    className="
                      mx-auto
                      mt-3
                      max-w-xl
                      text-sm
                      leading-7
                      text-[#17213A]/65
                      sm:text-base
                    "
                  >
                    Explore thoughtfully planned holidays and discover experiences
                    designed around the way you love to travel.
                  </p>

                  {/* CTA Buttons */}
                  <div
                    className="
                      mt-7
                      flex
                      flex-col
                      justify-center
                      gap-3
                      sm:flex-row
                    "
                  >
                    <button
                      type="button"
                      onClick={() => setIsEnquiryOpen(true)}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-full
                        bg-[#7A2948]
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-white
                        shadow-[0_8px_24px_rgba(122,41,72,0.22)]
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:bg-[#68223D]
                        hover:shadow-[0_12px_30px_rgba(122,41,72,0.28)]
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#7A2948]/30
                        focus:ring-offset-2
                        focus:ring-offset-[#F4DDE5]
                      "
                    >
                      Plan Your Trip
                    </button>

                    <Link
                      to="/packages"
                      className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-[#7A2948]/20
                        bg-white/85
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-[#17213A]
                        shadow-sm
                        backdrop-blur-sm
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:border-[#7A2948]/35
                        hover:bg-white
                        hover:shadow-md
                      "
                    >
                      Browse Packages
                    </Link>
                  </div>

                  {/* Trust message */}
                  <div
                    className="
                      mt-6
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-xs
                      text-[#17213A]/55
                      sm:text-sm
                    "
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-[#7A2948]"
                      aria-hidden="true"
                    />

                    <span>
                      Travel planned with care and personal attention.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        {/* ====================================================
            ENQUIRY FORM
            ==================================================== */}

        {isEnquiryOpen && (
          <EnquiryForm
            onClose={() => setIsEnquiryOpen(false)}
          />
        )}
      </main>

      {/* ======================================================
          FAQ
          ====================================================== */}

      <FAQSection />

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <Footer />
    </div>
  );
}

