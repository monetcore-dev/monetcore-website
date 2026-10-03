"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    id: "ai",
    label: "AI Lead Automation",
  },
  {
    id: "website",
    label: "Website Development",
  },
  {
    id: "mobile",
    label: "Mobile Applications",
  },
  {
    id: "saas",
    label: "SaaS Products",
  },
  {
    id: "dashboard",
    label: "Customer Dashboards",
  },
];

export default function HeroShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive(
        (current) =>
          (current + 1) % slides.length
      );
    }, 4500);

    return () =>
      window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-200/60 to-cyan-200/40 blur-2xl" />

      <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>

          <span className="text-xs font-medium text-slate-400">
            Monetcore • {slide.label}
          </span>
        </div>

        <div
          key={slide.id}
          className="animate-[fadeIn_0.5s_ease-out]"
        >
          {slide.id === "ai" && <AISlide />}

          {slide.id === "website" && (
            <WebsiteSlide />
          )}

          {slide.id === "mobile" && (
            <MobileSlide />
          )}

          {slide.id === "saas" && (
            <SaaSSlide />
          )}

          {slide.id === "dashboard" && (
            <DashboardSlide />
          )}
        </div>

        <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-4">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show ${item.label}`}
              onClick={() => setActive(index)}
              className={
                index === active
                  ? "h-2 w-7 rounded-full bg-blue-600 transition-all"
                  : "h-2 w-2 rounded-full bg-slate-200 transition-all hover:bg-blue-300"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AISlide() {
  return (
    <div className="p-5 sm:p-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
          Sales Pipeline
        </p>

        <p className="mt-2 text-2xl font-bold">
          Intelligent lead follow-up
        </p>

        <p className="mt-2 text-sm text-blue-50">
          Capture, qualify, prioritize and
          communicate from one workspace.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          ["Total Leads", "24"],
          ["Hot Leads", "8"],
          ["Due Today", "5"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-xs text-slate-500">
              {label}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
              Today&apos;s Action Queue
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              Follow-ups needing attention
            </p>
          </div>

          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            3 overdue
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {[
            "Priority property enquiry",
            "New corporate lead",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl border border-white bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  AI follow-up ready
                </p>
              </div>

              <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                Open
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WebsiteSlide() {
  return (
    <div className="bg-slate-50 p-5 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="font-bold text-slate-900">
            NORTHSTAR
          </p>

          <div className="hidden gap-4 text-[10px] font-medium text-slate-400 sm:flex">
            <span>Solutions</span>
            <span>Company</span>
            <span>Contact</span>
          </div>

          <span className="rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-semibold text-white">
            Get Started
          </span>
        </div>

        <div className="grid min-h-[330px] items-center gap-6 p-7 sm:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Modern business website
            </span>

            <h3 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
              Turn your website into a growth
              engine.
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Fast, responsive and designed
              around your customers.
            </p>

            <div className="mt-5 flex gap-2">
              <span className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
                Start Project
              </span>

              <span className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                Learn More
              </span>
            </div>
          </div>

          <div className="relative min-h-52 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-400 p-5">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />

            <div className="relative rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="h-3 w-20 rounded-full bg-white/50" />
              <div className="mt-3 h-3 w-32 rounded-full bg-white/80" />
              <div className="mt-2 h-2 w-24 rounded-full bg-white/40" />

              <div className="mt-8 grid grid-cols-2 gap-2">
                <div className="h-20 rounded-xl bg-white/20" />
                <div className="h-20 rounded-xl bg-white/90" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSlide() {
  return (
    <div className="flex min-h-[455px] items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="grid w-full items-center gap-8 sm:grid-cols-[0.85fr_1.15fr]">
        <div className="mx-auto w-[190px] rounded-[2.2rem] border-[7px] border-slate-900 bg-white p-3 shadow-xl">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-800" />

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400">
                  Welcome back
                </p>
                <p className="text-sm font-bold">
                  My Business
                </p>
              </div>

              <div className="h-8 w-8 rounded-full bg-blue-100" />
            </div>

            <div className="mt-5 rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 p-4 text-white">
              <p className="text-[9px] text-blue-100">
                Revenue
              </p>
              <p className="mt-1 text-xl font-bold">
                ₦4.8M
              </p>
              <p className="mt-1 text-[9px] text-blue-100">
                +18.4% this month
              </p>
            </div>

            <p className="mt-5 text-[10px] font-bold">
              Recent activity
            </p>

            <div className="mt-3 space-y-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"
                >
                  <div className="h-7 w-7 rounded-lg bg-blue-100" />
                  <div className="flex-1">
                    <div className="h-1.5 w-16 rounded bg-slate-300" />
                    <div className="mt-1.5 h-1.5 w-10 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Mobile App Development
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Your business in your
            customers&apos; hands.
          </h3>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Modern mobile experiences designed
            around real customer and business
            workflows.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              "Customer apps",
              "Business apps",
              "Connected systems",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-blue-100 bg-white px-3 py-2 text-[10px] font-semibold text-blue-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SaaSSlide() {
  return (
    <div className="bg-slate-50 p-5 sm:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              SaaS Product
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-950">
              Subscription workspace
            </h3>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
            Live
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["Customers", "1,284"],
            ["MRR", "₦8.2M"],
            ["Growth", "+24%"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl bg-slate-50 p-4"
            >
              <p className="text-[10px] text-slate-400">
                {label}
              </p>

              <p className="mt-2 text-lg font-bold">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Revenue growth
            </p>

            <div className="mt-8 flex h-28 items-end gap-2">
              {[35, 50, 43, 65, 58, 82, 95].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-cyan-400"
                    style={{
                      height: `${height}%`,
                    }}
                  />
                )
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Active plans
            </p>

            <p className="mt-3 text-3xl font-bold">
              847
            </p>

            <div className="mt-8 space-y-3">
              <div className="h-2 rounded-full bg-blue-500" />
              <div className="h-2 w-4/5 rounded-full bg-cyan-400" />
              <div className="h-2 w-3/5 rounded-full bg-violet-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSlide() {
  return (
    <div className="bg-slate-950 p-5 text-white sm:p-6">
      <div className="flex min-h-[405px] gap-4">
        <div className="hidden w-28 rounded-2xl bg-white/5 p-3 sm:block">
          <div className="h-8 rounded-lg bg-blue-600" />

          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-2 rounded-full bg-white/10"
              />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-400">
            Customer Dashboard
          </p>

          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-xl font-bold">
              Business overview
            </h3>

            <span className="rounded-lg bg-white/10 px-3 py-2 text-[10px] text-slate-300">
              October 2026
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Orders", "428"],
              ["Customers", "316"],
              ["Revenue", "₦6.4M"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <p className="text-[9px] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 font-bold">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-white p-5 text-slate-950">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">
                Performance
              </p>

              <span className="text-[10px] font-semibold text-emerald-600">
                +16.8%
              </span>
            </div>

            <div className="mt-7 flex h-28 items-end gap-2">
              {[40, 62, 50, 76, 68, 88, 72, 96].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-blue-600"
                    style={{
                      height: `${height}%`,
                    }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}