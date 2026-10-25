

import React from "react";
import { getSiteSettings } from "../api/content"; // same API the Footer / Contact page use

// OPTION B for the logo (most reliable): keep the PNG inside src/assets, import it here,
// and add `logoAsset` as the FIRST item of LOGO_SOURCES below.
// import logoAsset from "../assets/manyara_logo_pdf.png";

/* ---------------------------------------------------------------------
   1. BRAND + THEME
--------------------------------------------------------------------- */

const BRAND = "Manyara Privé Vacations";
const TAGLINE = "Curated journeys. Effortless luxury.";
const SITE_URL = "https://manyaraprivevacations.com";
const SITE_LABEL = "manyaraprivevacations.com";
const DEFAULT_COUNTRY_CODE = "91"; // used when a phone number is saved without a country code

// Logo files, tried in this order until one loads. Put your PNG at public/images/manyara_logo_pdf.png.
// The last one is the website's own header logo, so the PDF never ends up without a logo.
const LOGO_SOURCES = [
  "/images/manyara_logo_pdf.png",
  "/images/manyara_logo_pdf.PNG",
];

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
  logoBg: "#EEF1F5", // light chip behind the logo on the cover photo
};

/* ---------------------------------------------------------------------
   2. PAGE GEOMETRY  (PDF points: A4 = 595.28 x 841.89)
--------------------------------------------------------------------- */

const PAGE_W = 595.28;
const MARGIN_X = 36; // left / right margin
const HEADER_H = 40; // running header (pages 2+): logo + package name
const FOOTER_H = 62; // footer on every page: logo + 3 detail boxes + page number

const HERO_H = 250; // full-width cover photo
const HERO_OVERLAP = 44; // how far the title card overlaps the photo
const HERO_FOCUS_Y = 0.45; // 0 = keep top of photo, 1 = keep bottom
const DAY_W = 150; // itinerary photo, same size every day
const DAY_H = 111;

// If the description is longer than this it moves to page 2 so the cover never overflows.
const COVER_ABOUT_MAX_CHARS = 1000;

// Logo sizes: [height, max width] in points. The width follows the logo's own
// proportions; if that would exceed the max width the logo is scaled down to fit.
const LOGO_COVER = [34, 150]; // on the cover photo (on a light chip)
const LOGO_HEADER = [22, 100]; // top of pages 2+
const LOGO_FOOTER = [26, 84]; // bottom of every page
const LOGO_CLOSING = [44, 190]; // closing note on the last page

// Image resolution (pixels). PDF viewers zoom, so we keep plenty of detail.
const COVER_PX = 2200;
const DAY_PX = 900;
const LOGO_PX = 800;

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

  /**
   * Text that may contain the Rupee sign. The body font has no Rupee glyph
   * (it showed up as a wrong character), so that one character is drawn
   * with the extended font. With built-in fonts it becomes "Rs. ".
   */
  const rich = (value) => {
    const text = clean(value);
    if (!text.includes("\u20B9")) return text;
    if (!F.web) return text.replace(/\u20B9\s*/g, "Rs. ");

    return text.split("\u20B9").flatMap((part, i) =>
      i === 0
        ? [part]
        : [
            <Text key={`rs-${i}`} style={{ fontFamily: F.ext }}>
              {"\u20B9"}
            </Text>,
            part,
          ]
    );
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

  /**
   * The logo, drawn at `height` points tall, never wider than `maxW`
   * (it is scaled down to fit, proportions kept). `chip` puts it on a light
   * rounded box (used over the cover photo). If the logo file could not be
   * loaded, a text wordmark is drawn instead.
   */
  const logoMark = ([height, maxW], { chip = false, padV = 6, padH = 12, radius = 9 } = {}) => {
    let inner;

    if (ctx.logo) {
      const aspect = ctx.logo.w / ctx.logo.h;
      let w = aspect * height;
      let h = height;
      if (w > maxW) {
        w = maxW;
        h = w / aspect;
      }
      inner = <Image src={ctx.logo.src} style={{ width: w, height: h }} />;
    } else {
      const size = Math.min(height * 0.6, maxW / 8.5);
      inner = (
        <View style={{ alignItems: "center" }}>
          <Text style={S(size, C.rose, { letterSpacing: size * 0.25, textTransform: "uppercase" })}>Manyara</Text>
          <Text style={T(Math.max(4.2, size * 0.3), C.gold, { fontWeight: fw(500), letterSpacing: size * 0.15 })}>PRIVÉ VACATIONS</Text>
        </View>
      );
    }

    if (!chip) return inner;

    return (
      <View style={{ backgroundColor: C.logoBg, borderRadius: radius, paddingVertical: padV, paddingHorizontal: padH }}>{inner}</View>
    );
  };

  /* Section heading: small gold label, serif title, hairline. */
  const heading = (label, text) => (
    <View wrap={false} style={{ marginBottom: 12 }}>
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
      <View style={{ flexShrink: 0 }}>{logoMark(LOGO_HEADER)}</View>
      <Text maxLines={1} style={T(7, C.gold, { fontWeight: fw(600), letterSpacing: 1.6, textTransform: "uppercase", maxWidth: 300, textAlign: "right" })}>
        {title}
        {durationText ? `  \u00B7  ${durationText}` : ""}
      </Text>
    </View>
  );

  /* One detail box: small gold label, value underneath (clickable). */
  const detailBox = (cell, index) => (
    <View
      key={cell.href}
      style={{
        // wider text gets a wider box, so nothing is squeezed or cut off
        flexGrow: cell.value.length + 6,
        flexShrink: 1,
        flexBasis: 0,
        marginLeft: index ? 6 : 0,
        paddingVertical: 6,
        paddingHorizontal: 7,
        justifyContent: "center",
        backgroundColor: C.white,
        borderWidth: 0.75,
        borderColor: C.champagne,
        borderRadius: 8,
      }}
    >
      <Text style={T(5.6, C.gold, { fontWeight: fw(600), letterSpacing: 1.3, marginBottom: 2 })}>{cell.label}</Text>
      <Text style={T(7.4, C.roseDeep, { fontWeight: fw(500), lineHeight: 1.25 })}>
        <Link src={cell.href} style={{ color: C.roseDeep, textDecoration: "none" }}>
          {cell.value}
        </Link>
      </Text>
    </View>
  );

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
      <View style={{ width: LOGO_FOOTER[1], justifyContent: "center" }}>{logoMark(LOGO_FOOTER)}</View>

      <View style={{ flex: 1, flexDirection: "row", alignItems: "stretch", marginHorizontal: 10 }}>{co.cells.map(detailBox)}</View>

      <Text
        fixed
        style={T(7.5, C.gold, { width: 46, textAlign: "right", fontWeight: fw(600), letterSpacing: 1 })}
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
        <View style={{ position: "absolute", left: MARGIN_X, top: 22 }}>{logoMark(LOGO_COVER, { chip: true, padV: 7, padH: 13, radius: 10 })}</View>
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

  /* ---------- sections ----------
     A heading is always kept together with the first block under it, so a
     heading can never be left alone at the bottom of a page. */

  const about = (onCover) =>
    pkg.description ? (
      <View style={{ marginTop: onCover ? 24 : 0 }}>
        {heading("The Experience", "About This Journey")}
        <Text style={T(9.8, C.body, { lineHeight: 1.7 })}>{rich(pkg.description)}</Text>
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
            {description ? <Text style={T(9, C.body, { lineHeight: 1.65, marginTop: 5 })}>{rich(description)}</Text> : null}
          </View>
          {photo ? <Image src={photo.src} style={{ width: DAY_W, height: DAY_H, borderRadius: 7, marginLeft: 12 }} /> : null}
        </View>
      </View>
    );
  };

  const itinerarySection = () =>
    itinerary.length ? (
      <View style={{ marginTop: 24 }}>
        <View wrap={false}>
          {heading("Your Journey", "Day-by-Day Itinerary")}
          {dayRow(itinerary[0], 0)}
        </View>
        {itinerary.slice(1).map((day, i) => dayRow(day, i + 1))}
      </View>
    ) : null;

  const columnsFor = (count, max) => (count <= 2 ? Math.max(1, count) : count === 4 ? 2 : max);

  const facilitiesSection = () => {
    if (!facilities.length) return null;
    const cols = columnsFor(facilities.length, 3);

    return (
      <View wrap={facilities.length > 30} style={{ marginTop: 24 }}>
        {heading("Comforts", "Facilities")}
        <View style={{ ...card, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 5 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {facilities.map((item, i) => (
              <View key={`fac-${i}`} wrap={false} style={{ width: `${100 / cols}%`, flexDirection: "row", paddingRight: 10, paddingBottom: 8 }}>
                {diamond(`d-${i}`)}
                <Text style={T(9.4, C.body, { flex: 1, lineHeight: 1.45, marginLeft: 7 })}>{rich(item)}</Text>
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
          <Text style={T(9.4, C.body, { flex: 1, lineHeight: 1.45, marginLeft: 7 })}>{rich(item)}</Text>
        </View>
      ))}
    </View>
  );

  const coverageSection = () => {
    if (!inclusions.length && !exclusions.length) return null;

    return (
      <View wrap={Math.max(inclusions.length, exclusions.length) > 18} style={{ marginTop: 24 }}>
        {heading("The Details", "What\u2019s Included")}
        <View style={{ flexDirection: "row" }}>
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
            <Text style={{ fontWeight: fw(600), color: C.ink }}>{`${clean(match[1])}: `}</Text>
            {rich(match[2])}
          </>
        ) : (
          rich(text)
        )}
      </Text>
    );
  };

  const policySection = (label, text, items) =>
    items.length ? (
      <View style={{ marginTop: 24 }}>
        <View wrap={false}>
          {heading(label, text)}
          {policyPoint(items[0], 0)}
        </View>
        {items.slice(1).map((item, i) => policyPoint(item, i + 1))}
      </View>
    ) : null;

  const closing = () => (
    <View wrap={false} style={{ marginTop: 28, alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 46, height: 0.75, backgroundColor: C.champagne }} />
        <View style={{ width: 5.5, height: 5.5, marginHorizontal: 10, backgroundColor: C.gold, transform: "rotate(45deg)" }} />
        <View style={{ width: 46, height: 0.75, backgroundColor: C.champagne }} />
      </View>
      <View style={{ marginTop: 14, alignItems: "center" }}>{logoMark(LOGO_CLOSING)}</View>
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
  const [logo, cover, ...dayImages] = await Promise.all([
    loadFirstImage(LOGO_SOURCES, { maxPx: LOGO_PX, type: "png" }),
    loadImage(optimizeUrl(rawCover, 2400), { maxPx: COVER_PX, ratio: PAGE_W / HERO_H, focusY: HERO_FOCUS_Y }),
    ...itinerary.map((d) => loadImage(optimizeUrl(getImageUrl(d?.image), 1000), { maxPx: DAY_PX, ratio: DAY_W / DAY_H })),
  ]);

  if (!logo) {
    console.warn("PDF logo not found. Tried:", LOGO_SOURCES, "- check the file name and that it is inside public/images.");
  }

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
   Company details (footer boxes on every page)
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

/** Returns { cells: [{ label, value, href }] } : call, email, website, (WhatsApp if it is a different number). */
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
  if (telDigits) cells.push({ label: sameNumber ? "CALL / WHATSAPP" : "CALL", value: phone, href: `tel:+${telDigits}` });
  if (email) cells.push({ label: "EMAIL", value: email, href: `mailto:${email}` });
  cells.push({ label: "WEBSITE", value: SITE_LABEL, href: SITE_URL });
  if (waDigits && !sameNumber) cells.push({ label: "WHATSAPP", value: whatsapp, href: waHref });

  return { cells };
}

/* ---------------------------------------------------------------------
   Images
--------------------------------------------------------------------- */

const toAbsoluteUrl = (url) => {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (typeof window === "undefined") return null;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

/** Tries each source in order and returns the first image that loads. */
async function loadFirstImage(sources, options) {
  for (const source of sources) {
    const result = await loadImage(toAbsoluteUrl(source), options);
    if (result) return result;
  }
  return null;
}

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

/** Removes a leading bullet / dash and a stray trailing dash from one list item. */
const stripBullet = (text) =>
  text
    .replace(/^[\s\-\u2013\u2014*\u00B7]+/, "")
    .replace(/[\s\-\u2013\u2014]+$/, "")
    .trim();

/**
 * Comma lists sometimes contain a comma INSIDE one item
 * ("GST at 5%, as specified in the quotation"). When most pieces start with a
 * capital letter or number, a piece that starts in lower case belongs to the
 * item before it. Lists written entirely in lower case are left alone.
 * (Putting each item on its own line in the admin avoids the guesswork.)
 */
function mergeSentenceFragments(parts) {
  if (parts.length < 3) return parts;

  const startsUpper = (s) => /^[A-Z0-9\u00C0-\u00DE]/.test(s);
  if (parts.filter(startsUpper).length / parts.length < 0.5) return parts;

  const out = [];
  parts.forEach((part) => {
    if (!startsUpper(part) && out.length) out[out.length - 1] += `, ${part}`;
    else out.push(part);
  });
  return out;
}

function splitText(text) {
  const value = String(text || "");

  if (BREAK_CHARS.test(value)) {
    return value.split(/\r?\n|[\u2022\u25AA\u25CF]/).map(stripBullet).filter(Boolean);
  }

  return mergeSentenceFragments(value.split(/[,;]/).map(stripBullet).filter(Boolean));
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    const items = value.map(normalizeListItem).filter(Boolean);

    // A single saved string: treat it like plain text.
    if (items.length === 1) return splitText(items[0]);

    return items.flatMap((item) => (BREAK_CHARS.test(item) ? splitText(item) : [stripBullet(item)])).filter(Boolean);
  }

  if (typeof value === "string") return splitText(value);
  return [];
}

/** Each line of a policy becomes its own point. */
function normalizePolicy(value) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  return source
    .flatMap((item) => normalizeListItem(item).split(/\r?\n+/))
    .map((line) => line.replace(/^[\s\-\u2013\u2014*\u00B7\u2022]+/, "").trim())
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













































// import React from "react";
// import { getSiteSettings } from "../api/content"; // same API the Footer / Contact page use


// /* ---------------------------------------------------------------------
//    1. BRAND + THEME
// --------------------------------------------------------------------- */

// const BRAND = "Manyara Privé Vacations";
// const TAGLINE = "Curated journeys. Effortless luxury.";
// const SITE_URL = "https://manyaraprivevacations.com";
// const SITE_LABEL = "manyaraprivevacations.com";
// const LOGO_PATH = "/images/manyara_logo_pdf.png"; // same logo the site footer uses (WebP is converted to PNG below)
// const DEFAULT_COUNTRY_CODE = "91"; // used when a phone number is saved without a country code

// // Mirrors tailwind.config.js + the site's theme-color (#FFF8F5)
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

// /* ---------------------------------------------------------------------
//    2. PAGE GEOMETRY  (PDF points: A4 = 595.28 x 841.89)
// --------------------------------------------------------------------- */

// const PAGE_W = 595.28;
// const MARGIN_X = 36; // left / right margin
// const HEADER_H = 34; // slim running header (pages 2+)
// const FOOTER_H = 52; // footer on every page: logo + contact + page number

// const HERO_H = 250; // full-width cover photo
// const HERO_OVERLAP = 44; // how far the title card overlaps the photo
// const HERO_FOCUS_Y = 0.45; // 0 = keep top of photo, 1 = keep bottom
// const DAY_W = 150; // itinerary photo, same size every day
// const DAY_H = 111;

// // If the description is longer than this it moves to page 2 so the cover never overflows.
// const COVER_ABOUT_MAX_CHARS = 1000;

// // Image resolution (pixels). PDF viewers zoom, so we keep plenty of detail.
// const COVER_PX = 2200;
// const DAY_PX = 900;
// const LOGO_PX = 700;

// /* ---------------------------------------------------------------------
//    3. FONTS
//    Loaded from jsDelivr (Fontsource) as .woff. Self-hosting is more
//    reliable: put the same .woff/.ttf files in /public/fonts and change
//    FONT_BASE to "/fonts" with matching file names.
//    If a font fails to load, the PDF is rebuilt with built-in PDF fonts
//    (Times / Helvetica) so the download never fails.
// --------------------------------------------------------------------- */

// const FONT_BASE = "https://cdn.jsdelivr.net/fontsource/fonts";
// const CORM = `${FONT_BASE}/cormorant-garamond@latest`;
// const INTER = `${FONT_BASE}/inter@latest`;

// const WEB_FONTS = { serif: "Cormorant", sans: "Inter", ext: "InterExt", web: true };
// const SAFE_FONTS = { serif: "Times-Roman", sans: "Helvetica", ext: "Helvetica", web: false };

// let fontsRegistered = false;

// function registerFonts(Font) {
//   if (fontsRegistered) return;

//   Font.register({
//     family: "Cormorant",
//     fonts: [
//       { src: `${CORM}/latin-500-normal.woff`, fontWeight: 500 },
//       { src: `${CORM}/latin-600-normal.woff`, fontWeight: 600 },
//       { src: `${CORM}/latin-700-normal.woff`, fontWeight: 700 },
//       { src: `${CORM}/latin-500-italic.woff`, fontWeight: 500, fontStyle: "italic" },
//     ],
//   });

//   Font.register({
//     family: "Inter",
//     fonts: [
//       { src: `${INTER}/latin-400-normal.woff`, fontWeight: 400 },
//       { src: `${INTER}/latin-500-normal.woff`, fontWeight: 500 },
//       { src: `${INTER}/latin-600-normal.woff`, fontWeight: 600 },
//     ],
//   });

//   // The Rupee sign lives in Inter's "latin-ext" subset: used for that one glyph only.
//   Font.register({
//     family: "InterExt",
//     fonts: [
//       { src: `${INTER}/latin-ext-400-normal.woff`, fontWeight: 400 },
//       { src: `${INTER}/latin-ext-600-normal.woff`, fontWeight: 600 },
//     ],
//   });

//   // No automatic hyphenation: words are never split mid-way.
//   Font.registerHyphenationCallback((word) => [word]);

//   fontsRegistered = true;
// }

// /* ---------------------------------------------------------------------
//    4. THE DOCUMENT
// --------------------------------------------------------------------- */

// function buildDocument(R, ctx, F) {
//   const { Document, Page, View, Text, Image, Link, Svg, Path, Circle } = R;
//   const { pkg, title, eyebrow, has, itinerary, facilities, inclusions, exclusions, terms, cancellation, durationText, co } = ctx;

//   // Built-in fonts only have regular/bold.
//   const fw = (n) => (F.web ? n : n >= 600 ? 700 : 400);

//   const T = (size, color, extra = {}) => ({ fontFamily: F.sans, fontSize: size, color, ...extra });
//   const S = (size, color, extra = {}) => ({ fontFamily: F.serif, fontSize: size, color, fontWeight: fw(600), ...extra });

//   const pad2 = (n) => String(n).padStart(2, "0");

//   const card = {
//     backgroundColor: C.white,
//     borderWidth: 0.75,
//     borderColor: C.champagne,
//     borderRadius: 10,
//   };

//   /* ---------- small building blocks ---------- */

//   const diamond = (key) => (
//     <View key={key} style={{ width: 4.5, height: 4.5, marginTop: 5, backgroundColor: C.gold, transform: "rotate(45deg)" }} />
//   );

//   const tick = (key) => (
//     <Svg key={key} width={12} height={12} viewBox="0 0 12 12" style={{ marginTop: 1 }}>
//       <Circle cx={6} cy={6} r={6} fill={C.rose} />
//       <Path d="M3.3 6.2 L5.2 8 L8.8 4.1" stroke="#FFFFFF" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
//     </Svg>
//   );

//   const cross = (key) => (
//     <Svg key={key} width={12} height={12} viewBox="0 0 12 12" style={{ marginTop: 1 }}>
//       <Circle cx={6} cy={6} r={5.5} fill="none" stroke={C.muted} strokeWidth={0.9} />
//       <Path d="M4 4 L8 8 M8 4 L4 8" stroke={C.muted} strokeWidth={1} fill="none" strokeLinecap="round" />
//     </Svg>
//   );

//   /* Logo on the same light chip the site footer uses; text wordmark as fallback. */
//   const logoChip = (height, { padV = 5, padH = 10, radius = 8 } = {}) => {
//     const box = {
//       backgroundColor: C.logoBg,
//       borderRadius: radius,
//       paddingVertical: padV,
//       paddingHorizontal: padH,
//     };

//     if (ctx.logo) {
//       const w = (ctx.logo.w / ctx.logo.h) * height;
//       return (
//         <View style={box}>
//           <Image src={ctx.logo.src} style={{ width: w, height }} />
//         </View>
//       );
//     }

//     return (
//       <View style={{ ...box, alignItems: "center" }}>
//         <Text style={S(height * 0.62, C.rose, { letterSpacing: height * 0.18, textTransform: "uppercase" })}>Manyara</Text>
//         <Text style={T(Math.max(4.5, height * 0.2), C.gold, { fontWeight: fw(500), letterSpacing: height * 0.3 })}>PRIVÉ VACATIONS</Text>
//       </View>
//     );
//   };

//   /* Section heading: small gold label, serif title, hairline. Never left alone at the bottom of a page. */
//   const heading = (label, text) => (
//     <View wrap={false} minPresenceAhead={90} style={{ marginBottom: 12 }}>
//       <Text style={T(7.5, C.gold, { fontWeight: fw(600), letterSpacing: 2.2, textTransform: "uppercase", marginBottom: 3 })}>{label}</Text>
//       <Text style={S(24, C.roseDeep, { lineHeight: 1.2 })}>{text}</Text>
//       <View style={{ height: 0.75, marginTop: 8, backgroundColor: C.champagne }} />
//     </View>
//   );

//   const rupee = F.web ? <Text style={{ fontFamily: F.ext, fontWeight: fw(600) }}>{"\u20B9"}</Text> : "Rs. ";

//   /* ---------- header (pages 2+) and footer (every page) ---------- */

//   const header = () => (
//     <View
//       fixed
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//         right: 0,
//         height: HEADER_H,
//         paddingHorizontal: MARGIN_X,
//         flexDirection: "row",
//         alignItems: "center",
//         justifyContent: "space-between",
//         backgroundColor: C.cream,
//         borderBottomWidth: 0.75,
//         borderBottomColor: C.champagne,
//       }}
//     >
//       <Text style={S(11, C.roseDeep, { letterSpacing: 1.6, textTransform: "uppercase" })}>{BRAND}</Text>
//       <Text maxLines={1} style={T(7, C.gold, { fontWeight: fw(600), letterSpacing: 1.6, textTransform: "uppercase", maxWidth: 300, textAlign: "right" })}>
//         {title}
//         {durationText ? `  \u00B7  ${durationText}` : ""}
//       </Text>
//     </View>
//   );

//   // Contact details as ONE wrapping paragraph: if it is too long for a line it
//   // goes to a second line instead of being cut off.
//   const contactNodes = co.cells.flatMap((cell, i) => [
//     i > 0 ? (
//       <Text key={`sep-${i}`} style={{ color: C.gold }}>
//         {"   \u2022   "}
//       </Text>
//     ) : null,
//     <Link key={cell.href} src={cell.href} style={{ color: C.roseDeep, textDecoration: "none", fontWeight: fw(500) }}>
//       {cell.text}
//     </Link>,
//   ]);

//   const footer = () => (
//     <View
//       fixed
//       style={{
//         position: "absolute",
//         left: 0,
//         right: 0,
//         bottom: 0,
//         height: FOOTER_H,
//         paddingHorizontal: MARGIN_X,
//         flexDirection: "row",
//         alignItems: "center",
//         backgroundColor: C.cream,
//         borderTopWidth: 0.75,
//         borderTopColor: C.champagne,
//       }}
//     >
//       <View style={{ flexShrink: 0 }}>{logoChip(15, { padV: 3, padH: 8, radius: 6 })}</View>
//       <Text style={T(8, C.muted, { flex: 1, textAlign: "center", lineHeight: 1.6, paddingHorizontal: 14 })}>{contactNodes}</Text>
//       <Text
//         fixed
//         style={T(8, C.gold, { width: 44, textAlign: "right", fontWeight: fw(600), letterSpacing: 1 })}
//         render={({ pageNumber, totalPages }) => `${pad2(pageNumber)} / ${pad2(totalPages)}`}
//       />
//     </View>
//   );

//   /* ---------- cover ---------- */

//   const titleSize = title.length <= 12 ? 40 : title.length <= 22 ? 33 : title.length <= 34 ? 27 : 22;
//   const heroH = ctx.cover ? HERO_H : 150;

//   const stat = (label, value, first) => (
//     <View
//       key={label}
//       style={{
//         flex: 1,
//         paddingTop: 10,
//         paddingBottom: 12,
//         paddingLeft: first ? 0 : 18,
//         borderLeftWidth: first ? 0 : 0.75,
//         borderLeftColor: C.line,
//       }}
//     >
//       <Text style={T(7, C.gold, { fontWeight: fw(600), letterSpacing: 2, marginBottom: 4 })}>{label}</Text>
//       {value}
//     </View>
//   );

//   const stats = [];
//   if (durationText) {
//     stats.push(["DURATION", <Text style={T(14, C.ink, { fontWeight: fw(600) })}>{durationText}</Text>]);
//   }
//   if (has(pkg.price)) {
//     stats.push([
//       "STARTING FROM",
//       <Text style={T(14, C.rose, { fontWeight: fw(600) })}>
//         {rupee}
//         {formatPrice(pkg.price)}
//         <Text style={T(8.5, C.muted, { fontWeight: fw(400) })}>{"  per person"}</Text>
//       </Text>,
//     ]);
//   }

//   const cover = () => (
//     <View>
//       <View style={{ width: PAGE_W, height: heroH, backgroundColor: C.champagneSoft }}>
//         {ctx.cover ? <Image src={ctx.cover.src} style={{ width: PAGE_W, height: heroH }} /> : null}
//         <View style={{ position: "absolute", left: MARGIN_X, top: 22 }}>{logoChip(28, { padV: 6, padH: 12, radius: 9 })}</View>
//       </View>

//       <View style={{ ...card, borderRadius: 14, marginTop: -HERO_OVERLAP, marginHorizontal: MARGIN_X, paddingTop: 18, paddingHorizontal: 22, paddingBottom: stats.length ? 0 : 18 }}>
//         <Text style={T(8, C.gold, { fontWeight: fw(600), letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 6 })}>{eyebrow}</Text>
//         <Text style={S(titleSize, C.roseDeep, { lineHeight: 1.1 })}>{title}</Text>
//         <View style={{ width: 42, height: 2.2, borderRadius: 2, backgroundColor: C.rose, marginTop: 11 }} />
//         {stats.length ? (
//           <View style={{ flexDirection: "row", marginTop: 14, borderTopWidth: 0.75, borderTopColor: C.line }}>
//             {stats.map(([label, value], i) => stat(label, value, i === 0))}
//           </View>
//         ) : null}
//       </View>
//     </View>
//   );

//   /* ---------- sections ---------- */

//   const about = (onCover) =>
//     pkg.description ? (
//       <View style={{ marginTop: onCover ? 24 : 0 }}>
//         {heading("The Experience", "About This Journey")}
//         <Text style={T(9.8, C.body, { lineHeight: 1.7 })}>{clean(pkg.description)}</Text>
//       </View>
//     ) : null;

//   const dayRow = (day, index) => {
//     const n = has(day?.day) ? day.day : index + 1;
//     const isLast = index === itinerary.length - 1;
//     const description = day?.description ? clean(day.description).trim() : "";
//     const photo = ctx.dayImages[index];

//     return (
//       <View
//         key={`day-${index}`}
//         wrap={description.length > 1200}
//         style={{ flexDirection: "row", paddingBottom: 12, position: "relative" }}
//       >
//         {isLast ? null : (
//           <View style={{ position: "absolute", left: 17.5, top: 40, bottom: 0, width: 0.75, backgroundColor: C.champagne }} />
//         )}

//         <View
//           style={{
//             width: 36,
//             height: 36,
//             borderRadius: 18,
//             borderWidth: 1.1,
//             borderColor: C.rose,
//             backgroundColor: C.white,
//             alignItems: "center",
//             justifyContent: "center",
//             marginRight: 12,
//           }}
//         >
//           <Text style={T(5, C.gold, { fontWeight: fw(600), letterSpacing: 1.2 })}>DAY</Text>
//           <Text style={T(12, C.rose, { fontWeight: fw(600), marginTop: 1 })}>{pad2(n)}</Text>
//         </View>

//         <View style={{ ...card, flex: 1, flexDirection: "row", alignItems: "flex-start", padding: 12 }}>
//           <View style={{ flex: 1 }}>
//             <Text style={S(16, C.ink, { lineHeight: 1.25 })}>{clean(day?.title) || `Day ${n}`}</Text>
//             {description ? <Text style={T(9, C.body, { lineHeight: 1.65, marginTop: 5 })}>{description}</Text> : null}
//           </View>
//           {photo ? <Image src={photo.src} style={{ width: DAY_W, height: DAY_H, borderRadius: 7, marginLeft: 12 }} /> : null}
//         </View>
//       </View>
//     );
//   };

//   const itinerarySection = () =>
//     itinerary.length ? (
//       <View style={{ marginTop: 24 }}>
//         {heading("Your Journey", "Day-by-Day Itinerary")}
//         {itinerary.map(dayRow)}
//       </View>
//     ) : null;

//   const columnsFor = (count, max) => (count <= 2 ? Math.max(1, count) : count === 4 ? 2 : max);

//   const facilitiesSection = () => {
//     if (!facilities.length) return null;
//     const cols = columnsFor(facilities.length, 3);

//     return (
//       <View style={{ marginTop: 24 }}>
//         {heading("Comforts", "Facilities")}
//         <View wrap={facilities.length > 30} style={{ ...card, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 5 }}>
//           <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
//             {facilities.map((item, i) => (
//               <View key={`fac-${i}`} wrap={false} style={{ width: `${100 / cols}%`, flexDirection: "row", paddingRight: 10, paddingBottom: 8 }}>
//                 {diamond(`d-${i}`)}
//                 <Text style={T(9.4, C.body, { flex: 1, lineHeight: 1.45, marginLeft: 7 })}>{clean(item)}</Text>
//               </View>
//             ))}
//           </View>
//         </View>
//       </View>
//     );
//   };

//   const panel = (key, label, items, marker, bg, border, titleColor) => (
//     <View key={key} style={{ flex: 1, backgroundColor: bg, borderWidth: 0.75, borderColor: border, borderRadius: 10, padding: 13, paddingBottom: 6 }}>
//       <Text style={S(16.5, titleColor, { marginBottom: 8 })}>{label}</Text>
//       {items.map((item, i) => (
//         <View key={`${key}-${i}`} wrap={false} style={{ flexDirection: "row", marginBottom: 6 }}>
//           {marker(`${key}-m-${i}`)}
//           <Text style={T(9.4, C.body, { flex: 1, lineHeight: 1.45, marginLeft: 7 })}>{clean(item)}</Text>
//         </View>
//       ))}
//     </View>
//   );

//   const coverageSection = () => {
//     if (!inclusions.length && !exclusions.length) return null;

//     return (
//       <View style={{ marginTop: 24 }}>
//         {heading("The Details", "What\u2019s Included")}
//         <View wrap={Math.max(inclusions.length, exclusions.length) > 18} style={{ flexDirection: "row" }}>
//           {inclusions.length ? panel("inc", "Inclusions", inclusions, tick, C.roseSoft, C.roseLine, C.roseDeep) : null}
//           {inclusions.length && exclusions.length ? <View style={{ width: 12 }} /> : null}
//           {exclusions.length ? panel("exc", "Exclusions", exclusions, cross, C.white, C.line, C.ink) : null}
//         </View>
//       </View>
//     );
//   };

//   /* "Refunds: text" -> bold "Refunds:" followed by the text */
//   const policyPoint = (text, i) => {
//     const match = text.match(/^([^:\n]{2,50}):\s+(\S[\s\S]*)$/);

//     return (
//       <Text key={`pt-${i}`} style={T(9, C.muted, { lineHeight: 1.65, marginBottom: 6 })}>
//         {match ? (
//           <>
//             <Text style={{ fontWeight: fw(600), color: C.ink }}>{`${match[1]}: `}</Text>
//             {match[2]}
//           </>
//         ) : (
//           text
//         )}
//       </Text>
//     );
//   };

//   const policySection = (label, text, items) =>
//     items.length ? (
//       <View style={{ marginTop: 24 }}>
//         {heading(label, text)}
//         {items.map(policyPoint)}
//       </View>
//     ) : null;

//   const closing = () => (
//     <View wrap={false} style={{ marginTop: 28, alignItems: "center" }}>
//       <View style={{ flexDirection: "row", alignItems: "center" }}>
//         <View style={{ width: 46, height: 0.75, backgroundColor: C.champagne }} />
//         <View style={{ width: 5.5, height: 5.5, marginHorizontal: 10, backgroundColor: C.gold, transform: "rotate(45deg)" }} />
//         <View style={{ width: 46, height: 0.75, backgroundColor: C.champagne }} />
//       </View>
//       <View style={{ marginTop: 14 }}>{logoChip(30, { padV: 7, padH: 14, radius: 10 })}</View>
//       <Text style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: fw(500), fontSize: 15, color: C.roseDeep, marginTop: 12 }}>{TAGLINE}</Text>
//       <Text style={T(8, C.muted, { marginTop: 4 })}>{`Thank you for choosing ${BRAND}.`}</Text>
//     </View>
//   );

//   /* ---------- assemble ---------- */

//   const aboutOnCover = Boolean(pkg.description) && String(pkg.description).length <= COVER_ABOUT_MAX_CHARS;

//   return (
//     <Document
//       title={`${title} - ${BRAND}`}
//       author={BRAND}
//       subject={`${title} itinerary`}
//       creator={BRAND}
//       producer={BRAND}
//       keywords={[title, ctx.destination, "itinerary", "travel package"].filter(Boolean).join(", ")}
//     >
//       {/* PAGE 1: cover */}
//       <Page size="A4" style={{ backgroundColor: C.cream, fontFamily: F.sans, paddingBottom: FOOTER_H + 12 }}>
//         {cover()}
//         {aboutOnCover ? <View style={{ marginHorizontal: MARGIN_X }}>{about(true)}</View> : null}
//         {footer()}
//       </Page>

//       {/* PAGE 2+: flowing content */}
//       <Page
//         size="A4"
//         style={{
//           backgroundColor: C.cream,
//           fontFamily: F.sans,
//           paddingTop: HEADER_H + 20,
//           paddingBottom: FOOTER_H + 16,
//           paddingHorizontal: MARGIN_X,
//         }}
//       >
//         {header()}
//         {aboutOnCover ? null : about(false)}
//         {itinerarySection()}
//         {facilitiesSection()}
//         {coverageSection()}
//         {policySection("Please Note", "Terms & Conditions", terms)}
//         {policySection("Good to Know", "Cancellation Policy", cancellation)}
//         {closing()}
//         {footer()}
//       </Page>
//     </Document>
//   );
// }

// /* =====================================================================
//    5. ENGINE
// ===================================================================== */

// /**
//  * @param pkg           package object
//  * @param siteSettings  optional - pass the object you already have from
//  *                      getSiteSettings(); if omitted it is fetched here.
//  * @returns the downloaded file name
//  */
// export const generatePackagePDF = async (pkg, siteSettings = null) => {
//   if (!pkg) {
//     throw new Error("Package information is required to generate the PDF.");
//   }

//   // Loaded only when the user clicks "Download": keeps the main bundle small.
//   // If the site was redeployed while this tab was open the old chunk no longer exists:
//   // retry once, then ask for a refresh instead of a vague failure.
//   let R;
//   try {
//     R = await import("@react-pdf/renderer");
//   } catch (importError) {
//     console.warn("PDF library chunk failed to load, retrying once:", importError);
//     try {
//       await new Promise((resolve) => setTimeout(resolve, 600));
//       R = await import("@react-pdf/renderer");
//     } catch (retryError) {
//       throw new Error("The site was updated while this page was open. Please refresh the page (Ctrl+Shift+R) and try again.");
//     }
//   }

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

//   const title = clean(pkg.title) || "Travel Package";
//   const destination = has(pkg.destination) ? clean(pkg.destination).trim() : "";
//   // "Dubai" above a title that is also "Dubai" looks like a typo: use a neutral label instead.
//   const eyebrow =
//     destination && destination.toLowerCase() !== title.trim().toLowerCase() ? destination : "Curated Journey";

//   const durationText = has(pkg.duration_days)
//     ? `${pkg.duration_days} Days${has(pkg.duration_nights) ? ` / ${pkg.duration_nights} Nights` : ""}`
//     : "";

//   /* ---- Company details: dynamic, same source as Footer.jsx ---- */
//   const settings = siteSettings || (await fetchSettings());
//   const co = buildCompany(settings);

//   /* ---- Images: cropped to the exact frame + converted to JPEG/PNG (react-pdf cannot read WebP) ---- */
//   const logoUrl = typeof window !== "undefined" ? `${window.location.origin}${LOGO_PATH}` : null;

//   const [logo, cover, ...dayImages] = await Promise.all([
//     loadImage(logoUrl, { maxPx: LOGO_PX, type: "png" }),
//     loadImage(optimizeUrl(rawCover, 2400), { maxPx: COVER_PX, ratio: PAGE_W / HERO_H, focusY: HERO_FOCUS_Y }),
//     ...itinerary.map((d) => loadImage(optimizeUrl(getImageUrl(d?.image), 1000), { maxPx: DAY_PX, ratio: DAY_W / DAY_H })),
//   ]);

//   const ctx = {
//     pkg,
//     title,
//     eyebrow,
//     destination,
//     has,
//     itinerary,
//     facilities,
//     inclusions,
//     exclusions,
//     terms,
//     cancellation,
//     durationText,
//     co,
//     logo,
//     cover,
//     dayImages,
//   };

//   /* ---- Render ---- */
//   const fileName = `${slugify(title)}-itinerary.pdf`;
//   let blob;

//   try {
//     registerFonts(R.Font);
//     blob = await R.pdf(buildDocument(R, ctx, WEB_FONTS)).toBlob();
//   } catch (fontError) {
//     // Most likely a font file could not be downloaded: rebuild with built-in fonts.
//     console.warn("PDF with web fonts failed, retrying with built-in fonts:", fontError);
//     blob = await R.pdf(buildDocument(R, ctx, SAFE_FONTS)).toBlob();
//   }

//   downloadBlob(blob, fileName);
//   return fileName;
// };

// /* ---------------------------------------------------------------------
//    Company details (footer on every page)
// --------------------------------------------------------------------- */

// /** Same API as Footer.jsx; never blocks the PDF for more than 4s. */
// async function fetchSettings() {
//   try {
//     return await Promise.race([getSiteSettings(), new Promise((resolve) => setTimeout(() => resolve(null), 4000))]);
//   } catch (error) {
//     console.warn("Could not load site settings for the PDF:", error);
//     return null;
//   }
// }

// /** Returns { cells: [{ text, href }] } : email, phone, (WhatsApp), website. */
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
//     ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hello ${BRAND}, I would like to know more about your travel packages.`)}`
//     : "";

//   // Call and WhatsApp are often the same number: show it once.
//   const sameNumber = phoneDigits && waDigitsRaw && phoneDigits.slice(-10) === waDigitsRaw.slice(-10);

//   const cells = [];
//   if (email) cells.push({ text: email, href: `mailto:${email}` });
//   if (telDigits) cells.push({ text: phone, href: `tel:+${telDigits}` });
//   if (waDigits && !sameNumber) cells.push({ text: `WhatsApp ${whatsapp}`, href: waHref });
//   cells.push({ text: SITE_LABEL, href: SITE_URL });

//   return { cells };
// }

// /* ---------------------------------------------------------------------
//    Images
// --------------------------------------------------------------------- */

// /**
//  * Loads an image, optionally crops it to `ratio` (width / height, like
//  * CSS object-fit: cover), caps it at `maxPx` wide (never upscales) and
//  * returns { src: dataURL, w, h }. JPEG for photos, PNG for the logo
//  * (keeps transparency). Returns null if the image cannot be loaded.
//  */
// async function loadImage(url, { maxPx = 1200, ratio = null, focusY = 0.5, type = "jpeg", quality = 0.92 } = {}) {
//   if (!url) return null;

//   try {
//     const img = await new Promise((resolve, reject) => {
//       const el = new Image();
//       el.crossOrigin = "anonymous";
//       el.onload = () => resolve(el);
//       el.onerror = () => reject(new Error("Image failed to load"));
//       setTimeout(() => reject(new Error("Image timed out")), 15000);
//       el.src = url;
//     });

//     let sx = 0;
//     let sy = 0;
//     let sw = img.naturalWidth;
//     let sh = img.naturalHeight;
//     if (!sw || !sh) return null;

//     if (ratio) {
//       if (sw / sh > ratio) {
//         const nw = sh * ratio; // too wide: trim the sides
//         sx = (sw - nw) / 2;
//         sw = nw;
//       } else {
//         const nh = sw / ratio; // too tall: trim top / bottom
//         sy = (sh - nh) * focusY;
//         sh = nh;
//       }
//     }

//     const outW = Math.max(1, Math.min(Math.round(sw), maxPx));
//     const outH = Math.max(1, Math.round((outW * sh) / sw));

//     const canvas = document.createElement("canvas");
//     canvas.width = outW;
//     canvas.height = outH;

//     const g = canvas.getContext("2d");
//     if (type === "jpeg") {
//       g.fillStyle = "#FFFFFF";
//       g.fillRect(0, 0, outW, outH);
//     }
//     g.imageSmoothingEnabled = true;
//     g.imageSmoothingQuality = "high";
//     g.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

//     return {
//       src: canvas.toDataURL(type === "png" ? "image/png" : "image/jpeg", quality),
//       w: outW,
//       h: outH,
//     };
//   } catch (error) {
//     console.warn("PDF image skipped:", url, error);
//     return null;
//   }
// }

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

// /* ---------------------------------------------------------------------
//    Data helpers
// --------------------------------------------------------------------- */

// /** Removes emoji / symbols the PDF fonts cannot draw (they would show as empty boxes). */
// function clean(value) {
//   if (value === null || value === undefined) return "";
//   return String(value)
//     .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "")
//     .replace(/\u00A0/g, " ");
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
//   const parts = BREAK_CHARS.test(value) ? value.split(/\r?\n|[\u2022\u25AA\u25CF]/) : value.split(/[,;]/);

//   return parts.map(stripBullet).filter(Boolean);
// }

// function normalizeList(value) {
//   if (Array.isArray(value)) {
//     const items = value.map(normalizeListItem).filter(Boolean);

//     // A single saved string: treat it like plain text.
//     if (items.length === 1) return splitText(items[0]);

//     return items.flatMap((item) => (BREAK_CHARS.test(item) ? splitText(item) : [stripBullet(item)]));
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

// function downloadBlob(blob, fileName) {
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = fileName;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   setTimeout(() => URL.revokeObjectURL(url), 10000);
// }

// export default generatePackagePDF;













