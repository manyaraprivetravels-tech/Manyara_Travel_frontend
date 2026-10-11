


import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  Images,
  Loader2,
  MapPin,
  Quote,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  getHappyMomentBySlug,
  getHappyMoments,
} from "../../api/content";

import Footer from "../../components/Footer";
import FAQSection from "../../components/FAQSection";
import { SITE_URL } from "../../components/Seo";

export default function HappyMomentDetail() {
  const { slug } = useParams();

  const [moment, setMoment] = useState(null);
  const [otherMoments, setOtherMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  /* =========================================================
     LOAD HAPPY MOMENT
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadMoment = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const [currentResponse, allResponse] = await Promise.all([
          getHappyMomentBySlug(slug),
          getHappyMoments(),
        ]);

        if (!mounted) return;

        const current =
          currentResponse?.data ?? currentResponse ?? null;

        const all =
          allResponse?.data ??
          allResponse ??
          [];

        if (!current) {
          setNotFound(true);
          setMoment(null);
          return;
        }

        setMoment(current);

        const currentId = current?.id;

        const related = Array.isArray(all)
          ? all.filter((item) => item?.id !== currentId)
          : [];

        setOtherMoments(related);
      } catch (error) {
        console.error("Failed to load happy moment:", error);

        if (mounted) {
          setNotFound(true);
          setMoment(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      loadMoment();
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  /* =========================================================
     IMAGE HELPER
  ========================================================= */

  const getImageUrl = (image) => {
    if (!image) return "";

    if (typeof image === "string") {
      return image;
    }

    if (typeof image === "object") {
      return (
        image.url ||
        image.secure_url ||
        image.src ||
        ""
      );
    }

    return "";
  };

  /* =========================================================
     MOMENT DATA
  ========================================================= */

  const title =
    moment?.title?.trim() ||
    "Happy Travel Moment";

  const placeName =
    moment?.place_name?.trim() || "";

  const shortCaption =
    moment?.short_caption?.trim() || "";

  const placeDescription =
    moment?.place_description?.trim() || "";

  const experience =
    moment?.experience?.trim() || "";

  const highlights = Array.isArray(moment?.highlights)
    ? moment.highlights.filter(Boolean)
    : [];

  const coverImage = getImageUrl(moment?.image);

  const galleryImages = Array.isArray(
    moment?.gallery_images
  )
    ? moment.gallery_images
        .map(getImageUrl)
        .filter(Boolean)
    : [];

  /* =========================================================
     ALL IMAGES
  ========================================================= */

  const allImages = useMemo(() => {
    const images = [];

    if (coverImage) {
      images.push({
        url: coverImage,
        public_id:
          moment?.image?.public_id ||
          "cover",
      });
    }

    galleryImages.forEach((url, index) => {
      images.push({
        url,
        public_id:
          moment?.gallery_images?.[index]
            ?.public_id ||
          `gallery-${index}`,
      });
    });

    return images;
  }, [
    coverImage,
    galleryImages,
    moment,
  ]);

  /* =========================================================
     DATE
  ========================================================= */

  const formattedDate = useMemo(() => {
    if (!moment?.travel_date) {
      return null;
    }

    try {
      return new Date(
        `${moment.travel_date}T00:00:00`
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return moment.travel_date;
    }
  }, [moment?.travel_date]);

  /* =========================================================
     SEO
  ========================================================= */

  const canonicalPath =
    `/happy-moments/${slug}`;

  const canonicalUrl =
    `${SITE_URL}${canonicalPath}`;

  const seoDescription =
    placeDescription ||
    shortCaption ||
    `Read this memorable travel experience from ${title}${
      placeName ? ` in ${placeName}` : ""
    }.`;

  const jsonLd = useMemo(() => {
    if (!moment) {
      return null;
    }

    return [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: seoDescription,
        url: canonicalUrl,
        image: allImages.map(
          (image) => image.url
        ),
        datePublished:
          moment.created_at || undefined,
        dateModified:
          moment.created_at || undefined,
        author: {
          "@type": "Organization",
          name: "Manyara Prive Vacations",
        },
        publisher: {
          "@type": "Organization",
          name: "Manyara Prive Vacations",
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
            name: "Happy Moments",
            item: `${SITE_URL}/#happy-moments`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: canonicalUrl,
          },
        ],
      },
    ];
  }, [
    moment,
    title,
    seoDescription,
    canonicalUrl,
    allImages,
  ]);

  /* =========================================================
     LIGHTBOX
  ========================================================= */

  const selectedIndex = useMemo(() => {
    if (!selectedImage) {
      return -1;
    }

    return allImages.findIndex(
      (image) =>
        image.url === selectedImage.url
    );
  }, [
    selectedImage,
    allImages,
  ]);

  const showPreviousImage = () => {
    if (
      selectedIndex < 0 ||
      allImages.length <= 1
    ) {
      return;
    }

    const previousIndex =
      selectedIndex === 0
        ? allImages.length - 1
        : selectedIndex - 1;

    setSelectedImage(
      allImages[previousIndex]
    );
  };

  const showNextImage = () => {
    if (
      selectedIndex < 0 ||
      allImages.length <= 1
    ) {
      return;
    }

    const nextIndex =
      selectedIndex === allImages.length - 1
        ? 0
        : selectedIndex + 1;

    setSelectedImage(
      allImages[nextIndex]
    );
  };

  /* =========================================================
     KEYBOARD CONTROLS
  ========================================================= */

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow = "";
    };
  }, [
    selectedImage,
    selectedIndex,
    allImages,
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-lighter">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>

          <p className="text-sm sm:text-base text-ink-600">
            Loading travel memory...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (notFound || !moment) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-lighter">
              <Heart className="h-8 w-8 text-primary" />
            </div>

            <h1 className="font-display text-3xl font-semibold text-ink-800 sm:text-4xl">
              Happy moment not found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-600 sm:text-base">
              We couldn't find the travel memory
              you're looking for.
            </p>

            <Link
              to="/happy-moments"
              className="
                mt-8
                inline-flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-full
                bg-primary
                px-6
                py-3
                text-sm
                font-semibold
                text-white
                shadow-brand
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-primary-hover
                hover:shadow-travel-hover
                focus:outline-none
                focus:ring-2
                focus:ring-primary/30
                focus:ring-offset-2
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Happy Moments
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-ink-700">
      {/* =====================================================
          SEO
      ===================================================== */}

      <Helmet>
        <title>
          {title} | Manyara Prive Vacations a Trip Holiday
        </title>

        <meta
          name="description"
          content={seoDescription}
        />

        <link
          rel="canonical"
          href={canonicalUrl}
        />

        {jsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )}
      </Helmet>

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="
            flex
            flex-wrap
            items-center
            gap-2
            text-xs
            text-ink-500
            sm:text-sm
          "
        >
          <Link
            to="/"
            className="
              transition-colors
              hover:text-link
            "
          >
            Home
          </Link>

          <span className="text-ink-300">
            /
          </span>

          <Link
            to="/happy-moments"
            className="
              transition-colors
              hover:text-link
            "
          >
            Happy Moments
          </Link>

          <span className="text-ink-300">
            /
          </span>

          <span className="max-w-[220px] truncate text-ink-600 sm:max-w-md">
            {title}
          </span>
        </nav>
      </div>

      <main>
        {/* ===================================================
            COVER IMAGE
        =================================================== */}

        <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pt-9">
          <div
            className="
              relative
              aspect-[16/8]
              w-full
              overflow-hidden
              rounded-3xl
              bg-surface-strong
              shadow-travel-card
            "
          >
            {coverImage ? (
              <button
                type="button"
                onClick={() =>
                  setSelectedImage(
                    allImages[0]
                  )
                }
                className="group block h-full w-full"
                aria-label="View cover image"
              >
                <img
                  src={coverImage}
                  alt={
                    placeName
                      ? `${title} in ${placeName}`
                      : title
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                    transition-transform
                    duration-700
                    ease-out
                    group-hover:scale-[1.025]
                  "
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black/35
                    via-black/5
                    to-transparent
                  "
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    bottom-0
                    h-24
                    bg-gradient-to-t
                    from-black/20
                    to-transparent
                  "
                />
              </button>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-petal-gradient">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-travel-card">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
              </div>
            )}

            {/* PHOTO COUNT */}

            {allImages.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImage(
                    allImages[0]
                  )
                }
                className="
                  absolute
                  bottom-4
                  right-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/30
                  bg-ink-900/75
                  px-4
                  py-2.5
                  text-xs
                  font-semibold
                  text-white
                  shadow-lg
                  backdrop-blur-md
                  transition-all
                  duration-300
                  hover:bg-ink-900/90
                  sm:bottom-5
                  sm:right-5
                  sm:text-sm
                "
              >
                <Images className="h-4 w-4" />

                {allImages.length} Photos
              </button>
            )}
          </div>
        </section>

        {/* ===================================================
            TITLE / HEADER
        =================================================== */}

        <section className="mx-auto max-w-5xl px-4 pt-9 sm:px-6 sm:pt-11 lg:px-8 lg:pt-14">
          {/* PLACE */}

          {placeName && (
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-primary/15
                bg-secondary-lighter
                px-3.5
                py-1.5
                text-xs
                font-semibold
                text-primary-dark
                sm:text-sm
              "
            >
              <MapPin className="h-4 w-4" />

              {placeName}
            </div>
          )}

          {/* TITLE */}

          <h1
            className="
              mt-5
              break-words
              font-display
              text-4xl
              font-semibold
              leading-[1.05]
              tracking-[-0.02em]
              text-ink-800
              sm:text-5xl
              md:text-6xl
              lg:text-[62px]
            "
          >
            {title}
          </h1>

          {/* DATE */}

          {formattedDate && (
            <div
              className="
                mt-5
                flex
                items-center
                gap-2
                text-sm
                text-ink-500
              "
            >
              <CalendarDays className="h-4 w-4 text-primary" />

              <span>
                Travelled on {formattedDate}
              </span>
            </div>
          )}

          {/* CAPTION */}

          {shortCaption && (
            <div
              className="
                relative
                mt-7
                overflow-hidden
                rounded-2xl
                border
                border-divider
                bg-petal-gradient
                p-5
                shadow-travel-card
                sm:p-7
              "
            >
              <Quote
                className="
                  absolute
                  left-4
                  top-4
                  h-8
                  w-8
                  text-primary/15
                  sm:left-5
                  sm:top-5
                "
              />

              <div className="relative">
                <p
                  className="
                    pl-7
                    font-display
                    text-lg
                    leading-relaxed
                    text-ink-700
                    sm:pl-8
                    sm:text-xl
                  "
                >
                  “{shortCaption}”
                </p>
              </div>
            </div>
          )}

          {/* HAPPY TRAVELLER */}

          <div className="mt-7 flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-secondary-lighter
              "
            >
              <Heart
                className="h-5 w-5 text-primary"
                fill="currentColor"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-ink-800">
                Happy Traveller
              </p>

              <p className="mt-0.5 text-xs text-ink-500">
                Memories with Manyara Prive Vacations a Trip Holiday
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          {/* =================================================
              PLACE DESCRIPTION
          ================================================= */}

          {placeDescription && (
            <article className="mb-12 sm:mb-14">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
                  About the destination
                </p>

                <h2 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                  {placeName
                    ? `About ${placeName}`
                    : "About this destination"}
                </h2>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-divider
                  bg-card
                  p-5
                  shadow-travel-card
                  sm:p-7
                "
              >
                <p
                  className="
                    whitespace-pre-line
                    text-sm
                    leading-7
                    text-ink-700
                    sm:text-base
                    sm:leading-8
                  "
                >
                  {placeDescription}
                </p>
              </div>
            </article>
          )}

          {/* =================================================
              EXPERIENCE
          ================================================= */}

          {experience && (
            <article className="mb-12 sm:mb-14">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
                  Traveller experience
                </p>

                <h2 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                  The Experience
                </h2>
              </div>

              <div
                className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-primary/10
                  bg-petal-gradient
                  p-5
                  sm:p-7
                "
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5" />

                <div className="relative flex items-start gap-4">
                  <div
                    className="
                      hidden
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-white
                      shadow-travel-card
                      sm:flex
                    "
                  >
                    <Heart
                      className="h-5 w-5 text-primary"
                      fill="currentColor"
                    />
                  </div>

                  <p
                    className="
                      whitespace-pre-line
                      text-sm
                      leading-7
                      text-ink-700
                      sm:text-base
                      sm:leading-8
                    "
                  >
                    {experience}
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* =================================================
              HIGHLIGHTS
          ================================================= */}

          {highlights.length > 0 && (
            <article className="mb-12 sm:mb-14">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
                  Trip highlights
                </p>

                <h2 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                  What made this trip special
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {highlights.map(
                  (highlight, index) => (
                    <div
                      key={`${highlight}-${index}`}
                      className="
                        group
                        flex
                        items-start
                        gap-3
                        rounded-2xl
                        border
                        border-divider
                        bg-card
                        p-4
                        shadow-travel-card
                        transition-all
                        duration-300
                        hover:-translate-y-0.5
                        hover:shadow-travel-hover
                        sm:p-5
                      "
                    >
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-secondary-lighter
                          transition-colors
                          group-hover:bg-secondary-light
                        "
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>

                      <p
                        className="
                          pt-0.5
                          text-sm
                          leading-6
                          text-ink-700
                          sm:text-base
                          sm:leading-7
                        "
                      >
                        {highlight}
                      </p>
                    </div>
                  )
                )}
              </div>
            </article>
          )}

          {/* =================================================
              GALLERY
          ================================================= */}

          {allImages.length > 1 && (
            <article className="mb-12 sm:mb-14">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
                    Travel gallery
                  </p>

                  <h2 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                    More memories
                  </h2>
                </div>

                <p className="hidden text-sm text-ink-500 sm:block">
                  {allImages.length} photos
                </p>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  sm:gap-4
                  md:grid-cols-3
                "
              >
                {allImages
                  .slice(1)
                  .map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          image
                        )
                      }
                      className="
                        group
                        relative
                        aspect-[4/3]
                        overflow-hidden
                        rounded-2xl
                        bg-surface-strong
                        shadow-travel-card
                        focus:outline-none
                        focus:ring-2
                        focus:ring-primary/40
                        focus:ring-offset-2
                      "
                    >
                      <img
                        src={image.url}
                        alt={`${title} travel memory ${
                          index + 1
                        }`}
                        loading="lazy"
                        className="
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-500
                          ease-out
                          group-hover:scale-105
                        "
                      />

                      <div
                        className="
                          absolute
                          inset-0
                          bg-black/0
                          transition
                          duration-300
                          group-hover:bg-black/10
                        "
                      />

                      <div
                        className="
                          absolute
                          inset-0
                          ring-1
                          ring-inset
                          ring-white/0
                          transition
                          duration-300
                          group-hover:ring-white/20
                        "
                      />
                    </button>
                  ))}
              </div>
            </article>
          )}

          {/* =================================================
              CTA
          ================================================= */}

          <section
            className="
              relative
              overflow-hidden
              rounded-3xl
              border
              border-primary/10
              bg-brand-gradient
              p-6
              shadow-travel-card
              sm:p-8
              lg:p-10
            "
          >
            {/* Decorative shapes */}

            <div
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                h-56
                w-56
                rounded-full
                bg-primary/8
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-24
                -left-20
                h-52
                w-52
                rounded-full
                bg-white/80
              "
            />

            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                    shadow-travel-card
                  "
                >
                  <Heart
                    className="h-5 w-5 text-primary"
                    fill="currentColor"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
                    Your next memory
                  </p>

                  <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                    Ready to create your own story?
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 sm:text-base">
                    Let Manyara Prive Vacations a Trip Holiday help you
                    plan a memorable journey tailored
                    to your travel preferences.
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <Link
                  to="/packages"
                  className="
                    inline-flex
                    min-h-[48px]
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-primary
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-brand
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:bg-primary-hover
                    hover:shadow-orange
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary/30
                    focus:ring-offset-2
                    sm:px-6
                    sm:text-base
                  "
                >
                  Explore Packages

                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </section>
        </section>

        {/* ===================================================
            FAQ
        =================================================== */}

        <FAQSection />

        {/* ===================================================
            FOOTER
        =================================================== */}

        <Footer />
      </main>

      {/* =====================================================
          IMAGE LIGHTBOX
      ===================================================== */}

      {selectedImage && (
        <div
          className="
            fixed
            inset-0
            z-[200]
            flex
            items-center
            justify-center
            bg-ink-900/95
            p-3
            backdrop-blur-md
            sm:p-5
          "
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedImage(null);
            }
          }}
        >
          {/* =================================================
              CLOSE
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              setSelectedImage(null)
            }
            className="
              absolute
              right-3
              top-3
              z-20
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-white/15
              bg-white/10
              text-white
              backdrop-blur-md
              transition
              hover:bg-white/20
              focus:outline-none
              focus:ring-2
              focus:ring-white/40
              sm:right-5
              sm:top-5
              sm:h-11
              sm:w-11
            "
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* =================================================
              PREVIOUS
          ================================================= */}

          {allImages.length > 1 && (
            <button
              type="button"
              onClick={showPreviousImage}
              className="
                absolute
                left-2
                z-20
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-white/15
                bg-white/10
                text-white
                backdrop-blur-md
                transition
                hover:bg-white/20
                focus:outline-none
                focus:ring-2
                focus:ring-white/40
                sm:left-5
                sm:h-12
                sm:w-12
                lg:left-8
              "
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* =================================================
              IMAGE
          ================================================= */}

          <div
            className="
              relative
              flex
              max-h-[90vh]
              w-full
              max-w-6xl
              items-center
              justify-center
            "
          >
            <img
              src={selectedImage.url}
              alt={title}
              className="
                max-h-[85vh]
                max-w-full
                rounded-xl
                object-contain
                shadow-2xl
              "
            />

            {/* IMAGE COUNTER */}

            {allImages.length > 1 && (
              <div
                className="
                  absolute
                  bottom-3
                  left-1/2
                  -translate-x-1/2
                  rounded-full
                  border
                  border-white/10
                  bg-ink-900/70
                  px-3
                  py-1.5
                  text-xs
                  text-white
                  backdrop-blur-md
                  sm:text-sm
                "
              >
                {selectedIndex + 1} /{" "}
                {allImages.length}
              </div>
            )}
          </div>

          {/* =================================================
              NEXT
          ================================================= */}

          {allImages.length > 1 && (
            <button
              type="button"
              onClick={showNextImage}
              className="
                absolute
                right-2
                z-20
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-white/15
                bg-white/10
                text-white
                backdrop-blur-md
                transition
                hover:bg-white/20
                focus:outline-none
                focus:ring-2
                focus:ring-white/40
                sm:right-5
                sm:h-12
                sm:w-12
                lg:right-8
              "
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}























































// import { useEffect, useMemo, useState } from "react";
// import { Helmet } from "react-helmet-async";
// import {
//   ArrowLeft,
//   ArrowRight,
//   CalendarDays,
//   ChevronLeft,
//   ChevronRight,
//   Heart,
//   Loader2,
//   MapPin,
//   Quote,
//   Sparkles,
//   X,
//   Images,
// } from "lucide-react";
// import { Link, useNavigate, useParams } from "react-router-dom";

// import {
//   getHappyMomentBySlug,
//   getHappyMoments,
// } from "../../api/content";

// import Footer from "../../components/Footer";
// import FAQSection from "../../components/FAQSection";
// import { SITE_URL } from "../../components/Seo";

// export default function HappyMomentDetail() {
//   const { slug } = useParams();
//   const navigate = useNavigate();

//   const [moment, setMoment] = useState(null);
//   const [otherMoments, setOtherMoments] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [notFound, setNotFound] = useState(false);

//   const [selectedImage, setSelectedImage] = useState(null);

//   /* =========================================================
//      LOAD HAPPY MOMENT
//   ========================================================= */

//   useEffect(() => {
//     let mounted = true;

//     const loadMoment = async () => {
//       try {
//         setLoading(true);
//         setNotFound(false);

//         const [currentResponse, allResponse] = await Promise.all([
//           getHappyMomentBySlug(slug),
//           getHappyMoments(),
//         ]);

//         if (!mounted) return;

//         const current =
//           currentResponse?.data ?? currentResponse ?? null;

//         const all =
//           allResponse?.data ??
//           allResponse ??
//           [];

//         if (!current) {
//           setNotFound(true);
//           setMoment(null);
//           return;
//         }

//         setMoment(current);

//         const currentId = current?.id;

//         const related = Array.isArray(all)
//           ? all.filter((item) => item?.id !== currentId)
//           : [];

//         setOtherMoments(related);
//       } catch (error) {
//         console.error(
//           "Failed to load happy moment:",
//           error
//         );

//         if (mounted) {
//           setNotFound(true);
//           setMoment(null);
//         }
//       } finally {
//         if (mounted) {
//           setLoading(false);
//         }
//       }
//     };

//     if (slug) {
//       loadMoment();
//     }

//     return () => {
//       mounted = false;
//     };
//   }, [slug]);

//   /* =========================================================
//      IMAGE HELPER
//   ========================================================= */

//   const getImageUrl = (image) => {
//     if (!image) return "";

//     if (typeof image === "string") {
//       return image;
//     }

//     if (typeof image === "object") {
//       return (
//         image.url ||
//         image.secure_url ||
//         image.src ||
//         ""
//       );
//     }

//     return "";
//   };

//   /* =========================================================
//      MOMENT DATA
//   ========================================================= */

//   const title =
//     moment?.title?.trim() ||
//     "Happy Travel Moment";

//   const placeName =
//     moment?.place_name?.trim() || "";

//   const shortCaption =
//     moment?.short_caption?.trim() || "";

//   const placeDescription =
//     moment?.place_description?.trim() || "";

//   const experience =
//     moment?.experience?.trim() || "";

//   const highlights = Array.isArray(moment?.highlights)
//     ? moment.highlights.filter(Boolean)
//     : [];

//   const coverImage = getImageUrl(moment?.image);

//   const galleryImages = Array.isArray(
//     moment?.gallery_images
//   )
//     ? moment.gallery_images
//         .map(getImageUrl)
//         .filter(Boolean)
//     : [];

//   /*
//    * Cover image + gallery images
//    */
//   const allImages = useMemo(() => {
//     const images = [];

//     if (coverImage) {
//       images.push({
//         url: coverImage,
//         public_id:
//           moment?.image?.public_id ||
//           "cover",
//       });
//     }

//     galleryImages.forEach((url, index) => {
//       images.push({
//         url,
//         public_id:
//           moment?.gallery_images?.[index]
//             ?.public_id ||
//           `gallery-${index}`,
//       });
//     });

//     return images;
//   }, [
//     coverImage,
//     galleryImages,
//     moment,
//   ]);

//   /* =========================================================
//      DATE
//   ========================================================= */

//   const formattedDate = useMemo(() => {
//     if (!moment?.travel_date) {
//       return null;
//     }

//     try {
//       return new Date(
//         `${moment.travel_date}T00:00:00`
//       ).toLocaleDateString("en-IN", {
//         day: "numeric",
//         month: "long",
//         year: "numeric",
//       });
//     } catch {
//       return moment.travel_date;
//     }
//   }, [moment?.travel_date]);

//   /* =========================================================
//      SEO
//   ========================================================= */

//   const canonicalPath =
//     `/happy-moments/${slug}`;

//   const canonicalUrl =
//     `${SITE_URL}${canonicalPath}`;

//   const seoDescription =
//     placeDescription ||
//     shortCaption ||
//     `Read this memorable travel experience from ${title}${
//       placeName ? ` in ${placeName}` : ""
//     }.`;

//   const jsonLd = useMemo(() => {
//     if (!moment) {
//       return null;
//     }

//     return [
//       {
//         "@context": "https://schema.org",
//         "@type": "Article",
//         headline: title,
//         description: seoDescription,
//         url: canonicalUrl,
//         image: allImages.map(
//           (image) => image.url
//         ),
//         datePublished:
//           moment.created_at || undefined,
//         dateModified:
//           moment.created_at || undefined,
//         author: {
//           "@type": "Organization",
//           name: "Manyara Prive Vacations a Trip Holiday",
//         },
//         publisher: {
//           "@type": "Organization",
//           name: "Manyara Prive Vacations a Trip Holiday",
//         },
//       },

//       {
//         "@context": "https://schema.org",
//         "@type": "BreadcrumbList",
//         itemListElement: [
//           {
//             "@type": "ListItem",
//             position: 1,
//             name: "Home",
//             item: SITE_URL,
//           },
//           {
//             "@type": "ListItem",
//             position: 2,
//             name: "Happy Moments",
//             item: `${SITE_URL}/#happy-moments`,
//           },
//           {
//             "@type": "ListItem",
//             position: 3,
//             name: title,
//             item: canonicalUrl,
//           },
//         ],
//       },
//     ];
//   }, [
//     moment,
//     title,
//     seoDescription,
//     canonicalUrl,
//     allImages,
//   ]);

//   /* =========================================================
//      LIGHTBOX
//   ========================================================= */

//   const selectedIndex = useMemo(() => {
//     if (!selectedImage) {
//       return -1;
//     }

//     return allImages.findIndex(
//       (image) =>
//         image.url === selectedImage.url
//     );
//   }, [
//     selectedImage,
//     allImages,
//   ]);

//   const showPreviousImage = () => {
//     if (
//       selectedIndex < 0 ||
//       allImages.length <= 1
//     ) {
//       return;
//     }

//     const previousIndex =
//       selectedIndex === 0
//         ? allImages.length - 1
//         : selectedIndex - 1;

//     setSelectedImage(
//       allImages[previousIndex]
//     );
//   };

//   const showNextImage = () => {
//     if (
//       selectedIndex < 0 ||
//       allImages.length <= 1
//     ) {
//       return;
//     }

//     const nextIndex =
//       selectedIndex === allImages.length - 1
//         ? 0
//         : selectedIndex + 1;

//     setSelectedImage(
//       allImages[nextIndex]
//     );
//   };

//   /* =========================================================
//      KEYBOARD CONTROLS
//   ========================================================= */

//   useEffect(() => {
//     if (!selectedImage) {
//       return;
//     }

//     const handleKeyDown = (event) => {
//       if (event.key === "Escape") {
//         setSelectedImage(null);
//       }

//       if (event.key === "ArrowLeft") {
//         showPreviousImage();
//       }

//       if (event.key === "ArrowRight") {
//         showNextImage();
//       }
//     };

//     document.addEventListener(
//       "keydown",
//       handleKeyDown
//     );

//     document.body.style.overflow = "hidden";

//     return () => {
//       document.removeEventListener(
//         "keydown",
//         handleKeyDown
//       );

//       document.body.style.overflow = "";
//     };
//   }, [
//     selectedImage,
//     selectedIndex,
//     allImages,
//   ]);

//   /* =========================================================
//      LOADING
//   ========================================================= */

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-white flex items-center justify-center px-4">
//         <div className="text-center">
//           <Loader2 className="w-9 h-9 animate-spin text-[#F22727] mx-auto mb-4" />

//           <p className="text-sm sm:text-base text-gray-600">
//             Loading travel memory...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   /* =========================================================
//      NOT FOUND
//   ========================================================= */

//   if (notFound || !moment) {
//     return (
//       <div className="min-h-screen bg-white">
//         <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
//           <div className="text-center">
//             <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
//               <Heart className="w-8 h-8 text-[#F22727]" />
//             </div>

//             <h1 className="text-2xl sm:text-3xl font-bold text-[#102040]">
//               Happy moment not found
//             </h1>

//             <p className="mt-3 text-sm sm:text-base text-gray-600">
//               We couldn't find the travel memory
//               you're looking for.
//             </p>

//             <Link
//               to="/happy-moments"
//               className="
//                 inline-flex
//                 items-center
//                 gap-2
//                 mt-7
//                 px-5
//                 py-3
//                 rounded-full
//                 bg-[#102040]
//                 text-white
//                 text-sm
//                 font-semibold
//                 hover:bg-[#182c52]
//                 transition
//               "
//             >
//               <ArrowLeft className="w-4 h-4" />
//               Back to Happy Moments
//             </Link>
//           </div>
//         </main>

//         <Footer />
//       </div>
//     );
//   }

//   /* =========================================================
//      MAIN PAGE
//   ========================================================= */

//   return (
//     <div className="min-h-screen bg-white overflow-x-clip">
//       {/* =====================================================
//           SEO
//       ===================================================== */}

//       <Helmet>
//         <title>
//           {title} | Manyara Prive Vacations a Trip Holiday
//         </title>

//         <meta
//           name="description"
//           content={seoDescription}
//         />

//         <link
//           rel="canonical"
//           href={canonicalUrl}
//         />

//         {jsonLd && (
//           <script type="application/ld+json">
//             {JSON.stringify(jsonLd)}
//           </script>
//         )}
//       </Helmet>

//       {/* =====================================================
//           BREADCRUMB
//       ===================================================== */}

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
//         <nav
//           aria-label="Breadcrumb"
//           className="
//             flex
//             flex-wrap
//             items-center
//             gap-2
//             text-xs
//             sm:text-sm
//             text-gray-500
//           "
//         >
//           <Link
//             to="/"
//             className="hover:text-[#F22727] transition-colors"
//           >
//             Home
//           </Link>

//           <span>/</span>

//           <Link
//             to="/happy-moments"
//             className="hover:text-[#F22727] transition-colors"
//           >
//             Happy Moments
//           </Link>

//           <span>/</span>

//           <span className="text-gray-700 truncate max-w-[220px] sm:max-w-md">
//             {title}
//           </span>
//         </nav>
//       </div>

//       {/* =====================================================
//           FULL WIDTH COVER IMAGE
//       ===================================================== */}

//       <main>
//         <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 lg:pt-9">
//           <div
//             className="
//               relative
//               w-full
//               overflow-hidden
//               rounded-2xl
//               sm:rounded-3xl
//               bg-gray-100
//               shadow-sm
//               aspect-[16/8]
//             "
//           >
//             {coverImage ? (
//               <button
//                 type="button"
//                 onClick={() =>
//                   setSelectedImage(
//                     allImages[0]
//                   )
//                 }
//                 className="block w-full h-full group"
//                 aria-label="View cover image"
//               >
//                 <img
//                   src={coverImage}
//                   alt={
//                     placeName
//                       ? `${title} in ${placeName}`
//                       : title
//                   }
//                   className="
//                     w-full
//                     h-full
//                     object-cover
//                     transition-transform
//                     duration-700
//                     group-hover:scale-[1.02]
//                   "
//                 />

//                 <div
//                   className="
//                     absolute
//                     inset-0
//                     bg-gradient-to-t
//                     from-black/35
//                     via-transparent
//                     to-transparent
//                     pointer-events-none
//                   "
//                 />
//               </button>
//             ) : (
//               <div className="w-full h-full flex items-center justify-center">
//                 <Heart className="w-16 h-16 text-[#102040]/10" />
//               </div>
//             )}

//             {/* PHOTO COUNT */}

//             {allImages.length > 1 && (
//               <button
//                 type="button"
//                 onClick={() =>
//                   setSelectedImage(
//                     allImages[0]
//                   )
//                 }
//                 className="
//                   absolute
//                   bottom-4
//                   right-4
//                   sm:bottom-5
//                   sm:right-5
//                   inline-flex
//                   items-center
//                   gap-2
//                   px-4
//                   py-2.5
//                   rounded-full
//                   bg-[#102040]/85
//                   text-white
//                   text-xs
//                   sm:text-sm
//                   font-semibold
//                   backdrop-blur-sm
//                   hover:bg-[#102040]
//                   transition
//                 "
//               >
//                 <Images className="w-4 h-4" />
//                 {allImages.length} Photos
//               </button>
//             )}
//           </div>
//         </section>

//         {/* ===================================================
//             TITLE / HEADER
//         =================================================== */}

//         <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12">
//           {/* PLACE */}

//           {placeName && (
//             <div
//               className="
//                 inline-flex
//                 items-center
//                 gap-2
//                 px-3
//                 py-1.5
//                 rounded-full
//                 bg-red-50
//                 text-[#F22727]
//                 text-xs
//                 sm:text-sm
//                 font-semibold
//               "
//             >
//               <MapPin className="w-4 h-4" />
//               {placeName}
//             </div>
//           )}

//           {/* TITLE */}

//           <h1
//             className="
//               mt-4
//               font-display
//               text-3xl
//               sm:text-4xl
//               md:text-5xl
//               lg:text-[52px]
//               font-bold
//               leading-[1.1]
//               text-[#102040]
//               break-words
//             "
//           >
//             {title}
//           </h1>

//           {/* DATE */}

//           {formattedDate && (
//             <div
//               className="
//                 mt-4
//                 flex
//                 items-center
//                 gap-2
//                 text-sm
//                 text-gray-500
//               "
//             >
//               <CalendarDays className="w-4 h-4" />

//               <span>
//                 Travelled on {formattedDate}
//               </span>
//             </div>
//           )}

//           {/* CAPTION */}

//           {shortCaption && (
//             <div
//               className="
//                 relative
//                 mt-6
//                 rounded-2xl
//                 bg-gray-50
//                 border
//                 border-gray-100
//                 p-5
//                 sm:p-6
//               "
//             >
//               <Quote
//                 className="
//                   absolute
//                   top-4
//                   left-4
//                   w-7
//                   h-7
//                   text-[#F22727]/15
//                 "
//               />

//               <p
//                 className="
//                   pl-6
//                   text-base
//                   sm:text-lg
//                   text-[#102040]/75
//                   leading-relaxed
//                   italic
//                 "
//               >
//                 "{shortCaption}"
//               </p>
//             </div>
//           )}

//           {/* HAPPY TRAVELLER */}

//           <div className="mt-6 flex items-center gap-3">
//             <div
//               className="
//                 w-11
//                 h-11
//                 rounded-full
//                 bg-red-50
//                 flex
//                 items-center
//                 justify-center
//                 shrink-0
//               "
//             >
//               <Heart
//                 className="w-5 h-5 text-[#F22727]"
//                 fill="currentColor"
//               />
//             </div>

//             <div>
//               <p className="text-sm font-semibold text-[#102040]">
//                 Happy Traveller
//               </p>

//               <p className="text-xs text-gray-500">
//                 Memories with Manyara Prive Vacations a Trip Holiday
//               </p>
//             </div>
//           </div>
//         </section>

//         {/* ===================================================
//             CONTENT
//         =================================================== */}

//         <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16">
//           {/* =================================================
//               PLACE DESCRIPTION
//           ================================================= */}

//           {placeDescription && (
//             <article className="mb-10 sm:mb-12">
//               <div className="mb-4">
//                 <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
//                   About the destination
//                 </p>

//                 <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#102040]">
//                   {placeName
//                     ? `About ${placeName}`
//                     : "About this destination"}
//                 </h2>
//               </div>

//               <div
//                 className="
//                   rounded-2xl
//                   border
//                   border-gray-100
//                   bg-white
//                   p-5
//                   sm:p-7
//                   shadow-sm
//                 "
//               >
//                 <p
//                   className="
//                     text-sm
//                     sm:text-base
//                     leading-7
//                     sm:leading-8
//                     text-gray-700
//                     whitespace-pre-line
//                   "
//                 >
//                   {placeDescription}
//                 </p>
//               </div>
//             </article>
//           )}

//           {/* =================================================
//               EXPERIENCE
//           ================================================= */}

//           {experience && (
//             <article className="mb-10 sm:mb-12">
//               <div className="mb-4">
//                 <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
//                   Traveller experience
//                 </p>

//                 <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#102040]">
//                   The Experience
//                 </h2>
//               </div>

//               <div
//                 className="
//                   rounded-2xl
//                   border
//                   border-gray-100
//                   bg-gray-50
//                   p-5
//                   sm:p-7
//                 "
//               >
//                 <div className="flex items-start gap-4">
//                   <div
//                     className="
//                       hidden
//                       sm:flex
//                       w-11
//                       h-11
//                       rounded-xl
//                       bg-red-50
//                       items-center
//                       justify-center
//                       shrink-0
//                     "
//                   >
//                     <Heart
//                       className="w-5 h-5 text-[#F22727]"
//                       fill="currentColor"
//                     />
//                   </div>

//                   <p
//                     className="
//                       text-sm
//                       sm:text-base
//                       leading-7
//                       sm:leading-8
//                       text-gray-700
//                       whitespace-pre-line
//                     "
//                   >
//                     {experience}
//                   </p>
//                 </div>
//               </div>
//             </article>
//           )}

//           {/* =================================================
//               HIGHLIGHTS
//           ================================================= */}

//           {highlights.length > 0 && (
//             <article className="mb-10 sm:mb-12">
//               <div className="mb-5">
//                 <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
//                   Trip highlights
//                 </p>

//                 <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#102040]">
//                   What made this trip special
//                 </h2>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
//                 {highlights.map(
//                   (highlight, index) => (
//                     <div
//                       key={`${highlight}-${index}`}
//                       className="
//                         flex
//                         items-start
//                         gap-3
//                         rounded-xl
//                         border
//                         border-gray-100
//                         bg-white
//                         p-4
//                         sm:p-5
//                         shadow-sm
//                       "
//                     >
//                       <div
//                         className="
//                           w-8
//                           h-8
//                           rounded-full
//                           bg-red-50
//                           flex
//                           items-center
//                           justify-center
//                           shrink-0
//                         "
//                       >
//                         <Sparkles className="w-4 h-4 text-[#F22727]" />
//                       </div>

//                       <p
//                         className="
//                           text-sm
//                           sm:text-base
//                           text-gray-700
//                           leading-6
//                           sm:leading-7
//                         "
//                       >
//                         {highlight}
//                       </p>
//                     </div>
//                   )
//                 )}
//               </div>
//             </article>
//           )}

//           {/* =================================================
//               GALLERY
//           ================================================= */}

//           {allImages.length > 1 && (
//             <article className="mb-10 sm:mb-12">
//               <div className="flex items-end justify-between gap-4 mb-5">
//                 <div>
//                   <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
//                     Travel gallery
//                   </p>

//                   <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#102040]">
//                     More memories
//                   </h2>
//                 </div>

//                 <p className="hidden sm:block text-sm text-gray-500">
//                   {allImages.length} photos
//                 </p>
//               </div>

//               <div
//                 className="
//                   grid
//                   grid-cols-2
//                   md:grid-cols-3
//                   gap-3
//                   sm:gap-4
//                 "
//               >
//                 {allImages
//                   .slice(1)
//                   .map((image, index) => (
//                     <button
//                       key={`${image.url}-${index}`}
//                       type="button"
//                       onClick={() =>
//                         setSelectedImage(
//                           image
//                         )
//                       }
//                       className="
//                         group
//                         relative
//                         overflow-hidden
//                         rounded-xl
//                         sm:rounded-2xl
//                         bg-gray-100
//                         aspect-[4/3]
//                       "
//                     >
//                       <img
//                         src={image.url}
//                         alt={`${title} travel memory ${index + 1}`}
//                         loading="lazy"
//                         className="
//                           w-full
//                           h-full
//                           object-cover
//                           transition-transform
//                           duration-500
//                           group-hover:scale-105
//                         "
//                       />

//                       <div
//                         className="
//                           absolute
//                           inset-0
//                           bg-black/0
//                           group-hover:bg-black/10
//                           transition
//                         "
//                       />
//                     </button>
//                   ))}
//               </div>
//             </article>
//           )}

//           {/* =================================================
//               CTA
//           ================================================= */}

//           <section
//             className="
//               relative
//               overflow-hidden
//               rounded-2xl
//               sm:rounded-3xl
//               bg-[#102040]
//               p-6
//               sm:p-8
//               lg:p-10
//               text-white
//             "
//           >
//             <div
//               className="
//                 absolute
//                 -right-20
//                 -top-20
//                 w-56
//                 h-56
//                 rounded-full
//                 bg-[#F22727]/10
//               "
//             />

//             <div
//               className="
//                 absolute
//                 -left-20
//                 -bottom-20
//                 w-48
//                 h-48
//                 rounded-full
//                 bg-white/5
//               "
//             />

//             <div className="relative z-10">
//               <div className="flex items-start gap-4">
//                 <div
//                   className="
//                     w-11
//                     h-11
//                     rounded-xl
//                     bg-white/10
//                     flex
//                     items-center
//                     justify-center
//                     shrink-0
//                   "
//                 >
//                   <Heart
//                     className="w-5 h-5 text-[#F22727]"
//                     fill="currentColor"
//                   />
//                 </div>

//                 <div>
//                   <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
//                     Your next memory
//                   </p>

//                   <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold">
//                     Ready to create your own story?
//                   </h2>

//                   <p className="mt-3 max-w-2xl text-sm sm:text-base leading-6 text-white/70">
//                     Let Manyara Prive Vacations a Trip Holiday help you
//                     plan a memorable journey tailored
//                     to your travel preferences.
//                   </p>
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <Link
//                   to="/packages"
//                   className="
//                     inline-flex
//                     items-center
//                     justify-center
//                     gap-2
//                     min-h-[48px]
//                     px-5
//                     sm:px-6
//                     py-3
//                     rounded-xl
//                     bg-[#F22727]
//                     hover:bg-[#D94141]
//                     text-white
//                     text-sm
//                     sm:text-base
//                     font-bold
//                     transition
//                     shadow-md
//                   "
//                 >
//                   Explore Packages
//                   <ArrowRight className="w-4 h-4" />
//                 </Link>
//               </div>
//             </div>
//           </section>
//         </section>

//         {/* ===================================================
//             FAQ
//         =================================================== */}

//         <FAQSection />

//         {/* ===================================================
//             FOOTER
//         =================================================== */}

//         <Footer />
//       </main>

//       {/* =====================================================
//           IMAGE LIGHTBOX
//       ===================================================== */}

//       {selectedImage && (
//         <div
//           className="
//             fixed
//             inset-0
//             z-[200]
//             bg-black/90
//             backdrop-blur-sm
//             flex
//             items-center
//             justify-center
//             p-3
//             sm:p-5
//           "
//           role="dialog"
//           aria-modal="true"
//           aria-label="Image viewer"
//           onClick={(event) => {
//             if (
//               event.target ===
//               event.currentTarget
//             ) {
//               setSelectedImage(null);
//             }
//           }}
//         >
//           {/* CLOSE */}

//           <button
//             type="button"
//             onClick={() =>
//               setSelectedImage(null)
//             }
//             className="
//               absolute
//               top-3
//               right-3
//               sm:top-5
//               sm:right-5
//               z-20
//               w-10
//               h-10
//               sm:w-11
//               sm:h-11
//               rounded-full
//               bg-white/10
//               hover:bg-white/20
//               text-white
//               flex
//               items-center
//               justify-center
//               transition
//             "
//             aria-label="Close image viewer"
//           >
//             <X className="w-5 h-5" />
//           </button>

//           {/* PREVIOUS */}

//           {allImages.length > 1 && (
//             <button
//               type="button"
//               onClick={showPreviousImage}
//               className="
//                 absolute
//                 left-2
//                 sm:left-5
//                 lg:left-8
//                 z-20
//                 w-10
//                 h-10
//                 sm:w-12
//                 sm:h-12
//                 rounded-full
//                 bg-white/10
//                 hover:bg-white/20
//                 text-white
//                 flex
//                 items-center
//                 justify-center
//                 transition
//               "
//               aria-label="Previous image"
//             >
//               <ChevronLeft className="w-6 h-6" />
//             </button>
//           )}

//           {/* IMAGE */}

//           <div
//             className="
//               relative
//               w-full
//               max-w-6xl
//               max-h-[90vh]
//               flex
//               items-center
//               justify-center
//             "
//           >
//             <img
//               src={selectedImage.url}
//               alt={title}
//               className="
//                 max-w-full
//                 max-h-[85vh]
//                 object-contain
//                 rounded-lg
//                 sm:rounded-xl
//                 shadow-2xl
//               "
//             />

//             {/* IMAGE COUNTER */}

//             {allImages.length > 1 && (
//               <div
//                 className="
//                   absolute
//                   bottom-3
//                   left-1/2
//                   -translate-x-1/2
//                   px-3
//                   py-1.5
//                   rounded-full
//                   bg-black/60
//                   text-white
//                   text-xs
//                   sm:text-sm
//                   backdrop-blur-sm
//                 "
//               >
//                 {selectedIndex + 1} /{" "}
//                 {allImages.length}
//               </div>
//             )}
//           </div>

//           {/* NEXT */}

//           {allImages.length > 1 && (
//             <button
//               type="button"
//               onClick={showNextImage}
//               className="
//                 absolute
//                 right-2
//                 sm:right-5
//                 lg:right-8
//                 z-20
//                 w-10
//                 h-10
//                 sm:w-12
//                 sm:h-12
//                 rounded-full
//                 bg-white/10
//                 hover:bg-white/20
//                 text-white
//                 flex
//                 items-center
//                 justify-center
//                 transition
//               "
//               aria-label="Next image"
//             >
//               <ChevronRight className="w-6 h-6" />
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }



