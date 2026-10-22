

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Check,
  Eye,
  FileText,
  Loader2,
  Save,
  X,
} from "lucide-react";
import api from "../../api/axios";

/* ============================================================
   EMPTY FORM
   ============================================================ */

const EMPTY_FORM = {
  company_name: "",
  hero_title: "",
  hero_description: "",
  story_title: "",
  story_content: "",
  mission: "",
  vision: "",
  founded_year: "",
  years_experience: "",
  status: true,
};

/* ============================================================
   HELPERS
   ============================================================ */

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Validation error")
      .join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const normalizeAbout = (data) => ({
  company_name: data?.company_name ?? "",
  hero_title: data?.hero_title ?? "",
  hero_description: data?.hero_description ?? "",
  story_title: data?.story_title ?? "",
  story_content: data?.story_content ?? "",
  mission: data?.mission ?? "",
  vision: data?.vision ?? "",
  founded_year: data?.founded_year ?? "",
  years_experience: data?.years_experience ?? "",
  status: data?.status ?? true,
});

/* ============================================================
   REUSABLE FORM FIELD
   ============================================================ */

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-navy">
      {children}
      {required && <span className="ml-1 text-accent">*</span>}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  min,
  max,
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/10"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  required = false,
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/10"
      />
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function AboutManagement() {
  const [form, setForm] = useState(EMPTY_FORM);

  const [aboutId, setAboutId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ==========================================================
     LOAD ABOUT PAGE
     ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadAbout = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Admin endpoint.
         *
         * Expected backend route:
         * GET /about/admin
         */
        const response = await api.get("/about/admin");

        if (!mounted) return;

        const data = response?.data;

        if (data) {
          setAboutId(data.id ?? null);
          setForm(normalizeAbout(data));
        }
      } catch (err) {
        if (!mounted) return;

        /*
         * If the backend returns 404 because an About record
         * does not exist yet, keep the empty form so the admin
         * can create the first record.
         */
        if (err?.response?.status === 404) {
          setAboutId(null);
          setForm(EMPTY_FORM);
          setError("");
        } else {
          setError(getErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAbout();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     FIELD CHANGE
     ========================================================== */

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  /* ==========================================================
     VALIDATION
     ========================================================== */

  const validateForm = () => {
    if (!form.company_name.trim()) {
      return "Company name is required.";
    }

    if (!form.hero_title.trim()) {
      return "Hero title is required.";
    }

    if (
      form.founded_year !== "" &&
      (Number.isNaN(Number(form.founded_year)) ||
        Number(form.founded_year) < 1900 ||
        Number(form.founded_year) > new Date().getFullYear())
    ) {
      return "Please enter a valid founded year.";
    }

    if (
      form.years_experience !== "" &&
      (Number.isNaN(Number(form.years_experience)) ||
        Number(form.years_experience) < 0)
    ) {
      return "Years of experience cannot be negative.";
    }

    return "";
  };

  /* ==========================================================
     SAVE
     ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const payload = {
      company_name: form.company_name.trim(),
      hero_title: form.hero_title.trim(),
      hero_description: form.hero_description.trim() || null,
      story_title: form.story_title.trim() || null,
      story_content: form.story_content.trim() || null,
      mission: form.mission.trim() || null,
      vision: form.vision.trim() || null,

      founded_year:
        form.founded_year === ""
          ? null
          : Number(form.founded_year),

      years_experience:
        form.years_experience === ""
          ? null
          : Number(form.years_experience),

      status: Boolean(form.status),
    };

    try {
      setSaving(true);

      let response;

      if (aboutId) {
        /*
         * Update existing About page.
         *
         * Expected backend route:
         * PUT /about/admin
         */
        response = await api.put("/about/admin", payload);
      } else {
        /*
         * Create About page.
         *
         * Expected backend route:
         * POST /about/admin
         */
        response = await api.post("/about/admin", payload);
      }

      const savedData = response?.data;

      if (savedData) {
        setAboutId(savedData.id ?? aboutId);
        setForm(normalizeAbout(savedData));
      } else {
        setForm((previous) => ({
          ...previous,
          ...payload,
        }));
      }

      setSuccess(
        aboutId
          ? "About page updated successfully."
          : "About page created successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(getErrorMessage(err));

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     RESET
     ========================================================== */

  const handleReset = () => {
    setError("");
    setSuccess("");

    if (aboutId) {
      /*
       * Reload the current database record instead of
       * resetting an existing record to an empty form.
       */
      const reload = async () => {
        try {
          setLoading(true);

          const response = await api.get("/about/admin");

          setAboutId(response?.data?.id ?? aboutId);
          setForm(normalizeAbout(response?.data));
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setLoading(false);
        }
      };

      reload();
    } else {
      setForm(EMPTY_FORM);
    }
  };

  /* ==========================================================
     LOADING STATE
     ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          Loading About page...
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* ======================================================
          PAGE HEADER
         ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <FileText className="h-4 w-4 shrink-0" />
            About CMS
          </div>

          <h1 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
            About Page
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage the main About page content displayed on the
            public website.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/about"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/20 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Preview Page
          </Link>
        </div>
      </div>

      {/* ======================================================
          SUCCESS MESSAGE
         ====================================================== */}

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">Success</p>
            <p className="mt-0.5 break-words">{success}</p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="shrink-0 rounded-lg p-1 text-emerald-700 transition hover:bg-emerald-100"
            aria-label="Dismiss success message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ======================================================
          ERROR MESSAGE
         ====================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">Unable to save</p>
            <p className="mt-0.5 break-words">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded-lg p-1 text-red-700 transition hover:bg-red-100"
            aria-label="Dismiss error message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ======================================================
          FORM
         ====================================================== */}

      <form onSubmit={handleSubmit}>
        <div className="space-y-5 sm:space-y-6">
          {/* ==================================================
              BASIC INFORMATION
             ================================================== */}

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 border-b border-border pb-4">
              <h2 className="text-base font-semibold text-navy sm:text-lg">
                Basic Information
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Core company information used across the About page.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextInput
                label="Company Name"
                value={form.company_name}
                onChange={(value) =>
                  updateField("company_name", value)
                }
                placeholder="On a Trip Holiday"
                required
              />

              <div>
                <FieldLabel>Status</FieldLabel>

                <button
                  type="button"
                  onClick={() =>
                    updateField("status", !form.status)
                  }
                  className={`flex min-h-[46px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    form.status
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        form.status
                          ? "text-emerald-800"
                          : "text-slate-700"
                      }`}
                    >
                      {form.status ? "Published" : "Hidden"}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {form.status
                        ? "Visible on the public website"
                        : "Hidden from the public website"}
                    </p>
                  </div>

                  <span
                    className={`ml-3 flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${
                      form.status
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        form.status ? "translate-x-5" : ""
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* ==================================================
              HERO SECTION
             ================================================== */}

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 border-b border-border pb-4">
              <h2 className="text-base font-semibold text-navy sm:text-lg">
                Hero Section
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Main heading and introductory text shown at the top
                of the About page.
              </p>
            </div>

            <div className="space-y-5">
              <TextInput
                label="Hero Title"
                value={form.hero_title}
                onChange={(value) =>
                  updateField("hero_title", value)
                }
                placeholder="Travel planned simply, memories made forever."
                required
              />

              <TextArea
                label="Hero Description"
                value={form.hero_description}
                onChange={(value) =>
                  updateField("hero_description", value)
                }
                placeholder="Write a short introduction about the company..."
                rows={5}
              />
            </div>
          </section>

          {/* ==================================================
              STORY
             ================================================== */}

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 border-b border-border pb-4">
              <h2 className="text-base font-semibold text-navy sm:text-lg">
                Our Story
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Tell visitors how the company started and what
                makes it different.
              </p>
            </div>

            <div className="space-y-5">
              <TextInput
                label="Story Title"
                value={form.story_title}
                onChange={(value) =>
                  updateField("story_title", value)
                }
                placeholder="A better way to travel"
              />

              <TextArea
                label="Story Content"
                value={form.story_content}
                onChange={(value) =>
                  updateField("story_content", value)
                }
                placeholder="Write the company story..."
                rows={8}
              />
            </div>
          </section>

          {/* ==================================================
              MISSION & VISION
             ================================================== */}

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 border-b border-border pb-4">
              <h2 className="text-base font-semibold text-navy sm:text-lg">
                Mission & Vision
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Define the purpose and long-term direction of the
                company.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <TextArea
                label="Mission"
                value={form.mission}
                onChange={(value) =>
                  updateField("mission", value)
                }
                placeholder="What does your company aim to achieve?"
                rows={7}
              />

              <TextArea
                label="Vision"
                value={form.vision}
                onChange={(value) =>
                  updateField("vision", value)
                }
                placeholder="What future does your company want to create?"
                rows={7}
              />
            </div>
          </section>

          {/* ==================================================
              COMPANY FACTS
             ================================================== */}

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 border-b border-border pb-4">
              <h2 className="text-base font-semibold text-navy sm:text-lg">
                Company Facts
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Optional information that can be displayed as trust
                facts on the About page.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextInput
                label="Founded Year"
                value={form.founded_year}
                onChange={(value) =>
                  updateField("founded_year", value)
                }
                placeholder="2020"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
              />

              <TextInput
                label="Years of Experience"
                value={form.years_experience}
                onChange={(value) =>
                  updateField("years_experience", value)
                }
                placeholder="5"
                type="number"
                min="0"
              />
            </div>
          </section>

          {/* ==================================================
              MOBILE / DESKTOP SAVE BAR
             ================================================== */}

          <div className="sticky bottom-3 z-20 rounded-2xl border border-border bg-white/95 p-3 shadow-lg backdrop-blur sm:bottom-4 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="hidden min-w-0 sm:block">
                <p className="text-sm font-semibold text-navy">
                  {aboutId
                    ? "Update About page"
                    : "Create About page"}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Changes will be reflected on the public About page.
                </p>
              </div>

              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="min-h-11 flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {aboutId ? "Save Changes" : "Create About Page"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}


