


import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getMostVisited } from "../api/content";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";
import LoadMoreButton from "../components/LoadMoreButton";
import { RevealGroup } from "../components/Reveal";
import Seo from "../components/Seo";
import useLoadMore from "../hooks/useLoadMore";

/* =========================================================
   CONFIG
========================================================= */

// Cards shown first, and added on each "Load more" click
const PAGE_SIZE = 15;

/* =========================================================
   HELPERS
========================================================= */

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image?.url || image?.secure_url || "";
  }

  return "";
}

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Contact us";
  }

  const numericPrice = Number(value);

  if (Number.isNaN(numericPrice)) {
    return String(value);
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
}

/* =========================================================
   DESTINATION CARD
========================================================= */

function DestinationCard({ item }) {
  const placeName =
    item?.place_name?.trim() || "Destination";

  const slug = item?.slug?.trim() || "";

  const image = getImageUrl(item?.image);

  const description =
    item?.description?.trim() || "";

  const bestTime =
    item?.best_time_to_visit?.trim() || "";

  const packageCount = Array.isArray(item?.packages)
    ? item.packages.length
    : 0;

  /*
    A destination must have a slug because the public
    destination URL is:

      /destinations/:slug
  */
  if (!slug) {
    return null;
  }

  return (
    <Link
      to={`/destinations/${slug}`}
      className="
        group
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-4xl
        border
        border-divider
        bg-card
        shadow-travel-card
        transition-all
        duration-500
        hover:-translate-y-1
        hover:border-secondary-light
        hover:shadow-travel-hover
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-primary/30
        focus-visible:ring-offset-2
      "
    >
      {/* =================================================
          IMAGE
      ================================================== */}

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-strong">
        {image ? (
          <img
            src={image}
            alt={`${placeName} — popular travel destination`}
            loading="lazy"
            decoding="async"
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-700
              ease-soft
              group-hover:scale-105
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              bg-petal-gradient
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-white/80
                shadow-travel-card
              "
            >
              <MapPin
                className="h-7 w-7 text-primary"
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {/* Soft photo overlay */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-t
            from-ink-900/65
            via-ink-900/10
            to-transparent
          "
        />

        {/* Small destination badge */}
        <div
          className="
            absolute
            left-4
            top-4
            inline-flex
            items-center
            gap-1.5
            rounded-full
            border
            border-white/30
            bg-white/90
            px-3
            py-1.5
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.12em]
            text-primary
            shadow-sm
            backdrop-blur-sm
          "
        >
          <Sparkles
            className="h-3 w-3"
            aria-hidden="true"
          />

          Favourite
        </div>

        {/* Destination name */}
        <div
          className="
            absolute
            bottom-4
            left-4
            right-4
            flex
            items-center
            gap-2
            text-white
          "
        >
          <span
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/15
              backdrop-blur-md
            "
          >
            <MapPin
              className="h-4 w-4"
              aria-hidden="true"
            />
          </span>

          <span className="truncate text-sm font-semibold">
            {placeName}
          </span>
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================== */}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div>
          <h3
            className="
              font-display
              text-[1.7rem]
              font-semibold
              leading-tight
              text-text-dark
              transition-colors
              duration-300
              group-hover:text-primary
              sm:text-3xl
            "
          >
            Explore {placeName}
          </h3>

          {description && (
            <p
              className="
                mt-2.5
                line-clamp-3
                text-sm
                leading-6
                text-text-secondary
              "
            >
              {description}
            </p>
          )}
        </div>

        {/* Best time */}
        {bestTime && (
          <div
            className="
              mt-4
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              bg-surface-soft
              px-3
              py-1.5
              text-xs
              font-medium
              text-text-secondary
            "
          >
            <CalendarDays
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />

            <span>
              Best time: {bestTime}
            </span>
          </div>
        )}

        {/* =================================================
            PACKAGE INFORMATION
        ================================================== */}

        <div className="mt-auto pt-5">
          {packageCount > 0 && (
            <div
              className="
                mb-4
                flex
                items-center
                justify-between
                border-b
                border-divider
                pb-4
              "
            >
              <p className="text-xs font-medium text-muted">
                {packageCount}{" "}
                {packageCount === 1
                  ? "holiday package"
                  : "holiday packages"}{" "}
                available
              </p>

              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-accent-bright
                "
                aria-hidden="true"
              />
            </div>
          )}

          <div className="flex items-end justify-between gap-4">
            {/* Starting price */}
            <div>
              <p className="text-xs text-muted">
                Starting from
              </p>

              <p
                className="
                  mt-0.5
                  font-display
                  text-2xl
                  font-semibold
                  leading-none
                  text-primary
                  sm:text-3xl
                "
              >
                {formatPrice(item?.starting_from)}
              </p>
            </div>

            {/* CTA */}
            <span
              className="
                inline-flex
                shrink-0
                items-center
                gap-1.5
                rounded-full
                border
                border-primary/15
                bg-primary-lighter
                px-3
                py-2
                text-xs
                font-semibold
                text-primary
                transition-all
                duration-300
                group-hover:bg-primary
                group-hover:text-white
              "
            >
              View details

              <ArrowRight
                className="
                  h-3.5
                  w-3.5
                  transition-transform
                  duration-300
                  group-hover:translate-x-0.5
                "
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   SKELETON CARD
========================================================= */

function DestinationSkeleton() {
  return (
    <div
      className="
        overflow-hidden
        rounded-4xl
        border
        border-divider
        bg-card
        shadow-travel-card
      "
      aria-hidden="true"
    >
      <div className="aspect-[4/3] animate-pulse bg-surface-strong" />

      <div className="space-y-4 p-5 sm:p-6">
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-surface-strong" />

        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-surface-strong" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-surface-strong" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-surface-strong" />
        </div>

        <div className="h-7 w-32 animate-pulse rounded-full bg-surface-strong" />

        <div className="border-t border-divider pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 h-3 w-20 animate-pulse rounded bg-surface-strong" />
              <div className="h-7 w-24 animate-pulse rounded bg-surface-strong" />
            </div>

            <div className="h-9 w-24 animate-pulse rounded-full bg-surface-strong" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MOST VISITED PAGE
========================================================= */

export default function MostVisited() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPlaces = async () => {
      try {
        setLoading(true);

        const response = await getMostVisited();

        /*
          Support both:

            [...]
            { data: [...] }
            { items: [...] }
        */

        const data =
          response?.data ??
          response?.items ??
          response ??
          [];

        if (!mounted) return;

        const destinationList = Array.isArray(data)
          ? data
          : [];

        /*
          Only published destinations should normally
          arrive from the public backend.

          This additional frontend check protects the
          public page if status information is returned.
        */

        const publishedDestinations =
          destinationList.filter(
            (item) =>
              item?.status === undefined ||
              item?.status === "published"
          );

        /*
          Keep the admin-controlled display order.
        */

        publishedDestinations.sort(
          (a, b) =>
            Number(a?.display_order ?? 0) -
            Number(b?.display_order ?? 0)
        );

        setPlaces(publishedDestinations);
      } catch (error) {
        console.error(
          "Failed to load most visited destinations:",
          error
        );

        if (mounted) {
          setPlaces([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPlaces();

    return () => {
      mounted = false;
    };
  }, []);

  /*
    Show the first PAGE_SIZE cards, then reveal more
    on each "Load more" click.
  */
  const { visible, remaining, loadMore } = useLoadMore(
    places,
    { pageSize: PAGE_SIZE }
  );

  return (
    <>
      {/* =================================================
          SEO
      ================================================== */}

      <Seo
        title="Most Visited Destinations"
        description="Explore the most visited destinations with Manyara Prive Vacations. Discover traveller-favourite places, thoughtfully curated holiday experiences, and destinations for your next journey."
        path="/most-visited"
        image="/og-default.jpg"
        imageAlt="Most Visited Destinations — Manyara Prive Vacations"
        type="website"
      />

      <main className="min-h-screen bg-background">
        {/* =================================================
            HERO
        ================================================== */}

        <section
          className="
            relative
            overflow-hidden
            border-b
            border-divider
            bg-petal-gradient
          "
        >
          {/* Decorative background shape */}
          <div
            className="
              pointer-events-none
              absolute
              -right-24
              -top-28
              h-72
              w-72
              rounded-full
              bg-secondary-lighter
              opacity-70
              blur-3xl
            "
            aria-hidden="true"
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-28
              -left-20
              h-64
              w-64
              rounded-full
              bg-primary-lighter
              opacity-60
              blur-3xl
            "
            aria-hidden="true"
          />

          <div
            className="
              relative
              mx-auto
              max-w-6xl
              px-4
              py-8
              sm:px-6
              sm:py-11
              lg:px-8
              lg:py-16
            "
          >
            {/* Back */}
            <Link
              to="/"
              className="
                group
                mb-7
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-divider
                bg-white/80
                px-3.5
                py-2
                text-sm
                font-medium
                text-text-secondary
                shadow-sm
                backdrop-blur-sm
                transition-all
                duration-300
                hover:border-primary/20
                hover:bg-white
                hover:text-primary
              "
            >
              <ArrowLeft
                className="
                  h-4
                  w-4
                  transition-transform
                  duration-300
                  group-hover:-translate-x-0.5
                "
                aria-hidden="true"
              />

              Back to Home
            </Link>

            <div className="max-w-3xl">
              {/* Eyebrow */}
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-primary/15
                  bg-white/75
                  px-3.5
                  py-2
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-primary
                  shadow-sm
                  backdrop-blur-sm
                "
              >
                <MapPin
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />

                Traveller favourites
              </div>

              {/* Heading */}
              <h1
                className="
                  mt-5
                  max-w-3xl
                  font-display
                  text-4xl
                  font-semibold
                  leading-[0.98]
                  tracking-tight
                  text-text-display
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                Places travellers
                <span className="text-primary">
                  {" "}love to explore.
                </span>
              </h1>

              {/* Description */}
              <p
                className="
                  mt-5
                  max-w-2xl
                  text-sm
                  leading-7
                  text-text-secondary
                  sm:text-base
                "
              >
                Discover our most visited destinations,
                find the perfect season to travel, and
                explore thoughtfully curated holiday
                experiences for your next journey.
              </p>

              {/* Small trust row */}
              <div
                className="
                  mt-7
                  flex
                  flex-wrap
                  items-center
                  gap-x-5
                  gap-y-3
                  text-xs
                  font-medium
                  text-muted
                "
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-primary
                    "
                  />
                  Curated destinations
                </span>

                <span className="hidden h-3 w-px bg-divider sm:block" />

                <span className="inline-flex items-center gap-2">
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-accent-bright
                    "
                  />
                  Traveller favourites
                </span>

                <span className="hidden h-3 w-px bg-divider sm:block" />

                <span className="inline-flex items-center gap-2">
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-secondary
                    "
                  />
                  Holiday packages
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            DESTINATIONS SECTION
        ================================================== */}

        <section
          className="
            relative
            mx-auto
            max-w-6xl
            px-4
            py-10
            sm:px-6
            sm:py-12
            lg:px-8
            lg:py-16
          "
        >
          {/* Section header */}
          <div
            className="
              mb-7
              flex
              flex-col
              gap-4
              sm:mb-9
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <div
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-primary
                "
              >
                <span
                  className="
                    h-px
                    w-7
                    bg-primary
                  "
                  aria-hidden="true"
                />

                Popular places
              </div>

              <h2
                className="
                  font-display
                  text-3xl
                  font-semibold
                  leading-tight
                  text-text-dark
                  sm:text-4xl
                "
              >
                Pick your next destination
              </h2>

              <p
                className="
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-text-secondary
                "
              >
                From peaceful escapes to unforgettable
                adventures, start with a destination our
                travellers already love.
              </p>
            </div>

            {!loading && places.length > 0 && (
              <div
                className="
                  inline-flex
                  w-fit
                  items-center
                  gap-2
                  rounded-full
                  bg-surface-soft
                  px-3.5
                  py-2
                  text-xs
                  font-semibold
                  text-primary
                "
              >
                <MapPin
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />

                {places.length}{" "}
                {places.length === 1
                  ? "destination"
                  : "destinations"}
              </div>
            )}
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {loading ? (
            <div
              className="
                grid
                grid-cols-1
                gap-5
                sm:grid-cols-2
                sm:gap-6
                lg:grid-cols-3
              "
            >
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <DestinationSkeleton key={item} />
              ))}
            </div>
          ) : places.length === 0 ? (
            /* =================================================
               EMPTY STATE
            ================================================== */

            <div
              className="
                relative
                overflow-hidden
                rounded-4xl
                border
                border-divider
                bg-petal-gradient
                px-6
                py-14
                text-center
                shadow-travel-card
                sm:px-10
                sm:py-16
              "
            >
              {/* Decorative circles */}
              <div
                className="
                  pointer-events-none
                  absolute
                  -left-16
                  -top-16
                  h-40
                  w-40
                  rounded-full
                  bg-white/60
                  blur-2xl
                "
                aria-hidden="true"
              />

              <div
                className="
                  pointer-events-none
                  absolute
                  -bottom-20
                  -right-10
                  h-48
                  w-48
                  rounded-full
                  bg-secondary-lighter
                  opacity-60
                  blur-3xl
                "
                aria-hidden="true"
              />

              <div className="relative">
                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    text-primary
                    shadow-travel-card
                  "
                >
                  <MapPin
                    className="h-7 w-7"
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className="
                    mt-5
                    font-display
                    text-3xl
                    font-semibold
                    text-text-dark
                  "
                >
                  No destinations published yet
                </h3>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-md
                    text-sm
                    leading-6
                    text-text-secondary
                  "
                >
                  Our favourite destinations will appear
                  here once they are added and published by
                  our team.
                </p>

                <Link
                  to="/packages"
                  className="
                    mt-7
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-primary
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-brand
                    transition-all
                    duration-300
                    hover:bg-primary-hover
                    hover:shadow-orange
                  "
                >
                  Explore Packages

                  <ArrowRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          ) : (
            /* =================================================
               DESTINATION CARDS + LOAD MORE
            ================================================== */

            <>
              <RevealGroup
                className="
                  grid
                  grid-cols-1
                  gap-5
                  sm:grid-cols-2
                  sm:gap-6
                  lg:grid-cols-3
                "
              >
                {visible.map((place) => (
                  <DestinationCard
                    key={
                      place?.id ??
                      place?.slug
                    }
                    item={place}
                  />
                ))}
              </RevealGroup>

              <LoadMoreButton
                shown={visible.length}
                total={places.length}
                remaining={remaining}
                pageSize={PAGE_SIZE}
                onClick={loadMore}
              />
            </>
          )}
        </section>

        {/* =================================================
            SMALL CLOSING BRAND BAND
        ================================================== */}

        {!loading && places.length > 0 && (
          <section className="px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
            <div
              className="
                mx-auto
                max-w-6xl
                overflow-hidden
                rounded-4xl
                border
                border-primary/10
                bg-brand-gradient
                px-6
                py-8
                sm:px-10
                sm:py-10
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-5
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-[0.14em]
                      text-primary
                    "
                  >
                    Your next escape
                  </p>

                  <h3
                    className="
                      mt-1
                      font-display
                      text-2xl
                      font-semibold
                      text-text-dark
                      sm:text-3xl
                    "
                  >
                    Ready to discover somewhere new?
                  </h3>
                </div>

                <Link
                  to="/packages"
                  className="
                    group
                    inline-flex
                    w-fit
                    shrink-0
                    items-center
                    gap-2
                    rounded-full
                    bg-primary
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-brand
                    transition-all
                    duration-300
                    hover:bg-primary-hover
                  "
                >
                  Explore all packages

                  <ArrowRight
                    className="
                      h-4
                      w-4
                      transition-transform
                      duration-300
                      group-hover:translate-x-0.5
                    "
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =====================================================
          FAQ
      ===================================================== */}

      <FAQSection category="most_visited" />

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </>
  );
}












































// import useloadMore from "../hooks/useLoadMore";
// import LoadMoreButton from "../components/LoadMoreButton";
// import { useEffect, useState } from "react";
// import {
//   ArrowLeft,
//   ArrowRight,
//   CalendarDays,
//   MapPin,
//   Sparkles,
// } from "lucide-react";
// import { Link } from "react-router-dom";
// import { getMostVisited } from "../api/content";
// import Footer from "../components/Footer";
// import FAQSection from "../components/FAQSection";
// import { RevealGroup } from "../components/Reveal";
// import Seo from "../components/Seo";

// /* =========================================================
//    HELPERS
// ========================================================= */

// const PAGE_SIZE = 15;

// function getImageUrl(image) {
//   if (!image) return "";

//   if (typeof image === "string") {
//     return image;
//   }

//   if (typeof image === "object") {
//     return image?.url || image?.secure_url || "";
//   }

//   return "";
// }

// function formatPrice(value) {
//   if (
//     value === null ||
//     value === undefined ||
//     value === ""
//   ) {
//     return "Contact us";
//   }

//   const numericPrice = Number(value);

//   if (Number.isNaN(numericPrice)) {
//     return String(value);
//   }

//   return `₹${numericPrice.toLocaleString("en-IN")}`;
// }

// /* =========================================================
//    DESTINATION CARD
// ========================================================= */

// function DestinationCard({ item }) {
//   const placeName =
//     item?.place_name?.trim() || "Destination";

//   const slug = item?.slug?.trim() || "";

//   const image = getImageUrl(item?.image);

//   const description =
//     item?.description?.trim() || "";

//   const bestTime =
//     item?.best_time_to_visit?.trim() || "";

//   const packageCount = Array.isArray(item?.packages)
//     ? item.packages.length
//     : 0;

//   /*
//     A destination must have a slug because the public
//     destination URL is:

//       /destinations/:slug
//   */
//   if (!slug) {
//     return null;
//   }

//   return (
//     <Link
//       to={`/destinations/${slug}`}
//       className="
//         group
//         flex
//         h-full
//         flex-col
//         overflow-hidden
//         rounded-4xl
//         border
//         border-divider
//         bg-card
//         shadow-travel-card
//         transition-all
//         duration-500
//         hover:-translate-y-1
//         hover:border-secondary-light
//         hover:shadow-travel-hover
//         focus:outline-none
//         focus-visible:ring-2
//         focus-visible:ring-primary/30
//         focus-visible:ring-offset-2
//       "
//     >
//       {/* =================================================
//           IMAGE
//       ================================================== */}

//       <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-strong">
//         {image ? (
//           <img
//             src={image}
//             alt={`${placeName} — popular travel destination`}
//             loading="lazy"
//             decoding="async"
//             className="
//               h-full
//               w-full
//               object-cover
//               transition-transform
//               duration-700
//               ease-soft
//               group-hover:scale-105
//             "
//           />
//         ) : (
//           <div
//             className="
//               flex
//               h-full
//               w-full
//               items-center
//               justify-center
//               bg-petal-gradient
//             "
//           >
//             <div
//               className="
//                 flex
//                 h-16
//                 w-16
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-white/80
//                 shadow-travel-card
//               "
//             >
//               <MapPin
//                 className="h-7 w-7 text-primary"
//                 aria-hidden="true"
//               />
//             </div>
//           </div>
//         )}

//         {/* Soft photo overlay */}
//         <div
//           className="
//             pointer-events-none
//             absolute
//             inset-0
//             bg-gradient-to-t
//             from-ink-900/65
//             via-ink-900/10
//             to-transparent
//           "
//         />

//         {/* Small destination badge */}
//         <div
//           className="
//             absolute
//             left-4
//             top-4
//             inline-flex
//             items-center
//             gap-1.5
//             rounded-full
//             border
//             border-white/30
//             bg-white/90
//             px-3
//             py-1.5
//             text-[11px]
//             font-semibold
//             uppercase
//             tracking-[0.12em]
//             text-primary
//             shadow-sm
//             backdrop-blur-sm
//           "
//         >
//           <Sparkles
//             className="h-3 w-3"
//             aria-hidden="true"
//           />

//           Favourite
//         </div>

//         {/* Destination name */}
//         <div
//           className="
//             absolute
//             bottom-4
//             left-4
//             right-4
//             flex
//             items-center
//             gap-2
//             text-white
//           "
//         >
//           <span
//             className="
//               flex
//               h-8
//               w-8
//               shrink-0
//               items-center
//               justify-center
//               rounded-full
//               bg-white/15
//               backdrop-blur-md
//             "
//           >
//             <MapPin
//               className="h-4 w-4"
//               aria-hidden="true"
//             />
//           </span>

//           <span className="truncate text-sm font-semibold">
//             {placeName}
//           </span>
//         </div>
//       </div>

//       {/* =================================================
//           CONTENT
//       ================================================== */}

//       <div className="flex flex-1 flex-col p-5 sm:p-6">
//         <div>
//           <h3
//             className="
//               font-display
//               text-[1.7rem]
//               font-semibold
//               leading-tight
//               text-text-dark
//               transition-colors
//               duration-300
//               group-hover:text-primary
//               sm:text-3xl
//             "
//           >
//             Explore {placeName}
//           </h3>

//           {description && (
//             <p
//               className="
//                 mt-2.5
//                 line-clamp-3
//                 text-sm
//                 leading-6
//                 text-text-secondary
//               "
//             >
//               {description}
//             </p>
//           )}
//         </div>

//         {/* Best time */}
//         {bestTime && (
//           <div
//             className="
//               mt-4
//               inline-flex
//               w-fit
//               items-center
//               gap-2
//               rounded-full
//               bg-surface-soft
//               px-3
//               py-1.5
//               text-xs
//               font-medium
//               text-text-secondary
//             "
//           >
//             <CalendarDays
//               className="h-3.5 w-3.5 text-primary"
//               aria-hidden="true"
//             />

//             <span>
//               Best time: {bestTime}
//             </span>
//           </div>
//         )}

//         {/* =================================================
//             PACKAGE INFORMATION
//         ================================================== */}

//         <div className="mt-auto pt-5">
//           {packageCount > 0 && (
//             <div
//               className="
//                 mb-4
//                 flex
//                 items-center
//                 justify-between
//                 border-b
//                 border-divider
//                 pb-4
//               "
//             >
//               <p className="text-xs font-medium text-muted">
//                 {packageCount}{" "}
//                 {packageCount === 1
//                   ? "holiday package"
//                   : "holiday packages"}{" "}
//                 available
//               </p>

//               <span
//                 className="
//                   h-1.5
//                   w-1.5
//                   rounded-full
//                   bg-accent-bright
//                 "
//                 aria-hidden="true"
//               />
//             </div>
//           )}

//           <div className="flex items-end justify-between gap-4">
//             {/* Starting price */}
//             <div>
//               <p className="text-xs text-muted">
//                 Starting from
//               </p>

//               <p
//                 className="
//                   mt-0.5
//                   font-display
//                   text-2xl
//                   font-semibold
//                   leading-none
//                   text-primary
//                   sm:text-3xl
//                 "
//               >
//                 {formatPrice(item?.starting_from)}
//               </p>
//             </div>

//             {/* CTA */}
//             <span
//               className="
//                 inline-flex
//                 shrink-0
//                 items-center
//                 gap-1.5
//                 rounded-full
//                 border
//                 border-primary/15
//                 bg-primary-lighter
//                 px-3
//                 py-2
//                 text-xs
//                 font-semibold
//                 text-primary
//                 transition-all
//                 duration-300
//                 group-hover:bg-primary
//                 group-hover:text-white
//               "
//             >
//               View details

//               <ArrowRight
//                 className="
//                   h-3.5
//                   w-3.5
//                   transition-transform
//                   duration-300
//                   group-hover:translate-x-0.5
//                 "
//                 aria-hidden="true"
//               />
//             </span>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// }

// /* =========================================================
//    SKELETON CARD
// ========================================================= */

// function DestinationSkeleton() {
//   return (
//     <div
//       className="
//         overflow-hidden
//         rounded-4xl
//         border
//         border-divider
//         bg-card
//         shadow-travel-card
//       "
//       aria-hidden="true"
//     >
//       <div className="aspect-[4/3] animate-pulse bg-surface-strong" />

//       <div className="space-y-4 p-5 sm:p-6">
//         <div className="h-7 w-3/4 animate-pulse rounded-lg bg-surface-strong" />

//         <div className="space-y-2">
//           <div className="h-3 w-full animate-pulse rounded bg-surface-strong" />
//           <div className="h-3 w-5/6 animate-pulse rounded bg-surface-strong" />
//           <div className="h-3 w-2/3 animate-pulse rounded bg-surface-strong" />
//         </div>

//         <div className="h-7 w-32 animate-pulse rounded-full bg-surface-strong" />

//         <div className="border-t border-divider pt-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="mb-2 h-3 w-20 animate-pulse rounded bg-surface-strong" />
//               <div className="h-7 w-24 animate-pulse rounded bg-surface-strong" />
//             </div>

//             <div className="h-9 w-24 animate-pulse rounded-full bg-surface-strong" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    MOST VISITED PAGE
// ========================================================= */

// export default function MostVisited() {
//   const [places, setPlaces] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let mounted = true;

//     const loadPlaces = async () => {
//       try {
//         setLoading(true);

//         const response = await getMostVisited();

//         /*
//           Support both:

//             [...]
//             { data: [...] }
//             { items: [...] }
//         */

//         const data =
//           response?.data ??
//           response?.items ??
//           response ??
//           [];

//         if (!mounted) return;

//         const destinationList = Array.isArray(data)
//           ? data
//           : [];

//         /*
//           Only published destinations should normally
//           arrive from the public backend.

//           This additional frontend check protects the
//           public page if status information is returned.
//         */

//         const publishedDestinations =
//           destinationList.filter(
//             (item) =>
//               item?.status === undefined ||
//               item?.status === "published"
//           );

//         /*
//           Keep the admin-controlled display order.
//         */

//         publishedDestinations.sort(
//           (a, b) =>
//             Number(a?.display_order ?? 0) -
//             Number(b?.display_order ?? 0)
//         );

//         setPlaces(publishedDestinations);
//       } catch (error) {
//         console.error(
//           "Failed to load most visited destinations:",
//           error
//         );

//         if (mounted) {
//           setPlaces([]);
//         }
//       } finally {
//         if (mounted) {
//           setLoading(false);
//         }
//       }
//     };

//     loadPlaces();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   return (
//     <>
//       {/* =================================================
//           SEO
//       ================================================== */}

//       <Seo
//         title="Most Visited Destinations"
//         description="Explore the most visited destinations with Manyara Prive Vacations. Discover traveller-favourite places, thoughtfully curated holiday experiences, and destinations for your next journey."
//         path="/most-visited"
//         image="/og-default.jpg"
//         imageAlt="Most Visited Destinations — Manyara Prive Vacations"
//         type="website"
//       />

//       <main className="min-h-screen bg-background">
//         {/* =================================================
//             HERO
//         ================================================== */}

//         <section
//           className="
//             relative
//             overflow-hidden
//             border-b
//             border-divider
//             bg-petal-gradient
//           "
//         >
//           {/* Decorative background shape */}
//           <div
//             className="
//               pointer-events-none
//               absolute
//               -right-24
//               -top-28
//               h-72
//               w-72
//               rounded-full
//               bg-secondary-lighter
//               opacity-70
//               blur-3xl
//             "
//             aria-hidden="true"
//           />

//           <div
//             className="
//               pointer-events-none
//               absolute
//               -bottom-28
//               -left-20
//               h-64
//               w-64
//               rounded-full
//               bg-primary-lighter
//               opacity-60
//               blur-3xl
//             "
//             aria-hidden="true"
//           />

//           <div
//             className="
//               relative
//               mx-auto
//               max-w-6xl
//               px-4
//               py-8
//               sm:px-6
//               sm:py-11
//               lg:px-8
//               lg:py-16
//             "
//           >
//             {/* Back */}
//             <Link
//               to="/"
//               className="
//                 group
//                 mb-7
//                 inline-flex
//                 items-center
//                 gap-2
//                 rounded-full
//                 border
//                 border-divider
//                 bg-white/80
//                 px-3.5
//                 py-2
//                 text-sm
//                 font-medium
//                 text-text-secondary
//                 shadow-sm
//                 backdrop-blur-sm
//                 transition-all
//                 duration-300
//                 hover:border-primary/20
//                 hover:bg-white
//                 hover:text-primary
//               "
//             >
//               <ArrowLeft
//                 className="
//                   h-4
//                   w-4
//                   transition-transform
//                   duration-300
//                   group-hover:-translate-x-0.5
//                 "
//                 aria-hidden="true"
//               />

//               Back to Home
//             </Link>

//             <div className="max-w-3xl">
//               {/* Eyebrow */}
//               <div
//                 className="
//                   inline-flex
//                   items-center
//                   gap-2
//                   rounded-full
//                   border
//                   border-primary/15
//                   bg-white/75
//                   px-3.5
//                   py-2
//                   text-[11px]
//                   font-semibold
//                   uppercase
//                   tracking-[0.16em]
//                   text-primary
//                   shadow-sm
//                   backdrop-blur-sm
//                 "
//               >
//                 <MapPin
//                   className="h-3.5 w-3.5"
//                   aria-hidden="true"
//                 />

//                 Traveller favourites
//               </div>

//               {/* Heading */}
//               <h1
//                 className="
//                   mt-5
//                   max-w-3xl
//                   font-display
//                   text-4xl
//                   font-semibold
//                   leading-[0.98]
//                   tracking-tight
//                   text-text-display
//                   sm:text-5xl
//                   lg:text-6xl
//                 "
//               >
//                 Places travellers
//                 <span className="text-primary">
//                   {" "}love to explore.
//                 </span>
//               </h1>

//               {/* Description */}
//               <p
//                 className="
//                   mt-5
//                   max-w-2xl
//                   text-sm
//                   leading-7
//                   text-text-secondary
//                   sm:text-base
//                 "
//               >
//                 Discover our most visited destinations,
//                 find the perfect season to travel, and
//                 explore thoughtfully curated holiday
//                 experiences for your next journey.
//               </p>

//               {/* Small trust row */}
//               <div
//                 className="
//                   mt-7
//                   flex
//                   flex-wrap
//                   items-center
//                   gap-x-5
//                   gap-y-3
//                   text-xs
//                   font-medium
//                   text-muted
//                 "
//               >
//                 <span className="inline-flex items-center gap-2">
//                   <span
//                     className="
//                       h-1.5
//                       w-1.5
//                       rounded-full
//                       bg-primary
//                     "
//                   />
//                   Curated destinations
//                 </span>

//                 <span className="hidden h-3 w-px bg-divider sm:block" />

//                 <span className="inline-flex items-center gap-2">
//                   <span
//                     className="
//                       h-1.5
//                       w-1.5
//                       rounded-full
//                       bg-accent-bright
//                     "
//                   />
//                   Traveller favourites
//                 </span>

//                 <span className="hidden h-3 w-px bg-divider sm:block" />

//                 <span className="inline-flex items-center gap-2">
//                   <span
//                     className="
//                       h-1.5
//                       w-1.5
//                       rounded-full
//                       bg-secondary
//                     "
//                   />
//                   Holiday packages
//                 </span>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* =================================================
//             DESTINATIONS SECTION
//         ================================================== */}

//         <section
//           className="
//             relative
//             mx-auto
//             max-w-6xl
//             px-4
//             py-10
//             sm:px-6
//             sm:py-12
//             lg:px-8
//             lg:py-16
//           "
//         >
//           {/* Section header */}
//           <div
//             className="
//               mb-7
//               flex
//               flex-col
//               gap-4
//               sm:mb-9
//               sm:flex-row
//               sm:items-end
//               sm:justify-between
//             "
//           >
//             <div>
//               <div
//                 className="
//                   mb-2
//                   flex
//                   items-center
//                   gap-2
//                   text-xs
//                   font-semibold
//                   uppercase
//                   tracking-[0.14em]
//                   text-primary
//                 "
//               >
//                 <span
//                   className="
//                     h-px
//                     w-7
//                     bg-primary
//                   "
//                   aria-hidden="true"
//                 />

//                 Popular places
//               </div>

//               <h2
//                 className="
//                   font-display
//                   text-3xl
//                   font-semibold
//                   leading-tight
//                   text-text-dark
//                   sm:text-4xl
//                 "
//               >
//                 Pick your next destination
//               </h2>

//               <p
//                 className="
//                   mt-2
//                   max-w-xl
//                   text-sm
//                   leading-6
//                   text-text-secondary
//                 "
//               >
//                 From peaceful escapes to unforgettable
//                 adventures, start with a destination our
//                 travellers already love.
//               </p>
//             </div>

//             {!loading && places.length > 0 && (
//               <div
//                 className="
//                   inline-flex
//                   w-fit
//                   items-center
//                   gap-2
//                   rounded-full
//                   bg-surface-soft
//                   px-3.5
//                   py-2
//                   text-xs
//                   font-semibold
//                   text-primary
//                 "
//               >
//                 <MapPin
//                   className="h-3.5 w-3.5"
//                   aria-hidden="true"
//                 />

//                 {places.length}{" "}
//                 {places.length === 1
//                   ? "destination"
//                   : "destinations"}
//               </div>
//             )}
//           </div>

//           {/* =================================================
//               LOADING
//           ================================================== */}

//           {loading ? (
//             <div
//               className="
//                 grid
//                 grid-cols-1
//                 gap-5
//                 sm:grid-cols-2
//                 sm:gap-6
//                 lg:grid-cols-3
//               "
//             >
//               {[1, 2, 3, 4, 5, 6].map((item) => (
//                 <DestinationSkeleton key={item} />
//               ))}
//             </div>
//           ) : places.length === 0 ? (
//             /* =================================================
//                EMPTY STATE
//             ================================================== */

//             <div
//               className="
//                 relative
//                 overflow-hidden
//                 rounded-4xl
//                 border
//                 border-divider
//                 bg-petal-gradient
//                 px-6
//                 py-14
//                 text-center
//                 shadow-travel-card
//                 sm:px-10
//                 sm:py-16
//               "
//             >
//               {/* Decorative circles */}
//               <div
//                 className="
//                   pointer-events-none
//                   absolute
//                   -left-16
//                   -top-16
//                   h-40
//                   w-40
//                   rounded-full
//                   bg-white/60
//                   blur-2xl
//                 "
//                 aria-hidden="true"
//               />

//               <div
//                 className="
//                   pointer-events-none
//                   absolute
//                   -bottom-20
//                   -right-10
//                   h-48
//                   w-48
//                   rounded-full
//                   bg-secondary-lighter
//                   opacity-60
//                   blur-3xl
//                 "
//                 aria-hidden="true"
//               />

//               <div className="relative">
//                 <div
//                   className="
//                     mx-auto
//                     flex
//                     h-16
//                     w-16
//                     items-center
//                     justify-center
//                     rounded-full
//                     bg-white
//                     text-primary
//                     shadow-travel-card
//                   "
//                 >
//                   <MapPin
//                     className="h-7 w-7"
//                     aria-hidden="true"
//                   />
//                 </div>

//                 <h3
//                   className="
//                     mt-5
//                     font-display
//                     text-3xl
//                     font-semibold
//                     text-text-dark
//                   "
//                 >
//                   No destinations published yet
//                 </h3>

//                 <p
//                   className="
//                     mx-auto
//                     mt-2
//                     max-w-md
//                     text-sm
//                     leading-6
//                     text-text-secondary
//                   "
//                 >
//                   Our favourite destinations will appear
//                   here once they are added and published by
//                   our team.
//                 </p>

//                 <Link
//                   to="/packages"
//                   className="
//                     mt-7
//                     inline-flex
//                     items-center
//                     gap-2
//                     rounded-full
//                     bg-primary
//                     px-5
//                     py-3
//                     text-sm
//                     font-semibold
//                     text-white
//                     shadow-brand
//                     transition-all
//                     duration-300
//                     hover:bg-primary-hover
//                     hover:shadow-orange
//                   "
//                 >
//                   Explore Packages

//                   <ArrowRight
//                     className="h-4 w-4"
//                     aria-hidden="true"
//                   />
//                 </Link>
//               </div>
//             </div>
//           ) : (
//             /* =================================================
//                DESTINATION CARDS
//             ================================================== */

//             <RevealGroup
//               className="
//                 grid
//                 grid-cols-1
//                 gap-5
//                 sm:grid-cols-2
//                 sm:gap-6
//                 lg:grid-cols-3
//               "
//             >
//               {places.map((place) => (
//                 <DestinationCard
//                   key={
//                     place?.id ??
//                     place?.slug
//                   }
//                   item={place}
//                 />
//               ))}
//             </RevealGroup>
//           )}
//         </section>

//         {/* =================================================
//             SMALL CLOSING BRAND BAND
//         ================================================== */}

//         {!loading && places.length > 0 && (
//           <section className="px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
//             <div
//               className="
//                 mx-auto
//                 max-w-6xl
//                 overflow-hidden
//                 rounded-4xl
//                 border
//                 border-primary/10
//                 bg-brand-gradient
//                 px-6
//                 py-8
//                 sm:px-10
//                 sm:py-10
//               "
//             >
//               <div
//                 className="
//                   flex
//                   flex-col
//                   gap-5
//                   sm:flex-row
//                   sm:items-center
//                   sm:justify-between
//                 "
//               >
//                 <div>
//                   <p
//                     className="
//                       text-xs
//                       font-semibold
//                       uppercase
//                       tracking-[0.14em]
//                       text-primary
//                     "
//                   >
//                     Your next escape
//                   </p>

//                   <h3
//                     className="
//                       mt-1
//                       font-display
//                       text-2xl
//                       font-semibold
//                       text-text-dark
//                       sm:text-3xl
//                     "
//                   >
//                     Ready to discover somewhere new?
//                   </h3>
//                 </div>

//                 <Link
//                   to="/packages"
//                   className="
//                     inline-flex
//                     w-fit
//                     shrink-0
//                     items-center
//                     gap-2
//                     rounded-full
//                     bg-primary
//                     px-5
//                     py-3
//                     text-sm
//                     font-semibold
//                     text-white
//                     shadow-brand
//                     transition-all
//                     duration-300
//                     hover:bg-primary-hover
//                   "
//                 >
//                   Explore all packages

//                   <ArrowRight
//                     className="
//                       h-4
//                       w-4
//                       transition-transform
//                       duration-300
//                       group-hover:translate-x-0.5
//                     "
//                     aria-hidden="true"
//                   />
//                 </Link>
//               </div>
//             </div>
//           </section>
//         )}
//       </main>

//       {/* =====================================================
//           FAQ
//       ===================================================== */}

//       <FAQSection category="most_visited" />

//       {/* =====================================================
//           FOOTER
//       ===================================================== */}

//       <Footer />
//     </>
//   );
// }






