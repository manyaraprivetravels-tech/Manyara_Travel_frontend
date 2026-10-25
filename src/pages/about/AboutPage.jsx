

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  HeartHandshake,
  MessageSquareHeart,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  Eye,
} from "lucide-react";
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa";

import FAQSection from "../../components/FAQSection";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import { getAbout } from "../../api/content";
import EnquiryForm from "../EnquiryForm";
import ReviewFormModal from "../../components/ReviewFormModal";

/* =========================================================
   HELPERS
========================================================= */

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image.trim();
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

const getSafeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;

  return [];
};

const getDisplayOrder = (item) => {
  const value = Number(item?.display_order);

  return Number.isFinite(value)
    ? value
    : Number.MAX_SAFE_INTEGER;
};

const sortByDisplayOrder = (items) => {
  return [...items].sort(
    (a, b) =>
      getDisplayOrder(a) - getDisplayOrder(b) ||
      Number(a?.id || 0) - Number(b?.id || 0)
  );
};

const cleanText = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const getExperienceText = (years) => {
  const value = Number(years);

  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return `${value}+ ${value === 1 ? "year" : "years"} experience`;
};

const getSafeUrl = (value) => {
  const raw = cleanText(value);

  if (!raw) return "";

  try {
    const url = new URL(raw);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
};

/* =========================================================
   SOCIAL LINK
========================================================= */

function SocialLink({ href, label, icon: Icon }) {
  const safeHref = getSafeUrl(href);

  if (!safeHref) return null;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="
        inline-flex h-10 w-10 items-center justify-center
        rounded-full
        border border-navy/10
        bg-white
        text-navy/70
        shadow-sm
        transition-all
        hover:-translate-y-0.5
        hover:border-accent/30
        hover:bg-accent
        hover:text-white
        hover:shadow-md
      "
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

/* =========================================================
   IMAGE
========================================================= */

function PersonImage({
  image,
  name,
  className = "",
  fallbackClassName = "",
}) {
  const imageUrl = getImageUrl(image);

  if (!imageUrl) {
    return (
      <div
        className={`
          flex items-center justify-center
          bg-gradient-to-br from-[#fff4e8] via-[#f7f9fc] to-[#eef3f8]
          text-navy/25
          ${fallbackClassName}
          ${className}
        `}
        aria-label={`${name || "Person"} photo unavailable`}
      >
        <Users
          className="h-12 w-12"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={
        name
          ? `${name} - On a Trip Holiday`
          : "On a Trip Holiday team"
      }
      className={`object-cover ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}

/* =========================================================
   ABOUT PAGE
========================================================= */

export default function AboutPage({ onPlanTrip }) {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localEnquiryOpen, setLocalEnquiryOpen] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const handlePlanTrip =
    typeof onPlanTrip === "function"
      ? onPlanTrip
      : () => setLocalEnquiryOpen(true);

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadAbout = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAbout();

        if (!isMounted) return;

        setAboutData(data || null);
      } catch (err) {
        console.error("Failed to load About page:", err);

        if (isMounted) {
          setAboutData(null);
          setError(
            "We couldn't load our About information right now."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAbout();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =======================================================
     NORMALIZE BACKEND RESPONSE
  ======================================================= */

  const about = aboutData?.about || null;

  const leadership = useMemo(
    () =>
      sortByDisplayOrder(
        getSafeArray(aboutData?.leadership).filter(
          (person) => person?.is_active !== false
        )
      ),
    [aboutData?.leadership]
  );

  const team = useMemo(
    () =>
      sortByDisplayOrder(
        getSafeArray(aboutData?.team).filter(
          (member) =>
            member?.is_active !== false &&
            member?.show_public_profile !== false
        )
      ),
    [aboutData?.team]
  );

  const milestones = useMemo(
    () =>
      sortByDisplayOrder(
        getSafeArray(aboutData?.milestones)
      ),
    [aboutData?.milestones]
  );

  const values = useMemo(
    () =>
      sortByDisplayOrder(
        getSafeArray(aboutData?.values)
      ),
    [aboutData?.values]
  );

  /* =======================================================
     LEADERSHIP / FOUNDER
  ======================================================= */

  const founder = useMemo(() => {
    if (!leadership.length) return null;

    return (
      leadership.find((person) => {
        const designation = cleanText(
          person?.designation
        ).toLowerCase();

        return (
          designation.includes("ceo") ||
          designation.includes("chief executive") ||
          designation.includes("founder") ||
          designation.includes("managing director")
        );
      }) || leadership[0]
    );
  }, [leadership]);

  /* =======================================================
     SEO DATA
  ======================================================= */

  const companyName =
    cleanText(about?.company_name) ||
    "On a Trip Holiday";

  const seoTitle =
    cleanText(about?.hero_title) ||
    "About Us";

  const seoDescription =
    cleanText(about?.hero_description) ||
    "Learn more about On a Trip Holiday, our story, our people and how we create thoughtful travel experiences.";

  const aboutJsonLd = useMemo(() => {
    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: `About ${companyName}`,
        url: `${SITE_URL}/about`,
        description: seoDescription,
        isPartOf: {
          "@type": "WebSite",
          name: companyName,
          url: SITE_URL,
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
            name: "About Us",
            item: `${SITE_URL}/about`,
          },
        ],
      },
    ];

    if (founder) {
      const founderImage = getImageUrl(founder?.image);

      schemas.push({
        "@context": "https://schema.org",
        "@type": "Person",
        name: founder?.name,
        jobTitle: founder?.designation,
        description:
          founder?.full_bio ||
          founder?.short_bio ||
          undefined,

        ...(founderImage
          ? {
              image: founderImage,
            }
          : {}),

        ...(founder?.email
          ? {
              email: founder.email,
            }
          : {}),

        ...(founder?.telephone || founder?.phone
          ? {
              telephone:
                founder?.telephone ||
                founder?.phone,
            }
          : {}),

        ...(founder?.linkedin ||
        founder?.instagram ||
        founder?.facebook
          ? {
              sameAs: [
                founder?.linkedin,
                founder?.instagram,
                founder?.facebook,
              ].filter(Boolean),
            }
          : {}),
      });
    }

    return schemas;
  }, [companyName, seoDescription, founder]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Seo
          title="About Us"
          description="Learn more about On a Trip Holiday, our story, our people and our approach to travel."
          path="/about"
        />

        <section className="relative overflow-hidden border-b border-navy/10 bg-gradient-to-br from-[#fff8ef] via-white to-[#f4f7fb]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-navy/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="max-w-3xl animate-pulse">
              <div className="mb-5 h-4 w-24 rounded-full bg-navy/10" />

              <div className="h-10 w-full max-w-2xl rounded-xl bg-navy/10 sm:h-14" />

              <div className="mt-5 h-5 max-w-xl rounded-full bg-navy/10" />

              <div className="mt-2 h-5 max-w-lg rounded-full bg-navy/10" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-3xl border border-navy/5 bg-[#faf8f5]"
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* =======================================================
     ERROR / EMPTY STATE
  ======================================================= */

  if (error || !about) {
    return (
      <div className="min-h-screen bg-white">
        <Seo
          title="About Us"
          description="Learn more about On a Trip Holiday."
          path="/about"
        />

        <section className="relative overflow-hidden border-b border-navy/10 bg-gradient-to-br from-[#fff8ef] via-white to-[#f4f7fb] py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
              <Compass
                className="h-7 w-7 text-accent"
                aria-hidden="true"
              />
            </div>

            <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
              About On a Trip Holiday
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-navy/60">
              {error ||
                "About information is not available yet."}
            </p>

            <Link
              to="/"
              className="
                mt-7 inline-flex items-center gap-2
                rounded-full
                bg-accent
                px-6 py-3
                font-semibold text-white
                shadow-sm
                transition-all
                hover:-translate-y-0.5
                hover:bg-accent-hover
                hover:shadow-md
              "
            >
              Back to Home

              <ArrowRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* ===================================================
          SEO
      =================================================== */}

      <Seo
        title={seoTitle}
        description={seoDescription}
        path="/about"
        image={
          getImageUrl(founder?.image) ||
          `${SITE_URL}/og-default.jpg`
        }
        type="website"
        jsonLd={aboutJsonLd}
      />

      {/* ===================================================
          HERO
      =================================================== */}

      <section
        className="
          relative overflow-hidden
          border-b border-navy/10
          bg-gradient-to-br
          from-[#fff9f1]
          via-white
          to-[#f4f7fb]
        "
        aria-labelledby="about-hero-title"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-navy/5 blur-3xl" />

          <div className="absolute right-1/3 top-1/3 h-48 w-48 rounded-full bg-orange-100/30 blur-3xl" />
        </div>

        <div
          className="
            relative mx-auto max-w-6xl
            px-4 py-10
            sm:px-6 sm:py-14
            lg:px-8 lg:py-16
          "
        >
          {/* Breadcrumb */}

          <nav
            aria-label="Breadcrumb"
            className="
              mb-8 flex items-center gap-2
              text-sm text-navy/45
            "
          >
            <Link
              to="/"
              className="transition-colors hover:text-accent"
            >
              Home
            </Link>

            <ChevronRight
              className="h-4 w-4 text-navy/30"
              aria-hidden="true"
            />

            <span className="font-medium text-navy/70">
              About Us
            </span>
          </nav>

          <div className="max-w-4xl">
            <div
              className="
                inline-flex items-center gap-2
                text-sm font-semibold uppercase
                tracking-[0.14em]
                text-accent
              "
            >
              <Sparkles
                className="h-4 w-4"
                aria-hidden="true"
              />

              Who we are
            </div>

            <h1
              id="about-hero-title"
              className="
                mt-4
                font-display
                text-3xl font-semibold
                leading-tight text-navy
                sm:text-4xl
                md:text-5xl
                lg:text-6xl
              "
            >
              {cleanText(about?.hero_title) ||
                "Travel planned with care."}
            </h1>

            {cleanText(about?.hero_description) && (
              <p
                className="
                  mt-6 max-w-3xl
                  text-base leading-relaxed
                  text-navy/65
                  sm:text-lg
                  lg:text-xl
                "
              >
                {about.hero_description}
              </p>
            )}

            {Number(about?.years_experience) > 0 && (
              <div
                className="
                  mt-8 inline-flex items-center gap-3
                  rounded-full
                  border border-navy/10
                  bg-white/80
                  px-5 py-3
                  text-navy
                  shadow-sm
                  backdrop-blur
                "
              >
                <CalendarDays
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                />

                <span className="text-sm text-navy/75 sm:text-base">
                  {about.years_experience}+ years of travel
                  experience
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          TRUST / COMPANY FACTS
      =================================================== */}

      {(about?.founded_year ||
        about?.years_experience) && (
        <section
          className="border-b border-navy/5 bg-white py-8 sm:py-10 lg:py-12"
          aria-label="Company facts"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              {about?.founded_year && (
                <div
                  className="
                    rounded-3xl
                    border border-navy/10
                    bg-gradient-to-br from-white to-[#fffaf5]
                    p-5
                    shadow-sm
                    transition-shadow
                    hover:shadow-md
                    sm:p-6
                  "
                >
                  <CalendarDays
                    className="mb-3 h-5 w-5 text-accent"
                    aria-hidden="true"
                  />

                  <p className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    {about.founded_year}
                  </p>

                  <p className="mt-1 text-sm text-navy/55">
                    Year founded
                  </p>
                </div>
              )}

              {about?.years_experience && (
                <div
                  className="
                    rounded-3xl
                    border border-navy/10
                    bg-gradient-to-br from-white to-[#f7f9fc]
                    p-5
                    shadow-sm
                    transition-shadow
                    hover:shadow-md
                    sm:p-6
                  "
                >
                  <Compass
                    className="mb-3 h-5 w-5 text-accent"
                    aria-hidden="true"
                  />

                  <p className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    {about.years_experience}+
                  </p>

                  <p className="mt-1 text-sm text-navy/55">
                    Years of experience
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          OUR STORY
      =================================================== */}

      {(cleanText(about?.story_title) ||
        cleanText(about?.story_content)) && (
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Our journey
              </p>

              <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-navy sm:text-3xl lg:text-4xl">
                {cleanText(about?.story_title) ||
                  "Our story"}
              </h2>
            </div>

            <div className="text-sm leading-relaxed text-navy/65 sm:text-base">
              <div className="whitespace-pre-line">
                {about?.story_content}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          MISSION + VISION
      =================================================== */}

      {(cleanText(about?.mission) ||
        cleanText(about?.vision)) && (
        <section className="border-y border-navy/5 bg-[#faf8f5] py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
              {cleanText(about?.mission) && (
                <div
                  className="
                    rounded-3xl
                    border border-navy/10
                    bg-white
                    p-5
                    shadow-sm
                    sm:p-7
                  "
                >
                  <div
                    className="
                      mb-4 flex h-11 w-11
                      items-center justify-center
                      rounded-2xl
                      bg-accent/10
                    "
                  >
                    <Target
                      className="h-5 w-5 text-accent"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Our mission
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy/65 sm:text-base">
                    {about.mission}
                  </p>
                </div>
              )}

              {cleanText(about?.vision) && (
                <div
                  className="
                    rounded-3xl
                    border border-navy/10
                    bg-white
                    p-5
                    shadow-sm
                    sm:p-7
                  "
                >
                  <div
                    className="
                      mb-4 flex h-11 w-11
                      items-center justify-center
                      rounded-2xl
                      bg-accent/10
                    "
                  >
                    <Eye
                      className="h-5 w-5 text-accent"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Our vision
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy/65 sm:text-base">
                    {about.vision}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          FOUNDER / LEADERSHIP
      =================================================== */}

      {leadership.length > 0 && (
        <section className="py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  Founder & CEO
                </p>

                <h2 className="mt-1 font-display text-2xl font-semibold text-navy sm:text-3xl lg:text-4xl">
                  Meet our leadership
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/55 sm:text-base">
                  Get to know the people behind On a Trip
                  Holiday and the experience we bring to
                  every journey.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {leadership.map((person) => {
                const experienceText =
                  getExperienceText(
                    person?.experience_years
                  );

                return (
                  <article
                    key={person?.id || person?.slug}
                    className="
                      overflow-hidden
                      rounded-3xl
                      border border-navy/10
                      bg-white
                      shadow-sm
                      transition-shadow
                      hover:shadow-lg
                    "
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr]">
                      {/* IMAGE */}

                      <div className="min-h-[300px] bg-gradient-to-br from-[#fff4e8] to-[#eef3f8] md:min-h-full">
                        <PersonImage
                          image={person?.image}
                          name={person?.name}
                          className="h-full min-h-[300px] w-full md:min-h-full"
                          fallbackClassName="min-h-[300px] w-full md:min-h-full"
                        />
                      </div>

                      {/* CONTENT */}

                      <div className="p-6 sm:p-8 lg:p-10">
                        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                          {person?.designation}
                        </p>

                        <h3 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
                          {person?.name}
                        </h3>

                        {experienceText && (
                          <div className="mt-3 inline-flex items-center gap-2 text-sm text-navy/55">
                            <Compass
                              className="h-4 w-4 text-accent"
                              aria-hidden="true"
                            />

                            {experienceText}
                          </div>
                        )}

                        {cleanText(
                          person?.short_bio
                        ) && (
                          <p className="mt-5 text-sm leading-relaxed text-navy/65 sm:text-base">
                            {person.short_bio}
                          </p>
                        )}

                        {cleanText(
                          person?.company_message
                        ) && (
                          <div
                            className="
                              mt-6 rounded-2xl
                              border border-accent/10
                              bg-[#fff8f1]
                              p-5
                            "
                          >
                            <p className="text-sm leading-relaxed text-navy/65 italic">
                              “{person.company_message}”
                            </p>
                          </div>
                        )}

                        {/* SOCIAL */}

                        {(person?.linkedin ||
                          person?.instagram ||
                          person?.facebook) && (
                          <div className="mt-6 flex flex-wrap gap-2">
                            <SocialLink
                              href={person?.linkedin}
                              label={`${person?.name} on LinkedIn`}
                              icon={FaLinkedin}
                            />

                            <SocialLink
                              href={person?.instagram}
                              label={`${person?.name} on Instagram`}
                              icon={FaInstagram}
                            />

                            <SocialLink
                              href={person?.facebook}
                              label={`${person?.name} on Facebook`}
                              icon={FaFacebook}
                            />
                          </div>
                        )}

                        <Link
                          to={`/about/leadership/${person?.slug}`}
                          className="
                            mt-7 inline-flex items-center gap-2
                            rounded-full
                            bg-navy
                            px-5 py-3
                            font-semibold text-white
                            shadow-sm
                            transition-all
                            hover:-translate-y-0.5
                            hover:bg-primary-hover
                            hover:shadow-md
                          "
                        >
                          View full profile

                          <ArrowRight
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          OUR TEAM
      =================================================== */}

      {team.length > 0 && (
        <section className="border-y border-navy/5 bg-[#faf8f5] py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 max-w-2xl sm:mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Our team
              </p>

              <h2 className="mt-1 font-display text-2xl font-semibold leading-tight text-navy sm:text-3xl lg:text-4xl">
                The people behind your journey
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-navy/55 sm:text-base">
                Meet the team working behind the scenes to
                make your travel experience simple and
                memorable.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {team.map((member) => {
                const canOpenProfile =
                  member?.show_public_profile === true;

                const cardContent = (
                  <article
                    className={`
                      h-full overflow-hidden
                      rounded-3xl
                      border border-navy/10
                      bg-white
                      shadow-sm
                      transition-all
                      ${
                        canOpenProfile
                          ? "hover:-translate-y-1 hover:shadow-lg"
                          : ""
                      }
                    `}
                  >
                    {/* PHOTO */}

                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#fff4e8] to-[#eef3f8]">
                      <PersonImage
                        image={member?.image}
                        name={member?.name}
                        className="h-full w-full"
                        fallbackClassName="h-full w-full"
                      />
                    </div>

                    {/* DETAILS */}

                    <div className="p-5 sm:p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent sm:text-sm">
                        {member?.designation}
                      </p>

                      <h3 className="mt-1 font-display text-xl font-semibold text-navy sm:text-2xl">
                        {member?.name}
                      </h3>

                      {cleanText(
                        member?.department
                      ) && (
                        <p className="mt-1 text-sm text-navy/45">
                          {member.department}
                        </p>
                      )}

                      {cleanText(
                        member?.short_description
                      ) && (
                        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-navy/60">
                          {member.short_description}
                        </p>
                      )}

                      {getExperienceText(
                        member?.experience_years
                      ) && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-navy/50">
                          <Compass
                            className="h-4 w-4 text-accent"
                            aria-hidden="true"
                          />

                          {getExperienceText(
                            member?.experience_years
                          )}
                        </div>
                      )}

                      {canOpenProfile && (
                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                          View profile

                          <ArrowRight
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                );

                if (!canOpenProfile) {
                  return (
                    <div
                      key={
                        member?.id ||
                        member?.slug
                      }
                      className="h-full"
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={
                      member?.id ||
                      member?.slug
                    }
                    to={`/about/team/${member?.slug}`}
                    className="block h-full"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          MILESTONES / COMPANY JOURNEY
      =================================================== */}

      {milestones.length > 0 && (
        <section className="py-14 sm:py-18 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
                Our journey
              </p>

              <h2 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl lg:text-4xl">
                Moments that shaped us
              </h2>
            </div>

            <div className="relative">
              {/* TIMELINE LINE */}

              <div
                className="
                  absolute
                  bottom-0 left-4 top-0
                  w-px bg-navy/10
                  sm:left-1/2
                "
                aria-hidden="true"
              />

              <div className="space-y-8 sm:space-y-12">
                {milestones.map(
                  (milestone, index) => {
                    const imageUrl = getImageUrl(
                      milestone?.image
                    );

                    const isEven =
                      index % 2 === 0;

                    return (
                      <article
                        key={
                          milestone?.id ||
                          `${milestone?.year}-${milestone?.title}`
                        }
                        className="
                          relative
                          grid grid-cols-1
                          gap-6
                          sm:grid-cols-2
                          sm:gap-10
                        "
                      >
                        {/* DOT */}

                        <div
                          className="
                            absolute left-4 top-1.5
                            z-10 h-3 w-3
                            -translate-x-1/2
                            rounded-full
                            border-4 border-white
                            bg-accent
                            shadow-sm
                            sm:left-1/2
                          "
                          aria-hidden="true"
                        />

                        {/* CONTENT */}

                        <div
                          className={`
                            pl-10
                            sm:pl-0
                            ${
                              isEven
                                ? "sm:pr-10 sm:text-right"
                                : "sm:col-start-2 sm:pl-10"
                            }
                          `}
                        >
                          <p className="font-display text-2xl font-semibold text-accent">
                            {milestone?.year}
                          </p>

                          <h3 className="mt-1 font-display text-xl font-semibold text-navy sm:text-2xl">
                            {milestone?.title}
                          </h3>

                          {cleanText(
                            milestone?.description
                          ) && (
                            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy/60">
                              {milestone.description}
                            </p>
                          )}

                          {imageUrl && (
                            <div
                              className={`
                                mt-5 max-w-sm
                                overflow-hidden
                                rounded-2xl
                                border border-navy/10
                                shadow-sm
                                ${
                                  isEven
                                    ? "sm:ml-auto"
                                    : ""
                                }
                              `}
                            >
                              <img
                                src={imageUrl}
                                alt={`${milestone?.title} - ${milestone?.year}`}
                                className="aspect-[16/9] w-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          VALUES
      =================================================== */}

      {values.length > 0 && (
        <section className="border-y border-navy/5 bg-[#faf8f5] py-14 sm:py-18 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl sm:mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
                What we stand for
              </p>

              <h2 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl lg:text-4xl">
                Our values
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {values.map((value) => (
                <article
                  key={
                    value?.id ||
                    `${value?.title}-${value?.display_order}`
                  }
                  className="
                    rounded-3xl
                    border border-navy/10
                    bg-white
                    p-6
                    shadow-sm
                    transition-all
                    hover:-translate-y-1
                    hover:shadow-md
                    sm:p-7
                  "
                >
                  <div
                    className="
                      mb-5 flex h-12 w-12
                      items-center justify-center
                      rounded-2xl
                      bg-accent/10
                    "
                  >
                    {value?.icon ? (
                      <Sparkles
                        className="h-6 w-6 text-accent"
                        aria-hidden="true"
                      />
                    ) : (
                      <HeartHandshake
                        className="h-6 w-6 text-accent"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <h3 className="font-display text-xl font-semibold text-navy">
                    {value?.title}
                  </h3>

                  {cleanText(
                    value?.description
                  ) && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy/60">
                      {value.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          PLAN YOUR JOURNEY
      =================================================== */}

      <section
        id="enquire"
        className="
          border-y border-navy/10
          bg-gradient-to-br
          from-[#fff7ed]
          via-white
          to-[#f4f7fb]
          py-10
          sm:py-12
          lg:py-16
        "
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
            {/* LEFT */}

            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                Plan your journey
              </p>

              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-navy sm:text-4xl lg:text-5xl">
                Tell us where you want to go.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-navy/60 sm:text-lg">
                Not sure which package is right for you?
                Tell us a little about your trip and our
                travel team will help you plan it.
              </p>

              <div className="mt-7 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />

                  <p className="text-sm text-navy/70 sm:text-base">
                    Personalized travel recommendations
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />

                  <p className="text-sm text-navy/70 sm:text-base">
                    Honest pricing with no hidden charges
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />

                  <p className="text-sm text-navy/70 sm:text-base">
                    Support from planning to your journey
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 text-navy/55">
                <MessageCircle
                  className="h-5 w-5 shrink-0 text-accent"
                  aria-hidden="true"
                />

                <span className="text-sm">
                  Our team will get back to you after
                  receiving your enquiry.
                </span>
              </div>
            </div>

            {/* RIGHT */}

            <div className="w-full min-w-0">
              <div
                className="
                  rounded-3xl
                  border border-navy/10
                  bg-white
                  p-5
                  shadow-xl
                  sm:p-6
                  lg:p-8
                "
              >
                <div className="mb-5 sm:mb-6">
                  <div
                    className="
                      mb-4 flex h-11 w-11
                      items-center justify-center
                      rounded-2xl
                      bg-accent/10
                    "
                  >
                    <Compass
                      className="h-5 w-5 text-accent"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="font-display text-xl font-semibold text-navy sm:text-2xl">
                    Plan My Trip
                  </h3>

                  <p className="mt-1 text-sm text-navy/55">
                    Share your travel details and we'll
                    help you plan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePlanTrip}
                  className="
                    inline-flex w-full
                    items-center justify-center gap-2
                    rounded-full
                    bg-accent
                    px-6 py-3.5
                    font-semibold text-white
                    shadow-sm
                    transition-all
                    hover:-translate-y-0.5
                    hover:bg-accent-hover
                    hover:shadow-md
                  "
                >
                  Start Your Enquiry

                  <ArrowRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          TRAVELLER REVIEW CTA
      =================================================== */}

      <section className="border-b border-navy/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div
            className="
              flex flex-col gap-6
              rounded-3xl
              border border-navy/10
              bg-gradient-to-r
              from-[#fff8f0]
              via-white
              to-[#f7f9fc]
              p-6
              shadow-sm
              sm:p-8
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-accent sm:text-sm">
                Traveller experiences
              </p>

              <h2 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
                Share your travel experience
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-navy/60 sm:text-base">
                Share your experience with On a Trip Holidays
                and help future travellers plan their journey.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReview(true)}
              className="
                inline-flex shrink-0
                items-center justify-center gap-2
                rounded-full
                bg-navy
                px-5 py-3.5
                font-bold text-white
                shadow-sm
                transition-all
                hover:-translate-y-0.5
                hover:bg-primary-hover
                hover:shadow-md
              "
            >
              <MessageSquareHeart
                className="h-4 w-4"
                aria-hidden="true"
              />

              Your Valuable Review
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
          REVIEW MODAL
      =================================================== */}

      {showReview && (
        <ReviewFormModal
          open={showReview}
          onClose={() => setShowReview(false)}
          onSubmitted={() => setShowReview(false)}
        />
      )}

      {/* ===================================================
          FAQ
      =================================================== */}

      <FAQSection />

      {/* ===================================================
          FOOTER
      =================================================== */}

      <Footer />

      {/* ===================================================
          LOCAL ENQUIRY
      =================================================== */}

      {!onPlanTrip && localEnquiryOpen && (
        <EnquiryForm
          onClose={() => setLocalEnquiryOpen(false)}
        />
      )}
    </div>
  );
}






