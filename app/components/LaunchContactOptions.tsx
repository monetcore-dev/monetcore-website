import { Mail, MessageCircle, Phone } from "lucide-react";
export default function LaunchContactOptions({ booking = false, quotation = false }: { booking?: boolean; quotation?: boolean }) {
  const subject = booking ? "Consultation request" : quotation ? "Quotation request" : "Project enquiry";
  const button = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-900 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700";
  return <section aria-label={subject} className="rounded-2xl border border-blue-100 bg-slate-50 p-5 text-slate-950 sm:p-8">
    <h2 className="text-2xl font-bold">{booking ? "Arrange your consultation" : quotation ? "Request your quotation" : "Let’s discuss your project"}</h2>
    <p className="mt-3 text-base leading-7 text-slate-600">{booking ? "Online booking is not available yet. Contact our team to discuss a suitable time. No appointment is confirmed until our team confirms it with you." : "Online form submission is not available yet. Email or WhatsApp our team with your requirements and we’ll discuss the next steps."}</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <a className={button} href={`mailto:hello@monetcore.dev?subject=${encodeURIComponent(subject)}`}><Mail size={18} aria-hidden="true" />Email Monetcore</a>
      <a className={button} href={`https://wa.me/2347065880558?text=${encodeURIComponent("Hello Monetcore, I would like to discuss a " + subject.toLowerCase() + ".")}`}><MessageCircle size={18} aria-hidden="true" />WhatsApp Monetcore</a>
      <a className={button} href="tel:+2347065880558"><Phone size={18} aria-hidden="true" />0706 588 0558</a>
    </div>
    <p className="mt-4 text-sm leading-6 text-slate-600">hello@monetcore.dev · +234 706 588 0558</p>
  </section>;
}
