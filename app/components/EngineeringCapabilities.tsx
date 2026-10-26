import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { engineeringCapabilities } from "../config/engineeringCapabilities";

/** Server-rendered foundation: no client JavaScript or integration activation. */
export default function EngineeringCapabilities() {
  return (
    <section aria-labelledby="engineering-capabilities" className="border-y border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-5 py-16 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Full-stack engineering · Human-led delivery</p>
        <h2 id="engineering-capabilities" className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">From your first idea to connected business software.</h2>
        <p className="mt-5 max-w-3xl leading-8 text-slate-200">Monetcore System Solutions brings software development, AI automation and digital services together for businesses in Nigeria and beyond. We define requirements, review progress with you and agree the scope before making commitments.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {engineeringCapabilities.map((item) => (
            <Link key={item.title} href={item.href} className="group rounded-2xl border border-white/20 bg-white/5 p-6 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-200">
              <Layers3 size={24} className="text-blue-200" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-200">Explore services <ArrowUpRight size={16} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm leading-7 text-slate-300">Demonstrations illustrate possibilities; product availability, third-party costs and delivery terms are confirmed in your quotation.</p>
      </div>
    </section>
  );
}
