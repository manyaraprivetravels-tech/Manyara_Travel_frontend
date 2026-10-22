

export const PACKAGE_TYPE_LABELS = {
  pilgrimage: "Pilgrimage",
  mountains_adventure: "Mountains & Adventure",
  romantic: "Romantic",
  international: "International",
  beach: "Beach",
  family: "Family",
  wildlife_nature: "Wildlife & Nature",
};

const TYPE_ALIASES = {
  mountains_and_adventure: "mountains_adventure",
  mountain_adventure: "mountains_adventure",
  mountains: "mountains_adventure",
  adventure: "mountains_adventure",
  wildlife_and_nature: "wildlife_nature",
  wildlife: "wildlife_nature",
  nature: "wildlife_nature",
};

export function getSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

export const normalizePackageType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s-]+/g, "_");
  return TYPE_ALIASES[normalized] || normalized;
};

export const getPackageTypeLabel = (type) => {
  const normalized = normalizePackageType(type);
  return (
    PACKAGE_TYPE_LABELS[normalized] ||
    String(type || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

export const getPackageRegion = (pkg) => {
  const region = String(pkg?.region || "").trim().toLowerCase();
  if (region === "domestic" || region === "international") return region;
  return normalizePackageType(pkg?.package_type || pkg?.type) === "international"
    ? "international"
    : "domestic";
};

export const isPublished = (pkg) =>
  pkg?.status === undefined || pkg?.status === "published" || pkg?.is_published === true;

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image.trim();
  return image.url || image.secure_url || image.src || image.image_url || "";
};

export const getPackageImage = (pkg) => {
  if (Array.isArray(pkg?.images)) {
    const first = pkg.images.map(getImageUrl).find(Boolean);
    if (first) return first;
  }
  return getImageUrl(pkg?.image) || pkg?.image_url || "";
};

const getPlaceName = (place) => place?.place_name || place?.name || place?.title || "";

/* Seasonal packages have destination = null, so fall back like PackageDetail does. */
export const getPackageDestination = (pkg) =>
  pkg?.destination ||
  getPlaceName(pkg?.seasoned_destination_obj) ||
  getPlaceName(pkg?.seasoned_destination) ||
  "";

export const formatDuration = (days, nights) => {
  const numericDays = Number(days);
  if (!numericDays || Number.isNaN(numericDays)) return "";
  const daysText = `${numericDays} ${numericDays === 1 ? "day" : "days"}`;
  if (nights === undefined || nights === null) return daysText;
  return `${daysText} / ${nights} ${Number(nights) === 1 ? "night" : "nights"}`;
};