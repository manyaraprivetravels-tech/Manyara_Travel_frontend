import api from "./axios";

// Submit enquiry from customer
export const createEnquiry = (payload) =>
  api.post("/enquiries", payload).then((res) => res.data);


// ---------------------------------------------------------
export const getEnquiriesPaged = (params = {}) =>
  api.get("/enquiries/admin/paged", { params }).then((res) => res.data);

// ---------------------------------------------------------
// Summary cards → { total, last_24h, last_7_days, custom }
// ---------------------------------------------------------
export const getEnquiryStatsAdmin = () =>
  api.get("/enquiries/admin/stats").then((res) => res.data);

// Old unpaginated list. No longer used by the admin page;
// safe to delete once nothing else imports it.
export const getAllEnquiries = () =>
  api.get("/enquiries/admin").then((res) => res.data);

// Get single enquiry
export const getEnquiryById = (id) =>
  api.get(`/enquiries/admin/${id}`).then((res) => res.data);

// Delete enquiry
export const deleteEnquiry = (id) =>
  api.delete(`/enquiries/admin/${id}`);