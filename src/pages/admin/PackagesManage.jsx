




import { useEffect, useMemo, useState } from "react";

import {
  getAllPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
} from "../../api/adminPackages";

import { getAllMostVisitedAdmin } from "../../api/adminMostVisited";

import {
  getAllSeasonedDestinations,
} from "../../api/adminSeasonedVisit";

import ImageUploadField from "../../components/admin/ImageUploadField";

// =========================================================
// PACKAGE TYPES
// =========================================================

const PACKAGE_TYPES = [
  {
    value: "pilgrimage",
    label: "Pilgrimage",
  },
  {
    value: "mountains_adventure",
    label: "Mountains & Adventure",
  },
  {
    value: "romantic",
    label: "Romantic",
  },
  {
    value: "international",
    label: "International",
  },
  {
    value: "beach",
    label: "Beach",
  },
  {
    value: "family",
    label: "Family",
  },
  {
    value: "wildlife_nature",
    label: "Wildlife & Nature",
  },
];

// =========================================================
// DISCOVERY OPTIONS
// =========================================================

const DISCOVERY_OPTIONS = [
  {
    key: "is_popular",
    label: "Popular",
    description: "Show in Popular Packages",
  },
  {
    key: "is_recommended",
    label: "Recommended",
    description: "Show in Recommended Packages",
  },
  {
    key: "is_trending",
    label: "Trending",
    description: "Show in Trending Packages",
  },
  {
    key: "is_featured",
    label: "Featured",
    description: "Show in Featured Packages",
  },
  {
    key: "is_new",
    label: "New",
    description: "Show in New Packages",
  },
  {
    key: "is_most_visited",
    label: "Most Visited",
    description: "Show in Most Visited Packages",
  },
];

// =========================================================
// EMPTY FORM
// =========================================================

const EMPTY_FORM = {
  title: "",

  // -------------------------------------------------------
  // Destination
  // -------------------------------------------------------
  destination_type: "regular",
  destination: "",
  destination_id: "",
  seasoned_destination_id: "",

  // -------------------------------------------------------
  // Package
  // -------------------------------------------------------
  package_type: "family",
  display_order: 0,
  price: "",
  duration_days: "",
  duration_nights: "",
  description: "",
  status: "draft",

  // -------------------------------------------------------
  // Discovery
  // -------------------------------------------------------
  is_popular: false,
  is_recommended: false,
  is_trending: false,
  is_featured: false,
  is_new: false,
  is_most_visited: false,

  // -------------------------------------------------------
  // Content
  // -------------------------------------------------------
  images: [],
  itinerary: [],
  facilities: [],
  inclusions: [],
  exclusions: [],

  // -------------------------------------------------------
  // Policies
  // -------------------------------------------------------
  terms_and_conditions: "",
  cancellation_policy: "",
};

// =========================================================
// STYLES
// =========================================================

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all placeholder:text-placeholder focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

const SELECT_CLASS =
  "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all focus:border-rose-300 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-surface";

const TEXTAREA_CLASS =
  "w-full min-w-0 resize-none rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all placeholder:text-placeholder focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

const LABEL_CLASS =
  "mb-1.5 block text-sm font-semibold text-ink-800";

const HELP_CLASS =
  "mt-1.5 text-xs leading-relaxed text-ink-500";

// =========================================================
// HELPERS
// =========================================================

function getDestinationName(destination) {
  return (
    destination?.place_name ||
    destination?.name ||
    destination?.title ||
    ""
  );
}

function getImageUrl(image) {
  if (typeof image === "string") {
    return image;
  }

  return image?.url || "";
}

function getApiError(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc)
          ? item.loc
              .filter((part) => part !== "body")
              .join(".")
          : "";

        return field
          ? `${field}: ${item?.msg || "Validation error"}`
          : item?.msg || "Validation error";
      })
      .join("\n");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return error?.message || fallback;
}

// =========================================================
// COMPONENT
// =========================================================

export default function PackagesManage() {
  const [packages, setPackages] = useState([]);

  const [destinations, setDestinations] = useState([]);

  const [seasonedDestinations, setSeasonedDestinations] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [destinationsLoading, setDestinationsLoading] =
    useState(true);

  const [seasonedLoading, setSeasonedLoading] =
    useState(true);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [typeFilter, setTypeFilter] = useState("all");

  // =========================================================
  // LOAD PACKAGES
  // =========================================================

  const load = async () => {
    try {
      setLoading(true);

      const data = await getAllPackagesAdmin();

      setPackages(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
          ? data.data
          : []
      );
    } catch (err) {
      console.error("Failed to load packages:", err);

      setError(
        getApiError(
          err,
          "Could not load packages."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =========================================================
  // LOAD MOST VISITED DESTINATIONS
  // =========================================================

  const loadDestinations = async () => {
    try {
      setDestinationsLoading(true);

      const data = await getAllMostVisitedAdmin();

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setDestinations(items);
    } catch (err) {
      console.error(
        "Failed to load destinations:",
        err
      );

      setDestinations([]);

      setError(
        getApiError(
          err,
          "Could not load Most Visited destinations."
        )
      );
    } finally {
      setDestinationsLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  // =========================================================
  // LOAD SEASONAL DESTINATIONS
  // =========================================================

  const loadSeasonedDestinations = async () => {
    try {
      setSeasonedLoading(true);

      const data =
        await getAllSeasonedDestinations();

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setSeasonedDestinations(items);
    } catch (err) {
      console.error(
        "Failed to load seasonal destinations:",
        err
      );

      setSeasonedDestinations([]);

      // Seasonal destinations are optional.
      // Package management can still continue.
    } finally {
      setSeasonedLoading(false);
    }
  };

  useEffect(() => {
    loadSeasonedDestinations();
  }, []);

  // =========================================================
  // FORM HELPERS
  // =========================================================

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleDiscovery = (field) => {
    setForm((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  // =========================================================
  // DESTINATION TYPE
  // =========================================================

  const handleDestinationTypeChange = (type) => {
    setForm((current) => ({
      ...current,
      destination_type: type,

      // When switching to regular:
      // clear seasonal destination.
      destination_id:
        type === "regular"
          ? current.destination_id
          : "",

      seasoned_destination_id:
        type === "seasonal"
          ? current.seasoned_destination_id
          : "",

      destination:
        type === "seasonal"
          ? ""
          : current.destination,
    }));

    setError("");
  };

  const handleRegularDestinationChange = (
    selectedValue
  ) => {
    const selectedId = Number(selectedValue);

    const selected =
      destinations.find(
        (destination) =>
          Number(destination?.id) === selectedId
      );

    setForm((current) => ({
      ...current,
      destination_type: "regular",
      destination_id:
        selectedId || "",
      seasoned_destination_id: "",
      destination:
        getDestinationName(selected),
    }));
  };

  const handleSeasonalDestinationChange = (
    selectedValue
  ) => {
    setForm((current) => ({
      ...current,
      destination_type: "seasonal",
      destination_id: "",
      seasoned_destination_id:
        selectedValue || "",
      destination: "",
    }));
  };

  // =========================================================
  // FILTERED PACKAGES
  // =========================================================

  const filteredPackages = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return packages.filter((pkg) => {
      const seasonalName =
        pkg?.seasoned_destination_obj
          ? getDestinationName(
              pkg.seasoned_destination_obj
            )
          : "";

      const destinationText =
        pkg?.destination ||
        seasonalName ||
        "";

      const matchesSearch =
        !normalizedSearch ||
        String(pkg?.title || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        destinationText
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        pkg?.status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        pkg?.package_type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    packages,
    search,
    statusFilter,
    typeFilter,
  ]);

  // =========================================================
  // OPEN CREATE
  // =========================================================

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      images: [],
      itinerary: [],
      facilities: [],
      inclusions: [],
      exclusions: [],
    });

    setError("");

    setEditing({});
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEdit = (pkg) => {
    const seasonalId =
      pkg?.seasoned_destination_id ??
      pkg?.seasoned_destination_obj?.id ??
      "";

    const regularId =
      pkg?.destination_id ??
      pkg?.destination_obj?.id ??
      "";

    const isSeasonal =
      Boolean(seasonalId) &&
      !Boolean(regularId);

    setForm({
      title: pkg?.title || "",

      destination_type: isSeasonal
        ? "seasonal"
        : "regular",

      destination:
        isSeasonal
          ? ""
          : pkg?.destination || "",

      destination_id:
        isSeasonal
          ? ""
          : regularId,

      seasoned_destination_id:
        isSeasonal
          ? seasonalId
          : "",

      package_type:
        pkg?.package_type || "family",

      display_order:
        pkg?.display_order ?? 0,

      price:
        pkg?.price ?? "",

      duration_days:
        pkg?.duration_days ?? "",

      duration_nights:
        pkg?.duration_nights ??
        (
          (Number(pkg?.duration_days) || 0) > 0
            ? Math.max(
                Number(pkg.duration_days) - 1,
                0
              )
            : ""
        ),

      description:
        pkg?.description || "",

      status:
        pkg?.status || "draft",

      is_popular:
        Boolean(pkg?.is_popular),

      is_recommended:
        Boolean(pkg?.is_recommended),

      is_trending:
        Boolean(pkg?.is_trending),

      is_featured:
        Boolean(pkg?.is_featured),

      is_new:
        Boolean(pkg?.is_new),

      is_most_visited:
        Boolean(pkg?.is_most_visited),

      images:
        Array.isArray(pkg?.images)
          ? pkg.images
          : [],

      itinerary:
        Array.isArray(pkg?.itinerary)
          ? pkg.itinerary.map(
              (item, index) => ({
                day: index + 1,
                title:
                  item?.title || "",
                description:
                  item?.description || "",
                image:
                  getImageUrl(
                    item?.image
                  ) || null,
              })
            )
          : [],

      facilities:
        Array.isArray(pkg?.facilities)
          ? pkg.facilities
          : [],

      inclusions:
        Array.isArray(pkg?.inclusions)
          ? pkg.inclusions
          : [],

      exclusions:
        Array.isArray(pkg?.exclusions)
          ? pkg.exclusions
          : [],

      terms_and_conditions:
        pkg?.terms_and_conditions || "",

      cancellation_policy:
        pkg?.cancellation_policy || "",
    });

    setError("");

    setEditing(pkg);
  };

  // =========================================================
  // RESOLVE LEGACY NORMAL DESTINATION
  // =========================================================
  //
  // Only applies to old normal packages that have a
  // destination name but no destination_id.
  //
  // Never applies to seasonal packages.
  // =========================================================

  useEffect(() => {
    if (
      form.destination_type !== "regular" ||
      form.destination_id ||
      !form.destination ||
      destinations.length === 0
    ) {
      return;
    }

    const normalized =
      form.destination
        .trim()
        .toLowerCase();

    const match =
      destinations.find(
        (destination) => {
          const name =
            getDestinationName(
              destination
            );

          return (
            name
              .trim()
              .toLowerCase() ===
            normalized
          );
        }
      );

    if (match?.id) {
      setForm((current) => ({
        ...current,
        destination_type: "regular",
        destination_id:
          Number(match.id),
        seasoned_destination_id: "",
        destination:
          getDestinationName(match) ||
          current.destination,
      }));
    }
  }, [
    destinations,
    form.destination,
    form.destination_id,
    form.destination_type,
  ]);

  // =========================================================
  // ITINERARY
  // =========================================================

  const addItineraryDay = () => {
    setForm((current) => ({
      ...current,

      itinerary: [
        ...current.itinerary,

        {
          day:
            current.itinerary.length + 1,
          title: "",
          description: "",
          image: null,
        },
      ],
    }));
  };

  const updateItineraryDay = (
    index,
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,

      itinerary:
        current.itinerary.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        ),
    }));
  };

  const removeItineraryDay = (
    index
  ) => {
    setForm((current) => ({
      ...current,

      itinerary:
        current.itinerary
          .filter(
            (_, i) => i !== index
          )
          .map((item, i) => ({
            ...item,
            day: i + 1,
          })),
    }));
  };

  const addItineraryImage = (
    index,
    img
  ) => {
    if (!img?.url) return;

    setForm((current) => ({
      ...current,

      itinerary:
        current.itinerary.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  image: img.url,
                }
              : item
        ),
    }));
  };

  const removeItineraryImage = (
    index
  ) => {
    setForm((current) => ({
      ...current,

      itinerary:
        current.itinerary.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  image: null,
                }
              : item
        ),
    }));
  };

  // =========================================================
  // PACKAGE IMAGES
  // =========================================================

  const addImage = (img) => {
    if (!img?.url) return;

    setForm((current) => ({
      ...current,

      images: [
        ...current.images,
        img,
      ],
    }));
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,

      images:
        current.images.filter(
          (_, i) => i !== index
        ),
    }));
  };

  // =========================================================
  // LIST FIELDS
  // =========================================================

  const addListItem = (field) => {
    setForm((current) => ({
      ...current,

      [field]: [
        ...current[field],
        "",
      ],
    }));
  };

  const updateListItem = (
    field,
    index,
    value
  ) => {
    setForm((current) => ({
      ...current,

      [field]:
        current[field].map(
          (item, i) =>
            i === index
              ? value
              : item
        ),
    }));
  };

  const removeListItem = (
    field,
    index
  ) => {
    setForm((current) => ({
      ...current,

      [field]:
        current[field].filter(
          (_, i) => i !== index
        ),
    }));
  };

  // =========================================================
  // SAVE PACKAGE
  // =========================================================

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      // -----------------------------------------------------
      // BASIC VALIDATION
      // -----------------------------------------------------

      if (!form.title.trim()) {
        setError(
          "Package title is required."
        );
        return;
      }

      // -----------------------------------------------------
      // DESTINATION VALIDATION
      // -----------------------------------------------------

      if (
        form.destination_type !==
          "regular" &&
        form.destination_type !==
          "seasonal"
      ) {
        setError(
          "Please select a destination type."
        );
        return;
      }

      if (
        form.destination_type ===
          "regular" &&
        !Number(form.destination_id)
      ) {
        setError(
          "Please select a regular destination."
        );
        return;
      }

      if (
        form.destination_type ===
          "seasonal" &&
        !Number(
          form.seasoned_destination_id
        )
      ) {
        setError(
          "Please select a seasonal destination."
        );
        return;
      }

      // -----------------------------------------------------
      // PRICE
      // -----------------------------------------------------

      if (
        !Number(form.price) ||
        Number(form.price) <= 0
      ) {
        setError(
          "Price must be greater than 0."
        );
        return;
      }

      // -----------------------------------------------------
      // DURATION
      // -----------------------------------------------------

      if (
        !Number(form.duration_days) ||
        Number(form.duration_days) < 1
      ) {
        setError(
          "Duration (days) must be at least 1."
        );
        return;
      }

      // -----------------------------------------------------
      // DESTINATION IDS
      // -----------------------------------------------------

      const normalDestinationId =
        form.destination_type ===
        "regular"
          ? Number(
              form.destination_id
            )
          : null;

      const seasonalDestinationId =
        form.destination_type ===
        "seasonal"
          ? Number(
              form.seasoned_destination_id
            )
          : null;

      // -----------------------------------------------------
      // PAYLOAD
      // -----------------------------------------------------

      const payload = {
        // ===================================================
        // BASIC
        // ===================================================

        title:
          form.title.trim(),

        // IMPORTANT:
        //
        // We intentionally DO NOT send `destination`.
        //
        // Backend service derives it from the selected
        // normal destination.
        //
        // Seasonal packages get destination = NULL.

        destination_id:
          normalDestinationId,

        seasoned_destination_id:
          seasonalDestinationId,

        package_type:
          form.package_type,

        display_order:
          Number(
            form.display_order
          ) || 0,

        price:
          Number(form.price),

        duration_days:
          Number(
            form.duration_days
          ),

        duration_nights:
          Number(
            form.duration_nights ||
              Math.max(
                Number(
                  form.duration_days
                ) - 1,
                0
              )
          ),

        description:
          form.description.trim() ||
          null,

        status:
          form.status,

        // ===================================================
        // DISCOVERY
        // ===================================================

        is_popular:
          Boolean(
            form.is_popular
          ),

        is_recommended:
          Boolean(
            form.is_recommended
          ),

        is_trending:
          Boolean(
            form.is_trending
          ),

        is_featured:
          Boolean(
            form.is_featured
          ),

        is_new:
          Boolean(
            form.is_new
          ),

        is_most_visited:
          Boolean(
            form.is_most_visited
          ),

        // ===================================================
        // IMAGES
        // ===================================================

        images:
          form.images
            .filter(
              (img) =>
                Boolean(img?.url)
            )
            .map((img) => ({
              url: img.url,

              ...(img?.public_id
                ? {
                    public_id:
                      img.public_id,
                  }
                : {}),
            })),

        // ===================================================
        // ITINERARY
        // ===================================================

        itinerary:
          form.itinerary.map(
            (item, index) => ({
              day: index + 1,

              title:
                item?.title?.trim() ||
                "",

              description:
                item?.description?.trim() ||
                "",

              image:
                item?.image || null,
            })
          ),

        // ===================================================
        // FACILITIES
        // ===================================================

        facilities:
          form.facilities
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        // ===================================================
        // INCLUSIONS
        // ===================================================

        inclusions:
          form.inclusions
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        // ===================================================
        // EXCLUSIONS
        // ===================================================

        exclusions:
          form.exclusions
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        // ===================================================
        // POLICIES
        // ===================================================

        terms_and_conditions:
          form.terms_and_conditions.trim() ||
          null,

        cancellation_policy:
          form.cancellation_policy.trim() ||
          null,
      };

      console.log(
        "Saving package:",
        payload
      );

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      if (editing?.id) {
        await updatePackage(
          editing.id,
          payload
        );
      }

      // -----------------------------------------------------
      // CREATE
      // -----------------------------------------------------

      else {
        await createPackage(
          payload
        );
      }

      setEditing(null);

      setForm({
        ...EMPTY_FORM,
        images: [],
        itinerary: [],
        facilities: [],
        inclusions: [],
        exclusions: [],
      });

      await load();
    } catch (err) {
      console.error(
        "Package save failed:",
        err
      );

      setError(
        getApiError(
          err,
          "Failed to save package."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (
    id
  ) => {
    if (
      !window.confirm(
        "Delete this package? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deletePackage(id);

      await load();
    } catch (err) {
      console.error(
        "Package delete failed:",
        err
      );

      setError(
        getApiError(
          err,
          "Could not delete package."
        )
      );
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setEditing(null);

    setForm({
      ...EMPTY_FORM,
      images: [],
      itinerary: [],
      facilities: [],
      inclusions: [],
      exclusions: [],
    });

    setError("");
  };

  // =========================================================
  // DISCOVERY LABELS
  // =========================================================

  const getDiscoveryLabels = (
    pkg
  ) =>
    DISCOVERY_OPTIONS.filter(
      (option) =>
        Boolean(
          pkg?.[option.key]
        )
    );

  // =========================================================
  // DESTINATION DISPLAY
  // =========================================================

  const getPackageDestinationName = (
    pkg
  ) => {
    if (
      pkg?.seasoned_destination_obj
    ) {
      return getDestinationName(
        pkg.seasoned_destination_obj
      );
    }

    if (
      pkg?.seasoned_destination
    ) {
      return getDestinationName(
        pkg.seasoned_destination
      );
    }

    if (pkg?.destination) {
      return pkg.destination;
    }

    return "—";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full w-full min-w-0 overflow-x-hidden bg-background p-3 sm:p-5 md:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full bg-rose-500" />

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
              Manyara Prive Vacations
            </span>
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
            Packages
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-500">
            Create and manage travel packages,
            destinations, visibility sections,
            itineraries and package policies.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-travel-hover focus:outline-none focus:ring-4 focus:ring-rose-100 sm:w-auto"
        >
          <span className="text-lg leading-none transition-transform duration-200 group-hover:rotate-90">
            +
          </span>

          New Package
        </button>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && !editing && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-error/20 bg-error-bg px-4 py-3.5 text-sm text-error-text shadow-travel-card">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
            !
          </span>

          <p className="whitespace-pre-line leading-6">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Total Packages
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-ink-800">
            {packages.length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Published
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-rose-600">
            {
              packages.filter(
                (pkg) =>
                  pkg.status ===
                  "published"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Drafts
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-ink-800">
            {
              packages.filter(
                (pkg) =>
                  pkg.status ===
                  "draft"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Featured
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-rose-600">
            {
              packages.filter(
                (pkg) =>
                  Boolean(
                    pkg.is_featured
                  )
              ).length
            }
          </p>
        </div>
      </div>

      {/* =====================================================
          FILTER BAR
      ====================================================== */}

      <div className="mb-5 rounded-2xl border border-border bg-white p-3 shadow-travel-card sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search package or destination..."
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className={SELECT_CLASS}
          >
            <option value="all">
              All Statuses
            </option>

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className={SELECT_CLASS}
          >
            <option value="all">
              All Package Types
            </option>

            {PACKAGE_TYPES.map(
              (type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-ink-500">
            Showing{" "}
            <span className="font-bold text-ink-700">
              {filteredPackages.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-ink-700">
              {packages.length}
            </span>{" "}
            packages
          </p>

          {(search ||
            statusFilter !==
              "all" ||
            typeFilter !==
              "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "all"
                );
                setTypeFilter(
                  "all"
                );
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          PACKAGE TABLE
      ====================================================== */}

      {loading ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-travel-card">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-rose-100 border-t-rose-600" />

          <p className="text-sm font-medium text-ink-500">
            Loading packages...
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-travel-card">
          <div className="border-b border-border bg-surface-alt px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-800">
                  Package Catalogue
                </h2>

                <p className="text-xs text-ink-500">
                  Manage package content and website visibility.
                </p>
              </div>

              <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                {filteredPackages.length}{" "}
                package
                {filteredPackages.length ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-surface text-[11px] uppercase tracking-[0.12em] text-ink-500">
                <tr>
                  <th className="px-5 py-3.5 text-left font-bold">
                    Package
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Destination
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Type
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Price
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Visibility
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right font-bold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPackages.map(
                  (pkg) => {
                    const labels =
                      getDiscoveryLabels(
                        pkg
                      );

                    const isSeasonal =
                      Boolean(
                        pkg?.seasoned_destination_id
                      );

                    return (
                      <tr
                        key={pkg.id}
                        className="border-t border-border transition-colors hover:bg-surface-alt"
                      >
                        {/* PACKAGE */}

                        <td className="px-5 py-4">
                          <div className="flex max-w-[280px] items-center gap-3">
                            {getImageUrl(
                              pkg?.images?.[0]
                            ) ? (
                              <img
                                src={getImageUrl(
                                  pkg?.images?.[0]
                                )}
                                alt=""
                                className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-border"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-lg text-rose-600">
                                ✦
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink-800">
                                {pkg.title}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-ink-500">
                                {pkg.duration_days}{" "}
                                days{" "}
                                {pkg.duration_nights ??
                                  0}{" "}
                                nights
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* DESTINATION */}

                        <td className="px-5 py-4">
                          <span className="text-ink-700">
                            {getPackageDestinationName(
                              pkg
                            )}
                          </span>

                          <span
                            className={`mt-1 block text-[11px] font-semibold ${
                              isSeasonal
                                ? "text-rose-600"
                                : "text-ink-400"
                            }`}
                          >
                            {isSeasonal
                              ? "Seasonal destination"
                              : "Regular destination"}
                          </span>
                        </td>

                        {/* PACKAGE TYPE */}

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                            {PACKAGE_TYPES.find(
                              (type) =>
                                type.value ===
                                pkg.package_type
                            )?.label ||
                              pkg.package_type ||
                              "Family"}
                          </span>
                        </td>

                        {/* PRICE */}

                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="font-semibold text-ink-800">
                            ₹
                            {Number(
                              pkg.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>

                          <span className="block text-[11px] text-ink-400">
                            starting price
                          </span>
                        </td>

                        {/* VISIBILITY */}

                        <td className="px-5 py-4">
                          <div className="flex max-w-[260px] flex-wrap gap-1.5">
                            {labels.length >
                            0 ? (
                              labels.map(
                                (
                                  option
                                ) => (
                                  <span
                                    key={
                                      option.key
                                    }
                                    className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
                                  >
                                    {
                                      option.label
                                    }
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-xs text-ink-400">
                                No labels
                              </span>
                            )}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              pkg.status ===
                              "published"
                                ? "bg-success-bg text-success-text"
                                : "bg-surface-strong text-ink-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                pkg.status ===
                                "published"
                                  ? "bg-success"
                                  : "bg-ink-400"
                              }`}
                            />

                            {pkg.status ===
                            "published"
                              ? "Published"
                              : "Draft"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  pkg
                                )
                              }
                              className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:border-rose-200 hover:bg-rose-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  pkg.id
                                )
                              }
                              className="rounded-lg border border-error/15 bg-error-bg px-3 py-1.5 text-xs font-bold text-error-text transition-colors hover:border-error/25"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}

                {filteredPackages.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl text-rose-600">
                          ✦
                        </div>

                        <p className="font-display text-lg font-semibold text-ink-800">
                          No packages found
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-500">
                          Try changing
                          your filters
                          or create a
                          new travel
                          package.
                        </p>

                        {!search &&
                          statusFilter ===
                            "all" &&
                          typeFilter ===
                            "all" && (
                            <button
                              type="button"
                              onClick={
                                openCreate
                              }
                              className="mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-brand transition-colors hover:bg-rose-700"
                            >
                              Create First
                              Package
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl sm:h-[94vh] sm:rounded-3xl">
            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-6 rounded-full bg-rose-500" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">
                      Package Manager
                    </span>
                  </div>

                  <h2 className="font-display text-2xl font-semibold text-ink-800">
                    {editing?.id
                      ? "Edit Package"
                      : "Create New Package"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-ink-500 sm:text-sm">
                    Manage package content,
                    destinations, itinerary,
                    images and website visibility.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={
                handleSave
              }
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div className="space-y-7 p-4 sm:p-6 lg:p-8">
                {/* =================================================
                    BASIC DETAILS
                ================================================== */}

                <section className="rounded-2xl border border-border bg-surface-alt p-4 sm:p-5">
                  <div className="mb-5">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Basic Details
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      Define the main package information,
                      pricing and destination.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* TITLE */}

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="package-title"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Package Title
                      </label>

                      <input
                        id="package-title"
                        required
                        value={
                          form.title
                        }
                        onChange={(e) =>
                          updateField(
                            "title",
                            e.target.value
                          )
                        }
                        placeholder="Example: Kerala 5 Days Premium Package"
                        className={
                          INPUT_CLASS
                        }
                      />
                    </div>

                    {/* =================================================
                        DESTINATION TYPE
                    ================================================== */}

                    <div className="sm:col-span-2">
                      <label
                        className={
                          LABEL_CLASS
                        }
                      >
                        Destination Type
                        <span className="ml-1 text-rose-600">
                          *
                        </span>
                      </label>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* REGULAR */}

                        <button
                          type="button"
                          onClick={() =>
                            handleDestinationTypeChange(
                              "regular"
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            form.destination_type ===
                            "regular"
                              ? "border-rose-300 bg-rose-50 shadow-travel-card"
                              : "border-border bg-white hover:border-rose-200 hover:bg-rose-50/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                form.destination_type ===
                                "regular"
                                  ? "border-rose-600 bg-rose-600"
                                  : "border-border bg-white"
                              }`}
                            >
                              {form.destination_type ===
                                "regular" && (
                                <span className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </span>

                            <span>
                              <span className="block text-sm font-bold text-ink-800">
                                Regular Destination
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-ink-500">
                                Use a normal destination
                                from Most Visited.
                              </span>
                            </span>
                          </div>
                        </button>

                        {/* SEASONAL */}

                        <button
                          type="button"
                          onClick={() =>
                            handleDestinationTypeChange(
                              "seasonal"
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            form.destination_type ===
                            "seasonal"
                              ? "border-rose-300 bg-rose-50 shadow-travel-card"
                              : "border-border bg-white hover:border-rose-200 hover:bg-rose-50/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                form.destination_type ===
                                "seasonal"
                                  ? "border-rose-600 bg-rose-600"
                                  : "border-border bg-white"
                              }`}
                            >
                              {form.destination_type ===
                                "seasonal" && (
                                <span className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </span>

                            <span>
                              <span className="block text-sm font-bold text-ink-800">
                                Seasonal Destination
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-ink-500">
                                Use a destination
                                available for a
                                specific season.
                              </span>
                            </span>
                          </div>
                        </button>
                      </div>

                      <p className={HELP_CLASS}>
                        A package belongs to
                        exactly one destination
                        type.
                      </p>
                    </div>

                    {/* =================================================
                        REGULAR DESTINATION
                    ================================================== */}

                    {form.destination_type ===
                      "regular" && (
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="package-destination"
                          className={
                            LABEL_CLASS
                          }
                        >
                          Regular Destination
                          <span className="ml-1 text-rose-600">
                            *
                          </span>
                        </label>

                        <select
                          id="package-destination"
                          required
                          value={
                            form.destination_id
                          }
                          disabled={
                            destinationsLoading
                          }
                          onChange={(e) =>
                            handleRegularDestinationChange(
                              e.target.value
                            )
                          }
                          className={
                            SELECT_CLASS
                          }
                        >
                          <option value="">
                            {destinationsLoading
                              ? "Loading destinations..."
                              : "Select destination"}
                          </option>

                          {destinations.map(
                            (
                              destination
                            ) => (
                              <option
                                key={
                                  destination.id
                                }
                                value={
                                  destination.id
                                }
                              >
                                {getDestinationName(
                                  destination
                                )}
                              </option>
                            )
                          )}
                        </select>

                        <p className={HELP_CLASS}>
                          Select the normal
                          destination from
                          Most Visited.
                        </p>
                      </div>
                    )}

                    {/* =================================================
                        SEASONAL DESTINATION
                    ================================================== */}

                    {form.destination_type ===
                      "seasonal" && (
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="seasonal-destination"
                          className={
                            LABEL_CLASS
                          }
                        >
                          Seasonal Destination
                          <span className="ml-1 text-rose-600">
                            *
                          </span>
                        </label>

                        <select
                          id="seasonal-destination"
                          required
                          value={
                            form.seasoned_destination_id
                          }
                          disabled={
                            seasonedLoading
                          }
                          onChange={(e) =>
                            handleSeasonalDestinationChange(
                              e.target.value
                            )
                          }
                          className={
                            SELECT_CLASS
                          }
                        >
                          <option value="">
                            {seasonedLoading
                              ? "Loading seasonal destinations..."
                              : "Select seasonal destination"}
                          </option>

                          {seasonedDestinations
                            .filter(
                              (
                                destination
                              ) =>
                                destination?.status ===
                                  undefined ||
                                destination?.status ===
                                  "published"
                            )
                            .map(
                              (
                                destination
                              ) => (
                                <option
                                  key={
                                    destination.id
                                  }
                                  value={
                                    destination.id
                                  }
                                >
                                  {getDestinationName(
                                    destination
                                  )}
                                </option>
                              )
                            )}
                        </select>

                        <p className={HELP_CLASS}>
                          This package will be
                          associated only with
                          the selected seasonal
                          destination.
                        </p>
                      </div>
                    )}

                    {/* PACKAGE TYPE */}

                    <div>
                      <label
                        htmlFor="package-type"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Package Type
                      </label>

                      <select
                        id="package-type"
                        value={
                          form.package_type
                        }
                        onChange={(e) =>
                          updateField(
                            "package_type",
                            e.target.value
                          )
                        }
                        className={
                          SELECT_CLASS
                        }
                      >
                        {PACKAGE_TYPES.map(
                          (type) => (
                            <option
                              key={
                                type.value
                              }
                              value={
                                type.value
                              }
                            >
                              {
                                type.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* STATUS */}

                    <div>
                      <label
                        htmlFor="package-status"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Publishing Status
                      </label>

                      <select
                        id="package-status"
                        value={
                          form.status
                        }
                        onChange={(e) =>
                          updateField(
                            "status",
                            e.target.value
                          )
                        }
                        className={
                          SELECT_CLASS
                        }
                      >
                        <option value="draft">
                          Draft
                        </option>

                        <option value="published">
                          Published
                        </option>
                      </select>
                    </div>

                    {/* PRICE */}

                    <div>
                      <label
                        htmlFor="package-price"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Starting Price (₹)
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-500">
                          ₹
                        </span>

                        <input
                          id="package-price"
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          value={
                            form.price
                          }
                          onChange={(e) =>
                            updateField(
                              "price",
                              e.target.value
                            )
                          }
                          placeholder="25000"
                          className={`${INPUT_CLASS} pl-8`}
                        />
                      </div>
                    </div>

                    {/* DISPLAY ORDER */}

                    <div>
                      <label
                        htmlFor="package-order"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Display Order
                      </label>

                      <input
                        id="package-order"
                        type="number"
                        min="0"
                        value={
                          form.display_order
                        }
                        onChange={(e) =>
                          updateField(
                            "display_order",
                            e.target.value
                          )
                        }
                        placeholder="0"
                        className={
                          INPUT_CLASS
                        }
                      />

                      <p className={HELP_CLASS}>
                        Lower numbers
                        appear first.
                      </p>
                    </div>

                    {/* DAYS */}

                    <div>
                      <label
                        htmlFor="package-days"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Duration — Days
                      </label>

                      <input
                        id="package-days"
                        type="number"
                        required
                        min="1"
                        value={
                          form.duration_days
                        }
                        onChange={(e) =>
                          updateField(
                            "duration_days",
                            e.target.value
                          )
                        }
                        placeholder="5"
                        className={
                          INPUT_CLASS
                        }
                      />
                    </div>

                    {/* NIGHTS */}

                    <div>
                      <label
                        htmlFor="package-nights"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Duration — Nights
                      </label>

                      <input
                        id="package-nights"
                        type="number"
                        required
                        min="0"
                        value={
                          form.duration_nights
                        }
                        onChange={(e) =>
                          updateField(
                            "duration_nights",
                            e.target.value
                          )
                        }
                        placeholder="4"
                        className={
                          INPUT_CLASS
                        }
                      />

                      <p className={HELP_CLASS}>
                        Usually days minus
                        one. Example: 5 days
                        = 4 nights.
                      </p>
                    </div>
                  </div>
                </section>

                {/* =================================================
                    DISCOVERY / VISIBILITY
                ================================================== */}

                <section className="rounded-2xl border border-rose-100 bg-brand-gradient p-4 sm:p-5">
                  <div className="mb-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                        ✦
                      </span>

                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink-800">
                          Website Visibility
                        </h3>

                        <p className="text-xs text-ink-500">
                          Choose where this
                          package should appear.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {DISCOVERY_OPTIONS.map(
                      (option) => {
                        const checked =
                          Boolean(
                            form[
                              option.key
                            ]
                          );

                        return (
                          <label
                            key={
                              option.key
                            }
                            className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                              checked
                                ? "border-rose-200 bg-white shadow-travel-card"
                                : "border-border/70 bg-white/70 hover:border-rose-100 hover:bg-white"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                checked
                                  ? "border-rose-600 bg-rose-600 text-white"
                                  : "border-border bg-white text-transparent"
                              }`}
                            >
                              {checked &&
                                "✓"}
                            </span>

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleDiscovery(
                                  option.key
                                )
                              }
                              className="sr-only"
                            />

                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-ink-800">
                                {
                                  option.label
                                }
                              </span>

                              <span className="mt-0.5 block text-xs leading-5 text-ink-500">
                                {
                                  option.description
                                }
                              </span>
                            </span>
                          </label>
                        );
                      }
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/80 bg-white/75 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
                      Current discovery labels
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {DISCOVERY_OPTIONS.filter(
                        (option) =>
                          form[
                            option.key
                          ]
                      ).map(
                        (option) => (
                          <span
                            key={
                              option.key
                            }
                            className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100"
                          >
                            {
                              option.label
                            }
                          </span>
                        )
                      )}

                      {DISCOVERY_OPTIONS.every(
                        (option) =>
                          !form[
                            option.key
                          ]
                      ) && (
                        <span className="text-xs text-ink-400">
                          No discovery
                          sections
                          selected.
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                {/* =================================================
                    DESCRIPTION
                ================================================== */}

                <section>
                  <div className="mb-3">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Package Description
                    </h3>

                    <p className="mt-1 text-xs text-ink-500">
                      Give travellers a clear
                      overview of the experience.
                    </p>
                  </div>

                  <textarea
                    rows={6}
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Describe the destination, experience, highlights and what makes this package special..."
                    className={
                      TEXTAREA_CLASS
                    }
                  />
                </section>

                {/* =================================================
                    ITINERARY
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-800">
                        Day-by-Day Itinerary
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-ink-500">
                        Add activities,
                        descriptions and a
                        dedicated image for
                        each day.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        addItineraryDay
                      }
                      className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-brand transition-all hover:bg-rose-700 sm:w-auto"
                    >
                      + Add Day
                    </button>
                  </div>

                  {form.itinerary.length ===
                    0 && (
                    <div className="rounded-2xl border border-dashed border-rose-200 bg-brand-gradient p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-rose-600 shadow-sm">
                        ✦
                      </div>

                      <p className="font-semibold text-ink-700">
                        No itinerary days
                        yet
                      </p>

                      <p className="mt-1 text-xs text-ink-500">
                        Click “Add Day” to
                        create Day 1.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {form.itinerary.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="overflow-hidden rounded-2xl border border-border bg-white shadow-travel-card"
                        >
                          {/* DAY HEADER */}

                          <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-alt px-4 py-3.5 sm:px-5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white shadow-sm">
                                {index +
                                  1}
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-ink-800">
                                  Day{" "}
                                  {index +
                                    1}
                                </p>

                                <p className="truncate text-xs text-ink-500">
                                  Day{" "}
                                  {index +
                                    1}{" "}
                                  itinerary
                                  details
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItineraryDay(
                                  index
                                )
                              }
                              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-error-text transition-colors hover:bg-error-bg"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="p-4 sm:p-5">
                            {/* DAY TITLE */}

                            <div className="mb-4">
                              <label
                                className={
                                  LABEL_CLASS
                                }
                              >
                                Day{" "}
                                {index +
                                  1}{" "}
                                Title
                              </label>

                              <input
                                required
                                value={
                                  item?.title ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateItineraryDay(
                                    index,
                                    "title",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Example: Arrival in Kochi & Local Sightseeing"
                                className={
                                  INPUT_CLASS
                                }
                              />
                            </div>

                            {/* DAY DESCRIPTION */}

                            <div className="mb-5">
                              <label
                                className={
                                  LABEL_CLASS
                                }
                              >
                                Day{" "}
                                {index +
                                  1}{" "}
                                Description
                              </label>

                              <textarea
                                required
                                rows={4}
                                value={
                                  item?.description ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateItineraryDay(
                                    index,
                                    "description",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Describe activities, sightseeing, meals, transfers and experiences for this day..."
                                className={
                                  TEXTAREA_CLASS
                                }
                              />
                            </div>

                            {/* DAY IMAGE */}

                            <div>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <label className="text-sm font-bold text-ink-800">
                                  Day{" "}
                                  {index +
                                    1}{" "}
                                  Image
                                </label>

                                {item?.image && (
                                  <span className="rounded-full bg-success-bg px-2.5 py-1 text-[10px] font-bold text-success-text">
                                    Image added
                                  </span>
                                )}
                              </div>

                              {item?.image ? (
                                <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border bg-surface sm:h-60">
                                  <img
                                    src={
                                      item.image
                                    }
                                    alt={
                                      item?.title ||
                                      `Day ${
                                        index +
                                        1
                                      }`
                                    }
                                    className="h-full w-full object-cover"
                                  />

                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-transparent p-4">
                                    <p className="text-xs font-bold text-white">
                                      Day{" "}
                                      {index +
                                        1}
                                    </p>

                                    {item?.title && (
                                      <p className="mt-0.5 truncate text-sm font-semibold text-white">
                                        {
                                          item.title
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItineraryImage(
                                        index
                                      )
                                    }
                                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink-700 shadow-lg transition-colors hover:bg-error-bg hover:text-error-text"
                                    aria-label={`Remove Day ${
                                      index +
                                      1
                                    } image`}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-surface-alt p-2">
                                  <ImageUploadField
                                    value={
                                      null
                                    }
                                    onChange={(
                                      img
                                    ) =>
                                      addItineraryImage(
                                        index,
                                        img
                                      )
                                    }
                                    label=""
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {form.itinerary.length >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        addItineraryDay
                      }
                      className="mt-4 w-full rounded-xl border border-dashed border-rose-200 bg-rose-50/50 py-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50"
                    >
                      + Add Day{" "}
                      {form.itinerary
                        .length + 1}
                    </button>
                  )}
                </section>

                {/* =================================================
                    PACKAGE IMAGES
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-4">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Package Images
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      Add the main images used
                      across package cards and
                      the package detail page.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {form.images.map(
                      (
                        img,
                        index
                      ) => (
                        <div
                          key={index}
                          className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-travel-card"
                        >
                          <img
                            src={img?.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink-700 shadow-lg transition-colors hover:bg-error-bg hover:text-error-text"
                          >
                            ×
                          </button>

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/60 to-transparent px-2 pb-2 pt-5 text-[10px] font-bold text-white">
                            Image{" "}
                            {index +
                              1}
                          </div>
                        </div>
                      )
                    )}

                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 p-1">
                      <ImageUploadField
                        value={null}
                        onChange={
                          addImage
                        }
                        label=""
                      />
                    </div>
                  </div>
                </section>

                {/* =================================================
                    FACILITIES
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-800">
                        Facilities
                      </h3>

                      <p className="mt-1 text-xs text-ink-500">
                        Hotel, breakfast,
                        transport, AC,
                        guide, etc.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addListItem(
                          "facilities"
                        )
                      }
                      className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.facilities.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-2"
                        >
                          <input
                            value={item}
                            onChange={(
                              e
                            ) =>
                              updateListItem(
                                "facilities",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Example: Breakfast included"
                            className={
                              INPUT_CLASS
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(
                                "facilities",
                                index
                              )
                            }
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
                            aria-label="Remove facility"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}

                    {form.facilities.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
                        No facilities
                        added.
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    INCLUSIONS
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-800">
                        Inclusions
                      </h3>

                      <p className="mt-1 text-xs text-ink-500">
                        What is included in
                        the package?
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addListItem(
                          "inclusions"
                        )
                      }
                      className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.inclusions.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-2"
                        >
                          <input
                            value={item}
                            onChange={(
                              e
                            ) =>
                              updateListItem(
                                "inclusions",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Example: 4 nights hotel accommodation"
                            className={
                              INPUT_CLASS
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(
                                "inclusions",
                                index
                              )
                            }
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
                            aria-label="Remove inclusion"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}

                    {form.inclusions.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
                        No inclusions
                        added.
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    EXCLUSIONS
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-800">
                        Exclusions
                      </h3>

                      <p className="mt-1 text-xs text-ink-500">
                        What is not included?
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addListItem(
                          "exclusions"
                        )
                      }
                      className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.exclusions.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-2"
                        >
                          <input
                            value={item}
                            onChange={(
                              e
                            ) =>
                              updateListItem(
                                "exclusions",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Example: Flight tickets"
                            className={
                              INPUT_CLASS
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(
                                "exclusions",
                                index
                              )
                            }
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
                            aria-label="Remove exclusion"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}

                    {form.exclusions.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
                        No exclusions
                        added.
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    TERMS
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-3">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Terms & Conditions
                    </h3>

                    <p className="mt-1 text-xs text-ink-500">
                      Package-specific terms
                      shown to travellers.
                    </p>
                  </div>

                  <textarea
                    rows={7}
                    value={
                      form.terms_and_conditions
                    }
                    onChange={(e) =>
                      updateField(
                        "terms_and_conditions",
                        e.target.value
                      )
                    }
                    placeholder="Enter package terms and conditions..."
                    className={
                      TEXTAREA_CLASS
                    }
                  />
                </section>

                {/* =================================================
                    CANCELLATION
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-3">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Cancellation Policy
                    </h3>

                    <p className="mt-1 text-xs text-ink-500">
                      Explain cancellation and
                      refund rules for this package.
                    </p>
                  </div>

                  <textarea
                    rows={7}
                    value={
                      form.cancellation_policy
                    }
                    onChange={(e) =>
                      updateField(
                        "cancellation_policy",
                        e.target.value
                      )
                    }
                    placeholder="Enter cancellation policy..."
                    className={
                      TEXTAREA_CLASS
                    }
                  />
                </section>

                {/* =================================================
                    ERROR
                ================================================== */}

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-error/20 bg-error-bg px-4 py-3.5 text-sm text-error-text">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
                      !
                    </span>

                    <p className="whitespace-pre-line leading-6">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* =================================================
                  FOOTER ACTIONS
              ================================================== */}

              <div className="sticky bottom-0 z-20 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink-600 transition-colors hover:bg-surface disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-brand transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}

                    {saving
                      ? "Saving..."
                      : editing?.id
                      ? "Update Package"
                      : "Save Package"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




