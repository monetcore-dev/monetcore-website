/** Product states reflect repository evidence, not commercial availability claims. */
export type Service = {
  slug: string;
  title: string;
  headline: string;
  intro: string;
  demo: string;
  features: string[];
  challenges: string[];
  industries: string[];
  usecase: string;
  formService: string;
};
export type Product = {
  slug: string;
  title: string;
  headline: string;
  intro: string;
  demo: string;
  features: string[];
  status: string;
  disclosure: string;
  related: string;
};
export const services: Service[] = [
  {
    slug: "ai-automation",
    title: "AI Automation",
    headline: "Make repetitive work easier to manage.",
    intro:
      "Design assisted customer conversations and repeatable workflows with clear human oversight.",
    demo: "ai",
    features: [
      "AI customer service assistants",
      "AI receptionists",
      "WhatsApp AI automation",
      "AI lead capture and qualification",
      "Automated customer follow-ups",
      "AI appointment scheduling",
      "AI sales assistants",
      "AI document processing",
      "Business workflow automation",
      "CRM and business application integrations",
    ],
    challenges: [
      "Slow enquiry responses",
      "Manual lead sorting",
      "Disconnected customer conversations",
    ],
    industries: [
      "Retail and e-commerce",
      "Professional services",
      "Hospitality and appointment businesses",
    ],
    usecase:
      "An Abuja services team could capture an enquiry, ask qualification questions and route the conversation to a staff member.",
    formService: "AI Solution",
  },
  {
    slug: "software-development",
    title: "Custom Software Development",
    headline: "Software that fits the way you work.",
    intro:
      "Bring customer records, stock, sales and internal operations into applications designed around your processes.",
    demo: "workspace",
    features: [
      "Custom business applications",
      "Enterprise software",
      "CRM systems",
      "ERP solutions",
      "Inventory management",
      "Sales management",
      "Financial software",
      "Customer portals",
      "Business dashboards",
      "Internal operations platforms",
    ],
    challenges: [
      "Spreadsheet duplication",
      "Limited operational visibility",
      "Tools that do not fit your process",
    ],
    industries: [
      "Distribution and retail",
      "Service companies",
      "Growing operations teams",
    ],
    usecase:
      "A Nigerian distributor could connect stock movements, customer follow-ups and sales reporting in one role-aware workspace.",
    formService: "Software Development",
  },
  {
    slug: "website-development",
    title: "Website Development",
    headline: "A digital home your business owns.",
    intro:
      "Create a clear, mobile-friendly website that connects your brand, enquiries and business tools.",
    demo: "website",
    features: [
      "Business websites",
      "Corporate websites",
      "E-commerce websites",
      "Landing pages",
      "Booking websites",
      "Website redesign",
      "Website maintenance",
      "SEO-ready development",
      "Website integrations",
      "Conversion-focused design",
    ],
    challenges: [
      "Customers cannot find reliable information",
      "Enquiries are scattered across social platforms",
      "An existing website is hard to use on mobile",
    ],
    industries: [
      "Local businesses",
      "Professional practices",
      "Retail and hospitality",
    ],
    usecase:
      "A Lagos studio could present its services, answer common questions and collect enquiries alongside Instagram and WhatsApp.",
    formService: "Business Website",
  },
  {
    slug: "business-integrations",
    title: "Business Systems & Integrations",
    headline: "Connect the tools behind your business.",
    intro:
      "Move information between approved systems with validation, ownership and a clear failure-recovery plan.",
    demo: "workflow",
    features: [
      "CRM integration",
      "Payment gateway integration",
      "WhatsApp Business integration",
      "Email automation",
      "Accounting integrations",
      "API integrations",
      "Workflow automation",
      "Data synchronization",
      "Third-party business applications",
    ],
    challenges: [
      "Repeated data entry",
      "Missed handovers",
      "Updates that never reach the next system",
    ],
    industries: [
      "Sales and finance teams",
      "Online retailers",
      "Multi-tool operations",
    ],
    usecase:
      "A store could pass a verified payment event into its CRM and accounting workflow, with a review step for exceptions.",
    formService: "Business Automation",
  },
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    headline: "Put useful experiences in your customers’ hands.",
    intro:
      "Plan and build mobile applications for customers and teams, with a practical release and support strategy.",
    demo: "mobile",
    features: [
      "Android applications",
      "iOS applications",
      "Cross-platform applications",
      "Customer-facing apps",
      "Internal business apps",
      "Booking apps",
      "E-commerce apps",
      "Mobile payment experiences",
    ],
    challenges: [
      "Tasks are difficult away from a desk",
      "Customers need a simpler mobile journey",
      "Teams lack a consistent field workflow",
    ],
    industries: [
      "Retail and delivery",
      "Appointment businesses",
      "Field and internal teams",
    ],
    usecase:
      "A local service business could let customers browse offerings and request an appointment through an accessible mobile application.",
    formService: "Mobile App Development",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing & Growth",
    headline: "Connect your message to the next meaningful action.",
    intro:
      "Combine content, marketing operations, software and automation to plan campaigns and understand what happens after an enquiry.",
    demo: "marketing",
    features: [
      "Social Media Marketing",
      "Social Media Management",
      "Content Strategy",
      "Graphic Design for Social Media",
      "Short-Form Video Marketing",
      "Facebook and Instagram Advertising",
      "Google Ads",
      "Search Engine Optimization",
      "Lead Generation",
      "Landing Page Optimization",
      "WhatsApp Marketing",
      "Email Marketing",
      "AI-Powered Marketing Automation",
      "CRM-Based Lead Nurturing",
      "Marketing Analytics and Reporting",
    ],
    challenges: [
      "Inconsistent content",
      "Campaign enquiries are not followed up",
      "Reporting is disconnected from business goals",
    ],
    industries: [
      "Retail and consumer brands",
      "Professional services",
      "Hospitality and education",
    ],
    usecase:
      "A Nigerian training provider could plan educational posts, send traffic to a focused landing page and track consent-based follow-up in its CRM.",
    formService: "Digital Marketing & Growth",
  },
  {
    slug: "technology-consulting",
    title: "Technology Consulting",
    headline: "A clear roadmap before the next investment.",
    intro:
      "Assess your processes, priorities and constraints before choosing technology or committing to a build.",
    demo: "assessment",
    features: [
      "Technology strategy",
      "Digital transformation",
      "AI readiness assessment",
      "Business process analysis",
      "Software architecture",
      "Technology selection",
      "Systems modernization",
      "Automation planning",
      "Digital growth strategy",
    ],
    challenges: [
      "Too many disconnected tools",
      "Unclear requirements and priorities",
      "Uncertainty about where AI can help",
    ],
    industries: [
      "Business owners",
      "Operations leaders",
      "Teams planning modernization",
    ],
    usecase:
      "An Abuja business could map its current processes, identify information gaps and agree a phased technology roadmap before buying software.",
    formService: "Technology Consulting",
  },
];
export const products: Product[] = [
  {
    slug: "ai-lead-automation",
    title: "Monetcore AI Lead Automation",
    headline: "Give every enquiry a clear next step.",
    intro:
      "Explore lead capture, qualification and follow-up as a connected workspace.",
    demo: "lead",
    features: [
      "Lead capture",
      "Lead qualification",
      "Automated responses",
      "CRM integration",
      "Follow-up workflows",
      "Lead pipeline dashboard",
    ],
    status: "Interactive demonstration · external prototype",
    disclosure:
      "A local simulation is available here. An existing externally hosted prototype is linked separately; production readiness and commercial availability are not verified.",
    related: "ai-automation",
  },
  {
    slug: "smart-booking",
    title: "Monetcore Smart Booking",
    headline: "Make appointment handovers easier to follow.",
    intro:
      "Explore an appointment journey from slot selection to a clearly tracked reservation.",
    demo: "booking",
    features: [
      "Appointment scheduling",
      "Availability management",
      "Customer booking experience",
      "Booking confirmations",
      "Calendar synchronization",
      "Reminder workflows",
      "Booking dashboard demo",
    ],
    status: "Product concept · isolated demonstration",
    disclosure:
      "Monetcore’s existing company consultation workflow is operational by owner confirmation. This standalone product and its reminder features are concepts; the demo below is local and creates no real booking.",
    related: "business-integrations",
  },
  {
    slug: "ai-receptionist",
    title: "Monetcore AI Receptionist",
    headline: "A helpful first conversation, with a human next step.",
    intro:
      "Explore enquiry handling, appointment requests and a clear handoff to your team.",
    demo: "receptionist",
    features: [
      "AI-powered customer enquiries",
      "Appointment requests",
      "Lead collection",
      "Conversation handoff",
      "Business-hours handling",
      "Conversation simulation",
    ],
    status: "Planned product · conversation simulation",
    disclosure:
      "This is a proposed product experience, not a deployed AI or telephony service. The conversation uses local rules and scripted examples, without live AI, calls or messages.",
    related: "ai-automation",
  },
  {
    slug: "crm",
    title: "Monetcore CRM",
    headline: "Keep relationships and next actions in view.",
    intro:
      "Explore a customer workspace that connects pipeline, activity and reporting.",
    demo: "workspace",
    features: [
      "Customer management",
      "Lead pipeline",
      "Sales tracking",
      "Customer activity",
      "Task management",
      "Reporting",
      "Interactive CRM demo",
    ],
    status: "Planned product · interactive demonstration",
    disclosure:
      "The workspace contains synthetic records and local interactions. It is not an available hosted CRM, and changes are not saved to a server.",
    related: "software-development",
  },
  {
    slug: "business-automation",
    title: "Monetcore Business Automation",
    headline: "Turn repeatable work into visible handovers.",
    intro:
      "Explore configurable workflow steps, approval checkpoints and notifications.",
    demo: "workflow",
    features: [
      "Workflow templates",
      "Business process automation",
      "Approval workflows",
      "Notifications",
      "Integrations",
      "Automation builder demo",
    ],
    status: "Planned product · workflow simulation",
    disclosure:
      "These are local workflow examples. No third-party system is connected and no approval, payment or notification is sent. A production implementation requires a separately agreed scope.",
    related: "business-integrations",
  },
  {
    slug: "ai-marketing-manager",
    title: "Monetcore AI Marketing Manager",
    headline: "From campaign idea to a coordinated plan.",
    intro:
      "Explore campaign planning, content ideas, lead nurturing and illustrative reporting.",
    demo: "marketing",
    features: [
      "Campaign planning",
      "Content calendar",
      "AI-assisted content ideas",
      "Marketing workflow automation",
      "Lead nurturing",
      "Campaign analytics",
      "Interactive marketing dashboard demo",
    ],
    status: "Planned product · strategy simulation",
    disclosure:
      "The planner is deterministic and local, not connected to AI providers, advertising accounts or social platforms. Sample metrics are fictional and are not predictions or guaranteed results.",
    related: "digital-marketing",
  },
];
export function findService(slug: string) {
  return services.find((item) => item.slug === slug);
}
export function findProduct(slug: string) {
  return products.find((item) => item.slug === slug);
}
export function enquiryHref(
  kind: "service" | "product",
  slug: string,
  booking = false,
) {
  return `${booking ? "/book" : "/contact"}?interest=${encodeURIComponent(`${kind}:${slug}`)}${booking ? "" : "#consultation"}`;
}
