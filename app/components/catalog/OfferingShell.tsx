import Link from "next/link";
import SiteHeader from "../SiteHeader";
export default function OfferingShell({
  title,
  intro,
}: {
  title: string;
  intro: string;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="offering-page">
        <section className="offering-hero">
          <div className="offering-wrap">
            <p className="offering-eyebrow">Monetcore System Solutions</p>
            <h1>{title}</h1>
            <p>{intro}</p>
            <Link className="offering-primary" href="/contact#consultation">
              Discuss your project
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
