import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Newspaper, Play } from "lucide-react";
import { getBlogs } from "../api/content";
import useLoadMore from "../hooks/useLoadMore";
import Footer from "../components/Footer";
import Seo, { SITE_URL } from "../components/Seo";
import FAQSection from "../components/FAQSection";
import LoadMoreButton from "../components/LoadMoreButton";

/*
 * Stories shown first, and added on each "Load more" click.
 * The grid has 3 columns on large screens, so a multiple of 3
 * avoids a half-empty last row.
 */
const PAGE_SIZE = 9;

/** 11-character video id from any common YouTube link, or "". */
const getYouTubeId = (input) => {
  const value = String(input || "").trim();
  if (!value) return "";

  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`
    );

    const host = url.hostname.replace(/^www\.|^m\./, "");
    let id = "";

    if (host === "youtu.be") {
      id = url.pathname.split("/")[1] || "";
    } else if (
      host === "youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "music.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v") || "";
      } else {
        const match = url.pathname.match(
          /^\/(?:embed|shorts|live|v)\/([^/?]+)/
        );
        id = match ? match[1] : "";
      }
    }

    return /^[\w-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
};

/** First YouTube video id found anywhere in the post content, or "". */
const findFirstYouTubeId = (content) => {
  if (typeof content !== "string" || !content) return "";

  const urls = content.match(/https?:\/\/[^\s|}"')]+/g) || [];

  for (const url of urls) {
    const id = getYouTubeId(url);
    if (id) return id;
  }

  return "";
};

/** True if the post has any video token (YouTube or an older uploaded file). */
const hasVideoToken = (content) =>
  typeof content === "string" && /\{\{\s*video\s*:/i.test(content);

const getYouTubeThumbnail = (id) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogs()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  /* ========================================================
     LOAD MORE
     Show the first PAGE_SIZE stories, then reveal more on
     each "Load more" click. Goes back to the first batch
     whenever the list of posts changes.
     ======================================================== */

  const { visible, remaining, loadMore } = useLoadMore(posts, {
    pageSize: PAGE_SIZE,
    resetKey: String(posts.length),
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Manyara Prive Vacations Holiday Blog",
    url: `${SITE_URL}/blog`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post?.title,
      url: `${SITE_URL}/blog/${post?.slug || post?.id}`,
    })),
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-text">
      <Seo
        title="Travel Blog"
        description="Destination guides, packing tips, and honest travel stories from the Manyara Prive Vacations team."
        path="/blog"
        jsonLd={posts.length > 0 ? jsonLd : null}
      />

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-divider bg-petal-gradient">
        {/* Soft decorative brand glow */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-rose-100/40 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-ink-500 transition-colors hover:text-link"
            >
              Home
              <span
                className="h-1 w-1 rounded-full bg-rose-400"
                aria-hidden="true"
              />
              Travel Journal
            </Link>

            {/* Eyebrow */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3.5 py-1.5 shadow-travel-card backdrop-blur-sm">
              <Newspaper
                className="h-3.5 w-3.5 text-primary"
                aria-hidden="true"
              />

              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Travel notes
              </span>
            </div>

            {/* Heading */}
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-text-dark sm:text-5xl lg:text-6xl">
              Stories for the journeys
              <span className="block text-display">you dream about.</span>
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-2xl text-sm leading-7 text-text sm:text-base sm:leading-8">
              Destination guides, practical travel tips and inspiring stories
              to help you discover new places and plan meaningful journeys
              with Manyara Prive Vacations.
            </p>

            {/* Decorative divider */}
            <div className="mt-7 flex items-center gap-3">
              <span className="h-px w-12 bg-primary/60" />

              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
                Travel • Discover • Remember
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BLOG SECTION
      ========================================================= */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          {/* Section heading */}
          <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-primary">
                From our journal
              </p>

              <h2 className="mt-1.5 font-display text-3xl font-semibold leading-tight text-text-dark sm:text-4xl">
                Explore our latest stories
              </h2>
            </div>

            {!loading && posts.length > 0 && (
              <p className="text-xs font-medium text-ink-500">
                {posts.length} {posts.length === 1 ? "story" : "stories"}
              </p>
            )}
          </div>

          {/* =====================================================
              LOADING STATE
          ===================================================== */}
          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-4xl border border-divider bg-card shadow-travel-card"
                  aria-hidden="true"
                >
                  {/* Image skeleton */}
                  <div className="aspect-[16/10] animate-pulse bg-surface-strong" />

                  {/* Content skeleton */}
                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-surface-strong" />

                    <div className="h-6 w-4/5 animate-pulse rounded-full bg-surface-strong" />

                    <div className="h-3 w-full animate-pulse rounded-full bg-surface-strong" />

                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-strong" />

                    <div className="mt-5 border-t border-divider pt-4">
                      <div className="h-3 w-20 animate-pulse rounded-full bg-surface-strong" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =====================================================
              EMPTY STATE
          ===================================================== */}
          {!loading && posts.length === 0 && (
            <div className="relative overflow-hidden rounded-4xl border border-divider bg-petal-gradient px-6 py-16 text-center shadow-travel-card sm:px-10">
              {/* Decorative circle */}
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-rose-200/30 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft ring-1 ring-rose-200">
                  <Newspaper
                    className="h-7 w-7 text-primary"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-5 font-display text-2xl font-semibold text-text-dark">
                  Our journal is getting ready
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  We are preparing destination guides, travel inspiration and
                  useful tips for your next adventure.
                </p>

                <Link
                  to="/packages"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-orange"
                >
                  Explore Packages

                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          )}

          {/* =====================================================
              BLOG GRID + LOAD MORE
          ===================================================== */}
          {!loading && posts.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((post) => {
                  const coverUrl =
                    typeof post?.cover_image === "string"
                      ? post.cover_image
                      : post?.cover_image?.url || "";

                  const youTubeId = findFirstYouTubeId(post?.content);
                  const hasVideo =
                    Boolean(youTubeId) || hasVideoToken(post?.content);

                  // Cover image first; otherwise the video's thumbnail
                  const imageUrl =
                    coverUrl ||
                    (youTubeId ? getYouTubeThumbnail(youTubeId) : "");

                  return (
                    <Link
                      to={`/blog/${post?.slug || post?.id}`}
                      key={post?.id}
                      className="group flex h-full flex-col overflow-hidden rounded-4xl border border-divider bg-card shadow-travel-card transition-all duration-300 ease-soft hover:-translate-y-1 hover:border-rose-200 hover:shadow-travel-hover"
                    >
                      {/* =================================================
                          COVER IMAGE
                      ================================================= */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-surface-strong">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            loading="lazy"
                            decoding="async"
                            alt={post?.title || "Travel story"}
                            className="h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.045]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-petal-gradient">
                            <Newspaper
                              className="h-9 w-9 text-primary/20"
                              aria-hidden="true"
                            />
                          </div>
                        )}

                        {/* Soft image overlay */}
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/20 via-transparent to-transparent"
                          aria-hidden="true"
                        />

                        {/* Editorial badge */}
                        <div className="absolute left-4 top-4">
                          <span className="inline-flex items-center rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-text-dark shadow-travel-card backdrop-blur-sm">
                            Travel story
                          </span>
                        </div>

                        {/* Video badge */}
                        {hasVideo && (
                          <div className="absolute bottom-4 left-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white backdrop-blur-sm">
                              <Play
                                className="h-3 w-3 fill-current"
                                aria-hidden="true"
                              />
                              Video
                            </span>
                          </div>
                        )}
                      </div>

                      {/* =================================================
                          CONTENT
                      ================================================= */}
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        {/* Date */}
                        {post?.published_at && (
                          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                            <Calendar
                              className="h-3.5 w-3.5 text-primary"
                              aria-hidden="true"
                            />

                            {new Date(post.published_at).toLocaleDateString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        )}

                        {/* Title */}
                        <h2 className="mt-3 line-clamp-2 font-display text-xl font-semibold leading-snug text-text-dark transition-colors duration-300 group-hover:text-link sm:text-[22px]">
                          {post?.title}
                        </h2>

                        {/* Excerpt */}
                        {post?.excerpt && (
                          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-text-secondary">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="mt-5 flex items-center justify-between border-t border-divider pt-4">
                          <span className="text-xs font-medium text-muted">
                            Manyara Prive Vacations
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-link transition-all duration-300 group-hover:gap-2">
                            Read story

                            <ArrowRight
                              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <LoadMoreButton
                shown={visible.length}
                total={posts.length}
                remaining={remaining}
                pageSize={PAGE_SIZE}
                onClick={loadMore}
              />
            </>
          )}
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================= */}
      <section className="border-t border-divider bg-surface">
        <FAQSection />
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <Footer />
    </div>
  );
}