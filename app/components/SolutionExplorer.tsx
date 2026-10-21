"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Cpu,
  Code2,
  Globe2,
  PlugZap,
  Mail,
  Database,
  Workflow,
  PanelTop,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import { solutionOptions, type SolutionId } from "../config/projectPlanner";
import AutomationSimulation from "./AutomationSimulation";
import SmartProjectPlanner from "./SmartProjectPlanner";
const icons = [Cpu, Code2, Globe2, PlugZap];
function CapabilityIllustration({ id }: { id: SolutionId }) {
  if (id === "integrations")
    return (
      <div className="capability-visual">
        <p className="eyebrow">Illustrative data flow</p>
        <h4>Tools that work together.</h4>
        <div className="integration-map">
          {[
            {
              title: "Existing tools",
              text: "Email, forms and platforms",
              icon: Mail,
            },
            {
              title: "Shared information",
              text: "Scoped API and data connections",
              icon: Database,
            },
            {
              title: "Team workflows",
              text: "Clear handoffs and next actions",
              icon: Workflow,
            },
          ].map(({ title, text, icon: Icon }, i) => (
            <div key={title}>
              <span>
                <Icon size={24} aria-hidden="true" />
              </span>
              <p>
                <strong>{title}</strong>
                <small>{text}</small>
              </p>
              <b aria-hidden="true">0{i + 1}</b>
            </div>
          ))}
        </div>
        <p className="visual-note">
          An illustration of integration capabilities, not a connected live
          system.
        </p>
      </div>
    );
  if (id === "websites")
    return (
      <div className="capability-visual">
        <p className="eyebrow">Illustrative website layout</p>
        <div className="mini-business-site">
          <div>
            <strong>WEBSITE</strong>
            <span>Services · Contact</span>
          </div>
          <span className="mini-site-label">
            Your business, clearly presented.
          </span>
          <h4>
            A professional home.
            <br />A clearer next step.
          </h4>
          <p>Services, business information and simple ways to enquire.</p>
          <div className="mini-site-grid">
            <span>
              <Globe2 size={20} aria-hidden="true" />
              Mobile-friendly
            </span>
            <span>
              <MessageSquare size={20} aria-hidden="true" />
              Enquiry-ready
            </span>
          </div>
          <span className="mini-site-cta">Explore · Enquire · Connect</span>
        </div>
        <p className="visual-note">
          Illustrative interface. Package inclusions and NGN prices are
          on the packages page.
        </p>
      </div>
    );
  return (
    <div className="capability-visual">
      <p className="eyebrow">Illustrative application workspace</p>
      <div className="mini-workspace">
        <div className="workspace-top">
          <LayoutDashboard size={21} aria-hidden="true" />
          <strong>Business workspace</strong>
          <span>CONCEPT</span>
        </div>
        <div className="workspace-navigation">
          <span>Overview</span>
          <span>Workflows</span>
          <span>Reports</span>
        </div>
        <div className="workspace-cards">
          <span>
            <PanelTop size={20} aria-hidden="true" />
            Customer portal<small>One place to find information</small>
          </span>
          <span>
            <Workflow size={20} aria-hidden="true" />
            Internal tools<small>Built around daily work</small>
          </span>
        </div>
        <div className="workspace-rows">
          {[
            "Sample request received",
            "Review project information",
            "Prepare the next action",
          ].map((text, i) => (
            <div key={text}>
              <span>0{i + 1}</span>
              {text}
              <Check size={15} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
      <p className="visual-note">
        Fictional sample interface. Custom applications are scoped for each
        engagement.
      </p>
    </div>
  );
}
export default function SolutionExplorer() {
  const [active, setActive] = useState<SolutionId>("ai");
  const selected = solutionOptions.find((item) => item.id === active)!;
  return (
    <section
      id="explore-solutions"
      className="solution-explorer-section px-5 py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="solution-explorer-heading">
          <div>
            <p className="eyebrow">Explore the possibilities</p>
            <h2>Explore Our Solutions</h2>
          </div>
          <p>
            Choose a capability, explore how it could work, and shape a starting
            point for your own project.
          </p>
        </div>
        <div
          className="solution-selector"
          role="group"
          aria-label="Solution categories"
        >
          {solutionOptions.map((item, index) => {
            const Icon = icons[index];
            return (
              <button
                key={item.id}
                id={`solution-button-${item.id}`}
                type="button"
                aria-pressed={active === item.id}
                aria-controls="solution-experience"
                onClick={() => setActive(item.id)}
                style={
                  {
                    "--solution-accent": item.accent,
                    "--solution-tint": item.tint,
                  } as CSSProperties
                }
              >
                <span>
                  <Icon size={24} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <strong>{item.title}</strong>
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div
          id="solution-experience"
          role="region"
          aria-labelledby={`solution-button-${active}`}
          tabIndex={0}
          className="solution-experience"
          style={
            {
              "--solution-accent": selected.accent,
              "--solution-tint": selected.tint,
            } as CSSProperties
          }
        >
          <div key={active} className="solution-experience-grid">
            <div className="solution-description">
              <p className="eyebrow">A Monetcore capability</p>
              <div aria-live="polite" aria-atomic="true">
                <h3>{selected.title}</h3>
                <p>{selected.description}</p>
              </div>
              <ul>
                {selected.features.map((feature) => (
                  <li key={feature}>
                    <Check size={17} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={selected.href}>
                Explore{" "}
                {active === "websites" ? "Website Packages" : "This Service"}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <a href="#smart-project-planner" className="plan-solution-link">
                Shape your project outline ↓
              </a>
              <p className="solution-scope-note">
                Capabilities and integrations are scoped separately.
                Demonstrations are illustrative and do not promise a live
                commercial service.
              </p>
            </div>
            <div>
              {active === "ai" ? (
                <AutomationSimulation />
              ) : (
                <CapabilityIllustration id={active} />
              )}
            </div>
          </div>
        </div>
        <SmartProjectPlanner />
      </div>
    </section>
  );
}
