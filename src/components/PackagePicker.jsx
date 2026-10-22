


import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Clock, ImageOff, MapPin, Search } from "lucide-react";
import { getPackages } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { cld } from "../utils/cloudinary";
import {
  formatDuration,
  getPackageDestination,
  getPackageImage,
  getPackageRegion,
  getPackageTypeLabel,
  getSafeArray,
  isPublished,
} from "../utils/packages";

const REGION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
];

const MAX_RESULTS = 30;

const LABEL =
  "mb-1.5 flex items-baseline gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600";

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2";

export function Thumb({ src, alt, className = "", width = 400 }) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-lg bg-surface-soft ${className}`}>
      {src ? (
        <img
          src={cld(src, width)}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageOff className="h-5 w-5 text-ink-300" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/* The chosen package card (used by the picker and by the modal's auto-filled mode). */
export function SelectedPackage({ pkg, onChange, changeLabel }) {
  const destination = getPackageDestination(pkg);
  const duration = formatDuration(pkg?.duration_days, pkg?.duration_nights);
  const typeLabel = getPackageTypeLabel(pkg?.package_type || pkg?.type);

  return (
    <div className="flex items-stretch gap-3 rounded-2xl border border-primary/20 bg-white/90 p-2.5 shadow-travel-card">
      <Thumb
        src={getPackageImage(pkg)}
        alt={pkg?.title || "Selected package"}
        className="h-[84px] w-[112px] sm:h-24 sm:w-32"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
        <p className="line-clamp-2 font-display text-lg font-semibold leading-snug text-text-dark">
          {pkg?.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-secondary">
          {destination && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{destination}</span>
            </span>
          )}
          {duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              {duration}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-champagne bg-champagne-light px-2.5 py-0.5 text-[11px] font-semibold text-text-dark">
            {typeLabel || "Holiday"}
          </span>
          <span className="rounded-full bg-primary-lighter px-2.5 py-0.5 text-[11px] font-semibold capitalize text-primary">
            {getPackageRegion(pkg)}
          </span>
        </div>
      </div>

      {onChange && (
        <button
          type="button"
          onClick={onChange}
          className={`self-start rounded-lg px-2 py-1 text-xs font-semibold text-link underline underline-offset-2 hover:text-link-hover ${FOCUS_RING}`}
        >
          {changeLabel}
        </button>
      )}
    </div>
  );
}


export default function PackagePicker({
  idPrefix = "pkg",
  value,
  onChange,
  error = "",
  onErrorClear,
  disabled = false,
  autoFocus = false,
  onListOpenChange,
  label = "Package you travelled on",
  required = true,
}) {
  const [region, setRegion] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { data, error: queryError, loading, refetch } = useQuery(getPackages);

  const searchRef = useRef(null);
  const listenerRef = useRef(onListOpenChange);
  listenerRef.current = onListOpenChange;

  const inputId = `${idPrefix}_package_search`;
  const listId = `${idPrefix}_package_listbox`;
  const showResults = listOpen && !value;

  const packages = useMemo(() => {
    const list = getSafeArray(data)
      .filter(isPublished)
      .filter((item) => item?.title);

    list.sort((a, b) => {
      const order =
        Number(a?.display_order ?? Number.MAX_SAFE_INTEGER) -
        Number(b?.display_order ?? Number.MAX_SAFE_INTEGER);
      return order || String(a.title).localeCompare(String(b.title));
    });

    return list;
  }, [data]);

  const loaded = data !== undefined;
  /* useQuery already retried twice; only show the error if there is nothing to show. */
  const loadError = queryError && packages.length === 0 ? "Unable to load packages." : "";

  useEffect(() => {
    listenerRef.current?.(showResults);
  }, [showResults]);

  useEffect(() => () => listenerRef.current?.(false), []);

  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    }
  }, [autoFocus]);

  const results = useMemo(() => {
    const tokens = searchText.trim().toLowerCase().split(/\s+/).filter(Boolean);

    return packages
      .filter((item) => region === "all" || getPackageRegion(item) === region)
      .filter((item) => {
        if (!tokens.length) return true;

        const haystack = [
          item?.title,
          getPackageDestination(item),
          item?.slug,
          getPackageTypeLabel(item?.package_type || item?.type),
        ]
          .join(" ")
          .toLowerCase();

        return tokens.every((token) => haystack.includes(token));
      })
      .slice(0, MAX_RESULTS);
  }, [packages, region, searchText]);

  const handleRegion = (next) => {
    setRegion(next);
    setActiveIndex(0);
    setListOpen(true);
  };

  const choose = (item) => {
    onChange(item);
    setRegion(getPackageRegion(item));
    setSearchText("");
    setListOpen(false);
    setActiveIndex(-1);
    onErrorClear?.();
  };

  const clear = () => {
    onChange(null);
    setSearchText("");
    requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setListOpen(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault(); // never submit the form from the search box
      if (listOpen && results[activeIndex]) choose(results[activeIndex]);
    } else if (event.key === "Escape" && listOpen) {
      event.stopPropagation();
      setListOpen(false);
    }
  };

  const shownError = error || loadError;
  const hasError = Boolean(shownError);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={inputId} className={LABEL}>
             {label}
            {required && (
              <span className="text-accent" aria-hidden="true">
                *
              </span>
            )}
          </label>

        {value ? (
          <SelectedPackage pkg={value} onChange={disabled ? undefined : clear} changeLabel="Change" />
        ) : (
          <>
            {/* Domestic / International */}
            <div
              role="radiogroup"
              aria-label="Domestic or international"
              className="mb-2.5 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1"
            >
              {REGION_OPTIONS.map((option) => {
                const active = region === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={disabled}
                    onClick={() => handleRegion(option.value)}
                    className={`h-9 rounded-lg px-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed ${FOCUS_RING} ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-secondary hover:bg-white hover:text-text-dark"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setListOpen(false);
              }}
            >
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary"
                  aria-hidden="true"
                />

                <input
                  ref={searchRef}
                  id={inputId}
                  type="text"
                  role="combobox"
                  aria-expanded={showResults}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    showResults && activeIndex >= 0 ? `${idPrefix}_package_opt_${activeIndex}` : undefined
                  }
                  aria-invalid={hasError ? "true" : undefined}
                  aria-describedby={hasError ? `${inputId}-error` : undefined}
                  value={searchText}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    setListOpen(true);
                    setActiveIndex(0);
                    onErrorClear?.();
                  }}
                  onFocus={() => setListOpen(true)}
                  onClick={() => setListOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder={loading ? "Loading packages..." : "Type a place or package, e.g. Manali"}
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint="search"
                  disabled={disabled || loading}
                  className={`block h-12 w-full min-w-0 rounded-xl border bg-input pl-11 pr-4 text-base text-text-dark outline-none transition-all duration-200 placeholder:text-placeholder disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted ${
                    hasError
                      ? "border-error bg-error-bg/30 focus:border-error focus:ring-4 focus:ring-error/10"
                      : "border-border hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/10"
                  }`}
                />
              </div>

              {showResults && (
                <ul
                  id={listId}
                  role="listbox"
                  aria-label="Matching packages"
                  className="mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white shadow-travel-card"
                >
                  {results.length === 0 ? (
                    <li className="px-4 py-5 text-center text-sm text-muted">
                      {loaded
                        ? "No packages match. Try another place or switch Domestic / International."
                        : "No packages to show."}
                    </li>
                  ) : (
                    results.map((item, index) => {
                      const destination = getPackageDestination(item);
                      const duration = formatDuration(item?.duration_days, item?.duration_nights);

                      return (
                        <li
                          key={item?.id ?? item?.slug}
                          id={`${idPrefix}_package_opt_${index}`}
                          role="option"
                          aria-selected={index === activeIndex}
                          // keeps focus in the input so blur doesn't close the list before the click
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => choose(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex cursor-pointer items-center gap-3 border-b border-divider px-3 py-2.5 last:border-b-0 ${
                            index === activeIndex ? "bg-primary-lighter" : "bg-white"
                          }`}
                        >
                          <Thumb
                            src={getPackageImage(item)}
                            alt=""
                            width={200}
                            className="h-12 w-16"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-text-dark">{item.title}</p>
                            <p className="mt-0.5 truncate text-xs text-text-secondary">
                              {[destination, getPackageTypeLabel(item?.package_type || item?.type), duration]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>
          </>
        )}

        {shownError ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-error-text sm:text-sm"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            {shownError}
          </p>
        ) : null}

        {loadError && !loading && (
          <button
            type="button"
            onClick={refetch}
            className="mt-1 text-xs font-semibold text-link underline underline-offset-2 hover:text-link-hover"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}