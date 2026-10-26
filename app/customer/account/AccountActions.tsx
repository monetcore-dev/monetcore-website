"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function AccountActions() {
  const router = useRouter();
  const [pending, setPending] = useState(false),
    [feedback, setFeedback] = useState("");
  async function action(path: string, body: object) {
    if (pending) return;
    setPending(true);
    setFeedback("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true)
        throw new Error(
          "Account action could not be confirmed. Contact Monetcore before retrying.",
        );
      router.replace("/customer/login");
      router.refresh();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Action unavailable.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="customer-actions">
        <button
          className="customer-button"
          disabled={pending}
          onClick={() => action("/api/customer/auth/sign-out", {})}
        >
          Sign out
        </button>
        <button
          className="customer-link-button"
          disabled={pending}
          onClick={() => action("/api/customer/auth/revoke-sessions", {})}
        >
          Revoke all sessions
        </button>
      </div>
      <details className="customer-card">
        <summary>Deactivate your account</summary>
        <p>
          Deactivation blocks customer access and revokes sessions. It does not
          delete project or audit records. Contact hello@monetcore.dev to
          discuss retention or reactivation.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void action("/api/customer/account", { action: "deactivate" });
          }}
        >
          <label>
            <span>
              <input
                type="checkbox"
                required
                style={{ width: "auto", minHeight: "auto" }}
              />{" "}
              I understand that this will deactivate my account.
            </span>
          </label>
          <button
            className="customer-button customer-danger"
            disabled={pending}
          >
            Deactivate account
          </button>
        </form>
      </details>
      {feedback && (
        <p className="customer-feedback customer-error" role="alert">
          {feedback}
        </p>
      )}
    </>
  );
}
