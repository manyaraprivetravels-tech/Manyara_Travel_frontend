

import { useState } from "react";
import { CheckCircle2, MessageSquareHeart, Send, Star } from "lucide-react";
import { createTestimonial } from "../api/content";
import ImageUploadField from "./admin/ImageUploadField";
import PackagePicker from "./PackagePicker";
import {
  getPackageDestination,
  getPackageRegion,
  normalizePackageType,
} from "../utils/packages";

const BRAND_NAME = "Manyara Prive Vacations";

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const INITIAL_FORM = { customer_name: "", customer_city: "", rating: 5, review: "" };

const INTRO_POINTS = [
  { Icon: MessageSquareHeart, title: "Share your experience", text: "Tell us what made your trip memorable." },
  { Icon: Star, title: "Rate your experience", text: "Give your honest rating from 1 to 5 stars." },
  { Icon: CheckCircle2, title: "Pending approval", text: "Reviews are checked before appearing publicly." },
];

const INPUT =
  "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-text-dark outline-none transition placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-surface";

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-dark">
        {label}
      </label>
      {children}
    </div>
  );
}

function RatingInput({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          className="rounded-lg p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed"
        >
          <Star
            className={`h-7 w-7 ${star <= value ? "text-accent-bright" : "text-ink-300"}`}
            fill={star <= value ? "currentColor" : "none"}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

function SuccessCard({ onReset }) {
  return (
    <div role="status" className="rounded-3xl border border-success/30 bg-success-bg p-6 text-center sm:p-8 lg:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-card">
        <CheckCircle2 className="h-9 w-9 text-success" aria-hidden="true" />
      </div>

      <h2 className="mt-6 font-display text-3xl font-semibold text-text-dark">Thank You!</h2>

      <p className="mt-3 text-base font-medium text-text">Thank you for your valuable response!</p>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
        Your review has been submitted successfully. Our team will review your response before
        publishing it on our website.
      </p>

      <div className="mx-auto mt-5 max-w-sm rounded-xl border border-divider bg-card px-4 py-3">
        <p className="text-xs text-muted">Review status</p>
        <p className="mt-1 text-sm font-semibold text-text-dark">Pending approval</p>
      </div>

      <button type="button" onClick={onReset} className={`${BUTTON} mt-6 px-7`}>
        <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
        Write Another Review
      </button>
    </div>
  );
}

export default function ReviewSubmitForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [pkg, setPkg] = useState(null);
  const [image, setImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [packageError, setPackageError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  };

  const handleChange = (event) => update(event.target.name, event.target.value);

  function validate() {
    if (cleanText(form.customer_name).length < 2) return "Please enter your name.";
    if (cleanText(form.customer_city).length < 2) return "Please enter your city.";
    if (!pkg) {
      setPackageError("Please choose the package you travelled on.");
      return "Please choose the package you travelled on.";
    }
    if (cleanText(form.review).length < 10) return "Please write at least 10 characters for your review.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    if (imageUploading) {
      setError("Please wait for your photo to finish uploading.");
      return;
    }

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createTestimonial({
        customer_name: cleanText(form.customer_name),
        customer_city: cleanText(form.customer_city),
        destination: getPackageDestination(pkg) || pkg.title,
        package_id: pkg.id ?? null,
        package_slug: pkg.slug ?? null,
        package_title: pkg.title,
        package_type: normalizePackageType(pkg.package_type || pkg.type) || null,
        region: getPackageRegion(pkg),
        rating: Number(form.rating),
        review: cleanText(form.review),
        image: image || null,
      });

      setForm(INITIAL_FORM);
      setPkg(null);
      setImage(null);
      setSuccess(true);
    } catch (err) {
      console.error("Failed to submit testimonial:", err);
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Unable to submit your review. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return <SuccessCard onReset={() => setSuccess(false)} />;

  return (
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-start lg:gap-12">
      {/* Intro */}
      <div className="min-w-0 lg:sticky lg:top-[calc(var(--top-info-height,0px)+6rem)]">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 shrink-0 bg-champagne" aria-hidden="true" />
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
            Share your experience
          </p>
        </div>

        <h2 className="mt-3 font-display text-[2.4rem] font-medium leading-[1.05] tracking-[-0.01em] text-text-display sm:text-[2.8rem]">
          Your Valuable <em className="font-medium italic text-primary">Review</em>
        </h2>

        <p className="mt-4 max-w-lg text-sm leading-7 text-text-secondary sm:text-base">
          Tell future travellers about your experience with {BRAND_NAME}.
        </p>

        <ul className="mt-6 space-y-5">
          {INTRO_POINTS.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-champagne/70 bg-white text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-dark">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="min-w-0 space-y-5 rounded-3xl border border-champagne/60 bg-card p-5 shadow-travel-card sm:p-7 lg:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="customer_name" label="Your Name">
            <input
              id="customer_name"
              name="customer_name"
              type="text"
              value={form.customer_name}
              onChange={handleChange}
              maxLength={100}
              placeholder="Enter your name"
              autoComplete="name"
              disabled={submitting}
              className={INPUT}
            />
          </Field>

          <Field id="customer_city" label="Your City">
            <input
              id="customer_city"
              name="customer_city"
              type="text"
              value={form.customer_city}
              onChange={handleChange}
              maxLength={100}
              placeholder="e.g. Hyderabad"
              autoComplete="address-level2"
              disabled={submitting}
              className={INPUT}
            />
          </Field>
        </div>

        <PackagePicker
          idPrefix="page"
          value={pkg}
          onChange={setPkg}
          error={packageError}
          onErrorClear={() => {
            setPackageError("");
            setError("");
          }}
          disabled={submitting}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-text-dark">Your Rating</p>
          <RatingInput value={Number(form.rating)} onChange={(v) => update("rating", v)} disabled={submitting} />
          <p className="mt-1 text-xs text-muted">{form.rating} out of 5 stars</p>
        </div>

        <Field id="review" label="Your Review">
          <textarea
            id="review"
            name="review"
            value={form.review}
            onChange={handleChange}
            maxLength={3000}
            rows={6}
            placeholder="Tell us about your travel experience..."
            disabled={submitting}
            className={`${INPUT} resize-y leading-6`}
          />
          <div className="mt-1 flex items-center justify-between text-xs text-muted">
            <span>Minimum 10 characters</span>
            <span>{form.review.length}/3000</span>
          </div>
        </Field>

        <div className="rounded-2xl border border-champagne/60 bg-surface p-4 sm:p-5">
          <ImageUploadField
            value={image}
            onChange={setImage}
            onBusyChange={setImageUploading}
            uploadEndpoint="/uploads/review-image"
            disabled={submitting}
            label="Your Photo (Optional)"
            allowCrop={false}
          />
          <p className="mt-2 text-xs text-muted">
            You can share a photo from your trip, but this is completely optional.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-error/30 bg-error-bg px-4 py-3 text-sm text-error-text">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting || imageUploading} className={`${BUTTON} w-full`}>
          {submitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              Submitting...
            </>
          ) : imageUploading ? (
            "Uploading photo..."
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit Your Review
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted">
          Your review will be published after our team reviews it.
        </p>
      </form>
    </div>
  );
}