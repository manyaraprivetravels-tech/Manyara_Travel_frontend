const BRAND = "Manyara Prive Vacations";
const TAGLINE = "Curated journeys. Effortless luxury.";

// Palette mirrors tailwind.config.js
const C = {
  ink: "#2F2A33",
  body: "#4A4A52",
  muted: "#6E6973",
  rose: "#C8135E",
  roseDeep: "#AB1050",
  roseSoft: "#FEF4F8",
  roseLine: "#FCD6E4",
  champagne: "#E8D2B4",
  champagneSoft: "#F7EBDB",
  gold: "#B08D57",
  line: "#EAE5E8",
  surface: "#FBF6F8",
};

const SERIF = `"Cormorant Garamond","Playfair Display",Georgia,serif`;
const SANS = `Inter,system-ui,Arial,sans-serif`;

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap";

// ---- Page geometry (CSS px at 794px = A4 width) ----------------------
const PAGE_W = 794;
const PAD_TOP = 40; // empty space at the top of pages 2+
const PAD_BOTTOM = 46; // empty space at the bottom of every page
const CONTENT_X = 48; // left/right page padding
const DAY_BAR = 19; // 3px accent bar + 16px gap in the itinerary
const IMG_BOX_W = PAGE_W - CONTENT_X * 2 - DAY_BAR; // width available to a day image
const IMG_BOX_MAX_H = 360; // tallest a day image may be (no cropping, it is scaled to fit)

/**
 * Lower scale on phones: iOS Safari limits canvas area, and long
 * packages (10-12 days with images) make a very tall canvas.
 * html2pdf slices at floor(canvasWidth * 297/210) canvas px per page,
 * so the CSS page height is derived from the same numbers.
 */
function getGeometry() {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const scale = isMobile ? 1.2 : 1.5;
  const pageH = Math.floor((PAGE_W * scale * 297) / 210) / scale;

  return { scale, pageH };
}

export const generatePackagePDF = async (pkg) => {
  if (!pkg) {
    throw new Error("Package information is required to generate the PDF.");
  }

  const { default: html2pdf } = await import("html2pdf.js");
  const { scale: SCALE, pageH: PAGE_H } = getGeometry();

  // ---------------------------------------------------------
  // Normalize data
  // ---------------------------------------------------------
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

  const durationText = has(pkg.duration_days)
    ? `${pkg.duration_days} Days${has(pkg.duration_nights) ? ` / ${pkg.duration_nights} Nights` : ""}`
    : "";

  // ---------------------------------------------------------
  // Fonts + images MUST be ready before building / measuring.
  // preloadImages also returns each image's natural size so day
  // images can be fitted without cropping.
  // ---------------------------------------------------------
  await ensureFonts();

  const coverUrl = optimizeUrl(rawCover, 1400);
  const dayUrls = itinerary.map((d) => optimizeUrl(getImageUrl(d?.image), 1200));
  const sizes = await preloadImages([coverUrl, ...dayUrls]);

  const coverImage = coverUrl && sizes.has(coverUrl) ? coverUrl : null;

  // ---------------------------------------------------------
  // HTML builders
  // data-atom  = must not be split across pages
  // data-keep  = keep together with the next atom (headings)
  // data-lines = paragraph that is split into line atoms
  // data-linestyle = extra inline style applied to every line atom
  // ---------------------------------------------------------
  const heading = (eyebrow, text) => `
    <div data-atom data-keep style="margin:0 0 12px;">
      <div style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:${C.gold};margin-bottom:4px;">
        ${escapeHTML(eyebrow)}
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-family:${SERIF};font-size:32px;font-weight:600;color:${C.roseDeep};line-height:1.2;white-space:nowrap;">
          ${escapeHTML(text)}
        </div>
        <div style="flex:1;height:1px;background:linear-gradient(to right,${C.champagne},rgba(232,210,180,0));"></div>
        <div style="width:7px;height:7px;background:${C.gold};transform:rotate(45deg);"></div>
      </div>
    </div>`;

  const paragraph = (text, size, color, lineHeight) =>
    `<div data-lines style="font-family:${SANS};font-size:${size}px;line-height:${lineHeight};color:${color};margin:0 0 8px;white-space:pre-line;">${escapeHTML(text)}</div>`;

  const summaryCard = (label, value, accent = C.ink) => `
    <div style="flex:1;border:1px solid ${C.champagne};background:${C.champagneSoft};border-radius:12px;padding:14px 18px;text-align:center;">
      <div style="font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.26em;color:${C.gold};">
        ${escapeHTML(label)}
      </div>
      <div style="font-family:${SERIF};font-size:26px;font-weight:600;color:${accent};margin-top:3px;line-height:1.2;">
        ${escapeHTML(value)}
      </div>
    </div>`;

  const diamond = `<span style="flex:none;width:6px;height:6px;margin-top:7px;background:${C.gold};transform:rotate(45deg);"></span>`;
  const tick = `<span style="flex:none;width:16px;height:16px;margin-top:1px;border-radius:50%;background:${C.rose};color:#fff;font-size:9px;line-height:16px;text-align:center;font-family:${SANS};">&#10003;</span>`;
  const cross = `<span style="flex:none;width:16px;height:16px;margin-top:1px;border-radius:50%;border:1px solid ${C.muted};color:${C.muted};font-size:8px;line-height:14px;text-align:center;font-family:${SANS};">&#10005;</span>`;

  const itemGrid = (items, marker, columns) => `
    <div style="display:flex;flex-wrap:wrap;">
      ${items
        .map(
          (item) => `
          <div style="width:${100 / columns}%;box-sizing:border-box;padding:0 12px 8px 0;display:flex;gap:9px;align-items:flex-start;">
            ${marker}
            <span style="font-family:${SANS};font-size:12.5px;line-height:1.5;color:${C.body};">${escapeHTML(item)}</span>
          </div>`
        )
        .join("")}
    </div>`;

  const panel = (title, body, bg, border, titleColor) => `
    <div style="flex:1;min-width:0;background:${bg};border:1px solid ${border};border-radius:12px;padding:16px 16px 8px;box-sizing:border-box;">
      <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${titleColor};margin-bottom:10px;line-height:1.2;">
        ${escapeHTML(title)}
      </div>
      ${body}
    </div>`;

  // ---------------------------------------------------------
  // COVER (page 1). A full-bleed hero has to fill its box, so
  // this one image is allowed to crop (background-size: cover).
  // ---------------------------------------------------------
  const heroHTML = `
    <div data-atom style="position:relative;width:${PAGE_W}px;height:400px;overflow:hidden;background:linear-gradient(135deg,${C.roseDeep},${C.rose} 55%,#E8286F);${
      coverImage ? `background-image:${cssUrl(coverImage)};background-size:cover;background-position:center;` : ""
    }">
      <div style="position:absolute;top:0;left:0;width:${PAGE_W}px;height:400px;background:linear-gradient(to bottom,rgba(31,27,34,.6) 0%,rgba(31,27,34,.05) 38%,rgba(31,27,34,.85) 100%);"></div>

      <div style="position:absolute;top:30px;left:0;width:${PAGE_W}px;text-align:center;">
        <div style="font-family:${SERIF};font-size:30px;font-weight:600;letter-spacing:.3em;color:#fff;text-transform:uppercase;padding-left:.3em;">Manyara</div>
        <div style="font-family:${SANS};font-size:9px;font-weight:500;letter-spacing:.5em;color:${C.champagne};margin-top:3px;padding-left:.5em;">PRIVE VACATIONS</div>
      </div>

      <div style="position:absolute;left:48px;right:48px;bottom:34px;color:#fff;">
        ${
          pkg.destination
            ? `<div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:${C.champagne};margin-bottom:10px;">${escapeHTML(pkg.destination)}</div>`
            : ""
        }
        <div style="font-family:${SERIF};font-size:46px;font-weight:600;line-height:1.15;color:#fff;">
          ${escapeHTML(pkg.title || "Travel Package")}
        </div>
        <div style="width:64px;height:3px;background:${C.champagne};margin-top:18px;border-radius:3px;"></div>
      </div>
    </div>`;

  const coverBodyHTML = `
    <div style="padding:26px ${CONTENT_X}px 0;">
      ${
        durationText || has(pkg.price)
          ? `<div data-atom style="display:flex;gap:14px;">
               ${durationText ? summaryCard("DURATION", durationText) : ""}
               ${has(pkg.price) ? summaryCard("STARTING FROM", `\u20B9${formatPrice(pkg.price)}`, C.rose) : ""}
             </div>`
          : ""
      }
      ${
        pkg.description
          ? `<div style="margin-top:26px;">
               ${heading("The Experience", "About This Journey")}
               ${paragraph(pkg.description, 13, C.body, 1.75)}
             </div>`
          : ""
      }
    </div>`;

  // ---------------------------------------------------------
  // ITINERARY
  // Each day = header block (number, title, image) + description
  // lines. The header is one atom; the description is split into
  // line atoms, so a page break can only fall BETWEEN lines and a
  // long day can never be cut through. The rose bar is drawn on
  // every atom so it stays continuous across a page break.
  // Images are scaled to fit (contain), never cropped.
  // ---------------------------------------------------------
  const BAR = `border-left:3px solid ${C.rose};padding-left:16px;`;

  const dayCard = (day, index) => {
    const n = has(day?.day) ? day.day : index + 1;
    const label = String(n).padStart(2, "0");

    const url = dayUrls[index];
    const size = url ? sizes.get(url) : null;
    const description = day?.description ? String(day.description).trim() : "";

    let imageHTML = "";
    if (url && size && size.w && size.h) {
      const fit = Math.min(IMG_BOX_W / size.w, IMG_BOX_MAX_H / size.h);
      const w = Math.round(size.w * fit);
      const h = Math.round(size.h * fit);

      imageHTML = `
        <div style="margin-top:10px;width:${IMG_BOX_W}px;height:${h}px;background:${C.champagneSoft};border-radius:12px;overflow:hidden;">
          <img src="${escapeHTML(url)}" crossorigin="anonymous" alt=""
               style="display:block;width:${w}px;height:${h}px;margin:0 auto;" />
        </div>`;
    }

    return `
      <div style="margin-bottom:22px;">
        <div data-atom ${description ? "data-keep" : ""} style="${BAR}padding-bottom:${description ? 8 : 0}px;">
          <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px;">
            <span style="font-family:${SERIF};font-size:34px;font-weight:600;color:${C.rose};line-height:1.1;">${escapeHTML(label)}</span>
            <span style="font-family:${SANS};font-size:9px;font-weight:600;letter-spacing:.28em;color:${C.gold};">DAY</span>
          </div>
          ${
            day?.title
              ? `<div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${C.ink};margin:0;line-height:1.25;">${escapeHTML(day.title)}</div>`
              : ""
          }
          ${imageHTML}
        </div>
        ${
          description
            ? `<div data-lines
                    data-linestyle="margin-left:-19px;padding-left:16px;border-left:3px solid ${C.rose};"
                    style="font-family:${SANS};font-size:12px;line-height:1.65;color:${C.body};white-space:pre-line;padding-left:19px;box-sizing:border-box;margin:0;">${escapeHTML(description)}</div>`
            : ""
        }
      </div>`;
  };

  const itineraryHTML = itinerary.length
    ? `<div>
         ${heading("Your Journey", "Day-by-Day Itinerary")}
         ${itinerary.map(dayCard).join("")}
       </div>`
    : "";

  // ---------------------------------------------------------
  // FACILITIES / INCLUSIONS / EXCLUSIONS
  // ---------------------------------------------------------
  const facilitiesHTML = facilities.length
    ? `<div style="margin-top:12px;">
         <div data-atom>
           ${heading("Comforts", "Facilities").replace("data-atom data-keep", "")}
           <div style="background:${C.champagneSoft};border:1px solid ${C.champagne};border-radius:12px;padding:16px 16px 8px;">
             ${itemGrid(facilities, diamond, 3)}
           </div>
         </div>
       </div>`
    : "";

  const incPanel = inclusions.length
    ? panel("Inclusions", itemGrid(inclusions, tick, 1), C.roseSoft, C.roseLine, C.roseDeep)
    : "";
  const excPanel = exclusions.length
    ? panel("Exclusions", itemGrid(exclusions, cross, 1), C.surface, C.line, C.ink)
    : "";

  const coverageHTML =
    incPanel || excPanel
      ? `<div style="margin-top:22px;">
           ${heading("The Details", "What\u2019s Included")}
           <div data-atom style="display:flex;gap:14px;align-items:stretch;">${incPanel}${excPanel}</div>
         </div>`
      : "";

  // ---------------------------------------------------------
  // POLICIES
  // ---------------------------------------------------------
  const policyHTML = (eyebrow, title, items) =>
    items.length
      ? `<div style="margin-top:22px;">
           ${heading(eyebrow, title)}
           ${items.map((t) => paragraph(t, 11.5, C.muted, 1.7)).join("")}
         </div>`
      : "";

  // ---------------------------------------------------------
  // FOOTER
  // ---------------------------------------------------------
  const footerHTML = `
    <div data-atom style="width:${PAGE_W}px;margin-top:28px;padding:30px 48px;background:linear-gradient(135deg,${C.ink},#1F1B22);text-align:center;box-sizing:border-box;">
      <div style="font-family:${SERIF};font-size:28px;font-weight:600;letter-spacing:.3em;color:#fff;text-transform:uppercase;padding-left:.3em;line-height:1.2;">Manyara</div>
      <div style="font-family:${SANS};font-size:9px;font-weight:500;letter-spacing:.5em;color:${C.champagne};margin-top:3px;padding-left:.5em;">PRIVE VACATIONS</div>
      <div style="width:40px;height:1px;background:${C.gold};margin:14px auto;"></div>
      <div style="font-family:${SERIF};font-size:17px;font-style:italic;font-weight:500;color:${C.champagne};line-height:1.3;">${escapeHTML(TAGLINE)}</div>
      <div style="font-family:${SANS};font-size:10px;color:rgba(255,255,255,.65);margin-top:10px;">
        Thank you for choosing ${escapeHTML(BRAND)}.
      </div>
    </div>`;

  // ---------------------------------------------------------
  // Off-screen container (html2canvas needs it rendered, so no
  // display:none / visibility:hidden / negative z-index)
  // ---------------------------------------------------------
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "absolute",
    left: "-10000px",
    top: "0",
    width: `${PAGE_W}px`,
    backgroundColor: "#ffffff",
    zIndex: "999999",
    pointerEvents: "none",
    overflow: "visible",
  });

  container.innerHTML = `
    <div style="width:${PAGE_W}px;background:#fff;color:${C.body};font-family:${SANS};line-height:1.5;box-sizing:border-box;">
      ${heroHTML}
      ${coverBodyHTML}
      <div data-newpage></div>
      <div style="padding:0 ${CONTENT_X}px;">
        ${itineraryHTML}
        ${facilitiesHTML}
        ${coverageHTML}
        ${policyHTML("Please Note", "Terms & Conditions", terms)}
        ${policyHTML("Good to Know", "Cancellation Policy", cancellation)}
      </div>
      ${footerHTML}
    </div>`;

  document.body.appendChild(container);

  try {
    const pdfContent = container.firstElementChild;
    if (!pdfContent) throw new Error("PDF content could not be created.");

    // Make sure <img> tags inside the container have finished decoding.
    await waitForContainerImages(pdfContent);
    await nextFrame();

    splitParagraphsIntoLines(pdfContent);
    paginate(pdfContent, PAGE_H);
    await nextFrame();

    const fileName = `${slugify(pkg.title || "package")}-itinerary.pdf`;

    await html2pdf()
      .set({
        margin: 0, // margins are handled by paginate()
        filename: fileName,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: SCALE,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          imageTimeout: 15000,
          scrollX: 0,
          scrollY: 0,
          windowWidth: PAGE_W,
          windowHeight: Math.max(pdfContent.scrollHeight, 1123),
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
        // We insert our own spacers; html2pdf must not add more.
        pagebreak: { mode: ["css"] },
      })
      .from(pdfContent)
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
// Pagination
// ---------------------------------------------------------

/**
 * Replace every [data-lines] block with one block per rendered
 * line, so a page break can fall BETWEEN lines instead of through one.
 * Optional data-linestyle is appended to each line (used to repeat
 * the itinerary accent bar on every line).
 */
function splitParagraphsIntoLines(root) {
  root.querySelectorAll("[data-lines]").forEach((p) => {
    const rows = p.textContent
      .split(/\n+/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (!rows.length) return;

    const lineStyle = p.getAttribute("data-linestyle") || "";

    p.style.whiteSpace = "normal";
    p.innerHTML = rows
      .map((r) =>
        r
          .split(/\s+/)
          .map((w) => `<span>${escapeHTML(w)}</span>`)
          .join(" ")
      )
      .join("<br>");

    const groups = [];
    p.querySelectorAll("span").forEach((s) => {
      const top = s.getBoundingClientRect().top;
      const last = groups[groups.length - 1];
      if (last && Math.abs(last.top - top) < 4) last.words.push(s.textContent);
      else groups.push({ top, words: [s.textContent] });
    });

    p.innerHTML = groups
      .map(
        (g) =>
          `<div data-atom style="white-space:nowrap;${lineStyle}">${escapeHTML(g.words.join(" "))}</div>`
      )
      .join("");
  });
}

/**
 * Push atoms that would cross a page edge to the start of the next
 * page. Page n (n >= 1) usable area:
 *   [n * PAGE_H + PAD_TOP, (n + 1) * PAGE_H - PAD_BOTTOM]
 */
function paginate(root, PAGE_H) {
  const rootTop = () => root.getBoundingClientRect().top;
  const topOf = (el) => el.getBoundingClientRect().top - rootTop();
  const pageStart = (n) => (n === 0 ? 0 : n * PAGE_H + PAD_TOP);
  const pageEnd = (n) => (n + 1) * PAGE_H - PAD_BOTTOM;

  const pushTo = (el, target) => {
    const gap = target - topOf(el);
    if (gap <= 0.5) return;

    const spacer = document.createElement("div");
    spacer.style.height = `${gap}px`;
    el.parentNode.insertBefore(spacer, el);

    // Correct for any margin-collapsing differences.
    const drift = target - topOf(el);
    if (Math.abs(drift) > 0.5) spacer.style.height = `${gap + drift}px`;
  };

  const items = Array.from(root.querySelectorAll("[data-atom],[data-newpage]"));

  items.forEach((el, i) => {
    const top = topOf(el);
    const n = Math.max(0, Math.floor((top + 0.5) / PAGE_H));

    // Force the content after the cover onto a new page.
    if (el.hasAttribute("data-newpage")) {
      if (top - pageStart(n) > 1) pushTo(el, pageStart(n + 1));
      return;
    }

    const rect = el.getBoundingClientRect();
    let height = rect.height;

    // Headings / day headers stay with whatever comes next.
    const next = items[i + 1];
    if (el.hasAttribute("data-keep") && next && !next.hasAttribute("data-newpage")) {
      height = next.getBoundingClientRect().bottom - rect.top;
    }

    // Starts inside the top padding of a page -> move below it.
    if (top < pageStart(n) - 0.5) {
      pushTo(el, pageStart(n));
    }

    const t = topOf(el);
    const page = Math.max(0, Math.floor((t + 0.5) / PAGE_H));
    const fits = height <= pageEnd(page) - pageStart(page);

    if (fits && t + height > pageEnd(page) + 0.5) {
      pushTo(el, pageStart(page + 1));
    }
  });
}

// ---------------------------------------------------------
// Fonts / images
// ---------------------------------------------------------

/** Make sure Cormorant Garamond + Inter are really loaded. */
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

/**
 * Load every image once. Resolves to a Map(url -> {w, h}) containing
 * only the images that loaded; failed ones are simply missing.
 */
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

/** Wait until every <img> already inside the container is decoded. */
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

/**
 * Ask Cloudinary for a resized JPEG (never upscaled, never cropped).
 * Smaller canvas, faster PDF, and avoids WebP/AVIF surprises.
 * Non-Cloudinary or already-transformed URLs are returned unchanged.
 */
function optimizeUrl(url, width) {
  if (!url) return null;

  if (
    url.includes("res.cloudinary.com") &&
    url.includes("/upload/") &&
    !/\/upload\/(?:[a-z]{1,3}_[^/]*\/)+/.test(url)
  ) {
    return url.replace("/upload/", `/upload/f_jpg,q_auto:good,w_${width},c_limit/`);
  }

  return url;
}

/** CSS url() that is safe inside an inline style attribute. */
function cssUrl(url) {
  const safe = String(url).replace(
    /['"()\s<>]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")
  );
  return `url('${safe}')`;
}

/** Image URL from a string or an image object. */
function getImageUrl(image) {
  if (!image) return null;
  if (typeof image === "string") return image.trim() || null;
  if (typeof image === "object") {
    return image.url || image.secure_url || image.src || image.image_url || null;
  }
  return null;
}

/** Text from a list item (string, number or object). */
function normalizeListItem(item) {
  if (item === null || item === undefined) return "";
  if (typeof item === "object") {
    return String(item.name || item.title || item.description || item.text || item.value || "").trim();
  }
  return String(item).trim();
}

/**
 * Facilities / inclusions / exclusions.
 * Also handles ["Hotel, Breakfast, WiFi"] and "Hotel, Breakfast, WiFi".
 */
function normalizeList(value) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  return source
    .flatMap((item) => normalizeListItem(item).split(","))
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Terms / cancellation: a single text block or a list. */
function normalizePolicy(value) {
  if (Array.isArray(value)) return value.map(normalizeListItem).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
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