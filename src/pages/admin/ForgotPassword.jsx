


import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail, ShieldCheck, KeyRound } from "lucide-react";

import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../../api/passwordReset";

// Change this if your login route is different (e.g. "/admin/login").
const LOGIN_PATH = "/admin/login";

const OTP_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72; // bcrypt limit
const RESEND_COOLDOWN_SECONDS = 30;

// Backend messages that mean the current code / reset session is dead.
const EXPIRED_PATTERN = /expired|invalid reset/i;

/* ------------------------------------------------------------------ */
/* Shared classes (same tokens as Login.jsx)                           */
/* ------------------------------------------------------------------ */

const inputClass = `
  w-full min-h-[44px] px-3.5 sm:px-4 py-2.5
  rounded-lg border border-border bg-input
  outline-none focus:border-primary focus:ring-2 focus:ring-primary/15
  text-sm text-text-dark placeholder:text-placeholder transition
`;

const primaryBtnClass = `
  w-full min-h-[44px] px-4 py-2.5 rounded-lg
  bg-accent text-white text-sm font-semibold shadow-brand
  hover:bg-accent-hover active:scale-[0.99] transition
  disabled:opacity-60 disabled:cursor-not-allowed
`;

const ghostBtnClass = `
  w-full min-h-[44px] flex items-center justify-center gap-2 mt-2
  text-xs sm:text-sm font-medium text-muted hover:text-text-dark
  transition-colors disabled:opacity-60 disabled:cursor-not-allowed
`;

const labelClass =
  "block text-xs sm:text-sm font-medium text-text-dark mb-1.5";

/* ------------------------------------------------------------------ */
/* Small presentational pieces (defined outside to avoid remounting)   */
/* ------------------------------------------------------------------ */

function Alert({ type, children }) {
  if (!children) return null;

  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "mb-4 rounded-lg bg-error-bg border border-error/30 px-3 py-2.5"
          : "mb-4 rounded-lg bg-surface-strong border border-divider px-3 py-2.5"
      }
    >
      <p
        className={`text-xs sm:text-sm leading-5 ${
          isError ? "text-error-text" : "text-text-dark"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function StepHeader({ icon: Icon, title, children }) {
  return (
    <>
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-surface-strong flex items-center justify-center">
            <Icon className="text-primary" size={22} aria-hidden="true" />
          </div>
        </div>
      )}

      <h1 className="text-lg sm:text-xl font-semibold text-text-dark text-center">
        {title}
      </h1>

      <p className="text-xs sm:text-sm leading-5 text-muted text-center mt-2 mb-5 sm:mb-6">
        {children}
      </p>
    </>
  );
}

function ProgressBar({ step }) {
  // Steps 1-3 are the flow; step 4 is the success screen.
  return (
    <div
      className="flex gap-1.5 mb-5"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={Math.min(step, 3)}
      aria-label="Password recovery progress"
    >
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-1 flex-1 rounded-full transition-colors ${
            n <= step ? "bg-primary" : "bg-divider"
          }`}
        />
      ))}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoFocus }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-4">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          autoComplete="new-password"
          autoFocus={autoFocus}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className={`${inputClass} pr-12`}
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="
            absolute right-2 sm:right-3 top-1/2 -translate-y-1/2
            w-9 h-9 flex items-center justify-center rounded-md
            text-muted hover:text-text-dark hover:bg-surface-strong transition
          "
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getErrorMessage(err, fallback) {
  // No response = network / CORS / server down.
  if (err?.request && !err?.response) {
    return "Cannot reach the server. Check your connection and try again.";
  }

  const detail = err?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return typeof detail === "string" && detail ? detail : fallback;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ForgotPassword() {
  const navigate = useNavigate();

  // 1 = email, 2 = code, 3 = new password, 4 = success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const clearFeedback = useCallback(() => {
    setError("");
    setMessage("");
  }, []);

  const goToLogin = useCallback(
    () => navigate(LOGIN_PATH, { replace: true }),
    [navigate]
  );

  // Restart the whole flow (used when the code/session has expired)
  const restartFlow = useCallback((errorMessage) => {
    setStep(1);
    setCode("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
    setError(errorMessage);
  }, []);

  /* ---------------- Step 1: send code ---------------- */
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (submitting) return;

    clearFeedback();
    setSubmitting(true);

    try {
      await forgotPassword(email.trim());

      setMessage(
        "If an account exists for this email, a verification code has been sent."
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStep(2);
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to send verification code. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Step 2: resend code ---------------- */
  const handleResend = async () => {
    if (submitting || cooldown > 0) return;

    clearFeedback();
    setSubmitting(true);

    try {
      await forgotPassword(email.trim());

      setCode("");
      setMessage("A new verification code has been sent.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to resend code. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Step 2: verify code ---------------- */
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (submitting) return;

    clearFeedback();

    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit verification code.`);
      return;
    }

    setSubmitting(true);

    try {
      const data = await verifyResetCode(email.trim(), code);

      if (!data?.reset_token) {
        throw new Error("Missing reset token in response");
      }

      setResetToken(data.reset_token);
      setCode("");
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err, "Invalid or expired verification code."));
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Step 3: reset password ---------------- */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (submitting) return;

    clearFeedback();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(resetToken, newPassword, confirmPassword);

      // Don't keep secrets in state once we're done.
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setStep(4);
    } catch (err) {
      const msg = getErrorMessage(err, "Unable to reset password. Please try again.");

      if (EXPIRED_PATTERN.test(msg)) {
        restartFlow(`${msg}. Request a new verification code to continue.`);
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeEmail = () => {
    setStep(1);
    setCode("");
    setCooldown(0);
    clearFeedback();
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="min-h-[100dvh] bg-petal-gradient flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="font-display text-3xl sm:text-4xl font-semibold text-text-display leading-tight">
            Manyara Privé Vacations
          </p>

          <p className="text-muted text-xs sm:text-sm mt-1.5">
            Password recovery
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-card border border-divider rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-travel-hover">
          {step < 4 && <ProgressBar step={step} />}

          {/* Step 1 — Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} noValidate={false}>
              <StepHeader icon={Mail} title="Forgot your password?">
                Enter your account email and we'll send you a verification code.
              </StepHeader>

              <div className="mb-4">
                <label htmlFor="fp-email" className={labelClass}>
                  Email
                </label>

                <input
                  id="fp-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <Alert type="error">{error}</Alert>

              <button type="submit" disabled={submitting} className={primaryBtnClass}>
                {submitting ? "Sending code…" : "Send verification code"}
              </button>

              <button type="button" onClick={goToLogin} className={ghostBtnClass}>
                <ArrowLeft size={16} />
                Back to sign in
              </button>
            </form>
          )}

          {/* Step 2 — Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <StepHeader icon={ShieldCheck} title="Verify your email">
                Enter the {OTP_LENGTH}-digit code sent to
                <span className="block mt-1 font-medium text-text-dark break-all">
                  {email}
                </span>
              </StepHeader>

              <div className="mb-4">
                <label htmlFor="fp-code" className={labelClass}>
                  Verification code
                </label>

                <input
                  id="fp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  maxLength={OTP_LENGTH}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                  }
                  placeholder="000000"
                  className={`${inputClass} min-h-[48px] text-center text-lg sm:text-xl tracking-[0.35em] font-semibold`}
                />
              </div>

              <Alert type="error">{error}</Alert>
              <Alert type="info">{message}</Alert>

              <button
                type="submit"
                disabled={submitting || code.length !== OTP_LENGTH}
                className={primaryBtnClass}
              >
                {submitting ? "Verifying…" : "Verify code"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={submitting || cooldown > 0}
                className={ghostBtnClass}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>

              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={submitting}
                className={ghostBtnClass.replace("mt-2", "mt-0")}
              >
                <ArrowLeft size={16} />
                Change email
              </button>
            </form>
          )}

          {/* Step 3 — New password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <StepHeader icon={KeyRound} title="Create new password">
                Choose a strong password for your account.
              </StepHeader>

              <PasswordField
                id="fp-new-password"
                label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />

              <PasswordField
                id="fp-confirm-password"
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <p className="text-[11px] sm:text-xs text-muted mb-4">
                Use at least {MIN_PASSWORD_LENGTH} characters.
              </p>

              <Alert type="error">{error}</Alert>

              <button type="submit" disabled={submitting} className={primaryBtnClass}>
                {submitting ? "Resetting password…" : "Reset password"}
              </button>
            </form>
          )}

          {/* Step 4 — Success */}
          {step === 4 && (
            <div className="text-center">
              <div className="flex justify-center mb-4 sm:mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-strong flex items-center justify-center">
                  <ShieldCheck className="text-primary" size={28} aria-hidden="true" />
                </div>
              </div>

              <h1 className="text-lg sm:text-xl font-semibold text-text-dark">
                Password reset
              </h1>

              <p className="text-xs sm:text-sm leading-5 text-muted mt-2 mb-5 sm:mb-6">
                Your password has been updated. Sign in with your new password.
              </p>

              <button type="button" onClick={goToLogin} className={primaryBtnClass}>
                Back to sign in
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] sm:text-xs text-muted mt-5">
          © Manyara Privé Vacations
        </p>
      </div>
    </div>
  );
}






