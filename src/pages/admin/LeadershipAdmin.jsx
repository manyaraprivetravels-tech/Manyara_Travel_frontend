
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import ImageUploadField from "../../components/admin/ImageUploadField";
/* ============================================================
   EMPTY FORM
   ============================================================ */
const EMPTY_FORM = {
  name: "",
  designation: "",
  short_bio: "",
  full_bio: "",
  image: null,
  email: "",
  phone: "",
  whatsapp: "",
  experience_years: "",
  linkedin: "",
  instagram: "",
  facebook: "",
  company_message: "",
  display_order: 0,
  is_active: true,
};
/* ============================================================
   HELPERS
   ============================================================ */
function createEmptyForm() {
  return { ...EMPTY_FORM };
}
function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return (
      detail
        .map((item) => item?.msg || item)
        .filter(Boolean)
        .join(", ") ||
      "Something went wrong. Please try again."
    );
  }
  if (typeof detail === "string") {
    return detail;
  }
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}
function getImageUrl(image) {
  if (!image) return "";
  if (typeof image === "string") {
    return image;
  }
  if (typeof image === "object" && image?.url) {
    return image.url;
  }
  return "";
}
/**
 * Only allow real HTTP/HTTPS URLs for external social links.
 */
function getSafeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}
/**
 * Converts a WhatsApp number to a wa.me URL.
 * Also supports an already supplied HTTP/HTTPS URL.
 */
function getWhatsAppUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) {
    return getSafeUrl(raw);
  }
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}
function normalizeLeadership(item) {
  return {
    id: item?.id,
    name: item?.name || "",
    slug: item?.slug || "",
    designation: item?.designation || "",
    short_bio: item?.short_bio || "",
    full_bio: item?.full_bio || "",
    image: item?.image || null,
    email: item?.email || "",
    phone: item?.phone || "",
    whatsapp: item?.whatsapp || "",
    experience_years:
      item?.experience_years === null ||
      item?.experience_years === undefined
        ? ""
        : item.experience_years,
    linkedin: item?.linkedin || "",
    instagram: item?.instagram || "",
    facebook: item?.facebook || "",
    company_message: item?.company_message || "",
    display_order:
      item?.display_order === null ||
      item?.display_order === undefined
        ? 0
        : item.display_order,
    is_active:
      item?.is_active === undefined
        ? true
        : Boolean(item.is_active),
  };
}
function sortLeadership(items) {
  return [...items].sort((a, b) => {
    const orderA = Number(a?.display_order ?? 0);
    const orderB = Number(b?.display_order ?? 0);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return String(a?.name || "").localeCompare(
      String(b?.name || "")
    );
  });
}
/* ============================================================
   SMALL FORM COMPONENTS
   ============================================================ */
function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-navy">
      {children}
      {required && (
        <span
          className="ml-1 text-accent"
          aria-hidden="true"
        >
          *
        </span>
      )}
    </label>
  );
}
function TextInput({
  label,
  required = false,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  min,
  step,
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        step={step}
        className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </div>
  );
}
function TextArea({
  label,
  required = false,
  value,
  onChange,
  placeholder = "",
  rows = 4,
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}
/* ============================================================
   IMAGE FIELD
   ============================================================ */
/* ============================================================
   IMAGE FIELD
   ============================================================ */
function ImageField({ image, onChange }) {
  const imageUrl = getImageUrl(image);

  const handleUpload = (uploadedImage) => {
    if (!uploadedImage) {
      onChange(null);
      return;
    }

    // url + public_id are kept in the form and sent to the backend,
    // but they are not shown on screen.
    onChange({
      url: uploadedImage?.url || uploadedImage?.secure_url || "",
      public_id: uploadedImage?.public_id || "",
    });
  };

  const removeImage = () => {
    onChange(null);
  };

  return (
    <div>
      <FieldLabel>Profile image</FieldLabel>

      <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4">
        {imageUrl ? (
          <div className="space-y-4">
            {/* Current image */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
              <img
                src={imageUrl}
                alt="Leadership profile preview"
                className="h-56 w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <button
                type="button"
                onClick={removeImage}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md transition hover:bg-white"
                title="Remove image"
                aria-label="Remove profile image"
              >
                <X size={17} />
              </button>
            </div>

            <p className="text-sm font-semibold text-navy">
              Profile image added
            </p>

            {/* Replace image */}
            <ImageUploadField
              value={null}
              onChange={handleUpload}
              label="Replace profile image"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-navy">
                Add profile image
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Optional. Upload a photo to show on the leadership card.
              </p>
            </div>

            <ImageUploadField
              value={null}
              onChange={handleUpload}
              label="Add profile image"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SOCIAL LINK
   ============================================================ */
function SocialLink({ href, icon: Icon, label }) {
  const safeUrl = getSafeUrl(href);
  if (!safeUrl) return null;
  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={`Open ${label}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-navy transition hover:border-accent hover:text-accent"
    >
      <Icon size={16} aria-hidden="true" />
    </a>
  );
}
/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function LeadershipAdmin() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(createEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  /* ==========================================================
     LOAD
     ========================================================== */
  const loadLeadership = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        "/about/admin/leadership"
      );
      const data = response?.data;
      let records = [];
      if (Array.isArray(data)) {
        records = data;
      } else if (Array.isArray(data?.items)) {
        records = data.items;
      } else if (Array.isArray(data?.leadership)) {
        records = data.leadership;
      } else if (Array.isArray(data?.data)) {
        records = data.data;
      }
      const normalized = records.map(normalizeLeadership);
      setMembers(sortLeadership(normalized));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadLeadership();
  }, []);
  /* ==========================================================
     FORM HELPERS
     ========================================================== */
  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };
  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setShowForm(false);
  };
  const startCreate = () => {
    setError("");
    setSuccess("");
    setForm(createEmptyForm());
    setEditingId(null);
    setShowForm(true);
  };
  const startEdit = (member) => {
    setError("");
    setSuccess("");
    setForm({
      name: member?.name || "",
      designation: member?.designation || "",
      short_bio: member?.short_bio || "",
      full_bio: member?.full_bio || "",
      image: member?.image || null,
      email: member?.email || "",
      phone: member?.phone || "",
      whatsapp: member?.whatsapp || "",
      experience_years:
        member?.experience_years === null ||
        member?.experience_years === undefined
          ? ""
          : member.experience_years,
      linkedin: member?.linkedin || "",
      instagram: member?.instagram || "",
      facebook: member?.facebook || "",
      company_message: member?.company_message || "",
      display_order:
        member?.display_order === null ||
        member?.display_order === undefined
          ? 0
          : member.display_order,
      is_active:
        member?.is_active === undefined
          ? true
          : Boolean(member.is_active),
    });
    setEditingId(member?.id);
    setShowForm(true);
  };
  /* ==========================================================
     VALIDATION
     ========================================================== */
  const validateForm = () => {
    if (!form.name.trim()) {
      return "Name is required.";
    }
    if (!form.designation.trim()) {
      return "Designation is required.";
    }
    if (
      form.experience_years !== "" &&
      (
        Number.isNaN(Number(form.experience_years)) ||
        Number(form.experience_years) < 0
      )
    ) {
      return "Experience years must be zero or greater.";
    }
    if (
      Number.isNaN(Number(form.display_order)) ||
      Number(form.display_order) < 0
    ) {
      return "Display order must be zero or greater.";
    }
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }
    const socialFields = [
      ["LinkedIn", form.linkedin],
      ["Instagram", form.instagram],
      ["Facebook", form.facebook],
    ];
    for (const [label, value] of socialFields) {
      if (value.trim() && !getSafeUrl(value)) {
        return `${label} must be a valid HTTP or HTTPS URL.`;
      }
    }
    if (form.image?.url && !getSafeUrl(form.image.url)) {
      return "Profile image URL must be a valid HTTP or HTTPS URL.";
    }
    return "";
  };
  /* ==========================================================
     PAYLOAD
     ========================================================== */
  const buildPayload = () => {
    const image =
      form.image &&
      typeof form.image === "object" &&
      form.image.url
        ? {
            url: form.image.url.trim(),
            public_id:
              form.image.public_id?.trim() || "",
          }
        : null;
    return {
      name: form.name.trim(),
      designation: form.designation.trim(),
      short_bio:
        form.short_bio.trim() || null,
      full_bio:
        form.full_bio.trim() || null,
      image,
      email:
        form.email.trim() || null,
      phone:
        form.phone.trim() || null,
      whatsapp:
        form.whatsapp.trim() || null,
      experience_years:
        form.experience_years === ""
          ? null
          : Number(form.experience_years),
      linkedin:
        form.linkedin.trim() || null,
      instagram:
        form.instagram.trim() || null,
      facebook:
        form.facebook.trim() || null,
      company_message:
        form.company_message.trim() || null,
      display_order:
        Number(form.display_order) || 0,
      is_active:
        Boolean(form.is_active),
    };
  };
  /* ==========================================================
     CREATE / UPDATE
     ========================================================== */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.put(
          `/about/admin/leadership/${editingId}`,
          payload
        );
        setSuccess(
          "Leadership record updated successfully."
        );
      } else {
        await api.post(
          "/about/admin/leadership",
          payload
        );
        setSuccess(
          "Leadership record created successfully."
        );
      }
      resetForm();
      await loadLeadership();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  /* ==========================================================
     TOGGLE STATUS
     ========================================================== */
  const handleToggleStatus = async (member) => {
    if (!member?.id || togglingId) {
      return;
    }
    setError("");
    setSuccess("");
    setTogglingId(member.id);
    try {
      const payload = {
        name: member.name,
        designation: member.designation,
        short_bio:
          member.short_bio || null,
        full_bio:
          member.full_bio || null,
        image:
          member.image || null,
        email:
          member.email || null,
        phone:
          member.phone || null,
        whatsapp:
          member.whatsapp || null,
        experience_years:
          member.experience_years === ""
            ? null
            : member.experience_years,
        linkedin:
          member.linkedin || null,
        instagram:
          member.instagram || null,
        facebook:
          member.facebook || null,
        company_message:
          member.company_message || null,
        display_order:
          Number(member.display_order) || 0,
        is_active:
          !member.is_active,
      };
      await api.put(
        `/about/admin/leadership/${member.id}`,
        payload
      );
      setSuccess(
        member.is_active
          ? "Leadership member hidden from the public site."
          : "Leadership member activated."
      );
      await loadLeadership();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };
  /* ==========================================================
     DELETE
     ========================================================== */
  const handleDelete = async (member) => {
    const confirmed = window.confirm(
      `Delete "${member.name}" permanently?\n\nThis action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    setError("");
    setSuccess("");
    setDeletingId(member.id);
    try {
      await api.delete(
        `/about/admin/leadership/${member.id}`
      );
      setSuccess(
        "Leadership record deleted successfully."
      );
      await loadLeadership();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };
  /* ==========================================================
     STATS
     ========================================================== */
  const activeCount = useMemo(
    () =>
      members.filter(
        (member) => member.is_active
      ).length,
    [members]
  );
  const inactiveCount = useMemo(
    () =>
      members.filter(
        (member) => !member.is_active
      ).length,
    [members]
  );
  /* ==========================================================
     RENDER
     ========================================================== */
  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* ======================================================
          HEADER
          ====================================================== */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <UserRound size={15} />
            About CMS
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Leadership
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Manage the CEO, founder and other leadership
            profiles shown on the public About page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/about/leadership"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-navy"
          >
            <ExternalLink size={16} />
            View public page
          </Link>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
          >
            <Plus size={17} />
            Add leadership
          </button>
        </div>
      </div>
      {/* ======================================================
          ALERTS
          ====================================================== */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={18}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Something went wrong
            </p>
            <p className="mt-0.5 leading-5">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded-lg p-1 hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check
            className="mt-0.5 shrink-0"
            size={18}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Success
            </p>
            <p className="mt-0.5 leading-5">
              {success}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="shrink-0 rounded-lg p-1 hover:bg-green-100"
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {/* ======================================================
          STATS
          ====================================================== */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Total leaders
          </p>
          <p className="mt-1 text-2xl font-bold text-navy">
            {members.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Active
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {activeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Inactive
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-500">
            {inactiveCount}
          </p>
        </div>
      </div>
      {/* ======================================================
          LIST
          ====================================================== */}
      {loading ? (
        <div className="rounded-3xl border border-border bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center gap-3 text-sm text-muted">
            <Loader2
              className="animate-spin"
              size={20}
            />
            Loading leadership records...
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-accent">
            <UserRound size={25} />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-navy">
            No leadership records yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Add your founder, CEO or leadership members
            to start building the public About page.
          </p>
          <button
            type="button"
            onClick={startCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            <Plus size={17} />
            Add leadership
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => {
            const imageUrl = getImageUrl(
              member.image
            );
            const whatsappUrl =
              getWhatsAppUrl(member.whatsapp);
            return (
              <div
                key={member.id}
                className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-5 md:flex-row">
                    {/* IMAGE */}
                    <div className="shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={member.name}
                          className="h-28 w-28 rounded-2xl object-cover ring-1 ring-border sm:h-32 sm:w-32"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-navy text-2xl font-bold text-white sm:h-32 sm:w-32">
                          {member.name
                            ?.trim()
                            ?.charAt(0)
                            ?.toUpperCase() || "L"}
                        </div>
                      )}
                    </div>
                    {/* CONTENT */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                member.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {member.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-accent">
                              Order:{" "}
                              {member.display_order}
                            </span>
                          </div>
                          <h2 className="truncate font-display text-xl font-semibold text-navy">
                            {member.name}
                          </h2>
                          <p className="mt-1 text-sm font-semibold text-accent">
                            {member.designation}
                          </p>
                        </div>
                        {/* ACTIONS */}
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startEdit(member)
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-navy transition hover:border-navy hover:bg-slate-50"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(member)
                            }
                            disabled={
                              togglingId === member.id ||
                              deletingId === member.id
                            }
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              member.is_active
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {togglingId === member.id ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : null}
                            {togglingId === member.id
                              ? "Updating..."
                              : member.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(member)
                            }
                            disabled={
                              deletingId === member.id ||
                              togglingId === member.id
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === member.id ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            {deletingId === member.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                      {member.short_bio && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                          {member.short_bio}
                        </p>
                      )}
                      {/* CONTACT */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {member.experience_years !== "" &&
                          member.experience_years !== null &&
                          member.experience_years !== undefined && (
                            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                              {member.experience_years}{" "}
                              {Number(
                                member.experience_years
                              ) === 1
                                ? "year"
                                : "years"}{" "}
                              experience
                            </span>
                          )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-accent"
                          >
                            <Mail size={13} />
                            Email
                          </a>
                        )}
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-accent"
                          >
                            <Phone size={13} />
                            Phone
                          </a>
                        )}
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-green-600"
                          >
                            <MessageCircle size={13} />
                            WhatsApp
                          </a>
                        )}
                      </div>
                      {/* SOCIAL LINKS */}
                      <div className="mt-4 flex gap-2">
                        <SocialLink
                          href={member.linkedin}
                          icon={FaLinkedinIn}
                          label="LinkedIn"
                        />
                        <SocialLink
                          href={member.instagram}
                          icon={FaInstagram}
                          label="Instagram"
                        />
                        <SocialLink
                          href={member.facebook}
                          icon={FaFacebookF}
                          label="Facebook"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* ======================================================
          CREATE / EDIT MODAL
          ====================================================== */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => {
              if (!saving) {
                resetForm();
              }
            }}
          />
          <div className="relative flex min-h-full items-start justify-center p-3 sm:p-5 lg:p-8">
            <div className="relative my-4 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl sm:my-8">
              {/* MODAL HEADER */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">
                    Leadership CMS
                  </p>
                  <h2 className="mt-1 font-display text-xl font-semibold text-navy sm:text-2xl">
                    {editingId
                      ? "Edit leadership"
                      : "Add leadership"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!saving) {
                      resetForm();
                    }
                  }}
                  disabled={saving}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-slate-50 hover:text-navy disabled:opacity-50"
                  aria-label="Close leadership form"
                >
                  <X size={19} />
                </button>
              </div>
              {/* FORM */}
              <form onSubmit={handleSubmit}>
                <div className="max-h-[calc(100vh-170px)] overflow-y-auto px-5 py-6 sm:px-6">
                  <div className="space-y-7">
                    {/* BASIC INFORMATION */}
                    <section>
                      <div className="mb-4">
                        <h3 className="font-display text-lg font-semibold text-navy">
                          Basic information
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          The slug is generated automatically
                          from the name.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextInput
                          label="Name"
                          required
                          value={form.name}
                          onChange={(event) =>
                            updateField(
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="Founder / CEO name"
                        />
                        <TextInput
                          label="Designation"
                          required
                          value={form.designation}
                          onChange={(event) =>
                            updateField(
                              "designation",
                              event.target.value
                            )
                          }
                          placeholder="Founder & CEO"
                        />
                      </div>
                    </section>
                    {/* BIOGRAPHY */}
                    <section>
                      <div className="mb-4">
                        <h3 className="font-display text-lg font-semibold text-navy">
                          Biography
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <TextArea
                          label="Short bio"
                          value={form.short_bio}
                          onChange={(event) =>
                            updateField(
                              "short_bio",
                              event.target.value
                            )
                          }
                          placeholder="Short introduction shown on leadership cards."
                          rows={3}
                        />
                        <TextArea
                          label="Full bio"
                          value={form.full_bio}
                          onChange={(event) =>
                            updateField(
                              "full_bio",
                              event.target.value
                            )
                          }
                          placeholder="Full leadership biography."
                          rows={7}
                        />
                        <TextArea
                          label="Company message"
                          value={form.company_message}
                          onChange={(event) =>
                            updateField(
                              "company_message",
                              event.target.value
                            )
                          }
                          placeholder="Message from the founder / CEO about the company."
                          rows={5}
                        />
                      </div>
                    </section>
                    {/* IMAGE */}
                    <section>
                      <ImageField
                        image={form.image}
                        onChange={(value) =>
                          updateField("image", value)
                        }
                      />
                    </section>
                    {/* CONTACT */}
                    <section>
                      <div className="mb-4">
                        <h3 className="font-display text-lg font-semibold text-navy">
                          Contact information
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          All contact fields are optional.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <TextInput
                          label="Email"
                          type="email"
                          value={form.email}
                          onChange={(event) =>
                            updateField(
                              "email",
                              event.target.value
                            )
                          }
                          placeholder="founder@example.com"
                        />
                        <TextInput
                          label="Phone"
                          type="tel"
                          value={form.phone}
                          onChange={(event) =>
                            updateField(
                              "phone",
                              event.target.value
                            )
                          }
                          placeholder="+91..."
                        />
                        <TextInput
                          label="WhatsApp"
                          type="tel"
                          value={form.whatsapp}
                          onChange={(event) =>
                            updateField(
                              "whatsapp",
                              event.target.value
                            )
                          }
                          placeholder="+91..."
                        />
                      </div>
                    </section>
                    {/* SOCIAL */}
                    <section>
                      <div className="mb-4">
                        <h3 className="font-display text-lg font-semibold text-navy">
                          Social profiles
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          Enter complete HTTP or HTTPS profile URLs.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <TextInput
                          label="LinkedIn"
                          type="url"
                          value={form.linkedin}
                          onChange={(event) =>
                            updateField(
                              "linkedin",
                              event.target.value
                            )
                          }
                          placeholder="https://linkedin.com/in/..."
                        />
                        <TextInput
                          label="Instagram"
                          type="url"
                          value={form.instagram}
                          onChange={(event) =>
                            updateField(
                              "instagram",
                              event.target.value
                            )
                          }
                          placeholder="https://instagram.com/..."
                        />
                        <TextInput
                          label="Facebook"
                          type="url"
                          value={form.facebook}
                          onChange={(event) =>
                            updateField(
                              "facebook",
                              event.target.value
                            )
                          }
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                    </section>
                    {/* SETTINGS */}
                    <section>
                      <div className="mb-4">
                        <h3 className="font-display text-lg font-semibold text-navy">
                          Display settings
                        </h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextInput
                          label="Experience years"
                          type="number"
                          min="0"
                          step="1"
                          value={form.experience_years}
                          onChange={(event) =>
                            updateField(
                              "experience_years",
                              event.target.value
                            )
                          }
                          placeholder="10"
                        />
                        <TextInput
                          label="Display order"
                          type="number"
                          min="0"
                          step="1"
                          value={form.display_order}
                          onChange={(event) =>
                            updateField(
                              "display_order",
                              event.target.value
                            )
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="mt-4 rounded-2xl border border-border bg-slate-50 p-4">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={Boolean(
                              form.is_active
                            )}
                            onChange={(event) =>
                              updateField(
                                "is_active",
                                event.target.checked
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-navy">
                              Active
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted">
                              Active leadership records can
                              appear on the public Leadership
                              and About pages.
                            </span>
                          </span>
                        </label>
                      </div>
                    </section>
                  </div>
                </div>
                {/* MODAL FOOTER */}
                <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingId ? (
                          <Save size={17} />
                        ) : (
                          <Plus size={17} />
                        )}
                        {editingId
                          ? "Update leadership"
                          : "Create leadership"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



























































