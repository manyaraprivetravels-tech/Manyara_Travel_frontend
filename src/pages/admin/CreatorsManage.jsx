


import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listUsers,
  registerUser,
  setUserStatus,
  deleteUser,
} from "../../api/adminUsers";

// Adjust this path if your AuthContext lives somewhere else.
import { useAuth } from "../../context/AuthContext";

import { Eye, EyeOff } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  confirm_password: "",
  role: "creator",
  admin_verification_password: "",
};

const ROLE_TABS = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admins" },
  { key: "creator", label: "Creators" },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

const getErrorMessage = (err, fallback) => {
  // Request cancelled by the 60s limit: the server may still have saved it.
  if (err?.code === "ECONNABORTED") {
    return "The server took too long to respond. Check the list before trying again.";
  }

  // No response at all (offline, server down, CORS).
  if (err?.request && !err?.response) {
    return "Could not reach the server. Check your connection and try again.";
  }

  const detail = err?.response?.data?.detail;

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");

    return message || fallback;
  }

  // Server messages win, e.g. "Invalid admin password" or
  // "You can't delete your own account."
  if (typeof detail === "string") {
    return detail;
  }

  if (err?.response?.status === 403) {
    return "You don't have permission to do this.";
  }

  return fallback;
};

/* ------------------------------------------------------------------ */
/* Small reusable password input (same markup as before, written once) */
/* ------------------------------------------------------------------ */
function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  show,
  onToggle,
  showLabel,
  hideLabel,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-navy mb-1.5"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          minLength={6}
          maxLength={72}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className="w-full px-3 pr-10 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
          placeholder={placeholder}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/50 hover:text-navy transition-colors"
          aria-label={show ? hideLabel : showLabel}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shown to creators (or anyone who is not an admin)                    */
/* ------------------------------------------------------------------ */
function AccessRestricted() {
  return (
    <div
      className="max-w-lg rounded-xl border border-navy/10 bg-white p-8"
      role="alert"
    >
      <h1 className="font-display text-xl font-semibold text-navy mb-2">
        You can't view this page
      </h1>

      <p className="text-sm text-navy/60">
        Only admins can see and manage admin and creator accounts. If you
        need access, ask an administrator.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page entry: the role check lives in this wrapper so the hooks in    */
/* UsersManage never run for non-admins.                               */
/* ------------------------------------------------------------------ */
export default function CreatorsManage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-navy/50 text-sm">Loading…</p>;
  }

  if (user?.role !== "admin") {
    return <AccessRestricted />;
  }

  return <UsersManage currentUserId={user.id} />;
}

function UsersManage({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null); // row currently being changed
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminVerification, setShowAdminVerification] = useState(false);

  // Loads everyone once; the tabs and search filter in the browser.
  // `loading` stays false after the first load so the table doesn't
  // flash away every time you disable or delete someone.
  const load = useCallback(async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load users"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      creator: users.filter((u) => u.role === "creator").length,
    }),
    [users]
  );

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!term) return true;
      return (
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    });
  }, [users, roleFilter, search]);

  const resetPasswordVisibility = () => {
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAdminVerification(false);
  };

  const setField = (name) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (saving) return;

    setError("");
    setSuccess("");

    if (form.password !== form.confirm_password) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    if (form.role === "admin" && !form.admin_verification_password.trim()) {
      setError("Your admin password is required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        role: form.role,

        // Creator accounts send null instead of "" because the backend
        // requires min_length=6 when this field is provided.
        admin_verification_password:
          form.role === "admin" ? form.admin_verification_password : null,
      };

      await registerUser(payload);

      setSuccess(
        `${form.role === "admin" ? "Admin" : "Creator"} account created for ${
          payload.email
        }.`
      );

      setForm(EMPTY_FORM);
      resetPasswordVisibility();
      setShowForm(false);

      load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not create account"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (target) => {
    if (busyId) return;

    setError("");
    setSuccess("");
    setBusyId(target.id);

    try {
      await setUserStatus(target.id, !target.is_active);
      setSuccess(
        `${target.name}'s account ${target.is_active ? "disabled" : "enabled"}.`
      );
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update account status"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (target) => {
    if (busyId) return;

    const kind = target.role === "admin" ? "admin" : "creator";

    if (
      !window.confirm(
        `Remove ${target.name}'s ${kind} account? This cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(target.id);

    try {
      await deleteUser(target.id);
      setSuccess(`${target.name}'s account removed.`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete account"));
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;

    setForm((prev) => ({
      ...prev,
      role,
      admin_verification_password:
        role === "admin" ? prev.admin_verification_password : "",
    }));

    setError("");
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    resetPasswordVisibility();
    setError("");
  };

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    resetPasswordVisibility();
    setShowForm(true);
  };

  const emptyMessage =
    users.length === 0 ? "No users yet." : "No users match your filters.";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-navy">
          Manage Users
        </h1>

        <button
          onClick={openCreateForm}
          className="bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New User
        </button>
      </div>

      {/* Role tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={roleFilter === tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === tab.key
                  ? "bg-navy text-ivory"
                  : "text-navy/60 hover:bg-surface"
              }`}
            >
              {tab.label}{" "}
              <span className="opacity-60">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          aria-label="Search users by name or email"
          className="w-full sm:w-64 px-3 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary bg-white"
        />
      </div>

      {/* Page-level success */}
      {success && !showForm && (
        <div
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
          role="status"
        >
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Page-level error */}
      {error && !showForm && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <p className="text-navy/50 text-sm">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-navy/10 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-surface text-navy/60 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Created</th>
                  <th className="text-left px-5 py-3">Last active</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleUsers.map((u) => {
                  const isMe = u.id === currentUserId;
                  const busy = busyId === u.id;

                  return (
                    <tr key={u.id} className="border-t border-navy/5">
                      <td className="px-5 py-3 font-medium text-navy">
                        {u.name}
                        {isMe && (
                          <span className="ml-2 text-xs font-semibold text-navy/50">
                            (you)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3 text-navy/70">{u.email}</td>

                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            u.role === "admin"
                              ? "bg-navy/10 text-navy"
                              : "bg-secondary/10 text-secondary"
                          }`}
                        >
                          {u.role === "admin" ? "Admin" : "Creator"}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            u.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {u.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-navy/70 whitespace-nowrap">
                        {formatDate(u.created_at) || "—"}
                      </td>

                      {/* The server only tracks activity for admins */}
                      <td className="px-5 py-3 text-navy/70 whitespace-nowrap">
                        {u.role === "admin"
                          ? formatDate(u.last_activity_at) || "Never"
                          : "—"}
                      </td>

                      <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                        {isMe ? (
                          <span className="text-xs text-navy/40">
                            Can't change your own account
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleActive(u)}
                              disabled={Boolean(busyId)}
                              className="text-secondary font-medium hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                              {busy
                                ? "Working…"
                                : u.is_active
                                ? "Disable"
                                : "Enable"}
                            </button>

                            <button
                              onClick={() => handleDelete(u)}
                              disabled={Boolean(busyId)}
                              className="text-red-600 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {visibleUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-center text-navy/40"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-5 z-50">
          <div className="bg-ivory rounded-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-semibold text-navy mb-4">
              New Account
            </h2>

            <form
              onSubmit={handleCreate}
              className="space-y-4"
              autoComplete="off"
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="new-account-name"
                  className="block text-sm font-medium text-navy mb-1.5"
                >
                  Name
                </label>

                <input
                  id="new-account-name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="off"
                  value={form.name}
                  onChange={setField("name")}
                  className="w-full px-3 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
                  placeholder="Enter name"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="new-account-email"
                  className="block text-sm font-medium text-navy mb-1.5"
                >
                  Email
                </label>

                <input
                  id="new-account-email"
                  type="email"
                  required
                  autoComplete="off"
                  value={form.email}
                  onChange={setField("email")}
                  className="w-full px-3 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
                  placeholder="user@example.com"
                />
              </div>

              {/* Password */}
              <PasswordField
                id="new-account-password"
                label="Password"
                value={form.password}
                onChange={setField("password")}
                placeholder="Enter password"
                show={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
                showLabel="Show password"
                hideLabel="Hide password"
              />

              {/* Confirm Password */}
              <PasswordField
                id="new-account-confirm-password"
                label="Confirm Password"
                value={form.confirm_password}
                onChange={setField("confirm_password")}
                placeholder="Confirm password"
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
                showLabel="Show confirm password"
                hideLabel="Hide confirm password"
              />

              {/* Role */}
              <div>
                <label
                  htmlFor="new-account-role"
                  className="block text-sm font-medium text-navy mb-1.5"
                >
                  Role
                </label>

                <select
                  id="new-account-role"
                  value={form.role}
                  onChange={handleRoleChange}
                  className="w-full px-3 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
                >
                  <option value="creator">Content Creator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Admin Verification */}
              {form.role === "admin" && (
                <div className="border-t border-navy/10 pt-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-navy">
                      Admin Verification
                    </p>

                    <p className="text-xs text-navy/50 mt-1">
                      Enter your own admin password to authorize creation of
                      this new admin account.
                    </p>
                  </div>

                  <PasswordField
                    id="new-account-admin-password"
                    label="Your Admin Password"
                    value={form.admin_verification_password}
                    onChange={setField("admin_verification_password")}
                    placeholder="Enter your admin password"
                    autoComplete="off"
                    show={showAdminVerification}
                    onToggle={() => setShowAdminVerification((prev) => !prev)}
                    showLabel="Show admin password"
                    hideLabel="Hide admin password"
                  />
                </div>
              )}

              {/* Form Error */}
              {error && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
                  role="alert"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60"
                >
                  {saving
                    ? "Creating…"
                    : form.role === "admin"
                    ? "Create Admin"
                    : "Create Creator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}












































// import { useEffect, useState } from "react";

// import {
//   listCreators,
//   registerUser,
//   setCreatorStatus,
//   deleteCreator,
// } from "../../api/adminUsers";

// import { Eye, EyeOff } from "lucide-react";

// const EMPTY_FORM = {
//   name: "",
//   email: "",
//   password: "",
//   confirm_password: "",
//   role: "creator",
//   admin_verification_password: "",
// };

// const getErrorMessage = (err, fallback) => {
//   // Request cancelled by the 60s limit: the server may still have saved it.
//   if (err?.code === "ECONNABORTED") {
//     return "The server took too long to respond. Check the list before trying again.";
//   }

//   // No response at all (offline, server down, CORS).
//   if (err?.request && !err?.response) {
//     return "Could not reach the server. Check your connection and try again.";
//   }

//   const detail = err?.response?.data?.detail;

//   if (Array.isArray(detail)) {
//     const message = detail
//       .map((item) => item?.msg)
//       .filter(Boolean)
//       .join(", ");

//     return message || fallback;
//   }

//   if (typeof detail === "string") {
//     return detail;
//   }

//   return fallback;
// };

// export default function CreatorsManage() {
//   const [creators, setCreators] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [showForm, setShowForm] = useState(false);
//   const [form, setForm] = useState(EMPTY_FORM);

//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [showAdminVerification, setShowAdminVerification] =
//     useState(false);

//   const load = () => {
//     setLoading(true);

//     listCreators()
//       .then(setCreators)
//       .catch((err) => {
//         setError(
//           getErrorMessage(err, "Could not load creators")
//         );
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const handleCreate = async (e) => {
//     e.preventDefault();
//     if (saving) return;

//     setError("");
//     setSuccess("");

//     if (form.password !== form.confirm_password) {
//       setError("Password and Confirm Password do not match.");
//       return;
//     }

//     if (
//       form.role === "admin" &&
//       !form.admin_verification_password.trim()
//     ) {
//       setError("Your admin password is required.");
//       return;
//     }

//     setSaving(true);

//     try {
//       const payload = {
//         name: form.name.trim(),
//         email: form.email.trim(),
//         password: form.password,
//         confirm_password: form.confirm_password,
//         role: form.role,

//         // Important:
//         // Creator accounts send null instead of ""
//         // because the backend requires min_length=6
//         // when this field is provided.
//         admin_verification_password:
//           form.role === "admin"
//             ? form.admin_verification_password
//             : null,
//       };

//       await registerUser(payload);

//       setSuccess(
//         `${
//           form.role === "admin" ? "Admin" : "Creator"
//         } account created for ${payload.email}.`
//       );

//       setForm(EMPTY_FORM);
//       setShowPassword(false);
//       setShowConfirmPassword(false);
//       setShowAdminVerification(false);
//       setShowForm(false);

//       load();
//     } catch (err) {
//       setError(
//         getErrorMessage(err, "Could not create account")
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const toggleActive = async (user) => {
//     setError("");
//     setSuccess("");

//     try {
//       await setCreatorStatus(user.id, !user.is_active);
//       load();
//     } catch (err) {
//       setError(
//         getErrorMessage(
//           err,
//           "Could not update account status"
//         )
//       );
//     }
//   };

//   const handleDelete = async (user) => {
//     if (
//       !window.confirm(
//         `Remove ${user.name}'s account? This cannot be undone.`
//       )
//     ) {
//       return;
//     }

//     setError("");
//     setSuccess("");

//     try {
//       await deleteCreator(user.id);
//       load();
//     } catch (err) {
//       setError(
//         getErrorMessage(
//           err,
//           "Could not delete account"
//         )
//       );
//     }
//   };

//   const handleRoleChange = (e) => {
//     const role = e.target.value;

//     setForm({
//       ...form,
//       role,
//       admin_verification_password:
//         role === "admin"
//           ? form.admin_verification_password
//           : "",
//     });

//     setError("");
//   };

//   const closeForm = () => {
//     setShowForm(false);
//     setForm(EMPTY_FORM);
//     setShowPassword(false);
//     setShowConfirmPassword(false);
//     setShowAdminVerification(false);
//     setError("");
//   };

//   const openCreateForm = () => {
//     setForm(EMPTY_FORM);
//     setError("");
//     setSuccess("");
//     setShowPassword(false);
//     setShowConfirmPassword(false);
//     setShowAdminVerification(false);
//     setShowForm(true);
//   };

//   return (
//     <div>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="font-display text-2xl font-semibold text-navy">
//           Manage Creators
//         </h1>

//         <button
//           onClick={openCreateForm}
//           className="bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
//         >
//           + New Creator
//         </button>
//       </div>

//       {/* Page-level success */}
//       {success && !showForm && (
//         <div
//           className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
//           role="status"
//         >
//           <p className="text-sm text-green-700">
//             {success}
//           </p>
//         </div>
//       )}

//       {/* Page-level error */}
//       {error && !showForm && (
//         <div
//           className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
//           role="alert"
//         >
//           <p className="text-sm text-red-600">
//             {error}
//           </p>
//         </div>
//       )}

//       {/* Creators table */}
//       {loading ? (
//         <p className="text-navy/50 text-sm">
//           Loading…
//         </p>
//       ) : (
//         <div className="bg-white rounded-xl border border-navy/10 overflow-hidden">
//           <div className="w-full overflow-x-auto">
//             <table className="w-full min-w-[700px] text-sm">
//               <thead className="bg-surface text-navy/60 text-xs uppercase tracking-wide">
//                 <tr>
//                   <th className="text-left px-5 py-3">
//                     Name
//                   </th>

//                   <th className="text-left px-5 py-3">
//                     Email
//                   </th>

//                   <th className="text-left px-5 py-3">
//                     Status
//                   </th>

//                   <th className="text-right px-5 py-3">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {creators.map((c) => (
//                   <tr
//                     key={c.id}
//                     className="border-t border-navy/5"
//                   >
//                     <td className="px-5 py-3 font-medium text-navy">
//                       {c.name}
//                     </td>

//                     <td className="px-5 py-3 text-navy/70">
//                       {c.email}
//                     </td>

//                     <td className="px-5 py-3">
//                       <span
//                         className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
//                           c.is_active
//                             ? "bg-green-100 text-green-700"
//                             : "bg-red-50 text-red-600"
//                         }`}
//                       >
//                         {c.is_active
//                           ? "Active"
//                           : "Disabled"}
//                       </span>
//                     </td>

//                     <td className="px-5 py-3 text-right space-x-3">
//                       <button
//                         onClick={() => toggleActive(c)}
//                         className="text-secondary font-medium hover:underline"
//                       >
//                         {c.is_active
//                           ? "Disable"
//                           : "Enable"}
//                       </button>

//                       <button
//                         onClick={() => handleDelete(c)}
//                         className="text-red-600 font-medium hover:underline"
//                       >
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 ))}

//                 {creators.length === 0 && (
//                   <tr>
//                     <td
//                       colSpan={4}
//                       className="px-5 py-8 text-center text-navy/40"
//                     >
//                       No content creators yet.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Create Account Modal */}
//       {showForm && (
//         <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-5 z-50">
//           <div className="bg-ivory rounded-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
//             <h2 className="font-display text-xl font-semibold text-navy mb-4">
//               New Account
//             </h2>

//             <form
//               onSubmit={handleCreate}
//               className="space-y-4"
//               autoComplete="off"
//             >
//               {/* Name */}
//               <div>
//                 <label
//                   htmlFor="new-account-name"
//                   className="block text-sm font-medium text-navy mb-1.5"
//                 >
//                   Name
//                 </label>

//                 <input
//                   id="new-account-name"
//                   required
//                   minLength={2}
//                   maxLength={100}
//                   autoComplete="off"
//                   value={form.name}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       name: e.target.value,
//                     })
//                   }
//                   className="w-full px-3 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
//                   placeholder="Enter name"
//                 />
//               </div>

//               {/* Email */}
//               <div>
//                 <label
//                   htmlFor="new-account-email"
//                   className="block text-sm font-medium text-navy mb-1.5"
//                 >
//                   Email
//                 </label>

//                 <input
//                   id="new-account-email"
//                   type="email"
//                   required
//                   autoComplete="off"
//                   value={form.email}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       email: e.target.value,
//                     })
//                   }
//                   className="w-full px-3 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
//                   placeholder="user@example.com"
//                 />
//               </div>

//               {/* Password */}
//               <div>
//                 <label
//                   htmlFor="new-account-password"
//                   className="block text-sm font-medium text-navy mb-1.5"
//                 >
//                   Password
//                 </label>

//                 <div className="relative">
//                   <input
//                     id="new-account-password"
//                     type={
//                       showPassword
//                         ? "text"
//                         : "password"
//                     }
//                     required
//                     minLength={6}
//                     maxLength={72}
//                     autoComplete="new-password"
//                     value={form.password}
//                     onChange={(e) =>
//                       setForm({
//                         ...form,
//                         password: e.target.value,
//                       })
//                     }
//                     className="w-full px-3 pr-10 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
//                     placeholder="Enter password"
//                   />

//                   <button
//                     type="button"
//                     onClick={() =>
//                       setShowPassword(
//                         (prev) => !prev
//                       )
//                     }
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/50 hover:text-navy transition-colors"
//                     aria-label={
//                       showPassword
//                         ? "Hide password"
//                         : "Show password"
//                     }
//                   >
//                     {showPassword ? (
//                       <EyeOff size={18} />
//                     ) : (
//                       <Eye size={18} />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Confirm Password */}
//               <div>
//                 <label
//                   htmlFor="new-account-confirm-password"
//                   className="block text-sm font-medium text-navy mb-1.5"
//                 >
//                   Confirm Password
//                 </label>

//                 <div className="relative">
//                   <input
//                     id="new-account-confirm-password"
//                     type={
//                       showConfirmPassword
//                         ? "text"
//                         : "password"
//                     }
//                     required
//                     minLength={6}
//                     maxLength={72}
//                     autoComplete="new-password"
//                     value={form.confirm_password}
//                     onChange={(e) =>
//                       setForm({
//                         ...form,
//                         confirm_password:
//                           e.target.value,
//                       })
//                     }
//                     className="w-full px-3 pr-10 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
//                     placeholder="Confirm password"
//                   />

//                   <button
//                     type="button"
//                     onClick={() =>
//                       setShowConfirmPassword(
//                         (prev) => !prev
//                       )
//                     }
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/50 hover:text-navy transition-colors"
//                     aria-label={
//                       showConfirmPassword
//                         ? "Hide confirm password"
//                         : "Show confirm password"
//                     }
//                   >
//                     {showConfirmPassword ? (
//                       <EyeOff size={18} />
//                     ) : (
//                       <Eye size={18} />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Role */}
//               <div>
//                 <label
//                   htmlFor="new-account-role"
//                   className="block text-sm font-medium text-navy mb-1.5"
//                 >
//                   Role
//                 </label>

//                 <select
//                   id="new-account-role"
//                   value={form.role}
//                   onChange={handleRoleChange}
//                   className="w-full px-3 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
//                 >
//                   <option value="creator">
//                     Content Creator
//                   </option>

//                   <option value="admin">
//                     Admin
//                   </option>
//                 </select>
//               </div>

//               {/* Admin Verification */}
//               {form.role === "admin" && (
//                 <div className="border-t border-navy/10 pt-4">
//                   <div className="mb-3">
//                     <p className="text-sm font-semibold text-navy">
//                       Admin Verification
//                     </p>

//                     <p className="text-xs text-navy/50 mt-1">
//                       Enter your own admin password to
//                       authorize creation of this new admin
//                       account.
//                     </p>
//                   </div>

//                   <label
//                     htmlFor="new-account-admin-password"
//                     className="block text-sm font-medium text-navy mb-1.5"
//                   >
//                     Your Admin Password
//                   </label>

//                   <div className="relative">
//                     <input
//                       id="new-account-admin-password"
//                       type={
//                         showAdminVerification
//                           ? "text"
//                           : "password"
//                       }
//                       required={
//                         form.role === "admin"
//                       }
//                       minLength={6}
//                       maxLength={72}
//                       autoComplete="off"
//                       value={
//                         form.admin_verification_password
//                       }
//                       onChange={(e) =>
//                         setForm({
//                           ...form,
//                           admin_verification_password:
//                             e.target.value,
//                         })
//                       }
//                       className="w-full px-3 pr-10 py-2 rounded-lg border border-navy/15 text-sm outline-none focus:border-secondary"
//                       placeholder="Enter your admin password"
//                     />

//                     <button
//                       type="button"
//                       onClick={() =>
//                         setShowAdminVerification(
//                           (prev) => !prev
//                         )
//                       }
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/50 hover:text-navy transition-colors"
//                       aria-label={
//                         showAdminVerification
//                           ? "Hide admin password"
//                           : "Show admin password"
//                       }
//                     >
//                       {showAdminVerification ? (
//                         <EyeOff size={18} />
//                       ) : (
//                         <Eye size={18} />
//                       )}
//                     </button>
//                   </div>
//                 </div>
//               )}

//               {/* Form Error */}
//               {error && (
//                 <div
//                   className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
//                   role="alert"
//                 >
//                   <p className="text-sm text-red-600">
//                     {error}
//                   </p>
//                 </div>
//               )}

//               {/* Buttons */}
//               <div className="flex justify-end gap-3 pt-2">
//                 <button
//                   type="button"
//                   onClick={closeForm}
//                   className="px-4 py-2 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="px-5 py-2 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60"
//                 >
//                   {saving
//                     ? "Creating…"
//                     : form.role === "admin"
//                     ? "Create Admin"
//                     : "Create Creator"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
















