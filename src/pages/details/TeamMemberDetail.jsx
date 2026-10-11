

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChevronRight,
  Mail,
  Phone,
  UserRound,
  Users,
} from "lucide-react";
import {
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
} from "react-icons/fa";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import { getTeamMemberBySlug } from "../../api/content";
import FAQSection from "../../components/FAQSection";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return (
      image?.url ||
      image?.secure_url ||
      image?.src ||
      image?.image_url ||
      ""
    );
  }

  return "";
};

/**
 * Only allow normal web URLs for social links.
 * This prevents unsafe values such as javascript: URLs.
 */
const getSafeUrl = (value) => {
  const url = cleanText(value);

  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    ) {
      return parsed.toString();
    }

    return "";
  } catch {
    return "";
  }
};

const getExperienceText = (years) => {
  const value = Number(years);

  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return `${value} ${value === 1 ? "year" : "years"} experience`;
};

const getInitials = (name) => {
  const value = cleanText(name);

  if (!value) return "MP";

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${
    words[words.length - 1][0]
  }`.toUpperCase();
};

/**
 * Converts a WhatsApp phone number into a wa.me URL.
 *
 * Examples:
 * +91 98765 43210 -> https://wa.me/919876543210
 * 919876543210    -> https://wa.me/919876543210
 *
 * If the admin already entered a complete WhatsApp URL,
 * it is returned after validation.
 */
const getWhatsAppUrl = (value) => {
  const whatsapp = cleanText(value);

  if (!whatsapp) return "";

  // Already a URL
  if (/^https?:\/\//i.test(whatsapp)) {
    return getSafeUrl(whatsapp);
  }

  // Convert phone number to digits only
  const digits = whatsapp.replace(/[^\d]/g, "");

  if (!digits) return "";

  return `https://wa.me/${digits}`;
};

/* -------------------------------------------------------------------------- */
/* Contact Actions                                                            */
/* -------------------------------------------------------------------------- */

function ContactActions({ member }) {
  const email = cleanText(member?.email);
  const phone = cleanText(member?.phone);
  const whatsappHref = getWhatsAppUrl(member?.whatsapp);

  return (
    <div className="flex flex-wrap gap-2.5 sm:gap-3">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="
            inline-flex items-center gap-2
            rounded-full
            bg-primary
            px-4 py-2.5
            text-sm font-semibold text-white
            shadow-brand
            transition-all duration-300
            hover:bg-primary-hover
            hover:-translate-y-0.5
            focus:outline-none focus:ring-2
            focus:ring-primary/30
          "
        >
          <Phone
            size={16}
            aria-hidden="true"
          />
          Call
        </a>
      )}

      {email && (
        <a
          href={`mailto:${email}`}
          className="
            inline-flex items-center gap-2
            rounded-full
            border border-border
            bg-white
            px-4 py-2.5
            text-sm font-semibold text-ink-800
            shadow-travel-card
            transition-all duration-300
            hover:border-primary/30
            hover:bg-surface-soft
            hover:text-primary-dark
            hover:-translate-y-0.5
          "
        >
          <Mail
            size={16}
            aria-hidden="true"
          />
          Email
        </a>
      )}

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-2
            rounded-full
            border border-success/20
            bg-success-bg
            px-4 py-2.5
            text-sm font-semibold text-success-text
            transition-all duration-300
            hover:border-success/30
            hover:bg-[#E5F4EC]
            hover:-translate-y-0.5
          "
        >
          <FaWhatsapp
            size={16}
            aria-hidden="true"
          />
          WhatsApp
        </a>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Social Links                                                               */
/* -------------------------------------------------------------------------- */

function SocialLinks({ member }) {
  const linkedin = getSafeUrl(member?.linkedin);
  const instagram = getSafeUrl(member?.instagram);

  if (!linkedin && !instagram) {
    return null;
  }

  const memberName =
    cleanText(member?.name) || "Team member";

  return (
    <div className="flex items-center gap-2">
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex h-10 w-10
            items-center justify-center
            rounded-full
            border border-divider
            bg-white
            text-ink-700
            shadow-travel-card
            transition-all duration-300
            hover:border-primary/30
            hover:bg-primary
            hover:text-white
            hover:-translate-y-0.5
            sm:h-11 sm:w-11
          "
          aria-label={`${memberName} LinkedIn`}
          title="LinkedIn"
        >
          <FaLinkedinIn
            className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
          />
        </a>
      )}

      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex h-10 w-10
            items-center justify-center
            rounded-full
            border border-divider
            bg-white
            text-ink-700
            shadow-travel-card
            transition-all duration-300
            hover:border-primary/30
            hover:bg-primary
            hover:text-white
            hover:-translate-y-0.5
            sm:h-11 sm:w-11
          "
          aria-label={`${memberName} Instagram`}
          title="Instagram"
        >
          <FaInstagram
            className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
          />
        </a>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading State                                                              */
/* -------------------------------------------------------------------------- */

function TeamMemberSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-petal-gradient">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="h-4 w-40 animate-pulse rounded-full bg-surface-strong" />

          <div className="mt-7 grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12">
            <div className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-surface-strong" />

            <div className="space-y-4">
              <div className="h-4 w-32 animate-pulse rounded-full bg-surface-strong" />
              <div className="h-10 w-3/4 animate-pulse rounded-xl bg-surface-strong" />
              <div className="h-5 w-1/2 animate-pulse rounded-lg bg-surface-strong" />
              <div className="h-16 w-full animate-pulse rounded-xl bg-surface-strong" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TeamMemberDetail() {
  const { slug } = useParams();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------------------------------------------------------------- */
  /* Load Team Member                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const loadMember = async () => {
      if (!slug) {
        setError(
          "Team member profile could not be found."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setMember(null);

        const response =
          await getTeamMemberBySlug(slug);

        if (!mounted) return;

        setMember(response);
      } catch (err) {
        console.error(
          "Failed to load team member:",
          err
        );

        if (!mounted) return;

        const status =
          err?.response?.status;

        if (status === 404) {
          setError(
            "This team member profile is not available."
          );
        } else if (status === 403) {
          setError(
            "This team member profile is not publicly available."
          );
        } else {
          setError(
            err?.response?.data?.detail ||
              "We couldn't load this team member profile right now."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMember();

    return () => {
      mounted = false;
    };
  }, [slug]);

  /* ---------------------------------------------------------------------- */
  /* Normalized Data                                                        */
  /* ---------------------------------------------------------------------- */

  const name = cleanText(member?.name);
  const designation = cleanText(
    member?.designation
  );
  const department = cleanText(
    member?.department
  );

  const shortDescription = cleanText(
    member?.short_description
  );

  const fullDescription =
    cleanText(member?.full_description) ||
    shortDescription;

  const imageUrl = getImageUrl(
    member?.image
  );

  const experience = getExperienceText(
    member?.experience_years
  );

  const pageTitle = name
    ? `${name} — ${
        designation || "Team Member"
      }`
    : "Team Member";

  const pageDescription =
    shortDescription ||
    (name
      ? `Learn more about ${name}, ${
          designation || "a team member"
        } at Manyara Prive Vacations.`
      : "Meet the team behind Manyara Prive Vacations.");

  const profileUrl = member?.slug
    ? `${SITE_URL}/about/team/${member.slug}`
    : `${SITE_URL}/about/team`;

  /* ---------------------------------------------------------------------- */
  /* Person Schema                                                          */
  /* ---------------------------------------------------------------------- */

  const personSchema = useMemo(() => {
    if (!member) return null;

    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: name || "Manyara Prive Vacations Team Member",
      url: profileUrl,
      worksFor: {
        "@type": "Organization",
        name: "Manyara Prive Vacations",
        url: SITE_URL,
      },
    };

    if (designation) {
      person.jobTitle = designation;
    }

    if (department) {
      person.department = department;
    }

    if (imageUrl) {
      person.image = imageUrl;
    }

    if (member?.email) {
      person.email = cleanText(
        member.email
      );
    }

    if (
      member?.telephone ||
      member?.phone
    ) {
      person.telephone = cleanText(
        member.telephone ||
          member.phone
      );
    }

    const linkedin = getSafeUrl(
      member?.linkedin
    );

    const instagram = getSafeUrl(
      member?.instagram
    );

    const sameAs = [];

    if (linkedin) {
      sameAs.push(linkedin);
    }

    if (instagram) {
      sameAs.push(instagram);
    }

    if (sameAs.length > 0) {
      person.sameAs = sameAs;
    }

    return person;
  }, [
    member,
    name,
    designation,
    department,
    imageUrl,
    profileUrl,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <Seo
          title="Team Member"
          description="Meet the team behind Manyara Prive Vacations."
          path={`/about/team/${slug || ""}`}
        />

        <TeamMemberSkeleton />
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error / Not Found                                                      */
  /* ---------------------------------------------------------------------- */

  if (error || !member) {
    return (
      <>
        <Seo
          title="Team Member Not Found"
          description="The requested Manyara Prive Vacations team member profile is not available."
          path={`/about/team/${slug || ""}`}
          noindex
        />

        <main className="min-h-screen bg-background">
          <section className="bg-petal-gradient">
            <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
              <div
                className="
                  mx-auto flex h-14 w-14
                  items-center justify-center
                  rounded-full
                  border border-primary/15
                  bg-white
                  text-primary
                  shadow-travel-card
                  sm:h-16 sm:w-16
                "
              >
                <UserRound
                  size={28}
                  aria-hidden="true"
                />
              </div>

              <h1
                className="
                  mt-5
                  font-display
                  text-3xl font-semibold
                  text-ink-800
                  sm:text-4xl
                "
              >
                Team member unavailable
              </h1>

              <p
                className="
                  mx-auto mt-3 max-w-xl
                  text-sm leading-6
                  text-ink-600
                  sm:text-base sm:leading-7
                "
              >
                {error ||
                  "The requested team member profile could not be found."}
              </p>

              <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
                <Link
                  to="/about/team"
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-full
                    bg-primary
                    px-6 py-3
                    text-sm font-bold text-white
                    shadow-brand
                    transition-all duration-300
                    hover:bg-primary-hover
                    hover:-translate-y-0.5
                  "
                >
                  <ArrowLeft
                    size={17}
                    aria-hidden="true"
                  />
                  Back to team
                </Link>

                <Link
                  to="/about"
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-full
                    border border-border
                    bg-white
                    px-6 py-3
                    text-sm font-bold text-ink-800
                    shadow-travel-card
                    transition-all duration-300
                    hover:border-primary/30
                    hover:bg-surface-soft
                    hover:text-primary-dark
                  "
                >
                  About Us
                </Link>
              </div>
            </div>
          </section>

          <FAQSection />
          <Footer />
        </main>
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Main                                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        path={`/about/team/${member.slug}`}
        image={imageUrl || undefined}
        type="profile"
        jsonLd={[
          personSchema,
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${SITE_URL}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "About",
                item: `${SITE_URL}/about`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Team",
                item: `${SITE_URL}/about/team`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name:
                  name || "Team Member",
                item: profileUrl,
              },
            ],
          },
        ]}
      />

      <main className="min-h-screen bg-background">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                             */}
        {/* ---------------------------------------------------------------- */}

        <section className="relative overflow-hidden bg-petal-gradient">
          {/* Decorative brand shapes */}
          <div
            className="
              pointer-events-none absolute
              -right-32 -top-32
              h-80 w-80
              rounded-full
              bg-rose-200/40
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none absolute
              -bottom-40 -left-20
              h-80 w-80
              rounded-full
              bg-primary/5
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none absolute
              right-[18%] top-[35%]
              h-24 w-24
              rounded-full
              bg-secondary-lighter
              blur-2xl
            "
          />

          <div className="relative mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-11">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="
                flex flex-wrap items-center
                gap-1.5
                text-xs text-ink-500
                sm:gap-2 sm:text-sm
              "
            >
              <Link
                to="/"
                className="
                  transition-colors
                  hover:text-primary
                "
              >
                Home
              </Link>

              <ChevronRight
                size={14}
                className="text-rose-300"
                aria-hidden="true"
              />

              <Link
                to="/about"
                className="
                  transition-colors
                  hover:text-primary
                "
              >
                About Us
              </Link>

              <ChevronRight
                size={14}
                className="text-rose-300"
                aria-hidden="true"
              />

              <span
                className="
                  max-w-[180px]
                  truncate
                  font-medium text-ink-700
                  sm:max-w-none
                "
              >
                {name || "Team Member"}
              </span>
            </nav>

            <div
              className="
                mt-7 grid gap-7
                lg:grid-cols-[0.75fr_1.25fr]
                lg:items-center lg:gap-12
              "
            >
              {/* Image */}
              <div className="mx-auto w-full max-w-md lg:mx-0">
                <div
                  className="
                    relative overflow-hidden
                    rounded-[1.75rem]
                    border border-white
                    bg-white
                    shadow-travel-hover
                  "
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={
                        name ||
                        "Manyara Prive Vacations team member"
                      }
                      className="
                        aspect-[4/5]
                        h-full w-full
                        object-cover
                      "
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="
                        flex aspect-[4/5]
                        items-center justify-center
                        bg-brand-gradient
                      "
                    >
                      <div
                        className="
                          flex h-24 w-24
                          items-center justify-center
                          rounded-full
                          bg-white
                          text-2xl font-bold
                          text-primary
                          shadow-travel-hover
                          sm:h-28 sm:w-28
                          sm:text-3xl
                        "
                      >
                        {getInitials(name)}
                      </div>
                    </div>
                  )}

                  <div
                    className="
                      pointer-events-none
                      absolute inset-x-0 bottom-0
                      h-1/3
                      bg-gradient-to-t
                      from-ink-900/20
                      to-transparent
                    "
                  />

                  {/* Small brand badge */}
                  <div
                    className="
                      absolute bottom-4 left-4
                      inline-flex items-center gap-2
                      rounded-full
                      border border-white/80
                      bg-white/90
                      px-3 py-1.5
                      text-[10px] font-bold
                      uppercase tracking-[0.14em]
                      text-primary-dark
                      shadow-travel-card
                      backdrop-blur
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Manyara Prive
                  </div>
                </div>
              </div>

              {/* Intro */}
              <div className="max-w-3xl">
                <div
                  className="
                    mb-3 inline-flex
                    items-center gap-2
                    rounded-full
                    border border-primary/15
                    bg-white
                    px-3.5 py-1.5
                    text-[11px] font-bold
                    uppercase tracking-[0.16em]
                    text-primary-dark
                    shadow-travel-card
                    sm:px-4 sm:py-2 sm:text-xs
                  "
                >
                  <Users
                    size={14}
                    aria-hidden="true"
                  />
                  Manyara Prive team
                </div>

                <p
                  className="
                    text-xs font-bold
                    uppercase tracking-[0.18em]
                    text-primary
                    sm:text-sm
                  "
                >
                  {designation ||
                    "Team member"}
                </p>

                <h1
                  className="
                    mt-2
                    font-display
                    text-4xl font-semibold
                    leading-[1.05]
                    tracking-tight
                    text-ink-800
                    sm:text-5xl
                    lg:text-6xl
                  "
                >
                  {name || "Team Member"}
                </h1>

                {department && (
                  <p
                    className="
                      mt-2.5
                      text-base font-medium
                      text-ink-600
                      sm:mt-3 sm:text-lg
                    "
                  >
                    {department}
                  </p>
                )}

                {shortDescription && (
                  <p
                    className="
                      mt-4 max-w-2xl
                      text-sm leading-6
                      text-ink-600
                      sm:mt-5
                      sm:text-base sm:leading-7
                      lg:text-lg
                    "
                  >
                    {shortDescription}
                  </p>
                )}

                <div
                  className="
                    mt-5 flex flex-wrap
                    gap-2.5
                    sm:mt-6 sm:gap-3
                  "
                >
                  {experience && (
                    <span
                      className="
                        inline-flex items-center gap-2
                        rounded-full
                        border border-primary/15
                        bg-white
                        px-3.5 py-2
                        text-xs font-semibold
                        text-ink-700
                        shadow-travel-card
                        sm:px-4 sm:py-2.5 sm:text-sm
                      "
                    >
                      <BriefcaseBusiness
                        size={15}
                        className="text-primary"
                        aria-hidden="true"
                      />
                      {experience}
                    </span>
                  )}

                  {department && (
                    <span
                      className="
                        inline-flex items-center gap-2
                        rounded-full
                        border border-divider
                        bg-surface
                        px-3.5 py-2
                        text-xs font-semibold
                        text-ink-700
                        sm:px-4 sm:py-2.5 sm:text-sm
                      "
                    >
                      <Users
                        size={15}
                        className="text-primary"
                        aria-hidden="true"
                      />
                      {department}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Profile Content                                                  */}
        {/* ---------------------------------------------------------------- */}

        <section className="bg-white">
          <div
            className="
              mx-auto max-w-7xl
              px-5 py-9
              sm:px-6 sm:py-11
              lg:px-8 lg:py-14
            "
          >
            <div
              className="
                grid gap-8
                lg:grid-cols-[1.35fr_0.65fr]
                lg:gap-12
              "
            >
              {/* Main description */}
              <article>
                <p
                  className="
                    text-xs font-bold
                    uppercase tracking-[0.16em]
                    text-primary
                    sm:text-sm
                  "
                >
                  About {name || "this team member"}
                </p>

                <h2
                  className="
                    mt-1.5
                    font-display
                    text-3xl font-semibold
                    tracking-tight
                    text-ink-800
                    sm:text-4xl
                  "
                >
                  A member of the
                  Manyara Prive team
                </h2>

                <div
                  className="
                    mt-3 h-1 w-14
                    rounded-full
                    bg-brand-gradient
                  "
                />

                {fullDescription ? (
                  <div
                    className="
                      mt-5 whitespace-pre-line
                      text-sm leading-7
                      text-ink-600
                      sm:mt-6
                      sm:text-base sm:leading-8
                    "
                  >
                    {fullDescription}
                  </div>
                ) : (
                  <p
                    className="
                      mt-5
                      text-sm leading-7
                      text-ink-600
                      sm:mt-6
                      sm:text-base sm:leading-8
                    "
                  >
                    More information about
                    this team member will be
                    added soon.
                  </p>
                )}

                {/* Contact */}
                <div className="mt-6 sm:mt-7">
                  <ContactActions
                    member={member}
                  />
                </div>
              </article>

              {/* Sidebar */}
              <aside>
                <div
                  className="
                    rounded-[1.75rem]
                    border border-divider
                    bg-surface
                    p-5
                    shadow-travel-card
                    sm:p-6
                  "
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3
                      className="
                        font-display
                        text-xl font-semibold
                        text-ink-800
                      "
                    >
                      Profile
                    </h3>

                    <div
                      className="
                        flex h-9 w-9
                        items-center justify-center
                        rounded-full
                        bg-primary-lighter
                        text-primary
                      "
                    >
                      <UserRound
                        size={17}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {designation && (
                      <div>
                        <p
                          className="
                            text-[11px] font-bold
                            uppercase tracking-[0.14em]
                            text-ink-500
                          "
                        >
                          Designation
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm font-semibold
                            text-ink-800
                          "
                        >
                          {designation}
                        </p>
                      </div>
                    )}

                    {department && (
                      <div>
                        <p
                          className="
                            text-[11px] font-bold
                            uppercase tracking-[0.14em]
                            text-ink-500
                          "
                        >
                          Department
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm font-semibold
                            text-ink-800
                          "
                        >
                          {department}
                        </p>
                      </div>
                    )}

                    {experience && (
                      <div>
                        <p
                          className="
                            text-[11px] font-bold
                            uppercase tracking-[0.14em]
                            text-ink-500
                          "
                        >
                          Experience
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm font-semibold
                            text-ink-800
                          "
                        >
                          {experience}
                        </p>
                      </div>
                    )}

                    {member?.email && (
                      <div>
                        <p
                          className="
                            text-[11px] font-bold
                            uppercase tracking-[0.14em]
                            text-ink-500
                          "
                        >
                          Email
                        </p>

                        <a
                          href={`mailto:${member.email}`}
                          className="
                            mt-1 block break-all
                            text-sm font-semibold
                            text-ink-800
                            transition-colors
                            hover:text-primary
                          "
                        >
                          {member.email}
                        </a>
                      </div>
                    )}

                    {member?.phone && (
                      <div>
                        <p
                          className="
                            text-[11px] font-bold
                            uppercase tracking-[0.14em]
                            text-ink-500
                          "
                        >
                          Phone
                        </p>

                        <a
                          href={`tel:${member.phone}`}
                          className="
                            mt-1 block
                            text-sm font-semibold
                            text-ink-800
                            transition-colors
                            hover:text-primary
                          "
                        >
                          {member.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div
                    className="
                      mt-6
                      border-t border-divider
                      pt-5
                    "
                  >
                    <SocialLinks
                      member={member}
                    />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Navigation CTA                                                   */}
        {/* ---------------------------------------------------------------- */}

        <section
          className="
            bg-surface
            px-5 pb-9
            sm:px-6 sm:pb-11
            lg:px-8 lg:pb-14
          "
        >
          <div className="mx-auto max-w-7xl">
            <div
              className="
                relative overflow-hidden
                rounded-[2rem]
                border border-primary/10
                bg-brand-gradient
                px-5 py-8
                shadow-travel-card
                sm:rounded-[2.25rem]
                sm:px-8 sm:py-10
                lg:px-10 lg:py-11
              "
            >
              {/* Decorative petal */}
              <div
                className="
                  pointer-events-none absolute
                  -right-16 -top-16
                  h-44 w-44
                  rounded-full
                  bg-white/60
                  blur-2xl
                "
              />

              <div
                className="
                  pointer-events-none absolute
                  -bottom-20 -left-12
                  h-40 w-40
                  rounded-full
                  bg-rose-300/20
                  blur-2xl
                "
              />

              <div
                className="
                  relative
                  flex flex-col gap-6
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                  lg:gap-8
                "
              >
                <div className="max-w-2xl">
                  <p
                    className="
                      text-xs font-bold
                      uppercase tracking-[0.16em]
                      text-primary-dark
                      sm:text-sm
                    "
                  >
                    Explore Manyara Prive
                  </p>

                  <h2
                    className="
                      mt-1.5
                      font-display
                      text-3xl font-semibold
                      tracking-tight
                      text-ink-800
                      sm:text-4xl
                    "
                  >
                    Discover the journeys
                    behind our brand.
                  </h2>

                  <p
                    className="
                      mt-3
                      max-w-xl
                      text-sm leading-6
                      text-ink-600
                      sm:text-base sm:leading-7
                    "
                  >
                    Explore thoughtfully crafted
                    travel experiences and discover
                    your next memorable journey.
                  </p>
                </div>

                <div
                  className="
                    flex flex-col gap-2.5
                    sm:flex-row lg:shrink-0
                  "
                >
                  <Link
                    to="/packages"
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-full
                      bg-orange-gradient
                      px-6 py-3
                      text-sm font-bold
                      text-white
                      shadow-brand
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:shadow-orange
                    "
                  >
                    Explore packages

                    <ArrowRight
                      size={17}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FAQSection />
      <Footer />
    </>
  );
}



