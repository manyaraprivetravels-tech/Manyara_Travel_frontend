


import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Play,
} from "lucide-react";

import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../../api/content";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ImageUploadField from "../../components/admin/ImageUploadField";

import {
  extractMedia,
  getVideoPoster,
  getVideoSrc,
  makeMediaToken,
  stripMediaTokens,
} from "../../utils/BlogContent";

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content: "",
  media: [],
  cover_image: null,
  target_keyword: "",
  meta_description: "",
  status: "draft",
};

// --------------------------------------------------
// YOUTUBE HELPERS
//
// Videos are NOT uploaded anywhere. Only the YouTube link is
// saved (inside the blog content, as a {{video:...}} token).
// --------------------------------------------------

/**
 * Returns the 11-character video id from any common YouTube link
 * (watch, youtu.be, embed, shorts, live, mobile), or "" if invalid.
 */
const getYouTubeId = (input) => {
  const value = String(input || "").trim();
  if (!value) return "";

  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`
    );

    const host = url.hostname.replace(/^www\.|^m\./, "");
    let id = "";

    if (host === "youtu.be") {
      id = url.pathname.split("/")[1] || "";
    } else if (
      host === "youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "music.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v") || "";
      } else {
        const match = url.pathname.match(
          /^\/(?:embed|shorts|live|v)\/([^/?]+)/
        );
        id = match ? match[1] : "";
      }
    }

    return /^[\w-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
};

// Short form: no "?" or "=" characters, so it is safe inside a media token.
const toYouTubeUrl = (id) => `https://youtu.be/${id}`;

const getYouTubeThumbnail = (id) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export default function BlogsManage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // YouTube link input
  const [videoLink, setVideoLink] = useState("");
  const [videoError, setVideoError] = useState("");

  // Upload states (cover image + blog photos; videos are links)
  const [coverUploading, setCoverUploading] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);

  const uploading = coverUploading || mediaBusy;

  // --------------------------------------------------
  // LOAD BLOGS
  // --------------------------------------------------

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllBlogs();

      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load blogs:", err);

      const message =
        err?.response?.data?.detail ||
        "Failed to load blogs. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getImageObject = (coverImage) => {
    if (!coverImage) return null;

    if (typeof coverImage === "object") {
      return {
        url: coverImage.url || "",
        public_id: coverImage.public_id || null,
      };
    }

    if (typeof coverImage === "string") {
      return {
        url: coverImage,
        public_id: null,
      };
    }

    return null;
  };

  const resetUploadState = () => {
    setCoverUploading(false);
    setMediaBusy(false);
    setVideoLink("");
    setVideoError("");
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      media: [],
    });

    setError("");
    resetUploadState();
    setShowForm(true);
  };

  const openEditForm = (blog) => {
    setEditingId(blog.id);

    setForm({
      title: blog.title || "",
      excerpt: blog.excerpt || "",

      // Text only.
      // Media tokens are loaded separately into `media`.
      content: stripMediaTokens(blog.content || "").trim(),

      media: extractMedia(blog.content || "").map((item) => ({
        ...item,
        caption: item.caption.trim(),
      })),

      cover_image: getImageObject(blog.cover_image),

      target_keyword: blog.target_keyword || "",
      meta_description: blog.meta_description || "",
      status: blog.status || "draft",
    });

    setError("");
    resetUploadState();
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      media: [],
    });

    setError("");
    resetUploadState();
  };

  // --------------------------------------------------
  // BLOG MEDIA
  // --------------------------------------------------

  const addMedia = (items) => {
    if (!items?.length) return;

    setForm((prev) => ({
      ...prev,
      media: [...prev.media, ...items],
    }));
  };

  /*
   * Called by the "Add a photo" slot after the admin has picked,
   * cropped and uploaded one image. The slot clears itself
   * (resetOnSuccess), so the next photo can be added straight away.
   */
  const addPhoto = (image) => {
    if (!image?.url) return; // upload failed or was cancelled

    addMedia([{ type: "image", url: image.url, caption: "" }]);
  };

  const addVideoLink = () => {
    const id = getYouTubeId(videoLink);

    if (!id) {
      setVideoError(
        "Enter a valid YouTube link, for example https://www.youtube.com/watch?v=..."
      );
      toast.warning("Please enter a valid YouTube link.");
      return;
    }

    const url = toYouTubeUrl(id);

    const alreadyAdded = form.media.some(
      (item) => item.type === "video" && getYouTubeId(item.url) === id
    );

    if (alreadyAdded) {
      setVideoError("This video is already added to the blog.");
      toast.warning("This video is already added to the blog.");
      return;
    }

    addMedia([{ type: "video", url, caption: "" }]);

    setVideoLink("");
    setVideoError("");
  };

  const changeMediaCaption = (index, caption) => {
    setForm((prev) => ({
      ...prev,
      media: prev.media.map((item, i) =>
        i === index
          ? {
              ...item,
              caption,
            }
          : item
      ),
    }));
  };

  const removeMedia = (index) => {
    setForm((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  const moveMedia = (index, direction) => {
    setForm((prev) => {
      const target = index + direction;

      if (target < 0 || target >= prev.media.length) {
        return prev;
      }

      const next = [...prev.media];

      [next[index], next[target]] = [next[target], next[index]];

      return {
        ...prev,
        media: next,
      };
    });
  };

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploading) {
      toast.warning("Please wait for your uploads to finish.");
      return;
    }

    if (videoLink.trim()) {
      toast.warning(
        "You typed a YouTube link but did not add it. Click Add video, or clear the field."
      );
      return;
    }

    if (!form.title.trim()) {
      toast.warning("Blog title is required.");
      return;
    }

    if (!form.content.trim()) {
      toast.warning("Blog content is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      /*
       * Build media tokens in the exact order
       * shown in the admin media section.
       *
       * Example:
       *
       * {{image:https://.../dubai1.jpg}}
       * {{image:https://.../dubai2.jpg}}
       * {{video:https://youtu.be/XXXXXXXXXXX}}
       *
       * Videos are plain YouTube links, so nothing is
       * uploaded to Cloudinary for them.
       */

      const mediaLines = form.media
        .map((item) => makeMediaToken(item.type, item.url, item.caption))
        .join("\n");

      /*
       * Media is stored BEFORE the text so BlogDetail.jsx
       * can render the gallery/video section first.
       */

      const combinedContent = mediaLines
        ? `${mediaLines}\n\n${form.content.trim()}`
        : form.content.trim();

      const payload = {
        title: form.title.trim(),

        excerpt: form.excerpt.trim() || null,

        content: combinedContent,

        cover_image: form.cover_image?.url
          ? {
              url: form.cover_image.url,
              public_id: form.cover_image.public_id || null,
            }
          : null,

        target_keyword: form.target_keyword.trim() || null,

        meta_description: form.meta_description.trim() || null,

        status: form.status,
      };

      if (editingId) {
        await updateBlog(editingId, payload);
        toast.success("Blog updated successfully.");
      } else {
        await createBlog(payload);
        toast.success("Blog created successfully.");
      }

      await loadBlogs();
      closeForm();
    } catch (err) {
      console.error("Failed to save blog:", err);

      const message =
        err?.response?.data?.detail ||
        "Failed to save blog. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async (blog) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${blog.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteBlog(blog.id);

      setBlogs((prev) => prev.filter((item) => item.id !== blog.id));

      toast.success("Blog deleted successfully.");
    } catch (err) {
      console.error("Failed to delete blog:", err);

      const message =
        err?.response?.data?.detail ||
        "Failed to delete blog. Please try again.";

      setError(message);
      toast.error(message);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      <div className="min-h-screen bg-ivory p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">Blogs</h1>

            <p className="text-sm text-navy/60 mt-1">
              Create and manage travel blogs.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-5 py-2.5 rounded-lg font-semibold transition"
          >
            <Plus size={18} />
            Add Blog
          </button>
        </div>

        {/* ERROR */}
        {error && !showForm && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* BLOG LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-navy/10 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-navy/50">
              Loading blogs...
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-navy/60">No blogs found.</p>

              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg"
              >
                <Plus size={17} />
                Create your first blog
              </button>
            </div>
          ) : (
            <div className="divide-y divide-navy/10">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="p-5 flex flex-col md:flex-row gap-5 md:items-center"
                >
                  {/* IMAGE */}
                  <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden bg-navy/5 shrink-0">
                    {blog.cover_image?.url ? (
                      <img
                        src={blog.cover_image.url}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-navy/40">
                        No image
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-semibold text-lg text-navy truncate">
                        {blog.title}
                      </h2>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          blog.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {blog.status}
                      </span>
                    </div>

                    {blog.excerpt && (
                      <p className="text-sm text-navy/60 line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-navy/40">
                      <span>Slug: {blog.slug}</span>

                      {blog.target_keyword && (
                        <span>Keyword: {blog.target_keyword}</span>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(blog)}
                      className="p-2 rounded-lg border border-navy/10 text-navy hover:bg-navy/5 transition"
                      title="Edit"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(blog)}
                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CREATE / EDIT MODAL */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
              {/* MODAL HEADER */}
              <div className="sticky top-0 z-10 bg-white border-b border-navy/10 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy">
                    {editingId ? "Edit Blog" : "Create Blog"}
                  </h2>

                  <p className="text-xs text-navy/50 mt-1">
                    Add SEO-friendly travel content.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="p-2 rounded-full hover:bg-navy/5 text-navy/70"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* TITLE */}
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">
                    Title *
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Best Places to Visit in Kerala"
                    maxLength={220}
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 outline-none focus:border-secondary"
                    required
                  />
                </div>

                {/* EXCERPT */}
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">
                    Excerpt
                  </label>

                  <textarea
                    name="excerpt"
                    value={form.excerpt}
                    onChange={handleChange}
                    placeholder="Short description of the blog..."
                    rows={3}
                    maxLength={400}
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 outline-none focus:border-secondary resize-none"
                  />
                </div>

                {/* COVER IMAGE */}
                <ImageUploadField
                  value={form.cover_image}
                  onChange={(image) =>
                    setForm((prev) => ({
                      ...prev,
                      cover_image: image,
                    }))
                  }
                  onBusyChange={setCoverUploading}
                  label="Cover Image"
                />

                {/* BLOG PHOTOS & VIDEOS */}
                <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        Blog Photos & Videos
                      </p>

                      <p className="text-xs text-navy/50 mt-1">
                        Add photos one at a time (you can crop each one
                        before it uploads) and add videos as YouTube
                        links. They appear before the article text on
                        the blog page.
                      </p>
                    </div>

                    {form.media.length > 0 && (
                      <span className="shrink-0 rounded-full bg-navy/5 px-2.5 py-1 text-xs font-semibold text-navy/60">
                        {form.media.length}{" "}
                        {form.media.length === 1 ? "file" : "files"}
                      </span>
                    )}
                  </div>

                  {/* PHOTOS: crop, upload, then the slot clears for the next one */}
                  <ImageUploadField
                    value={null}
                    onChange={addPhoto}
                    onBusyChange={setMediaBusy}
                    disabled={saving}
                    label="Add a photo"
                    size="lg"
                    resetOnSuccess
                  />

                  {/* VIDEOS (YouTube links, nothing is uploaded) */}
                  <div className="mt-4 rounded-lg border border-navy/10 bg-white p-3">
                    <label
                      htmlFor="blog-youtube-link"
                      className="block text-xs font-semibold text-navy mb-1.5"
                    >
                      Add a YouTube video
                    </label>

                    <div className="flex gap-2">
                      <input
                        id="blog-youtube-link"
                        type="url"
                        inputMode="url"
                        value={videoLink}
                        onChange={(e) => {
                          setVideoLink(e.target.value);
                          if (videoError) setVideoError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addVideoLink();
                          }
                        }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        disabled={saving}
                        className="min-w-0 flex-1 border border-navy/15 rounded-lg px-3 py-2 text-sm outline-none focus:border-secondary"
                      />

                      <button
                        type="button"
                        onClick={addVideoLink}
                        disabled={saving || !videoLink.trim()}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={15} />
                        Add video
                      </button>
                    </div>

                    {videoError ? (
                      <p className="mt-1.5 text-xs text-red-600">
                        {videoError}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-navy/50">
                        Paste any YouTube link (watch, youtu.be or
                        Shorts). Only the link is saved.
                      </p>
                    )}
                  </div>

                  {/* MEDIA PREVIEW */}
                  {form.media.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50 mb-2">
                        In this blog ({form.media.length})
                      </p>

                      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {form.media.map((media, index) => {
                          const youTubeId =
                            media.type === "video"
                              ? getYouTubeId(media.url)
                              : "";

                          return (
                            <li
                              key={`${media.url}-${index}`}
                              className="overflow-hidden rounded-lg border border-navy/10 bg-white"
                            >
                              <div className="relative aspect-video w-full bg-navy/5">
                                {youTubeId ? (
                                  <>
                                    <img
                                      src={getYouTubeThumbnail(youTubeId)}
                                      alt=""
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />

                                    <span
                                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                      aria-hidden="true"
                                    >
                                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-dark/70 text-ivory">
                                        <Play
                                          size={18}
                                          className="ml-0.5 fill-current"
                                        />
                                      </span>
                                    </span>
                                  </>
                                ) : media.type === "video" ? (
                                  /* Older blogs that still have an uploaded video */
                                  <video
                                    src={getVideoSrc(media.url)}
                                    poster={getVideoPoster(media.url)}
                                    preload="metadata"
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  /* object-contain so a cropped photo is shown whole */
                                  <img
                                    src={media.url}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-contain"
                                  />
                                )}

                                {/* TYPE BADGE */}
                                <span className="absolute left-2 top-2 rounded-full bg-navy-dark/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-ivory">
                                  {youTubeId ? "YouTube" : media.type}
                                </span>

                                {/* REMOVE */}
                                <button
                                  type="button"
                                  onClick={() => removeMedia(index)}
                                  aria-label={`Remove ${media.type}`}
                                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy-dark/70 text-ivory hover:bg-red-600"
                                >
                                  <X size={14} />
                                </button>

                                {/* REORDER */}
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveMedia(index, -1)}
                                    disabled={index === 0}
                                    aria-label="Move earlier"
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-dark/70 text-ivory hover:bg-navy-dark disabled:opacity-40"
                                  >
                                    <ChevronUp size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => moveMedia(index, 1)}
                                    disabled={index === form.media.length - 1}
                                    aria-label="Move later"
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-dark/70 text-ivory hover:bg-navy-dark disabled:opacity-40"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* CAPTION */}
                              <input
                                type="text"
                                value={media.caption}
                                onChange={(e) =>
                                  changeMediaCaption(index, e.target.value)
                                }
                                placeholder="Caption (optional)"
                                maxLength={200}
                                className="w-full border-t border-navy/10 px-3 py-2 text-sm outline-none focus:bg-navy/[0.03]"
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">
                    Content *
                  </label>

                  <textarea
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder="Write your complete blog content..."
                    rows={12}
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 outline-none focus:border-secondary resize-y"
                    required
                  />
                </div>

                {/* TARGET KEYWORD */}
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">
                    Target Keyword
                  </label>

                  <input
                    type="text"
                    name="target_keyword"
                    value={form.target_keyword}
                    onChange={handleChange}
                    placeholder="kerala tourist places"
                    maxLength={150}
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 outline-none focus:border-secondary"
                  />
                </div>

                {/* META DESCRIPTION */}
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">
                    Meta Description
                  </label>

                  <textarea
                    name="meta_description"
                    value={form.meta_description}
                    onChange={handleChange}
                    placeholder="Discover the best places to visit in Kerala..."
                    maxLength={300}
                    rows={3}
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 outline-none focus:border-secondary resize-none"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-navy/15 rounded-lg px-4 py-3 bg-white outline-none focus:border-secondary"
                  >
                    <option value="draft">Draft</option>

                    <option value="published">Published</option>
                  </select>
                </div>

                {/* FORM ERROR */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* FORM ACTIONS */}
                <div className="flex justify-end gap-3 pt-3 border-t border-navy/10">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg border border-navy/15 text-navy hover:bg-navy/5 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="px-6 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving
                      ? "Saving..."
                      : uploading
                      ? "Uploading..."
                      : editingId
                      ? "Update Blog"
                      : "Create Blog"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}





