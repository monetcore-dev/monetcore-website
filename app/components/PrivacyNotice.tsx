import Link from "next/link";

export default function PrivacyNotice({
  booking = false,
}: {
  booking?: boolean;
}) {
  return (
    <p className="mt-4 text-sm leading-6 text-slate-600">
      {booking
        ? "We use your details to arrange your consultation and manage booking records, Calendar entries and related emails."
        : "We use your details to respond to your enquiry and discuss your project. You are not automatically subscribed to marketing."}{" "}
      Read our{" "}
      <Link
        href="/privacy"
        className="font-semibold text-blue-800 underline underline-offset-4"
      >
        Privacy Policy
      </Link>
      .{!booking && " Please do not include unnecessary sensitive information."}
    </p>
  );
}
