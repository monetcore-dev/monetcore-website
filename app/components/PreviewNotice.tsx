"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function PreviewNotice({
  contactTesting = false,
  bookingTesting = false,
}: {
  contactTesting?: boolean;
  bookingTesting?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <aside aria-label="Preview safety notice" className="preview-notice">
      <div className="preview-notice-copy">
        <strong>
          <span aria-hidden="true" /> Review preview
        </strong>
        <p className="preview-notice-details">
          {bookingTesting
            ? "Controlled staging booking is opted in; availability depends on safety checks. Use approved synthetic test details only. Contact links reach Monetcore directly."
            : contactTesting
              ? "Staging enquiry emails go only to hello@monetcore.dev. Use synthetic test details. Booking remains disabled. WhatsApp, email and phone links contact Monetcore directly."
              : "Forms and bookings are disabled. WhatsApp, email and phone links contact Monetcore directly."}
        </p>
        <p className="preview-notice-mobile">
          {bookingTesting
            ? "Controlled staging booking is opted in; availability depends on safety checks. Use approved synthetic test details only. Contact links reach Monetcore directly."
            : contactTesting
              ? "Test enquiries enabled. Booking disabled."
              : "Forms & bookings disabled."}
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss preview notice"
        onClick={() => setDismissed(true)}
      >
        <X size={17} aria-hidden="true" />
      </button>
    </aside>
  );
}
