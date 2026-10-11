

import { Helmet } from "react-helmet-async";

const SITE_NAME = "Manyara Prive Vacations";
const SITE_URL = "https://manyaraprivevacations.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;

const DEFAULT_DESCRIPTION =
  "Discover thoughtfully planned travel packages, destinations, and memorable holidays with Manyara Prive Vacations.";

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  imageAlt = `${SITE_NAME} — Travel Packages and Vacations`,
  type = "website",
  noindex = false,
  keywords,
  jsonLd,
}) {
  // Make sure path always produces a clean canonical URL
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const canonical = `${SITE_URL}${normalizedPath}`;

  // Allow either a full image URL or a site-relative image path
  const absoluteImage = image.startsWith("http")
    ? image
    : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;

  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Travel Packages, Planned Simply`;

  const schemas = Array.isArray(jsonLd)
    ? jsonLd
    : jsonLd
      ? [jsonLd]
      : [];

  return (
    <Helmet>
      {/* =========================
          BASIC SEO
      ========================== */}

      <title>{fullTitle}</title>

      <meta name="description" content={description} />

      {keywords && (
        <meta name="keywords" content={keywords} />
      )}

      <meta
        name="robots"
        content={
          noindex
            ? "noindex, nofollow"
            : "index, follow"
        }
      />

      <link rel="canonical" href={canonical} />

      {/* =========================
          OPEN GRAPH
      ========================== */}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      {/* =========================
          TWITTER / X
      ========================== */}

      <meta
        name="twitter:card"
        content="summary_large_image"
      />

      <meta name="twitter:title" content={fullTitle} />

      <meta
        name="twitter:description"
        content={description}
      />

      <meta
        name="twitter:image"
        content={absoluteImage}
      />

      <meta
        name="twitter:image:alt"
        content={imageAlt}
      />

      {/* =========================
          BROWSER / MOBILE
      ========================== */}

      <meta
        name="theme-color"
        content="#C8135E"
      />

      {/* =========================
          STRUCTURED DATA
      ========================== */}

      {schemas.map((schema, index) => (
        <script
          key={`seo-schema-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export { SITE_NAME, SITE_URL, DEFAULT_IMAGE };




