

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






