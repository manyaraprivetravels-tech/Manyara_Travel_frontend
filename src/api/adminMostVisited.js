import api from "./axios";



// ---------------------------------------------------------
export const getAllMostVisitedAdmin = () =>
  api.get("/most-visited").then((res) => res.data);


// ---------------------------------------------------------
export const getMostVisitedPaged = (params = {}) =>
  api.get("/most-visited/admin/paged", { params }).then((res) => res.data);

// ---------------------------------------------------------
// Summary cards → { total, published, draft }
// ---------------------------------------------------------
export const getMostVisitedStatsAdmin = () =>
  api.get("/most-visited/admin/stats").then((res) => res.data);

export const createMostVisited = (payload) =>
  api.post("/most-visited/admin", payload).then((res) => res.data);

export const updateMostVisited = (id, payload) =>
  api.put(`/most-visited/admin/${id}`, payload).then((res) => res.data);

export const deleteMostVisited = (id) =>
  api.delete(`/most-visited/admin/${id}`);