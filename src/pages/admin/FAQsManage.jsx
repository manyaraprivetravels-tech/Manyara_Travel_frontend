

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

import {
  getAllFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
} from "../../api/adminFaqs";

const FAQ_CATEGORIES = [
  {
    value: "general",
    label: "General",
    description: "Homepage and site-wide questions",
  },
  {
    value: "most_visited",
    label: "Most Visited",
    description: "Questions about destinations",
  },
  {
    value: "seasonal",
    label: "Seasonal Views",
    description: "Questions about seasonal destinations",
  },
  {
    value: "packages",
    label: "Packages",
    description: "Questions about travel packages",
  },
];

const EMPTY_FORM = {
  question: "",
  answer: "",
  category: "general",
  display_order: 0,
};

export default function FAQsManage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);

    getAllFaqsAdmin()
      .then((data) => {
        setItems(
          [...data].sort(
            (a, b) => a.display_order - b.display_order
          )
        );
      })
      .catch((err) => {
        setError(
          err?.response?.data?.detail ||
            "Could not load FAQs"
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setError("");
    setEditing({});
  };

  const openEdit = (faq) => {
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "general",
      display_order: faq.display_order ?? 0,
    });

    setError("");
    setEditing(faq);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        display_order: Number(form.display_order),
      };

      if (editing?.id) {
        await updateFaq(editing.id, payload);
      } else {
        await createFaq(payload);
      }

      setEditing(null);
      load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not save FAQ"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this FAQ?")) return;

    try {
      await deleteFaq(id);
      load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not delete FAQ"
      );
    }
  };

  const closeModal = () => {
    if (saving) return;

    setEditing(null);
    setError("");
  };

  const getCategoryLabel = (category) => {
    return (
      FAQ_CATEGORIES.find(
        (item) => item.value === category
      )?.label || "General"
    );
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-navy">
            FAQs
          </h1>

          <p className="text-xs sm:text-sm text-navy/50 mt-1">
            Manage frequently asked questions by page category
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="
            w-full sm:w-auto
            inline-flex items-center justify-center gap-2
            bg-accent hover:bg-accent-hover
            text-navy font-semibold text-sm
            px-4 py-2.5
            rounded-lg
            transition-colors
            shrink-0
          "
        >
          <Plus size={17} />
          New FAQ
        </button>
      </div>

      {/* Error */}
      {error && !editing && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 break-words">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-navy/50 text-sm">
            <Loader2
              size={18}
              className="animate-spin"
            />
            Loading FAQs…
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-navy/10 overflow-hidden">
          {/* FAQ List */}
          {items.length > 0 ? (
            <div className="divide-y divide-navy/5">
              {items.map((faq) => (
                <div
                  key={faq.id}
                  className="
                    p-4 sm:p-5
                    flex flex-col gap-4
                    sm:flex-row sm:items-start sm:justify-between
                  "
                >
                  {/* FAQ Content */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy text-sm sm:text-base break-words">
                      {faq.question}
                    </p>

                    <p className="text-navy/60 text-sm mt-1.5 line-clamp-3 break-words">
                      {faq.answer}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      <p className="text-xs text-navy/40">
                        Order: {faq.display_order}
                      </p>

                      <span className="text-navy/20 hidden sm:inline">
                        ·
                      </span>

                      <p className="text-xs text-navy/40 break-words">
                        Category:{" "}
                        {getCategoryLabel(faq.category)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="
                      flex items-center gap-3
                      shrink-0
                      self-end sm:self-start
                    "
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(faq)}
                      className="
                        inline-flex items-center gap-1.5
                        text-secondary
                        text-sm font-medium
                        hover:underline
                        whitespace-nowrap
                      "
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(faq.id)}
                      className="
                        inline-flex items-center gap-1.5
                        text-red-600
                        text-sm font-medium
                        hover:underline
                        whitespace-nowrap
                      "
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-navy/40 text-sm sm:text-base">
                No FAQs yet.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="
                  mt-4
                  inline-flex items-center gap-2
                  text-secondary
                  text-sm font-medium
                  hover:underline
                "
              >
                <Plus size={16} />
                Add your first FAQ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <div
          className="
            fixed inset-0
            bg-navy-dark/50
            flex items-center justify-center
            p-2 sm:p-4 md:p-5
            z-50
          "
        >
          <div
            className="
              bg-ivory
              rounded-xl sm:rounded-2xl
              w-full max-w-md
              max-h-[96vh] sm:max-h-[92vh]
              overflow-y-auto
              shadow-xl
            "
          >
            {/* Modal Header */}
            <div
              className="
                flex items-center justify-between
                gap-4
                px-4 sm:px-6
                py-4 sm:py-5
                border-b border-navy/10
              "
            >
              <h2 className="font-display text-lg sm:text-xl font-semibold text-navy">
                {editing?.id ? "Edit FAQ" : "New FAQ"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="
                  shrink-0
                  w-8 h-8
                  rounded-full
                  flex items-center justify-center
                  text-navy/50
                  hover:bg-surface
                  hover:text-navy
                  transition-colors
                  disabled:opacity-50
                "
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSave}
              className="p-4 sm:p-6 space-y-4"
            >
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Question
                </label>

                <input
                  required
                  maxLength={300}
                  value={form.question}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      question: e.target.value,
                    })
                  }
                  placeholder="Enter FAQ question"
                  className="
                    w-full
                    px-3 sm:px-4
                    py-2.5
                    rounded-lg
                    border border-navy/15
                    bg-white
                    text-sm
                    text-navy
                    outline-none
                    focus:border-secondary
                    focus:ring-1 focus:ring-secondary/20
                    transition
                  "
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Answer
                </label>

                <textarea
                  required
                  rows={5}
                  value={form.answer}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      answer: e.target.value,
                    })
                  }
                  placeholder="Enter FAQ answer"
                  className="
                    w-full
                    px-3 sm:px-4
                    py-2.5
                    rounded-lg
                    border border-navy/15
                    bg-white
                    text-sm
                    text-navy
                    outline-none
                    resize-y
                    focus:border-secondary
                    focus:ring-1 focus:ring-secondary/20
                    transition
                  "
                />
              </div>

              {/* Category + Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">
                    Category
                  </label>

                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                    className="
                      w-full
                      px-3 sm:px-4
                      py-2.5
                      rounded-lg
                      border border-navy/15
                      bg-white
                      text-sm
                      text-navy
                      outline-none
                      focus:border-secondary
                      focus:ring-1 focus:ring-secondary/20
                      transition
                    "
                  >
                    {FAQ_CATEGORIES.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-navy/40 mt-1.5">
                    {
                      FAQ_CATEGORIES.find(
                        (item) =>
                          item.value === form.category
                      )?.description
                    }
                  </p>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">
                    Display Order
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.display_order}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        display_order: e.target.value,
                      })
                    }
                    className="
                      w-full
                      px-3 sm:px-4
                      py-2.5
                      rounded-lg
                      border border-navy/15
                      bg-white
                      text-sm
                      text-navy
                      outline-none
                      focus:border-secondary
                      focus:ring-1 focus:ring-secondary/20
                      transition
                    "
                  />
                </div>
              </div>

              {/* Form Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-sm text-red-600 break-words">
                    {error}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div
                className="
                  flex flex-col-reverse
                  sm:flex-row sm:justify-end
                  gap-2 sm:gap-3
                  pt-2 sm:pt-4
                "
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="
                    w-full sm:w-auto
                    px-4 py-2.5
                    rounded-lg
                    text-sm font-medium
                    text-navy/60
                    hover:bg-surface
                    transition-colors
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="
                    w-full sm:w-auto
                    inline-flex items-center justify-center gap-2
                    px-5 py-2.5
                    rounded-lg
                    text-sm font-semibold
                    bg-navy
                    text-ivory
                    hover:bg-navy-light
                    disabled:opacity-60
                    transition-colors
                  "
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




