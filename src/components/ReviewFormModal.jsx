import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  MessageSquareHeart,
  Send,
  Star,
  X,
} from "lucide-react";
import { createTestimonial } from "../api/content";
import ImageUploadField from "./admin/ImageUploadField";
import PackagePicker, { SelectedPackage } from "./PackagePicker";
import {
  getPackageDestination,
  getPackageRegion,
  normalizePackageType,
} from "../utils/packages";

// ============================================================
// CONSTANTS
// ============================================================

const EMPTY_FORM = {
  customer_name: "",
  customer_city: "",
  rating: 5,
  review: "",
};

const NAME_PATTERN = /^[A-Za-zÀ-ÿ.' -]+$/;
const CITY_PATTERN = /^[A-Za-zÀ-ÿ.' -]+$/;

const FIELD_ORDER = ["customer_name", "customer_city", "package", "rating", "review"];

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const EXIT_MS = 300;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not(.sr-only),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// ============================================================
// THEME: rose / petal (same as EnquiryForm)
// ============================================================

const INPUT_BASE =
  "block w-full min-w-0 rounded-xl border bg-input px-4 text-base text-text-dark outline-none transition-all duration-200 placeholder:text-placeholder disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

const inputClass = (hasError, extra = "h-12") =>
  `${INPUT_BASE} ${extra} ${
    hasError
      ? "border-error bg-error-bg/30 focus:border-error focus:ring-4 focus:ring-error/10"
      : "border-border hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/10"
  }`;

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2";

const LABEL =
  "mb-1.5 flex items-baseline gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600";

const PRIMARY_BUTTON =
  "bg-accent text-white shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-orange active:translate-y-0 active:scale-[0.99]";

const OUTLINE_BUTTON =
  "border border-border bg-card text-text-dark transition-colors hover:border-border-strong hover:bg-surface-soft";

// ============================================================
// SMALL COMPONENTS (defined outside so inputs keep focus)
// ============================================================

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        <span className="text-accent" aria-hidden="true">
          *
        </span>
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-error-text sm:text-sm"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ============================================================
// COMPONENT
//
// Props
//   open        boolean
//   onClose     () => void
//   onSubmitted () => void
//   pkg         (optional) the package being viewed. When given, the
//               form is auto-filled with it. When omitted, the visitor
//               picks Domestic / International and searches for the package.
// ============================================================

export default function ReviewFormModal({ open, onClose, onSubmitted, pkg = null }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [hoverRating, setHoverRating] = useState(0);
  const [image, setImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  /* ---- package selection ---- */
  const [unlocked, setUnlocked] = useState(false); // visitor chose "Different package"
  const [selectedPkg, setSelectedPkg] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  /* Package that came from the page = locked and auto-filled. */
  const lockedPkg = pkg && !unlocked ? pkg : null;
  const activePkg = lockedPkg || selectedPkg;

  const closeModal = () => {
    if (submitting) return;
    onClose?.();
  };

  const closeRef = useRef(closeModal);
  closeRef.current = closeModal;

  /* Lets the window Esc listener know the package dropdown should eat Esc first. */
  const listOpenRef = useRef(false);

  // ==========================================================
  // ENTER / EXIT TRANSITION (two-phase mount)
  // ==========================================================

  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setShown(false);
    const timer = setTimeout(() => {
      setMounted(false);
      setSuccess(false);
      setSubmitError("");
      setErrors({});
      setUnlocked(false);
      setSelectedPkg(null);
    }, EXIT_MS);

    return () => clearTimeout(timer);
  }, [open]);

  // ==========================================================
  // FIELD VALIDATION
  // ==========================================================

  const validateField = (name, value) => {
    const cleanValue = typeof value === "string" ? value.trim() : value;

    switch (name) {
      case "customer_name":
        if (!cleanValue) return "Please enter your name.";
        if (cleanValue.length < 2) return "Name must contain at least 2 characters.";
        if (cleanValue.length > 100) return "Name cannot exceed 100 characters.";
        if (!NAME_PATTERN.test(cleanValue)) return "Please enter a valid name.";
        return "";

      case "customer_city":
        if (!cleanValue) return "Please enter your city.";
        if (cleanValue.length < 2) return "City must contain at least 2 characters.";
        if (cleanValue.length > 100) return "City cannot exceed 100 characters.";
        if (!CITY_PATTERN.test(cleanValue)) return "Please enter a valid city.";
        return "";

      case "package":
        return activePkg ? "" : "Please choose the package you travelled on.";

      case "rating":
        if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 5) {
          return "Please select a rating between 1 and 5 stars.";
        }
        return "";

      case "review":
        if (!cleanValue) return "Please write your review.";
        if (cleanValue.length < 10) return "Review must contain at least 10 characters.";
        if (cleanValue.length > 3000) return "Review cannot exceed 3000 characters.";
        return "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    FIELD_ORDER.forEach((fieldName) => {
      const error = validateField(fieldName, form[fieldName]);
      if (error) nextErrors[fieldName] = error;
    });

    return nextErrors;
  };

  // ==========================================================
  // BODY SCROLL LOCK + ESC + FOCUS MANAGEMENT
  // ==========================================================

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event) => {
      if (event.key !== "Escape") return;
      // First Esc only closes an open package dropdown.
      if (listOpenRef.current) return;
      closeRef.current();
    };
    window.addEventListener("keydown", onKey);

    const timer = setTimeout(() => {
      // Phones: do not pop the keyboard open over the form.
      const wide = window.matchMedia?.("(min-width: 640px)").matches;
      (wide ? firstFieldRef.current : panelRef.current)?.focus({
        preventScroll: true,
      });
    }, 80);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  // ==========================================================
  // KEYBOARD: focus trap
  // ==========================================================

  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;

    const focusable = panelRef.current?.querySelectorAll(FOCUSABLE);
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: validateField(name, value) }));
    setSubmitError("");
  };

  const handleRating = (rating) => {
    setForm((previous) => ({ ...previous, rating }));
    setErrors((previous) => ({ ...previous, rating: validateField("rating", rating) }));
    setSubmitError("");
  };

  const handlePackageChange = (item) => {
    setSelectedPkg(item);
    if (item) setErrors((previous) => ({ ...previous, package: "" }));
    setSubmitError("");
  };

  /* From an auto-filled package: let the visitor review a different one. */
  const unlockPackage = () => {
    setUnlocked(true);
    setSelectedPkg(null);
  };

  const handleBackdrop = () => {
    // Never throw away a typed review because of a stray tap.
    const isDirty =
      !success &&
      Boolean(form.customer_name.trim() || form.customer_city.trim() || form.review.trim());

    if (isDirty) return;
    closeModal();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitError("");

    if (imageUploading) {
      setSubmitError("Please wait for your photo to finish uploading.");
      return;
    }

    const validationErrors = validateForm();
    setErrors(validationErrors);

    const firstInvalid = FIELD_ORDER.find((field) => validationErrors[field]);

    if (firstInvalid) {
      setSubmitError("Please fix the highlighted fields.");

      requestAnimationFrame(() => {
        const id = firstInvalid === "package" ? "modal_package_search" : `modal_${firstInvalid}`;
        document.getElementById(id)?.focus();
      });
      return;
    }

    setSubmitting(true);

    try {
      const type = normalizePackageType(activePkg.package_type || activePkg.type);

      await createTestimonial({
        customer_name: form.customer_name.trim(),
        customer_city: form.customer_city.trim(),
        // "destination" is kept so the existing testimonials API keeps working
        destination: getPackageDestination(activePkg) || activePkg.title,
        package_id: activePkg.id ?? null,
        package_slug: activePkg.slug ?? null,
        package_title: activePkg.title,
        package_type: type || null,
        region: getPackageRegion(activePkg),
        rating: Number(form.rating),
        review: form.review.trim(),
        image: image || null,
      });

      setSuccess(true);
      setForm(EMPTY_FORM);
      setErrors({});
      setImage(null);

      // An auto-filled package stays. A picked one starts fresh for "Write another".
      if (!lockedPkg) setSelectedPkg(null);

      onSubmitted?.();
    } catch (err) {
      console.error("Failed to submit testimonial:", err);

      const detail = err?.response?.data?.detail;

      setSubmitError(
        typeof detail === "string"
          ? detail
          : "Unable to submit your review. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const submitDisabled = submitting || imageUploading;

  const describedBy = (field) => (errors[field] ? `modal_${field}-error` : undefined);

  const activeRating = hoverRating || form.rating;

  const closeButton = (
    <button
      type="button"
      onClick={closeModal}
      disabled={submitting}
      aria-label="Close review form"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted hover:text-text-dark disabled:cursor-not-allowed disabled:opacity-50 ${OUTLINE_BUTTON} ${FOCUS_RING}`}
    >
      <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop (ink + rose glow, same as EnquiryForm) */}
      <div
        onMouseDown={handleBackdrop}
        aria-hidden="true"
        className={`absolute inset-0 bg-ink/60 bg-[radial-gradient(ellipse_at_30%_0%,rgba(232,40,111,0.32),transparent_55%)] backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Layout wrapper: clicks pass through to the backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
        {/* Panel: bottom sheet on mobile, centered modal on sm+ */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={`pointer-events-auto relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] bg-petal-gradient font-body antialiased shadow-brand outline-none
            transition-[transform,opacity] duration-300 ease-soft motion-reduce:transition-none
            sm:max-h-[90dvh] sm:rounded-3xl
            ${
              shown
                ? "translate-y-0 opacity-100 sm:scale-100"
                : "translate-y-full opacity-100 sm:translate-y-3 sm:scale-[0.98] sm:opacity-0"
            }`}
        >
          {/* Brand accent line */}
          <div className="relative z-10 h-1 shrink-0 bg-orange-gradient" aria-hidden="true" />

          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(242,88,143,0.26),transparent_70%)]" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(200,19,94,0.12),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(200,19,94,0.10)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent_45%)]" />
          </div>

          {success ? (
            /* ==================== SUCCESS ==================== */
            <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-8">
              <div className="flex justify-end">{closeButton}</div>

              <div
                className="mx-auto flex w-full max-w-md flex-1 flex-col items-center py-4 text-center"
                role="status"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success ring-8 ring-success-bg/50">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </span>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                  Review received
                </p>

                <h2
                  id="review-modal-title"
                  className="mt-1.5 font-display text-4xl font-semibold leading-none text-text-display"
                >
                  Thank you!
                </h2>

                <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                  Thank you for sharing your travel experience. Our team will
                  review it before it appears on the website.
                </p>

                <div className="mt-6 w-full rounded-2xl border border-primary/15 bg-white/80 p-4 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Review status
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-text-dark">
                    Pending approval
                  </p>
                </div>

                <div className="mt-6 flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                      setSubmitError("");
                      setErrors({});
                    }}
                    className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-semibold uppercase tracking-[0.16em] ${OUTLINE_BUTTON} ${FOCUS_RING}`}
                  >
                    <MessageSquareHeart className="h-[18px] w-[18px]" aria-hidden="true" />
                    Write another
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className={`inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-[13px] font-semibold uppercase tracking-[0.16em] ${PRIMARY_BUTTON} ${FOCUS_RING}`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ==================== HEADER ==================== */}
              <div className="relative shrink-0 border-b border-primary/10 bg-white/70 backdrop-blur-md">
                <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
                  <span className="h-1 w-10 rounded-full bg-border" />
                </div>

                <div className="flex items-start gap-3 px-4 pb-4 pt-3 sm:px-6 sm:py-5">
                  <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-lighter text-primary sm:flex">
                    <MessageSquareHeart className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                      Manyara Privé Vacations
                    </p>
                    <h2
                      id="review-modal-title"
                      className="mt-1 font-display text-[28px] font-semibold leading-[1.05] text-text-display sm:text-[32px]"
                    >
                      Share your experience
                    </h2>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                      {lockedPkg
                        ? "Tell future travellers about this trip."
                        : "Pick your trip, then tell future travellers about it."}
                    </p>
                  </div>

                  {closeButton}
                </div>
              </div>

              {/* ==================== FORM ==================== */}
              <form
                onSubmit={handleSubmit}
                noValidate
                className="relative flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                  <div className="space-y-5">
                    {/* Name + city */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field id="modal_customer_name" label="Your name" error={errors.customer_name}>
                        <input
                          ref={firstFieldRef}
                          id="modal_customer_name"
                          name="customer_name"
                          type="text"
                          value={form.customer_name}
                          onChange={handleChange}
                          maxLength={100}
                          placeholder="Your name"
                          autoComplete="name"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          disabled={submitting}
                          aria-invalid={errors.customer_name ? "true" : undefined}
                          aria-describedby={describedBy("customer_name")}
                          className={inputClass(Boolean(errors.customer_name))}
                        />
                      </Field>

                      <Field id="modal_customer_city" label="Your city" error={errors.customer_city}>
                        <input
                          id="modal_customer_city"
                          name="customer_city"
                          type="text"
                          value={form.customer_city}
                          onChange={handleChange}
                          maxLength={100}
                          placeholder="e.g. Hyderabad"
                          autoComplete="address-level2"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          disabled={submitting}
                          aria-invalid={errors.customer_city ? "true" : undefined}
                          aria-describedby={describedBy("customer_city")}
                          className={inputClass(Boolean(errors.customer_city))}
                        />
                      </Field>
                    </div>

                    {/* ============ PACKAGE ============ */}
                    {lockedPkg ? (
                      /* Opened from a package page: auto-filled */
                      <div>
                        <p className={LABEL}>Package reviewed</p>
                        <SelectedPackage
                          pkg={lockedPkg}
                          onChange={unlockPackage}
                          changeLabel="Different package"
                        />
                      </div>
                    ) : (
                      /* General form: Domestic / International + search */
                      <PackagePicker
                        idPrefix="modal"
                        value={selectedPkg}
                        onChange={handlePackageChange}
                        error={errors.package}
                        onErrorClear={() => setErrors((previous) => ({ ...previous, package: "" }))}
                        disabled={submitting}
                        autoFocus={unlocked}
                        onListOpenChange={(isOpen) => {
                          listOpenRef.current = isOpen;
                        }}
                      />
                    )}

                    {/* Rating */}
                    <div>
                      <p className={LABEL}>
                        Your rating
                        <span className="text-accent" aria-hidden="true">
                          *
                        </span>
                      </p>

                      <div className="flex items-center gap-3">
                        <div
                          className="-ml-1.5 flex gap-0.5"
                          role="radiogroup"
                          aria-label="Choose your rating"
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleRating(rating)}
                              onMouseEnter={() => setHoverRating(rating)}
                              disabled={submitting}
                              aria-label={`Give ${rating} star${rating > 1 ? "s" : ""}`}
                              aria-pressed={form.rating === rating}
                              className="rounded-xl p-1.5 transition-all duration-150 hover:scale-110 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed"
                            >
                              <Star
                                className={`h-8 w-8 transition-colors duration-150 ${
                                  rating <= activeRating ? "text-accent-bright" : "text-border"
                                }`}
                                fill={rating <= activeRating ? "currentColor" : "none"}
                                strokeWidth={1.5}
                                aria-hidden="true"
                              />
                            </button>
                          ))}
                        </div>

                        <span
                          className="font-display text-lg font-semibold italic text-primary"
                          aria-live="polite"
                        >
                          {RATING_LABELS[activeRating]}
                        </span>
                      </div>

                      {errors.rating && (
                        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-error-text sm:text-sm">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
                          {errors.rating}
                        </p>
                      )}
                    </div>

                    {/* Review */}
                    <Field id="modal_review" label="Your review" error={errors.review}>
                      <textarea
                        id="modal_review"
                        name="review"
                        value={form.review}
                        onChange={handleChange}
                        maxLength={3000}
                        rows={5}
                        placeholder="Tell us about your travel experience..."
                        disabled={submitting}
                        aria-invalid={errors.review ? "true" : undefined}
                        aria-describedby={describedBy("review")}
                        className={inputClass(Boolean(errors.review), "min-h-[120px] resize-y py-3")}
                      />

                      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted">
                        <span>Minimum 10 characters</span>
                        <span>{form.review.length}/3000</span>
                      </div>
                    </Field>

                    {/* Image */}
                    <div className="rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-travel-card backdrop-blur">
                      <ImageUploadField
                        value={image}
                        onChange={setImage}
                        onBusyChange={setImageUploading}
                        uploadEndpoint="/uploads/review-image"
                        disabled={submitting}
                        label="Your photo (optional)"
                        allowCrop={false}
                      />

                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        Add a photo from your trip if you like. It is completely optional.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ==================== STICKY FOOTER ==================== */}
                <div className="shrink-0 border-t border-primary/10 bg-white/90 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-6 sm:pb-5 sm:pt-4">
                  {submitError && (
                    <div
                      className="mb-3 flex items-start gap-2 rounded-xl border border-error/20 bg-error-bg px-3 py-2.5 text-sm leading-relaxed text-error-text"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitDisabled}
                    aria-busy={submitting}
                    className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-[13px] font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100 ${PRIMARY_BUTTON} ${FOCUS_RING}`}
                  >
                    <Send className="h-[17px] w-[17px]" aria-hidden="true" />
                    {submitting
                      ? "Submitting..."
                      : imageUploading
                        ? "Uploading photo..."
                        : "Submit review"}
                  </button>

                  <p className="mt-2.5 text-center text-xs leading-relaxed text-muted">
                    Your review is published after our team has checked it.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

