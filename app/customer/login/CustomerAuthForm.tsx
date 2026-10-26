"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
type Mode = "login" | "register" | "forgot" | "reset";
export default function CustomerAuthForm({
  registrationEnabled,
  emailEnabled,
  initialMode,
  token,
}: {
  registrationEnabled: boolean;
  emailEnabled: boolean;
  initialMode: Mode;
  token: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode),
    [pending, setPending] = useState(false),
    [feedback, setFeedback] = useState(""),
    [failed, setFailed] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setFeedback("");
    setFailed(false);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const action =
      mode === "login"
        ? "sign-in/email"
        : mode === "register"
          ? "sign-up/email"
          : mode === "forgot"
            ? "request-password-reset"
            : "reset-password";
    const body =
      mode === "login"
        ? {
            email,
            password: data.get("password"),
            rememberMe: false,
            callbackURL: "/customer",
          }
        : mode === "register"
          ? {
              name: data.get("name"),
              email,
              password: data.get("password"),
              callbackURL: "/customer/login?verified=1",
            }
          : mode === "forgot"
            ? { email, redirectTo: "/customer/login?mode=reset" }
            : { token, newPassword: data.get("password") };
    try {
      const response = await fetch(`/api/customer/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true)
        throw new Error(
          result.error || "Authentication could not be completed.",
        );
      if (mode === "login") {
        router.replace("/customer");
        router.refresh();
        return;
      }
      setFeedback(
        mode === "register"
          ? "Registration received. Check your approved test mailbox to verify your email before signing in."
          : mode === "forgot"
            ? "If an eligible account exists, password reset instructions have been requested. Check your approved test mailbox."
            : "Your password has been reset. Sign in with your new password.",
      );
    } catch (error) {
      setFailed(true);
      setFeedback(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "The request could not be confirmed. Check your email or contact Monetcore before retrying.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="customer-card">
      <p className="customer-eyebrow">Secure customer access</p>
      <h1>
        {mode === "login"
          ? "Sign in to Monetcore"
          : mode === "register"
            ? "Create your customer account"
            : mode === "forgot"
              ? "Recover your account"
              : "Choose a new password"}
      </h1>
      <p>
        Only approved staging test accounts can use this foundation. Verify your
        email before accessing customer projects.
      </p>
      <form onSubmit={submit} aria-busy={pending}>
        {mode === "register" && (
          <label>
            Your name
            <input name="name" autoComplete="name" maxLength={160} required />
          </label>
        )}
        {mode !== "reset" && (
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
        )}
        {mode !== "forgot" && (
          <>
            <label>
              {mode === "login" ? "Password" : "New password"}
              <input
                name="password"
                type="password"
                aria-describedby="customer-password-help"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "login" ? 1 : 12}
                maxLength={128}
                required
              />
            </label>
            <small id="customer-password-help">
              New passwords must contain at least 12 characters.
            </small>
          </>
        )}
        <p>
          We use account information to provide your project workspace. Do not
          submit confidential customer records. Read our{" "}
          <Link href="/privacy">Privacy Policy</Link>. Accounts are not
          automatically subscribed to marketing.
        </p>
        <button
          className="customer-button"
          disabled={
            pending ||
            (mode === "register" && !registrationEnabled) ||
            (mode === "forgot" && !emailEnabled) ||
            (mode === "reset" && !token)
          }
        >
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "register"
                ? "Create account"
                : mode === "forgot"
                  ? "Request password reset"
                  : "Reset password"}
        </button>
      </form>
      {feedback && (
        <p
          className={`customer-feedback ${failed ? "customer-error" : ""}`}
          role={failed ? "alert" : "status"}
        >
          {feedback}
        </p>
      )}
      <div className="customer-actions">
        <button
          className="customer-link-button"
          disabled={pending}
          onClick={() => {
            setMode("login");
            setFeedback("");
          }}
        >
          Sign in
        </button>
        {registrationEnabled && (
          <button
            className="customer-link-button"
            disabled={pending}
            onClick={() => {
              setMode("register");
              setFeedback("");
            }}
          >
            Register
          </button>
        )}
        {emailEnabled && (
          <button
            className="customer-link-button"
            disabled={pending}
            onClick={() => {
              setMode("forgot");
              setFeedback("");
            }}
          >
            Forgot password?
          </button>
        )}
      </div>
      <p>
        Need help? <Link href="/contact">Contact Monetcore</Link>.
      </p>
    </section>
  );
}
