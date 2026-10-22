

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { getCroppedFile } from "../../utils/cropImage";

const ASPECT_OPTIONS = [
  { key: "original", label: "Original" },
  { key: "1", label: "1:1", value: 1 },
  { key: "4/3", label: "4:3", value: 4 / 3 },
  { key: "3/2", label: "3:2", value: 3 / 2 },
  { key: "16/9", label: "16:9", value: 16 / 9 },
  { key: "4/5", label: "4:5", value: 4 / 5 },
];

/*
  Props
    src             object URL of the image to crop
    fileName, mime  used to name / encode the cropped file
    isNew           true for a freshly chosen file, false when adjusting an existing image
    lockedAspect    number: fixes the ratio and hides the ratio buttons
    onCancel        () => void
    onConfirm       (file) => void | Promise   may throw an Error(message) to show it here
    onNoChange      () => void   called when the frame covers the whole image
*/
export default function ImageCropModal({
  src,
  fileName,
  mime,
  isNew = true,
  lockedAspect,
  onCancel,
  onConfirm,
  onNoChange,
}) {
  const [media, setMedia] = useState(null); // { w, h }
  const [loadError, setLoadError] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectKey, setAspectKey] = useState("original");
  const [areaPixels, setAreaPixels] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const dialogRef = useRef(null);
  const cancelRef = useRef(onCancel);
  const processingRef = useRef(false);

  cancelRef.current = onCancel;
  processingRef.current = processing;

  /* Load the image once to read its size (and to catch formats the browser cannot decode). */
  useEffect(() => {
    let active = true;
    const image = new Image();

    image.onload = () => {
      if (active) setMedia({ w: image.naturalWidth, h: image.naturalHeight });
    };
    image.onerror = () => {
      if (active) setLoadError(true);
    };
    image.src = src;

    return () => {
      active = false;
    };
  }, [src]);

  /* Scroll lock, focus, and Esc. Esc is caught first so it never closes a modal underneath. */
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (!processingRef.current) cancelRef.current();
    };

    window.addEventListener("keydown", onKey, true);

    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  const aspect = useMemo(() => {
    if (lockedAspect) return lockedAspect;
    if (aspectKey === "original") return media ? media.w / media.h : 1;
    return ASPECT_OPTIONS.find((option) => option.key === aspectKey)?.value || 1;
  }, [lockedAspect, aspectKey, media]);

  const changeAspect = (key) => {
    setAspectKey(key);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleConfirm = async () => {
    if (!areaPixels || !media || processing) return;

    setProcessing(true);
    setError("");

    try {
      const coversWholeImage =
        areaPixels.width >= media.w - 1 && areaPixels.height >= media.h - 1;

      /* Nothing was cropped: keep the original file as it is (no re-encoding). */
      if (coversWholeImage) {
        onNoChange?.();
        return;
      }

      const file = await getCroppedFile(src, areaPixels, { name: fileName, mime });
      await onConfirm(file);
    } catch (err) {
      setError(err?.message || "Could not crop this image. Try another one.");
    } finally {
      setProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-900/70 p-2 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Crop image"
        tabIndex={-1}
        className="flex max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-800">Adjust image</h2>
            <p className="text-xs text-ink-400">
              Drag to move the photo, use the slider to zoom.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            aria-label="Close"
            className="shrink-0 rounded-full px-2 text-xl leading-none text-ink-400 hover:text-ink-800 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Crop area */}
        <div className="relative h-[46vh] min-h-[260px] w-full shrink-0 bg-ink-900">
          {loadError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-white">
              <p>This browser cannot open this image for cropping.</p>

              {isNew && (
                <button
                  type="button"
                  onClick={onNoChange}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-rose-50"
                >
                  Upload without cropping
                </button>
              )}
            </div>
          ) : !media ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
              Loading…
            </div>
          ) : (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              minZoom={1}
              maxZoom={4}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setAreaPixels(pixels)}
            />
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {!lockedAspect && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                Shape
              </p>

              <div className="flex flex-wrap gap-2">
                {ASPECT_OPTIONS.map((option) => {
                  const selected = aspectKey === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => changeAspect(option.key)}
                      aria-pressed={selected}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        selected
                          ? "border-ink-800 bg-ink-800 text-white"
                          : "border-border bg-white text-ink-700 hover:border-ink-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="crop-zoom"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400"
            >
              Zoom
            </label>

            <input
              id="crop-zoom"
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              disabled={!media || loadError}
              className="w-full accent-rose-600"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-600 hover:bg-surface disabled:opacity-50"
            >
              Cancel
            </button>

            {isNew && !loadError && (
              <button
                type="button"
                onClick={onNoChange}
                disabled={processing}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface disabled:opacity-50"
              >
                Skip crop
              </button>
            )}

            {!loadError && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!areaPixels || processing}
                className="rounded-lg bg-ink-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? "Cropping…" : isNew ? "Crop & upload" : "Apply crop"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

