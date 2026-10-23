
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Heart,
  Images,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getHappyMoments } from "../api/content";
import useLoadMore from "../hooks/useLoadMore";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";
import LoadMoreButton from "../components/LoadMoreButton";
import Seo from "../components/Seo";

/*
 * Cards shown first, and added on each "Load more" click.
 * The grid has 3 columns on large screens, so a multiple of 3
 * avoids a half-empty last row.
 */
const PAGE_SIZE = 9;

/* =========================================================
   IMAGE HELPER
========================================================= */

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image?.url || image?.secure_url || "";
  }

  return "";
}

/* =========================================================
   DATE HELPER
========================================================= */

function formatTravelDate(value) {
  if (!value) return "";

  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

/* =========================================================
   HAPPY MOMENT CARD
========================================================= */

function HappyMomentCard({ item }) {
  const title = item?.title?.trim() || "Happy Travel Moment";

  const placeName = item?.place_name?.trim() || "";

  const caption =
    item?.short_caption?.trim() || item?.place_description?.trim() || "";

  const coverImage = getImageUrl(item?.image);

  const galleryCount = Array.isArray(item?.gallery_images)
    ? item.gallery_images.length
    : 0;

  const totalPhotos = (coverImage ? 1 : 0) + galleryCount;

  const travelDate = formatTravelDate(item?.travel_date);

  return (
    <Link
      to={`/happy-moments/${item?.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card transition-all duration-300 ease-soft hover:-translate-y-1 hover:border-secondary-light hover:shadow-travel-hover"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface">
        {coverImage ? (
          <img
            src={coverImage}
            alt={placeName ? `${title} in ${placeName}` : title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.045]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-petal-gradient">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/15 bg-white/80 text-accent/50">
              <Heart className="h-7 w-7" aria-hidden="true" />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/55 via-ink-900/5 to-transparent opacity-90" />

        {totalPhotos > 1 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink-900/65 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md">
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            {totalPhotos} Photos
          </span>
        )}

        <span
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/90 text-primary shadow-sm backdrop-blur-sm"
          aria-hidden="true"
        >
          <Heart className="h-3.5 w-3.5" fill="currentColor" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {placeName && (
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary sm:text-[11px]">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

            <span className="truncate">{placeName}</span>
          </div>
        )}

        <h3 className="mt-3 line-clamp-2 font-display text-xl font-semibold leading-[1.12] text-text-dark transition-colors duration-200 group-hover:text-primary sm:text-[22px]">
          {title}
        </h3>

        {caption && (
          <p className="mt-2.5 line-clamp-3 flex-1 text-sm leading-6 text-text-secondary">
            {caption}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-divider pt-3.5">
          {travelDate ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted sm:text-xs">
              <CalendarDays
                className="h-3.5 w-3.5 shrink-0 text-accent"
                aria-hidden="true"
              />

              <span className="truncate">{travelDate}</span>
            </span>
          ) : (
            <span />
          )}

          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-colors group-hover:text-primary-dark sm:text-sm">
            Read story

            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   HAPPY MOMENTS PAGE
========================================================= */

export default function HappyMoments() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMoments = async () => {
      try {
        setLoading(true);

        const response = await getHappyMoments();

        const data = response?.data ?? response ?? [];

        if (!mounted) return;

        setMoments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load happy moments:", error);

        if (mounted) {
          setMoments([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMoments();

    return () => {
      mounted = false;
    };
  }, []);

  /* ========================================================
     LOAD MORE
     Show the first PAGE_SIZE moments, then reveal more on
     each "Load more" click. Goes back to the first batch
     whenever the list of moments changes.
     ======================================================== */

  const { visible, remaining, loadMore } = useLoadMore(moments, {
    pageSize: PAGE_SIZE,
    resetKey: String(moments.length),
  });

  return (
    <>
      {/* =================================================
          SEO
      ================================================= */}

      <Seo
        title="Happy Moments"
        description="Explore real travel memories, beautiful journeys, and happy moments from travellers who experienced unforgettable holidays with Manyara Prive Vacations."
        path="/happy-moments"
        image="/og-default.jpg"
        imageAlt="Happy Moments — Manyara Prive Vacations"
        type="website"
      />

      <main className="min-h-screen bg-background">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="border-b border-divider bg-petal-gradient">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted transition-colors hover:text-primary sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />

              Back to Home
            </Link>

            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur-sm sm:text-xs">
                <Heart
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  aria-hidden="true"
                />

                Memories from our travellers
              </p>

              <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.98] tracking-tight text-text-display sm:text-5xl lg:text-6xl">
                Happy Moments
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
                Real journeys, real smiles. Explore travel memories created
                with Manyara Prive Vacations.
              </p>

              <div
                className="mt-6 h-1 w-16 rounded-full bg-orange-gradient"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        {/* =================================================
            STORIES
        ================================================= */}

        <section className="bg-background py-9 sm:py-11 lg:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col gap-2 sm:mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-xs">
                Travel stories
              </p>

              <h2 className="font-display text-3xl font-semibold leading-tight text-text-dark sm:text-4xl">
                Moments worth remembering
              </h2>

              <div
                className="mt-1 h-px w-20 bg-accent/40"
                aria-hidden="true"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card"
                    aria-hidden="true"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-surface-strong" />

                    <div className="space-y-3 p-5">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-primary/10" />

                      <div className="space-y-2">
                        <div className="h-5 w-[86%] animate-pulse rounded bg-primary/10" />

                        <div className="h-5 w-[62%] animate-pulse rounded bg-primary/10" />
                      </div>

                      <div className="h-4 w-full animate-pulse rounded bg-primary/10" />

                      <div className="h-4 w-[78%] animate-pulse rounded bg-primary/10" />

                      <div className="mt-5 border-t border-divider pt-4">
                        <div className="h-4 w-28 animate-pulse rounded bg-primary/10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : moments.length === 0 ? (
              <div className="mx-auto max-w-2xl rounded-3xl border border-divider bg-petal-gradient p-8 text-center shadow-travel-card sm:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/10 bg-white text-primary shadow-sm">
                  <Heart className="h-7 w-7" aria-hidden="true" />
                </div>

                <h3 className="mt-5 font-display text-2xl font-semibold text-text-dark">
                  No happy moments yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  Travel stories will appear here once our team publishes them.
                </p>

                <Link
                  to="/packages"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-orange transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand"
                >
                  Explore Packages

                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {visible.map((moment) => (
                    <HappyMomentCard
                      key={moment?.id || moment?.slug}
                      item={moment}
                    />
                  ))}
                </div>

                <LoadMoreButton
                  shown={visible.length}
                  total={moments.length}
                  remaining={remaining}
                  pageSize={PAGE_SIZE}
                  onClick={loadMore}
                />
              </>
            )}
          </div>
        </section>
      </main>

      <FAQSection category="general" />

      <Footer />
    </>
  );
}






























// import { useEffect, useState } from "react";
// import {
//   ArrowLeft,
//   ArrowRight,
//   CalendarDays,
//   Heart,
//   Images,
//   MapPin,
// } from "lucide-react";
// import { Link } from "react-router-dom";
// import { getHappyMoments } from "../api/content";
// import Footer from "../components/Footer";
// import FAQSection from "../components/FAQSection";
// import Seo from "../components/Seo";

// /* =========================================================
//    IMAGE HELPER
// ========================================================= */

// function getImageUrl(image) {
//   if (!image) return "";

//   if (typeof image === "string") {
//     return image;
//   }

//   if (typeof image === "object") {
//     return image?.url || image?.secure_url || "";
//   }

//   return "";
// }

// /* =========================================================
//    DATE HELPER
// ========================================================= */

// function formatTravelDate(value) {
//   if (!value) return "";

//   try {
//     return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
//       day: "numeric",
//       month: "short",
//       year: "numeric",
//     });
//   } catch {
//     return String(value);
//   }
// }

// /* =========================================================
//    HAPPY MOMENT CARD
// ========================================================= */

// function HappyMomentCard({ item }) {
//   const title =
//     item?.title?.trim() || "Happy Travel Moment";

//   const placeName =
//     item?.place_name?.trim() || "";

//   const caption =
//     item?.short_caption?.trim() ||
//     item?.place_description?.trim() ||
//     "";

//   const coverImage = getImageUrl(item?.image);

//   const galleryCount = Array.isArray(item?.gallery_images)
//     ? item.gallery_images.length
//     : 0;

//   const totalPhotos =
//     (coverImage ? 1 : 0) + galleryCount;

//   const travelDate = formatTravelDate(item?.travel_date);

//   return (
//     <Link
//       to={`/happy-moments/${item?.slug}`}
//       className="
//         group
//         flex
//         h-full
//         flex-col
//         overflow-hidden
//         rounded-2xl
//         border
//         border-divider
//         bg-card
//         shadow-travel-card
//         transition-all
//         duration-300
//         ease-soft
//         hover:-translate-y-1
//         hover:border-secondary-light
//         hover:shadow-travel-hover
//       "
//     >
//       <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface">
//         {coverImage ? (
//           <img
//             src={coverImage}
//             alt={
//               placeName
//                 ? `${title} in ${placeName}`
//                 : title
//             }
//             loading="lazy"
//             decoding="async"
//             className="
//               h-full
//               w-full
//               object-cover
//               transition-transform
//               duration-700
//               ease-soft
//               group-hover:scale-[1.045]
//             "
//           />
//         ) : (
//           <div
//             className="
//               flex
//               h-full
//               w-full
//               items-center
//               justify-center
//               bg-petal-gradient
//             "
//           >
//             <div
//               className="
//                 flex
//                 h-14
//                 w-14
//                 items-center
//                 justify-center
//                 rounded-full
//                 border
//                 border-accent/15
//                 bg-white/80
//                 text-accent/50
//               "
//             >
//               <Heart
//                 className="h-7 w-7"
//                 aria-hidden="true"
//               />
//             </div>
//           </div>
//         )}

//         <div
//           className="
//             pointer-events-none
//             absolute
//             inset-0
//             bg-gradient-to-t
//             from-ink-900/55
//             via-ink-900/5
//             to-transparent
//             opacity-90
//           "
//         />

//         {totalPhotos > 1 && (
//           <span
//             className="
//               absolute
//               bottom-3
//               right-3
//               inline-flex
//               items-center
//               gap-1.5
//               rounded-full
//               border
//               border-white/20
//               bg-ink-900/65
//               px-3
//               py-1.5
//               text-[11px]
//               font-semibold
//               text-white
//               shadow-sm
//               backdrop-blur-md
//             "
//           >
//             <Images
//               className="h-3.5 w-3.5"
//               aria-hidden="true"
//             />
//             {totalPhotos} Photos
//           </span>
//         )}

//         <span
//           className="
//             absolute
//             left-3
//             top-3
//             flex
//             h-8
//             w-8
//             items-center
//             justify-center
//             rounded-full
//             border
//             border-white/20
//             bg-white/90
//             text-primary
//             shadow-sm
//             backdrop-blur-sm
//           "
//           aria-hidden="true"
//         >
//           <Heart
//             className="h-3.5 w-3.5"
//             fill="currentColor"
//           />
//         </span>
//       </div>

//       <div className="flex flex-1 flex-col p-4 sm:p-5">
//         {placeName && (
//           <div
//             className="
//               inline-flex
//               w-fit
//               items-center
//               gap-1.5
//               rounded-full
//               bg-surface-soft
//               px-2.5
//               py-1
//               text-[10px]
//               font-semibold
//               uppercase
//               tracking-[0.08em]
//               text-primary
//               sm:text-[11px]
//             "
//           >
//             <MapPin
//               className="h-3.5 w-3.5 shrink-0"
//               aria-hidden="true"
//             />

//             <span className="truncate">
//               {placeName}
//             </span>
//           </div>
//         )}

//         <h3
//           className="
//             mt-3
//             line-clamp-2
//             font-display
//             text-xl
//             font-semibold
//             leading-[1.12]
//             text-text-dark
//             transition-colors
//             duration-200
//             group-hover:text-primary
//             sm:text-[22px]
//           "
//         >
//           {title}
//         </h3>

//         {caption && (
//           <p
//             className="
//               mt-2.5
//               line-clamp-3
//               flex-1
//               text-sm
//               leading-6
//               text-text-secondary
//             "
//           >
//             {caption}
//           </p>
//         )}

//         <div
//           className="
//             mt-5
//             flex
//             items-center
//             justify-between
//             gap-3
//             border-t
//             border-divider
//             pt-3.5
//           "
//         >
//           {travelDate ? (
//             <span
//               className="
//                 inline-flex
//                 min-w-0
//                 items-center
//                 gap-1.5
//                 text-[11px]
//                 font-medium
//                 text-muted
//                 sm:text-xs
//               "
//             >
//               <CalendarDays
//                 className="h-3.5 w-3.5 shrink-0 text-accent"
//                 aria-hidden="true"
//               />

//               <span className="truncate">
//                 {travelDate}
//               </span>
//             </span>
//           ) : (
//             <span />
//           )}

//           <span
//             className="
//               inline-flex
//               shrink-0
//               items-center
//               gap-1
//               text-xs
//               font-semibold
//               text-primary
//               transition-colors
//               group-hover:text-primary-dark
//               sm:text-sm
//             "
//           >
//             Read story

//             <ArrowRight
//               className="
//                 h-4
//                 w-4
//                 transition-transform
//                 duration-200
//                 group-hover:translate-x-0.5
//               "
//               aria-hidden="true"
//             />
//           </span>
//         </div>
//       </div>
//     </Link>
//   );
// }

// /* =========================================================
//    HAPPY MOMENTS PAGE
// ========================================================= */

// export default function HappyMoments() {
//   const [moments, setMoments] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let mounted = true;

//     const loadMoments = async () => {
//       try {
//         setLoading(true);

//         const response = await getHappyMoments();

//         const data =
//           response?.data ??
//           response ??
//           [];

//         if (!mounted) return;

//         setMoments(
//           Array.isArray(data)
//             ? data
//             : []
//         );
//       } catch (error) {
//         console.error(
//           "Failed to load happy moments:",
//           error
//         );

//         if (mounted) {
//           setMoments([]);
//         }
//       } finally {
//         if (mounted) {
//           setLoading(false);
//         }
//       }
//     };

//     loadMoments();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   return (
//     <>
//       {/* =================================================
//           SEO
//       ================================================= */}

//       <Seo
//         title="Happy Moments"
//         description="Explore real travel memories, beautiful journeys, and happy moments from travellers who experienced unforgettable holidays with Manyara Prive Vacations."
//         path="/happy-moments"
//         image="/og-default.jpg"
//         imageAlt="Happy Moments — Manyara Prive Vacations"
//         type="website"
//       />

//       <main className="min-h-screen bg-background">
//         {/* =================================================
//             HERO
//         ================================================= */}

//         <section
//           className="
//             border-b
//             border-divider
//             bg-petal-gradient
//           "
//         >
//           <div
//             className="
//               mx-auto
//               max-w-7xl
//               px-4
//               py-8
//               sm:px-6
//               sm:py-10
//               lg:px-8
//               lg:py-14
//             "
//           >
//             <Link
//               to="/"
//               className="
//                 mb-6
//                 inline-flex
//                 items-center
//                 gap-2
//                 text-xs
//                 font-medium
//                 text-muted
//                 transition-colors
//                 hover:text-primary
//                 sm:text-sm
//               "
//             >
//               <ArrowLeft
//                 className="h-4 w-4"
//                 aria-hidden="true"
//               />

//               Back to Home
//             </Link>

//             <div className="max-w-3xl">
//               <p
//                 className="
//                   inline-flex
//                   items-center
//                   gap-2
//                   rounded-full
//                   border
//                   border-primary/10
//                   bg-white/75
//                   px-3
//                   py-1.5
//                   text-[10px]
//                   font-semibold
//                   uppercase
//                   tracking-[0.14em]
//                   text-primary
//                   shadow-sm
//                   backdrop-blur-sm
//                   sm:text-xs
//                 "
//               >
//                 <Heart
//                   className="h-3.5 w-3.5"
//                   fill="currentColor"
//                   aria-hidden="true"
//                 />

//                 Memories from our travellers
//               </p>

//               <h1
//                 className="
//                   mt-4
//                   font-display
//                   text-4xl
//                   font-semibold
//                   leading-[0.98]
//                   tracking-tight
//                   text-text-display
//                   sm:text-5xl
//                   lg:text-6xl
//                 "
//               >
//                 Happy Moments
//               </h1>

//               <p
//                 className="
//                   mt-4
//                   max-w-2xl
//                   text-sm
//                   leading-6
//                   text-text-secondary
//                   sm:text-base
//                   sm:leading-7
//                 "
//               >
//                 Real journeys, real smiles. Explore
//                 travel memories created with Manyara
//                 Prive Vacations.
//               </p>

//               <div
//                 className="
//                   mt-6
//                   h-1
//                   w-16
//                   rounded-full
//                   bg-orange-gradient
//                 "
//                 aria-hidden="true"
//               />
//             </div>
//           </div>
//         </section>

//         {/* =================================================
//             STORIES
//         ================================================= */}

//         <section
//           className="
//             bg-background
//             py-9
//             sm:py-11
//             lg:py-14
//           "
//         >
//           <div
//             className="
//               mx-auto
//               max-w-7xl
//               px-4
//               sm:px-6
//               lg:px-8
//             "
//           >
//             <div
//               className="
//                 mb-7
//                 flex
//                 flex-col
//                 gap-2
//                 sm:mb-8
//               "
//             >
//               <p
//                 className="
//                   text-[10px]
//                   font-semibold
//                   uppercase
//                   tracking-[0.16em]
//                   text-primary
//                   sm:text-xs
//                 "
//               >
//                 Travel stories
//               </p>

//               <h2
//                 className="
//                   font-display
//                   text-3xl
//                   font-semibold
//                   leading-tight
//                   text-text-dark
//                   sm:text-4xl
//                 "
//               >
//                 Moments worth remembering
//               </h2>

//               <div
//                 className="
//                   mt-1
//                   h-px
//                   w-20
//                   bg-accent/40
//                 "
//                 aria-hidden="true"
//               />
//             </div>

//             {loading ? (
//               <div
//                 className="
//                   grid
//                   grid-cols-1
//                   gap-5
//                   sm:grid-cols-2
//                   sm:gap-6
//                   lg:grid-cols-3
//                 "
//               >
//                 {[1, 2, 3, 4, 5, 6].map((i) => (
//                   <div
//                     key={i}
//                     className="
//                       overflow-hidden
//                       rounded-2xl
//                       border
//                       border-divider
//                       bg-card
//                       shadow-travel-card
//                     "
//                     aria-hidden="true"
//                   >
//                     <div
//                       className="
//                         aspect-[4/3]
//                         animate-pulse
//                         bg-surface-strong
//                       "
//                     />

//                     <div className="space-y-3 p-5">
//                       <div
//                         className="
//                           h-3
//                           w-24
//                           animate-pulse
//                           rounded-full
//                           bg-primary/10
//                         "
//                       />

//                       <div className="space-y-2">
//                         <div
//                           className="
//                             h-5
//                             w-[86%]
//                             animate-pulse
//                             rounded
//                             bg-primary/10
//                           "
//                         />

//                         <div
//                           className="
//                             h-5
//                             w-[62%]
//                             animate-pulse
//                             rounded
//                             bg-primary/10
//                           "
//                         />
//                       </div>

//                       <div
//                         className="
//                           h-4
//                           w-full
//                           animate-pulse
//                           rounded
//                           bg-primary/10
//                         "
//                       />

//                       <div
//                         className="
//                           h-4
//                           w-[78%]
//                           animate-pulse
//                           rounded
//                           bg-primary/10
//                         "
//                       />

//                       <div
//                         className="
//                           mt-5
//                           border-t
//                           border-divider
//                           pt-4
//                         "
//                       >
//                         <div
//                           className="
//                             h-4
//                             w-28
//                             animate-pulse
//                             rounded
//                             bg-primary/10
//                           "
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : moments.length === 0 ? (
//               <div
//                 className="
//                   mx-auto
//                   max-w-2xl
//                   rounded-3xl
//                   border
//                   border-divider
//                   bg-petal-gradient
//                   p-8
//                   text-center
//                   shadow-travel-card
//                   sm:p-12
//                 "
//               >
//                 <div
//                   className="
//                     mx-auto
//                     flex
//                     h-16
//                     w-16
//                     items-center
//                     justify-center
//                     rounded-full
//                     border
//                     border-primary/10
//                     bg-white
//                     text-primary
//                     shadow-sm
//                   "
//                 >
//                   <Heart
//                     className="h-7 w-7"
//                     aria-hidden="true"
//                   />
//                 </div>

//                 <h3
//                   className="
//                     mt-5
//                     font-display
//                     text-2xl
//                     font-semibold
//                     text-text-dark
//                   "
//                 >
//                   No happy moments yet
//                 </h3>

//                 <p
//                   className="
//                     mx-auto
//                     mt-2
//                     max-w-md
//                     text-sm
//                     leading-6
//                     text-text-secondary
//                   "
//                 >
//                   Travel stories will appear here once
//                   our team publishes them.
//                 </p>

//                 <Link
//                   to="/packages"
//                   className="
//                     mt-6
//                     inline-flex
//                     items-center
//                     gap-2
//                     rounded-full
//                     bg-orange-gradient
//                     px-5
//                     py-2.5
//                     text-sm
//                     font-semibold
//                     text-white
//                     shadow-orange
//                     transition-all
//                     duration-200
//                     hover:-translate-y-0.5
//                     hover:shadow-brand
//                   "
//                 >
//                   Explore Packages

//                   <ArrowRight
//                     className="h-4 w-4"
//                     aria-hidden="true"
//                   />
//                 </Link>
//               </div>
//             ) : (
//               <div
//                 className="
//                   grid
//                   grid-cols-1
//                   gap-5
//                   sm:grid-cols-2
//                   sm:gap-6
//                   lg:grid-cols-3
//                 "
//               >
//                 {moments.map((moment) => (
//                   <HappyMomentCard
//                     key={
//                       moment?.id ||
//                       moment?.slug
//                     }
//                     item={moment}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//         </section>
//       </main>

//       <FAQSection category="general" />

//       <Footer />
//     </>
//   );
// }









