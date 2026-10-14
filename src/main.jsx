

import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import "../premium_motion.css";

import {
  getHero,
  getSiteSettings,
  getPackages,
  getMostVisited,
  getSeasonedDestinations,
  getBlogs,
} from "./api/content";

const quiet = () => {};

if (window.location.pathname === "/") {
  /* Above the fold: start immediately */
  [getHero, getSiteSettings, getMostVisited].forEach((query) =>
    query().catch(quiet)
  );

  /* Below the fold: start once the first screen's requests are under way.
     Their useQuery calls share the same pending promise, so nothing is
     fetched twice. */
  const prefetchLater = () =>
    [getPackages, getSeasonedDestinations, getBlogs].forEach((query) =>
      query().catch(quiet)
    );

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(prefetchLater, { timeout: 2000 });
  } else {
    setTimeout(prefetchLater, 1500);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);














































// import React from "react";
// import ReactDOM from "react-dom/client";
// import { HelmetProvider } from "react-helmet-async";
// import App from "./App";
// import "./index.css";
// import "../premium_motion.css";

// import {
//   getHero,
//   getMostVisited,
//   getPackages,
//   getSeasonedDestinations,
//   getSiteSettings,
//   getBlogs
// } from "./api/content";

// /* Home page only: start the section requests before React mounts. */
// if (window.location.pathname === "/") {
//   [getHero, getMostVisited, getPackages, getSeasonedDestinations,getBlogs].forEach(
//     (q) => q().catch(() => {})
//   );
// }

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <HelmetProvider>
//       <App />
//     </HelmetProvider>
//   </React.StrictMode>
// );
