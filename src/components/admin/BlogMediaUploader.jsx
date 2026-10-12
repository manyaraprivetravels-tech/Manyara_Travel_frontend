


import { useEffect, useRef, useState } from "react";
import { Film, ImagePlus, RotateCcw, X, CheckCircle2 } from "lucide-react";
import { uploadImage, uploadVideo } from "../../api/adminUsers";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const DEFAULT_MAX_IMAGE_MB = 5; // keep in sync with settings.MAX_UPLOAD_MB
const DEFAULT_MAX_VIDEO_MB = 50; // keep in sync with settings.MAX_VIDEO_UPLOAD_MB

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


export default function BlogMediaUploader({
  onInsert,
  onBusyChange,
  disabled = false,
  maxImageMB = DEFAULT_MAX_IMAGE_MB,
  maxVideoMB = DEFAULT_MAX_VIDEO_MB,
}) {
  const inputRef = useRef(null);
  const onInsertRef = useRef(onInsert);
  const activeRef = useRef(null); // id of the item currently uploading
  const controllersRef = useRef(new Map());
  const mountedRef = useRef(true);
  const idRef = useRef(0);

  const [items, setItems] = useState([]); // { id, file, type, status, progress, error, previewUrl }
  const [problems, setProblems] = useState([]);

  onInsertRef.current = onInsert;

  const patchItem = (id, patch) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const removeItem = (id) =>
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);

      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);

      return prev.filter((item) => item.id !== id);
    });

  /* ---------- lifecycle ---------- */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      controllersRef.current.forEach((controller) => controller.abort());
    };
  }, []);

  useEffect(() => {
    const busy = items.some((i) => i.status === "queued" || i.status === "uploading");

    onBusyChange?.(busy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  /* Upload the queue one file at a time, in the order chosen. */
  useEffect(() => {
    if (activeRef.current) return;

    const next = items.find((item) => item.status === "queued");

    if (next) startUpload(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  /* ---------- upload ---------- */

  const startUpload = async (item) => {
    const controller = new AbortController();

    activeRef.current = item.id;
    controllersRef.current.set(item.id, controller);
    patchItem(item.id, { status: "uploading", progress: 0, error: "" });

    const upload = item.type === "video" ? uploadVideo : uploadImage;

    try {
      const result = await upload(item.file, {
        onProgress: (percent) =>
          patchItem(item.id, {
            progress: Math.min(100, Math.max(0, Math.round(percent))),
          }),
        signal: controller.signal,
      });

      if (controller.signal.aborted || !mountedRef.current) return;

      onInsertRef.current?.([{ type: item.type, url: result.url, caption: "" }]);

      patchItem(item.id, { status: "done", progress: 100 });

      setTimeout(() => {
        if (mountedRef.current) removeItem(item.id);
      }, 1500);
    } catch (err) {
      if (controller.signal.aborted || !mountedRef.current) return;

      const detail = err?.response?.data?.detail;

      patchItem(item.id, {
        status: "error",
        progress: 0,
        error:
          typeof detail === "string" && detail
            ? detail
            : "Upload failed. Please try again.",
      });
    } finally {
      controllersRef.current.delete(item.id);

      // Only release the slot if it is still ours (a cancelled upload must
      // not free the slot of the next file that has already started).
      if (activeRef.current === item.id) {
        activeRef.current = null;
      }
    }
  };

  /* ---------- picking files ---------- */

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);

    // Reset so the same files can be chosen again.
    event.target.value = "";

    if (files.length === 0) return;

    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      const isImage = IMAGE_TYPES.includes(file.type);
      const isVideo = VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        rejected.push(`${file.name}: only JPG, PNG, WebP, MP4, WebM or MOV files are allowed.`);
        return;
      }

      const limit = isVideo ? maxVideoMB : maxImageMB;

      if (file.size > limit * 1024 * 1024) {
        rejected.push(
          `${file.name}: too large (${formatSize(file.size)}). Max ${limit} MB for ${
            isVideo ? "videos" : "photos"
          }.`
        );
        return;
      }

      idRef.current += 1;

      accepted.push({
        id: idRef.current,
        file,
        type: isVideo ? "video" : "image",
        status: "queued",
        progress: 0,
        error: "",
        previewUrl: isImage ? URL.createObjectURL(file) : "",
      });
    });

    setProblems(rejected);

    if (accepted.length > 0) {
      setItems((prev) => [...prev, ...accepted]);
    }
  };

  const handleCancel = (item) => {
    controllersRef.current.get(item.id)?.abort();
    controllersRef.current.delete(item.id);

    if (activeRef.current === item.id) {
      activeRef.current = null;
    }

    removeItem(item.id);
  };

  const handleRetry = (item) => patchItem(item.id, { status: "queued", error: "", progress: 0 });

  /* ---------- render ---------- */

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
        onChange={handleFiles}
        disabled={disabled}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-navy/25 px-4 py-5 text-center text-navy/60 transition-colors hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ImagePlus size={18} aria-hidden="true" />
          Add photos &amp; videos
        </span>

        <span className="text-xs text-navy/45">
          Select several at once. Photos (JPG, PNG, WebP) up to {maxImageMB} MB, videos (MP4,
          WebM, MOV) up to {maxVideoMB} MB.
        </span>
      </button>

      {problems.length > 0 && (
        <ul className="mt-2 space-y-1" role="alert">
          {problems.map((problem) => (
            <li key={problem} className="text-xs text-red-600">
              {problem}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-navy/10 bg-white p-2.5">
              <div className="flex items-center gap-3">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-navy/5 text-navy/50">
                    <Film size={20} aria-hidden="true" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy">{item.file.name}</p>

                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy/55">
                    {item.status === "queued" && <span>Waiting…</span>}

                    {item.status === "uploading" && (
                      <span aria-live="polite">
                        {item.progress < 100 ? `Uploading… ${item.progress}%` : "Processing…"}
                      </span>
                    )}

                    {item.status === "done" && (
                      <>
                        <CheckCircle2 size={14} className="text-green-600" aria-hidden="true" />
                        <span>Added to your content</span>
                      </>
                    )}

                    {item.status === "error" && (
                      <span className="text-red-600">{item.error}</span>
                    )}

                    <span className="text-navy/35">· {formatSize(item.file.size)}</span>
                  </p>
                </div>

                {item.status === "error" && (
                  <button
                    type="button"
                    onClick={() => handleRetry(item)}
                    aria-label="Retry upload"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-navy/60 hover:bg-navy/5"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                  </button>
                )}

                {item.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => handleCancel(item)}
                    aria-label={item.status === "uploading" ? "Cancel upload" : "Remove from list"}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-navy/60 hover:bg-navy/5"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              {(item.status === "uploading" || item.status === "done") && (
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy/10"
                  role="progressbar"
                  aria-label={`Upload progress for ${item.file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.progress}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none ${
                      item.status === "done" ? "bg-green-500" : "bg-secondary"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}