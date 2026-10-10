

import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import { getAbout } from "../api/content";
import { useQuery } from "../hooks/useQuery";

/* =========================================================
   HELPERS
========================================================= */

const SKELETON_ITEMS = [1, 2, 3, 4];

/* Last word of the title is italicised (3–10 words only). */
function renderTitle(text) {
  const words = String(text).trim().split(/\s+/);

  if (words.length < 3 || words.length > 10) return text;

  const last = words.pop();

  return (
    <>
      {words.join(" ")}{" "}
      <em className="font-normal italic text-primary">{last}</em>
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = memo(function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="group rounded-2xl border border-champagne/60 bg-card p-4 shadow-travel-card transition-all duration-300 hover:-translate-y-1 hover:border-champagne hover:shadow-travel-hover sm:p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-champagne/70 bg-surface-soft text-primary transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </div>

      <p className="font-display text-[2.1rem] font-semibold leading-none text-text-display sm:text-[2.5rem]">
        {value}
      </p>

      <p className="mt-2 text-[11px] font-medium uppercase leading-4 tracking-[0.16em] text-muted">
        {label}
      </p>
    </div>
  );
});

/* =========================================================
   SKELETONS
========================================================= */

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden="true">
      {SKELETON_ITEMS.map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-champagne/40 bg-card p-4 sm:p-5"
        >
          <div className="mb-3 h-10 w-10 rounded-full bg-surface-strong" />
          <div className="h-9 w-20 rounded bg-surface-strong" />
          <div className="mt-2 h-3 w-24 rounded bg-surface-strong" />
        </div>
      ))}
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-10 w-4/5 rounded bg-surface-strong sm:h-12" />
      <div className="mt-2 h-10 w-3/5 rounded bg-surface-strong sm:h-12" />

      <div className="mt-5 space-y-2.5">
        <div className="h-4 w-full rounded bg-surface-strong" />
        <div className="h-4 w-full rounded bg-surface-strong" />
        <div className="h-4 w-2/3 rounded bg-surface-strong" />
      </div>
    </div>
  );
}

/* =========================================================
   MAIN SECTION
========================================================= */

export default function AboutSection() {
  /* Shared cached query: cached About data is available
     immediately and updates when fresh data arrives. */
  const { data: aboutData, loading, error } = useQuery(getAbout);

  /* -------------------------------------------------------
     NORMALIZE BACKEND RESPONSE
  ------------------------------------------------------- */

  const about = aboutData?.about || null;

  const leadershipCount = useMemo(
    () =>
      Array.isArray(aboutData?.leadership)
        ? aboutData.leadership.filter(
            (person) => person?.is_active !== false,
          ).length
        : 0,
    [aboutData?.leadership],
  );

  const teamCount = useMemo(
    () =>
      Array.isArray(aboutData?.team)
        ? aboutData.team.filter(
            (member) =>
              member?.is_active !== false &&
              member?.show_public_profile !== false,
          ).length
        : 0,
    [aboutData?.team],
  );

  /* -------------------------------------------------------
     DYNAMIC CONTENT
  ------------------------------------------------------- */

  const companyName = about?.company_name || "Manyara Prive Vacations";

  const title =
    about?.story_title || about?.hero_title || "Travel planned with care.";

  const description =
    about?.story_content ||
    about?.hero_description ||
    "We create thoughtfully planned travel experiences designed around the people, places and moments that matter.";

  /* -------------------------------------------------------
     DYNAMIC STATS — only statistics that actually exist.
  ------------------------------------------------------- */

  const stats = useMemo(() => {
    const items = [];

    if (about?.founded_year) {
      items.push({
        icon: CalendarDays,
        value: about.founded_year,
        label: "Year founded",
      });
    }

    if (Number(about?.years_experience) > 0) {
      items.push({
        icon: Compass,
        value: `${about.years_experience}+`,
        label: "Years of experience",
      });
    }

    return items;
  }, [
    about?.founded_year,
    about?.years_experience,
    teamCount,
    leadershipCount,
  ]);

  /* -------------------------------------------------------
     ERROR — no cached data and the request failed.
  ------------------------------------------------------- */

  if (!loading && error && !aboutData) {
    console.error("Failed to load About section:", error);
    return null;
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section
      id="about"
      aria-labelledby="home-about-title"
      aria-busy={loading}
      className="relative w-full overflow-x-clip bg-gradient-to-b from-background to-surface-soft py-12 antialiased [contain-intrinsic-size:auto_480px] [content-visibility:auto] sm:py-14 lg:py-16"
    >
      {/* Top hairline */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-10 lg:gap-14 lg:px-8">
        {/* ===================================================
            CONTENT
        =================================================== */}

        <div>
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span
              className="h-px w-8 shrink-0 bg-champagne"
              aria-hidden="true"
            />

            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
              Who we are
            </p>
          </div>

          {loading ? (
            <div className="mt-4">
              <ContentSkeleton />
            </div>
          ) : (
            <>
              {/* Heading */}
              <h2
                id="home-about-title"
                className="mt-3 font-display text-[2.4rem] font-medium leading-[1.05] tracking-[-0.01em] text-text-display [text-wrap:balance] sm:text-[3rem] lg:text-[3.5rem]"
              >
                {renderTitle(title)}
              </h2>

              {/* Description */}
              <p className="mt-4 max-w-xl whitespace-pre-line text-[15px] leading-relaxed text-text-secondary sm:text-base sm:leading-7">
                {description}
              </p>
            </>
          )}

          {/* Learn more */}
          <Link
            to="/about"
            className="group mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-champagne/70 bg-white px-5 text-sm font-semibold tracking-wide text-text-dark transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white hover:shadow-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Learn more about us
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* ===================================================
            DYNAMIC STATS
        =================================================== */}

        {loading ? (
          <StatsSkeleton />
        ) : stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-champagne/60 bg-card p-5 shadow-travel-card">
            <p className="text-sm leading-relaxed text-muted">
              Learn more about {companyName} and our thoughtfully planned
              travel experiences.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}