

const TRANSFORM_PART = /^[a-z]{1,3}_[^,/]+$/;

function hasTransformation(url) {
  const match = url.match(/\/upload\/([^/]+)\//);
  if (!match) return false;
  const first = match[1];
  if (/^v\d+$/.test(first)) return false; // version segment, not a transform
  return first.split(",").every((part) => TRANSFORM_PART.test(part));
}

export function cld(url, width) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  if (hasTransformation(url)) return url;

  // Works with and without the /v123/ version segment.
  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,c_limit,w_${width}/`,
  );
}

export function cldSrcSet(url, widths = [480, 768, 1280, 1920]) {
  return widths.map((w) => `${cld(url, w)} ${w}w`).join(", ");
}

/* Tiny blurred placeholder (about 1 KB), handy as a background while the
   full image loads. */
export function cldBlur(url) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  if (hasTransformation(url)) return url;
  return url.replace("/upload/", "/upload/f_auto,q_30,w_40,e_blur:800/");
}


