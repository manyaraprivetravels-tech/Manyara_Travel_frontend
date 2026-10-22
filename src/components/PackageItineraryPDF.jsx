


import { getSiteSettings } from "../api/content"; // same API the Footer / Contact page use

/* =====================================================================
   PackageItineraryPDF
   Light, airy brochure PDF built from the website theme
   (cream #FFF8F5 page, raspberry-rose accent, champagne + gold details,
   Cormorant Garamond headings, Inter body).

   Contact details appear ONCE (a single "Plan this journey" block at the
   end). Running header / footer carry only brand + page number.
   ===================================================================== */

const BRAND = "Manyara Privé Vacations";
const TAGLINE = "Curated journeys. Effortless luxury.";
const SITE_URL = "https://manyaraprivevacations.com";
const SITE_LABEL = "manyaraprivevacations.com";
const LOGO_PATH = "/images/Manyara_3.webp"; // same logo the site Footer uses
const DEFAULT_ADDRESS = "India";
const DEFAULT_COUNTRY_CODE = "91"; // used when a phone number is saved without a country code

// Palette mirrors tailwind.config.js + the site's theme-color (#FFF8F5)
const C = {
  ink: "#2F2A33",
  body: "#4A4A52",
  muted: "#7A747E",
  rose: "#C8135E",
  roseDeep: "#AB1050",
  roseBright: "#E8286F",
  roseSoft: "#FEF4F8",
  roseWash: "#FFF9FB",
  roseLine: "#FCD6E4",
  champagne: "#E8D2B4",
  champagneSoft: "#F7EBDB",
  gold: "#B08D57",
  line: "#EAE5E8",
  surface: "#FBF6F8",
  cream: "#FFF8F5",
  logoBg: "#EEF1F5", // same chip colour the site footer puts behind the logo
};

const SERIF = `'Cormorant Garamond','Playfair Display',Georgia,serif`;
const SANS = `Inter,system-ui,Arial,sans-serif`;

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap";

// ---- Page geometry (CSS px at 794px = A4 width) ----------------------
const PAGE_W = 794;
const CONTENT_X = 48;
const CONTENT_W = PAGE_W - CONTENT_X * 2; // 698

const BAR_TOP_H = 44; // running header (pages 2+)
const BAR_BOTTOM_H = 36; // running footer (pages 2+)
const TOP_SPACE = 68; // content starts this far below the top of pages 2+
const BOTTOM_SPACE = 58; // content ends this far above the bottom of a page
const MAX_STRETCH = 28; // max extra space added between blocks to fill a page

function getGeometry() {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const scale = isMobile ? 1.2 : 1.5;
  const pageH = Math.floor((PAGE_W * scale * 297) / 210) / scale;
  return { scale, pageH };
}

/* =====================================================================
   DESIGN B - "Soft Frame"
   Rounded photo on cream, centred title card overlapping the photo,
   soft cards, centred ornament headings, centred brand header and a
   quiet page-number footer.
   ===================================================================== */
const DESIGN = {
  build(ctx) {
    const { pkg, title, eyebrow, has, itinerary, facilities, inclusions, exclusions, terms, cancellation, durationText, co } = ctx;

    const ornament = (w = 120) => `
      <div style="display:flex;align-items:center;gap:10px;width:${w}px;margin:0 auto;">
        <div style="flex:1;height:1px;background:linear-gradient(to right,rgba(232,210,180,0),${C.champagne});"></div>
        <div style="width:7px;height:7px;background:${C.gold};transform:rotate(45deg);"></div>
        <div style="flex:1;height:1px;background:linear-gradient(to left,rgba(232,210,180,0),${C.champagne});"></div>
      </div>`;

    const heading = (label, text, atom = true) => `
      <div ${atom ? "data-atom data-keep" : ""} style="margin:0 0 18px;text-align:center;">
        <div style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:${C.gold};margin-bottom:5px;">${escapeHTML(label)}</div>
        <div style="font-family:${SERIF};font-size:32px;font-weight:600;color:${C.roseDeep};line-height:1.2;margin-bottom:10px;">${escapeHTML(text)}</div>
        ${ornament(110)}
      </div>`;

    // ---- Cover -------------------------------------------------------
    const PHOTO_W = PAGE_W - 56;
    const PHOTO_H = 470;
    const photo = photoBox(ctx.coverImage, ctx.coverSize, PHOTO_W, PHOTO_H, "border-radius:28px;");
    const titleSize = title.length <= 14 ? 42 : title.length <= 26 ? 34 : 28;

    const stat = (label, value, color, sub) => `
      <div style="flex:1;text-align:center;padding:0 10px;">
        <div style="font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.26em;color:${C.gold};">${escapeHTML(label)}</div>
        <div style="font-family:${SANS};font-size:19px;font-weight:600;color:${color};margin-top:6px;line-height:1.25;">${escapeHTML(value)}</div>
        ${sub ? `<div style="font-family:${SANS};font-size:10px;color:${C.muted};margin-top:3px;">${escapeHTML(sub)}</div>` : ""}
      </div>`;

    const stats = [];
    if (durationText) stats.push(stat("DURATION", durationText, C.ink, ""));
    if (has(pkg.price)) stats.push(stat("STARTING FROM", `\u20B9${formatPrice(pkg.price)}`, C.rose, "per person"));
    const statsHTML = stats.length
      ? `<div style="display:flex;align-items:center;margin-top:18px;padding-top:18px;border-top:1px solid ${C.line};">
           ${stats.join(`<div style="width:1px;align-self:stretch;background:${C.line};"></div>`)}
         </div>`
      : "";

    const coverHTML = `
      <div data-atom style="width:${PAGE_W}px;padding:28px 28px 0;box-sizing:border-box;">
        <div style="position:relative;width:${PHOTO_W}px;height:${PHOTO_H}px;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,${C.roseSoft},${C.champagneSoft});">
          ${photo}
          <div style="position:absolute;left:0;top:24px;width:${PHOTO_W}px;text-align:center;">
            ${logoChip(ctx, 30, { pad: "7px 16px", radius: 12 })}
          </div>
        </div>
        <div style="position:relative;width:580px;margin:-74px auto 0;background:#fff;border:1px solid ${C.champagne};border-radius:22px;box-shadow:0 14px 34px rgba(80,40,60,.12);padding:26px 32px 22px;box-sizing:border-box;text-align:center;">
          <div style="font-family:${SANS};font-size:10.5px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:${C.gold};margin-bottom:8px;">${escapeHTML(eyebrow)}</div>
          <div style="font-family:${SERIF};font-size:${titleSize}px;font-weight:600;line-height:1.15;color:${C.roseDeep};margin-bottom:14px;">${escapeHTML(title)}</div>
          ${ornament(120)}
          ${statsHTML}
        </div>
      </div>`;

    const aboutHTML = pkg.description
      ? `<div data-stretch style="margin-top:40px;">
           ${heading("The Experience", "About This Journey")}
           ${paragraph(pkg.description, 13, C.body, 1.8)}
         </div>`
      : "";

    // ---- Itinerary: soft cards -------------------------------------
    const dayCard = (day, index) => {
      const n = has(day?.day) ? day.day : index + 1;
      const label = String(n).padStart(2, "0");
      const description = day?.description ? String(day.description).trim() : "";

      return `
        <div data-atom data-stretch style="margin-bottom:16px;background:#fff;border:1px solid ${C.roseLine};border-radius:18px;padding:18px 22px 20px;box-shadow:0 4px 14px rgba(120,60,90,.06);box-sizing:border-box;">
          <div style="display:inline-block;background:${C.roseSoft};border:1px solid ${C.roseLine};border-radius:999px;padding:3px 12px;font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.24em;color:${C.rose};">DAY ${escapeHTML(label)}</div>
          <div style="font-family:${SERIF};font-size:23px;font-weight:600;color:${C.ink};line-height:1.25;margin-top:8px;">${escapeHTML(day?.title || `Day ${n}`)}</div>
          ${
            description
              ? `<div style="font-family:${SANS};font-size:12.5px;line-height:1.7;color:${C.body};margin-top:8px;white-space:pre-line;">${escapeHTML(description)}</div>`
              : ""
          }
          ${dayImage(ctx, index, CONTENT_W - 46, 260, { radius: 12, top: 14, center: true })}
        </div>`;
    };

    const itineraryHTML = itinerary.length
      ? `<div data-stretch style="margin-top:42px;">
           ${heading("Your Journey", "Day-by-Day Itinerary")}
           ${itinerary.map(dayCard).join("")}
         </div>`
      : "";

    // ---- Facilities / coverage / policies ---------------------------
    const facilitiesHTML = facilities.length
      ? `<div data-stretch style="margin-top:30px;">
           <div data-atom>
             ${heading("Comforts", "Facilities", false)}
             <div style="background:#fff;border:1px solid ${C.champagne};border-radius:16px;padding:18px 20px 9px;">
               ${itemGrid(facilities, DIAMOND, columnsFor(facilities.length, 3))}
             </div>
           </div>
         </div>`
      : "";

    const incPanel = inclusions.length
      ? panel("Inclusions", itemGrid(inclusions, TICK, 1), C.roseSoft, C.roseLine, C.roseDeep)
      : "";
    const excPanel = exclusions.length
      ? panel("Exclusions", itemGrid(exclusions, CROSS, 1), "#fff", C.line, C.ink)
      : "";

    const coverageHTML =
      incPanel || excPanel
        ? `<div data-stretch style="margin-top:38px;">
             ${heading("The Details", "What\u2019s Included")}
             <div data-atom style="display:flex;gap:16px;align-items:stretch;">${incPanel}${excPanel}</div>
           </div>`
        : "";

    const policyHTML = (label, text, items) =>
      items.length
        ? `<div data-stretch style="margin-top:38px;">
             ${heading(label, text)}
             ${items.map(policyPoint).join("")}
           </div>`
        : "";

    return `
      ${coverHTML}
      <div style="padding:0 ${CONTENT_X}px;">
        ${aboutHTML}
        ${itineraryHTML}
        ${facilitiesHTML}
        ${coverageHTML}
        ${policyHTML("Please Note", "Terms & Conditions", terms)}
        ${policyHTML("Good to Know", "Cancellation Policy", cancellation)}
      </div>`;
  },

  bars(root, { PAGE_H, totalPages, ctx }) {
    const lineL = `<div style="flex:1;height:1px;background:linear-gradient(to right,rgba(232,210,180,0),${C.champagne});"></div>`;
    const lineR = `<div style="flex:1;height:1px;background:linear-gradient(to left,rgba(232,210,180,0),${C.champagne});"></div>`;
    const dia = `<div style="flex:none;width:5px;height:5px;background:${C.gold};transform:rotate(45deg);"></div>`;

    // Contact details live here only: email, phone, website (clickable).
    const contact = ctx.co.cells
      .filter((c) => c.label !== "WHATSAPP")
      .map((c) => `<a href="${escapeHTML(c.href)}" style="color:${C.roseDeep};text-decoration:none;">${escapeHTML(c.text)}</a>`)
      .join(`<span style="color:${C.gold};padding:0 8px;">&#9670;</span>`);

    const out = [];
    for (let p = 1; p < totalPages; p++) {
      out.push(`
        <div style="position:absolute;left:0;top:${p * PAGE_H}px;width:${PAGE_W}px;height:${BAR_TOP_H}px;box-sizing:border-box;padding:0 ${CONTENT_X}px;display:flex;align-items:center;gap:16px;background:${C.cream};">
          ${lineL}
          <span style="flex:none;white-space:nowrap;font-family:${SERIF};font-size:15px;font-weight:600;letter-spacing:.26em;color:${C.rose};text-transform:uppercase;">Manyara <span style="font-family:${SANS};font-size:7.5px;font-weight:600;letter-spacing:.4em;color:${C.gold};">PRIVÉ VACATIONS</span></span>
          ${lineR}
        </div>
        <div style="position:absolute;left:0;top:${(p + 1) * PAGE_H - BAR_BOTTOM_H}px;width:${PAGE_W}px;height:${BAR_BOTTOM_H}px;box-sizing:border-box;padding:0 ${CONTENT_X}px;display:flex;align-items:center;gap:12px;background:${C.cream};">
          ${lineL}
          ${dia}
          <span style="flex:none;white-space:nowrap;font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.24em;color:${C.gold};">PAGE ${p + 1} OF ${totalPages}</span>
          ${dia}
          <span style="flex:none;white-space:nowrap;font-family:${SANS};font-size:9.5px;font-weight:500;color:${C.muted};">${contact}</span>
          ${dia}
          ${lineR}
        </div>`);
    }
    root.insertAdjacentHTML("beforeend", out.join(""));
  },
};

/* =====================================================================
   SHARED ENGINE  (identical in every version - design lives above)
   ===================================================================== */

/**
 * @param pkg           package object
 * @param siteSettings  optional - pass the object you already have from
 *                      getSiteSettings(); if omitted it is fetched here.
 */
export const generatePackagePDF = async (pkg, siteSettings = null) => {
  if (!pkg) {
    throw new Error("Package information is required to generate the PDF.");
  }

  const { default: html2pdf } = await import("html2pdf.js");
  const { scale: SCALE, pageH: PAGE_H } = getGeometry();

  // ---- Normalize data ------------------------------------------------
  const has = (v) => v !== null && v !== undefined && v !== "";

  const itinerary = (Array.isArray(pkg.itinerary) ? [...pkg.itinerary] : []).sort(
    (a, b) => Number(a?.day ?? 0) - Number(b?.day ?? 0)
  );

  const facilities = normalizeList(pkg.facilities);
  const inclusions = normalizeList(pkg.inclusions);
  const exclusions = normalizeList(pkg.exclusions);
  const terms = normalizePolicy(pkg.terms_and_conditions);
  const cancellation = normalizePolicy(pkg.cancellation_policy);

  const images = Array.isArray(pkg.images) ? pkg.images : [];
  const rawCover = images.length ? getImageUrl(images[0]) : null;

  const title = pkg.title || "Travel Package";
  const destination = has(pkg.destination) ? String(pkg.destination).trim() : "";
  // "Dubai" above a title that is also "Dubai" looks like a typo: use a neutral eyebrow instead.
  const eyebrow =
    destination && destination.toLowerCase() !== String(title).trim().toLowerCase()
      ? destination
      : "Curated Journey";

  const durationText = has(pkg.duration_days)
    ? `${pkg.duration_days} Days${has(pkg.duration_nights) ? ` / ${pkg.duration_nights} Nights` : ""}`
    : "";

  // ---- Company details: dynamic, same source as Footer.jsx ----------
  const settings = siteSettings || (await fetchSettings());
  const co = buildCompany(settings);

  // ---- Fonts + images MUST be ready before building / measuring -----
  await ensureFonts();

  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}${LOGO_PATH}` : null;
  const coverUrl = optimizeUrl(rawCover, 1800);
  const dayUrls = itinerary.map((d) => optimizeUrl(getImageUrl(d?.image), 900));
  const sizes = await preloadImages([logoUrl, coverUrl, ...dayUrls]);

  const coverImage = coverUrl && sizes.has(coverUrl) ? coverUrl : null;
  const ctx = {
    pkg,
    title,
    eyebrow,
    has,
    itinerary,
    facilities,
    inclusions,
    exclusions,
    terms,
    cancellation,
    durationText,
    co,
    logoUrl,
    logoSize: logoUrl && sizes.has(logoUrl) ? sizes.get(logoUrl) : null,
    coverImage,
    coverSize: coverImage ? sizes.get(coverImage) : null,
    dayUrls,
    sizes,
  };

  // ---- Off-screen container -----------------------------------------
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "absolute",
    left: "-10000px",
    top: "0",
    width: `${PAGE_W}px`,
    backgroundColor: C.cream,
    zIndex: "999999",
    pointerEvents: "none",
    overflow: "visible",
  });

  container.innerHTML = `
    <div style="position:relative;width:${PAGE_W}px;background:${C.cream};color:${C.body};font-family:${SANS};line-height:1.5;box-sizing:border-box;">
      ${DESIGN.build(ctx)}
    </div>`;

  document.body.appendChild(container);

  try {
    const pdfContent = container.firstElementChild;
    if (!pdfContent) throw new Error("PDF content could not be created.");

    await waitForContainerImages(pdfContent);
    await nextFrame();

    splitParagraphsIntoLines(pdfContent);
    paginate(pdfContent, PAGE_H);
    balancePages(pdfContent, PAGE_H);
    const totalPages = finishLayout(pdfContent, PAGE_H);
    DESIGN.bars(pdfContent, { PAGE_H, totalPages, ctx });
    await nextFrame();

    const fileName = `${slugify(title)}-itinerary.pdf`;

    await html2pdf()
      .set({
        margin: 0,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        enableLinks: true, // <a href> become clickable PDF links
        html2canvas: {
          scale: SCALE,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: C.cream,
          imageTimeout: 15000,
          scrollX: 0,
          scrollY: 0,
          windowWidth: PAGE_W,
          windowHeight: Math.max(pdfContent.scrollHeight, 1123),
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
        pagebreak: { mode: ["css"] },
      })
      .from(pdfContent)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        // Rounding can leave a stray blank page at the end: drop it.
        let count = pdf.internal.getNumberOfPages();
        while (count > totalPages && count > 1) {
          pdf.deletePage(count);
          count -= 1;
        }
      })
      .save();

    return fileName;
  } catch (error) {
    console.error("PDF GENERATION FAILED:", error);
    throw error;
  } finally {
    container.remove();
  }
};

// ---------------------------------------------------------
// Building blocks shared by the designs
// ---------------------------------------------------------

// Markers are drawn with plain shapes (no font glyphs) so they always sit centred.
const DIAMOND = `<span style="flex:none;width:6px;height:6px;margin-top:7px;background:${C.gold};transform:rotate(45deg);"></span>`;
const TICK = `<span style="flex:none;position:relative;width:16px;height:16px;margin-top:1px;border-radius:50%;background:${C.rose};"><span style="position:absolute;left:5.5px;top:2.5px;width:4px;height:8px;border:solid #fff;border-width:0 1.8px 1.8px 0;transform:rotate(45deg);"></span></span>`;
const CROSS = `<span style="flex:none;position:relative;width:16px;height:16px;margin-top:1px;box-sizing:border-box;border-radius:50%;border:1px solid ${C.muted};"><span style="position:absolute;left:3.5px;top:6px;width:7px;height:1.5px;background:${C.muted};transform:rotate(45deg);"></span><span style="position:absolute;left:3.5px;top:6px;width:7px;height:1.5px;background:${C.muted};transform:rotate(-45deg);"></span></span>`;

/* lead = number of leading words shown in bold ("Refunds:" -> 1) */
const paragraph = (text, size, color, lineHeight, { lead = 0, leadColor = C.ink } = {}) =>
  `<div data-lines ${
    lead ? `data-lead="${lead}" data-leadstyle="font-weight:600;color:${leadColor};"` : ""
  } style="font-family:${SANS};font-size:${size}px;line-height:${lineHeight};color:${color};margin:0 0 8px;white-space:pre-line;">${escapeHTML(text)}</div>`;

const policyPoint = (text) => {
  const match = text.match(/^([^:\n]{2,50}):\s+\S/);
  const lead = match ? `${match[1]}:`.split(/\s+/).length : 0;
  return paragraph(text, 11.5, C.muted, 1.7, { lead, leadColor: C.ink });
};

const columnsFor = (count, max) => (count <= 2 ? Math.max(1, count) : count === 4 ? 2 : max);

const itemGrid = (items, marker, columns) => `
  <div style="display:flex;flex-wrap:wrap;">
    ${items
      .map(
        (item) => `
        <div style="flex:0 0 ${(100 / columns).toFixed(4)}%;box-sizing:border-box;padding:0 12px 9px 0;display:flex;gap:9px;align-items:flex-start;">
          ${marker}
          <span style="min-width:0;font-family:${SANS};font-size:12.5px;line-height:1.5;color:${C.body};">${escapeHTML(item)}</span>
        </div>`
      )
      .join("")}
  </div>`;

const panel = (title, body, bg, border, titleColor) => `
  <div style="flex:1;min-width:0;background:${bg};border:1px solid ${border};border-radius:14px;padding:18px 18px 9px;box-sizing:border-box;">
    <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${titleColor};margin-bottom:10px;line-height:1.2;">
      ${escapeHTML(title)}
    </div>
    ${body}
  </div>`;

/* Clickable contact cells: 1-3 in one row, 4 in a 2 x 2 grid. */
const contactGrid = (co, bg, border, radius = 12, align = "left") => {
  const cols = co.cells.length >= 4 ? 2 : Math.max(1, co.cells.length);

  return `
    <div style="display:flex;flex-wrap:wrap;border:1px solid ${border};border-radius:${radius}px;overflow:hidden;background:${bg};text-align:${align};">
      ${co.cells
        .map((cell, i) => {
          const edges =
            (i % cols !== 0 ? `border-left:1px solid ${border};` : "") +
            (i >= cols ? `border-top:1px solid ${border};` : "");

          return `
            <a href="${escapeHTML(cell.href)}" style="display:block;flex:0 0 ${(100 / cols).toFixed(4)}%;min-width:0;box-sizing:border-box;padding:11px 14px;text-decoration:none;${edges}">
              <div style="font-family:${SANS};font-size:8.5px;font-weight:600;letter-spacing:.22em;color:${C.gold};">${escapeHTML(cell.label)}</div>
              <div style="font-family:${SANS};font-size:11.5px;font-weight:500;color:${C.roseDeep};margin-top:3px;line-height:1.35;word-break:break-word;">${escapeHTML(cell.text)}</div>
            </a>`;
        })
        .join("")}
    </div>`;
};

const addressBlock = (co, color, linkColor, align = "left") =>
  co.address
    ? `<div style="font-family:${SANS};font-size:11.5px;line-height:1.55;color:${color};text-align:${align};">
         ${escapeHTML(co.address)}${co.landmark ? `<br><span style="font-size:10.5px;opacity:.8;">${escapeHTML(co.landmark)}</span>` : ""}
         ${
           co.mapsHref
             ? `<br><a href="${escapeHTML(co.mapsHref)}" style="color:${linkColor};text-decoration:none;font-weight:600;font-size:10.5px;letter-spacing:.04em;">View on Google Maps &rarr;</a>`
             : ""
         }
       </div>`
    : "";

const whatsappPill = (co) =>
  co.whatsappHref
    ? `<a href="${escapeHTML(co.whatsappHref)}" style="display:inline-block;background:${C.rose};color:#fff;border-radius:999px;padding:9px 20px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:.05em;text-decoration:none;white-space:nowrap;">Chat on WhatsApp &rarr;</a>`
    : "";

/* Logo on the same light chip the site footer uses; text wordmark as fallback. */
const logoChip = (ctx, height, { pad = "8px 16px", radius = 12, shadow = "0 6px 18px rgba(0,0,0,.18)" } = {}) => {
  const box = `display:inline-block;background:${C.logoBg};border-radius:${radius}px;padding:${pad};${shadow ? `box-shadow:${shadow};` : ""}`;
  if (ctx.logoSize && ctx.logoSize.w && ctx.logoSize.h) {
    const w = Math.round((ctx.logoSize.w / ctx.logoSize.h) * height);
    return `
      <div style="${box}">
        <img src="${escapeHTML(ctx.logoUrl)}" crossorigin="anonymous" alt="${escapeHTML(BRAND)}"
             style="display:block;width:${w}px;height:${height}px;" />
      </div>`;
  }
  return `
    <div style="${box}text-align:center;">
      <div style="font-family:${SERIF};font-size:${Math.round(height * 0.62)}px;font-weight:600;letter-spacing:.3em;color:${C.rose};text-transform:uppercase;padding-left:.3em;line-height:1.2;">Manyara</div>
      <div style="font-family:${SANS};font-size:${Math.max(6, Math.round(height * 0.2))}px;font-weight:500;letter-spacing:.5em;color:${C.gold};margin-top:2px;padding-left:.5em;">PRIVÉ VACATIONS</div>
    </div>`;
};

/* Photo that fills w x h (centre-cropped by scaling, so it works in html2canvas). */
function photoBox(url, size, w, h, extraStyle = "") {
  if (!url || !size || !size.w || !size.h) return "";
  const k = Math.max(w / size.w, h / size.h);
  const iw = Math.round(size.w * k);
  const ih = Math.round(size.h * k);
  const left = Math.round((w - iw) / 2);
  const top = Math.round((h - ih) / 2);
  return `
    <div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;${extraStyle}">
      <img src="${escapeHTML(url)}" crossorigin="anonymous" alt=""
           style="position:absolute;left:${left}px;top:${top}px;width:${iw}px;height:${ih}px;display:block;" />
    </div>`;
}

/* Itinerary photo: never cropped, only scaled to fit maxW x maxH. */
function dayImage(ctx, index, maxW, maxH, { radius = 12, top = 12, center = false } = {}) {
  const url = ctx.dayUrls[index];
  const size = url ? ctx.sizes.get(url) : null;
  if (!url || !size || !size.w || !size.h) return "";

  const fit = Math.min(maxW / size.w, maxH / size.h);
  const w = Math.round(size.w * fit);
  const h = Math.round(size.h * fit);

  return `
    <div style="margin:${top}px ${center ? "auto" : "0"} 0;width:${w}px;height:${h}px;border-radius:${radius}px;overflow:hidden;">
      <img src="${escapeHTML(url)}" crossorigin="anonymous" alt=""
           style="display:block;width:${w}px;height:${h}px;" />
    </div>`;
}

// ---------------------------------------------------------
// Company details
// ---------------------------------------------------------

/** Same API as Footer.jsx; never blocks the PDF for more than 4s. */
async function fetchSettings() {
  try {
    return await Promise.race([
      getSiteSettings(),
      new Promise((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
  } catch (error) {
    console.warn("Could not load site settings for the PDF:", error);
    return null;
  }
}

function buildCompany(data) {
  const email = String(data?.email_address || "").trim();
  const phone = String(data?.phone_number || "").trim();
  const whatsapp = String(data?.whatsapp_number || "").trim();
  const rawAddress = String(data?.company_address || "").trim();
  const address = rawAddress && rawAddress !== DEFAULT_ADDRESS ? rawAddress : "";
  const landmark =
    data?.show_address_landmark === true
      ? String(data?.address_landmark || "").trim()
      : "";

  const phoneDigits = phone.replace(/\D/g, "");
  const waDigitsRaw = whatsapp.replace(/\D/g, "");

  // Numbers saved without a country code get the default one.
  const withCode = (digits) => (digits.length === 10 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits);
  const telDigits = withCode(phoneDigits);
  const waDigits = withCode(waDigitsRaw);

  const telHref = telDigits ? `tel:+${telDigits}` : "";
  const whatsappHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
        `Hello ${BRAND}, I would like to know more about your travel packages.`
      )}`
    : "";

  // Call and WhatsApp are often the same number: show it once.
  const sameNumber =
    phoneDigits && waDigitsRaw && phoneDigits.slice(-10) === waDigitsRaw.slice(-10);

  const cells = [];
  if (email) cells.push({ label: "EMAIL", text: email, href: `mailto:${email}` });

  if (sameNumber) {
    cells.push({ label: "CALL / WHATSAPP", text: phone, href: telHref });
  } else {
    if (telDigits) cells.push({ label: "CALL US", text: phone, href: telHref });
    if (waDigits) cells.push({ label: "WHATSAPP", text: whatsapp, href: whatsappHref });
  }

  cells.push({ label: "WEBSITE", text: SITE_LABEL, href: SITE_URL });

  let mapsHref = getMapsLink(data?.address_url, rawAddress);
  if (!mapsHref && address) {
    mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  return { email, phone, address, landmark, mapsHref, whatsappHref, cells };
}

/** Same Google Maps conversion logic as Footer.jsx / Contact.jsx. */
function getMapsLink(rawUrl, address) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return "";
  }
  if (parsed.protocol !== "https:") return "";

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  const isShortLink =
    host === "maps.app.goo.gl" || (host === "goo.gl" && path.startsWith("/maps"));
  const isGoogleMaps =
    isShortLink ||
    host === "maps.google.com" ||
    (["www.google.com", "google.com", "www.google.co.in", "google.co.in"].includes(host) &&
      path.startsWith("/maps"));
  if (!isGoogleMaps) return "";

  const output = (parsed.searchParams.get("output") || "").toLowerCase();
  const isEmbed =
    path.includes("/maps/embed") || output === "embed" || output === "svembed";
  if (!isEmbed) return parsed.href;

  const cidMatch = value.match(/!1s0x[0-9a-f]+(?::|%3A)0x([0-9a-f]+)/i);
  if (cidMatch) {
    try {
      return `https://www.google.com/maps?cid=${BigInt(`0x${cidMatch[1]}`).toString()}`;
    } catch {
      /* fall through */
    }
  }

  const coordMatch = value.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/i);
  if (coordMatch) {
    return `https://www.google.com/maps/search/?api=1&query=${coordMatch[2]},${coordMatch[1]}`;
  }

  const fromLink = (
    parsed.searchParams.get("q") || parsed.searchParams.get("destination") || ""
  ).trim();
  const cleanAddress = String(address || "").trim();
  const query = fromLink || (cleanAddress && cleanAddress !== DEFAULT_ADDRESS ? cleanAddress : "");
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : "";
}

// ---------------------------------------------------------
// Pagination
// ---------------------------------------------------------

/**
 * Replace every [data-lines] block with one atom per rendered line, so a
 * page break can fall BETWEEN lines instead of through one. Optional
 * data-lead="N" makes the first N words bold (policy labels).
 */
function splitParagraphsIntoLines(root) {
  root.querySelectorAll("[data-lines]").forEach((p) => {
    const rows = p.textContent
      .split(/\n+/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (!rows.length) return;

    const leadCount = Number(p.getAttribute("data-lead") || 0);
    const leadStyle = p.getAttribute("data-leadstyle") || "font-weight:600;";

    p.style.whiteSpace = "normal";
    p.innerHTML = rows
      .map((row, r) =>
        row
          .split(/\s+/)
          .map((word, i) => {
            const isLead = r === 0 && i < leadCount;
            return `<span data-r="${r}"${isLead ? ` data-b="1" style="${leadStyle}"` : ""}>${escapeHTML(word)}</span>`;
          })
          .join(" ")
      )
      .join("<br>");

    const groups = [];
    p.querySelectorAll("span").forEach((s) => {
      const top = s.getBoundingClientRect().top;
      const word = { text: s.textContent, bold: s.hasAttribute("data-b") };
      const last = groups[groups.length - 1];

      if (last && Math.abs(last.top - top) < 4) last.words.push(word);
      else groups.push({ top, row: Number(s.getAttribute("data-r")), words: [word] });
    });

    p.innerHTML = groups
      .map((g, i) => {
        const gap = i > 0 && g.row !== groups[i - 1].row ? "margin-top:6px;" : "";
        const html = g.words
          .map((w) => (w.bold ? `<span style="${leadStyle}">${escapeHTML(w.text)}</span>` : escapeHTML(w.text)))
          .join(" ");

        return `<div data-atom style="white-space:nowrap;${gap}">${html}</div>`;
      })
      .join("");
  });
}

const rootTopOf = (root) => root.getBoundingClientRect().top;
const topOf = (root, el) => el.getBoundingClientRect().top - rootTopOf(root);
const pageStartOf = (PAGE_H, n) => (n === 0 ? 0 : n * PAGE_H + TOP_SPACE);
const pageEndOf = (PAGE_H, n) => (n + 1) * PAGE_H - BOTTOM_SPACE;

/** Pushes `el` down to `target` with a spacer. isBreak marks a real page break. */
function pushTo(root, el, target, isBreak = false) {
  const gap = target - topOf(root, el);
  if (gap <= 0.5) return;

  const spacer = document.createElement("div");
  spacer.style.height = `${gap}px`;
  if (isBreak) spacer.setAttribute("data-page-break", "1");
  el.parentNode.insertBefore(spacer, el);

  const drift = target - topOf(root, el);
  if (Math.abs(drift) > 0.5) spacer.style.height = `${gap + drift}px`;
}

/**
 * Push atoms that would cross a page edge to the start of the next
 * page. Usable area of page n (n >= 1):
 *   [n * PAGE_H + TOP_SPACE, (n + 1) * PAGE_H - BOTTOM_SPACE]
 */
function paginate(root, PAGE_H) {
  const items = Array.from(root.querySelectorAll("[data-atom]"));

  items.forEach((el, i) => {
    const top = topOf(root, el);
    const n = Math.max(0, Math.floor((top + 0.5) / PAGE_H));

    const rect = el.getBoundingClientRect();
    let height = rect.height;

    // Headings stay with whatever comes next.
    const next = items[i + 1];
    if (el.hasAttribute("data-keep") && next) {
      height = next.getBoundingClientRect().bottom - rect.top;
    }

    // Starts inside the top padding of a page -> move below it.
    if (top < pageStartOf(PAGE_H, n) - 0.5) {
      pushTo(root, el, pageStartOf(PAGE_H, n));
    }

    const t = topOf(root, el);
    const page = Math.max(0, Math.floor((t + 0.5) / PAGE_H));
    const fits = height <= pageEndOf(PAGE_H, page) - pageStartOf(PAGE_H, page);

    if (fits && t + height > pageEndOf(PAGE_H, page) + 0.5) {
      pushTo(root, el, pageStartOf(PAGE_H, page + 1), true);
    }
  });
}

/**
 * Spread the spare room at the bottom of a page over the blocks above it, so
 * pages end evenly instead of leaving a gap.
 *  - data-stretch     : a spacer is added before the block
 *  - data-padstretch  : the block itself grows (its padding-bottom), which
 *                       keeps things like a timeline line unbroken
 */
function balancePages(root, PAGE_H) {
  const breaks = Array.from(root.querySelectorAll("[data-page-break]"));

  breaks.forEach((spacer) => {
    const anchor = spacer.nextElementSibling;
    if (!anchor) return;

    const spacerTop = topOf(root, spacer);
    const pageIdx = Math.max(0, Math.floor((spacerTop + 0.5) / PAGE_H));
    const start = pageStartOf(PAGE_H, pageIdx);
    const end = pageEndOf(PAGE_H, pageIdx);

    const spare = end - spacerTop - 4;
    if (spare < 8) return;

    const targets = Array.from(root.querySelectorAll("[data-stretch],[data-padstretch]")).filter((el) => {
      const t = topOf(root, el);
      return t >= start + 8 && t < spacerTop - 1;
    });
    if (!targets.length) return;

    const per = Math.min(MAX_STRETCH, spare / targets.length);
    const before = topOf(root, anchor);

    targets.forEach((el) => {
      if (el.hasAttribute("data-padstretch")) {
        const current = parseFloat(getComputedStyle(el).paddingBottom) || 0;
        el.style.paddingBottom = `${current + per}px`;
      } else {
        const extra = document.createElement("div");
        extra.style.height = `${per}px`;
        el.parentNode.insertBefore(extra, el);
      }
    });

    // Margin collapsing can make the shift differ slightly: cancel the drift
    // so the next page still starts in the same place.
    for (let pass = 0; pass < 2; pass++) {
      const drift = topOf(root, anchor) - before;
      if (Math.abs(drift) <= 0.5) break;

      const current = parseFloat(spacer.style.height) || spacer.getBoundingClientRect().height;
      spacer.style.height = `${Math.max(0, current - drift)}px`;
    }
  });
}

/** Counts pages from the last block and fixes the document height. */
function finishLayout(root, PAGE_H) {
  let bottom = 0;
  root.querySelectorAll("[data-atom]").forEach((el) => {
    bottom = Math.max(bottom, topOf(root, el) + el.getBoundingClientRect().height);
  });

  const totalPages = Math.max(1, Math.floor((bottom - 0.5) / PAGE_H) + 1);
  // 1px short so rounding can never create an extra blank page.
  root.style.height = `${totalPages * PAGE_H - 1}px`;
  root.style.overflow = "hidden";
  return totalPages;
}

// ---------------------------------------------------------
// Fonts / images
// ---------------------------------------------------------

async function ensureFonts() {
  try {
    const hasFace = Array.from(document.fonts).some(
      (f) => f.family.replace(/["']/g, "") === "Cormorant Garamond"
    );

    if (!hasFace && !document.getElementById("manyara-pdf-fonts")) {
      const link = document.createElement("link");
      link.id = "manyara-pdf-fonts";
      link.rel = "stylesheet";
      link.href = FONT_URL;
      document.head.appendChild(link);
      await new Promise((resolve) => {
        link.onload = resolve;
        link.onerror = resolve;
        setTimeout(resolve, 4000);
      });
    }

    await Promise.all([
      document.fonts.load(`600 32px "Cormorant Garamond"`),
      document.fonts.load(`700 32px "Cormorant Garamond"`),
      document.fonts.load(`italic 500 17px "Cormorant Garamond"`),
      document.fonts.load(`400 13px Inter`),
      document.fonts.load(`500 13px Inter`),
      document.fonts.load(`600 13px Inter`),
    ]);
    await document.fonts.ready;
  } catch (error) {
    console.warn("Font loading warning:", error);
  }
}

/** Resolves to Map(url -> {w, h}) for the images that loaded. */
function preloadImages(urls) {
  const sizes = new Map();

  return Promise.all(
    urls.filter(Boolean).map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            sizes.set(url, { w: img.naturalWidth, h: img.naturalHeight });
            resolve();
          };
          img.onerror = () => {
            console.warn("Image failed to load:", url);
            resolve();
          };
          img.src = url;
        })
    )
  ).then(() => sizes);
}

function waitForContainerImages(root) {
  return Promise.all(
    Array.from(root.querySelectorAll("img")).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          })
    )
  );
}

function nextFrame() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
}

// ---------------------------------------------------------
// Data helpers
// ---------------------------------------------------------

/** Cloudinary: resized JPEG, never upscaled, never cropped (c_limit). */
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
  const parts = BREAK_CHARS.test(value)
    ? value.split(/\r?\n|[\u2022\u25AA\u25CF]/)
    : value.split(/[,;]/);

  return parts.map(stripBullet).filter(Boolean);
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    const items = value.map(normalizeListItem).filter(Boolean);

    // A single saved string: treat it like plain text.
    if (items.length === 1) return splitText(items[0]);

    return items.flatMap((item) =>
      BREAK_CHARS.test(item) ? splitText(item) : [stripBullet(item)]
    );
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

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

export default generatePackagePDF;












































// import { getSiteSettings } from "../api/content"; // same API the Footer / Contact page use

// const BRAND = "Manyara Privé Vacations";
// const TAGLINE = "Curated journeys. Effortless luxury.";
// const SITE_URL = "https://manyaraprivevacations.com";
// const SITE_LABEL = "manyaraprivevacations.com";
// const LOGO_PATH = "/images/Manyara_3.webp"; // same logo the site Footer uses
// const DEFAULT_ADDRESS = "India";
// const DEFAULT_COUNTRY_CODE = "91"; // used when a phone number is saved without a country code

// // Palette mirrors tailwind.config.js (light, rose-led theme)
// const C = {
//   ink: "#2F2A33",
//   body: "#4A4A52",
//   muted: "#6E6973",
//   rose: "#C8135E",
//   roseDeep: "#AB1050",
//   roseBright: "#E8286F",
//   roseSoft: "#FEF4F8",
//   roseWash: "#FFF9FB",
//   roseLine: "#FCD6E4",
//   champagne: "#E8D2B4",
//   champagneSoft: "#F7EBDB",
//   gold: "#B08D57",
//   line: "#EAE5E8",
//   surface: "#FBF6F8",
//   logoBg: "#EEF1F5", // same chip colour the site footer puts behind the logo
// };

// const ROSE_BG = "linear-gradient(135deg,#D63C80,#E8548F 55%,#F27AA8)";


// const SERIF = `'Cormorant Garamond','Playfair Display',Georgia,serif`;
// const SANS = `Inter,system-ui,Arial,sans-serif`;

// const FONT_URL =
//   "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap";

// // ---- Page geometry (CSS px at 794px = A4 width) ----------------------
// const PAGE_W = 794;
// const CONTENT_X = 48;
// const CONTENT_W = PAGE_W - CONTENT_X * 2; // 698

// const BAR_TOP_H = 38; // running header bar (pages 2+)
// const BAR_BOTTOM_H = 34; // running footer bar (every page except the last)
// const TOP_SPACE = 58; // content starts this far below the top of pages 2+
// const BOTTOM_SPACE = 52; // content ends this far above the bottom of a page
// const MAX_STRETCH = 32; // max extra space added between blocks to fill a page

// const HERO_IMG_MAX_W = CONTENT_W - 6; // 3px white border on each side
// const HERO_IMG_MAX_H = 360;
// const DAY_IMG_W = 258; // itinerary image column (4:3 -> 258 x 194)
// const DAY_IMG_MAX_H = 216; // images are never cropped, only scaled to fit



// function getGeometry() {
//   const isMobile =
//     typeof navigator !== "undefined" &&
//     /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
//   const scale = isMobile ? 1.2 : 1.5;
//   const pageH = Math.floor((PAGE_W * scale * 297) / 210) / scale;
//   return { scale, pageH };
// }

// /**
//  * @param pkg           package object
//  * @param siteSettings  optional - pass the object you already have from
//  *                      getSiteSettings(); if omitted it is fetched here.
//  */
// export const generatePackagePDF = async (pkg, siteSettings = null) => {
//   if (!pkg) {
//     throw new Error("Package information is required to generate the PDF.");
//   }

//   const { default: html2pdf } = await import("html2pdf.js");
//   const { scale: SCALE, pageH: PAGE_H } = getGeometry();

//   // ---------------------------------------------------------
//   // Normalize data
//   // ---------------------------------------------------------
//   const has = (v) => v !== null && v !== undefined && v !== "";

//   const itinerary = (Array.isArray(pkg.itinerary) ? [...pkg.itinerary] : []).sort(
//     (a, b) => Number(a?.day ?? 0) - Number(b?.day ?? 0)
//   );

//   const facilities = normalizeList(pkg.facilities);
//   const inclusions = normalizeList(pkg.inclusions);
//   const exclusions = normalizeList(pkg.exclusions);
//   const terms = normalizePolicy(pkg.terms_and_conditions);
//   const cancellation = normalizePolicy(pkg.cancellation_policy);

//   const images = Array.isArray(pkg.images) ? pkg.images : [];
//   const rawCover = images.length ? getImageUrl(images[0]) : null;

//   const durationText = has(pkg.duration_days)
//     ? `${pkg.duration_days} Days${has(pkg.duration_nights) ? ` / ${pkg.duration_nights} Nights` : ""}`
//     : "";

//   // ---------------------------------------------------------
//   // Company details: dynamic, same source as Footer.jsx
//   // ---------------------------------------------------------
//   const settings = siteSettings || (await fetchSettings());
//   const co = buildCompany(settings);

//   // ---------------------------------------------------------
//   // Fonts + images MUST be ready before building / measuring.
//   // ---------------------------------------------------------
//   await ensureFonts();

//   const logoUrl = typeof window !== "undefined" ? `${window.location.origin}${LOGO_PATH}` : null;
//   const coverUrl = optimizeUrl(rawCover, 1600);
//   const dayUrls = itinerary.map((d) => optimizeUrl(getImageUrl(d?.image), 900));
//   const sizes = await preloadImages([logoUrl, coverUrl, ...dayUrls]);

//   const logoSize = logoUrl && sizes.has(logoUrl) ? sizes.get(logoUrl) : null;
//   const coverImage = coverUrl && sizes.has(coverUrl) ? coverUrl : null;

//   const coverSize = coverImage ? sizes.get(coverImage) : null;
//   let heroImgW = 0;
//   let heroImgH = 0;
//   if (coverSize && coverSize.w && coverSize.h) {
//     const fit = Math.min(HERO_IMG_MAX_W / coverSize.w, HERO_IMG_MAX_H / coverSize.h);
//     heroImgW = Math.round(coverSize.w * fit);
//     heroImgH = Math.round(coverSize.h * fit);
//   }

//   // Logo chip. Same chip colour as the website footer. Falls back to a text
//   // wordmark if the logo file cannot be loaded.
//   const logoChip = (height, { pad = "9px 18px" } = {}) => {
//     if (logoSize && logoSize.w && logoSize.h) {
//       const w = Math.round((logoSize.w / logoSize.h) * height);
//       return `
//         <div style="display:inline-block;background:${C.logoBg};border-radius:12px;padding:${pad};box-shadow:0 6px 18px rgba(0,0,0,.20);">
//           <img src="${escapeHTML(logoUrl)}" crossorigin="anonymous" alt="${escapeHTML(BRAND)}"
//                style="display:block;width:${w}px;height:${height}px;" />
//         </div>`;
//     }
//     return `
//       <div style="display:inline-block;background:${C.logoBg};border-radius:12px;padding:${pad};box-shadow:0 6px 18px rgba(0,0,0,.20);text-align:center;">
//         <div style="font-family:${SERIF};font-size:${Math.round(height * 0.62)}px;font-weight:600;letter-spacing:.3em;color:${C.rose};text-transform:uppercase;padding-left:.3em;line-height:1.2;">Manyara</div>
//         <div style="font-family:${SANS};font-size:${Math.max(7, Math.round(height * 0.2))}px;font-weight:500;letter-spacing:.5em;color:${C.gold};margin-top:2px;padding-left:.5em;">PRIVÉ VACATIONS</div>
//       </div>`;
//   };



//   const heading = (eyebrow, text, atom = true) => `
//     <div ${atom ? "data-atom data-keep" : ""} style="margin:0 0 12px;">
//       <div style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:${C.gold};margin-bottom:4px;">
//         ${escapeHTML(eyebrow)}
//       </div>
//       <div style="display:flex;align-items:center;gap:12px;">
//         <div style="font-family:${SERIF};font-size:32px;font-weight:600;color:${C.roseDeep};line-height:1.2;white-space:nowrap;">
//           ${escapeHTML(text)}
//         </div>
//         <div style="flex:1;height:1px;background:linear-gradient(to right,${C.champagne},rgba(232,210,180,0));"></div>
//         <div style="width:7px;height:7px;background:${C.gold};transform:rotate(45deg);"></div>
//       </div>
//     </div>`;

//   /* lead = number of leading words shown in bold ("Refunds:" -> 1) */
//   const paragraph = (text, size, color, lineHeight, { lead = 0, leadColor = C.ink } = {}) =>
//     `<div data-lines ${
//       lead ? `data-lead="${lead}" data-leadstyle="font-weight:600;color:${leadColor};"` : ""
//     } style="font-family:${SANS};font-size:${size}px;line-height:${lineHeight};color:${color};margin:0 0 8px;white-space:pre-line;">${escapeHTML(text)}</div>`;

//   const summaryCard = (label, value, accent = C.ink, sub = "") => `
//     <div style="flex:1;display:flex;flex-direction:column;justify-content:center;border:1px solid ${C.champagne};background:${C.champagneSoft};border-radius:12px;padding:14px 18px;text-align:center;box-sizing:border-box;">
//       <div style="font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.26em;color:${C.gold};">
//         ${escapeHTML(label)}
//       </div>
//       <div style="font-family:${SERIF};font-size:26px;font-weight:600;color:${accent};margin-top:3px;line-height:1.2;">
//         ${escapeHTML(value)}
//       </div>
//       ${
//         sub
//           ? `<div style="font-family:${SANS};font-size:10px;color:${C.muted};margin-top:2px;">${escapeHTML(sub)}</div>`
//           : ""
//       }
//     </div>`;

//   // Markers are drawn with plain shapes (no font glyphs), so they always
//   // sit centred in their circle.
//   const diamond = `<span style="flex:none;width:6px;height:6px;margin-top:7px;background:${C.gold};transform:rotate(45deg);"></span>`;
//   const tick = `<span style="flex:none;position:relative;width:16px;height:16px;margin-top:1px;border-radius:50%;background:${C.rose};"><span style="position:absolute;left:5.5px;top:2.5px;width:4px;height:8px;border:solid #fff;border-width:0 1.8px 1.8px 0;transform:rotate(45deg);"></span></span>`;
//   const cross = `<span style="flex:none;position:relative;width:16px;height:16px;margin-top:1px;box-sizing:border-box;border-radius:50%;border:1px solid ${C.muted};"><span style="position:absolute;left:3.5px;top:6px;width:7px;height:1.5px;background:${C.muted};transform:rotate(45deg);"></span><span style="position:absolute;left:3.5px;top:6px;width:7px;height:1.5px;background:${C.muted};transform:rotate(-45deg);"></span></span>`;

//   const columnsFor = (count, max) => (count <= 2 ? Math.max(1, count) : count === 4 ? 2 : max);

//   const itemGrid = (items, marker, columns) => `
//     <div style="display:flex;flex-wrap:wrap;">
//       ${items
//         .map(
//           (item) => `
//           <div style="flex:0 0 ${(100 / columns).toFixed(4)}%;box-sizing:border-box;padding:0 12px 9px 0;display:flex;gap:9px;align-items:flex-start;">
//             ${marker}
//             <span style="min-width:0;font-family:${SANS};font-size:12.5px;line-height:1.5;color:${C.body};">${escapeHTML(item)}</span>
//           </div>`
//         )
//         .join("")}
//     </div>`;

//   const panel = (title, body, bg, border, titleColor) => `
//     <div style="flex:1;min-width:0;background:${bg};border:1px solid ${border};border-radius:12px;padding:16px 16px 8px;box-sizing:border-box;">
//       <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${titleColor};margin-bottom:10px;line-height:1.2;">
//         ${escapeHTML(title)}
//       </div>
//       ${body}
//     </div>`;

//   /*
//     Clickable contact cells. 1-3 cells sit in one row, 4 cells make a 2 x 2
//     grid, so long emails and the website never break in the middle of a word.
//   */
//   const contactGrid = (bg, border, radius = 12) => {
//     const cols = co.cells.length >= 4 ? 2 : Math.max(1, co.cells.length);

//     return `
//       <div style="display:flex;flex-wrap:wrap;border:1px solid ${border};border-radius:${radius}px;overflow:hidden;background:${bg};">
//         ${co.cells
//           .map((cell, i) => {
//             const edges =
//               (i % cols !== 0 ? `border-left:1px solid ${border};` : "") +
//               (i >= cols ? `border-top:1px solid ${border};` : "");

//             return `
//               <a href="${escapeHTML(cell.href)}" style="display:block;flex:0 0 ${(100 / cols).toFixed(4)}%;min-width:0;box-sizing:border-box;padding:10px 12px;text-decoration:none;${edges}">
//                 <div style="font-family:${SANS};font-size:8.5px;font-weight:600;letter-spacing:.22em;color:${C.gold};">${escapeHTML(cell.label)}</div>
//                 <div style="font-family:${SANS};font-size:11.5px;font-weight:500;color:${C.roseDeep};margin-top:3px;line-height:1.35;word-break:break-word;">${escapeHTML(cell.text)}</div>
//               </a>`;
//           })
//           .join("")}
//       </div>`;
//   };

//   const addressBlock = (color, linkColor) =>
//     co.address
//       ? `<div style="font-family:${SANS};font-size:11.5px;line-height:1.55;color:${color};">
//            ${escapeHTML(co.address)}${co.landmark ? `<br><span style="font-size:10.5px;opacity:.8;">${escapeHTML(co.landmark)}</span>` : ""}
//            ${
//              co.mapsHref
//                ? `<br><a href="${escapeHTML(co.mapsHref)}" style="color:${linkColor};text-decoration:none;font-weight:600;font-size:10.5px;letter-spacing:.04em;">View on Google Maps &rarr;</a>`
//                : ""
//            }
//          </div>`
//       : "";

//   // ---------------------------------------------------------
//   // COVER (page 1): logo on top, the cover photo (never cropped), title
//   // ---------------------------------------------------------
//   const heroHTML = `
//     <div data-atom style="width:${PAGE_W}px;background:${ROSE_BG};box-sizing:border-box;">
//       <div style="height:4px;background:linear-gradient(90deg,${C.gold},${C.champagne},${C.gold});"></div>

//       <div style="display:flex;justify-content:center;padding-top:22px;">
//         ${logoChip(36, { pad: "8px 16px" })}
//       </div>

//       ${
//         coverImage && heroImgH
//           ? `<div style="display:flex;justify-content:center;padding-top:20px;">
//                <div style="box-sizing:content-box;width:${heroImgW}px;height:${heroImgH}px;border-radius:14px;overflow:hidden;border:3px solid rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(0,0,0,.22);">
//                  <img src="${escapeHTML(coverImage)}" crossorigin="anonymous" alt=""
//                       style="display:block;width:${heroImgW}px;height:${heroImgH}px;" />
//                </div>
//              </div>`
//           : ""
//       }

//       <div style="padding:22px ${CONTENT_X}px 28px;box-sizing:border-box;text-align:center;color:#fff;">
//         ${
//           pkg.destination
//             ? `<div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:${C.champagne};margin-bottom:10px;">${escapeHTML(pkg.destination)}</div>`
//             : ""
//         }
//         <div style="font-family:${SERIF};font-size:44px;font-weight:600;line-height:1.15;color:#fff;">
//           ${escapeHTML(pkg.title || "Travel Package")}
//         </div>
//         <div style="width:72px;height:3px;background:${C.champagne};margin:16px auto 0;border-radius:3px;"></div>
//       </div>
//     </div>`;

//   const coverBodyHTML = `
//     <div style="padding:22px ${CONTENT_X}px 0;">
//       ${
//         co.cells.length
//           ? `<div data-atom data-stretch style="margin-bottom:14px;">${contactGrid("#fff", C.champagne, 12)}</div>`
//           : ""
//       }
//       ${
//         durationText || has(pkg.price)
//           ? `<div data-atom data-stretch style="display:flex;gap:14px;">
//                ${durationText ? summaryCard("DURATION", durationText) : ""}
//                ${
//                  has(pkg.price)
//                    ? summaryCard("STARTING FROM", `\u20B9${formatPrice(pkg.price)}`, C.rose, "per person")
//                    : ""
//                }
//              </div>`
//           : ""
//       }
//       ${
//         pkg.description
//           ? `<div data-stretch style="margin-top:24px;">
//                ${heading("The Experience", "About This Journey")}
//                ${paragraph(pkg.description, 13, C.body, 1.75)}
//              </div>`
//           : ""
//       }
//     </div>`;

//   // ---------------------------------------------------------
//   // ITINERARY: one compact card per day (photo left, text right)
//   // ---------------------------------------------------------
//   const dayCard = (day, index) => {
//     const n = has(day?.day) ? day.day : index + 1;
//     const label = String(n).padStart(2, "0");

//     const url = dayUrls[index];
//     const size = url ? sizes.get(url) : null;
//     const description = day?.description ? String(day.description).trim() : "";

//     let imageHTML = "";
//     if (url && size && size.w && size.h) {
//       const fit = Math.min(DAY_IMG_W / size.w, DAY_IMG_MAX_H / size.h);
//       const w = Math.round(size.w * fit);
//       const h = Math.round(size.h * fit);

//       imageHTML = `
//         <div style="flex:none;width:${DAY_IMG_W}px;">
//           <div style="width:${w}px;height:${h}px;border-radius:10px;overflow:hidden;">
//             <img src="${escapeHTML(url)}" crossorigin="anonymous" alt=""
//                  style="display:block;width:${w}px;height:${h}px;" />
//           </div>
//         </div>`;
//     }

//     return `
//       <div data-atom data-stretch style="margin-bottom:14px;display:flex;align-items:center;gap:18px;box-sizing:border-box;background:#fff;border:1px solid ${C.champagne};border-left:4px solid ${C.rose};border-radius:14px;padding:14px;">
//         ${imageHTML}
//         <div style="flex:1;min-width:0;">
//           <div style="display:flex;align-items:center;gap:12px;">
//             <div style="flex:none;width:46px;height:46px;box-sizing:border-box;border-radius:12px;background:${C.roseSoft};border:1px solid ${C.roseLine};display:flex;flex-direction:column;align-items:center;justify-content:center;">
//               <span style="font-family:${SANS};font-size:7.5px;font-weight:600;letter-spacing:.2em;color:${C.gold};line-height:1;padding-left:.2em;">DAY</span>
//               <span style="font-family:${SANS};font-size:18px;font-weight:600;color:${C.rose};line-height:1.1;margin-top:3px;">${escapeHTML(label)}</span>
//             </div>
//             <div style="flex:1;min-width:0;font-family:${SERIF};font-size:21px;font-weight:600;color:${C.ink};line-height:1.2;">
//               ${escapeHTML(day?.title || `Day ${n}`)}
//             </div>
//           </div>
//           ${
//             description
//               ? `<div style="font-family:${SANS};font-size:12.5px;line-height:1.65;color:${C.body};margin-top:10px;white-space:pre-line;">${escapeHTML(description)}</div>`
//               : ""
//           }
//         </div>
//       </div>`;
//   };

//   const itineraryHTML = itinerary.length
//     ? `<div data-stretch style="margin-top:26px;">
//          ${heading("Your Journey", "Day-by-Day Itinerary")}
//          ${itinerary.map(dayCard).join("")}
//        </div>`
//     : "";

//   // ---------------------------------------------------------
//   // FACILITIES / INCLUSIONS / EXCLUSIONS
//   // ---------------------------------------------------------
//   const facilitiesHTML = facilities.length
//     ? `<div data-stretch style="margin-top:12px;">
//          <div data-atom>
//            ${heading("Comforts", "Facilities", false)}
//            <div style="background:${C.champagneSoft};border:1px solid ${C.champagne};border-radius:12px;padding:16px 16px 7px;">
//              ${itemGrid(facilities, diamond, columnsFor(facilities.length, 3))}
//            </div>
//          </div>
//        </div>`
//     : "";

//   const incPanel = inclusions.length
//     ? panel("Inclusions", itemGrid(inclusions, tick, 1), C.roseSoft, C.roseLine, C.roseDeep)
//     : "";
//   const excPanel = exclusions.length
//     ? panel("Exclusions", itemGrid(exclusions, cross, 1), C.surface, C.line, C.ink)
//     : "";

//   const coverageHTML =
//     incPanel || excPanel
//       ? `<div data-stretch style="margin-top:22px;">
//            ${heading("The Details", "What\u2019s Included")}
//            <div data-atom style="display:flex;gap:14px;align-items:stretch;">${incPanel}${excPanel}</div>
//          </div>`
//       : "";

//   // ---------------------------------------------------------
//   // POLICIES: one paragraph per point, with the label in bold
//   // ---------------------------------------------------------
//   const policyPoint = (text) => {
//     const match = text.match(/^([^:\n]{2,50}):\s+\S/);
//     const lead = match ? `${match[1]}:`.split(/\s+/).length : 0;
//     return paragraph(text, 11.5, C.muted, 1.7, { lead, leadColor: C.ink });
//   };

//   const policyHTML = (eyebrow, title, items) =>
//     items.length
//       ? `<div data-stretch style="margin-top:22px;">
//            ${heading(eyebrow, title)}
//            ${items.map(policyPoint).join("")}
//          </div>`
//       : "";

//   // ---------------------------------------------------------
//   // BOOKING CARD (call to action with full contact details)
//   // ---------------------------------------------------------
//   const whatsappPill = co.whatsappHref
//     ? `<a href="${escapeHTML(co.whatsappHref)}" style="flex:none;display:inline-block;background:${C.rose};color:#fff;border-radius:999px;padding:9px 18px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:.05em;text-decoration:none;white-space:nowrap;">Chat on WhatsApp &rarr;</a>`
//     : "";

//   const addressHTML = addressBlock(C.body, C.roseDeep);

//   const bookHTML =
//     co.cells.length || co.address
//       ? `<div data-stretch style="margin-top:26px;">
//            <div data-atom style="background:${C.champagneSoft};border:1px solid ${C.champagne};border-left:4px solid ${C.rose};border-radius:14px;padding:20px 22px;box-sizing:border-box;">
//              <div style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:.3em;color:${C.gold};">READY TO BOOK?</div>
//              <div style="font-family:${SERIF};font-size:26px;font-weight:600;color:${C.roseDeep};line-height:1.2;margin:4px 0 6px;">Plan This Journey With Us</div>
//              <div style="font-family:${SANS};font-size:12px;line-height:1.6;color:${C.body};margin-bottom:14px;">
//                Our travel specialists will tailor dates, stays and experiences to you. Reach out any time.
//              </div>
//              ${
//                co.cells.length
//                  ? `<div style="margin-bottom:${addressHTML || whatsappPill ? 14 : 0}px;">${contactGrid("#fff", C.roseLine, 10)}</div>`
//                  : ""
//              }
//              ${
//                addressHTML || whatsappPill
//                  ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
//                       <div style="flex:1;min-width:0;">${addressHTML}</div>
//                       ${whatsappPill}
//                     </div>`
//                  : ""
//              }
//            </div>
//          </div>`
//       : "";

//   // ---------------------------------------------------------
//   // CLOSING FOOTER: same rose as the cover, logo + contact details.
//   // Fills the rest of the last page, so no white gap is left.
//   // ---------------------------------------------------------
//   const footerHTML = `
//     <div data-footer style="width:${PAGE_W}px;margin-top:28px;padding:30px 48px;background:${ROSE_BG};border-top:4px solid ${C.gold};text-align:center;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;">
//       ${logoChip(40)}
//       <div style="width:40px;height:1px;background:${C.champagne};margin:16px auto 12px;"></div>
//       <div style="font-family:${SERIF};font-size:20px;font-style:italic;font-weight:500;color:${C.champagne};line-height:1.3;">${escapeHTML(TAGLINE)}</div>
//       <div style="font-family:${SANS};font-size:11px;color:#fff;margin-top:14px;line-height:1.9;">
//         ${co.cells
//           .map((c) => `<a href="${escapeHTML(c.href)}" style="color:#fff;text-decoration:none;font-weight:500;">${escapeHTML(c.text)}</a>`)
//           .join(`<span style="color:${C.champagne};padding:0 9px;">&#9670;</span>`)}
//       </div>
//       ${
//         co.address
//           ? `<div style="font-family:${SANS};font-size:10.5px;color:rgba(255,255,255,.85);margin-top:4px;line-height:1.6;max-width:560px;">
//                ${
//                  co.mapsHref
//                    ? `<a href="${escapeHTML(co.mapsHref)}" style="color:rgba(255,255,255,.9);text-decoration:none;">${escapeHTML(co.address)}</a>`
//                    : escapeHTML(co.address)
//                }
//              </div>`
//           : ""
//       }
//       <div style="font-family:${SANS};font-size:10px;color:rgba(255,255,255,.7);margin-top:12px;">
//         Thank you for choosing ${escapeHTML(BRAND)}.
//       </div>
//     </div>`;

//   // ---------------------------------------------------------
//   // Off-screen container
//   // ---------------------------------------------------------
//   const container = document.createElement("div");
//   Object.assign(container.style, {
//     position: "absolute",
//     left: "-10000px",
//     top: "0",
//     width: `${PAGE_W}px`,
//     backgroundColor: "#ffffff",
//     zIndex: "999999",
//     pointerEvents: "none",
//     overflow: "visible",
//   });

//   container.innerHTML = `
//     <div style="position:relative;width:${PAGE_W}px;background:#fff;color:${C.body};font-family:${SANS};line-height:1.5;box-sizing:border-box;">
//       ${heroHTML}
//       ${coverBodyHTML}
//       <div style="padding:0 ${CONTENT_X}px;">
//         ${itineraryHTML}
//         ${facilitiesHTML}
//         ${coverageHTML}
//         ${policyHTML("Please Note", "Terms & Conditions", terms)}
//         ${policyHTML("Good to Know", "Cancellation Policy", cancellation)}
//         ${bookHTML}
//       </div>
//       ${footerHTML}
//     </div>`;

//   document.body.appendChild(container);

//   try {
//     const pdfContent = container.firstElementChild;
//     if (!pdfContent) throw new Error("PDF content could not be created.");

//     await waitForContainerImages(pdfContent);
//     await nextFrame();

//     splitParagraphsIntoLines(pdfContent);
//     paginate(pdfContent, PAGE_H);
//     balancePages(pdfContent, PAGE_H);
//     const totalPages = placeFooter(pdfContent, PAGE_H);
//     addRunningBars(pdfContent, {
//       PAGE_H,
//       totalPages,
//       title: pkg.title || "Travel Package",
//     });
//     await nextFrame();

//     const fileName = `${slugify(pkg.title || "package")}-itinerary.pdf`;

//     await html2pdf()
//       .set({
//         margin: 0,
//         filename: fileName,
//         image: { type: "jpeg", quality: 0.98 },
//         enableLinks: true, // <a href> become clickable PDF links
//         html2canvas: {
//           scale: SCALE,
//           useCORS: true,
//           allowTaint: false,
//           logging: false,
//           backgroundColor: "#ffffff",
//           imageTimeout: 15000,
//           scrollX: 0,
//           scrollY: 0,
//           windowWidth: PAGE_W,
//           windowHeight: Math.max(pdfContent.scrollHeight, 1123),
//         },
//         jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
//         pagebreak: { mode: ["css"] },
//       })
//       .from(pdfContent)
//       .toPdf()
//       .get("pdf")
//       .then((pdf) => {
//         // Rounding can leave a stray blank page at the end: drop it.
//         let count = pdf.internal.getNumberOfPages();
//         while (count > totalPages && count > 1) {
//           pdf.deletePage(count);
//           count -= 1;
//         }
//       })
//       .save();

//     return fileName;
//   } catch (error) {
//     console.error("PDF GENERATION FAILED:", error);
//     throw error;
//   } finally {
//     container.remove();
//   }
// };

// // ---------------------------------------------------------
// // Company details
// // ---------------------------------------------------------

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

// function buildCompany(data) {
//   const email = String(data?.email_address || "").trim();
//   const phone = String(data?.phone_number || "").trim();
//   const whatsapp = String(data?.whatsapp_number || "").trim();
//   const rawAddress = String(data?.company_address || "").trim();
//   const address = rawAddress && rawAddress !== DEFAULT_ADDRESS ? rawAddress : "";
//   const landmark =
//     data?.show_address_landmark === true
//       ? String(data?.address_landmark || "").trim()
//       : "";

//   const phoneDigits = phone.replace(/\D/g, "");
//   const waDigitsRaw = whatsapp.replace(/\D/g, "");

//   // Numbers saved without a country code get the default one.
//   const withCode = (digits) => (digits.length === 10 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits);
//   const telDigits = withCode(phoneDigits);
//   const waDigits = withCode(waDigitsRaw);

//   const telHref = telDigits ? `tel:+${telDigits}` : "";
//   const whatsappHref = waDigits
//     ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
//         `Hello ${BRAND}, I would like to know more about your travel packages.`
//       )}`
//     : "";

//   // Call and WhatsApp are often the same number: show it once.
//   const sameNumber =
//     phoneDigits && waDigitsRaw && phoneDigits.slice(-10) === waDigitsRaw.slice(-10);

//   const cells = [];
//   if (email) cells.push({ label: "EMAIL", text: email, href: `mailto:${email}` });

//   if (sameNumber) {
//     cells.push({ label: "CALL / WHATSAPP", text: phone, href: telHref });
//   } else {
//     if (telDigits) cells.push({ label: "CALL US", text: phone, href: telHref });
//     if (waDigits) cells.push({ label: "WHATSAPP", text: whatsapp, href: whatsappHref });
//   }

//   cells.push({ label: "WEBSITE", text: SITE_LABEL, href: SITE_URL });

//   let mapsHref = getMapsLink(data?.address_url, rawAddress);
//   if (!mapsHref && address) {
//     mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
//   }

//   return { email, phone, address, landmark, mapsHref, whatsappHref, cells };
// }

// /** Same Google Maps conversion logic as Footer.jsx / Contact.jsx. */
// function getMapsLink(rawUrl, address) {
//   const value = String(rawUrl || "").trim();
//   if (!value) return "";

//   let parsed;
//   try {
//     parsed = new URL(value);
//   } catch {
//     return "";
//   }
//   if (parsed.protocol !== "https:") return "";

//   const host = parsed.hostname.toLowerCase();
//   const path = parsed.pathname.toLowerCase();

//   const isShortLink =
//     host === "maps.app.goo.gl" || (host === "goo.gl" && path.startsWith("/maps"));
//   const isGoogleMaps =
//     isShortLink ||
//     host === "maps.google.com" ||
//     (["www.google.com", "google.com", "www.google.co.in", "google.co.in"].includes(host) &&
//       path.startsWith("/maps"));
//   if (!isGoogleMaps) return "";

//   const output = (parsed.searchParams.get("output") || "").toLowerCase();
//   const isEmbed =
//     path.includes("/maps/embed") || output === "embed" || output === "svembed";
//   if (!isEmbed) return parsed.href;

//   const cidMatch = value.match(/!1s0x[0-9a-f]+(?::|%3A)0x([0-9a-f]+)/i);
//   if (cidMatch) {
//     try {
//       return `https://www.google.com/maps?cid=${BigInt(`0x${cidMatch[1]}`).toString()}`;
//     } catch {
//       /* fall through */
//     }
//   }

//   const coordMatch = value.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/i);
//   if (coordMatch) {
//     return `https://www.google.com/maps/search/?api=1&query=${coordMatch[2]},${coordMatch[1]}`;
//   }

//   const fromLink = (
//     parsed.searchParams.get("q") || parsed.searchParams.get("destination") || ""
//   ).trim();
//   const cleanAddress = String(address || "").trim();
//   const query = fromLink || (cleanAddress && cleanAddress !== DEFAULT_ADDRESS ? cleanAddress : "");
//   return query
//     ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
//     : "";
// }

// // ---------------------------------------------------------
// // Pagination
// // ---------------------------------------------------------

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

//     const groups = [];
//     p.querySelectorAll("span").forEach((s) => {
//       const top = s.getBoundingClientRect().top;
//       const word = { text: s.textContent, bold: s.hasAttribute("data-b") };
//       const last = groups[groups.length - 1];

//       if (last && Math.abs(last.top - top) < 4) last.words.push(word);
//       else groups.push({ top, row: Number(s.getAttribute("data-r")), words: [word] });
//     });

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

//     const targets = Array.from(root.querySelectorAll("[data-stretch]")).filter((el) => {
//       const t = topOf(root, el);
//       return t >= start + 8 && t < spacerTop - 1;
//     });
//     if (!targets.length) return;

//     const per = Math.min(MAX_STRETCH, spare / targets.length);
//     const before = topOf(root, anchor);

//     targets.forEach((el) => {
//       const extra = document.createElement("div");
//       extra.style.height = `${per}px`;
//       el.parentNode.insertBefore(extra, el);
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



// function placeFooter(root, PAGE_H) {
//   const footer = root.querySelector("[data-footer]");
//   if (!footer) return Math.max(1, Math.ceil(root.scrollHeight / PAGE_H));

//   let t = topOf(root, footer);
//   let h = footer.getBoundingClientRect().height;
//   let page = Math.max(0, Math.floor((t + 0.5) / PAGE_H));

//   // Footer is allowed to use the bottom padding area, but not to cross the page.
//   if (t + h > (page + 1) * PAGE_H + 0.5 || t < pageStartOf(PAGE_H, page) - 0.5) {
//     pushTo(root, footer, pageStartOf(PAGE_H, page + 1));
//     t = topOf(root, footer);
//     h = footer.getBoundingClientRect().height;
//     page = Math.max(0, Math.floor((t + 0.5) / PAGE_H));
//   }

//   const extra = (page + 1) * PAGE_H - (t + h);
//   if (extra > 0) footer.style.minHeight = `${h + extra}px`;

//   const totalPages = page + 1;
//   // 1px short so rounding can never create an extra blank page.
//   root.style.height = `${totalPages * PAGE_H - 1}px`;
//   root.style.overflow = "hidden";
//   return totalPages;
// }



// function addRunningBars(root, { PAGE_H, totalPages, title }) {
//   const bars = [];

//   for (let p = 0; p < totalPages; p++) {
//     if (p >= 1) {
//       bars.push(`
//         <div style="position:absolute;left:0;top:${p * PAGE_H}px;width:${PAGE_W}px;height:${BAR_TOP_H}px;box-sizing:border-box;padding:0 ${CONTENT_X}px;display:flex;align-items:center;justify-content:space-between;background:${ROSE_BG};border-bottom:2px solid ${C.gold};">
//           <span style="font-family:${SERIF};font-size:14px;font-weight:600;letter-spacing:.22em;color:#fff;text-transform:uppercase;white-space:nowrap;">Manyara <span style="font-family:${SANS};font-size:8px;font-weight:500;letter-spacing:.4em;color:${C.champagne};">PRIVÉ VACATIONS</span></span>
//           <span style="font-family:${SERIF};font-size:14px;font-style:italic;font-weight:500;color:${C.champagneSoft};max-width:330px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${escapeHTML(title)}</span>
//         </div>`);
//     }

//     if (p < totalPages - 1) {
//       bars.push(`
//         <div style="position:absolute;left:0;top:${(p + 1) * PAGE_H - BAR_BOTTOM_H}px;width:${PAGE_W}px;height:${BAR_BOTTOM_H}px;box-sizing:border-box;padding:0 ${CONTENT_X}px;display:flex;align-items:center;justify-content:space-between;background:${C.roseWash};border-top:1px solid ${C.champagne};">
//           <a href="${escapeHTML(SITE_URL)}" style="font-family:${SANS};font-size:9.5px;font-weight:500;letter-spacing:.04em;color:${C.roseDeep};text-decoration:none;white-space:nowrap;">${escapeHTML(SITE_LABEL)}</a>
//           <span style="font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.18em;color:${C.gold};white-space:nowrap;">PAGE ${p + 1} / ${totalPages}</span>
//         </div>`);
//     }
//   }

//   root.insertAdjacentHTML("beforeend", bars.join(""));
// }

// // ---------------------------------------------------------
// // Fonts / images
// // ---------------------------------------------------------

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

// // ---------------------------------------------------------
// // Data helpers
// // ---------------------------------------------------------

// /** Cloudinary: resized JPEG, never upscaled, never cropped (c_limit). */
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







