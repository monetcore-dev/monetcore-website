import Link from "next/link";

const columns = [
  {
    title: "Explore",
    links: [
      ["Home", "/"],
      ["Website packages", "/website-packages"],
      ["Live demos", "/#live-demos"],
      ["How it works", "/#process"],
    ],
  },
  {
    title: "Services",
    links: [
      ["Business websites", "/#services"],
      ["AI automation", "/services#ai-automation"],
      ["Custom software", "/services#custom-software"],
      ["Smart business tools", "/products"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Monetcore", "/about"],
      ["Contact", "/contact"],
      ["Free consultation", "/contact#consultation"],
      ["Book an appointment", "/book"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-white/15 pb-10 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-white"
            >
              Monetcore<span className="text-blue-400">.</span>
            </Link>
            <p className="mt-2 text-sm">
              System Solutions · Websites first. Room to grow.
            </p>
          </div>
          <a
            href="https://wa.me/2347065880558?text=Hello%20Monetcore%2C%20I%27d%20like%20to%20discuss%20a%20business%20website."
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-blue-100"
          >
            Let&apos;s talk on WhatsApp ↗
          </a>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-bold text-white">{column.title}</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="hover:text-white hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="text-sm font-bold text-white">Contact</h2>
            <address className="mt-5 space-y-3 text-sm not-italic">
              <a
                className="block break-all hover:text-white"
                href="mailto:hello@monetcore.dev"
              >
                hello@monetcore.dev
              </a>
              <a className="block hover:text-white" href="tel:+2347065880558">
                +234 706 588 0558
              </a>
              <p>
                Ventures Park, 5 Kwaji Close,
                <br />
                Maitama, Abuja, Nigeria
              </p>
            </address>
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              <a
                href="https://www.facebook.com/monetcore"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline"
              >
                Facebook
              </a>
              <a
                href="https://x.com/monetcore"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Monetcore on X"
                className="hover:text-white hover:underline"
              >
                X
              </a>
              <a
                href="https://wa.me/2347065880558"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
        <p className="mt-12 border-t border-white/15 pt-6 text-xs leading-6">
          © {new Date().getFullYear()} Monetcore System Solutions. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
