

// src/utils/cloudinary.js
export function cld(url, width) {
  if (!url) return url;
  // only touch un-transformed Cloudinary URLs: .../upload/v123/...
  return url.replace(
    /\/upload\/(?=v\d+\/)/,
    `/upload/f_auto,q_auto:best,c_limit,w_${width}/`
  );
}

export function cldSrcSet(url, widths = [480, 768, 1280, 1920]) {
  return widths.map((w) => `${cld(url, w)} ${w}w`).join(", ");
}