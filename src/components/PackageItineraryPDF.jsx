

import React from "react";
import { getSiteSettings } from "../api/content"; // same API the Footer / Contact page use


/* ---------------------------------------------------------------------
   1. BRAND + THEME
--------------------------------------------------------------------- */

const BRAND = "Manyara Privé Vacations";
const TAGLINE = "Curated journeys. Effortless luxury.";
const SITE_URL = "https://manyaraprivevacations.com";
const SITE_LABEL = "manyaraprivevacations.com";
const LOGO_PATH = "/images/Manyara_3.webp"; // same logo the site footer uses (WebP is converted to PNG below)
const DEFAULT_COUNTRY_CODE = "91"; // used when a phone number is saved without a country code

// Mirrors tailwind.config.js + the site's theme-color (#FFF8F5)
const C = {
  ink: "#2F2A33",
  body: "#4A4A52",
  muted: "#7A747E",
  rose: "#C8135E",
  roseDeep: "#AB1050",
  roseSoft: "#FEF4F8",
  roseLine: "#FCD6E4",
  champagne: "#E8D2B4",
  champagneSoft: "#F7EBDB",
  gold: "#B08D57",
  line: "#EAE5E8",
  cream: "#FFF8F5", // page background
  white: "#FFFFFF", // cards
  logoBg: "#EEF1F5", // chip colour the site footer puts behind the logo
};

/* ---------------------------------------------------------------------
   2. PAGE GEOMETRY  (PDF points: A4 = 595.28 x 841.89)
--------------------------------------------------------------------- */

const PAGE_W = 595.28;
const MARGIN_X = 36; // left / right margin
const HEADER_H = 34; // slim running header (pages 2+)
const FOOTER_H = 52; // footer on every page: logo + contact + page number

const HERO_H = 250; // full-width cover photo
const HERO_OVERLAP = 44; // how far the title card overlaps the photo
const HERO_FOCUS_Y = 0.45; // 0 = keep top of photo, 1 = keep bottom
const DAY_W = 150; // itinerary photo, same size every day
const DAY_H = 111;

// If the description is longer than this it moves to page 2 so the cover never overflows.
const COVER_ABOUT_MAX_CHARS = 1000;

// Image resolution (pixels). PDF viewers zoom, so we keep plenty of detail.
const COVER_PX = 2200;
const DAY_PX = 900;
const LOGO_PX = 700;

/* ---------------------------------------------------------------------
   3. FONTS
   Loaded from jsDelivr (Fontsource) as .woff. Self-hosting is more
   reliable: put the same .woff/.ttf files in /public/fonts and change
   FONT_BASE to "/fonts" with matching file names.
   If a font fails to load, the PDF is rebuilt with built-in PDF fonts
   (Times / Helvetica) so the download never fails.
--------------------------------------------------------------------- */

const FONT_BASE = "https://cdn.jsdelivr.net/fontsource/fonts";
const CORM = `${FONT_BASE}/cormorant-garamond@latest`;
const INTER = `${FONT_BASE}/inter@latest`;

const WEB_FONTS = { serif: "Cormorant", sans: "Inter", ext: "InterExt", web: true };
const SAFE_FONTS = { serif: "Times-Roman", sans: "Helvetica", ext: "Helvetica", web: false };

let fontsRegistered = false;

function registerFonts(Font) {
  if (fontsRegistered) return;

  Font.register({
    family: "Cormorant",
    fonts: [
      { src: `${CORM}/latin-500-normal.woff`, fontWeight: 500 },
      { src: `${CORM}/latin-600-normal.woff`, fontWeight: 600 },
      { src: `${CORM}/latin-700-normal.woff`, fontWeight: 700 },
      { src: `${CORM}/latin-500-italic.woff`, fontWeight: 500, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: "Inter",
    fonts: [
      { src: `${INTER}/latin-400-normal.woff`, fontWeight: 400 },
      { src: `${INTER}/latin-500-normal.woff`, fontWeight: 500 },
      { src: `${INTER}/latin-600-normal.woff`, fontWeight: 600 },
    ],
  });

  // The Rupee sign lives in Inter's "latin-ext" subset: used for that one glyph only.
  Font.register({
    family: "InterExt",
    fonts: [
      { src: `${INTER}/latin-ext-400-normal.woff`, fontWeight: 400 },
      { src: `${INTER}/latin-ext-600-normal.woff`, fontWeight: 600 },
    ],
  });

  // No automatic hyphenation: words are never split mid-way.
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}

/* ---------------------------------------------------------------------
   4. THE DOCUMENT
--------------------------------------------------------------------- */

function buildDocument(R, ctx, F) {
  const { Document, Page, View, Text, Image, Link, Svg, Path, Circle } = R;
  const { pkg, title, eyebrow, has, itinerary, facilities, inclusions, exclusions, terms, cancellation, durationText, co } = ctx;

  // Built-in fonts only have regular/bold.
  const fw = (n) => (F.web ? n : n >= 600 ? 700 : 400);

  const T = (size, color, extra = {}) => ({ fontFamily: F.sans, fontSize: size, color, ...extra });
  const S = (size, color, extra = {}) => ({ fontFamily: F.serif, fontSize: size, color, fontWeight: fw(600), ...extra });

  const pad2 = (n) => String(n).padStart(2, "0");

  const card = {
    backgroundColor: C.white,
    borderWidth: 0.75,
    borderColor: C.champagne,
    borderRadius: 10,
  };

  /* ---------- small building blocks ---------- */

  const diamond = (key) => (
    <View key={key} style={{ width: 4.5, height: 4.5, marginTop: 5, backgroundColor: C.gold, transform: "rotate(45deg)" }} />
  );

  const tick = (key) => (
    <Svg key={key} width={12} height={12} viewBox="0 0 12 12" style={{ marginTop: 1 }}>
      <Circle cx={6} cy={6} r={6} fill={C.rose} />
      <Path d="M3.3 6.2 L5.2 8 L8.8 4.1" stroke="#FFFFFF" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );

  const cross = (key) => (
    <Svg key={key} width={12} height={12} viewBox="0 0 12 12" style={{ marginTop: 1 }}>
      <Circle cx={6} cy={6} r={5.5} fill="none" stroke={C.muted} strokeWidth={0.9} />
      <Path d="M4 4 L8 8 M8 4 L4 8" stroke={C.muted} strokeWidth={1} fill="none" strokeLinecap="round" />
    </Svg>
  );

  /* Logo on the same light chip the site footer uses; text wordmark as fallback. */
  const logoChip = (height, { padV = 5, padH = 10, radius = 8 } = {}) => {
    const box = {
      backgroundColor: C.logoBg,
      borderRadius: radius,
      paddingVertical: padV,
      paddingHorizontal: padH,
    };

    if (ctx.logo) {
      const w = (ctx.logo.w / ctx.logo.h) * height;
      return (
        <View style={box}>
          <Image src={ctx.logo.src} style={{ width: w, height }} />
        </View>
      );
    }

    return (
      <View style={{ ...box, alignItems: "center" }}>
        <Text style={S(height * 0.62, C.rose, { letterSpacing: height * 0.18, textTransform: "uppercase" })}>Manyara</Text>
        <Text style={T(Math.max(4.5, height * 0.2), C.gold, { fontWeight: fw(500), letterSpacing: height * 0.3 })}>PRIVÉ VACATIONS</Text>
      </View>
    );
  };

  /* Section heading: small gold label, serif title, hairline. Never left alone at the bottom of a page. */
  const heading = (label, text) => (
    <View wrap={false} minPresenceAhead={90} style={{ marginBottom: 12 }}>
      <Text style={T(7.5, C.gold, { fontWeight: fw(600), letterSpacing: 2.2, textTransform: "uppercase", marginBottom: 3 })}>{label}</Text>
      <Text style={S(24, C.roseDeep, { lineHeight: 1.2 })}>{text}</Text>
      <View style={{ height: 0.75, marginTop: 8, backgroundColor: C.champagne }} />
    </View>
  );

  const rupee = F.web ? <Text style={{ fontFamily: F.ext, fontWeight: fw(600) }}>{"\u20B9"}</Text> : "Rs. ";

  /* ---------- header (pages 2+) and footer (every page) ---------- */

  const header = () => (
    <View
      fixed
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_H,
        paddingHorizontal: MARGIN_X,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: C.cream,
        borderBottomWidth: 0.75,
        borderBottomColor: C.champagne,
      }}
    >
      <Text style={S(11, C.roseDeep, { letterSpacing: 1.6, textTransform: "uppercase" })}>{BRAND}</Text>
      <Text maxLines={1} style={T(7, C.gold, { fontWeight: fw(600), letterSpacing: 1.6, textTransform: "uppercase", maxWidth: 300, textAlign: "right" })}>
        {title}
        {durationText ? `  \u00B7  ${durationText}` : ""}
      </Text>
    </View>
  );

  // Contact details as ONE wrapping paragraph: if it is too long for a line it
  // goes to a second line instead of being cut off.
  const contactNodes = co.cells.flatMap((cell, i) => [
    i > 0 ? (
      <Text key={`sep-${i}`} style={{ color: C.gold }}>
        {"   \u2022   "}
      </Text>
    ) : null,
    <Link key={cell.href} src={cell.href} style={{ color: C.roseDeep, textDecoration: "none", fontWeight: fw(500) }}>
      {cell.text}
    </Link>,
  ]);

  const footer = () => (
    <View
      fixed
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: FOOTER_H,
        paddingHorizontal: MARGIN_X,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.cream,
        borderTopWidth: 0.75,
        borderTopColor: C.champagne,
      }}
    >
      <View style={{ flexShrink: 0 }}>{logoChip(15, { padV: 3, padH: 8, radius: 6 })}</View>
      <Text style={T(8, C.muted, { flex: 1, textAlign: "center", lineHeight: 1.6, paddingHorizontal: 14 })}>{contactNodes}</Text>
      <Text
        fixed
        style={T(8, C.gold, { width: 44, textAlign: "right", fontWeight: fw(600), letterSpacing: 1 })}
        render={({ pageNumber, totalPages }) => `${pad2(pageNumber)} / ${pad2(totalPages)}`}
      />
    </View>
  );

  /* ---------- cover ---------- */

  const titleSize = title.length <= 12 ? 40 : title.length <= 22 ? 33 : title.length <= 34 ? 27 : 22;
  const heroH = ctx.cover ? HERO_H : 150;

  const stat = (label, value, first) => (
    <View
      key={label}
      style={{
        flex: 1,
        paddingTop: 10,
        paddingBottom: 12,
        paddingLeft: first ? 0 : 18,
        borderLeftWidth: first ? 0 : 0.75,
        borderLeftColor: C.line,
      }}
    >
      <Text style={T(7, C.gold, { fontWeight: fw(600), letterSpacing: 2, marginBottom: 4 })}>{label}</Text>
      {value}
    </View>
  );

  const stats = [];
  if (durationText) {
    stats.push(["DURATION", <Text style={T(14, C.ink, { fontWeight: fw(600) })}>{durationText}</Text>]);
  }
  if (has(pkg.price)) {
    stats.push([
      "STARTING FROM",
      <Text style={T(14, C.rose, { fontWeight: fw(600) })}>
        {rupee}
        {formatPrice(pkg.price)}
        <Text style={T(8.5, C.muted, { fontWeight: fw(400) })}>{"  per person"}</Text>
      </Text>,
    ]);
  }

  const cover = () => (
    <View>
      <View style={{ width: PAGE_W, height: heroH, backgroundColor: C.champagneSoft }}>
        {ctx.cover ? <Image src={ctx.cover.src} style={{ width: PAGE_W, height: heroH }} /> : null}
        <View style={{ position: "absolute", left: MARGIN_X, top: 22 }}>{logoChip(28, { padV: 6, padH: 12, radius: 9 })}</View>
      </View>

      <View style={{ ...card, borderRadius: 14, marginTop: -HERO_OVERLAP, marginHorizontal: MARGIN_X, paddingTop: 18, paddingHorizontal: 22, paddingBottom: stats.length ? 0 : 18 }}>
        <Text style={T(8, C.gold, { fontWeight: fw(600), letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 6 })}>{eyebrow}</Text>
        <Text style={S(titleSize, C.roseDeep, { lineHeight: 1.1 })}>{title}</Text>
        <View style={{ width: 42, height: 2.2, borderRadius: 2, backgroundColor: C.rose, marginTop: 11 }} />
        {stats.length ? (
          <View style={{ flexDirection: "row", marginTop: 14, borderTopWidth: 0.75, borderTopColor: C.line }}>
            {stats.map(([label, value], i) => stat(label, value, i === 0))}
          </View>
        ) : null}
      </View>
    </View>
  );

  /* ---------- sections ---------- */

  const about = (onCover) =>
    pkg.description ? (
      <View style={{ marginTop: onCover ? 24 : 0 }}>
        {heading("The Experience", "About This Journey")}
        <Text style={T(9.8, C.body, { lineHeight: 1.7 })}>{clean(pkg.description)}</Text>
      </View>
    ) : null;

  const dayRow = (day, index) => {
    const n = has(day?.day) ? day.day : index + 1;
    const isLast = index === itinerary.length - 1;
    const description = day?.description ? clean(day.description).trim() : "";
    const photo = ctx.dayImages[index];

    return (
      <View
        key={`day-${index}`}
        wrap={description.length > 1200}
        style={{ flexDirection: "row", paddingBottom: 12, position: "relative" }}
      >
        {isLast ? null : (
          <View style={{ position: "absolute", left: 17.5, top: 40, bottom: 0, width: 0.75, backgroundColor: C.champagne }} />
        )}

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1.1,
            borderColor: C.rose,
            backgroundColor: C.white,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={T(5, C.gold, { fontWeight: fw(600), letterSpacing: 1.2 })}>DAY</Text>
          <Text style={T(12, C.rose, { fontWeight: fw(600), marginTop: 1 })}>{pad2(n)}</Text>
        </View>

        <View style={{ ...card, flex: 1, flexDirection: "row", alignItems: "flex-start", padding: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={S(16, C.ink, { lineHeight: 1.25 })}>{clean(day?.title) || `Day ${n}`}</Text>
            {description ? <Text style={T(9, C.body, { lineHeight: 1.65, marginTop: 5 })}>{description}</Text> : null}
          </View>
          {photo ? <Image src={photo.src} style={{ width: DAY_W, height: DAY_H, borderRadius: 7, marginLeft: 12 }} /> : null}
        </View>
      </View>
    );
  };

  const itinerarySection = () =>
    itinerary.length ? (
      <View style={{ marginTop: 24 }}>
        {heading("Your Journey", "Day-by-Day Itinerary")}
        {itinerary.map(dayRow)}
      </View>
    ) : null;

  const columnsFor = (count, max) => (count <= 2 ? Math.max(1, count) : count === 4 ? 2 : max);

  const facilitiesSection = () => {
    if (!facilities.length) return null;
    const cols = columnsFor(facilities.length, 3);

    return (
      <View style={{ marginTop: 24 }}>
        {heading("Comforts", "Facilities")}
        <View wrap={facilities.length > 30} style={{ ...card, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 5 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {facilities.map((item, i) => (
              <View key={`fac-${i}`} wrap={false} style={{ width: `${100 / cols}%`, flexDirection: "row", paddingRight: 10, paddingBottom: 8 }}>
                {diamond(`d-${i}`)}
                <Text style={T(9.4, C.body, { flex: 1, lineHeight: 1.45, marginLeft: 7 })}>{clean(item)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const panel = (key, label, items, marker, bg, border, titleColor) => (
    <View key={key} style={{ flex: 1, backgroundColor: bg, borderWidth: 0.75, borderColor: border, borderRadius: 10, padding: 13, paddingBottom: 6 }}>
      <Text style={S(16.5, titleColor, { marginBottom: 8 })}>{label}</Text>
      {items.map((item, i) => (
        <View key={`${key}-${i}`} wrap={false} style={{ flexDirection: "row", marginBottom: 6 }}>
          {marker(`${key}-m-${i}`)}
          <Text style={T(9.4, C.body, { flex: 1, lineHeight: 1.45, marginLeft: 7 })}>{clean(item)}</Text>
        </View>
      ))}
    </View>
  );

  const coverageSection = () => {
    if (!inclusions.length && !exclusions.length) return null;

    return (
      <View style={{ marginTop: 24 }}>
        {heading("The Details", "What\u2019s Included")}
        <View wrap={Math.max(inclusions.length, exclusions.length) > 18} style={{ flexDirection: "row" }}>
          {inclusions.length ? panel("inc", "Inclusions", inclusions, tick, C.roseSoft, C.roseLine, C.roseDeep) : null}
          {inclusions.length && exclusions.length ? <View style={{ width: 12 }} /> : null}
          {exclusions.length ? panel("exc", "Exclusions", exclusions, cross, C.white, C.line, C.ink) : null}
        </View>
      </View>
    );
  };

  /* "Refunds: text" -> bold "Refunds:" followed by the text */
  const policyPoint = (text, i) => {
    const match = text.match(/^([^:\n]{2,50}):\s+(\S[\s\S]*)$/);

    return (
      <Text key={`pt-${i}`} style={T(9, C.muted, { lineHeight: 1.65, marginBottom: 6 })}>
        {match ? (
          <>
            <Text style={{ fontWeight: fw(600), color: C.ink }}>{`${match[1]}: `}</Text>
            {match[2]}
          </>
        ) : (
          text
        )}
      </Text>
    );
  };

  const policySection = (label, text, items) =>
    items.length ? (
      <View style={{ marginTop: 24 }}>
        {heading(label, text)}
        {items.map(policyPoint)}
      </View>
    ) : null;

  const closing = () => (
    <View wrap={false} style={{ marginTop: 28, alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 46, height: 0.75, backgroundColor: C.champagne }} />
        <View style={{ width: 5.5, height: 5.5, marginHorizontal: 10, backgroundColor: C.gold, transform: "rotate(45deg)" }} />
        <View style={{ width: 46, height: 0.75, backgroundColor: C.champagne }} />
      </View>
      <View style={{ marginTop: 14 }}>{logoChip(30, { padV: 7, padH: 14, radius: 10 })}</View>
      <Text style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: fw(500), fontSize: 15, color: C.roseDeep, marginTop: 12 }}>{TAGLINE}</Text>
      <Text style={T(8, C.muted, { marginTop: 4 })}>{`Thank you for choosing ${BRAND}.`}</Text>
    </View>
  );

  /* ---------- assemble ---------- */

  const aboutOnCover = Boolean(pkg.description) && String(pkg.description).length <= COVER_ABOUT_MAX_CHARS;

  return (
    <Document
      title={`${title} - ${BRAND}`}
      author={BRAND}
      subject={`${title} itinerary`}
      creator={BRAND}
      producer={BRAND}
      keywords={[title, ctx.destination, "itinerary", "travel package"].filter(Boolean).join(", ")}
    >
      {/* PAGE 1: cover */}
      <Page size="A4" style={{ backgroundColor: C.cream, fontFamily: F.sans, paddingBottom: FOOTER_H + 12 }}>
        {cover()}
        {aboutOnCover ? <View style={{ marginHorizontal: MARGIN_X }}>{about(true)}</View> : null}
        {footer()}
      </Page>

      {/* PAGE 2+: flowing content */}
      <Page
        size="A4"
        style={{
          backgroundColor: C.cream,
          fontFamily: F.sans,
          paddingTop: HEADER_H + 20,
          paddingBottom: FOOTER_H + 16,
          paddingHorizontal: MARGIN_X,
        }}
      >
        {header()}
        {aboutOnCover ? null : about(false)}
        {itinerarySection()}
        {facilitiesSection()}
        {coverageSection()}
        {policySection("Please Note", "Terms & Conditions", terms)}
        {policySection("Good to Know", "Cancellation Policy", cancellation)}
        {closing()}
        {footer()}
      </Page>
    </Document>
  );
}

/* =====================================================================
   5. ENGINE
===================================================================== */

/**
 * @param pkg           package object
 * @param siteSettings  optional - pass the object you already have from
 *                      getSiteSettings(); if omitted it is fetched here.
 * @returns the downloaded file name
 */
export const generatePackagePDF = async (pkg, siteSettings = null) => {
  if (!pkg) {
    throw new Error("Package information is required to generate the PDF.");
  }

  // Loaded only when the user clicks "Download": keeps the main bundle small.
  // If the site was redeployed while this tab was open the old chunk no longer exists:
  // retry once, then ask for a refresh instead of a vague failure.
  let R;
  try {
    R = await import("@react-pdf/renderer");
  } catch (importError) {
    console.warn("PDF library chunk failed to load, retrying once:", importError);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      R = await import("@react-pdf/renderer");
    } catch (retryError) {
      throw new Error("The site was updated while this page was open. Please refresh the page (Ctrl+Shift+R) and try again.");
    }
  }

  /* ---- Normalize data ---- */
  const has = (v) => v !== null && v !== undefined && v !== "";

  const itinerary = (Array.isArray(pkg.itinerary) ? [...pkg.itinerary] : []).sort(
    (a, b) => Number(a?.day ?? 0) - Number(b?.day ?? 0)
  );

  const pick = (...keys) => {
    for (const k of keys) {
      const v = pkg[k];
      if (Array.isArray(v) ? v.length : has(v)) return v;
    }
    return null;
  };

  const facilities = normalizeList(pick("facilities", "amenities"));
  const inclusions = normalizeList(pick("inclusions", "inclusion", "included"));
  const exclusions = normalizeList(pick("exclusions", "exclusion", "excluded"));
  const terms = normalizePolicy(pick("terms_and_conditions", "terms", "terms_conditions"));
  const cancellation = normalizePolicy(pick("cancellation_policy", "cancellation"));

  const images = Array.isArray(pkg.images) ? pkg.images : [];
  const rawCover = images.length ? getImageUrl(images[0]) : null;

  const title = clean(pkg.title) || "Travel Package";
  const destination = has(pkg.destination) ? clean(pkg.destination).trim() : "";
  // "Dubai" above a title that is also "Dubai" looks like a typo: use a neutral label instead.
  const eyebrow =
    destination && destination.toLowerCase() !== title.trim().toLowerCase() ? destination : "Curated Journey";

  const durationText = has(pkg.duration_days)
    ? `${pkg.duration_days} Days${has(pkg.duration_nights) ? ` / ${pkg.duration_nights} Nights` : ""}`
    : "";

  /* ---- Company details: dynamic, same source as Footer.jsx ---- */
  const settings = siteSettings || (await fetchSettings());
  const co = buildCompany(settings);

  /* ---- Images: cropped to the exact frame + converted to JPEG/PNG (react-pdf cannot read WebP) ---- */
  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}${LOGO_PATH}` : null;

  const [logo, cover, ...dayImages] = await Promise.all([
    loadImage(logoUrl, { maxPx: LOGO_PX, type: "png" }),
    loadImage(optimizeUrl(rawCover, 2400), { maxPx: COVER_PX, ratio: PAGE_W / HERO_H, focusY: HERO_FOCUS_Y }),
    ...itinerary.map((d) => loadImage(optimizeUrl(getImageUrl(d?.image), 1000), { maxPx: DAY_PX, ratio: DAY_W / DAY_H })),
  ]);

  const ctx = {
    pkg,
    title,
    eyebrow,
    destination,
    has,
    itinerary,
    facilities,
    inclusions,
    exclusions,
    terms,
    cancellation,
    durationText,
    co,
    logo,
    cover,
    dayImages,
  };

  /* ---- Render ---- */
  const fileName = `${slugify(title)}-itinerary.pdf`;
  let blob;

  try {
    registerFonts(R.Font);
    blob = await R.pdf(buildDocument(R, ctx, WEB_FONTS)).toBlob();
  } catch (fontError) {
    // Most likely a font file could not be downloaded: rebuild with built-in fonts.
    console.warn("PDF with web fonts failed, retrying with built-in fonts:", fontError);
    blob = await R.pdf(buildDocument(R, ctx, SAFE_FONTS)).toBlob();
  }

  downloadBlob(blob, fileName);
  return fileName;
};

/* ---------------------------------------------------------------------
   Company details (footer on every page)
--------------------------------------------------------------------- */

/** Same API as Footer.jsx; never blocks the PDF for more than 4s. */
async function fetchSettings() {
  try {
    return await Promise.race([getSiteSettings(), new Promise((resolve) => setTimeout(() => resolve(null), 4000))]);
  } catch (error) {
    console.warn("Could not load site settings for the PDF:", error);
    return null;
  }
}

/** Returns { cells: [{ text, href }] } : email, phone, (WhatsApp), website. */
function buildCompany(data) {
  const email = String(data?.email_address || "").trim();
  const phone = String(data?.phone_number || "").trim();
  const whatsapp = String(data?.whatsapp_number || "").trim();

  const phoneDigits = phone.replace(/\D/g, "");
  const waDigitsRaw = whatsapp.replace(/\D/g, "");

  // Numbers saved without a country code get the default one.
  const withCode = (digits) => (digits.length === 10 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits);
  const telDigits = withCode(phoneDigits);
  const waDigits = withCode(waDigitsRaw);

  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hello ${BRAND}, I would like to know more about your travel packages.`)}`
    : "";

  // Call and WhatsApp are often the same number: show it once.
  const sameNumber = phoneDigits && waDigitsRaw && phoneDigits.slice(-10) === waDigitsRaw.slice(-10);

  const cells = [];
  if (email) cells.push({ text: email, href: `mailto:${email}` });
  if (telDigits) cells.push({ text: phone, href: `tel:+${telDigits}` });
  if (waDigits && !sameNumber) cells.push({ text: `WhatsApp ${whatsapp}`, href: waHref });
  cells.push({ text: SITE_LABEL, href: SITE_URL });

  return { cells };
}

/* ---------------------------------------------------------------------
   Images
--------------------------------------------------------------------- */

/**
 * Loads an image, optionally crops it to `ratio` (width / height, like
 * CSS object-fit: cover), caps it at `maxPx` wide (never upscales) and
 * returns { src: dataURL, w, h }. JPEG for photos, PNG for the logo
 * (keeps transparency). Returns null if the image cannot be loaded.
 */
async function loadImage(url, { maxPx = 1200, ratio = null, focusY = 0.5, type = "jpeg", quality = 0.92 } = {}) {
  if (!url) return null;

  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image failed to load"));
      setTimeout(() => reject(new Error("Image timed out")), 15000);
      el.src = url;
    });

    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (!sw || !sh) return null;

    if (ratio) {
      if (sw / sh > ratio) {
        const nw = sh * ratio; // too wide: trim the sides
        sx = (sw - nw) / 2;
        sw = nw;
      } else {
        const nh = sw / ratio; // too tall: trim top / bottom
        sy = (sh - nh) * focusY;
        sh = nh;
      }
    }

    const outW = Math.max(1, Math.min(Math.round(sw), maxPx));
    const outH = Math.max(1, Math.round((outW * sh) / sw));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;

    const g = canvas.getContext("2d");
    if (type === "jpeg") {
      g.fillStyle = "#FFFFFF";
      g.fillRect(0, 0, outW, outH);
    }
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    return {
      src: canvas.toDataURL(type === "png" ? "image/png" : "image/jpeg", quality),
      w: outW,
      h: outH,
    };
  } catch (error) {
    console.warn("PDF image skipped:", url, error);
    return null;
  }
}

/** Cloudinary: resized JPEG, never upscaled (c_limit). */
function optimizeUrl(url, width) {
  if (!url) return null;

  if (
    url.includes("res.cloudinary.com") &&
    url.includes("/upload/") &&
    !/\/upload\/(?:[a-z]{1,3}_[^/]*\/)+/.test(url)
  ) {
    return url.replace("/upload/", `/upload/f_jpg,q_auto:best,w_${width},c_limit/`);
  }

  return url;
}

function getImageUrl(image) {
  if (!image) return null;
  if (typeof image === "string") return image.trim() || null;
  if (typeof image === "object") {
    return image.url || image.secure_url || image.src || image.image_url || null;
  }
  return null;
}

/* ---------------------------------------------------------------------
   Data helpers
--------------------------------------------------------------------- */

/** Removes emoji / symbols the PDF fonts cannot draw (they would show as empty boxes). */
function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\u00A0/g, " ");
}

function normalizeListItem(item) {
  if (item === null || item === undefined) return "";
  if (typeof item === "object") {
    return String(item.name || item.title || item.description || item.text || item.value || "").trim();
  }
  return String(item).trim();
}

const BREAK_CHARS = /[\r\n\u2022\u25AA\u25CF]/; // new line, or a bullet character
const stripBullet = (text) => text.replace(/^[\s\-\u2013\u2014*\u00B7]+/, "").trim();

function splitText(text) {
  const value = String(text || "");
  const parts = BREAK_CHARS.test(value) ? value.split(/\r?\n|[\u2022\u25AA\u25CF]/) : value.split(/[,;]/);

  return parts.map(stripBullet).filter(Boolean);
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    const items = value.map(normalizeListItem).filter(Boolean);

    // A single saved string: treat it like plain text.
    if (items.length === 1) return splitText(items[0]);

    return items.flatMap((item) => (BREAK_CHARS.test(item) ? splitText(item) : [stripBullet(item)]));
  }

  if (typeof value === "string") return splitText(value);
  return [];
}

/** Each line of a policy becomes its own point. */
function normalizePolicy(value) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  return source
    .flatMap((item) => normalizeListItem(item).split(/\r?\n+/))
    .map(stripBullet)
    .filter(Boolean);
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "0";

  const number = Number(price);
  if (Number.isNaN(number)) return String(price);

  return number.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "package"
  );
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default generatePackagePDF;




























































// import { getSiteSettings } from "../api/content"; // same API the Footer / Contact page use


// /* ---------------------------------------------------------------------
//    1. BRAND + THEME
// --------------------------------------------------------------------- */

// const BRAND = "Manyara Privé Vacations";
// const TAGLINE = "Curated journeys. Effortless luxury.";
// const SITE_URL = "https://manyaraprivevacations.com";
// const SITE_LABEL = "manyaraprivevacations.com";
// const LOGO_PATH = "/images/Manyara_3.webp"; // same logo the site footer uses
// const DEFAULT_COUNTRY_CODE = "91"; // used when a phone number is saved without a country code

// // Light palette. Mirrors tailwind.config.js + the site's theme-color (#FFF8F5)
// const C = {
//   ink: "#2F2A33",
//   body: "#4A4A52",
//   muted: "#7A747E",
//   rose: "#C8135E",
//   roseDeep: "#AB1050",
//   roseSoft: "#FEF4F8",
//   roseLine: "#FCD6E4",
//   champagne: "#E8D2B4",
//   champagneSoft: "#F7EBDB",
//   gold: "#B08D57",
//   line: "#EAE5E8",
//   cream: "#FFF8F5", // page background
//   white: "#FFFFFF", // cards
//   logoBg: "#EEF1F5", // chip colour the site footer puts behind the logo
// };

// const SERIF = `'Cormorant Garamond','Playfair Display',Georgia,serif`;
// const SANS = `Inter,system-ui,Arial,sans-serif`;

// // Cormorant draws digits "old-style" (1 looks like I). Ask for lining digits.
// const LINING = `font-variant-numeric:lining-nums;font-feature-settings:'lnum' 1;`;

// const FONT_URL =
//   "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap";

// /* ---------------------------------------------------------------------
//    2. PAGE GEOMETRY  (CSS px, 794px = A4 width)
// --------------------------------------------------------------------- */

// const PAGE_W = 794;
// const CONTENT_X = 48; // left/right margin
// const CONTENT_W = PAGE_W - CONTENT_X * 2; // 698

// const BAR_TOP_H = 44; // slim running header (pages 2+)
// const BAR_BOTTOM_H = 36; // compact footer (every page)
// const TOP_SPACE = 68; // content starts this far below the top of pages 2+
// const BOTTOM_SPACE = 58; // content ends this far above the bottom of a page
// const MAX_STRETCH = 44; // max extra space per block when filling a page

// const HERO_H = 340; // full-width cover photo height
// const HERO_OVERLAP = 60; // how far the title card overlaps the photo
// const HERO_FOCUS_Y = 0.45; // 0 = keep top of photo, 1 = keep bottom, 0.5 = centre
// const DAY_IMG_W = 200; // itinerary photo (same size for every day)
// const DAY_IMG_H = 148;

// function getGeometry() {
//   const isMobile =
//     typeof navigator !== "undefined" &&
//     /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
//   const scale = isMobile ? 1.2 : 1.5; // lower scale on phones = less memory
//   const pageH = Math.floor((PAGE_W * scale * 297) / 210) / scale;
//   return { scale, pageH };
// }

// /* ---------------------------------------------------------------------
//    3. DESIGN  -  "Light Editorial"
//    Full-width cover photo + logo, floating title card, contact strip,
//    timeline itinerary (photo on the right), closing note with contact
//    details, compact footer with contact details.
// --------------------------------------------------------------------- */

// const DESIGN = {
//   build(ctx) {
//     const { pkg, title, eyebrow, has, itinerary, facilities, inclusions, exclusions, terms, cancellation, durationText } = ctx;

//     /* Section heading: small gold label, serif title, hairline */
//     const heading = (label, text, atom = true) => `
//       <div ${atom ? "data-atom data-keep" : ""} style="margin:0 0 16px;">
//         <div style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:${C.gold};margin-bottom:4px;">${escapeHTML(label)}</div>
//         <div style="font-family:${SERIF};${LINING}font-size:32px;font-weight:600;color:${C.roseDeep};line-height:1.2;">${escapeHTML(text)}</div>
//         <div style="height:1px;margin-top:10px;background:linear-gradient(to right,${C.champagne},rgba(232,210,180,0));"></div>
//       </div>`;

//     /* ---------- COVER: full-width photo, logo + contact on it, title card below ---------- */
//     const heroH = ctx.coverImage ? HERO_H : 200;
//     const heroPhoto = ctx.coverImage
//       ? photoBox(ctx.coverImage, ctx.coverSize, PAGE_W, heroH, "", HERO_FOCUS_Y)
//       : "";

//     const titleSize = title.length <= 12 ? 54 : title.length <= 22 ? 44 : title.length <= 34 ? 36 : 30;

//     const statDefs = [];
//     if (durationText) {
//       statDefs.push({
//         label: "DURATION",
//         html: `<span style="font-family:${SANS};font-size:19px;font-weight:600;color:${C.ink};">${escapeHTML(durationText)}</span>`,
//       });
//     }
//     if (has(pkg.price)) {
//       statDefs.push({
//         label: "STARTING FROM",
//         html: `<span style="font-family:${SANS};font-size:19px;font-weight:600;color:${C.rose};">\u20B9${escapeHTML(formatPrice(pkg.price))}</span> <span style="font-family:${SANS};font-size:11px;color:${C.muted};">per person</span>`,
//       });
//     }

//     const statsHTML = statDefs.length
//       ? `<div style="display:flex;margin-top:18px;border-top:1px solid ${C.line};">
//            ${statDefs
//              .map(
//                (s, i) => `
//                <div style="flex:1;min-width:0;padding:14px 0 16px ${i ? 24 : 0}px;${i ? `border-left:1px solid ${C.line};` : ""}">
//                  <div style="font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.26em;color:${C.gold};margin-bottom:5px;">${s.label}</div>
//                  ${s.html}
//                </div>`
//              )
//              .join("")}
//          </div>`
//       : "";

//     const coverHTML = `
//       <div data-atom style="position:relative;width:${PAGE_W}px;">
//         <div style="position:relative;width:${PAGE_W}px;height:${heroH}px;overflow:hidden;background:linear-gradient(135deg,${C.roseSoft},${C.champagneSoft});">
//           ${heroPhoto}
//           <div style="position:absolute;left:${CONTENT_X}px;top:26px;">
//             ${logoChip(ctx, 36, { pad: "8px 16px" })}
//           </div>
//         </div>

//         <div style="position:relative;margin:-${HERO_OVERLAP}px ${CONTENT_X}px 0;box-sizing:border-box;padding:24px 30px ${statDefs.length ? 0 : 24}px;background:${C.white};border:1px solid ${C.champagne};border-radius:18px;box-shadow:0 14px 34px rgba(120,60,80,.12);">
//           <div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:${C.gold};margin-bottom:8px;">${escapeHTML(eyebrow)}</div>
//           <div style="font-family:${SERIF};${LINING}font-size:${titleSize}px;font-weight:600;line-height:1.1;color:${C.roseDeep};">${escapeHTML(title)}</div>
//           <div style="width:56px;height:3px;border-radius:3px;background:${C.rose};margin-top:14px;"></div>
//           ${statsHTML}
//         </div>

//         ${contactStrip(ctx)}
//       </div>`;

//     /* ---------- ABOUT ---------- */
//     const aboutHTML = pkg.description
//       ? `<div data-stretch style="margin-top:32px;">
//            ${heading("The Experience", "About This Journey")}
//            ${paragraph(pkg.description, 13, C.body, 1.8)}
//          </div>`
//       : "";

//     /* ---------- ITINERARY: timeline, photo always on the right ---------- */
//     const dayRow = (day, index) => {
//       const n = has(day?.day) ? day.day : index + 1;
//       const label = String(n).padStart(2, "0");
//       const isLast = index === itinerary.length - 1;
//       const description = day?.description ? String(day.description).trim() : "";

//       const url = ctx.dayUrls[index];
//       const size = url ? ctx.sizes.get(url) : null;
//       const photo = photoBox(url, size, DAY_IMG_W, DAY_IMG_H, "border-radius:10px;");

//       return `
//         <div data-atom data-padstretch style="position:relative;display:flex;gap:16px;padding-bottom:18px;">
//           ${isLast ? "" : `<div style="position:absolute;left:23px;top:52px;bottom:0;width:1px;background:${C.champagne};"></div>`}

//           <div style="flex:none;width:48px;height:48px;box-sizing:border-box;border-radius:50%;background:${C.white};border:1.5px solid ${C.rose};display:flex;flex-direction:column;align-items:center;justify-content:center;">
//             <span style="font-family:${SANS};font-size:6.5px;font-weight:600;letter-spacing:.18em;color:${C.gold};line-height:1;padding-left:.18em;">DAY</span>
//             <span style="font-family:${SANS};font-size:16px;font-weight:600;color:${C.rose};line-height:1.1;margin-top:2px;">${escapeHTML(label)}</span>
//           </div>

//           <div style="flex:1;min-width:0;box-sizing:border-box;display:flex;gap:16px;align-items:flex-start;background:${C.white};border:1px solid ${C.champagne};border-radius:14px;padding:16px;">
//             <div style="flex:1;min-width:0;">
//               <div style="font-family:${SERIF};${LINING}font-size:21px;font-weight:600;color:${C.ink};line-height:1.25;">${escapeHTML(day?.title || `Day ${n}`)}</div>
//               ${
//                 description
//                   ? `<div style="font-family:${SANS};font-size:12px;line-height:1.65;color:${C.body};margin-top:6px;white-space:pre-line;">${escapeHTML(description)}</div>`
//                   : ""
//               }
//             </div>
//             ${photo ? `<div style="flex:none;width:${DAY_IMG_W}px;">${photo}</div>` : ""}
//           </div>
//         </div>`;
//     };

//     const itineraryHTML = itinerary.length
//       ? `<div data-stretch style="margin-top:34px;">
//            ${heading("Your Journey", "Day-by-Day Itinerary")}
//            ${itinerary.map(dayRow).join("")}
//          </div>`
//       : "";

//     /* ---------- FACILITIES ---------- */
//     const facilitiesHTML = facilities.length
//       ? `<div data-stretch style="margin-top:34px;">
//            <div data-atom>
//              ${heading("Comforts", "Facilities", false)}
//              <div style="background:${C.white};border:1px solid ${C.champagne};border-radius:14px;padding:18px 18px 9px;">
//                ${itemGrid(facilities, DIAMOND, columnsFor(facilities.length, 3))}
//              </div>
//            </div>
//          </div>`
//       : "";

//     /* ---------- INCLUSIONS / EXCLUSIONS ---------- */
//     const incPanel = inclusions.length
//       ? panel("Inclusions", itemGrid(inclusions, TICK, 1), C.roseSoft, C.roseLine, C.roseDeep)
//       : "";
//     const excPanel = exclusions.length
//       ? panel("Exclusions", itemGrid(exclusions, CROSS, 1), C.white, C.line, C.ink)
//       : "";

//     const coverageHTML =
//       incPanel || excPanel
//         ? `<div data-stretch style="margin-top:34px;">
//              ${heading("The Details", "What\u2019s Included")}
//              <div data-atom style="display:flex;gap:14px;align-items:stretch;">${incPanel}${excPanel}</div>
//            </div>`
//         : "";

//     /* ---------- POLICIES ---------- */
//     const policyHTML = (label, text, items) =>
//       items.length
//         ? `<div data-stretch style="margin-top:34px;">
//              ${heading(label, text)}
//              ${items.map(policyPoint).join("")}
//            </div>`
//         : "";

//     /* ---------- CLOSING NOTE: tagline + thank you + contact details ---------- */
//     const closingHTML = `
//       <div data-atom style="margin-top:34px;text-align:center;">
//         <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
//           <span style="width:56px;height:1px;background:${C.champagne};"></span>
//           <span style="width:7px;height:7px;background:${C.gold};transform:rotate(45deg);"></span>
//           <span style="width:56px;height:1px;background:${C.champagne};"></span>
//         </div>
//         <div style="font-family:${SERIF};font-size:20px;font-style:italic;font-weight:500;color:${C.roseDeep};margin-top:12px;">${escapeHTML(TAGLINE)}</div>
//         <div style="font-family:${SANS};font-size:10px;color:${C.muted};margin-top:5px;">Thank you for choosing ${escapeHTML(BRAND)}.</div>
//         ${contactRow(ctx)}
//       </div>`;

//     return `
//       ${coverHTML}
//       <div style="padding:0 ${CONTENT_X}px;">
//         ${aboutHTML}
//         ${itineraryHTML}
//         ${facilitiesHTML}
//         ${coverageHTML}
//         ${policyHTML("Please Note", "Terms & Conditions", terms)}
//         ${policyHTML("Good to Know", "Cancellation Policy", cancellation)}
//         ${closingHTML}
//       </div>`;
//   },

//   /**
//    * Running header (pages 2+) and compact footer (every page).
//    * These are absolutely positioned on top of the long page, one per page.
//    */
//   bars(root, { PAGE_H, totalPages, ctx }) {
//     const pad2 = (n) => String(n).padStart(2, "0");

//     const dot = `<span style="display:inline-block;width:4px;height:4px;background:${C.gold};transform:rotate(45deg);margin:0 10px 1px;"></span>`;
//     const contact = ctx.co.cells
//       .map(
//         (cell) =>
//           `<a href="${escapeHTML(cell.href)}" style="color:${C.roseDeep};text-decoration:none;font-weight:500;">${escapeHTML(cell.text)}</a>`
//       )
//       .join(dot);

//     const out = [];

//     for (let p = 0; p < totalPages; p++) {
//       if (p >= 1) {
//         out.push(`
//           <div style="position:absolute;left:0;top:${p * PAGE_H}px;width:${PAGE_W}px;height:${BAR_TOP_H}px;box-sizing:border-box;padding:0 ${CONTENT_X}px;display:flex;align-items:center;justify-content:space-between;background:${C.cream};border-bottom:1px solid ${C.champagne};">
//             ${logoChip(ctx, 18, { pad: "4px 10px", radius: 8, shadow: "" })}
//             <span style="font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.22em;color:${C.gold};text-transform:uppercase;white-space:nowrap;max-width:420px;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(ctx.title)}${ctx.durationText ? ` &nbsp;&middot;&nbsp; ${escapeHTML(ctx.durationText)}` : ""}</span>
//           </div>`);
//       }

//       out.push(`
//         <div style="position:absolute;left:0;top:${(p + 1) * PAGE_H - BAR_BOTTOM_H}px;width:${PAGE_W}px;height:${BAR_BOTTOM_H}px;box-sizing:border-box;padding:0 ${CONTENT_X}px;display:flex;align-items:center;justify-content:space-between;gap:16px;background:${C.cream};border-top:1px solid ${C.champagne};">
//           <div style="min-width:0;font-family:${SANS};font-size:9.5px;white-space:nowrap;overflow:hidden;">${contact}</div>
//           <span style="flex:none;font-family:${SANS};font-size:9.5px;font-weight:600;letter-spacing:.18em;color:${C.gold};white-space:nowrap;">${pad2(p + 1)} <span style="color:${C.champagne};">/</span> ${pad2(totalPages)}</span>
//         </div>`);
//     }

//     root.insertAdjacentHTML("beforeend", out.join(""));
//   },
// };

// /* =====================================================================
//    4. ENGINE  (design-independent)
//    ===================================================================== */

// /**
//  * @param pkg           package object
//  * @param siteSettings  optional - pass the object you already have from
//  *                      getSiteSettings(); if omitted it is fetched here.
//  */
// export const generatePackagePDF = async (pkg, siteSettings = null) => {
//   if (!pkg) {
//     throw new Error("Package information is required to generate the PDF.");
//   }

//   // Loaded only when the user clicks "Download": keeps the main bundle small.
//   // If the site was redeployed while this tab was open, the old chunk file no longer
//   // exists on the server: retry once, then ask for a refresh instead of a vague failure.
//   let html2pdf;
//   try {
//     ({ default: html2pdf } = await import("html2pdf.js"));
//   } catch (importError) {
//     console.warn("html2pdf chunk failed to load, retrying once:", importError);
//     try {
//       await new Promise((resolve) => setTimeout(resolve, 600));
//       ({ default: html2pdf } = await import("html2pdf.js"));
//     } catch (retryError) {
//       throw new Error(
//         "The site was updated while this page was open. Please refresh the page (Ctrl+Shift+R) and try again."
//       );
//     }
//   }
//   const { scale: SCALE, pageH: PAGE_H } = getGeometry();

//   /* ---- Normalize data ---- */
//   const has = (v) => v !== null && v !== undefined && v !== "";

//   const itinerary = (Array.isArray(pkg.itinerary) ? [...pkg.itinerary] : []).sort(
//     (a, b) => Number(a?.day ?? 0) - Number(b?.day ?? 0)
//   );

//   const pick = (...keys) => {
//     for (const k of keys) {
//       const v = pkg[k];
//       if (Array.isArray(v) ? v.length : has(v)) return v;
//     }
//     return null;
//   };

//   const facilities = normalizeList(pick("facilities", "amenities"));
//   const inclusions = normalizeList(pick("inclusions", "inclusion", "included"));
//   const exclusions = normalizeList(pick("exclusions", "exclusion", "excluded"));
//   const terms = normalizePolicy(pick("terms_and_conditions", "terms", "terms_conditions"));
//   const cancellation = normalizePolicy(pick("cancellation_policy", "cancellation"));

//   const images = Array.isArray(pkg.images) ? pkg.images : [];
//   const rawCover = images.length ? getImageUrl(images[0]) : null;

//   const title = pkg.title || "Travel Package";
//   const destination = has(pkg.destination) ? String(pkg.destination).trim() : "";
//   // "Dubai" above a title that is also "Dubai" looks like a typo: use a neutral label instead.
//   const eyebrow =
//     destination && destination.toLowerCase() !== String(title).trim().toLowerCase()
//       ? destination
//       : "Curated Journey";

//   const durationText = has(pkg.duration_days)
//     ? `${pkg.duration_days} Days${has(pkg.duration_nights) ? ` / ${pkg.duration_nights} Nights` : ""}`
//     : "";

//   /* ---- Company details: dynamic, same source as Footer.jsx ---- */
//   const settings = siteSettings || (await fetchSettings());
//   const co = buildCompany(settings);

//   /* ---- Fonts + images MUST be ready before we measure anything ---- */
//   await ensureFonts();

//   const logoUrl = typeof window !== "undefined" ? `${window.location.origin}${LOGO_PATH}` : null;
//   const coverUrl = optimizeUrl(rawCover, 1800);
//   const dayUrls = itinerary.map((d) => optimizeUrl(getImageUrl(d?.image), 700));
//   const sizes = await preloadImages([logoUrl, coverUrl, ...dayUrls]);

//   const coverImage = coverUrl && sizes.has(coverUrl) ? coverUrl : null;

//   // Everything the design needs, in one object
//   const ctx = {
//     pkg,
//     title,
//     eyebrow,
//     has,
//     itinerary,
//     facilities,
//     inclusions,
//     exclusions,
//     terms,
//     cancellation,
//     durationText,
//     co,
//     logoUrl,
//     logoSize: logoUrl && sizes.has(logoUrl) ? sizes.get(logoUrl) : null,
//     coverImage,
//     coverSize: coverImage ? sizes.get(coverImage) : null,
//     dayUrls,
//     sizes,
//   };

//   /* ---- Off-screen container (must be in the DOM so it can be measured) ---- */
//   const container = document.createElement("div");
//   Object.assign(container.style, {
//     position: "absolute",
//     left: "-10000px",
//     top: "0",
//     width: `${PAGE_W}px`,
//     backgroundColor: C.cream,
//     zIndex: "999999",
//     pointerEvents: "none",
//     overflow: "visible",
//   });

//   container.innerHTML = `
//     <div style="position:relative;width:${PAGE_W}px;background:${C.cream};color:${C.body};font-family:${SANS};line-height:1.5;box-sizing:border-box;">
//       ${DESIGN.build(ctx)}
//     </div>`;

//   document.body.appendChild(container);

//   try {
//     const pdfContent = container.firstElementChild;
//     if (!pdfContent) throw new Error("PDF content could not be created.");

//     await waitForContainerImages(pdfContent);
//     await nextFrame();

//     splitParagraphsIntoLines(pdfContent); // text can break between lines
//     paginate(pdfContent, PAGE_H); // cards never cross a page edge
//     balancePages(pdfContent, PAGE_H); // spread leftover space: no big white gaps
//     const totalPages = finishLayout(pdfContent, PAGE_H);
//     DESIGN.bars(pdfContent, { PAGE_H, totalPages, ctx });
//     await nextFrame();

//     const fileName = `${slugify(title)}-itinerary.pdf`;

//     const buildOptions = (links, scale) => ({
//       margin: 0,
//       filename: fileName,
//       image: { type: "jpeg", quality: 0.98 },
//       enableLinks: links, // <a href> become clickable PDF links
//       html2canvas: {
//         scale,
//         useCORS: true, // needed for Cloudinary images
//         allowTaint: false,
//         logging: false,
//         backgroundColor: C.cream,
//         imageTimeout: 15000,
//         scrollX: 0,
//         scrollY: 0,
//         windowWidth: PAGE_W,
//         windowHeight: Math.max(pdfContent.scrollHeight, 1123),
//       },
//       jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
//       pagebreak: { mode: ["css"] },
//     });

//     const exportPdf = (options) =>
//       html2pdf()
//         .set(options)
//         .from(pdfContent)
//         .toPdf()
//         .get("pdf")
//         .then((pdf) => {
//           // Rounding can leave a stray blank page at the end: drop it.
//           let count = pdf.internal.getNumberOfPages();
//           while (count > totalPages && count > 1) {
//             pdf.deletePage(count);
//             count -= 1;
//           }
//         })
//         .save();

//     // 1) clickable links  2) same look without link annotations  3) lighter render.
//     // The first attempt that works wins, so one odd link or a memory limit never blocks the download.
//     const attempts = [
//       { links: true, scale: SCALE },
//       { links: false, scale: SCALE },
//       { links: false, scale: Math.min(SCALE, 1) },
//     ];

//     let lastError = null;
//     for (const attempt of attempts) {
//       try {
//         await exportPdf(buildOptions(attempt.links, attempt.scale));
//         lastError = null;
//         break;
//       } catch (error) {
//         lastError = error;
//         console.warn(`PDF attempt failed (links: ${attempt.links}, scale: ${attempt.scale}):`, error);
//         document.querySelectorAll(".html2pdf__overlay").forEach((el) => el.remove());
//       }
//     }
//     if (lastError) throw lastError;

//     return fileName;
//   } catch (error) {
//     console.error("PDF GENERATION FAILED:", error);
//     throw error;
//   } finally {
//     container.remove(); // always clean up the off-screen copy
//   }
// };

// /* ---------------------------------------------------------------------
//    Building blocks used by the design
// --------------------------------------------------------------------- */

// // Markers are drawn with plain shapes (no font glyphs) so they always sit centred.
// const DIAMOND = `<span style="flex:none;width:6px;height:6px;margin-top:7px;background:${C.gold};transform:rotate(45deg);"></span>`;
// const TICK = `<span style="flex:none;position:relative;width:16px;height:16px;margin-top:1px;border-radius:50%;background:${C.rose};"><span style="position:absolute;left:5.5px;top:2.5px;width:4px;height:8px;border:solid #fff;border-width:0 1.8px 1.8px 0;transform:rotate(45deg);"></span></span>`;
// const CROSS = `<span style="flex:none;position:relative;width:16px;height:16px;margin-top:1px;box-sizing:border-box;border-radius:50%;border:1px solid ${C.muted};"><span style="position:absolute;left:3.5px;top:6px;width:7px;height:1.5px;background:${C.muted};transform:rotate(45deg);"></span><span style="position:absolute;left:3.5px;top:6px;width:7px;height:1.5px;background:${C.muted};transform:rotate(-45deg);"></span></span>`;

// /* lead = number of leading words shown in bold ("Refunds:" -> 1) */
// const paragraph = (text, size, color, lineHeight, { lead = 0, leadColor = C.ink } = {}) =>
//   `<div data-lines ${
//     lead ? `data-lead="${lead}" data-leadstyle="font-weight:600;color:${leadColor};"` : ""
//   } style="font-family:${SANS};font-size:${size}px;line-height:${lineHeight};color:${color};margin:0 0 8px;white-space:pre-line;">${escapeHTML(text)}</div>`;

// const policyPoint = (text) => {
//   const match = text.match(/^([^:\n]{2,50}):\s+\S/);
//   const lead = match ? `${match[1]}:`.split(/\s+/).length : 0;
//   return paragraph(text, 11.5, C.muted, 1.7, { lead, leadColor: C.ink });
// };

// const columnsFor = (count, max) => (count <= 2 ? Math.max(1, count) : count === 4 ? 2 : max);

// const itemGrid = (items, marker, columns) => `
//   <div style="display:flex;flex-wrap:wrap;">
//     ${items
//       .map(
//         (item) => `
//         <div style="flex:0 0 ${(100 / columns).toFixed(4)}%;box-sizing:border-box;padding:0 12px 9px 0;display:flex;gap:9px;align-items:flex-start;">
//           ${marker}
//           <span style="min-width:0;font-family:${SANS};font-size:12.5px;line-height:1.5;color:${C.body};">${escapeHTML(item)}</span>
//         </div>`
//       )
//       .join("")}
//   </div>`;

// const panel = (title, body, bg, border, titleColor) => `
//   <div style="flex:1;min-width:0;background:${bg};border:1px solid ${border};border-radius:14px;padding:18px 18px 9px;box-sizing:border-box;">
//     <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${titleColor};margin-bottom:10px;line-height:1.2;">
//       ${escapeHTML(title)}
//     </div>
//     ${body}
//   </div>`;

// /* Logo on the same light chip the site footer uses; text wordmark as fallback. */
// const logoChip = (ctx, height, { pad = "8px 16px", radius = 12, shadow = "0 6px 18px rgba(0,0,0,.18)" } = {}) => {
//   const box = `display:inline-block;background:${C.logoBg};border-radius:${radius}px;padding:${pad};${shadow ? `box-shadow:${shadow};` : ""}`;

//   if (ctx.logoSize && ctx.logoSize.w && ctx.logoSize.h) {
//     const w = Math.round((ctx.logoSize.w / ctx.logoSize.h) * height);
//     return `
//       <div style="${box}">
//         <img src="${escapeHTML(ctx.logoUrl)}" crossorigin="anonymous" alt="${escapeHTML(BRAND)}"
//              style="display:block;width:${w}px;height:${height}px;" />
//       </div>`;
//   }

//   return `
//     <div style="${box}text-align:center;">
//       <div style="font-family:${SERIF};font-size:${Math.round(height * 0.62)}px;font-weight:600;letter-spacing:.3em;color:${C.rose};text-transform:uppercase;padding-left:.3em;line-height:1.2;">Manyara</div>
//       <div style="font-family:${SANS};font-size:${Math.max(6, Math.round(height * 0.2))}px;font-weight:500;letter-spacing:.5em;color:${C.gold};margin-top:2px;padding-left:.5em;">PRIVÉ VACATIONS</div>
//     </div>`;
// };

// /**
//  * Contact strip shown right under the cover title card (before the package info).
//  * Equal-height cells separated by thin dividers; every detail is a clickable link.
//  */
// const contactStrip = (ctx) => {
//   const cells = ctx.co.cells;
//   if (!cells.length) return "";

//   const items = cells
//     .map(
//       (cell, i) => `
//         <a href="${escapeHTML(cell.href)}" style="display:block;flex:1 1 auto;box-sizing:border-box;padding:0 16px;text-align:center;text-decoration:none;${i ? `border-left:1px solid ${C.roseLine};` : ""}">
//           <div style="font-family:${SANS};font-size:8px;font-weight:600;letter-spacing:.24em;color:${C.gold};">${escapeHTML(cell.label)}</div>
//           <div style="font-family:${SANS};font-size:11.5px;font-weight:500;line-height:1.35;color:${C.roseDeep};margin-top:4px;white-space:nowrap;">${escapeHTML(cell.value)}</div>
//         </a>`
//     )
//     .join("");

//   return `
//     <div style="margin:16px ${CONTENT_X}px 0;box-sizing:border-box;padding:14px 14px 15px;background:${C.roseSoft};border:1px solid ${C.roseLine};border-radius:14px;">
//       <div style="font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.3em;text-align:center;color:${C.roseDeep};margin-bottom:11px;">PLAN THIS JOURNEY WITH US</div>
//       <div style="display:flex;align-items:flex-start;justify-content:space-between;">
//         ${items}
//       </div>
//     </div>`;
// };

// /**
//  * Contact details for the closing note: a centred row under the tagline.
//  * Wraps onto a second line (still centred) if all four details are shown.
//  */
// const contactRow = (ctx) => {
//   const cells = ctx.co.cells;
//   if (!cells.length) return "";

//   const items = cells
//     .map(
//       (cell) => `
//         <a href="${escapeHTML(cell.href)}" style="display:block;text-align:center;text-decoration:none;">
//           <div style="font-family:${SANS};font-size:8px;font-weight:600;letter-spacing:.24em;color:${C.gold};">${escapeHTML(cell.label)}</div>
//           <div style="font-family:${SANS};font-size:11.5px;font-weight:500;line-height:1.35;color:${C.roseDeep};margin-top:3px;white-space:nowrap;">${escapeHTML(cell.value)}</div>
//         </a>`
//     )
//     .join("");

//   return `
//     <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px 30px;margin-top:18px;padding:14px 20px;box-sizing:border-box;background:${C.white};border:1px solid ${C.champagne};border-radius:14px;">
//       ${items}
//     </div>`;
// };

// /**
//  * Photo that fills a w x h box (same idea as CSS object-fit: cover).
//  * html2canvas does not support object-fit, so we scale and position the
//  * image ourselves. focusY decides which part is kept when it is cropped.
//  */
// function photoBox(url, size, w, h, extraStyle = "", focusY = 0.5) {
//   if (!url || !size || !size.w || !size.h) return "";

//   const k = Math.max(w / size.w, h / size.h);
//   const iw = Math.round(size.w * k);
//   const ih = Math.round(size.h * k);
//   const left = Math.round((w - iw) / 2);
//   const top = -Math.round((ih - h) * focusY);

//   return `
//     <div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;${extraStyle}">
//       <img src="${escapeHTML(url)}" crossorigin="anonymous" alt=""
//            style="position:absolute;left:${left}px;top:${top}px;width:${iw}px;height:${ih}px;display:block;" />
//     </div>`;
// }

// /* ---------------------------------------------------------------------
//    Company details (cover, closing note and footer)
// --------------------------------------------------------------------- */

// /** Same API as Footer.jsx; never blocks the PDF for more than 4s. */
// async function fetchSettings() {
//   try {
//     return await Promise.race([
//       getSiteSettings(),
//       new Promise((resolve) => setTimeout(() => resolve(null), 4000)),
//     ]);
//   } catch (error) {
//     console.warn("Could not load site settings for the PDF:", error);
//     return null;
//   }
// }

// /**
//  * Returns { cells: [{ label, value, text, href }] } : email, phone, (WhatsApp), website.
//  *  - label + value : used by the cover chip and the closing note
//  *  - text          : single-line version used by the page footer
//  */
// function buildCompany(data) {
//   const email = String(data?.email_address || "").trim();
//   const phone = String(data?.phone_number || "").trim();
//   const whatsapp = String(data?.whatsapp_number || "").trim();

//   const phoneDigits = phone.replace(/\D/g, "");
//   const waDigitsRaw = whatsapp.replace(/\D/g, "");

//   // Numbers saved without a country code get the default one.
//   const withCode = (digits) => (digits.length === 10 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits);
//   const telDigits = withCode(phoneDigits);
//   const waDigits = withCode(waDigitsRaw);

//   const waHref = waDigits
//     ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
//         `Hello ${BRAND}, I would like to know more about your travel packages.`
//       )}`
//     : "";

//   // Call and WhatsApp are often the same number: show it once.
//   const sameNumber =
//     phoneDigits && waDigitsRaw && phoneDigits.slice(-10) === waDigitsRaw.slice(-10);

//   const cells = [];
//   if (email) {
//     cells.push({ label: "EMAIL", value: email, text: email, href: `mailto:${email}` });
//   }
//   if (telDigits) {
//     cells.push({
//       label: sameNumber ? "CALL / WHATSAPP" : "CALL",
//       value: phone,
//       text: phone,
//       href: `tel:+${telDigits}`,
//     });
//   }
//   if (waDigits && !sameNumber) {
//     cells.push({ label: "WHATSAPP", value: whatsapp, text: `WhatsApp ${whatsapp}`, href: waHref });
//   }
//   cells.push({ label: "WEBSITE", value: SITE_LABEL, text: SITE_LABEL, href: SITE_URL });

//   return { cells };
// }

// /* ---------------------------------------------------------------------
//    Pagination
//    The long HTML page is later cut into A4 slices. These functions make
//    sure a card or text line is never cut in half by a slice.
// --------------------------------------------------------------------- */

// /**
//  * Replace every [data-lines] block with one atom per rendered line, so a
//  * page break can fall BETWEEN lines instead of through one. Optional
//  * data-lead="N" makes the first N words bold (policy labels).
//  */
// function splitParagraphsIntoLines(root) {
//   root.querySelectorAll("[data-lines]").forEach((p) => {
//     const rows = p.textContent
//       .split(/\n+/)
//       .map((r) => r.trim())
//       .filter(Boolean);
//     if (!rows.length) return;

//     const leadCount = Number(p.getAttribute("data-lead") || 0);
//     const leadStyle = p.getAttribute("data-leadstyle") || "font-weight:600;";

//     // 1) wrap every word in a span so we can ask the browser where it landed
//     p.style.whiteSpace = "normal";
//     p.innerHTML = rows
//       .map((row, r) =>
//         row
//           .split(/\s+/)
//           .map((word, i) => {
//             const isLead = r === 0 && i < leadCount;
//             return `<span data-r="${r}"${isLead ? ` data-b="1" style="${leadStyle}"` : ""}>${escapeHTML(word)}</span>`;
//           })
//           .join(" ")
//       )
//       .join("<br>");

//     // 2) group the words by their vertical position = the rendered lines
//     const groups = [];
//     p.querySelectorAll("span").forEach((s) => {
//       const top = s.getBoundingClientRect().top;
//       const word = { text: s.textContent, bold: s.hasAttribute("data-b") };
//       const last = groups[groups.length - 1];

//       if (last && Math.abs(last.top - top) < 4) last.words.push(word);
//       else groups.push({ top, row: Number(s.getAttribute("data-r")), words: [word] });
//     });

//     // 3) one block per line
//     p.innerHTML = groups
//       .map((g, i) => {
//         const gap = i > 0 && g.row !== groups[i - 1].row ? "margin-top:6px;" : "";
//         const html = g.words
//           .map((w) => (w.bold ? `<span style="${leadStyle}">${escapeHTML(w.text)}</span>` : escapeHTML(w.text)))
//           .join(" ");

//         return `<div data-atom style="white-space:nowrap;${gap}">${html}</div>`;
//       })
//       .join("");
//   });
// }

// const rootTopOf = (root) => root.getBoundingClientRect().top;
// const topOf = (root, el) => el.getBoundingClientRect().top - rootTopOf(root);
// const pageStartOf = (PAGE_H, n) => (n === 0 ? 0 : n * PAGE_H + TOP_SPACE);
// const pageEndOf = (PAGE_H, n) => (n + 1) * PAGE_H - BOTTOM_SPACE;

// /** Pushes `el` down to `target` with a spacer. isBreak marks a real page break. */
// function pushTo(root, el, target, isBreak = false) {
//   const gap = target - topOf(root, el);
//   if (gap <= 0.5) return;

//   const spacer = document.createElement("div");
//   spacer.style.height = `${gap}px`;
//   if (isBreak) spacer.setAttribute("data-page-break", "1");
//   el.parentNode.insertBefore(spacer, el);

//   const drift = target - topOf(root, el);
//   if (Math.abs(drift) > 0.5) spacer.style.height = `${gap + drift}px`;
// }

// /**
//  * Push atoms that would cross a page edge to the start of the next
//  * page. Usable area of page n (n >= 1):
//  *   [n * PAGE_H + TOP_SPACE, (n + 1) * PAGE_H - BOTTOM_SPACE]
//  */
// function paginate(root, PAGE_H) {
//   const items = Array.from(root.querySelectorAll("[data-atom]"));

//   items.forEach((el, i) => {
//     const top = topOf(root, el);
//     const n = Math.max(0, Math.floor((top + 0.5) / PAGE_H));

//     const rect = el.getBoundingClientRect();
//     let height = rect.height;

//     // Headings stay with whatever comes next.
//     const next = items[i + 1];
//     if (el.hasAttribute("data-keep") && next) {
//       height = next.getBoundingClientRect().bottom - rect.top;
//     }

//     // Starts inside the top padding of a page -> move below it.
//     if (top < pageStartOf(PAGE_H, n) - 0.5) {
//       pushTo(root, el, pageStartOf(PAGE_H, n));
//     }

//     const t = topOf(root, el);
//     const page = Math.max(0, Math.floor((t + 0.5) / PAGE_H));
//     const fits = height <= pageEndOf(PAGE_H, page) - pageStartOf(PAGE_H, page);

//     if (fits && t + height > pageEndOf(PAGE_H, page) + 0.5) {
//       pushTo(root, el, pageStartOf(PAGE_H, page + 1), true);
//     }
//   });
// }

// /**
//  * Spread the spare room at the bottom of a page over the blocks above it, so
//  * pages end evenly instead of leaving a gap.
//  *  - data-stretch     : a spacer is added before the block
//  *  - data-padstretch  : the block itself grows (its padding-bottom), which
//  *                       keeps the timeline line unbroken
//  */
// function balancePages(root, PAGE_H) {
//   const breaks = Array.from(root.querySelectorAll("[data-page-break]"));

//   breaks.forEach((spacer) => {
//     const anchor = spacer.nextElementSibling;
//     if (!anchor) return;

//     const spacerTop = topOf(root, spacer);
//     const pageIdx = Math.max(0, Math.floor((spacerTop + 0.5) / PAGE_H));
//     const start = pageStartOf(PAGE_H, pageIdx);
//     const end = pageEndOf(PAGE_H, pageIdx);

//     const spare = end - spacerTop - 4;
//     if (spare < 8) return;

//     const targets = Array.from(root.querySelectorAll("[data-stretch],[data-padstretch]")).filter((el) => {
//       const t = topOf(root, el);
//       return t >= start + 8 && t < spacerTop - 1;
//     });
//     if (!targets.length) return;

//     const per = Math.min(MAX_STRETCH, spare / targets.length);
//     const before = topOf(root, anchor);

//     targets.forEach((el) => {
//       if (el.hasAttribute("data-padstretch")) {
//         const current = parseFloat(getComputedStyle(el).paddingBottom) || 0;
//         el.style.paddingBottom = `${current + per}px`;
//       } else {
//         const extra = document.createElement("div");
//         extra.style.height = `${per}px`;
//         el.parentNode.insertBefore(extra, el);
//       }
//     });

//     // Margin collapsing can make the shift differ slightly: cancel the drift
//     // so the next page still starts in the same place.
//     for (let pass = 0; pass < 2; pass++) {
//       const drift = topOf(root, anchor) - before;
//       if (Math.abs(drift) <= 0.5) break;

//       const current = parseFloat(spacer.style.height) || spacer.getBoundingClientRect().height;
//       spacer.style.height = `${Math.max(0, current - drift)}px`;
//     }
//   });
// }

// /** Counts pages from the last block and fixes the document height. */
// function finishLayout(root, PAGE_H) {
//   let bottom = 0;
//   root.querySelectorAll("[data-atom]").forEach((el) => {
//     bottom = Math.max(bottom, topOf(root, el) + el.getBoundingClientRect().height);
//   });

//   const totalPages = Math.max(1, Math.floor((bottom - 0.5) / PAGE_H) + 1);
//   // 1px short so rounding can never create an extra blank page.
//   root.style.height = `${totalPages * PAGE_H - 1}px`;
//   root.style.overflow = "hidden";
//   return totalPages;
// }

// /* ---------------------------------------------------------------------
//    Fonts / images
// --------------------------------------------------------------------- */

// async function ensureFonts() {
//   try {
//     const hasFace = Array.from(document.fonts).some(
//       (f) => f.family.replace(/["']/g, "") === "Cormorant Garamond"
//     );

//     if (!hasFace && !document.getElementById("manyara-pdf-fonts")) {
//       const link = document.createElement("link");
//       link.id = "manyara-pdf-fonts";
//       link.rel = "stylesheet";
//       link.href = FONT_URL;
//       document.head.appendChild(link);
//       await new Promise((resolve) => {
//         link.onload = resolve;
//         link.onerror = resolve;
//         setTimeout(resolve, 4000);
//       });
//     }

//     await Promise.all([
//       document.fonts.load(`600 32px "Cormorant Garamond"`),
//       document.fonts.load(`700 32px "Cormorant Garamond"`),
//       document.fonts.load(`italic 500 17px "Cormorant Garamond"`),
//       document.fonts.load(`400 13px Inter`),
//       document.fonts.load(`500 13px Inter`),
//       document.fonts.load(`600 13px Inter`),
//     ]);
//     await document.fonts.ready;
//   } catch (error) {
//     console.warn("Font loading warning:", error);
//   }
// }

// /** Resolves to Map(url -> {w, h}) for the images that loaded. */
// function preloadImages(urls) {
//   const sizes = new Map();

//   return Promise.all(
//     urls.filter(Boolean).map(
//       (url) =>
//         new Promise((resolve) => {
//           const img = new Image();
//           img.crossOrigin = "anonymous";
//           img.onload = () => {
//             sizes.set(url, { w: img.naturalWidth, h: img.naturalHeight });
//             resolve();
//           };
//           img.onerror = () => {
//             console.warn("Image failed to load:", url);
//             resolve();
//           };
//           img.src = url;
//         })
//     )
//   ).then(() => sizes);
// }

// function waitForContainerImages(root) {
//   return Promise.all(
//     Array.from(root.querySelectorAll("img")).map((img) =>
//       img.complete
//         ? Promise.resolve()
//         : new Promise((resolve) => {
//             img.onload = resolve;
//             img.onerror = resolve;
//           })
//     )
//   );
// }

// function nextFrame() {
//   return new Promise((resolve) =>
//     requestAnimationFrame(() => requestAnimationFrame(resolve))
//   );
// }

// /* ---------------------------------------------------------------------
//    Data helpers
// --------------------------------------------------------------------- */

// /** Cloudinary: resized JPEG, never upscaled (c_limit). */
// function optimizeUrl(url, width) {
//   if (!url) return null;

//   if (
//     url.includes("res.cloudinary.com") &&
//     url.includes("/upload/") &&
//     !/\/upload\/(?:[a-z]{1,3}_[^/]*\/)+/.test(url)
//   ) {
//     return url.replace("/upload/", `/upload/f_jpg,q_auto:best,w_${width},c_limit/`);
//   }

//   return url;
// }

// function getImageUrl(image) {
//   if (!image) return null;
//   if (typeof image === "string") return image.trim() || null;
//   if (typeof image === "object") {
//     return image.url || image.secure_url || image.src || image.image_url || null;
//   }
//   return null;
// }

// function normalizeListItem(item) {
//   if (item === null || item === undefined) return "";
//   if (typeof item === "object") {
//     return String(item.name || item.title || item.description || item.text || item.value || "").trim();
//   }
//   return String(item).trim();
// }

// const BREAK_CHARS = /[\r\n\u2022\u25AA\u25CF]/; // new line, or a bullet character
// const stripBullet = (text) => text.replace(/^[\s\-\u2013\u2014*\u00B7]+/, "").trim();

// function splitText(text) {
//   const value = String(text || "");
//   const parts = BREAK_CHARS.test(value)
//     ? value.split(/\r?\n|[\u2022\u25AA\u25CF]/)
//     : value.split(/[,;]/);

//   return parts.map(stripBullet).filter(Boolean);
// }

// function normalizeList(value) {
//   if (Array.isArray(value)) {
//     const items = value.map(normalizeListItem).filter(Boolean);

//     // A single saved string: treat it like plain text.
//     if (items.length === 1) return splitText(items[0]);

//     return items.flatMap((item) =>
//       BREAK_CHARS.test(item) ? splitText(item) : [stripBullet(item)]
//     );
//   }

//   if (typeof value === "string") return splitText(value);
//   return [];
// }

// /** Each line of a policy becomes its own point. */
// function normalizePolicy(value) {
//   const source = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

//   return source
//     .flatMap((item) => normalizeListItem(item).split(/\r?\n+/))
//     .map(stripBullet)
//     .filter(Boolean);
// }

// function escapeHTML(value) {
//   if (value === null || value === undefined) return "";

//   return String(value)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// function formatPrice(price) {
//   if (price === null || price === undefined || price === "") return "0";

//   const number = Number(price);
//   if (Number.isNaN(number)) return String(price);

//   return number.toLocaleString("en-IN", { maximumFractionDigits: 2 });
// }

// function slugify(value) {
//   return (
//     String(value)
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9]+/g, "-")
//       .replace(/^-+|-+$/g, "") || "package"
//   );
// }

// export default generatePackagePDF;










