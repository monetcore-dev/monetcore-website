export const solutionOptions = [
  {
    id: "ai",
    title: "AI Automation",
    formService: "AI Solution",
    href: "/services#ai-automation",
    description:
      "Explore customer responses and repetitive workflows, with the right review and integrations.",
    features: [
      "Enquiry handling and qualification",
      "AI-assisted communication for review",
      "Follow-up and task workflows",
    ],
    accent: "#345be0",
    tint: "#edf3ff",
  },
  {
    id: "software",
    title: "Custom Software Development",
    formService: "Software Development",
    href: "/services#custom-software",
    description:
      "Shape applications, dashboards and business tools around your team and the work they need to do.",
    features: [
      "Web and mobile applications",
      "Customer portals and dashboards",
      "Internal tools and scoped workflows",
    ],
    accent: "#5142ab",
    tint: "#f0edff",
  },
  {
    id: "websites",
    title: "Smart Website Solutions",
    formService: "Business Website",
    href: "/website-packages",
    description:
      "Bring your business information, enquiries and WhatsApp contact together in a professional digital presence.",
    features: [
      "Mobile-friendly business websites",
      "Enquiry capture and click-to-chat",
      "Proposed packages with clear renewal terms",
    ],
    accent: "#714397",
    tint: "#f6effb",
  },
  {
    id: "integrations",
    title: "Business Integrations",
    formService: "Business Automation",
    href: "/services#business-integrations",
    description:
      "Connect existing tools and data sources so your team can work with a clearer flow of information.",
    features: [
      "API and database connections",
      "Email and platform integrations",
      "Data handoffs and workflow coordination",
    ],
    accent: "#24496b",
    tint: "#edf3f8",
  },
] as const;
export type SolutionId = (typeof solutionOptions)[number]["id"];
export const plannerChallenges = [
  { id: "responses", label: "Slow customer responses or follow-ups" },
  { id: "manual", label: "Too much repetitive manual work" },
  { id: "visibility", label: "An unclear or limited online presence" },
  { id: "disconnected", label: "Tools and information do not connect" },
  {
    id: "reporting",
    label: "Difficulty tracking work and business information",
  },
  { id: "unsure", label: "I need help defining the challenge" },
] as const;
export const plannerCapabilities = [
  { id: "enquiries", label: "Customer enquiry capture" },
  { id: "ai-responses", label: "AI-assisted responses" },
  { id: "booking", label: "Appointment booking" },
  { id: "dashboards", label: "Dashboards and reporting" },
  { id: "connections", label: "Connect existing tools" },
  { id: "website", label: "Mobile-friendly business presence" },
] as const;
export const enquiryBudgets = [
  { value: "Under ₦100,000", label: "Under ₦100,000" },
  { value: "₦100,000 - ₦200,000", label: "₦100,000 – ₦200,000" },
  { value: "₦200,000 - ₦500,000", label: "₦200,000 – ₦500,000" },
  { value: "₦500,000+", label: "₦500,000+" },
  { value: "Not sure yet", label: "Not sure yet — please advise" },
] as const;
export type PlannerSelections = {
  goal: SolutionId | "unsure";
  challenge: string;
  capabilities: string[];
  budget: string;
};
export function recommendProject(selections: PlannerSelections) {
  let id: SolutionId;
  if (selections.goal !== "unsure") id = selections.goal;
  else if (
    selections.challenge === "disconnected" ||
    selections.capabilities.includes("connections")
  )
    id = "integrations";
  else if (
    selections.challenge === "responses" ||
    selections.capabilities.includes("ai-responses")
  )
    id = "ai";
  else if (
    selections.challenge === "visibility" ||
    selections.capabilities.includes("website")
  )
    id = "websites";
  else id = "software";
  const solution = solutionOptions.find((item) => item.id === id)!;
  const reason =
    selections.goal !== "unsure"
      ? "This matches the area you selected. Your challenge and capabilities will help shape the consultation."
      : id === "integrations"
        ? "Connecting tools is a useful starting point for the challenge or capabilities you selected."
        : id === "ai"
          ? "Your response or AI-assisted communication needs suggest exploring an automation workflow."
          : id === "websites"
            ? "Your online presence needs suggest exploring a business website first."
            : "A scoping conversation about custom tools is a useful starting point for your operational needs.";
  const challenge =
    plannerChallenges.find((item) => item.id === selections.challenge)?.label ??
    "To be discussed";
  const capabilities = plannerCapabilities
    .filter((item) => selections.capabilities.includes(item.id))
    .map((item) => item.label);
  const goal =
    selections.goal === "unsure"
      ? "Help me choose"
      : solutionOptions.find((item) => item.id === selections.goal)!.title;
  return {
    solution,
    reason,
    message: `Project planner outline\nGoal: ${goal}\nMain business challenge: ${challenge}\nCapabilities: ${capabilities.length ? capabilities.join(", ") : "To be discussed"}\nEstimated budget selected: ${selections.budget}\nSuggested service to discuss: ${solution.title}\n\nThis is a rule-based starting point, not a quotation, guaranteed timeline or AI-generated estimate.`,
  };
}
