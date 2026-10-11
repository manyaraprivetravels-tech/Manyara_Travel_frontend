


import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  ImageOff,
  Play,
} from "lucide-react";

import { getBlogBySlug } from "../../api/content";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import FAQSection from "../../components/FAQSection";

import { parseBlogContent, stripMediaTokens } from "../../utils/BlogContent";

/* Shared theme classes (tokens come from tailwind.config.js) */
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2";
const BODY_TEXT = "whitespace-pre-line text-[15px] leading-8 text-text sm:text-base";
const CAPTION = "mt-2 text-sm text-muted";

/* =========================================================
   YOUTUBE HELPERS
   Videos are stored as plain YouTube links inside the blog
   content ({{video:https://youtu.be/ID}}). Nothing is hosted
   on our side.
========================================================= */

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

const getYouTubeThumbnail = (id) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/**
 * Click-to-play embed. Shows the thumbnail first and only loads the
 * YouTube player (a heavy iframe) when the visitor presses play, which
 * keeps the page fast on phones. Uses the privacy-friendly
 * youtube-nocookie domain.
 */
function YouTubeEmbed({ id, title }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-divider bg-ink shadow-travel-card">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className={`group absolute inset-0 block h-full w-full ${FOCUS_RING}`}
        >
          <img
            src={getYouTubeThumbnail(id)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.03]"
          />

          <span
            className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent"
            aria-hidden="true"
          />

          <span
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-brand transition-transform duration-300 group-hover:scale-110 sm:h-[72px] sm:w-[72px]">
              <Play className="ml-1 h-6 w-6 fill-current sm:h-7 sm:w-7" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // =========================================================
  // FETCH BLOG
  // =========================================================
  useEffect(() => {
    let mounted = true;

    const loadPost = async () => {
      if (!slug) {
        if (mounted) {
          setPost(null);
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setNotFound(false);

        const response = await getBlogBySlug(slug);
        if (!mounted) return;

        // Handles both a direct blog object and { data: {...} }
        const blog = response?.data ?? response;

        if (!blog) {
          setPost(null);
          setNotFound(true);
          return;
        }

        setPost(blog);
      } catch (error) {
        console.error("Failed to load blog:", error);
        if (mounted) {
          setPost(null);
          setNotFound(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPost();

    return () => {
      mounted = false;
    };
  }, [slug]);

  // =========================================================
  // NORMALIZED BLOG DATA
  // =========================================================
  const coverImageUrl = useMemo(() => {
    if (!post?.cover_image) return "";
    if (typeof post.cover_image === "string") return post.cover_image;
    return post.cover_image?.url || "";
  }, [post]);

  const blogSlug = post?.slug || slug;
  const blogTitle = post?.title || "Manyara Prive Vacations Blog";
  const blogExcerpt =
    post?.excerpt ||
    "Travel inspiration, destination guides and holiday ideas from Manyara Prive VacationsaTrip Holiday.";
  const blogContent = post?.content || "";

  // Parsed once, used by the renderer and by the video structured data.
  const blocks = useMemo(
    () => (blogContent ? parseBlogContent(blogContent) || [] : []),
    [blogContent]
  );

  // =========================================================
  // READING TIME
  // =========================================================
  const readingTime = useMemo(() => {
    if (!blogContent) return null;

    const plainText = stripMediaTokens(blogContent).replace(/\s+/g, " ").trim();
    if (!plainText) return null;

    const wordCount = plainText.split(" ").filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [blogContent]);

  // =========================================================
  // BLOG CONTENT RENDERER
  // =========================================================
  const renderBlogContent = (content) => {
    if (!content) {
      return (
        <div className="rounded-2xl border border-divider bg-surface p-6 text-sm text-muted">
          No blog content is available.
        </div>
      );
    }

    if (!blocks.length) {
      return <div className={BODY_TEXT}>{content}</div>;
    }

    return blocks.map((block, index) => {
      // TEXT
      if (block?.type === "text") {
        if (!block.text?.trim()) return null;

        return (
          <div key={`text-${index}`} className={BODY_TEXT}>
            {block.text}
          </div>
        );
      }

      // GALLERY
      if (block?.type === "gallery") {
        const items = Array.isArray(block.items) ? block.items : [];
        if (!items.length) return null;

        return (
          <div
            key={`gallery-${index}`}
            className="my-8 grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            {items.map((item, imageIndex) => {
              const imageUrl = typeof item === "string" ? item : item?.url || "";
              const caption = typeof item === "object" ? item?.caption : "";

              if (!imageUrl) return null;

              return (
                <figure
                  key={`${imageUrl}-${imageIndex}`}
                  className="overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card"
                >
                  <img
                    src={imageUrl}
                    alt={caption || post?.title || "Manyara Prive VacationsaTrip Holiday travel image"}
                    className="h-auto w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />

                  {caption && (
                    <figcaption className="px-4 pb-3 text-sm text-muted">
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        );
      }

      // VIDEO
      if (block?.type === "video") {
        if (!block?.url) return null;

        const youTubeId = getYouTubeId(block.url);

        // YouTube link -> click-to-play embed
        if (youTubeId) {
          return (
            <figure key={`video-${index}`} className="my-8">
              <YouTubeEmbed
                id={youTubeId}
                title={block.caption || blogTitle}
              />

              {block.caption && (
                <figcaption className={CAPTION}>{block.caption}</figcaption>
              )}
            </figure>
          );
        }

        // Older posts that still have an uploaded video file
        return (
          <figure key={`video-${index}`} className="my-8">
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full rounded-2xl border border-divider shadow-travel-card"
            >
              <source src={block.url} type={block.type_mime || "video/mp4"} />
              Your browser does not support video playback.
            </video>

            {block.caption && <figcaption className={CAPTION}>{block.caption}</figcaption>}
          </figure>
        );
      }

      return null;
    });
  };

  // =========================================================
  // JSON-LD
  // =========================================================
  const jsonLd = useMemo(() => {
    if (!post) return null;

    const blogUrl = `${SITE_URL}/blog/${blogSlug}`;

    const blogPosting = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blogTitle,
      description: blogExcerpt,
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at || post.published_at || undefined,
      author: { "@type": "Organization", name: "Manyara Prive VacationsaTrip Holiday" },
      publisher: { "@type": "Organization", name: "Manyara Prive VacationsaTrip Holiday" },
      mainEntityOfPage: { "@type": "WebPage", "@id": blogUrl },
      url: blogUrl,
    };

    if (coverImageUrl) blogPosting.image = [coverImageUrl];

    // Manyara Prive Vacationse VideoObject per YouTube video in the post (helps video results in search)
    const videoIds = [
      ...new Set(
        blocks
          .filter((block) => block?.type === "video")
          .map((block) => getYouTubeId(block?.url))
          .filter(Boolean)
      ),
    ];

    const videoObjects = videoIds.map((id) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: blogTitle,
      description: blogExcerpt,
      thumbnailUrl: [getYouTubeThumbnail(id)],
      uploadDate: post.published_at || undefined,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      contentUrl: `https://www.youtube.com/watch?v=${id}`,
    }));

    return [
      blogPosting,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: blogTitle, item: blogUrl },
        ],
      },
      ...videoObjects,
    ];
  }, [post, blogSlug, blogTitle, blogExcerpt, coverImageUrl, blocks]);

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div
            className="flex flex-col items-center justify-center text-center"
            role="status"
          >
            <div
              className="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-primary-lighter border-t-accent motion-reduce:animate-none"
              aria-hidden="true"
            />
            <p className="text-sm text-muted sm:text-base">Loading blog...</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================
  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="Post not found" path={`/blog/${slug || ""}`} noindex />

        <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-lighter">
              <ImageOff className="h-7 w-7 text-primary" aria-hidden="true" />
            </div>

            <h1 className="font-display text-3xl font-semibold text-text-dark sm:text-4xl">
              Blog post not found
            </h1>

            <p className="mt-3 text-sm text-muted sm:text-base">
              This blog post may have been removed or the link may be incorrect.
            </p>

            <Link
              to="/blog"
              className={`mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-accent-hover ${FOCUS_RING}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to blog
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Seo
        title={blogTitle}
        description={blogExcerpt}
        path={`/blog/${blogSlug}`}
        image={coverImageUrl || undefined}
        type="article"
        jsonLd={jsonLd}
      />

      <main>
        {/* BREADCRUMB */}
        <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-xs text-muted sm:text-sm"
          >
            <Link to="/" className="transition-colors hover:text-link">
              Home
            </Link>

            <ChevronRight className="mx-1 h-3.5 w-3.5" aria-hidden="true" />

            <Link to="/blog" className="transition-colors hover:text-link">
              Blog
            </Link>

            <ChevronRight className="mx-1 h-3.5 w-3.5" aria-hidden="true" />

            <span
              className="max-w-[220px] truncate font-medium text-text-dark sm:max-w-lg"
              aria-current="page"
            >
              {blogTitle}
            </span>
          </nav>
        </section>

        {/* COVER IMAGE */}
        <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pt-9">
          {coverImageUrl ? (
            <div className="relative aspect-[16/8] w-full overflow-hidden rounded-2xl bg-surface-strong shadow-travel-card sm:rounded-3xl">
              <img
                src={coverImageUrl}
                alt={blogTitle}
                fetchPriority="high"
                width="1400"
                height="700"
                className="h-full w-full object-cover"
              />

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/30 to-transparent"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="flex aspect-[16/8] w-full items-center justify-center rounded-2xl bg-petal-gradient sm:rounded-3xl">
              <div className="flex flex-col items-center gap-2 text-placeholder">
                <ImageOff className="h-8 w-8" aria-hidden="true" />
                <p className="text-sm">No cover image available</p>
              </div>
            </div>
          )}
        </section>

        {/* BLOG HEADER */}
        <section className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-link transition-colors hover:text-link-hover hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to blog
          </Link>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-text-dark sm:text-5xl lg:text-[3.5rem]">
            {blogTitle}
          </h1>

          {(post.published_at || readingTime) && (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              {post.published_at && (
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />

                  <time dateTime={post.published_at}>
                    {new Date(post.published_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </p>
              )}

              {readingTime && (
                <p className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                  {readingTime} min read
                </p>
              )}
            </div>
          )}

          {blogExcerpt && (
            <div className="relative mt-7 rounded-2xl border border-primary/10 bg-surface-soft p-5 sm:p-7">
              <div
                className="absolute bottom-5 left-0 top-5 w-1 rounded-r-full bg-orange-gradient"
                aria-hidden="true"
              />

              <p className="pl-4 text-base leading-7 text-text sm:text-lg sm:leading-8">
                {blogExcerpt}
              </p>
            </div>
          )}
        </section>

        {/* BLOG CONTENT */}
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <article className="max-w-none space-y-5">
            {renderBlogContent(blogContent)}
          </article>
        </section>

        {/* BLOG CTA */}
        <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-brand-gradient p-6 sm:rounded-3xl sm:p-8 lg:p-10">
            <div
              className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(242,88,143,0.26),transparent_70%)]"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(200,19,94,0.12),transparent_70%)]"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <p className="text-sm font-semibold text-link">Plan your next journey</p>

              <h2 className="mt-2 font-display text-3xl font-semibold text-text-dark sm:text-4xl">
                Ready to explore it yourself?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-text sm:text-base">
                Discover beautiful destinations and carefully planned holiday
                packages with Manyara Prive VacationsaTrip Holiday.
              </p>

              <Link
                to="/packages"
                className={`mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-accent-hover sm:px-6 sm:text-base ${FOCUS_RING}`}
              >
                Explore packages
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <FAQSection />

        <Footer />
      </main>
    </div>
  );
}









