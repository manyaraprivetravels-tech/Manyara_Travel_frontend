

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe2,
  Headset,
  Heart,
  Landmark,
  Loader2,
  MapPin,
  MessageCircle,
  Mountain,
  Pause,
  Plane,
  PlaneTakeoff,
  Play,
  Search,
  Send,
  Sparkles,
  TreePine,
  Wallet,
  Waves,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axios";
import { getHero, getPackages, getSiteSettings } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { getHeroLayout } from "../utils/heroLayout";

import { cld, cldSrcSet } from "../utils/cloudinary";

/* ============================================================
   BRAND
============================================================ */
const BRAND_NAME = "Manyara Prive Vacations";
const DEFAULT_BADGE = "Curated holidays, made simple";

/* ============================================================
   CAROUSEL SETTINGS
============================================================ */
const AUTOPLAY_MS = 5000;
const FADE_MS = 1100;
const REFRESH_MS = 60000;
const CLOCK_MS = 30000;
const MAX_SLIDES = 6;
const FALLBACK_IMAGE = "/images/view1.webp";

/* Written by HeroManage after every save so other tabs revalidate. */
const HERO_UPDATED_KEY = "manyara:hero-updated";

const getPackageUrl = (pkg, id) => `/packages/${pkg?.slug || pkg?.id || id}`;

/* ============================================================
   WHY BOOK WITH US (edit these three lines to match your business)
============================================================ */
const HIGHLIGHTS = [
  { icon: Compass, label: "Curated itineraries" },
  { icon: Wallet, label: "Clear, upfront pricing" },
  { icon: Headset, label: "Support during your trip" },
];

/* ============================================================
   PACKAGE TYPE CONFIG (keys match backend PackageTypeEnum)
============================================================ */
const PACKAGE_TYPE_CONFIG = {
  family: {
    label: "Family Holidays",
    short: "Family",
    icon: Sparkles,
    description: "Memorable holidays designed for the whole family.",
  },
  pilgrimage: {
    label: "Temples & Pilgrimage",
    short: "Pilgrimage",
    icon: Landmark,
    description: "Spiritual journeys and meaningful temple tours.",
  },
  beach: {
    label: "Beach Holidays",
    short: "Beaches",
    icon: Waves,
    description: "Relaxing beaches, islands and coastal escapes.",
  },
  mountains_adventure: {
    label: "Mountains & Adventures",
    short: "Mountains",
    icon: Mountain,
    description: "Mountains, valleys and unforgettable adventures.",
  },
  romantic: {
    label: "Romantic Getaways",
    short: "Romantic",
    icon: Heart,
    description: "Beautiful escapes designed for couples.",
  },
  international: {
    label: "International",
    short: "International",
    icon: Globe2,
    description: "Discover destinations beyond India.",
  },
  wildlife_nature: {
    label: "Wildlife & Nature",
    short: "Wildlife",
    icon: TreePine,
    description: "Wildlife, forests and beautiful natural escapes.",
  },
};

const EMPTY_CUSTOM_FORM = {
  name: "",
  phone: "",
  destination: "",
  package_type: "",
  travellers: "1",
  travel_date: "",
  message: "",
};

/* ============================================================
   THEME CLASSES (Tailwind tokens from tailwind.config.js)
============================================================ */
const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-text-dark outline-none transition placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface";
const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-text-dark";

/* Round side arrows (>= sm). */
const ICON_BUTTON =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white backdrop-blur transition hover:bg-ink/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

/* Pause is an accessibility control, not a main action: quiet ghost style,
   but still a 40px touch target. */
const PAUSE_BUTTON =
  "-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:mr-0";

/*
 * One button system for slide actions: same min-height, radius, type and
 * focus ring everywhere.
 *
 * Buttons use min-h-12 + padding so long labels wrap to a second line
 * instead of being clipped, fill the row on phones, and shrink back to
 * their natural width from sm.
 *
 *   BTN_PRIMARY - solid accent (main actions)
 *   BTN_GLASS   - translucent white (secondary actions)
 */
const BTN =
  "inline-flex min-h-12 w-full max-w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-center text-sm font-semibold leading-snug tracking-wide transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-7";
const BTN_PRIMARY = `${BTN} bg-accent text-white shadow-brand hover:bg-accent-hover`;
const BTN_GLASS = `${BTN} border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20`;

/* Hides the scrollbar on the swipeable chip row. */
const NO_SCROLLBAR =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/*
 * Layout, top to bottom:
 *   copy region (slide text, placed by the admin's content position)
 *   -> centred block: pager, search, category chips, plan button, highlights
 */

/* ============================================================
   HELPERS
============================================================ */
const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeDestination = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const getImageUrl = (image) =>
  typeof image === "string" ? image.trim() : cleanText(image?.url);

const getPackageTitle = (pkg) =>
  cleanText(pkg?.title) || cleanText(pkg?.name) || cleanText(pkg?.package_name);

function isPublishedPackage(pkg) {
  const status = String(pkg?.status ?? "")
    .trim()
    .toLowerCase();
  return status === "" || status === "published" || pkg?.is_published === true;
}

function getTodayForDateInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

const toTime = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? null : time;
};

function isSlideLive(slide, now) {
  if (slide.startsAt !== null && slide.startsAt > now) return false;
  if (slide.endsAt !== null && slide.endsAt < now) return false;
  return true;
}

function normalizeSlides(data, now) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.slides)
        ? data.slides
        : [];

  return list
    .map((item, index) => {
      const type = String(item?.package_type || "")
        .trim()
        .toLowerCase();
      const packageId = Number(item?.package_id);

      return {
        id: item?.id ?? `slide-${index}`,
        order: Number.isFinite(Number(item?.display_order))
          ? Number(item.display_order)
          : 999,
        active: item?.is_active !== false,
        image: getImageUrl(item?.image),
        imageMobile: getImageUrl(item?.image_mobile),
        position: /^[a-z0-9% ]{1,30}$/i.test(cleanText(item?.image_position))
          ? cleanText(item.image_position)
          : "center",
        contentPosition: cleanText(item?.content_position),
        overlayStrength: cleanText(item?.overlay_strength),
        badge: cleanText(item?.badge),
        headline: cleanText(item?.headline),
        subtext: cleanText(item?.subtext),
        packageType: PACKAGE_TYPE_CONFIG[type] ? type : "",
        packageId:
          Number.isInteger(packageId) && packageId > 0 ? packageId : null,
        offerText: cleanText(item?.offer_text),
        startsAt: toTime(item?.starts_at),
        endsAt: toTime(item?.ends_at),
      };
    })
    .filter(
      (slide) =>
        slide.active && slide.image && slide.headline && isSlideLive(slide, now),
    )
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_SLIDES);
}

function buildFallbackSlide(settings) {
  return {
    id: "default",
    image: FALLBACK_IMAGE,
    imageMobile: "",
    position: "center",
    contentPosition: "middle-center",
    overlayStrength: "medium",
    badge: DEFAULT_BADGE,
    headline:
      cleanText(settings?.homepage_headline) ||
      "Journeys designed for the way you love to travel.",
    subtext:
      "Thoughtfully curated holidays for couples and families, planned with care from the first idea to the journey home.",
    packageType: "",
    packageId: null,
    offerText: "",
    startsAt: null,
    endsAt: null,
  };
}

function formatShortDate(time) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(time));
}

/* Which side the text sits on, read from the layout's text classes. */
function getHorizontal(layout) {
  if (layout.text.includes("text-center")) return "center";
  if (layout.text.includes("text-right")) return "right";
  return "left";
}

/* ============================================================
   REDUCED MOTION
============================================================ */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
  );

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return undefined;
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/15 ${className}`}
      aria-hidden="true"
    />
  );
}

/*
 * Buttons configured in HeroManage:
 *   package_type -> "Explore <Category>" button (/packages?type=...)
 *   package_id   -> "View <Package>" button (specific package)
 *
 * On phones the category button uses the short label ("Explore Mountains")
 * so it fits on one line; the full label is shown from sm. The package
 * button shows up to two lines of the package name instead of one
 * truncated line.
 */
function SlideActions({ slide, packageById, packagesLoading, align }) {
  const config = PACKAGE_TYPE_CONFIG[slide.packageType];
  const pkg = slide.packageId ? packageById.get(slide.packageId) : null;

  // Hide the package button when the package is no longer published.
  const showPackage = slide.packageId && (pkg || packagesLoading);

  if (!config && !showPackage) return null;

  const CategoryIcon = config?.icon;

  return (
    <div
      className={`flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center ${align}`}
    >
      {config && (
        <Link
          to={`/packages?type=${encodeURIComponent(slide.packageType)}`}
          className={BTN_PRIMARY}
        >
          <CategoryIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">
            <span className="sm:hidden">Explore {config.short}</span>
            <span className="hidden sm:inline">Explore {config.label}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}

      {showPackage && (
        <Link
          to={getPackageUrl(pkg, slide.packageId)}
          className={`${BTN_GLASS} sm:max-w-[18rem]`}
        >
          <span className="line-clamp-2 min-w-0 break-words">
            {pkg ? `View ${getPackageTitle(pkg) || "package"}` : "View package"}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function renderHeadline(text) {
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return text;
  const last = words.pop();
  return (
    <>
      {words.join(" ")}{" "}
      <em className="font-medium italic text-champagne-light">{last}</em>
    </>
  );
}

/*
 * Slide copy cross-fades: the outgoing text fades out quickly, then the
 * incoming text fades in with a small upward drift.
 *
 * Every slide shares one grid cell. Each slide places its own text block
 * (top / middle / bottom x left / center / right) from the admin's
 * content position. Long text is clamped so one slide cannot make the
 * whole hero grow.
 *
 * Below sm the text block is forced to the full width of the cell (w-full)
 * so every slide gets the same, predictable width no matter which side the
 * admin positioned it on.
 */
function SlideCopy({
  slide,
  index,
  count,
  isActive,
  reducedMotion,
  packageById,
  packagesLoading,
}) {
  const Heading = index === 0 ? "h1" : "h2";
  const layout = getHeroLayout(slide.contentPosition, slide.overlayStrength);
  const horizontal = getHorizontal(layout);

  const hasActions =
    Boolean(PACKAGE_TYPE_CONFIG[slide.packageType]) || Boolean(slide.packageId);
  const hasMeta = Boolean(slide.offerText) || slide.endsAt !== null;

  let motion;
  if (reducedMotion) {
    motion = isActive
      ? "visible opacity-100 duration-300"
      : "pointer-events-none invisible opacity-0 duration-300";
  } else if (isActive) {
    motion =
      "visible translate-y-0 opacity-100 duration-[800ms] delay-[400ms]";
  } else {
    motion =
      "pointer-events-none invisible translate-y-3 opacity-0 duration-[400ms]";
  }

  return (
    <div
      role={count > 1 ? "group" : undefined}
      aria-roledescription={count > 1 ? "slide" : undefined}
      aria-label={count > 1 ? `${index + 1} of ${count}` : undefined}
      aria-hidden={!isActive}
      className={`col-start-1 row-start-1 flex min-w-0 flex-col transition-[opacity,transform,visibility] ease-out ${layout.wrapper} ${motion}`}
    >
      <div
        className={`flex w-full min-w-0 max-w-3xl flex-col sm:w-auto ${layout.text}`}
      >
        {/* Eyebrow: wraps to two lines on small phones instead of being cut */}
        <div
          className={`mb-4 flex max-w-full items-center gap-3 sm:mb-6 ${layout.actions}`}
        >
          {horizontal !== "right" && (
            <span
              className="h-px w-6 shrink-0 bg-champagne/70 sm:w-8"
              aria-hidden="true"
            />
          )}

          <span className="line-clamp-2 min-w-0 text-[11px] font-medium uppercase leading-snug tracking-[0.2em] text-champagne sm:text-xs sm:tracking-[0.28em]">
            {slide.badge || DEFAULT_BADGE}
          </span>

          {horizontal !== "left" && (
            <span
              className="h-px w-6 shrink-0 bg-champagne/70 sm:w-8"
              aria-hidden="true"
            />
          )}
        </div>

        {/* pb-1 stops line-clamp (overflow hidden) from clipping descenders */}
        <Heading className="line-clamp-3 max-w-3xl break-words pb-1 font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.01em] text-white [text-wrap:balance] [@media(min-width:380px)]:text-[2.5rem] [@media(min-width:380px)]:leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
          {renderHeadline(slide.headline)}
        </Heading>

        {/* Subtext: max 2 lines on phones, 3 from sm */}
        {slide.subtext && (
          <p className="mt-3 line-clamp-2 max-w-xl break-words text-[15px] leading-relaxed text-white/85 [text-wrap:pretty] sm:mt-5 sm:line-clamp-3 sm:max-w-2xl sm:text-lg sm:leading-8">
            {slide.subtext}
          </p>
        )}

        {/* Offer chip + validity (chip wraps instead of overflowing) */}
        {hasMeta && (
          <div
            className={`mt-4 flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 ${layout.actions}`}
          >
            {slide.offerText && (
              <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold leading-snug text-primary-dark shadow-travel-card">
                <Sparkles
                  className="h-3.5 w-3.5 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{slide.offerText}</span>
              </span>
            )}

            {slide.endsAt !== null && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/85 sm:text-[13px]">
                <CalendarClock
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                Offer valid till {formatShortDate(slide.endsAt)}
              </span>
            )}
          </div>
        )}

        {/* Actions: stacked full-width on mobile, side by side from sm */}
        {hasActions && (
          <div className={`mt-5 flex w-full min-w-0 sm:mt-6 ${layout.actions}`}>
            <SlideActions
              slide={slide}
              packageById={packageById}
              packagesLoading={packagesLoading}
              align={layout.actions}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * Backgrounds: each slide has its image and its own readability overlay.
 * Both cross-fade together, so the shade always sits behind the slide's
 * text.
 *
 * The image is NOT scaled or zoomed. It is drawn at 100% with object-cover
 * (fills the hero without distortion) and only its opacity animates, so it
 * looks identical on mobile and desktop. A larger source size is requested
 * for wide screens so the picture stays sharp instead of looking stretched.
 */
function SlideBackgrounds({ slides, currentId, leavingId, reducedMotion }) {
  return (
    <div className="absolute inset-0 -z-20 bg-ink" aria-hidden="true">
      {slides.map((slide, index) => {
        const isActive = slide.id === currentId;
        const isLeaving = slide.id === leavingId;

        let layer = "z-0 opacity-0";
        let overlayLayer = "z-0 opacity-0";
        let transition = "none";

        if (isActive) {
          layer = "z-20 opacity-100";
          overlayLayer = "z-[25] opacity-100";
          transition = reducedMotion
            ? "opacity 300ms linear"
            : `opacity ${FADE_MS}ms ease-in-out`;
        } else if (isLeaving) {
          layer = "z-10 opacity-100";
          overlayLayer = "z-[15] opacity-100";
        }

        const overlayClass = getHeroLayout(
          slide.contentPosition,
          slide.overlayStrength,
        ).overlay;

        return (
          <Fragment key={slide.id}>
            <picture>
              {slide.imageMobile && (
                <source
                  media="(max-width: 767px)"
                  srcSet={cldSrcSet(slide.imageMobile, [480, 768])}
                  sizes="100vw"
                />
              )}
              <img
                src={cld(slide.image, 1920)}
                srcSet={cldSrcSet(slide.image, [768, 1280, 1920, 2560])}
                sizes="100vw"
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                decoding="async"
                draggable={false}
                style={{ objectPosition: slide.position, transition }}
                className={`absolute inset-0 h-full w-full object-cover ${layer}`}
              />
            </picture>

            {overlayClass && (
              <div
                className={`absolute inset-0 ${overlayLayer} ${overlayClass}`}
                style={{ transition }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/*
 * Pager: progress segments and a quiet pause button (no slide numbers).
 * Phones change slides by swiping or tapping a segment (no arrow buttons,
 * so the segments get the room); the side arrows (>= sm) live in the hero.
 */
function SlidePager({
  slides,
  current,
  barRefs,
  onSelect,
  onKeyDown,
  canAutoplay,
  userPaused,
  onTogglePause,
}) {
  const count = slides.length;

  return (
    <div className="flex items-center gap-3 sm:justify-center sm:gap-5">
      <div
        role="group"
        aria-label="Choose a slide"
        onKeyDown={onKeyDown}
        className="flex min-w-0 flex-1 gap-1.5 sm:max-w-md sm:gap-2"
      >
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Show slide ${index + 1} of ${count}: ${slide.headline}`}
              aria-current={isActive ? "true" : undefined}
              className="group flex-1 rounded-md py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="block h-1 overflow-hidden rounded-full bg-white/30 transition-colors group-hover:bg-white/45">
                <span
                  ref={(element) => {
                    barRefs.current[index] = element;
                  }}
                  className="block h-full origin-left rounded-full bg-champagne"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {canAutoplay && (
        <button
          type="button"
          onClick={onTogglePause}
          className={PAUSE_BUTTON}
          aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
          aria-pressed={userPaused}
        >
          {userPaused ? (
            <Play className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Pause className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}

/* ============================================================
   CUSTOM PACKAGE MODAL
============================================================ */
function TextField({ id, label, error, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        className={INPUT_CLASS}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs font-medium text-error-text"
        >
          {error}
        </p>
      )}
    </div>
  );
}

const MODAL_FIELDS = [
  "name",
  "phone",
  "destination",
  "package_type",
  "travellers",
  "travel_date",
];

function CustomPackageModal({
  open,
  destination,
  mode = "unavailable",
  onClose,
}) {
  const [form, setForm] = useState({
    ...EMPTY_CUSTOM_FORM,
    destination: destination || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const submitLockRef = useRef(false);

  const today = getTodayForDateInput();
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const validateField = (name, value) => {
    const trimmed = String(value ?? "").trim();

    switch (name) {
      case "name":
        if (!trimmed) return "Please enter your name.";
        if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(trimmed)) {
          return "Name should contain letters only.";
        }
        return "";
      case "phone":
        if (!trimmed) return "Please enter your phone number.";
        if (!/^\d+$/.test(trimmed)) {
          return "Phone number should contain numbers only.";
        }
        if (trimmed.length !== 10) {
          return "Phone number should contain 10 digits.";
        }
        if (!/^[6-9]\d{9}$/.test(trimmed)) {
          return "Please enter a valid phone number.";
        }
        return "";
      case "destination":
        return trimmed ? "" : "Please enter your destination.";
      case "package_type":
        return trimmed ? "" : "Please select a package type.";
      case "travellers":
        if (!trimmed) return "Please enter the number of travellers.";
        if (!/^\d+$/.test(trimmed)) {
          return "Travellers must be a whole number.";
        }
        if (Number(trimmed) < 1) {
          return "There must be at least 1 traveller.";
        }
        return "";
      case "travel_date": {
        if (!trimmed) return "Please select your travel date.";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return "Please enter a valid travel date.";
        }
        const selected = new Date(`${trimmed}T00:00:00`);
        if (Number.isNaN(selected.getTime())) {
          return "Please enter a valid travel date.";
        }
        const year = selected.getFullYear();
        if (year !== currentYear && year !== nextYear) {
          return `Travel date must be in ${currentYear} or ${nextYear}.`;
        }
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (selected < todayDate) {
          return "Travel date cannot be in the past.";
        }
        return "";
      }
      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    MODAL_FIELDS.forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);
    setTouched((previous) => ({
      ...previous,
      ...Object.fromEntries(MODAL_FIELDS.map((field) => [field, true])),
    }));
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_CUSTOM_FORM, destination: destination || "" });
    setSubmitting(false);
    setSuccess(false);
    setErrors({});
    setTouched({});
    submitLockRef.current = false;
  }, [open, destination]);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setTouched((previous) => ({ ...previous, [name]: true }));
    setErrors((previous) => ({
      ...previous,
      [name]: validateField(name, value),
    }));
  };

  const fieldError = (name) => (touched[name] ? errors[name] : "");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLockRef.current || submitting || success) return;

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);

    try {
      await api.post("/enquiries", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        destination: form.destination.trim(),
        package_type: form.package_type.trim(),
        travellers: Number(form.travellers),
        travel_date: form.travel_date,
        message: form.message.trim(),
      });
      setSuccess(true);
      toast.success("Your travel request has been submitted successfully!");
    } catch (error) {
      console.error("Custom package enquiry failed:", error);
      submitLockRef.current = false;

      const detail = error?.response?.data?.detail;
      let message = "Unable to submit your request right now. Please try again.";

      if (Array.isArray(detail)) {
        message = detail
          .map((item) => item?.msg || item?.message || "Invalid enquiry details.")
          .join(", ");
      } else if (typeof detail === "string") {
        message = detail;
      }

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-package-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      {/* Bottom sheet on phones, centred card from sm */}
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-brand sm:max-h-[90vh] sm:rounded-3xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary transition hover:bg-surface-soft hover:text-text-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
          aria-label="Close custom package form"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2
              id="custom-package-title"
              className="mt-5 font-display text-3xl font-semibold text-text-dark"
            >
              Request received
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
              Thank you. Our travel team will review your request and contact
              you soon.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="pr-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-lighter text-primary">
                  <PlaneTakeoff className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2
                  id="custom-package-title"
                  className="font-display text-2xl font-semibold text-text-dark sm:text-3xl"
                >
                  Plan a custom trip
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {mode === "plan"
                  ? "Tell us where you want to go and when. Our team will plan a trip around you and get in touch."
                  : "This destination is not currently available as a package. Tell us what you are looking for and our team can help create a customized trip."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <TextField
                id="custom-name"
                label="Name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
                disabled={submitting}
                required
                error={fieldError("name")}
              />

              <TextField
                id="custom-phone"
                label="Phone number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                disabled={submitting}
                required
                error={fieldError("phone")}
              />

              <TextField
                id="custom-destination"
                label="Destination"
                name="destination"
                type="text"
                value={form.destination}
                onChange={handleChange}
                placeholder="Enter your destination"
                disabled={submitting}
                required
                error={fieldError("destination")}
              />

              <div>
                <label htmlFor="custom-package-type" className={LABEL_CLASS}>
                  Package type
                </label>
                <select
                  id="custom-package-type"
                  name="package_type"
                  value={form.package_type}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                  className={INPUT_CLASS}
                >
                  <option value="">Select package type</option>
                  {Object.entries(PACKAGE_TYPE_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
                {fieldError("package_type") && (
                  <p className="mt-1.5 text-xs font-medium text-error-text">
                    {fieldError("package_type")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  id="custom-travellers"
                  label="Travellers"
                  name="travellers"
                  type="text"
                  value={form.travellers}
                  onChange={handleChange}
                  placeholder="Number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={submitting}
                  required
                  error={fieldError("travellers")}
                />

                <TextField
                  id="custom-travel-date"
                  label="Travel date"
                  name="travel_date"
                  type="date"
                  min={today}
                  value={form.travel_date}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                  error={fieldError("travel_date")}
                />
              </div>

              <div>
                <label htmlFor="custom-message" className={LABEL_CLASS}>
                  Message (optional)
                </label>
                <textarea
                  id="custom-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  disabled={submitting}
                  placeholder="Tell us about your trip requirements..."
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Sending request...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Submit Enquiry
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN HERO
============================================================ */
export default function Hero({ onPlanTrip }) {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [destination, setDestination] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customPackageModalOpen, setCustomPackageModalOpen] = useState(false);
  const [customMode, setCustomMode] = useState("unavailable");

  /* ---------------- Cached data (useQuery) ---------------- */
  const { data: settings, loading: settingsLoading } =
    useQuery(getSiteSettings);
  const { data: packageResponse, loading: packagesLoading } =
    useQuery(getPackages);
  const {
    data: slideData,
    loading: slidesLoading,
    refetch: refetchHero,
  } = useQuery(getHero);

  /*
   * Keep the latest refetch in a ref so the revalidation effects below
   * never restart when the hook returns a new function identity.
   */
  const refetchRef = useRef(refetchHero);
  refetchRef.current = refetchHero;

  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const clockTimer = setInterval(() => setClock(Date.now()), CLOCK_MS);

    const refresh = () => {
      if (document.hidden) return;
      setClock(Date.now());
      refetchRef.current?.();
    };

    const refreshTimer = setInterval(refresh, REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    const onStorage = (event) => {
      if (event.key === HERO_UPDATED_KEY) refresh();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(clockTimer);
      clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /* ---------------- Packages / destinations ---------------- */
  const publishedPackages = useMemo(() => {
    const list = Array.isArray(packageResponse)
      ? packageResponse
      : Array.isArray(packageResponse?.items)
        ? packageResponse.items
        : [];
    return list.filter(isPublishedPackage);
  }, [packageResponse]);

  const packageById = useMemo(
    () => new Map(publishedPackages.map((pkg) => [Number(pkg.id), pkg])),
    [publishedPackages],
  );

  const destinationOptions = useMemo(() => {
    const unique = new Map();
    publishedPackages.forEach((pkg) => {
      const name = String(pkg?.destination || "").trim();
      const key = normalizeDestination(name);
      if (!key) return;
      if (!unique.has(key)) unique.set(key, { name, count: 0 });
      unique.get(key).count += 1;
    });
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [publishedPackages]);

  /* Packages shown in the search dropdown (matches title or destination). */
  const filteredPackageOptions = useMemo(() => {
    const term = normalizeDestination(destination);

    const list = term
      ? publishedPackages.filter((pkg) =>
          normalizeDestination(
            `${getPackageTitle(pkg)} ${pkg?.destination || ""}`,
          ).includes(term),
        )
      : publishedPackages;

    return list.slice(0, 8);
  }, [destination, publishedPackages]);

  /* ---------------- Slides ---------------- */
  const slides = useMemo(() => {
    const live = normalizeSlides(slideData, clock);
    return live.length > 0 ? live : [buildFallbackSlide(settings)];
  }, [slideData, settings, clock]);

  const count = slides.length;
  const isCarousel = count > 1;

  // Only show the loading skeleton before the first data arrives, so a
  // background revalidation never flashes the copy.
  const initialSlidesLoading = slidesLoading && slideData == null;
  const copyLoading = initialSlidesLoading || (settingsLoading && !isCarousel);

  const reducedMotion = usePrefersReducedMotion();

  /*
   * The active slide is tracked by id. When an admin removes or
   * deactivates a slide, playback continues from the nearest remaining
   * slide without a jump.
   */
  const [activeId, setActiveId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const lastIndexRef = useRef(0);

  const foundIndex = slides.findIndex((slide) => slide.id === activeId);
  const current =
    foundIndex >= 0 ? foundIndex : Math.min(lastIndexRef.current, count - 1);
  const currentId = slides[current]?.id ?? null;

  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [touchPaused, setTouchPaused] = useState(false);

  const canAutoplay = isCarousel && !reducedMotion;
  const isPaused =
    !canAutoplay ||
    userPaused ||
    hoverPaused ||
    focusPaused ||
    pageHidden ||
    offscreen ||
    touchPaused;

  const barRefs = useRef([]);
  const elapsedRef = useRef(0);
  const previousIdRef = useRef(currentId);
  const swipeRef = useRef(null);
  const slidesRef = useRef(slides);
  slidesRef.current = slides;

  useEffect(() => {
    lastIndexRef.current = current;
    if (currentId !== null && currentId !== activeId) setActiveId(currentId);
  }, [current, currentId, activeId]);

  const goTo = useCallback((index) => {
    const list = slidesRef.current;
    if (list.length === 0) return;
    const next = ((index % list.length) + list.length) % list.length;
    setActiveId(list[next].id);
  }, []);

  const goPrev = () => goTo(current - 1);
  const goNext = () => goTo(current + 1);
  const selectSlide = (index) => goTo(index);

  // Keep the outgoing slide visible while the new one fades in.
  useEffect(() => {
    const previousId = previousIdRef.current;
    if (previousId === currentId) return undefined;
    previousIdRef.current = currentId;

    if (!slidesRef.current.some((slide) => slide.id === previousId)) {
      return undefined;
    }

    setLeavingId(previousId);
    const timer = setTimeout(() => setLeavingId(null), FADE_MS + 100);
    return () => clearTimeout(timer);
  }, [currentId]);

  // Restart the progress timer whenever the slide set or slide changes.
  useLayoutEffect(() => {
    elapsedRef.current = 0;
    barRefs.current.forEach((bar, index) => {
      if (!bar) return;
      const filled = !canAutoplay && index === current;
      bar.style.transform = filled ? "scaleX(1)" : "scaleX(0)";
    });
  }, [currentId, count, canAutoplay, current]);

  // Auto-advance with progress bar.
  useEffect(() => {
    if (isPaused) return undefined;

    let frame = 0;
    let last = performance.now();

    const tick = (now) => {
      elapsedRef.current += now - last;
      last = now;

      const progress = Math.min(elapsedRef.current / AUTOPLAY_MS, 1);
      const bar = barRefs.current[current];
      if (bar) bar.style.transform = `scaleX(${progress})`;

      if (progress >= 1) {
        goTo(current + 1);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPaused, current, currentId, count, goTo]);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* Pause while the pointer is over the arrows or pager (not the copy, so
     resting the mouse on the headline never freezes the slideshow). */
  const hoverPauseProps = {
    onPointerEnter: (event) => {
      if (event.pointerType !== "touch") setHoverPaused(true);
    },
    onPointerLeave: (event) => {
      if (event.pointerType !== "touch") setHoverPaused(false);
    },
  };

  const handlePagerKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  };

  const handleFocus = (event) => {
    let visible = true;
    try {
      visible = event.target.matches(":focus-visible");
    } catch {
      visible = true;
    }
    if (visible) setFocusPaused(true);
  };

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusPaused(false);
    }
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    swipeRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchPaused(true); // never change a slide under the user's thumb
  };

  const handleTouchEnd = (event) => {
    setTouchPaused(false);
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || !isCarousel) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // Lighter threshold so a normal thumb swipe always registers.
    // The slide then changes with the same cross-fade as autoplay.
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const handleTouchCancel = () => {
    swipeRef.current = null;
    setTouchPaused(false);
  };

  /* The chip row scrolls sideways itself, so it must not change slides. */
  // eslint-disable-next-line no-unused-vars
  const stopSwipe = {
    onTouchStart: (e) => e.stopPropagation(),
    onTouchEnd: (e) => e.stopPropagation(),
  };

  /* ==========================================================
     SEARCH
  ========================================================== */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  /* Picking a package from the dropdown opens it directly. */
  const handlePackageSelect = (pkg) => {
    if (!pkg) return;
    setShowSuggestions(false);
    setSearchError("");
    navigate(getPackageUrl(pkg, pkg?.id));
  };

  const openCustomPackageRequest = () => {
    setShowSuggestions(false);
    setSearchError("");
    setCustomMode("unavailable");
    setCustomPackageModalOpen(true);
  };

  /* Uses the parent's handler when given, else opens the enquiry form. */
  const handlePlanTrip = () => {
    if (onPlanTrip) {
      onPlanTrip();
      return;
    }
    setShowSuggestions(false);
    setSearchError("");
    setCustomMode("plan");
    setCustomPackageModalOpen(true);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const search = destination.trim();

    if (!search) {
      setSearchError("");
      setShowSuggestions(false);
      navigate("/packages");
      return;
    }

    setSearching(true);
    setSearchError("");
    setShowSuggestions(false);

    const normalizedSearch = normalizeDestination(search);

    // Exact package title: open that package.
    const packageMatch = publishedPackages.find(
      (pkg) => normalizeDestination(getPackageTitle(pkg)) === normalizedSearch,
    );

    if (packageMatch) {
      navigate(getPackageUrl(packageMatch, packageMatch.id));
      setSearching(false);
      return;
    }

    const match =
      destinationOptions.find(
        (item) => normalizeDestination(item.name) === normalizedSearch,
      ) ||
      destinationOptions.find((item) => {
        const normalized = normalizeDestination(item.name);
        return (
          normalized.includes(normalizedSearch) ||
          normalizedSearch.includes(normalized)
        );
      });

    if (match) {
      navigate(`/packages?destination=${encodeURIComponent(match.name)}`);
    } else {
      setSearchError(`We don't currently have a package for "${search}".`);
    }

    setSearching(false);
  };

  const handleInputChange = (event) => {
    setDestination(event.target.value);
    setSearchError("");
    setShowSuggestions(true);
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/*
        Side padding on phones respects the device safe area (notches /
        landscape) with a 1.25rem minimum. From sm the padding is wider so
        the side arrows sit in the gutter and never overlap the content.
        touch-pan-y: vertical scrolling stays native, while horizontal
        swipes are handed to the slide swipe handler.
      */}
      <section
        ref={sectionRef}
        className="relative isolate flex min-h-[640px] touch-pan-y flex-col overflow-hidden bg-ink pb-10 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-12 sm:px-24 sm:py-16 lg:min-h-[740px] lg:px-28 lg:py-20"
        aria-roledescription={isCarousel ? "carousel" : undefined}
        aria-label={
          isCarousel ? `${BRAND_NAME} featured holidays and offers` : undefined
        }
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Slide images + each slide's own overlay (set in HeroManage) */}
        <SlideBackgrounds
          slides={slides}
          currentId={currentId}
          leavingId={leavingId}
          reducedMotion={reducedMotion}
        />

        {/* Light bottom shade so the search area stays readable even when
            a slide's overlay is set to "None". */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-[#1F0A15]/75 via-[#1F0A15]/25 to-transparent"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_20%,rgba(200,19,94,0.14)_0%,transparent_60%)]"
          aria-hidden="true"
        />

        {/* Side arrows (>= sm). The wrapper is wider than the content
            (max-w-6xl), so the arrows sit in the outer gutter and never
            overlap the headline or buttons. */}
        {isCarousel && (
          <div className="pointer-events-none absolute inset-0 z-20 mx-auto hidden w-full max-w-[84rem] sm:block">
            <button
              type="button"
              onClick={goPrev}
              className={`${ICON_BUTTON} pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2`}
              aria-label="Previous slide"
              {...hoverPauseProps}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className={`${ICON_BUTTON} pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2`}
              aria-label="Next slide"
              {...hoverPauseProps}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">
          {/* ---------- Slide copy region: text is placed per slide ---------- */}
          {copyLoading ? (
            <div
              className="flex min-h-[18rem] flex-1 flex-col items-start justify-center space-y-3 sm:min-h-[20rem] sm:items-center lg:min-h-[24rem]"
              role="status"
              aria-label={`Loading ${BRAND_NAME} hero content`}
            >
              <Skeleton className="mb-3 h-8 w-60 max-w-full rounded-full" />
              <Skeleton className="h-10 w-[88%] max-w-3xl sm:h-12 md:h-14" />
              <Skeleton className="h-10 w-[65%] max-w-2xl sm:h-12 md:h-14" />
              <Skeleton className="mt-4 h-5 w-full max-w-xl" />
              <Skeleton className="h-5 w-3/4 max-w-lg" />
            </div>
          ) : (
            /*
              All slides share one grid cell, so the region is as tall as the
              tallest slide and never jumps while sliding. grid-cols-[minmax(0,1fr)]
              pins the column to the container width, so a long word or a wide
              button can never stretch the column past the screen edge.
            */
            <div
              className="grid min-h-[18rem] flex-1 grid-cols-[minmax(0,1fr)] sm:min-h-[20rem] lg:min-h-[24rem]"
              aria-live={isPaused ? "polite" : "off"}
            >
              {slides.map((slide, index) => (
                <SlideCopy
                  key={slide.id}
                  slide={slide}
                  index={index}
                  count={count}
                  isActive={slide.id === currentId}
                  reducedMotion={reducedMotion}
                  packageById={packageById}
                  packagesLoading={packagesLoading}
                />
              ))}
            </div>
          )}

          {/* ---------- Centred block: pager, search, plan, highlights ---------- */}
          <div className="mx-auto mt-6 w-full max-w-3xl sm:mt-8">
            {/* Pager (progress bars only, no numbers) */}
            {isCarousel && !copyLoading && (
              <div className="min-w-0" {...hoverPauseProps}>
                <SlidePager
                  slides={slides}
                  current={current}
                  barRefs={barRefs}
                  onSelect={selectSlide}
                  onKeyDown={handlePagerKeyDown}
                  canAutoplay={canAutoplay}
                  userPaused={userPaused}
                  onTogglePause={() => setUserPaused((value) => !value)}
                />
              </div>
            )}

            {/* Search (z-30 keeps the dropdown above the chips) */}
            <div
              ref={searchContainerRef}
              className="relative z-30 mt-3 w-full text-left sm:mt-4"
            >
              <form
                onSubmit={handleSearch}
                className="relative flex w-full flex-col overflow-visible rounded-3xl bg-white/95 text-text-dark shadow-2xl ring-1 ring-champagne/50 backdrop-blur sm:flex-row sm:rounded-full"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="destination-search"
                      className="mb-0.5 block text-xs font-medium text-muted"
                    >
                      Your next escape
                    </label>
                    <input
                      id="destination-search"
                      type="text"
                      value={destination}
                      onChange={handleInputChange}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search a destination or package"
                      autoComplete="off"
                      enterKeyHint="search"
                      className="w-full min-w-0 bg-transparent text-base font-medium text-text-dark outline-none placeholder:text-placeholder"
                    />
                  </div>
                </div>

                <div className="p-2 pt-0 sm:p-2 sm:pl-0">
                  <button
                    type="submit"
                    disabled={searching}
                    className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-brand transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-8"
                  >
                    {searching ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Search className="h-4 w-4" aria-hidden="true" />
                    )}
                    {searching ? "Searching..." : "Explore Packages"}
                  </button>
                </div>

                {/* Package suggestions: click to open that package */}
                {showSuggestions &&
                  !packagesLoading &&
                  filteredPackageOptions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-travel-hover">
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-xs font-semibold text-muted">
                          Explore Journeys
                        </p>
                      </div>

                      <div className="max-h-64 overflow-y-auto p-2">
                        {filteredPackageOptions.map((pkg) => (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => handlePackageSelect(pkg)}
                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                              <MapPin className="h-4 w-4" aria-hidden="true" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-text-dark group-hover:text-primary">
                                {getPackageTitle(pkg) || "Package"}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted">
                                {[
                                  pkg?.destination,
                                  pkg?.duration_days
                                    ? `${pkg.duration_days} ${
                                        Number(pkg.duration_days) === 1
                                          ? "day"
                                          : "days"
                                      }`
                                    : "",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </span>

                            <ChevronRight
                              className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-primary"
                              aria-hidden="true"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {showSuggestions &&
                  !packagesLoading &&
                  destination.trim() &&
                  filteredPackageOptions.length === 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-card p-4 shadow-travel-hover">
                      <div className="flex gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                        </span>

                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-text-dark">
                            No package found for "{destination}"
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            You can still request a customized package for this
                            destination.
                          </p>
                          <button
                            type="button"
                            onClick={openCustomPackageRequest}
                            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <MessageCircle
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            Request custom package
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </form>

              {searchError && (
                <div
                  className="mt-3 rounded-2xl border border-white/15 bg-ink/70 px-4 py-3 text-white backdrop-blur-md"
                  role="alert"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">Destination unavailable</p>
                      <p className="mt-1 break-words text-xs leading-relaxed text-white/80">
                        We don't currently have a package for{" "}
                        <span className="font-semibold text-white">
                          "{destination.trim()}"
                        </span>
                        . We can create a customized package for you.
                      </p>
                      <button
                        type="button"
                        onClick={openCustomPackageRequest}
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <MessageCircle
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        Request a custom package
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Browse by trip type (solid chips, swipeable on phones) */}
            {/* <div
              className={`-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 ${NO_SCROLLBAR}`}
              aria-label="Browse by trip type"
              {...stopSwipe}
            >
              {Object.entries(PACKAGE_TYPE_CONFIG).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Link
                    key={type}
                    to={`/packages?type=${encodeURIComponent(type)}`}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-champagne/50 bg-white/90 px-4 text-[13px] font-medium tracking-wide text-text-dark transition-colors hover:border-champagne hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    {config.short}
                  </Link>
                );
              })}
            </div> */}

            {/* Plan button */}
            <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-center">
              <button
                type="button"
                onClick={handlePlanTrip}
                className="group inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-8 text-sm font-semibold tracking-wide text-rose-dark shadow-brand transition-all duration-300 hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto sm:min-w-[18rem]"
              >
                <Plane
                  className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
                Tell us your plan
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
              <p className="text-xs text-white/80 sm:text-center">
                A journey designed around you
              </p>
            </div>

            {/* Why book with us */}
            <ul className="mt-8 grid grid-cols-3 border-t border-champagne/25 pt-6 [@media(max-height:700px)]:hidden">
              {HIGHLIGHTS.map(({ icon: Icon, label }, index) => (
                <li
                  key={label}
                  className={`flex min-w-0 flex-col items-start gap-2 px-2 first:pl-0 sm:flex-row sm:items-center sm:justify-center sm:gap-2.5 ${
                    index > 0 ? "sm:border-l sm:border-champagne/25" : ""
                  }`}
                >
                  <Icon
                    className="h-5 w-5 shrink-0 text-champagne"
                    aria-hidden="true"
                  />
                  <span className="break-words text-[11px] font-medium uppercase leading-snug tracking-[0.14em] text-white/90 sm:text-xs">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CustomPackageModal
        open={customPackageModalOpen}
        destination={destination}
        mode={customMode}
        onClose={() => setCustomPackageModalOpen(false)}
      />
    </>
  );
}

















































// import {
//   Fragment,
//   useCallback,
//   useEffect,
//   useLayoutEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   ArrowRight,
//   CalendarClock,
//   CheckCircle2,
//   ChevronLeft,
//   ChevronRight,
//   Compass,
//   Globe2,
//   Headset,
//   Heart,
//   Landmark,
//   Loader2,
//   MapPin,
//   MessageCircle,
//   Mountain,
//   Pause,
//   Plane,
//   PlaneTakeoff,
//   Play,
//   Search,
//   Send,
//   Sparkles,
//   TreePine,
//   Wallet,
//   Waves,
//   X,
// } from "lucide-react";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import api from "../api/axios";
// import { getHero, getPackages, getSiteSettings } from "../api/content";
// import { useQuery } from "../hooks/useQuery";
// import { getHeroLayout } from "../utils/heroLayout";

// import { cld, cldSrcSet } from "../utils/cloudinary";

// /* ============================================================
//    BRAND
// ============================================================ */
// const BRAND_NAME = "Manyara Prive Vacations";
// const DEFAULT_BADGE = "Curated holidays, made simple";

// /* ============================================================
//    CAROUSEL SETTINGS
// ============================================================ */
// const AUTOPLAY_MS = 5000;
// const FADE_MS = 1100;
// const ZOOM_MS = 8000;
// const REFRESH_MS = 60000;
// const CLOCK_MS = 30000;
// const MAX_SLIDES = 6;
// const FALLBACK_IMAGE = "/images/view1.webp";

// /* Written by HeroManage after every save so other tabs revalidate. */
// const HERO_UPDATED_KEY = "manyara:hero-updated";

// const getPackageUrl = (pkg, id) => `/packages/${pkg?.slug || pkg?.id || id}`;

// /* ============================================================
//    WHY BOOK WITH US (edit these three lines to match your business)
// ============================================================ */
// const HIGHLIGHTS = [
//   { icon: Compass, label: "Curated itineraries" },
//   { icon: Wallet, label: "Clear, upfront pricing" },
//   { icon: Headset, label: "Support during your trip" },
// ];

// /* ============================================================
//    PACKAGE TYPE CONFIG (keys match backend PackageTypeEnum)
// ============================================================ */
// const PACKAGE_TYPE_CONFIG = {
//   family: {
//     label: "Family Holidays",
//     short: "Family",
//     icon: Sparkles,
//     description: "Memorable holidays designed for the whole family.",
//   },
//   pilgrimage: {
//     label: "Temples & Pilgrimage",
//     short: "Pilgrimage",
//     icon: Landmark,
//     description: "Spiritual journeys and meaningful temple tours.",
//   },
//   beach: {
//     label: "Beach Holidays",
//     short: "Beaches",
//     icon: Waves,
//     description: "Relaxing beaches, islands and coastal escapes.",
//   },
//   mountains_adventure: {
//     label: "Mountains & Adventures",
//     short: "Mountains",
//     icon: Mountain,
//     description: "Mountains, valleys and unforgettable adventures.",
//   },
//   romantic: {
//     label: "Romantic Getaways",
//     short: "Romantic",
//     icon: Heart,
//     description: "Beautiful escapes designed for couples.",
//   },
//   international: {
//     label: "International",
//     short: "International",
//     icon: Globe2,
//     description: "Discover destinations beyond India.",
//   },
//   wildlife_nature: {
//     label: "Wildlife & Nature",
//     short: "Wildlife",
//     icon: TreePine,
//     description: "Wildlife, forests and beautiful natural escapes.",
//   },
// };

// const EMPTY_CUSTOM_FORM = {
//   name: "",
//   phone: "",
//   destination: "",
//   package_type: "",
//   travellers: "1",
//   travel_date: "",
//   message: "",
// };

// /* ============================================================
//    THEME CLASSES (Tailwind tokens from tailwind.config.js)
// ============================================================ */
// const INPUT_CLASS =
//   "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-text-dark outline-none transition placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface";
// const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-text-dark";

// /* Round side arrows (>= sm). */
// const ICON_BUTTON =
//   "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white backdrop-blur transition hover:bg-ink/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

// /* Pause is an accessibility control, not a main action: quiet ghost style,
//    but still a 40px touch target. */
// const PAUSE_BUTTON =
//   "-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:mr-0";

// /*
//  * One button system for slide actions: same min-height, radius, type and
//  * focus ring everywhere.
//  *
//  * Mobile fix: the buttons used a fixed h-12 + truncate, so long labels
//  * ("Explore Mountains & Adventures", long package names) were clipped on
//  * narrow phones. They now use min-h-12 + padding so the label can wrap to a
//  * second line instead of being cut, fill the row on phones, and shrink back
//  * to their natural width from sm.
//  *
//  *   BTN_PRIMARY - solid accent (main actions)
//  *   BTN_GLASS   - translucent white (secondary actions)
//  */
// const BTN =
//   "inline-flex min-h-12 w-full max-w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-center text-sm font-semibold leading-snug tracking-wide transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-7";
// const BTN_PRIMARY = `${BTN} bg-accent text-white shadow-brand hover:bg-accent-hover`;
// const BTN_GLASS = `${BTN} border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20`;

// /* Hides the scrollbar on the swipeable chip row. */
// const NO_SCROLLBAR =
//   "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

// /*
//  * Layout, top to bottom:
//  *   copy region (slide text, placed by the admin's content position)
//  *   -> centred block: pager, search, category chips, plan button, highlights
//  */

// /* ============================================================
//    HELPERS
// ============================================================ */
// const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

// const normalizeDestination = (value) =>
//   String(value || "")
//     .trim()
//     .replace(/\s+/g, " ")
//     .toLowerCase();

// const getImageUrl = (image) =>
//   typeof image === "string" ? image.trim() : cleanText(image?.url);

// const getPackageTitle = (pkg) =>
//   cleanText(pkg?.title) || cleanText(pkg?.name) || cleanText(pkg?.package_name);

// const padNumber = (value) => String(value).padStart(2, "0");

// function isPublishedPackage(pkg) {
//   const status = String(pkg?.status ?? "")
//     .trim()
//     .toLowerCase();
//   return status === "" || status === "published" || pkg?.is_published === true;
// }

// function getTodayForDateInput() {
//   const now = new Date();
//   const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
//   return local.toISOString().split("T")[0];
// }

// const toTime = (value) => {
//   const time = value ? new Date(value).getTime() : NaN;
//   return Number.isNaN(time) ? null : time;
// };

// function isSlideLive(slide, now) {
//   if (slide.startsAt !== null && slide.startsAt > now) return false;
//   if (slide.endsAt !== null && slide.endsAt < now) return false;
//   return true;
// }

// function normalizeSlides(data, now) {
//   const list = Array.isArray(data)
//     ? data
//     : Array.isArray(data?.items)
//       ? data.items
//       : Array.isArray(data?.slides)
//         ? data.slides
//         : [];

//   return list
//     .map((item, index) => {
//       const type = String(item?.package_type || "")
//         .trim()
//         .toLowerCase();
//       const packageId = Number(item?.package_id);

//       return {
//         id: item?.id ?? `slide-${index}`,
//         order: Number.isFinite(Number(item?.display_order))
//           ? Number(item.display_order)
//           : 999,
//         active: item?.is_active !== false,
//         image: getImageUrl(item?.image),
//         imageMobile: getImageUrl(item?.image_mobile),
//         position: /^[a-z0-9% ]{1,30}$/i.test(cleanText(item?.image_position))
//           ? cleanText(item.image_position)
//           : "center",
//         contentPosition: cleanText(item?.content_position),
//         overlayStrength: cleanText(item?.overlay_strength),
//         badge: cleanText(item?.badge),
//         headline: cleanText(item?.headline),
//         subtext: cleanText(item?.subtext),
//         packageType: PACKAGE_TYPE_CONFIG[type] ? type : "",
//         packageId:
//           Number.isInteger(packageId) && packageId > 0 ? packageId : null,
//         offerText: cleanText(item?.offer_text),
//         startsAt: toTime(item?.starts_at),
//         endsAt: toTime(item?.ends_at),
//       };
//     })
//     .filter(
//       (slide) =>
//         slide.active && slide.image && slide.headline && isSlideLive(slide, now),
//     )
//     .sort((a, b) => a.order - b.order)
//     .slice(0, MAX_SLIDES);
// }

// function buildFallbackSlide(settings) {
//   return {
//     id: "default",
//     image: FALLBACK_IMAGE,
//     imageMobile: "",
//     position: "center",
//     contentPosition: "middle-center",
//     overlayStrength: "medium",
//     badge: DEFAULT_BADGE,
//     headline:
//       cleanText(settings?.homepage_headline) ||
//       "Journeys designed for the way you love to travel.",
//     subtext:
//       "Thoughtfully curated holidays for couples and families, planned with care from the first idea to the journey home.",
//     packageType: "",
//     packageId: null,
//     offerText: "",
//     startsAt: null,
//     endsAt: null,
//   };
// }

// function formatShortDate(time) {
//   return new Intl.DateTimeFormat("en-IN", {
//     day: "numeric",
//     month: "short",
//   }).format(new Date(time));
// }

// /* Which side the text sits on, read from the layout's text classes. */
// function getHorizontal(layout) {
//   if (layout.text.includes("text-center")) return "center";
//   if (layout.text.includes("text-right")) return "right";
//   return "left";
// }

// /* ============================================================
//    REDUCED MOTION
// ============================================================ */
// function usePrefersReducedMotion() {
//   const [reduced, setReduced] = useState(
//     () =>
//       typeof window !== "undefined" &&
//       Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
//   );

//   useEffect(() => {
//     const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
//     if (!query) return undefined;
//     const update = () => setReduced(query.matches);
//     update();
//     query.addEventListener("change", update);
//     return () => query.removeEventListener("change", update);
//   }, []);

//   return reduced;
// }

// /* ============================================================
//    SMALL COMPONENTS
// ============================================================ */
// function Skeleton({ className = "" }) {
//   return (
//     <div
//       className={`animate-pulse rounded-xl bg-white/15 ${className}`}
//       aria-hidden="true"
//     />
//   );
// }

// /*
//  * Buttons configured in HeroManage:
//  *   package_type -> "Explore <Category>" button (/packages?type=...)
//  *   package_id   -> "View <Package>" button (specific package)
//  *
//  * On phones the category button uses the short label ("Explore Mountains")
//  * so it fits on one line; the full label is shown from sm. The package
//  * button shows up to two lines of the package name instead of one
//  * truncated line.
//  */
// function SlideActions({ slide, packageById, packagesLoading, align }) {
//   const config = PACKAGE_TYPE_CONFIG[slide.packageType];
//   const pkg = slide.packageId ? packageById.get(slide.packageId) : null;

//   // Hide the package button when the package is no longer published.
//   const showPackage = slide.packageId && (pkg || packagesLoading);

//   if (!config && !showPackage) return null;

//   const CategoryIcon = config?.icon;

//   return (
//     <div
//       className={`flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center ${align}`}
//     >
//       {config && (
//         <Link
//           to={`/packages?type=${encodeURIComponent(slide.packageType)}`}
//           className={BTN_PRIMARY}
//         >
//           <CategoryIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
//           <span className="min-w-0 break-words">
//             <span className="sm:hidden">Explore {config.short}</span>
//             <span className="hidden sm:inline">Explore {config.label}</span>
//           </span>
//           <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
//         </Link>
//       )}

//       {showPackage && (
//         <Link
//           to={getPackageUrl(pkg, slide.packageId)}
//           className={`${BTN_GLASS} sm:max-w-[18rem]`}
//         >
//           <span className="line-clamp-2 min-w-0 break-words">
//             {pkg ? `View ${getPackageTitle(pkg) || "package"}` : "View package"}
//           </span>
//           <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
//         </Link>
//       )}
//     </div>
//   );
// }

// function renderHeadline(text) {
//   const words = text.trim().split(/\s+/);
//   if (words.length < 3) return text;
//   const last = words.pop();
//   return (
//     <>
//       {words.join(" ")}{" "}
//       <em className="font-medium italic text-champagne-light">{last}</em>
//     </>
//   );
// }

// /*
//  * Slide copy cross-fades: the outgoing text fades out quickly, then the
//  * incoming text fades in with a small upward drift.
//  *
//  * Every slide shares one grid cell. Each slide places its own text block
//  * (top / middle / bottom x left / center / right) from the admin's
//  * content position. Long text is clamped so one slide cannot make the
//  * whole hero grow.
//  *
//  * Mobile fix: below sm the text block is forced to the full width of the
//  * cell (w-full) so every slide gets the same, predictable width no matter
//  * which side the admin positioned it on. Previously a right/center slide
//  * shrink-wrapped to its content, which let buttons and long words overflow
//  * or get clipped on narrow screens while sliding.
//  */
// function SlideCopy({
//   slide,
//   index,
//   count,
//   isActive,
//   reducedMotion,
//   packageById,
//   packagesLoading,
// }) {
//   const Heading = index === 0 ? "h1" : "h2";
//   const layout = getHeroLayout(slide.contentPosition, slide.overlayStrength);
//   const horizontal = getHorizontal(layout);

//   const hasActions =
//     Boolean(PACKAGE_TYPE_CONFIG[slide.packageType]) || Boolean(slide.packageId);
//   const hasMeta = Boolean(slide.offerText) || slide.endsAt !== null;

//   let motion;
//   if (reducedMotion) {
//     motion = isActive
//       ? "visible opacity-100 duration-300"
//       : "pointer-events-none invisible opacity-0 duration-300";
//   } else if (isActive) {
//     motion =
//       "visible translate-y-0 opacity-100 duration-[800ms] delay-[400ms]";
//   } else {
//     motion =
//       "pointer-events-none invisible translate-y-3 opacity-0 duration-[400ms]";
//   }

//   return (
//     <div
//       role={count > 1 ? "group" : undefined}
//       aria-roledescription={count > 1 ? "slide" : undefined}
//       aria-label={count > 1 ? `${index + 1} of ${count}` : undefined}
//       aria-hidden={!isActive}
//       className={`col-start-1 row-start-1 flex min-w-0 flex-col transition-[opacity,transform,visibility] ease-out ${layout.wrapper} ${motion}`}
//     >
//       <div
//         className={`flex w-full min-w-0 max-w-3xl flex-col sm:w-auto ${layout.text}`}
//       >
//         {/* Eyebrow: wraps to two lines on small phones instead of being cut */}
//         <div
//           className={`mb-4 flex max-w-full items-center gap-3 sm:mb-6 ${layout.actions}`}
//         >
//           {horizontal !== "right" && (
//             <span
//               className="h-px w-6 shrink-0 bg-champagne/70 sm:w-8"
//               aria-hidden="true"
//             />
//           )}

//           <span className="line-clamp-2 min-w-0 text-[11px] font-medium uppercase leading-snug tracking-[0.2em] text-champagne sm:text-xs sm:tracking-[0.28em]">
//             {slide.badge || DEFAULT_BADGE}
//           </span>

//           {horizontal !== "left" && (
//             <span
//               className="h-px w-6 shrink-0 bg-champagne/70 sm:w-8"
//               aria-hidden="true"
//             />
//           )}
//         </div>

//         <Heading className="line-clamp-3 max-w-3xl break-words font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.01em] text-white [text-wrap:balance] [@media(min-width:380px)]:text-[2.5rem] [@media(min-width:380px)]:leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
//           {renderHeadline(slide.headline)}
//         </Heading>

//         {/* Subtext: max 2 lines on phones, 3 from sm */}
//         {slide.subtext && (
//           <p className="mt-3 line-clamp-2 max-w-xl break-words text-[15px] leading-relaxed text-white/85 [text-wrap:pretty] sm:mt-5 sm:line-clamp-3 sm:max-w-2xl sm:text-lg sm:leading-8">
//             {slide.subtext}
//           </p>
//         )}

//         {/* Offer chip + validity (chip now wraps instead of overflowing) */}
//         {hasMeta && (
//           <div
//             className={`mt-4 flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 ${layout.actions}`}
//           >
//             {slide.offerText && (
//               <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold leading-snug text-primary-dark shadow-travel-card">
//                 <Sparkles
//                   className="h-3.5 w-3.5 shrink-0 text-accent"
//                   aria-hidden="true"
//                 />
//                 <span className="min-w-0 break-words">{slide.offerText}</span>
//               </span>
//             )}

//             {slide.endsAt !== null && (
//               <span className="inline-flex items-center gap-1.5 text-xs text-white/85 sm:text-[13px]">
//                 <CalendarClock
//                   className="h-4 w-4 shrink-0"
//                   aria-hidden="true"
//                 />
//                 Offer valid till {formatShortDate(slide.endsAt)}
//               </span>
//             )}
//           </div>
//         )}

//         {/* Actions: stacked full-width on mobile, side by side from sm */}
//         {hasActions && (
//           <div className={`mt-5 flex w-full min-w-0 sm:mt-6 ${layout.actions}`}>
//             <SlideActions
//               slide={slide}
//               packageById={packageById}
//               packagesLoading={packagesLoading}
//               align={layout.actions}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /*
//  * Backgrounds: each slide has its image and its own readability overlay.
//  * Both fade together, so the shade always sits behind the slide's text.
//  */
// function SlideBackgrounds({ slides, currentId, leavingId, reducedMotion }) {
//   return (
//     <div className="absolute inset-0 -z-20 bg-ink" aria-hidden="true">
//       {slides.map((slide, index) => {
//         const isActive = slide.id === currentId;
//         const isLeaving = slide.id === leavingId;

//         let layer = "z-0 opacity-0";
//         let overlayLayer = "z-0 opacity-0";
//         let transition = "none";
//         let overlayTransition = "none";

//         if (isActive) {
//           layer = "z-20 opacity-100";
//           overlayLayer = "z-[25] opacity-100";
//           transition = reducedMotion
//             ? "opacity 300ms linear"
//             : `opacity ${FADE_MS}ms ease-in-out, transform ${ZOOM_MS}ms linear`;
//           overlayTransition = reducedMotion
//             ? "opacity 300ms linear"
//             : `opacity ${FADE_MS}ms ease-in-out`;
//         } else if (isLeaving) {
//           layer = "z-10 opacity-100";
//           overlayLayer = "z-[15] opacity-100";
//           transition = reducedMotion ? "none" : `transform ${ZOOM_MS}ms linear`;
//         }

//         const zoomed = !reducedMotion && (isActive || isLeaving);

//         const overlayClass = getHeroLayout(
//           slide.contentPosition,
//           slide.overlayStrength,
//         ).overlay;

//         return (
//           <Fragment key={slide.id}>
//             <picture>
//               {slide.imageMobile && (
//                 <source
//                   media="(max-width: 767px)"
//                   srcSet={cldSrcSet(slide.imageMobile, [480, 768])}
//                   sizes="100vw"
//                 />
//               )}
//               <img
//                 src={cld(slide.image, 1280)}
//                 srcSet={cldSrcSet(slide.image, [768, 1280, 1920])}
//                 sizes="100vw"
//                 alt=""
//                 loading={index === 0 ? "eager" : "lazy"}
//                 fetchPriority={index === 0 ? "high" : undefined}
//                 decoding="async"
//                 draggable={false}
//                 style={{ objectPosition: slide.position, transition }}
//                 className={`absolute inset-0 h-full w-full object-cover will-change-[opacity,transform] ${layer} ${
//                   zoomed ? "scale-[1.08]" : "scale-100"
//                 }`}
//               />
//             </picture>

//             {overlayClass && (
//               <div
//                 className={`absolute inset-0 ${overlayLayer} ${overlayClass}`}
//                 style={{ transition: overlayTransition }}
//               />
//             )}
//           </Fragment>
//         );
//       })}
//     </div>
//   );
// }

// /*
//  * Pager: counter, progress segments and a quiet pause button.
//  * Phones change slides by swiping or tapping a segment (no arrow buttons,
//  * so the segments get the room); the side arrows (>= sm) live in the hero.
//  */
// function SlidePager({
//   slides,
//   current,
//   barRefs,
//   onSelect,
//   onKeyDown,
//   canAutoplay,
//   userPaused,
//   onTogglePause,
// }) {
//   const count = slides.length;

//   return (
//     <div className="flex items-center gap-3 sm:justify-center sm:gap-5">
//       <span
//         className="shrink-0 font-display text-base font-semibold tabular-nums text-white/90 sm:text-xl"
//         aria-hidden="true"
//       >
//         {padNumber(current + 1)}
//         <span className="text-white/50"> / {padNumber(count)}</span>
//       </span>

//       <div
//         role="group"
//         aria-label="Choose a slide"
//         onKeyDown={onKeyDown}
//         className="flex min-w-0 flex-1 gap-1.5 sm:max-w-md sm:gap-2"
//       >
//         {slides.map((slide, index) => {
//           const isActive = index === current;
//           return (
//             <button
//               key={slide.id}
//               type="button"
//               onClick={() => onSelect(index)}
//               aria-label={`Show slide ${index + 1} of ${count}: ${slide.headline}`}
//               aria-current={isActive ? "true" : undefined}
//               className="group flex-1 rounded-md py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
//             >
//               <span className="block h-1 overflow-hidden rounded-full bg-white/30 transition-colors group-hover:bg-white/45">
//                 <span
//                   ref={(element) => {
//                     barRefs.current[index] = element;
//                   }}
//                   className="block h-full origin-left rounded-full bg-champagne"
//                   style={{ transform: "scaleX(0)" }}
//                 />
//               </span>
//             </button>
//           );
//         })}
//       </div>

//       {canAutoplay && (
//         <button
//           type="button"
//           onClick={onTogglePause}
//           className={PAUSE_BUTTON}
//           aria-label="Pause slideshow"
//           aria-pressed={userPaused}
//         >
//           {userPaused ? (
//             <Play className="h-4 w-4" aria-hidden="true" />
//           ) : (
//             <Pause className="h-4 w-4" aria-hidden="true" />
//           )}
//         </button>
//       )}
//     </div>
//   );
// }

// /* ============================================================
//    CUSTOM PACKAGE MODAL
// ============================================================ */
// function TextField({ id, label, error, ...inputProps }) {
//   return (
//     <div>
//       <label htmlFor={id} className={LABEL_CLASS}>
//         {label}
//       </label>
//       <input
//         id={id}
//         className={INPUT_CLASS}
//         aria-invalid={error ? "true" : undefined}
//         aria-describedby={error ? `${id}-error` : undefined}
//         {...inputProps}
//       />
//       {error && (
//         <p
//           id={`${id}-error`}
//           className="mt-1.5 text-xs font-medium text-error-text"
//         >
//           {error}
//         </p>
//       )}
//     </div>
//   );
// }

// const MODAL_FIELDS = [
//   "name",
//   "phone",
//   "destination",
//   "package_type",
//   "travellers",
//   "travel_date",
// ];

// function CustomPackageModal({
//   open,
//   destination,
//   mode = "unavailable",
//   onClose,
// }) {
//   const [form, setForm] = useState({
//     ...EMPTY_CUSTOM_FORM,
//     destination: destination || "",
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const submitLockRef = useRef(false);

//   const today = getTodayForDateInput();
//   const currentYear = new Date().getFullYear();
//   const nextYear = currentYear + 1;

//   const validateField = (name, value) => {
//     const trimmed = String(value ?? "").trim();

//     switch (name) {
//       case "name":
//         if (!trimmed) return "Please enter your name.";
//         if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(trimmed)) {
//           return "Name should contain letters only.";
//         }
//         return "";
//       case "phone":
//         if (!trimmed) return "Please enter your phone number.";
//         if (!/^\d+$/.test(trimmed)) {
//           return "Phone number should contain numbers only.";
//         }
//         if (trimmed.length !== 10) {
//           return "Phone number should contain 10 digits.";
//         }
//         if (!/^[6-9]\d{9}$/.test(trimmed)) {
//           return "Please enter a valid phone number.";
//         }
//         return "";
//       case "destination":
//         return trimmed ? "" : "Please enter your destination.";
//       case "package_type":
//         return trimmed ? "" : "Please select a package type.";
//       case "travellers":
//         if (!trimmed) return "Please enter the number of travellers.";
//         if (!/^\d+$/.test(trimmed)) {
//           return "Travellers must be a whole number.";
//         }
//         if (Number(trimmed) < 1) {
//           return "There must be at least 1 traveller.";
//         }
//         return "";
//       case "travel_date": {
//         if (!trimmed) return "Please select your travel date.";
//         if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
//           return "Please enter a valid travel date.";
//         }
//         const selected = new Date(`${trimmed}T00:00:00`);
//         if (Number.isNaN(selected.getTime())) {
//           return "Please enter a valid travel date.";
//         }
//         const year = selected.getFullYear();
//         if (year !== currentYear && year !== nextYear) {
//           return `Travel date must be in ${currentYear} or ${nextYear}.`;
//         }
//         const todayDate = new Date();
//         todayDate.setHours(0, 0, 0, 0);
//         if (selected < todayDate) {
//           return "Travel date cannot be in the past.";
//         }
//         return "";
//       }
//       default:
//         return "";
//     }
//   };

//   const validateForm = () => {
//     const nextErrors = {};
//     MODAL_FIELDS.forEach((field) => {
//       const error = validateField(field, form[field]);
//       if (error) nextErrors[field] = error;
//     });
//     setErrors(nextErrors);
//     setTouched((previous) => ({
//       ...previous,
//       ...Object.fromEntries(MODAL_FIELDS.map((field) => [field, true])),
//     }));
//     return Object.keys(nextErrors).length === 0;
//   };

//   useEffect(() => {
//     if (!open) return;
//     setForm({ ...EMPTY_CUSTOM_FORM, destination: destination || "" });
//     setSubmitting(false);
//     setSuccess(false);
//     setErrors({});
//     setTouched({});
//     submitLockRef.current = false;
//   }, [open, destination]);

//   useEffect(() => {
//     if (!open) return undefined;

//     const handleEscape = (event) => {
//       if (event.key === "Escape" && !submitting) onClose();
//     };

//     document.addEventListener("keydown", handleEscape);
//     const previousOverflow = document.body.style.overflow;
//     document.body.style.overflow = "hidden";

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//       document.body.style.overflow = previousOverflow;
//     };
//   }, [open, onClose, submitting]);

//   if (!open) return null;

//   const handleChange = (event) => {
//     const { name, value } = event.target;
//     setForm((previous) => ({ ...previous, [name]: value }));
//     setTouched((previous) => ({ ...previous, [name]: true }));
//     setErrors((previous) => ({
//       ...previous,
//       [name]: validateField(name, value),
//     }));
//   };

//   const fieldError = (name) => (touched[name] ? errors[name] : "");

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     if (submitLockRef.current || submitting || success) return;

//     if (!validateForm()) {
//       toast.error("Please correct the highlighted fields.");
//       return;
//     }

//     submitLockRef.current = true;
//     setSubmitting(true);

//     try {
//       await api.post("/enquiries", {
//         name: form.name.trim(),
//         phone: form.phone.trim(),
//         destination: form.destination.trim(),
//         package_type: form.package_type.trim(),
//         travellers: Number(form.travellers),
//         travel_date: form.travel_date,
//         message: form.message.trim(),
//       });
//       setSuccess(true);
//       toast.success("Your travel request has been submitted successfully!");
//     } catch (error) {
//       console.error("Custom package enquiry failed:", error);
//       submitLockRef.current = false;

//       const detail = error?.response?.data?.detail;
//       let message = "Unable to submit your request right now. Please try again.";

//       if (Array.isArray(detail)) {
//         message = detail
//           .map((item) => item?.msg || item?.message || "Invalid enquiry details.")
//           .join(", ");
//       } else if (typeof detail === "string") {
//         message = detail;
//       }

//       toast.error(message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="custom-package-title"
//       onMouseDown={(event) => {
//         if (event.target === event.currentTarget && !submitting) onClose();
//       }}
//     >
//       {/* Bottom sheet on phones, centred card from sm */}
//       <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-brand sm:max-h-[90vh] sm:rounded-3xl sm:p-7">
//         <button
//           type="button"
//           onClick={onClose}
//           disabled={submitting}
//           className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-secondary transition hover:bg-surface-soft hover:text-text-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
//           aria-label="Close custom package form"
//         >
//           <X className="h-5 w-5" aria-hidden="true" />
//         </button>

//         {success ? (
//           <div className="py-8 text-center">
//             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success">
//               <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
//             </div>
//             <h2
//               id="custom-package-title"
//               className="mt-5 font-display text-3xl font-semibold text-text-dark"
//             >
//               Request received
//             </h2>
//             <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
//               Thank you. Our travel team will review your request and contact
//               you soon.
//             </p>
//             <button
//               type="button"
//               onClick={onClose}
//               className="mt-6 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
//             >
//               Done
//             </button>
//           </div>
//         ) : (
//           <>
//             <div className="pr-10">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-lighter text-primary">
//                   <PlaneTakeoff className="h-5 w-5" aria-hidden="true" />
//                 </div>
//                 <h2
//                   id="custom-package-title"
//                   className="font-display text-2xl font-semibold text-text-dark sm:text-3xl"
//                 >
//                   Plan a custom trip
//                 </h2>
//               </div>
//               <p className="mt-3 text-sm leading-relaxed text-text-secondary">
//                 {mode === "plan"
//                   ? "Tell us where you want to go and when. Our team will plan a trip around you and get in touch."
//                   : "This destination is not currently available as a package. Tell us what you are looking for and our team can help create a customized trip."}
//               </p>
//             </div>

//             <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
//               <TextField
//                 id="custom-name"
//                 label="Name"
//                 name="name"
//                 type="text"
//                 value={form.name}
//                 onChange={handleChange}
//                 placeholder="Enter your name"
//                 autoComplete="name"
//                 disabled={submitting}
//                 required
//                 error={fieldError("name")}
//               />

//               <TextField
//                 id="custom-phone"
//                 label="Phone number"
//                 name="phone"
//                 type="tel"
//                 value={form.phone}
//                 onChange={handleChange}
//                 placeholder="10-digit mobile number"
//                 autoComplete="tel"
//                 inputMode="numeric"
//                 maxLength={10}
//                 disabled={submitting}
//                 required
//                 error={fieldError("phone")}
//               />

//               <TextField
//                 id="custom-destination"
//                 label="Destination"
//                 name="destination"
//                 type="text"
//                 value={form.destination}
//                 onChange={handleChange}
//                 placeholder="Enter your destination"
//                 disabled={submitting}
//                 required
//                 error={fieldError("destination")}
//               />

//               <div>
//                 <label htmlFor="custom-package-type" className={LABEL_CLASS}>
//                   Package type
//                 </label>
//                 <select
//                   id="custom-package-type"
//                   name="package_type"
//                   value={form.package_type}
//                   onChange={handleChange}
//                   disabled={submitting}
//                   required
//                   className={INPUT_CLASS}
//                 >
//                   <option value="">Select package type</option>
//                   {Object.entries(PACKAGE_TYPE_CONFIG).map(([value, config]) => (
//                     <option key={value} value={value}>
//                       {config.label}
//                     </option>
//                   ))}
//                 </select>
//                 {fieldError("package_type") && (
//                   <p className="mt-1.5 text-xs font-medium text-error-text">
//                     {fieldError("package_type")}
//                   </p>
//                 )}
//               </div>

//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <TextField
//                   id="custom-travellers"
//                   label="Travellers"
//                   name="travellers"
//                   type="text"
//                   value={form.travellers}
//                   onChange={handleChange}
//                   placeholder="Number"
//                   inputMode="numeric"
//                   pattern="[0-9]*"
//                   disabled={submitting}
//                   required
//                   error={fieldError("travellers")}
//                 />

//                 <TextField
//                   id="custom-travel-date"
//                   label="Travel date"
//                   name="travel_date"
//                   type="date"
//                   min={today}
//                   value={form.travel_date}
//                   onChange={handleChange}
//                   disabled={submitting}
//                   required
//                   error={fieldError("travel_date")}
//                 />
//               </div>

//               <div>
//                 <label htmlFor="custom-message" className={LABEL_CLASS}>
//                   Message (optional)
//                 </label>
//                 <textarea
//                   id="custom-message"
//                   name="message"
//                   value={form.message}
//                   onChange={handleChange}
//                   rows={4}
//                   disabled={submitting}
//                   placeholder="Tell us about your trip requirements..."
//                   className={`${INPUT_CLASS} resize-none`}
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={submitting}
//                 className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
//               >
//                 {submitting ? (
//                   <>
//                     <Loader2
//                       className="h-4 w-4 animate-spin"
//                       aria-hidden="true"
//                     />
//                     Sending request...
//                   </>
//                 ) : (
//                   <>
//                     <Send className="h-4 w-4" aria-hidden="true" />
//                     Submit Enquiry
//                   </>
//                 )}
//               </button>
//             </form>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ============================================================
//    MAIN HERO
// ============================================================ */
// export default function Hero({ onPlanTrip }) {
//   const navigate = useNavigate();
//   const sectionRef = useRef(null);
//   const searchContainerRef = useRef(null);

//   const [destination, setDestination] = useState("");
//   const [searching, setSearching] = useState(false);
//   const [searchError, setSearchError] = useState("");
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [customPackageModalOpen, setCustomPackageModalOpen] = useState(false);
//   const [customMode, setCustomMode] = useState("unavailable");

//   /* ---------------- Cached data (useQuery) ---------------- */
//   const { data: settings, loading: settingsLoading } =
//     useQuery(getSiteSettings);
//   const { data: packageResponse, loading: packagesLoading } =
//     useQuery(getPackages);
//   const {
//     data: slideData,
//     loading: slidesLoading,
//     refetch: refetchHero,
//   } = useQuery(getHero);

//   /*
//    * Keep the latest refetch in a ref so the revalidation effects below
//    * never restart when the hook returns a new function identity.
//    */
//   const refetchRef = useRef(refetchHero);
//   refetchRef.current = refetchHero;

//   const [clock, setClock] = useState(() => Date.now());

//   useEffect(() => {
//     const clockTimer = setInterval(() => setClock(Date.now()), CLOCK_MS);

//     const refresh = () => {
//       if (document.hidden) return;
//       setClock(Date.now());
//       refetchRef.current?.();
//     };

//     const refreshTimer = setInterval(refresh, REFRESH_MS);
//     const onVisible = () => {
//       if (!document.hidden) refresh();
//     };
//     const onStorage = (event) => {
//       if (event.key === HERO_UPDATED_KEY) refresh();
//     };

//     document.addEventListener("visibilitychange", onVisible);
//     window.addEventListener("storage", onStorage);

//     return () => {
//       clearInterval(clockTimer);
//       clearInterval(refreshTimer);
//       document.removeEventListener("visibilitychange", onVisible);
//       window.removeEventListener("storage", onStorage);
//     };
//   }, []);

//   /* ---------------- Packages / destinations ---------------- */
//   const publishedPackages = useMemo(() => {
//     const list = Array.isArray(packageResponse)
//       ? packageResponse
//       : Array.isArray(packageResponse?.items)
//         ? packageResponse.items
//         : [];
//     return list.filter(isPublishedPackage);
//   }, [packageResponse]);

//   const packageById = useMemo(
//     () => new Map(publishedPackages.map((pkg) => [Number(pkg.id), pkg])),
//     [publishedPackages],
//   );

//   const destinationOptions = useMemo(() => {
//     const unique = new Map();
//     publishedPackages.forEach((pkg) => {
//       const name = String(pkg?.destination || "").trim();
//       const key = normalizeDestination(name);
//       if (!key) return;
//       if (!unique.has(key)) unique.set(key, { name, count: 0 });
//       unique.get(key).count += 1;
//     });
//     return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
//   }, [publishedPackages]);

//   /* Packages shown in the search dropdown (matches title or destination). */
//   const filteredPackageOptions = useMemo(() => {
//     const term = normalizeDestination(destination);

//     const list = term
//       ? publishedPackages.filter((pkg) =>
//           normalizeDestination(
//             `${getPackageTitle(pkg)} ${pkg?.destination || ""}`,
//           ).includes(term),
//         )
//       : publishedPackages;

//     return list.slice(0, 8);
//   }, [destination, publishedPackages]);

//   /* ---------------- Slides ---------------- */
//   const slides = useMemo(() => {
//     const live = normalizeSlides(slideData, clock);
//     return live.length > 0 ? live : [buildFallbackSlide(settings)];
//   }, [slideData, settings, clock]);

//   const count = slides.length;
//   const isCarousel = count > 1;

//   // Only show the loading skeleton before the first data arrives, so a
//   // background revalidation never flashes the copy.
//   const initialSlidesLoading = slidesLoading && slideData == null;
//   const copyLoading = initialSlidesLoading || (settingsLoading && !isCarousel);

//   const reducedMotion = usePrefersReducedMotion();

//   /*
//    * The active slide is tracked by id. When an admin removes or
//    * deactivates a slide, playback continues from the nearest remaining
//    * slide without a jump.
//    */
//   const [activeId, setActiveId] = useState(null);
//   const [leavingId, setLeavingId] = useState(null);
//   const lastIndexRef = useRef(0);

//   const foundIndex = slides.findIndex((slide) => slide.id === activeId);
//   const current =
//     foundIndex >= 0 ? foundIndex : Math.min(lastIndexRef.current, count - 1);
//   const currentId = slides[current]?.id ?? null;

//   const [userPaused, setUserPaused] = useState(false);
//   const [hoverPaused, setHoverPaused] = useState(false);
//   const [focusPaused, setFocusPaused] = useState(false);
//   const [pageHidden, setPageHidden] = useState(false);
//   const [offscreen, setOffscreen] = useState(false);
//   const [touchPaused, setTouchPaused] = useState(false);

//   const canAutoplay = isCarousel && !reducedMotion;
//   const isPaused =
//     !canAutoplay ||
//     userPaused ||
//     hoverPaused ||
//     focusPaused ||
//     pageHidden ||
//     offscreen ||
//     touchPaused;

//   const barRefs = useRef([]);
//   const elapsedRef = useRef(0);
//   const previousIdRef = useRef(currentId);
//   const swipeRef = useRef(null);
//   const slidesRef = useRef(slides);
//   slidesRef.current = slides;

//   useEffect(() => {
//     lastIndexRef.current = current;
//     if (currentId !== null && currentId !== activeId) setActiveId(currentId);
//   }, [current, currentId, activeId]);

//   const goTo = useCallback((index) => {
//     const list = slidesRef.current;
//     if (list.length === 0) return;
//     const next = ((index % list.length) + list.length) % list.length;
//     setActiveId(list[next].id);
//   }, []);

//   const goPrev = () => goTo(current - 1);
//   const goNext = () => goTo(current + 1);
//   const selectSlide = (index) => goTo(index);

//   // Keep the outgoing slide visible while the new one fades in.
//   useEffect(() => {
//     const previousId = previousIdRef.current;
//     if (previousId === currentId) return undefined;
//     previousIdRef.current = currentId;

//     if (!slidesRef.current.some((slide) => slide.id === previousId)) {
//       return undefined;
//     }

//     setLeavingId(previousId);
//     const timer = setTimeout(() => setLeavingId(null), FADE_MS + 100);
//     return () => clearTimeout(timer);
//   }, [currentId]);

//   // Restart the progress timer whenever the slide set or slide changes.
//   useLayoutEffect(() => {
//     elapsedRef.current = 0;
//     barRefs.current.forEach((bar, index) => {
//       if (!bar) return;
//       const filled = !canAutoplay && index === current;
//       bar.style.transform = filled ? "scaleX(1)" : "scaleX(0)";
//     });
//   }, [currentId, count, canAutoplay, current]);

//   // Auto-advance with progress bar.
//   useEffect(() => {
//     if (isPaused) return undefined;

//     let frame = 0;
//     let last = performance.now();

//     const tick = (now) => {
//       elapsedRef.current += now - last;
//       last = now;

//       const progress = Math.min(elapsedRef.current / AUTOPLAY_MS, 1);
//       const bar = barRefs.current[current];
//       if (bar) bar.style.transform = `scaleX(${progress})`;

//       if (progress >= 1) {
//         goTo(current + 1);
//         return;
//       }
//       frame = requestAnimationFrame(tick);
//     };

//     frame = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(frame);
//   }, [isPaused, current, currentId, count, goTo]);

//   useEffect(() => {
//     const onVisibility = () => setPageHidden(document.hidden);
//     onVisibility();
//     document.addEventListener("visibilitychange", onVisibility);
//     return () => document.removeEventListener("visibilitychange", onVisibility);
//   }, []);

//   useEffect(() => {
//     const element = sectionRef.current;
//     if (!element || typeof IntersectionObserver === "undefined") {
//       return undefined;
//     }
//     const observer = new IntersectionObserver(
//       ([entry]) => setOffscreen(!entry.isIntersecting),
//       { threshold: 0.2 },
//     );
//     observer.observe(element);
//     return () => observer.disconnect();
//   }, []);

//   /* Pause while the pointer is over the arrows or pager (not the copy, so
//      resting the mouse on the headline never freezes the slideshow). */
//   const hoverPauseProps = {
//     onPointerEnter: (event) => {
//       if (event.pointerType !== "touch") setHoverPaused(true);
//     },
//     onPointerLeave: (event) => {
//       if (event.pointerType !== "touch") setHoverPaused(false);
//     },
//   };

//   const handlePagerKeyDown = (event) => {
//     if (event.key === "ArrowRight") {
//       event.preventDefault();
//       goNext();
//     } else if (event.key === "ArrowLeft") {
//       event.preventDefault();
//       goPrev();
//     }
//   };

//   const handleFocus = (event) => {
//     let visible = true;
//     try {
//       visible = event.target.matches(":focus-visible");
//     } catch {
//       visible = true;
//     }
//     if (visible) setFocusPaused(true);
//   };

//   const handleBlur = (event) => {
//     if (!event.currentTarget.contains(event.relatedTarget)) {
//       setFocusPaused(false);
//     }
//   };

//   const handleTouchStart = (event) => {
//     const touch = event.touches[0];
//     swipeRef.current = { x: touch.clientX, y: touch.clientY };
//     setTouchPaused(true); // never change a slide under the user's thumb
//   };

//   const handleTouchEnd = (event) => {
//     setTouchPaused(false);
//     const start = swipeRef.current;
//     swipeRef.current = null;
//     if (!start || !isCarousel) return;

//     const touch = event.changedTouches[0];
//     const dx = touch.clientX - start.x;
//     const dy = touch.clientY - start.y;

//     if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
//       if (dx < 0) goNext();
//       else goPrev();
//     }
//   };

//   const handleTouchCancel = () => {
//     swipeRef.current = null;
//     setTouchPaused(false);
//   };

//   /* The chip row scrolls sideways itself, so it must not change slides. */
//   const stopSwipe = {
//     onTouchStart: (e) => e.stopPropagation(),
//     onTouchEnd: (e) => e.stopPropagation(),
//   };

//   /* ==========================================================
//      SEARCH
//   ========================================================== */
//   useEffect(() => {
//     const handleOutsideClick = (event) => {
//       if (
//         searchContainerRef.current &&
//         !searchContainerRef.current.contains(event.target)
//       ) {
//         setShowSuggestions(false);
//       }
//     };

//     document.addEventListener("mousedown", handleOutsideClick);
//     return () => document.removeEventListener("mousedown", handleOutsideClick);
//   }, []);

//   /* Picking a package from the dropdown opens it directly. */
//   const handlePackageSelect = (pkg) => {
//     if (!pkg) return;
//     setShowSuggestions(false);
//     setSearchError("");
//     navigate(getPackageUrl(pkg, pkg?.id));
//   };

//   const openCustomPackageRequest = () => {
//     setShowSuggestions(false);
//     setSearchError("");
//     setCustomMode("unavailable");
//     setCustomPackageModalOpen(true);
//   };

//   /* Uses the parent's handler when given, else opens the enquiry form. */
//   const handlePlanTrip = () => {
//     if (onPlanTrip) {
//       onPlanTrip();
//       return;
//     }
//     setShowSuggestions(false);
//     setSearchError("");
//     setCustomMode("plan");
//     setCustomPackageModalOpen(true);
//   };

//   const handleSearch = (event) => {
//     event.preventDefault();
//     const search = destination.trim();

//     if (!search) {
//       setSearchError("");
//       setShowSuggestions(false);
//       navigate("/packages");
//       return;
//     }

//     setSearching(true);
//     setSearchError("");
//     setShowSuggestions(false);

//     const normalizedSearch = normalizeDestination(search);

//     // Exact package title: open that package.
//     const packageMatch = publishedPackages.find(
//       (pkg) => normalizeDestination(getPackageTitle(pkg)) === normalizedSearch,
//     );

//     if (packageMatch) {
//       navigate(getPackageUrl(packageMatch, packageMatch.id));
//       setSearching(false);
//       return;
//     }

//     const match =
//       destinationOptions.find(
//         (item) => normalizeDestination(item.name) === normalizedSearch,
//       ) ||
//       destinationOptions.find((item) => {
//         const normalized = normalizeDestination(item.name);
//         return (
//           normalized.includes(normalizedSearch) ||
//           normalizedSearch.includes(normalized)
//         );
//       });

//     if (match) {
//       navigate(`/packages?destination=${encodeURIComponent(match.name)}`);
//     } else {
//       setSearchError(`We don't currently have a package for "${search}".`);
//     }

//     setSearching(false);
//   };

//   const handleInputChange = (event) => {
//     setDestination(event.target.value);
//     setSearchError("");
//     setShowSuggestions(true);
//   };

//   return (
//     <>
//       <ToastContainer
//         position="top-right"
//         autoClose={3500}
//         newestOnTop
//         closeOnClick
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="light"
//       />

//       {/*
//         Side padding on phones respects the device safe area (notches /
//         landscape) with a 1.25rem minimum; sm and up keep the original
//         padding.
//       */}
//       <section
//         ref={sectionRef}
//         className="relative isolate flex min-h-[640px] flex-col overflow-hidden bg-ink pb-10 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-12 sm:px-20 sm:py-16 lg:min-h-[740px] lg:px-24 lg:py-20"
//         aria-roledescription={isCarousel ? "carousel" : undefined}
//         aria-label={
//           isCarousel ? `${BRAND_NAME} featured holidays and offers` : undefined
//         }
//         onFocus={handleFocus}
//         onBlur={handleBlur}
//         onTouchStart={handleTouchStart}
//         onTouchEnd={handleTouchEnd}
//         onTouchCancel={handleTouchCancel}
//       >
//         {/* Slide images + each slide's own overlay (set in HeroManage) */}
//         <SlideBackgrounds
//           slides={slides}
//           currentId={currentId}
//           leavingId={leavingId}
//           reducedMotion={reducedMotion}
//         />

//         {/* Light bottom shade so the search area stays readable even when
//             a slide's overlay is set to "None". */}
//         <div
//           className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-[#1F0A15]/75 via-[#1F0A15]/25 to-transparent"
//           aria-hidden="true"
//         />

//         <div
//           className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_20%,rgba(200,19,94,0.14)_0%,transparent_60%)]"
//           aria-hidden="true"
//         />

//         {/* Side arrows (>= sm), kept inside max-w-6xl so they stay close to
//             the content on wide screens instead of hugging the window edge. */}
//         {isCarousel && (
//           <div className="pointer-events-none absolute inset-0 z-20 mx-auto hidden w-full max-w-6xl sm:block">
//             <button
//               type="button"
//               onClick={goPrev}
//               className={`${ICON_BUTTON} pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 lg:left-8`}
//               aria-label="Previous slide"
//               {...hoverPauseProps}
//             >
//               <ChevronLeft className="h-5 w-5" aria-hidden="true" />
//             </button>

//             <button
//               type="button"
//               onClick={goNext}
//               className={`${ICON_BUTTON} pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 lg:right-8`}
//               aria-label="Next slide"
//               {...hoverPauseProps}
//             >
//               <ChevronRight className="h-5 w-5" aria-hidden="true" />
//             </button>
//           </div>
//         )}

//         <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">
//           {/* ---------- Slide copy region: text is placed per slide ---------- */}
//           {copyLoading ? (
//             <div
//               className="flex min-h-[18rem] flex-1 flex-col items-start justify-center space-y-3 sm:min-h-[20rem] sm:items-center lg:min-h-[24rem]"
//               role="status"
//               aria-label={`Loading ${BRAND_NAME} hero content`}
//             >
//               <Skeleton className="mb-3 h-8 w-60 max-w-full rounded-full" />
//               <Skeleton className="h-10 w-[88%] max-w-3xl sm:h-12 md:h-14" />
//               <Skeleton className="h-10 w-[65%] max-w-2xl sm:h-12 md:h-14" />
//               <Skeleton className="mt-4 h-5 w-full max-w-xl" />
//               <Skeleton className="h-5 w-3/4 max-w-lg" />
//             </div>
//           ) : (
//             /*
//               All slides share one grid cell, so the region is as tall as the
//               tallest slide and never jumps while sliding. grid-cols-[minmax(0,1fr)]
//               pins the column to the container width, so a long word or a wide
//               button can never stretch the column past the screen edge.
//             */
//             <div
//               className="grid min-h-[18rem] flex-1 grid-cols-[minmax(0,1fr)] sm:min-h-[20rem] lg:min-h-[24rem]"
//               aria-live={isPaused ? "polite" : "off"}
//             >
//               {slides.map((slide, index) => (
//                 <SlideCopy
//                   key={slide.id}
//                   slide={slide}
//                   index={index}
//                   count={count}
//                   isActive={slide.id === currentId}
//                   reducedMotion={reducedMotion}
//                   packageById={packageById}
//                   packagesLoading={packagesLoading}
//                 />
//               ))}
//             </div>
//           )}

//           {/* ---------- Centred block: pager, search, chips, plan, highlights ---------- */}
//           <div className="mx-auto mt-6 w-full max-w-3xl sm:mt-8">
//             {/* Pager */}
//             {isCarousel && !copyLoading && (
//               <div className="min-w-0" {...hoverPauseProps}>
//                 <SlidePager
//                   slides={slides}
//                   current={current}
//                   barRefs={barRefs}
//                   onSelect={selectSlide}
//                   onKeyDown={handlePagerKeyDown}
//                   canAutoplay={canAutoplay}
//                   userPaused={userPaused}
//                   onTogglePause={() => setUserPaused((value) => !value)}
//                 />
//               </div>
//             )}

//             {/* Search (z-30 keeps the dropdown above the chips) */}
//             <div
//               ref={searchContainerRef}
//               className="relative z-30 mt-3 w-full text-left sm:mt-4"
//             >
//               <form
//                 onSubmit={handleSearch}
//                 className="relative flex w-full flex-col overflow-visible rounded-3xl bg-white/95 text-text-dark shadow-2xl ring-1 ring-champagne/50 backdrop-blur sm:flex-row sm:rounded-full"
//               >
//                 <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
//                   <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
//                     <MapPin className="h-5 w-5" aria-hidden="true" />
//                   </span>
//                   <div className="min-w-0 flex-1">
//                     <label
//                       htmlFor="destination-search"
//                       className="mb-0.5 block text-xs font-medium text-muted"
//                     >
//                       Your next escape
//                     </label>
//                     <input
//                       id="destination-search"
//                       type="text"
//                       value={destination}
//                       onChange={handleInputChange}
//                       onFocus={() => setShowSuggestions(true)}
//                       placeholder="Search a destination or package"
//                       autoComplete="off"
//                       enterKeyHint="search"
//                       className="w-full min-w-0 bg-transparent text-base font-medium text-text-dark outline-none placeholder:text-placeholder"
//                     />
//                   </div>
//                 </div>

//                 <div className="p-2 pt-0 sm:p-2 sm:pl-0">
//                   <button
//                     type="submit"
//                     disabled={searching}
//                     className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-brand transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-8"
//                   >
//                     {searching ? (
//                       <Loader2
//                         className="h-4 w-4 animate-spin"
//                         aria-hidden="true"
//                       />
//                     ) : (
//                       <Search className="h-4 w-4" aria-hidden="true" />
//                     )}
//                     {searching ? "Searching..." : "Explore Packages"}
//                   </button>
//                 </div>

//                 {/* Package suggestions: click to open that package */}
//                 {showSuggestions &&
//                   !packagesLoading &&
//                   filteredPackageOptions.length > 0 && (
//                     <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-travel-hover">
//                       <div className="border-b border-border px-4 py-3">
//                         <p className="text-xs font-semibold text-muted">
//                           Explore Journeys
//                         </p>
//                       </div>

//                       <div className="max-h-64 overflow-y-auto p-2">
//                         {filteredPackageOptions.map((pkg) => (
//                           <button
//                             key={pkg.id}
//                             type="button"
//                             onClick={() => handlePackageSelect(pkg)}
//                             className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
//                           >
//                             <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
//                               <MapPin className="h-4 w-4" aria-hidden="true" />
//                             </span>

//                             <span className="min-w-0 flex-1">
//                               <span className="block truncate text-sm font-semibold text-text-dark group-hover:text-primary">
//                                 {getPackageTitle(pkg) || "Package"}
//                               </span>
//                               <span className="mt-0.5 block truncate text-xs text-muted">
//                                 {[
//                                   pkg?.destination,
//                                   pkg?.duration_days
//                                     ? `${pkg.duration_days} ${
//                                         Number(pkg.duration_days) === 1
//                                           ? "day"
//                                           : "days"
//                                       }`
//                                     : "",
//                                 ]
//                                   .filter(Boolean)
//                                   .join(" · ")}
//                               </span>
//                             </span>

//                             <ChevronRight
//                               className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-primary"
//                               aria-hidden="true"
//                             />
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                 {showSuggestions &&
//                   !packagesLoading &&
//                   destination.trim() &&
//                   filteredPackageOptions.length === 0 && (
//                     <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-card p-4 shadow-travel-hover">
//                       <div className="flex gap-3">
//                         <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-primary">
//                           <MapPin className="h-4 w-4" aria-hidden="true" />
//                         </span>

//                         <div className="min-w-0">
//                           <p className="break-words text-sm font-semibold text-text-dark">
//                             No package found for "{destination}"
//                           </p>
//                           <p className="mt-1 text-xs leading-relaxed text-muted">
//                             You can still request a customized package for this
//                             destination.
//                           </p>
//                           <button
//                             type="button"
//                             onClick={openCustomPackageRequest}
//                             className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
//                           >
//                             <MessageCircle
//                               className="h-3.5 w-3.5 shrink-0"
//                               aria-hidden="true"
//                             />
//                             Request custom package
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//               </form>

//               {searchError && (
//                 <div
//                   className="mt-3 rounded-2xl border border-white/15 bg-ink/70 px-4 py-3 text-white backdrop-blur-md"
//                   role="alert"
//                 >
//                   <div className="flex items-start gap-3">
//                     <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
//                       <MapPin className="h-4 w-4" aria-hidden="true" />
//                     </div>

//                     <div className="min-w-0 flex-1">
//                       <p className="font-semibold">Destination unavailable</p>
//                       <p className="mt-1 break-words text-xs leading-relaxed text-white/80">
//                         We don't currently have a package for{" "}
//                         <span className="font-semibold text-white">
//                           "{destination.trim()}"
//                         </span>
//                         . We can create a customized package for you.
//                       </p>
//                       <button
//                         type="button"
//                         onClick={openCustomPackageRequest}
//                         className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
//                       >
//                         <MessageCircle
//                           className="h-3.5 w-3.5 shrink-0"
//                           aria-hidden="true"
//                         />
//                         Request a custom package
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Browse by trip type (solid chips, swipeable on phones) */}
//             {/* <div
//               className={`-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 ${NO_SCROLLBAR}`}
//               aria-label="Browse by trip type"
//               {...stopSwipe}
//             >
//               {Object.entries(PACKAGE_TYPE_CONFIG).map(([type, config]) => {
//                 const Icon = config.icon;
//                 return (
//                   <Link
//                     key={type}
//                     to={`/packages?type=${encodeURIComponent(type)}`}
//                     className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-champagne/50 bg-white/90 px-4 text-[13px] font-medium tracking-wide text-text-dark transition-colors hover:border-champagne hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
//                   >
//                     <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
//                     {config.short}
//                   </Link>
//                 );
//               })}
//             </div> */}

//             {/* Plan button */}
//             <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-center">
//               <button
//                 type="button"
//                 onClick={handlePlanTrip}
//                 className="group inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-8 text-sm font-semibold tracking-wide text-rose-dark shadow-brand transition-all duration-300 hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto sm:min-w-[18rem]"
//               >
//                 <Plane
//                   className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
//                   aria-hidden="true"
//                 />
//                 Tell us your plan
//                 <ArrowRight
//                   className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
//                   aria-hidden="true"
//                 />
//               </button>
//               <p className="text-xs text-white/80 sm:text-center">
//                 A journey designed around you
//               </p>
//             </div>

//             {/* Why book with us */}
//             <ul className="mt-8 grid grid-cols-3 border-t border-champagne/25 pt-6 [@media(max-height:700px)]:hidden">
//               {HIGHLIGHTS.map(({ icon: Icon, label }, index) => (
//                 <li
//                   key={label}
//                   className={`flex min-w-0 flex-col items-start gap-2 px-2 first:pl-0 sm:flex-row sm:items-center sm:justify-center sm:gap-2.5 ${
//                     index > 0 ? "sm:border-l sm:border-champagne/25" : ""
//                   }`}
//                 >
//                   <Icon
//                     className="h-5 w-5 shrink-0 text-champagne"
//                     aria-hidden="true"
//                   />
//                   <span className="break-words text-[11px] font-medium uppercase leading-snug tracking-[0.14em] text-white/90 sm:text-xs">
//                     {label}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       </section>

//       <CustomPackageModal
//         open={customPackageModalOpen}
//         destination={destination}
//         mode={customMode}
//         onClose={() => setCustomPackageModalOpen(false)}
//       />
//     </>
//   );
// }

