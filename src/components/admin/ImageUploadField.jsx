

import { useEffect, useRef, useState } from "react";
import { uploadImage } from "../../api/adminUsers";
import ImageCropModal from "./ImageCropModal";

const DEFAULT_MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

const isAcceptedFile = (file) => {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return (
    ACCEPTED_TYPES.includes(type) ||
    ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
};

/* Some browsers leave file.type empty (AVIF especially). */
const mimeFromFile = (file) => {
  const type = (file.type || "").toLowerCase();
  if (type) return type;

  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
};

const fileNameFromUrl = (url) => {
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop();
    return last || "image";
  } catch {
    return "image";
  }
};

const SIZES = {
  sm: {
    box: "w-32 h-32",
    img: "w-full h-full object-contain",
    empty: "w-32 h-32",
  },
  lg: {
    box: "w-full max-w-sm min-h-[7rem]",
    img: "block w-full h-auto max-h-72 object-contain",
    empty: "w-full max-w-sm h-40",
  },
  tile: {
    box: "w-full h-full",
    img: "w-full h-full object-contain",
    empty: "w-full h-full min-h-[6rem]",
  },
};

export default function ImageUploadField({
  value,
  onChange,
  label = "Image",
  onBusyChange,
  disabled = false,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  uploadEndpoint,
  size = "sm",
  // Clear the local preview after a successful upload. Use this when the
  // parent keeps its own list of images and this field is just an "add" slot.
  resetOnSuccess = false,
  // Open a crop step before uploading, and show a "Crop" button on the preview.
  // Pass allowCrop={false} for public forms (e.g. customer review photos).
  allowCrop = true,
  // Lock the crop shape to one ratio (e.g. 4 / 3) and hide the ratio buttons.
  aspect,
}) {
  const abortRef = useRef(null);
  const fileRef = useRef(null);
  const objectUrlRef = useRef(null);
  const statusRef = useRef("idle");
  const busyCbRef = useRef(onBusyChange);

  /* The photo the admin picked this session, kept so "Crop" can start from the full picture. */
  const originalRef = useRef(null); // { file, url }

  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | error
  const [error, setError] = useState("");

  const [cropSource, setCropSource] = useState(null); // { src, name, mime, isNew, temp }
  const [loadingSource, setLoadingSource] = useState(false);

  const layout = SIZES[size] || SIZES.sm;

  busyCbRef.current = onBusyChange;

  /* ---------- helpers ---------- */

  const updateStatus = (next) => {
    statusRef.current = next;
    setStatus(next);
  };

  const clearPreview = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPreview("");
  };

  const discardOriginal = () => {
    if (originalRef.current) {
      URL.revokeObjectURL(originalRef.current.url);
      originalRef.current = null;
    }
  };

  /* Tell the parent when an upload is running. */
  useEffect(() => {
    busyCbRef.current?.(status === "uploading");
  }, [status]);

  /* Parent cleared the value (e.g. form reset after saving). */
  useEffect(() => {
    if (!value && statusRef.current === "idle") {
      clearPreview();
      discardOriginal();
      fileRef.current = null;
      setProgress(0);
    }
  }, [value]);

  /* Cleanup on unmount. Also tells the parent we are no longer busy. */
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      busyCbRef.current?.(false);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      if (originalRef.current) {
        URL.revokeObjectURL(originalRef.current.url);
      }
    };
  }, []);

  /* ---------- upload ---------- */

  const startUpload = async (file) => {
    const controller = new AbortController();
    abortRef.current = controller;

    updateStatus("uploading");
    setProgress(0);
    setError("");

    try {
      const result = await uploadImage(file, {
        onProgress: (percent) =>
          setProgress(Math.min(100, Math.max(0, Math.round(percent)))),
        signal: controller.signal,
        endpoint: uploadEndpoint,
      });

      if (controller.signal.aborted) return;

      setProgress(100);
      updateStatus("idle");
      onChange(result);

      if (resetOnSuccess) {
        clearPreview();
        discardOriginal();
        fileRef.current = null;
        setProgress(0);
      }
    } catch (err) {
      if (controller.signal.aborted) return;

      const detail = err?.response?.data?.detail;

      updateStatus("error");
      setProgress(0);
      setError(
        typeof detail === "string" && detail
          ? detail
          : "Upload failed. Try a smaller image."
      );
      onChange(null);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  /* Show a local preview and upload the file. */
  const applyFile = (file) => {
    abortRef.current?.abort();
    clearPreview();

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    fileRef.current = file;

    setPreview(url);
    startUpload(file);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];

    // Reset so choosing the same file again still triggers onChange.
    e.target.value = "";

    if (!file) return;

    if (!isAcceptedFile(file)) {
      setError("Please choose a JPG, PNG, WebP or AVIF image.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image is too large. Maximum size is ${maxSizeMB} MB.`);
      return;
    }

    setError("");

    if (!allowCrop) {
      applyFile(file);
      return;
    }

    /* Open the crop step; nothing uploads until the admin confirms. */
    discardOriginal();
    originalRef.current = { file, url: URL.createObjectURL(file) };

    setCropSource({
      src: originalRef.current.url,
      name: file.name,
      mime: mimeFromFile(file),
      isNew: true,
    });
  };

  const handleRetry = () => {
    if (fileRef.current) {
      startUpload(fileRef.current);
    }
  };

  /* X button: cancels an upload in progress, or removes the image. */
  const handleRemove = () => {
    abortRef.current?.abort();
    abortRef.current = null;

    clearPreview();
    discardOriginal();
    fileRef.current = null;

    updateStatus("idle");
    setProgress(0);
    setError("");
    onChange(null);
  };

  /* ---------- crop ---------- */

  const closeCrop = ({ discard = false } = {}) => {
    if (cropSource?.temp) URL.revokeObjectURL(cropSource.src);
    setCropSource(null);
    if (discard) discardOriginal();
  };

  const handleCropCancel = () => {
    closeCrop({ discard: Boolean(cropSource?.isNew) });
  };

  /* Nothing to crop: upload the original as it is (new file) or just close (existing image). */
  const handleCropNoChange = () => {
    if (cropSource?.isNew && originalRef.current) {
      const original = originalRef.current.file;
      closeCrop();
      applyFile(original);
      return;
    }

    closeCrop();
  };

  const handleCropConfirm = (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(
        `The cropped image is larger than ${maxSizeMB} MB. Choose a smaller area.`
      );
    }

    closeCrop();
    applyFile(file);
  };

  /* "Crop" button on the preview. */
  const handleAdjust = async () => {
    setError("");

    /* Picked this session: start from the full original photo. */
    if (originalRef.current) {
      const { file, url } = originalRef.current;

      setCropSource({
        src: url,
        name: file.name,
        mime: mimeFromFile(file),
        isNew: false,
      });
      return;
    }

    /* Already saved on the server: load the stored image. */
    const url = value?.url;
    if (!url) return;

    setLoadingSource(true);

    try {
      const response = await fetch(url, { mode: "cors", cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the image.");

      const blob = await response.blob();

      setCropSource({
        src: URL.createObjectURL(blob),
        name: fileNameFromUrl(url),
        mime: blob.type || "image/jpeg",
        isNew: false,
        temp: true,
      });
    } catch {
      setError("This image can't be edited here. Upload it again to crop it.");
    } finally {
      setLoadingSource(false);
    }
  };

  /* ---------- render ---------- */

  // Keep showing the local preview after upload so the image doesn't flash.
  const displayUrl = preview || value?.url || "";
  const isUploading = status === "uploading";
  const isError = status === "error";
  const canCrop = allowCrop && !disabled && !isUploading && !isError && Boolean(displayUrl);

  return (
    <div className={size === "tile" ? "h-full w-full" : undefined}>
      {label ? (
        <p className="mb-1.5 block text-sm font-medium text-ink-800">{label}</p>
      ) : null}

      {displayUrl ? (
        <div
          className={`relative ${layout.box} overflow-hidden rounded-lg border border-border bg-surface`}
        >
          <img src={displayUrl} alt="" className={layout.img} />

          {/* Upload progress: 0 -> 100% */}
          {isUploading && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/70 px-3 text-white"
              role="status"
              aria-live="polite"
            >
              <span className="text-sm font-semibold">
                {progress < 100 ? `${progress}%` : "Processing…"}
              </span>

              <div
                className="h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-white/25"
                role="progressbar"
                aria-label="Upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="h-full rounded-full bg-rose-500 transition-[width] duration-200 ease-out motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Failed upload */}
          {isError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/70 px-3 text-white">
              <span className="text-xs font-semibold">Upload failed</span>

              <button
                type="button"
                onClick={handleRetry}
                disabled={disabled}
                className="rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-ink-800 hover:bg-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Crop / adjust */}
          {canCrop && (
            <button
              type="button"
              onClick={handleAdjust}
              disabled={loadingSource}
              aria-label="Crop or adjust image"
              className="absolute bottom-1 left-1 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
            >
              {loadingSource ? "Loading…" : "Crop"}
            </button>
          )}

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled && !isUploading}
            aria-label={isUploading ? "Cancel upload" : "Remove image"}
            className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-xs font-bold text-ink-700 shadow hover:bg-rose-50 hover:text-rose-600"
          >
            ✕
          </button>
        </div>
      ) : (
        <label
          className={`flex items-center justify-center ${layout.empty} rounded-lg border-2 border-dashed border-rose-200 text-center text-xs text-ink-400 transition-colors ${
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-rose-400 hover:text-rose-600"
          }`}
        >
          Click to upload
          <input
            type="file"
            accept={[...ACCEPTED_TYPES, ...ACCEPTED_EXTENSIONS].join(",")}
            onChange={handleFile}
            disabled={disabled}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {cropSource && (
        <ImageCropModal
          src={cropSource.src}
          fileName={cropSource.name}
          mime={cropSource.mime}
          isNew={cropSource.isNew}
          lockedAspect={aspect}
          onCancel={handleCropCancel}
          onNoChange={handleCropNoChange}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}








