

import { useEffect, useRef, useState } from "react";
import { uploadImage } from "../../api/adminUsers";

const DEFAULT_MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];


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
}) {
  const abortRef = useRef(null);
  const fileRef = useRef(null);
  const objectUrlRef = useRef(null);
  const statusRef = useRef("idle");

  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | error
  const [error, setError] = useState("");

  const layout = SIZES[size] || SIZES.sm;

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

  /* Tell the parent when an upload is running. */
  useEffect(() => {
    onBusyChange?.(status === "uploading");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  /* Parent cleared the value (e.g. form reset after saving). */
  useEffect(() => {
    if (!value && statusRef.current === "idle") {
      clearPreview();
      fileRef.current = null;
      setProgress(0);
    }
  }, [value]);

  /* Cleanup on unmount. */
  useEffect(() => {
    return () => {
      abortRef.current?.abort();

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
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

  const handleFile = (e) => {
    const file = e.target.files?.[0];

    // Reset so choosing the same file again still triggers onChange.
    e.target.value = "";

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image is too large. Maximum size is ${maxSizeMB} MB.`);
      return;
    }

    abortRef.current?.abort();
    clearPreview();

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    fileRef.current = file;

    setPreview(url);
    startUpload(file);
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
    fileRef.current = null;

    updateStatus("idle");
    setProgress(0);
    setError("");
    onChange(null);
  };

  /* ---------- render ---------- */

  // Keep showing the local preview after upload so the image doesn't flash.
  const displayUrl = preview || value?.url || "";
  const isUploading = status === "uploading";
  const isError = status === "error";

  return (
    <div>
      <p className="block text-sm font-medium text-navy mb-1.5">{label}</p>

      {displayUrl ? (
        <div
          className={`relative ${layout.box} rounded-lg overflow-hidden border border-navy/15 bg-surface`}
        >
          <img src={displayUrl} alt="" className={layout.img} />

          {/* Upload progress: 0 -> 100% */}
          {isUploading && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy-dark/70 px-3 text-ivory"
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
                  className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Failed upload */}
          {isError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/70 px-3 text-ivory">
              <span className="text-xs font-semibold">Upload failed</span>

              <button
                type="button"
                onClick={handleRetry}
                disabled={disabled}
                className="rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-navy hover:bg-white"
              >
                Retry
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled && !isUploading}
            aria-label={isUploading ? "Cancel upload" : "Remove image"}
            className="absolute top-1 right-1 bg-navy-dark/70 text-ivory rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <label
          className={`flex items-center justify-center ${layout.empty} rounded-lg border-2 border-dashed border-navy/25 text-navy/40 text-xs text-center transition-colors ${
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-secondary hover:text-secondary"
          }`}
        >
          Click to upload
          <input
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFile}
            disabled={disabled}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}












































// import { useEffect, useRef, useState } from "react";
// import { uploadImage } from "../../api/adminUsers";

// const DEFAULT_MAX_SIZE_MB = 5;
// const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];


// export default function ImageUploadField({
//   value,
//   onChange,
//   label = "Image",
//   onBusyChange,
//   disabled = false,
//   maxSizeMB = DEFAULT_MAX_SIZE_MB,
//   uploadEndpoint,
// }) {
//   const abortRef = useRef(null);
//   const fileRef = useRef(null);
//   const objectUrlRef = useRef(null);
//   const statusRef = useRef("idle");

//   const [preview, setPreview] = useState("");
//   const [progress, setProgress] = useState(0);
//   const [status, setStatus] = useState("idle"); // idle | uploading | error
//   const [error, setError] = useState("");

//   /* ---------- helpers ---------- */

//   const updateStatus = (next) => {
//     statusRef.current = next;
//     setStatus(next);
//   };

//   const clearPreview = () => {
//     if (objectUrlRef.current) {
//       URL.revokeObjectURL(objectUrlRef.current);
//       objectUrlRef.current = null;
//     }

//     setPreview("");
//   };

//   /* Tell the parent when an upload is running. */
//   useEffect(() => {
//     onBusyChange?.(status === "uploading");
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [status]);

//   /* Parent cleared the value (e.g. form reset after saving). */
//   useEffect(() => {
//     if (!value && statusRef.current === "idle") {
//       clearPreview();
//       fileRef.current = null;
//       setProgress(0);
//     }
//   }, [value]);

//   /* Cleanup on unmount. */
//   useEffect(() => {
//     return () => {
//       abortRef.current?.abort();

//       if (objectUrlRef.current) {
//         URL.revokeObjectURL(objectUrlRef.current);
//       }
//     };
//   }, []);

//   /* ---------- upload ---------- */

//   const startUpload = async (file) => {
//     const controller = new AbortController();
//     abortRef.current = controller;

//     updateStatus("uploading");
//     setProgress(0);
//     setError("");

//     try {
//       const result = await uploadImage(file, {
//         onProgress: (percent) =>
//           setProgress(Math.min(100, Math.max(0, Math.round(percent)))),
//         signal: controller.signal,
//         endpoint: uploadEndpoint,
//       });

//       if (controller.signal.aborted) return;

//       setProgress(100);
//       updateStatus("idle");
//       onChange(result);
//     } catch (err) {
//       if (controller.signal.aborted) return;

//       const detail = err?.response?.data?.detail;

//       updateStatus("error");
//       setProgress(0);
//       setError(
//         typeof detail === "string" && detail
//           ? detail
//           : "Upload failed. Try a smaller image."
//       );
//       onChange(null);
//     } finally {
//       if (abortRef.current === controller) {
//         abortRef.current = null;
//       }
//     }
//   };

//   const handleFile = (e) => {
//     const file = e.target.files?.[0];

//     // Reset so choosing the same file again still triggers onChange.
//     e.target.value = "";

//     if (!file) return;

//     if (!ACCEPTED_TYPES.includes(file.type)) {
//       setError("Please choose a JPG, PNG or WebP image.");
//       return;
//     }

//     if (file.size > maxSizeMB * 1024 * 1024) {
//       setError(`Image is too large. Maximum size is ${maxSizeMB} MB.`);
//       return;
//     }

//     abortRef.current?.abort();
//     clearPreview();

//     const url = URL.createObjectURL(file);
//     objectUrlRef.current = url;
//     fileRef.current = file;

//     setPreview(url);
//     startUpload(file);
//   };

//   const handleRetry = () => {
//     if (fileRef.current) {
//       startUpload(fileRef.current);
//     }
//   };

//   /* X button: cancels an upload in progress, or removes the image. */
//   const handleRemove = () => {
//     abortRef.current?.abort();
//     abortRef.current = null;

//     clearPreview();
//     fileRef.current = null;

//     updateStatus("idle");
//     setProgress(0);
//     setError("");
//     onChange(null);
//   };

//   /* ---------- render ---------- */

//   // Keep showing the local preview after upload so the image doesn't flash.
//   const displayUrl = preview || value?.url || "";
//   const isUploading = status === "uploading";
//   const isError = status === "error";

//   return (
//     <div>
//       <p className="block text-sm font-medium text-navy mb-1.5">{label}</p>

//       {displayUrl ? (
//         <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-navy/15">
//           <img src={displayUrl} alt="" className="w-full h-full object-cover" />

//           {/* Upload progress: 0 -> 100% */}
//           {isUploading && (
//             <div
//               className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy-dark/70 px-3 text-ivory"
//               role="status"
//               aria-live="polite"
//             >
//               <span className="text-sm font-semibold">
//                 {progress < 100 ? `${progress}%` : "Processing…"}
//               </span>

//               <div
//                 className="h-1.5 w-full overflow-hidden rounded-full bg-white/25"
//                 role="progressbar"
//                 aria-label="Upload progress"
//                 aria-valuemin={0}
//                 aria-valuemax={100}
//                 aria-valuenow={progress}
//               >
//                 <div
//                   className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out motion-reduce:transition-none"
//                   style={{ width: `${progress}%` }}
//                 />
//               </div>
//             </div>
//           )}

//           {/* Failed upload */}
//           {isError && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/70 px-3 text-ivory">
//               <span className="text-xs font-semibold">Upload failed</span>

//               <button
//                 type="button"
//                 onClick={handleRetry}
//                 disabled={disabled}
//                 className="rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-navy hover:bg-white"
//               >
//                 Retry
//               </button>
//             </div>
//           )}

//           <button
//             type="button"
//             onClick={handleRemove}
//             disabled={disabled && !isUploading}
//             aria-label={isUploading ? "Cancel upload" : "Remove image"}
//             className="absolute top-1 right-1 bg-navy-dark/70 text-ivory rounded-full w-6 h-6 flex items-center justify-center text-xs"
//           >
//             ✕
//           </button>
//         </div>
//       ) : (
//         <label
//           className={`flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-navy/25 text-navy/40 text-xs text-center transition-colors ${
//             disabled
//               ? "cursor-not-allowed opacity-60"
//               : "cursor-pointer hover:border-secondary hover:text-secondary"
//           }`}
//         >
//           Click to upload
//           <input
//             type="file"
//             accept={ACCEPTED_TYPES.join(",")}
//             onChange={handleFile}
//             disabled={disabled}
//             className="hidden"
//           />
//         </label>
//       )}

//       {error && (
//         <p className="text-xs text-red-600 mt-1" role="alert">
//           {error}
//         </p>
//       )}
//     </div>
//   );
// }







