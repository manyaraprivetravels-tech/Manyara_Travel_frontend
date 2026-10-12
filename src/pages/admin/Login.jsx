import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/admin/dashboard/packages");
    } catch (err) {
      const detail = err?.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(detail || "Invalid email or password");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `
    w-full
    min-h-[44px]
    px-3.5 sm:px-4
    py-2.5
    rounded-lg
    border border-border
    bg-input
    outline-none
    focus:border-primary
    focus:ring-2 focus:ring-primary/15
    text-sm
    text-text-dark
    placeholder:text-placeholder
    transition
  `;

  return (
    <div className="min-h-[100dvh] bg-petal-gradient flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-sm sm:max-w-md">

        {/* Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="font-display text-3xl sm:text-4xl font-semibold text-text-display leading-tight">
            Manyara Privé Vacations
          </p>

          <p className="text-muted text-xs sm:text-sm mt-1.5">
            Admin &amp; creator sign in
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="
            w-full
            bg-card
            border border-divider
            rounded-xl sm:rounded-2xl
            p-5 sm:p-7
            shadow-travel-hover
            space-y-4
          "
        >
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs sm:text-sm font-medium text-text-dark mb-1.5"
            >
              Email
            </label>

            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-xs sm:text-sm font-medium text-text-dark mb-1.5"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pr-12`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="
                  absolute
                  right-2 sm:right-3
                  top-1/2
                  -translate-y-1/2
                  w-9 h-9
                  flex items-center justify-center
                  rounded-md
                  text-muted
                  hover:text-text-dark
                  hover:bg-surface-strong
                  transition
                "
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="
                min-h-[36px]
                px-1
                text-xs sm:text-sm
                text-link
                hover:text-link-hover
                font-medium
                transition-colors
              "
            >
              Forgot password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-error-bg border border-error/30 px-3 py-2.5"
            >
              <p className="text-xs sm:text-sm text-error-text leading-5">
                {error}
              </p>
            </div>
          )}

          {/* Sign In */}
          <button
            type="submit"
            disabled={submitting}
            className="
              w-full
              min-h-[44px]
              px-4
              py-2.5
              rounded-lg
              bg-accent
              text-white
              text-sm
              font-semibold
              shadow-brand
              hover:bg-accent-hover
              active:scale-[0.99]
              transition
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] sm:text-xs text-muted mt-5">
          © Manyara Privé Vacations
        </p>
      </div>
    </div>
  );
}
