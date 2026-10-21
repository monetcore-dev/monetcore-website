export const marketingIndustries = [
  "Retail",
  "Professional services",
  "Hospitality",
  "Education",
] as const;
export const marketingGoals = [
  "Awareness",
  "Enquiries",
  "Repeat customers",
] as const;
export const marketingPlatforms = [
  "Instagram",
  "Facebook",
  "Google Search",
  "WhatsApp",
] as const;
export function campaignPlan(
  industry: string,
  goal: string,
  platforms: string[],
  weeks: number,
) {
  const chosen = marketingPlatforms.filter((p) => platforms.includes(p));
  if (
    !marketingIndustries.includes(
      industry as (typeof marketingIndustries)[number],
    ) ||
    !marketingGoals.includes(goal as (typeof marketingGoals)[number]) ||
    ![2, 4, 6].includes(weeks) ||
    !chosen.length
  )
    return null;
  const focus =
    goal === "Awareness"
      ? "Explain one useful customer problem before introducing the offer."
      : goal === "Enquiries"
        ? "Link one clear offer to a focused landing page and a consent-based enquiry."
        : "Share helpful follow-up content and an opt-in invitation to return.";
  return {
    industry,
    goal,
    platforms: chosen,
    weeks,
    focus,
    calendar: Array.from({ length: weeks }, (_, i) => ({
      week: i + 1,
      theme: [
        "Introduce the problem",
        "Explain the approach",
        "Answer a common question",
        "Show an illustrative walkthrough",
        "Invite a conversation",
        "Review and refine",
      ][i],
      channel: chosen[i % chosen.length],
    })),
    sample: `${industry}: ${goal === "Enquiries" ? "Have a question? Explore our services and request a conversation." : goal === "Awareness" ? "A useful idea for your next business decision. Learn how our approach works." : "Ready for your next step? Opt in to hear about relevant updates."}`,
    illustrativeEnquiries: weeks * chosen.length * 3,
  };
}
export const technologyChallenges = [
  "Scattered customer records",
  "Repetitive manual tasks",
  "Low online visibility",
  "Disconnected systems",
  "Unclear reporting",
];
export function technologyRoadmap(challenges: string[]) {
  const selected = technologyChallenges.filter((c) => challenges.includes(c));
  if (!selected.length) return [];
  return [
    "Discover: document the process, ownership, data permissions and success criteria.",
    ...(selected.includes("Scattered customer records")
      ? ["Organise: define a shared customer model and CRM responsibilities."]
      : []),
    ...(selected.includes("Low online visibility")
      ? ["Establish: create a clear website and a measurable enquiry pathway."]
      : []),
    ...(selected.includes("Disconnected systems") ||
    selected.includes("Repetitive manual tasks")
      ? [
          "Connect: pilot one integration or repeatable workflow with a human review point.",
        ]
      : []),
    ...(selected.includes("Unclear reporting")
      ? ["Measure: agree reporting definitions and validate source data."]
      : []),
    "Review: validate the pilot, costs, security and support before expanding.",
  ];
}
