

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock3, Newspaper, ArrowRight } from "lucide-react";

import { getBlogs } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { Reveal, useInView } from "./Reveal";

import { cld, cldSrcSet } from "../utils/cloudinary";
/* ============================================================
   LAYOUT
   Editorial hierarchy: ONE featured article + up to TWO
   supporting articles.
   mobile / tablet : featured card, then compact horizontal cards
   desktop (lg)    : featured (3/5) beside a stacked column (2/5)
============================================================ */

const MAX_POSTS = 3;

const CARD_RADIUS = "rounded-2xl sm:rounded-3xl";

/* ============================================================
   HELPERS
============================================================ */

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* Optional fields: shown only when the API provides them */
const getCategory = (post) => {
  const category = post?.category;

  if (!category) {
    return "";
  }

  if (typeof category === "string") {
    return category;
  }

  return category?.name || category?.title || "";
};

const getReadTime = (post) => {
  const minutes = Number(
    post?.reading_time ?? post?.read_time_minutes ?? post?.read_time
  );

  return minutes > 0 ? `${Math.round(minutes)} min read` : "";
};

/* ============================================================
   POST META (category · date · reading time)
============================================================ */

function PostMeta({ post, className = "mb-3" }) {
  const category = getCategory(post);
  const date = formatDate(post?.published_at);
  const readTime = getReadTime(post);

  if (!category && !date && !readTime) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted sm:text-sm ${className}`}
    >
      {category && (
        <span className="font-semibold text-primary">{category}</span>
      )}

      {date && (
        <span className="inline-flex items-center gap-1.5">
          <Calendar
            className="h-3.5 w-3.5 shrink-0 text-secondary"
            aria-hidden="true"
          />
          {date}
        </span>
      )}

      {readTime && (
        <span className="inline-flex items-center gap-1.5">
          <Clock3
            className="h-3.5 w-3.5 shrink-0 text-secondary"
            aria-hidden="true"
          />
          {readTime}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   BLOG IMAGE
   Fills whatever box the parent gives it (aspect ratio or
   stretch). Handles shimmer, cached images and load errors.
============================================================ */

function BlogImage({ post, className = "" }) {
  const imgRef = useRef(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = post?.cover_image?.url;

  // Handle images that are already cached by the browser.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [imageUrl]);

  const showImage = imageUrl && !imageFailed;

  return (
    <div
      className={`img-zoom relative overflow-hidden bg-surface-soft ${className}`}
    >
      {showImage ? (
        <>
          {!imageLoaded && (
            <div
              className="absolute inset-0 animate-pulse bg-surface-strong"
              aria-hidden="true"
            />
          )}

                  <img
              ref={imgRef}
              src={cld(imageUrl, 700)}
              srcSet={cldSrcSet(imageUrl, [400, 700, 1000])}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
              alt={
                post?.title
                  ? `${post.title} — Manyara Prive Vacations`
                  : "Manyara Prive Vacations travel blog"
              }
            /* inline transition keeps the opacity fade AND the shared zoom */
            style={{
              transition:
                "transform 800ms var(--ease-soft), opacity 400ms ease",
            }}
            className={`absolute inset-0 h-full w-full object-cover ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted">
          No image
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FEATURED CARD
============================================================ */

function FeaturedCard({ post }) {
  return (
    <Link
      to={`/blog/${post?.slug || post?.id}`}
      className={`group flex h-full w-full flex-col overflow-hidden ${CARD_RADIUS} border border-border bg-card shadow-travel-card hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2`}
    >
      <BlogImage post={post} className="aspect-[16/10] w-full shrink-0" />

      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <PostMeta post={post} />

        <h3 className="line-clamp-3 font-display text-2xl font-semibold leading-snug text-text-dark transition-colors duration-300 group-hover:text-primary sm:text-3xl">
          {post?.title}
        </h3>

        {post?.excerpt && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text sm:text-base sm:leading-7">
            {post.excerpt}
          </p>
        )}

        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-link sm:text-base">
          Read article
          <ArrowRight
            className="arrow-shift h-4 w-4 sm:h-5 sm:w-5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

/* ============================================================
   SUPPORTING CARD (compact, image beside text)
============================================================ */

function SideCard({ post }) {
  return (
    <Link
      to={`/blog/${post?.slug || post?.id}`}
      className={`group flex h-full min-h-[7.5rem] w-full overflow-hidden ${CARD_RADIUS} border border-border bg-card shadow-travel-card hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2`}
    >
      <BlogImage post={post} className="w-28 shrink-0 sm:w-44" />

      <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
        <PostMeta post={post} className="mb-2" />

        <h3 className="line-clamp-3 font-display text-lg font-semibold leading-snug text-text-dark transition-colors duration-300 group-hover:text-primary sm:text-xl">
          {post?.title}
        </h3>

        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-link">
          Read more
          <ArrowRight className="arrow-shift h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

/* ============================================================
   SKELETON (same layout as the real thing, so nothing jumps)
============================================================ */

function BlogSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid gap-5 sm:gap-6 lg:grid-cols-5 lg:gap-8"
    >
      <span className="sr-only">Loading blog posts…</span>

      {/* Featured */}
      <div
        className={`overflow-hidden ${CARD_RADIUS} border border-border bg-card shadow-travel-card lg:col-span-3`}
      >
        <div className="aspect-[16/10] w-full animate-pulse bg-surface-strong" />

        <div className="p-5 sm:p-7">
          <div className="h-3 w-28 animate-pulse rounded bg-surface-strong" />
          <div className="mt-5 h-7 w-4/5 animate-pulse rounded bg-surface-strong" />
          <div className="mt-2 h-7 w-3/5 animate-pulse rounded bg-surface-strong" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-surface-strong" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-surface-strong" />
        </div>
      </div>

      {/* Supporting */}
      <div className="flex flex-col gap-5 sm:gap-6 lg:col-span-2 lg:gap-8">
        {[1, 2].map((item) => (
          <div
            key={item}
            className={`flex min-h-[7.5rem] flex-1 overflow-hidden ${CARD_RADIUS} border border-border bg-card shadow-travel-card`}
          >
            <div className="w-28 shrink-0 animate-pulse bg-surface-strong sm:w-44" />

            <div className="flex-1 space-y-3 p-4 sm:p-5">
              <div className="h-3 w-24 animate-pulse rounded bg-surface-strong" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-surface-strong" />
              <div className="h-5 w-3/5 animate-pulse rounded bg-surface-strong" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   BLOG SECTION
============================================================ */

export default function BlogSection() {
  const [revealRef, inView] = useInView();

  /*
   * Shared cached query.
   * Cached data appears immediately when available; background
   * refresh updates the component through the useQuery subscription.
   */
  const { data: blogData, loading, error } = useQuery(getBlogs);

  /* Normalize all supported API response shapes. */
  const posts = (
    Array.isArray(blogData)
      ? blogData
      : Array.isArray(blogData?.items)
        ? blogData.items
        : Array.isArray(blogData?.blogs)
          ? blogData.blogs
          : []
  ).filter((post)=>post?.slug).slice(0, MAX_POSTS);

  /* ERROR */
  if (!loading && error && posts.length === 0) {
    console.error("Failed to load blogs:", error);

    return null;
  }

  /* Don't render the section when there is no blog content. */
  if (!loading && posts.length === 0) {
    return null;
  }

  const [featured, ...rest] = posts;
  const supporting = rest.slice(0, 2);

  return (
    <section
      id="blog"
      aria-busy={loading}
      className="relative w-full overflow-x-clip bg-gradient-to-b from-surface-soft to-background py-14 sm:py-16 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ====================================================
            SECTION HEADING
        ==================================================== */}
        <Reveal className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              <Newspaper className="h-4 w-4 shrink-0" aria-hidden="true" />
              Travel notes
            </p>

            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-text-dark sm:text-4xl lg:text-5xl">
              From the Blog
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-text sm:text-base sm:leading-7">
              Travel inspiration, destination guides, tips, and stories from
              Manyara Prive Vacations.
            </p>
          </div>

          {/* Desktop View All */}
          <Link
            to="/blog"
            className="group hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-link hover:text-primary sm:inline-flex"
          >
            <span className="link-reveal">View all posts</span>
            <ArrowRight className="arrow-shift h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>

        {/* ====================================================
            LOADING / POSTS
        ==================================================== */}
        {loading ? (
          <BlogSkeleton />
        ) : (
          <>
            <div
              ref={revealRef}
              data-inview={inView}
              className="grid gap-5 sm:gap-6 lg:grid-cols-5 lg:gap-8"
            >
              {/* Featured enters first */}
              <div
                className={`card-lift reveal-item flex ${CARD_RADIUS} ${
                  supporting.length > 0 ? "lg:col-span-3" : "lg:col-span-5"
                }`}
                style={{ "--i": 0 }}
              >
                <FeaturedCard post={featured} />
              </div>

              {/* Supporting articles follow, staggered */}
              {supporting.length > 0 && (
                <div className="flex flex-col gap-5 sm:gap-6 lg:col-span-2 lg:gap-8">
                  {supporting.map((post, index) => (
                    <div
                      key={post?.id || post?.slug}
                      className={`card-lift reveal-item flex flex-1 ${CARD_RADIUS}`}
                      style={{ "--i": index + 1 }}
                    >
                      <SideCard post={post} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ================================================
                MOBILE VIEW ALL
            ================================================ */}
            <div className="mt-8 flex justify-center sm:hidden">
              <Link
                to="/blog"
                className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                <span>View All Posts</span>
                <ArrowRight
                  className="arrow-shift h-4 w-4"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}









