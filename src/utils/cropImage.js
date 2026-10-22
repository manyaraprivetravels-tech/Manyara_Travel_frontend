

const MAX_OUTPUT_EDGE = 2400;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the image."));
    image.src = src;
  });
}

/* PNG stays PNG (transparency); JPEG stays JPEG; WebP/AVIF become WebP. */
function pickOutput(mime) {
  const type = String(mime || "").toLowerCase();

  if (type === "image/png") return { type: "image/png", ext: "png", quality: undefined };
  if (type === "image/jpeg" || type === "image/jpg") {
    return { type: "image/jpeg", ext: "jpg", quality: 0.92 };
  }
  return { type: "image/webp", ext: "webp", quality: 0.92 };
}

/*
  src        an object URL (same origin, so the canvas is never "tainted")
  pixelCrop  { x, y, width, height } in the image's own pixels (from react-easy-crop)
*/
export async function getCroppedFile(src, pixelCrop, { name = "image", mime = "image/jpeg" } = {}) {
  const image = await loadImage(src);

  const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(pixelCrop.width, pixelCrop.height));
  const width = Math.max(1, Math.round(pixelCrop.width * scale));
  const height = Math.max(1, Math.round(pixelCrop.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cropping is not supported in this browser.");

  const output = pickOutput(mime);

  if (output.type === "image/jpeg") {
    ctx.fillStyle = "#ffffff"; // JPEG has no transparency
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, output.type, output.quality);
  });

  if (!blob) throw new Error("Could not export the cropped image.");

  const baseName = String(name).replace(/\.[^.]+$/, "") || "image";

  return new File([blob], `${baseName}.${output.ext}`, { type: output.type });
}











































