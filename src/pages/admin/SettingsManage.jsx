


// src/pages/admin/SettingsManage.jsx

import { useEffect, useState } from "react";
import api from "../../api/axios";

// Cached version: saving here also refreshes the cache the public site reads,
// so the Top Info Bar updates immediately after saving.
import { updateSiteSettings } from "../../api/content";

import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Map,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Eye,
} from "lucide-react";

import {
  FaInstagram,
  FaYoutube,
  FaFacebookF,
  FaTwitter,
} from "react-icons/fa";



const getSettings = () =>
  api.get("/settings").then((res) => res.data);

// ============================================================
// SOCIAL LINKS CONFIG
// ============================================================

const SOCIAL_SLOTS = [1, 2, 3, 4];

const SOCIAL_OPTIONS = [
  { value: "Instagram", Icon: FaInstagram },
  { value: "Facebook", Icon: FaFacebookF },
  { value: "YouTube", Icon: FaYoutube },
  { value: "Twitter", Icon: FaTwitter },
];

// Maps old free-text values ("insta", "X", "youtube") onto a dropdown option.
// Returns "" when nothing matches.
const normalizePlatform = (name) => {
  const lower = (name || "").toLowerCase().trim();
  if (lower === "x") return "Twitter";

  return (
    SOCIAL_OPTIONS.find((option) =>
      lower.includes(option.value.toLowerCase())
    )?.value || ""
  );
};

const getSocialIcon = (name) =>
  SOCIAL_OPTIONS.find((option) => option.value === name)?.Icon || null;

// Simple email format check (empty is allowed - it just hides the email)
const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function SettingsManage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Success message
  const [saved, setSaved] = useState(false);

  // Error message
  const [error, setError] = useState("");

  // Top Info Bar accordion
  const [topInfoBarOpen, setTopInfoBarOpen] = useState(true);

  // ============================================================
  // LOAD SETTINGS
  // ============================================================

  const loadSettings = async () => {
    try {
      setError("");

      const s = await getSettings();

      setForm({
        // Top Info Bar
        top_bar_enabled: s?.top_bar_enabled !== false,
        top_bar_location_1: s?.top_bar_location_1 || "",
        top_bar_location_2: s?.top_bar_location_2 || "",
        top_bar_traveller_text: s?.top_bar_traveller_text || "",

        // Social slots 1-4
        ...Object.fromEntries(
          SOCIAL_SLOTS.flatMap((n) => [
            [
              `top_bar_social_${n}_name`,
              normalizePlatform(s?.[`top_bar_social_${n}_name`]),
            ],
            [
              `top_bar_social_${n}_url`,
              s?.[`top_bar_social_${n}_url`] || "",
            ],
          ])
        ),

        // Website content
        offer_banner_text: s?.offer_banner_text || "",
        homepage_headline: s?.homepage_headline || "",
        trust_line: s?.trust_line || "",

        // Contact
        email_address: s?.email_address || "",
        phone_number: s?.phone_number || "",
        whatsapp_number: s?.whatsapp_number || "",
        company_address: s?.company_address || "",
        // Landmark text typed by the admin
        address_landmark: s?.address_landmark || "",
        // Off unless the admin has ticked it
        show_address_landmark: s?.show_address_landmark === true,
        address_url: s?.address_url || "",
      });
    } catch (err) {
      console.error("Failed to load settings:", err);

      setError(
        err?.response?.data?.detail ||
          "Couldn't load settings. Please try again."
      );
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadSettings();
  }, []);

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Remove old messages when user starts editing again
    setSaved(false);
    setError("");
  };

  // Checkbox change (true / false)
  const handleToggle = (e) => {
    const { name, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: checked,
    }));

    setSaved(false);
    setError("");
  };

  // ============================================================
  // GOOGLE MAPS URL CHECK
  // ============================================================

  const addressUrl = form?.address_url?.trim() || "";

  const isGoogleMapsUrl =
    addressUrl.startsWith("https://www.google.com/maps/") ||
    addressUrl.startsWith("https://maps.google.com/") ||
    addressUrl.startsWith("https://www.google.co.in/maps/");

  // ============================================================
  // EMAIL CHECK
  // ============================================================

  const emailAddress = form?.email_address?.trim() || "";
  const emailLooksInvalid = emailAddress && !isValidEmail(emailAddress);

  // ============================================================
  // SAVE SETTINGS
  // ============================================================

  const handleSave = async (e) => {
    e.preventDefault();

    // Block save on a malformed email
    if (emailLooksInvalid) {
      setError("Please enter a valid email address, or leave it blank.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const payload = {
        // ======================================================
        // Top Info Bar
        // ======================================================

        top_bar_enabled: Boolean(form.top_bar_enabled),

        top_bar_location_1: form.top_bar_location_1.trim() || null,

        top_bar_location_2: form.top_bar_location_2.trim() || null,

        top_bar_traveller_text:
          form.top_bar_traveller_text.trim() || null,

        // Social slots 1-4: a slot is either fully filled or fully empty
        ...Object.fromEntries(
          SOCIAL_SLOTS.flatMap((n) => {
            const url = form[`top_bar_social_${n}_url`].trim();
            const name = form[`top_bar_social_${n}_name`];

            return [
              [`top_bar_social_${n}_name`, url ? name || null : null],
              [`top_bar_social_${n}_url`, url || null],
            ];
          })
        ),

        // ======================================================
        // Website content
        // ======================================================

        offer_banner_text: form.offer_banner_text.trim() || null,

        homepage_headline: form.homepage_headline.trim() || null,

        trust_line: form.trust_line.trim() || null,

        // ======================================================
        // Contact
        // ======================================================

        email_address: form.email_address.trim() || null,

        phone_number: form.phone_number.trim() || null,

        whatsapp_number: form.whatsapp_number.trim() || null,

        company_address: form.company_address.trim() || null,

        address_landmark: form.address_landmark.trim() || null,

        show_address_landmark: Boolean(form.show_address_landmark),

        address_url: form.address_url.trim() || null,
      };

      // Send data to backend (also updates the public site's cache)
      await updateSiteSettings(payload);

      // Reload latest saved values from backend
      await loadSettings();

      // Set success after reload
      setSaved(true);

      // Automatically hide success message after 4 seconds
      window.setTimeout(() => {
        setSaved(false);
      }, 4000);
    } catch (err) {
      console.error("Failed to save settings:", err);

      const detail = err?.response?.data?.detail;

      setError(
        Array.isArray(detail)
          ? detail.map((item) => item?.msg).filter(Boolean).join(", ")
          : detail ||
              "Couldn't save settings. Please check your admin access and try again."
      );

      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING ERROR
  // ============================================================

  if (error && !form) {
    return (
      <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-3 sm:px-4">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
            aria-hidden="true"
          />

          <p className="break-words text-sm text-red-600">{error}</p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          className="
            mt-4
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-navy
            px-4
            py-2
            text-sm
            font-medium
            text-ivory
            transition
            hover:bg-navy/90
          "
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (!form) {
    return (
      <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-2 text-sm text-navy/50">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading settings…
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-3xl min-w-0">
        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="mb-6">
          <h1 className="font-display text-xl font-semibold text-navy sm:text-2xl">
            Website Settings
          </h1>

          <p className="mt-1 break-words text-sm text-navy/50">
            Manage the website-wide content, Top Info Bar,
            contact information and location.
          </p>
        </div>

        {/* ======================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSave}
          className="
            w-full
            min-w-0
            space-y-6
            rounded-xl
            border
            border-navy/10
            bg-white
            p-4
            sm:rounded-2xl
            sm:p-5
            md:p-6
          "
        >
          {/* ====================================================
              TOP INFO BAR
          ==================================================== */}

          <div className="pt-0">
            <button
              type="button"
              onClick={() => setTopInfoBarOpen((open) => !open)}
              className="
                flex
                w-full
                items-center
                justify-between
                gap-3
                rounded-xl
                border
                border-navy/10
                bg-navy/[0.025]
                px-4
                py-3.5
                text-left
                transition
                hover:bg-navy/[0.045]
              "
              aria-expanded={topInfoBarOpen}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy sm:text-base">
                    Top Info Bar
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      form.top_bar_enabled
                        ? "bg-green-50 text-green-700"
                        : "bg-navy/5 text-navy/45"
                    }`}
                  >
                    {form.top_bar_enabled ? "Visible" : "Hidden"}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-navy/45">
                  Manage the small information bar displayed
                  above the main website header.
                </p>
              </div>

              <ChevronDown
                className={`h-5 w-5 shrink-0 text-navy/50 transition-transform ${
                  topInfoBarOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {topInfoBarOpen && (
              <div className="mt-4 space-y-5 rounded-xl border border-navy/10 bg-white p-4 sm:p-5">
                {/* Enable / Disable */}
                <div
                  className={`rounded-xl border px-4 py-3 ${
                    form.top_bar_enabled
                      ? "border-green-100 bg-green-50/70"
                      : "border-amber-100 bg-amber-50/70"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">
                        Show Top Info Bar on website
                      </p>

                      <p className="mt-1 text-xs text-navy/50">
                        Turn this off to completely hide the
                        top bar without deleting any of its
                        saved content.
                      </p>
                    </div>

                    <label className="inline-flex shrink-0 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        name="top_bar_enabled"
                        checked={Boolean(form.top_bar_enabled)}
                        onChange={handleToggle}
                        className="h-4 w-4 rounded border-navy/20 text-navy focus:ring-navy/20"
                      />

                      <span className="text-sm font-medium text-navy">
                        {form.top_bar_enabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <p className="mb-3 text-sm font-semibold text-navy">
                    Website locations
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Location 1">
                      <input
                        type="text"
                        name="top_bar_location_1"
                        value={form.top_bar_location_1}
                        onChange={handleChange}
                        placeholder="Hyderabad"
                        maxLength={80}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Location 2">
                      <input
                        type="text"
                        name="top_bar_location_2"
                        value={form.top_bar_location_2}
                        onChange={handleChange}
                        placeholder="Bengaluru"
                        maxLength={80}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <p className={helpTextClass}>
                    These locations can be changed whenever
                    On a Trip expands to another city.
                  </p>
                </div>

                {/* Traveller metric */}
                <Field label="Traveller / trust metric">
                  <input
                    type="text"
                    name="top_bar_traveller_text"
                    value={form.top_bar_traveller_text}
                    onChange={handleChange}
                    placeholder="5000+ successful travelers"
                    maxLength={100}
                    className={inputClass}
                  />

                  <p className={helpTextClass}>
                    Example: “5000+ successful travelers”,
                    “10,000+ happy travelers”, or any other
                    trust message.
                  </p>
                </Field>

                {/* Social Links */}
                <div>
                  <p className="mb-3 text-sm font-semibold text-navy">
                    Social links
                  </p>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {SOCIAL_SLOTS.map((n) => {
                      const nameKey = `top_bar_social_${n}_name`;
                      const urlKey = `top_bar_social_${n}_url`;
                      const Icon = getSocialIcon(form[nameKey]);

                      // Platforms already chosen in the other slots
                      const takenElsewhere = SOCIAL_SLOTS.filter(
                        (m) => m !== n
                      ).map((m) => form[`top_bar_social_${m}_name`]);

                      return (
                        <div
                          key={n}
                          className="space-y-3 rounded-xl border border-navy/10 p-4"
                        >
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon
                                className="h-4 w-4 text-accent"
                                aria-hidden="true"
                              />
                            )}

                            <p className="text-sm font-semibold text-navy">
                              Social Link {n}
                            </p>
                          </div>

                          <Field label="Platform">
                            <select
                              name={nameKey}
                              value={form[nameKey]}
                              onChange={handleChange}
                              className={inputClass}
                            >
                              <option value="">Not used</option>

                              {SOCIAL_OPTIONS.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                  disabled={takenElsewhere.includes(
                                    option.value
                                  )}
                                >
                                  {option.value}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Profile URL">
                            <input
                              type="url"
                              name={urlKey}
                              value={form[urlKey]}
                              onChange={handleChange}
                              placeholder="https://..."
                              maxLength={500}
                              className={inputClass}
                            />
                          </Field>
                        </div>
                      );
                    })}
                  </div>

                  <p className={helpTextClass}>
                    Choose a platform and paste its link. Leave a
                    slot empty to hide it. Up to 4 links are shown
                    on the public Top Info Bar, each with its own
                    icon.
                  </p>
                </div>

                {/* Preview */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Eye
                      className="h-4 w-4 text-accent"
                      aria-hidden="true"
                    />

                    <p className="text-sm font-semibold text-navy">
                      Current Top Info Bar Preview
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-navy/10 bg-[#03112D] text-white">
                    <div className="flex min-h-10 flex-col gap-2 px-3 py-2 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:text-xs">
                      {/* Socials */}
                      <div className="flex min-w-0 flex-wrap items-center gap-3">
                        {SOCIAL_SLOTS.map((n) => {
                          const url = form[`top_bar_social_${n}_url`];
                          const name = form[`top_bar_social_${n}_name`];

                          if (!url) return null;

                          const Icon = getSocialIcon(name);

                          return (
                            <span
                              key={n}
                              className="inline-flex shrink-0 items-center gap-1.5"
                            >
                              {Icon && <Icon className="h-3.5 w-3.5" />}

                              {name || `Social ${n}`}
                            </span>
                          );
                        })}
                      </div>

                      {/* Locations */}
                      <div className="flex items-center justify-center gap-2 text-center text-white/90">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF3B0B]" />

                        {[form.top_bar_location_1, form.top_bar_location_2]
                          .filter(Boolean)
                          .join(" • ") || "Locations"}
                      </div>

                      {/* Traveller */}
                      <div className="text-center text-white/90 sm:text-right">
                        {form.top_bar_traveller_text ||
                          "Traveller trust metric"}
                      </div>
                    </div>
                  </div>

                  {!form.top_bar_enabled && (
                    <p className="mt-2 text-xs text-amber-700">
                      The preview is shown here for editing,
                      but the public website will hide this bar
                      while “Show Top Info Bar” is disabled.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ====================================================
              WEBSITE CONTENT
          ==================================================== */}

          <div>
            <SectionTitle title="Website Content" />

            <div className="mt-4 space-y-4">
              {/* Offer Banner */}
              <Field label="Offer banner text (shown site-wide, leave blank to hide)">
                <input
                  type="text"
                  name="offer_banner_text"
                  value={form.offer_banner_text}
                  onChange={handleChange}
                  placeholder="Special offers available this month"
                  maxLength={300}
                  className={inputClass}
                />
              </Field>

              {/* Homepage Headline */}
              <Field label="Homepage headline">
                <input
                  type="text"
                  name="homepage_headline"
                  value={form.homepage_headline}
                  onChange={handleChange}
                  placeholder="Trips that feel like they were planned by a friend, not a form."
                  maxLength={200}
                  className={inputClass}
                />
              </Field>

              {/* Trust Line */}
              <Field label="Trust line">
                <input
                  type="text"
                  name="trust_line"
                  value={form.trust_line}
                  onChange={handleChange}
                  placeholder="The two Telugu states' trusted travel company"
                  maxLength={200}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {/* ====================================================
              CONTACT INFORMATION
          ==================================================== */}

          <div className="pt-2">
            <SectionTitle title="Contact Information" />

            <div className="mt-4 space-y-4">
              {/* Email */}
              <Field
                label={
                  <span className="inline-flex items-center gap-2">
                    <Mail
                      className="h-4 w-4 text-accent"
                      aria-hidden="true"
                    />
                    Email address
                  </span>
                }
              >
                <input
                  type="email"
                  name="email_address"
                  value={form.email_address}
                  onChange={handleChange}
                  placeholder="hello@onatrip.com"
                  maxLength={120}
                  className={inputClass}
                />

                {emailLooksInvalid ? (
                  <p className="mt-1.5 break-words text-xs text-amber-700">
                    This doesn't look like a valid email
                    address.
                  </p>
                ) : (
                  <p className={helpTextClass}>
                    This email will appear on the public website
                    and can be clicked to send a mail. Leave
                    blank to hide it.
                  </p>
                )}
              </Field>

              {/* Phone */}
              <Field
                label={
                  <span className="inline-flex items-center gap-2">
                    <Phone
                      className="h-4 w-4 text-accent"
                      aria-hidden="true"
                    />
                    Phone number
                  </span>
                }
              >
                <input
                  type="text"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  maxLength={30}
                  className={inputClass}
                />

                <p className={helpTextClass}>
                  This number will appear in the public website
                  footer and can be clicked to call.
                </p>
              </Field>

              {/* WhatsApp */}
              <Field
                label={
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle
                      className="h-4 w-4 text-accent"
                      aria-hidden="true"
                    />
                    WhatsApp number
                  </span>
                }
              >
                <input
                  type="text"
                  name="whatsapp_number"
                  value={form.whatsapp_number}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  maxLength={30}
                  className={inputClass}
                />

                <p className={helpTextClass}>
                  Include the country code. The footer will
                  automatically create the WhatsApp link.
                </p>
              </Field>

              {/* Company Address */}
              <Field
                label={
                  <span className="inline-flex items-center gap-2">
                    <MapPin
                      className="h-4 w-4 text-accent"
                      aria-hidden="true"
                    />
                    Company address
                  </span>
                }
              >
                <textarea
                  name="company_address"
                  value={form.company_address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="HSR Layout, Bengaluru, Karnataka, India"
                  className={`${inputClass} resize-none`}
                />

                <p className={helpTextClass}>
                  This address will be displayed in the Contact
                  section and the public website footer.
                </p>
              </Field>

              {/* Landmark: typed by admin + tick to show/hide */}
              <div
                className={`rounded-xl border px-4 py-3 transition-colors ${
                  form.show_address_landmark
                    ? "border-green-100 bg-green-50/70"
                    : "border-navy/10 bg-navy/[0.025]"
                }`}
              >
                <Field label="Landmark note">
                  <input
                    type="text"
                    name="address_landmark"
                    value={form.address_landmark}
                    onChange={handleChange}
                    placeholder="Near Metro Station, opposite City Mall"
                    maxLength={200}
                    className={inputClass}
                  />
                </Field>

                <label
                  htmlFor="show_address_landmark"
                  className="mt-3 flex cursor-pointer items-start gap-3"
                >
                  <input
                    id="show_address_landmark"
                    type="checkbox"
                    name="show_address_landmark"
                    checked={Boolean(form.show_address_landmark)}
                    onChange={handleToggle}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/20 text-navy focus:ring-navy/20"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy">
                      Show landmark
                    </span>

                    <span className="mt-1 block text-xs text-navy/50">
                      Tick to show this landmark note under the
                      address in the Contact section and the
                      footer. Untick to hide it.
                    </span>
                  </span>
                </label>

                {form.show_address_landmark &&
                  !form.address_landmark.trim() && (
                    <p className="mt-2 text-xs text-amber-700">
                      Landmark is ticked but empty, so nothing
                      will be shown.
                    </p>
                  )}

                {/* Live preview of how the address will read */}
                {(form.company_address.trim() ||
                  (form.show_address_landmark &&
                    form.address_landmark.trim())) && (
                  <div className="mt-3 rounded-lg border border-navy/10 bg-white px-3 py-2.5">
                    <p className="text-[11px] font-medium text-navy/40">
                      Address preview
                    </p>

                    {form.company_address.trim() && (
                      <p className="mt-1 whitespace-pre-line break-words text-sm text-navy">
                        {form.company_address.trim()}
                      </p>
                    )}

                    {form.show_address_landmark &&
                      form.address_landmark.trim() && (
                        <p className="mt-1 break-words text-sm font-medium text-navy">
                          {form.address_landmark.trim()}
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ====================================================
              GOOGLE MAPS
          ==================================================== */}

          <div className="pt-2">
            <SectionTitle title="Google Maps Location" />

            <div className="mt-4 space-y-4">
              {/* Instructions */}
              <div
                className="
                  rounded-lg
                  border
                  border-blue-100
                  bg-blue-50
                  px-3
                  py-3
                  sm:rounded-xl
                  sm:px-4
                "
              >
                <div className="flex items-start gap-3">
                  <Map
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />

                  <div className="min-w-0 text-sm text-blue-800">
                    <p className="mb-1 font-semibold">
                      How to add the map
                    </p>

                    <ol className="ml-4 list-decimal space-y-1 text-xs text-blue-700 sm:text-sm">
                      <li>
                        Open your business location in Google
                        Maps.
                      </li>

                      <li>
                        Click <strong>Share</strong>.
                      </li>

                      <li>
                        Select <strong>Embed a map</strong>.
                      </li>

                      <li>
                        Copy the URL from the iframe{" "}
                        <strong>src</strong> attribute.
                      </li>

                      <li>Paste only the URL below.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Google Maps URL */}
              <Field
                label={
                  <span className="inline-flex items-center gap-2">
                    <Map
                      className="h-4 w-4 text-accent"
                      aria-hidden="true"
                    />
                    Google Maps Embed URL
                  </span>
                }
              >
                <input
                  type="url"
                  name="address_url"
                  value={form.address_url}
                  onChange={handleChange}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className={inputClass}
                />

                <p className={helpTextClass}>
                  Paste only the Google Maps URL, not the
                  complete iframe HTML.
                </p>
              </Field>

              {/* Invalid URL warning */}
              {addressUrl && !isGoogleMapsUrl && (
                <div
                  className="
                    flex
                    items-start
                    gap-2
                    rounded-lg
                    border
                    border-amber-100
                    bg-amber-50
                    px-3
                    py-3
                    sm:px-4
                  "
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />

                  <p className="break-words text-xs text-amber-700 sm:text-sm">
                    This doesn't look like a Google Maps
                    URL. Please paste the URL from Google's{" "}
                    <strong>Embed a map</strong> option.
                  </p>
                </div>
              )}

              {/* Map Preview */}
              {isGoogleMapsUrl && (
                <div className="pt-1">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-navy">
                      Map Preview
                    </p>

                    <a
                      href={addressUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        inline-flex
                        shrink-0
                        items-center
                        gap-1
                        text-xs
                        font-medium
                        text-accent
                        hover:underline
                      "
                    >
                      Open Maps

                      <ExternalLink
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </a>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-navy/10 bg-navy/5">
                    <iframe
                      src={addressUrl}
                      title="Google Maps Preview"
                      className="
                        block
                        h-56
                        w-full
                        border-0
                        sm:h-64
                      "
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>

                  <p className="mt-2 text-xs text-navy/40">
                    This is a preview of the map that will be
                    displayed on the public website.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ====================================================
              ERROR MESSAGE
          ==================================================== */}

          {error && (
            <div
              className="
                flex
                items-start
                gap-2
                rounded-lg
                border
                border-red-100
                bg-red-50
                px-3
                py-3
                sm:px-4
              "
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                aria-hidden="true"
              />

              <p className="break-words text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              pt-2
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            {/* Reload */}
            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-navy/15
                px-4
                py-2.5
                text-sm
                font-medium
                text-navy
                transition
                hover:bg-navy/5
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload
            </button>

            {/* Save + Success */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Success message */}
              {saved && (
                <span
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-1.5
                    text-sm
                    font-medium
                    text-green-700
                  "
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Settings saved successfully
                </span>
              )}

              {/* Save button */}
              <button
                type="submit"
                disabled={saving}
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-navy
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-ivory
                  transition
                  hover:bg-navy/90
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  sm:w-auto
                "
              >
                {saving ? (
                  <>
                    <RefreshCw
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// FIELD COMPONENT
// ============================================================

function Field({ label, children }) {
  return (
    <div className="w-full min-w-0">
      <label className="mb-1.5 block break-words text-sm font-medium text-navy">
        {label}
      </label>

      {children}
    </div>
  );
}

// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({ title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-navy/10" />

      <h2 className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-navy/60 sm:text-sm">
        {title}
      </h2>

      <div className="h-px flex-1 bg-navy/10" />
    </div>
  );
}

// ============================================================
// INPUT STYLES
// ============================================================

const inputClass = `
  w-full
  min-w-0
  rounded-lg
  border
  border-navy/15
  bg-white
  px-3
  py-2.5
  text-sm
  text-navy
  outline-none
  transition
  placeholder:text-navy/30
  focus:border-navy/40
  focus:ring-2
  focus:ring-navy/10
  sm:px-4
  sm:py-3
`;

// ============================================================
// HELP TEXT STYLES
// ============================================================

const helpTextClass = "mt-1.5 break-words text-xs text-navy/40";









