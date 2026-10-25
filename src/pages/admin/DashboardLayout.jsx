


import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  Award,
  CalendarDays,
  ChevronDown,
  Compass,
  ExternalLink,
  Flag,
  HelpCircle,
  Heart,
  Image as ImageIcon,
  Info,
  LogOut,
  Sun,
  Mail,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Package,
  ScrollText,
  Settings,
  Smile,
  UserCog,
  Users,
  X,
} from "lucide-react";

/* =========================================================
   NAVIGATION CONFIG
========================================================= */

const BASE = "/admin/dashboard";

const NAV_GROUPS = [
  {
    label: "Content",
    items: [
      {
        to: `${BASE}/hero`,
        label: "Hero",
        icon: ImageIcon,
      },
      {
        to: `${BASE}/blogs`,
        label: "Blogs",
        icon: Newspaper,
      },
      {
        to: `${BASE}/packages`,
        label: "Packages",
        icon: Package,
      },
      {
        to: `${BASE}/most-visited`,
        label: "Most Visited",
        icon: Compass,
      },
      {
        to: `${BASE}/happy-moments`,
        label: "Happy Moments",
        icon: Smile,
      },
      {
        to: `${BASE}/testimonials`,
        label: "Testimonials",
        icon: MessageSquareQuote,
      },
      {
        to: `${BASE}/faqs`,
        label: "FAQs",
        icon: HelpCircle,
      },
      {
        to: `${BASE}/seasoned-destinations`,
        label: "Seasonal Destinations",
        icon: Sun,
      },
    ],
  },

  {
    label: "Operations",
    items: [
      {
        to: `${BASE}/enquiries`,
        label: "Enquiries",
        icon: Mail,
      },
    ],
  },
];

const ABOUT_ITEMS = [
  {
    to: `${BASE}/about`,
    label: "About Management",
    icon: Info,
    end: true,
  },
  {
    to: `${BASE}/about/leadership`,
    label: "Leadership",
    icon: Award,
  },
  {
    to: `${BASE}/about/team`,
    label: "Team",
    icon: Users,
  },
  {
    to: `${BASE}/about/milestones`,
    label: "Milestones",
    icon: Flag,
  },
  {
    to: `${BASE}/about/values`,
    label: "Values",
    icon: Heart,
  },
];

const POLICIES_ITEM = {
  to: `${BASE}/policies`,
  label: "Policies",
  icon: ScrollText,
};

const ADMIN_ITEMS = [
  {
    to: `${BASE}/creators`,
    label: "Manage Creators",
    icon: UserCog,
  },
  {
    to: `${BASE}/settings`,
    label: "Settings",
    icon: Settings,
  },
];

/*
 * Flat list used only to resolve the page title
 * shown in the header.
 */
const ALL_ITEMS = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  ...ABOUT_ITEMS,
  POLICIES_ITEM,
  ...ADMIN_ITEMS,
];

/* =========================================================
   SMALL PIECES
========================================================= */

const linkClass = ({ isActive }) =>
  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium
   transition-all duration-200 ease-soft
   ${
     isActive
       ? "bg-orange-gradient text-white shadow-brand"
       : "text-ink-600 hover:bg-surface-soft hover:text-primary"
   }`;

const subLinkClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium
   transition-all duration-200 ease-soft
   ${
     isActive
       ? "bg-primary-lighter text-primary"
       : "text-ink-500 hover:bg-surface-soft hover:text-ink-800"
   }`;

function NavItem({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={linkClass}
    >
      <Icon
        size={18}
        strokeWidth={1.75}
        className="shrink-0"
      />

      <span className="truncate">
        {label}
      </span>
    </NavLink>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="px-3 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted first:pt-1">
      {children}
    </p>
  );
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "A"
  );
}

/* =========================================================
   LAYOUT
========================================================= */

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { pathname } = useLocation();

  const isAboutRoute = pathname.startsWith(
    `${BASE}/about`
  );

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [aboutOpen, setAboutOpen] =
    useState(isAboutRoute);

  /* =======================================================
     PAGE TITLE
     Longest matching route wins
  ======================================================= */

  const current = useMemo(
    () =>
      ALL_ITEMS.filter((item) =>
        pathname.startsWith(item.to)
      ).sort(
        (a, b) =>
          b.to.length - a.to.length
      )[0],
    [pathname]
  );

  /* =======================================================
     CURRENT DATE
  ======================================================= */

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "short",
        }
      ),
    []
  );

  /* =======================================================
     CLOSE DRAWER ON NAVIGATION
  ======================================================= */

  useEffect(() => {
    setMobileOpen(false);

    if (isAboutRoute) {
      setAboutOpen(true);
    }
  }, [pathname, isAboutRoute]);

  /* =======================================================
     BODY SCROLL LOCK + ESC SUPPORT
  ======================================================= */

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKey = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      onKey
    );

    return () => {
      document.body.style.overflow = "";

      window.removeEventListener(
        "keydown",
        onKey
      );
    };
  }, [mobileOpen]);

  /* =======================================================
     CLOSE DRAWER
  ======================================================= */

  const closeDrawer = () => {
    setMobileOpen(false);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-surface font-body text-text">

      {/* =====================================================
          FIXED HEADER
          
          IMPORTANT:
          No md:left-64 anymore.

          Header always spans the full viewport because
          the sidebar is now an overlay drawer.
      ====================================================== */}

      <header className="fixed inset-x-0 top-0 z-50">

        {/* Brand accent line */}
        <div className="h-[3px] w-full bg-orange-gradient" />

        <div className="flex h-16 items-center justify-between gap-3 border-b border-divider bg-white/90 px-4 shadow-navbar backdrop-blur-md sm:px-6 lg:px-8">

          {/* -------------------------------------------------
              LEFT SIDE
          -------------------------------------------------- */}

          <div className="flex min-w-0 items-center gap-3">

            {/* Menu button */}
            <button
              type="button"
              onClick={() =>
                setMobileOpen(true)
              }
              aria-label="Open admin menu"
              aria-expanded={mobileOpen}
              className="flex shrink-0 items-center justify-center rounded-xl border border-divider bg-white p-2 text-ink-600 shadow-sm transition-all duration-200 hover:border-primary hover:bg-primary-lighter hover:text-primary"
            >
              <Menu size={20} />
            </button>

            {/* Page title */}
            <div className="min-w-0">

              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:block">
                Admin
                <span className="mx-1 text-accent">
                  /
                </span>
                Dashboard
              </p>

              <h1 className="truncate font-display text-[21px] font-semibold leading-tight text-text-display sm:text-2xl">
                {current?.label ?? "Dashboard"}
              </h1>

            </div>
          </div>

          {/* -------------------------------------------------
              RIGHT SIDE
          -------------------------------------------------- */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">

            {/* Date */}
            <span className="hidden text-xs font-medium text-muted lg:block">
              {today}
            </span>

            {/* View site */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-ink-700 transition-all hover:border-primary hover:bg-primary-lighter hover:text-primary sm:inline-flex"
            >
              View site
              <ExternalLink size={13} />
            </a>

            {/* Profile */}
            <div className="flex items-center gap-2.5 rounded-full border border-divider bg-white py-1 pl-1 pr-1 shadow-travel-card sm:pr-4">

              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-gradient text-xs font-semibold text-white">
                {getInitials(user?.name)}
              </span>

              <div className="hidden min-w-0 leading-tight sm:block">

                <p className="max-w-[140px] truncate text-[13px] font-semibold text-ink-800">
                  {user?.name}
                </p>

                <p className="text-[11px] font-medium capitalize text-primary">
                  {user?.role}
                </p>

              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          DRAWER OVERLAY
          
          Works on ALL screen sizes.
      ====================================================== */}

      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`fixed inset-0 z-[55] bg-ink-900/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* =====================================================
          SIDEBAR / DRAWER
          
          IMPORTANT:
          There is NO md:translate-x-0.

          Therefore the sidebar is hidden by default on
          desktop too and opens only when the menu button
          is clicked.
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[88vw] flex-col border-r border-divider bg-card
          shadow-travel-hover
          transition-transform duration-300 ease-soft
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
      >

        {/* =================================================
            BRAND
        ================================================== */}

        <div className="relative border-b border-divider bg-petal-gradient px-5 py-5">

          {/* Close button */}
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close admin menu"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white hover:text-primary"
          >
            <X size={18} />
          </button>

          <p className="font-display text-[28px] font-semibold leading-none text-primary">
            Manyara
          </p>

          <p className="mt-1 font-display text-lg font-medium italic leading-none text-ink-700">
            Privé Vacations
          </p>

          <div className="mt-3 flex items-center gap-2">

            <span className="h-px w-8 bg-accent" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Admin panel
            </p>

          </div>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4 [scrollbar-color:#DCD5DA_transparent] [scrollbar-width:thin]">

          {/* -------------------------------------------------
              CONTENT / OPERATIONS
          -------------------------------------------------- */}

          {NAV_GROUPS.map((group) => (
            <div
              key={group.label}
              className="flex flex-col gap-0.5"
            >

              <SectionLabel>
                {group.label}
              </SectionLabel>

              {group.items.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  onNavigate={closeDrawer}
                />
              ))}

            </div>
          ))}

          {/* -------------------------------------------------
              COMPANY
          -------------------------------------------------- */}

          <SectionLabel>
            Company
          </SectionLabel>

          <button
            type="button"
            onClick={() =>
              setAboutOpen(
                (previous) => !previous
              )
            }
            aria-expanded={aboutOpen}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200 ${
              isAboutRoute
                ? "bg-primary-lighter text-primary"
                : "text-ink-600 hover:bg-surface-soft hover:text-primary"
            }`}
          >

            <span className="flex items-center gap-3">

              <Info
                size={18}
                strokeWidth={1.75}
              />

              About
            </span>

            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                aboutOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {/* -------------------------------------------------
              ABOUT SUB MENU
          -------------------------------------------------- */}

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-soft ${
              aboutOpen
                ? "grid-rows-[1fr]"
                : "grid-rows-[0fr]"
            }`}
          >

            <div className="overflow-hidden">

              <div className="my-1 ml-5 space-y-0.5 border-l border-border pl-3">

                {ABOUT_ITEMS.map(
                  ({
                    to,
                    label,
                    icon: Icon,
                    end,
                  }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={closeDrawer}
                      className={subLinkClass}
                    >

                      <Icon
                        size={14}
                        strokeWidth={1.75}
                        className="shrink-0"
                      />

                      <span className="truncate">
                        {label}
                      </span>

                    </NavLink>
                  )
                )}

              </div>
            </div>
          </div>

          {/* Policies */}
          <NavItem
            {...POLICIES_ITEM}
            onNavigate={closeDrawer}
          />

          {/* -------------------------------------------------
              ADMINISTRATION
          -------------------------------------------------- */}

          {isAdmin && (
            <div className="flex flex-col gap-0.5">

              <SectionLabel>
                Administration
              </SectionLabel>

              {ADMIN_ITEMS.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  onNavigate={closeDrawer}
                />
              ))}

            </div>
          )}
        </nav>

        {/* =================================================
            USER / LOGOUT
        ================================================== */}

        <div className="border-t border-divider bg-surface-soft p-3">

          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-travel-card">

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-gradient text-sm font-semibold text-white">
              {getInitials(user?.name)}
            </span>

            <div className="min-w-0 flex-1 leading-tight">

              <p className="truncate text-sm font-semibold text-ink-800">
                {user?.name}
              </p>

              <p className="mt-0.5 text-[11px] font-medium capitalize text-primary">
                {user?.role}
              </p>

            </div>

            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-primary-lighter hover:text-primary"
            >
              <LogOut size={16} />
            </button>

          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
          
          IMPORTANT:
          No md:pl-64.

          The page always uses the complete viewport width.
          The drawer overlays it when opened.
      ====================================================== */}

      <main className="min-h-screen min-w-0 w-full overflow-x-hidden pt-[67px]">

        <div className="w-full min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

          <div className="mx-auto w-full min-w-0 max-w-[1600px]">

            <Outlet />

          </div>

        </div>
      </main>
    </div>
  );
}



