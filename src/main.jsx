

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
  [
    getHero,
    getSiteSettings,
    getPackages,
    getMostVisited,
    getSeasonedDestinations,
    getBlogs,
  ].forEach((query) => query().catch(quiet));
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
