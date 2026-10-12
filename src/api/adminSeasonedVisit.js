


import api from "./axios";



export const getAllSeasonedDestinations = () =>
  api
    .get("/seasoned-destinations/admin/all")
    .then((res) => res.data);


export const getSeasonedDestinationsPaged = (params = {}) =>
  api
    .get("/seasoned-destinations/admin/paged", { params })
    .then((res) => res.data);


    
export const getSeasonedDestinationsStatsAdmin = () =>
  api.get("/seasoned-destinations/admin/stats").then((res) => res.data);


export const getSeasonedDestinationById = (id) =>
  api
    .get(`/seasoned-destinations/admin/${id}`)
    .then((res) => res.data);

export const createSeasonedDestination = (payload) =>
  api
    .post("/seasoned-destinations/admin", payload)
    .then((res) => res.data);

export const updateSeasonedDestination = (id, payload) =>
  api
    .put(`/seasoned-destinations/admin/${id}`, payload)
    .then((res) => res.data);

export const deleteSeasonedDestination = (id) =>
  api.delete(`/seasoned-destinations/admin/${id}`);

export const renumberSeasonedDestinations = () =>
  api
    .post("/seasoned-destinations/admin/renumber")
    .then((res) => res.data);