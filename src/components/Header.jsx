
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Most Visited", href: "/destinations" },
  { label: "Seasonal Views", href: "/seasoned-destinations" },
   { label: "Packages", href: "/packages" },
  { label: "Happy Moments", href: "/happy-moments" },
  { label: "Reviews", href: "/reviews" },
  { label: "Blogs", href: "/blog" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

const HEADER_HEIGHT = {
  mobile: 58,
  tablet: 62,
  desktop: 66,
};

function getHeaderHeight() {
  if (window.innerWidth >= 1024) {
    return HEADER_HEIGHT.desktop;
  }

  if (window.innerWidth >= 640) {
    return HEADER_HEIGHT.tablet;
  }

  return HEADER_HEIGHT.mobile;
}

export default function Header({ onPlanTrip }) {
  const [open, setOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // ============================================================
  // HEADER REF
  // Used only for detecting clicks/touches outside the header
  // ============================================================
  const headerRef = useRef(null);

  const closeMenu = () => {
    setOpen(false);
  };

  // ============================================================
  // CLOSE MENU WHEN USER CLICKS / TOUCHES OUTSIDE HEADER
  // ============================================================
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  // ============================================================
  // HOME
  // ============================================================
  const handleHome = () => {
    closeMenu();

    if (location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      window.history.replaceState(null, "", "/");
      return;
    }

    navigate("/");
  };

  // ============================================================
  // SECTION NAVIGATION
  // ============================================================
  const handleSectionNavigation = (sectionId) => {
    closeMenu();

    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      return;
    }

    const element = document.getElementById(sectionId);

    if (!element) {
      return;
    }

    const rootStyles = getComputedStyle(
      document.documentElement
    );

    const topInfoHeight =
      parseInt(
        rootStyles.getPropertyValue("--top-info-height"),
        10
      ) || 0;

    const headerHeight = getHeaderHeight();

    const offset =
      topInfoHeight + headerHeight + 12;

    const elementPosition =
      element.getBoundingClientRect().top +
      window.scrollY;

    window.scrollTo({
      top: Math.max(
        0,
        elementPosition - offset
      ),
      behavior: "smooth",
    });

    window.history.replaceState(
      null,
      "",
      `/#${sectionId}`
    );
  };

  // ============================================================
  // PLAN A TRIP
  // ============================================================
  const handlePlanTrip = () => {
    closeMenu();
    onPlanTrip?.();
  };

  // ============================================================
  // NAVIGATION LINK
  // ============================================================
  const renderNavLink = (link, mobile = false) => {
    const className = mobile
      ? `
          block w-full
          border-b border-border
          py-3
          text-left text-sm font-medium
          text-text
          transition-colors duration-200
          hover:bg-surface-soft
          hover:text-rose-700
        `
      : `
          whitespace-nowrap
          rounded-full
          px-2 py-1
          text-[13px] font-medium
          text-text
          transition-colors duration-200
          hover:bg-surface-soft
          hover:text-rose-700
        `;

    // ----------------------------------------------------------
    // HOME
    // ----------------------------------------------------------
    if (link.href === "/") {
      return (
        <button
          key={link.label}
          type="button"
          onClick={handleHome}
          className={className}
        >
          {link.label}
        </button>
      );
    }

    // ----------------------------------------------------------
    // SECTION
    // ----------------------------------------------------------
    if (link.section) {
      return (
        <button
          key={link.label}
          type="button"
          onClick={() =>
            handleSectionNavigation(link.section)
          }
          className={className}
        >
          {link.label}
        </button>
      );
    }

    // ----------------------------------------------------------
    // NORMAL ROUTE
    // ----------------------------------------------------------
    return (
      <Link
        key={link.href}
        to={link.href}
        onClick={closeMenu}
        className={className}
      >
        {link.label}
      </Link>
    );
  };

return (
  <>
    {/* ============================================================
        MOBILE OUTSIDE-CLICK BACKDROP
        Closes the menu when the user taps anywhere outside it.
        ============================================================ */}
    {open && (
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={closeMenu}
        className="
          fixed inset-0
          z-40
          bg-transparent
          lg:hidden
          cursor-default
        "
      />
    )}

    <header
      ref={headerRef}
      className="
        fixed inset-x-0 z-50 w-full
        border-b border-border
        bg-ivory/95
        backdrop-blur-md
        shadow-navbar
      "
      style={{
        top: "var(--top-info-height, 0px)",
      }}
    >
      {/* ========================================================
          MAIN HEADER
          ======================================================== */}
      <div
        className="
          mx-auto
          flex w-full max-w-7xl
          items-center justify-between
          gap-3
          px-3 sm:px-5 md:px-6 lg:px-8
          h-[58px] sm:h-[62px] lg:h-[66px]
        "
      >
        {/* ======================================================
            MANYARA PRIVE VACATIONS LOGO
            ====================================================== */}
        <button
          type="button"
          onClick={handleHome}
          className="
            flex min-w-0 shrink-0
            items-center
            rounded-md
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-rose-500
            focus-visible:ring-offset-2
          "
          aria-label="Manyara Prive Vacations Home"
        >
          {/* <img
            src="/images/manyara_logo.webp"
            alt="Manyara Prive Vacations"
            className="
              block
              h-8 w-auto
              max-w-[140px]
              shrink-0
              object-contain
              transition-all
              duration-300
              ease-out
              hover:drop-shadow-[0_0_5px_rgba(244,114,182,0.45)]
              sm:h-14
              sm:max-w-[170px]
              sm:-ml-2
              lg:h-10
              lg:max-w-[165px]
            "
          /> */}
          
          <img
              src="/images/manyara_logo.webp"
              alt="Manyara Prive Vacations"
              className="
                block shrink-0 object-contain
                h-9 w-auto max-w-[44vw]
                sm:h-11 sm:max-w-[200px]
                lg:h-11 lg:max-w-[160px]
                xl:h-12 xl:max-w-[200px]
                transition-all duration-300 ease-out
                hover:drop-shadow-[0_0_5px_rgba(244,114,182,0.45)]
              "
            />
        </button>

        {/* ======================================================
            DESKTOP NAVIGATION
            ====================================================== */}
        <nav
          className="
            hidden
            min-w-0
            flex-1
            items-center
            justify-center
            gap-1
            lg:flex
            xl:gap-2
            2xl:gap-3
          "
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => renderNavLink(link))}
        </nav>

        {/* ======================================================
            DESKTOP PLAN A TRIP
            ====================================================== */}
        <div className="hidden shrink-0 lg:block">
          <button
            type="button"
            onClick={handlePlanTrip}
            className="
              whitespace-nowrap
              rounded-full
              bg-rose-600
              px-4 py-2
              text-[13px]
              font-semibold
              text-white
              shadow-brand
              transition-all duration-200
              hover:bg-rose-700
              hover:shadow-travel-hover
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-rose-500
              focus-visible:ring-offset-2
            "
          >
            Plan a Trip
          </button>
        </div>

        {/* ======================================================
            TABLET / MOBILE ACTIONS
            ====================================================== */}
        <div
          className="
            flex
            shrink-0
            items-center
            gap-1.5
            lg:hidden
          "
        >
          <button
            type="button"
            onClick={handlePlanTrip}
            className="
              shrink-0
              whitespace-nowrap
              rounded-full
              bg-rose-600
              px-3 py-1.5
              text-[11px]
              font-semibold
              text-white
              shadow-brand
              transition-colors duration-200
              hover:bg-rose-700
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-rose-500
              focus-visible:ring-offset-2
              sm:px-3.5
              sm:py-2
              sm:text-xs
            "
          >
            Plan a Trip
          </button>

          {/* ====================================================
              BURGER / CLOSE BUTTON
              ==================================================== */}
          <button
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            className="
              relative
              z-[60]
              flex
              h-9 w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-ink-800
              transition-colors duration-200
              hover:bg-surface-soft
              hover:text-rose-700
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-rose-500
              focus-visible:ring-offset-2
            "
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          MOBILE / TABLET NAVIGATION
          ======================================================== */}
      {open && (
        <nav
          id="mobile-navigation"
          className="
            relative
            z-[55]
            max-h-[calc(100vh-120px)]
            overflow-y-auto
            border-t border-border
            bg-card
            px-4
            pb-3
            pt-1
            shadow-navbar
            sm:px-6
            lg:hidden
          "
          aria-label="Mobile navigation"
          onClick={(event) => {
            /*
             * If the user taps an actual navigation item,
             * that item's own onClick will close the menu.
             *
             * This prevents accidental closing when interacting
             * with the navigation container itself.
             */
            event.stopPropagation();
          }}
        >
          {NAV_LINKS.map((link) => renderNavLink(link, true))}

          <button
            type="button"
            onClick={handlePlanTrip}
            className="
              mt-3
              w-full
              rounded-full
              bg-rose-600
              px-4 py-2.5
              text-sm
              font-semibold
              text-white
              shadow-brand
              transition-colors duration-200
              hover:bg-rose-700
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-rose-500
              focus-visible:ring-offset-2
            "
          >
            Plan a Trip
          </button>
        </nav>
      )}
    </header>
  </>
);

}


