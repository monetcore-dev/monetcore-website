"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function PreviewNotice() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <aside aria-label="Preview safety notice" className="preview-notice">
      <div>
        <strong>
          <span aria-hidden="true" /> Review preview
        </strong>
        <p>
          Forms and bookings are disabled. WhatsApp, email and phone links
          contact Monetcore directly.
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
