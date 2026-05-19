import type { MDCategoryDef, MDItem } from "@/domain/entities/MasterData";

// Categories define the schema; items are the actual seed rows.
// Every CRUD operation in the store works generically against these.

export const MASTER_DATA_CATEGORIES: MDCategoryDef[] = [
  // === LEADS ===
  {
    id: "leads.sources",
    module: "leads",
    label: "Lead Sources",
    description: "Channels that produce inbound or outbound leads.",
    fields: [
      { key: "label", label: "Name", type: "text", required: true },
      { key: "channel", label: "Channel", type: "select", options: ["Inbound", "Outbound", "Partner", "Event"] },
      { key: "active", label: "Active", type: "boolean" },
    ],
    displayKeys: ["label", "channel", "active"],
  },
  {
    id: "leads.stages",
    module: "leads",
    label: "Pipeline Stages",
    description: "Stages in the sales pipeline and their conversion probability.",
    fields: [
      { key: "label", label: "Stage", type: "text", required: true },
      { key: "probability", label: "Probability (%)", type: "number" },
      { key: "color", label: "Accent", type: "color" },
    ],
    displayKeys: ["label", "probability", "color"],
  },

  // === CRM (merged into Leads / Sales) ===
  {
    id: "crm.segments",
    module: "leads",
    label: "Client Segments",
    description: "Categorisation of customer accounts.",
    fields: [
      { key: "label", label: "Segment", type: "text", required: true },
      { key: "description", label: "Description", type: "text" },
      { key: "color", label: "Accent", type: "color" },
    ],
    displayKeys: ["label", "description", "color"],
  },
  {
    id: "crm.interactionTypes",
    module: "leads",
    label: "Interaction Types",
    description: "Kinds of customer interactions logged.",
    fields: [
      { key: "label", label: "Type", type: "text", required: true },
      { key: "icon", label: "Icon hint", type: "text" },
    ],
    displayKeys: ["label", "icon"],
  },

  // === CLIENTS ===
  {
    id: "clients.industries",
    module: "clients",
    label: "Industries",
    description: "Industry verticals for account classification.",
    fields: [
      { key: "label", label: "Industry", type: "text", required: true },
      { key: "active", label: "Active", type: "boolean" },
    ],
    displayKeys: ["label", "active"],
  },
  {
    id: "clients.healthLabels",
    module: "clients",
    label: "Account Health Labels",
    description: "Health states applied to customer accounts.",
    fields: [
      { key: "label", label: "Label", type: "text", required: true },
      { key: "color", label: "Color", type: "color" },
      { key: "score", label: "Score floor", type: "number" },
    ],
    displayKeys: ["label", "score", "color"],
  },

  // === PROJECTS ===
  {
    id: "projects.statuses",
    module: "projects",
    label: "Project Statuses",
    description: "Lifecycle states for projects.",
    fields: [
      { key: "label", label: "Status", type: "text", required: true },
      { key: "color", label: "Color", type: "color" },
      { key: "isActive", label: "Active phase", type: "boolean" },
    ],
    displayKeys: ["label", "color", "isActive"],
  },
  {
    id: "projects.methodologies",
    module: "projects",
    label: "Methodologies",
    description: "Delivery methodologies the firm offers.",
    fields: [
      { key: "label", label: "Methodology", type: "text", required: true },
      { key: "description", label: "Description", type: "text" },
    ],
    displayKeys: ["label", "description"],
  },

  // === TASKS (merged into Projects / Sprints) ===
  {
    id: "tasks.priorities",
    module: "projects",
    label: "Sprint Task Priorities",
    description: "Task / story priority levels.",
    fields: [
      { key: "label", label: "Priority", type: "text", required: true },
      { key: "weight", label: "Weight", type: "number" },
      { key: "color", label: "Color", type: "color" },
    ],
    displayKeys: ["label", "weight", "color"],
  },
  {
    id: "tasks.statuses",
    module: "projects",
    label: "Sprint Task Statuses",
    description: "Columns on the sprint board.",
    fields: [
      { key: "label", label: "Status", type: "text", required: true },
      { key: "isDone", label: "Counts as done", type: "boolean" },
    ],
    displayKeys: ["label", "isDone"],
  },

  // === RESOURCES (merged into HR / People & Operations) ===
  {
    id: "resources.skills",
    module: "hr",
    label: "Skills",
    description: "Tagged competencies for capacity planning.",
    fields: [
      { key: "label", label: "Skill", type: "text", required: true },
      { key: "category", label: "Category", type: "select", options: ["Engineering", "Design", "Product", "Ops"] },
    ],
    displayKeys: ["label", "category"],
  },
  {
    id: "resources.seniority",
    module: "hr",
    label: "Seniority Levels",
    description: "Career ladder levels.",
    fields: [
      { key: "label", label: "Level", type: "text", required: true },
      { key: "minYears", label: "Min years", type: "number" },
    ],
    displayKeys: ["label", "minYears"],
  },

  // === HR ===
  {
    id: "hr.departments",
    module: "hr",
    label: "Departments",
    description: "Org-chart departments.",
    fields: [
      { key: "label", label: "Department", type: "text", required: true },
      { key: "code", label: "Code", type: "text" },
    ],
    displayKeys: ["label", "code"],
  },
  {
    id: "hr.positions",
    module: "hr",
    label: "Positions",
    description: "Job titles available to assign.",
    fields: [
      { key: "label", label: "Position", type: "text", required: true },
      { key: "department", label: "Department", type: "text" },
      { key: "level", label: "Level", type: "select", options: ["Junior", "Mid", "Senior", "Lead", "Manager", "Director"] },
    ],
    displayKeys: ["label", "department", "level"],
  },
  {
    id: "hr.leaveTypes",
    module: "hr",
    label: "Leave Types",
    description: "Categories of leave employees can request.",
    fields: [
      { key: "label", label: "Type", type: "text", required: true },
      { key: "entitled", label: "Days entitled / year", type: "number" },
      { key: "paid", label: "Paid", type: "boolean" },
    ],
    displayKeys: ["label", "entitled", "paid"],
  },

  // === TIMESHEET ===
  {
    id: "timesheet.activityTypes",
    module: "timesheet",
    label: "Activity Types",
    description: "Kinds of work logged on the timesheet.",
    fields: [
      { key: "label", label: "Activity", type: "text", required: true },
      { key: "billable", label: "Billable by default", type: "boolean" },
    ],
    displayKeys: ["label", "billable"],
  },

  // === FINANCE ===
  {
    id: "finance.taxRates",
    module: "finance",
    label: "Tax Rates",
    description: "Indonesian tax rates referenced by invoices and journals.",
    fields: [
      { key: "label", label: "Name", type: "text", required: true },
      { key: "code", label: "Code", type: "text" },
      { key: "rate", label: "Rate (%)", type: "number" },
    ],
    displayKeys: ["label", "code", "rate"],
  },
  {
    id: "finance.currencies",
    module: "finance",
    label: "Currencies",
    description: "Currencies supported for billing and accounting.",
    fields: [
      { key: "code", label: "Code", type: "text", required: true },
      { key: "label", label: "Name", type: "text", required: true },
      { key: "symbol", label: "Symbol", type: "text" },
      { key: "isDefault", label: "Default", type: "boolean" },
    ],
    displayKeys: ["code", "label", "symbol", "isDefault"],
  },
  {
    id: "finance.banks",
    module: "finance",
    label: "Banks",
    description: "Bank accounts available for receipts and payouts.",
    fields: [
      { key: "label", label: "Bank", type: "text", required: true },
      { key: "code", label: "Code", type: "text" },
      { key: "swift", label: "SWIFT", type: "text" },
    ],
    displayKeys: ["label", "code", "swift"],
  },

  // === TRANSACTIONS ===
  {
    id: "transaction.paymentMethods",
    module: "transaction",
    label: "Payment Methods",
    description: "Channels customers and vendors are paid through.",
    fields: [
      { key: "label", label: "Method", type: "text", required: true },
      { key: "type", label: "Type", type: "select", options: ["Bank", "Card", "E-Wallet", "Cash"] },
    ],
    displayKeys: ["label", "type"],
  },
  {
    id: "transaction.expenseCategories",
    module: "transaction",
    label: "Expense Categories",
    description: "Buckets used for employee expense claims.",
    fields: [
      { key: "label", label: "Category", type: "text", required: true },
      { key: "policyMax", label: "Policy max (IDR)", type: "number" },
    ],
    displayKeys: ["label", "policyMax"],
  },

  // === CONTRACTS (merged into HR / People & Operations) ===
  {
    id: "contracts.types",
    module: "hr",
    label: "Contract Types",
    description: "Commercial structures the firm uses.",
    fields: [
      { key: "label", label: "Type", type: "text", required: true },
      { key: "description", label: "Description", type: "text" },
    ],
    displayKeys: ["label", "description"],
  },
  {
    id: "contracts.signatureStatuses",
    module: "hr",
    label: "Signature Statuses",
    description: "Stages of contract signature workflow.",
    fields: [
      { key: "label", label: "Status", type: "text", required: true },
      { key: "color", label: "Color", type: "color" },
    ],
    displayKeys: ["label", "color"],
  },

  // === SUPPORT ===
  {
    id: "support.severities",
    module: "support",
    label: "Ticket Severities",
    description: "Severity ladder with default SLA window.",
    fields: [
      { key: "label", label: "Severity", type: "text", required: true },
      { key: "slaHours", label: "SLA (hours)", type: "number" },
      { key: "color", label: "Color", type: "color" },
    ],
    displayKeys: ["label", "slaHours", "color"],
  },
  {
    id: "support.categories",
    module: "support",
    label: "Ticket Categories",
    description: "What a ticket is about.",
    fields: [
      { key: "label", label: "Category", type: "text", required: true },
      { key: "team", label: "Default team", type: "text" },
    ],
    displayKeys: ["label", "team"],
  },

  // === KNOWLEDGE ===
  {
    id: "knowledge.categories",
    module: "knowledge",
    label: "Article Categories",
    description: "Top-level groupings of knowledge articles.",
    fields: [
      { key: "label", label: "Category", type: "text", required: true },
      { key: "color", label: "Color", type: "color" },
    ],
    displayKeys: ["label", "color"],
  },
  {
    id: "knowledge.tags",
    module: "knowledge",
    label: "Tags",
    description: "Cross-cutting tags used for search.",
    fields: [{ key: "label", label: "Tag", type: "text", required: true }],
    displayKeys: ["label"],
  },

  // === ADMIN / IAM (system-level master data) ===
  {
    id: "admin.lookupCategories",
    module: "admin",
    label: "Lookup Categories",
    description: "Registry of all lookup categories across the system.",
    fields: [
      { key: "label", label: "Category", type: "text", required: true },
      { key: "module", label: "Module", type: "text" },
    ],
    displayKeys: ["label", "module"],
  },
  {
    id: "admin.numberingSequences",
    module: "admin",
    label: "Numbering Sequences",
    description: "Auto-number formats per document type.",
    fields: [
      { key: "label", label: "Document", type: "text", required: true },
      { key: "prefix", label: "Prefix", type: "text" },
      { key: "next", label: "Next number", type: "number" },
      { key: "padding", label: "Padding", type: "number" },
    ],
    displayKeys: ["label", "prefix", "next", "padding"],
  },

  // === USER PORTAL ===
  {
    id: "portal.meetingPurposes",
    module: "portal",
    label: "HR Meeting Purposes",
    description: "Reasons employees can book a meeting with HR.",
    fields: [
      { key: "label", label: "Purpose", type: "text", required: true },
      { key: "defaultDurationMinutes", label: "Default duration (min)", type: "number" },
    ],
    displayKeys: ["label", "defaultDurationMinutes"],
  },
  {
    id: "portal.onboardingChecklist",
    module: "portal",
    label: "Onboarding Checklist",
    description: "Template tasks new joiners get assigned automatically.",
    fields: [
      { key: "label", label: "Task", type: "text", required: true },
      { key: "weekNumber", label: "Week", type: "number" },
      { key: "category", label: "Category", type: "select", options: ["Setup", "Training", "People", "Compliance", "Product"] },
    ],
    displayKeys: ["label", "weekNumber", "category"],
  },
  {
    id: "portal.attendancePolicy",
    module: "portal",
    label: "Attendance Policy",
    description: "Working hours and grace-period rules.",
    fields: [
      { key: "label", label: "Rule", type: "text", required: true },
      { key: "value", label: "Value", type: "text" },
    ],
    displayKeys: ["label", "value"],
  },

  // === DASHBOARD ===
  {
    id: "dashboard.kpis",
    module: "dashboard",
    label: "KPI Definitions",
    description: "Surfaced KPIs and their target floor.",
    fields: [
      { key: "label", label: "KPI", type: "text", required: true },
      { key: "target", label: "Target", type: "number" },
      { key: "unit", label: "Unit", type: "select", options: ["%", "IDR", "count", "h"] },
    ],
    displayKeys: ["label", "target", "unit"],
  },
];

// Default item seeds keyed by category id.
export const MASTER_DATA_SEEDS: Record<string, MDItem[]> = {
  "leads.sources": [
    { id: "src-001", label: "Referral", channel: "Partner", active: true },
    { id: "src-002", label: "Website", channel: "Inbound", active: true },
    { id: "src-003", label: "Outbound", channel: "Outbound", active: true },
    { id: "src-004", label: "Event", channel: "Event", active: true },
    { id: "src-005", label: "Partner", channel: "Partner", active: true },
    { id: "src-006", label: "Inbound", channel: "Inbound", active: true },
  ],
  "leads.stages": [
    { id: "stg-001", label: "New Lead", probability: 10, color: "#A1A1AA" },
    { id: "stg-002", label: "Qualified", probability: 25, color: "#60A5FA" },
    { id: "stg-003", label: "Discovery", probability: 35, color: "#06B6D4" },
    { id: "stg-004", label: "Proposal Sent", probability: 50, color: "#A855F7" },
    { id: "stg-005", label: "Negotiation", probability: 70, color: "#FBBF24" },
    { id: "stg-006", label: "Won", probability: 100, color: "#34D399" },
    { id: "stg-007", label: "Lost", probability: 0, color: "#EF4444" },
  ],

  "crm.segments": [
    { id: "seg-001", label: "Enterprise", description: "> 1000 employees / IDR > 50B", color: "#7DD3FC" },
    { id: "seg-002", label: "Mid-market", description: "200–1000 employees", color: "#A7F3D0" },
    { id: "seg-003", label: "Growth", description: "< 200 employees, scale-up", color: "#FDE68A" },
    { id: "seg-004", label: "Strategic", description: "Lighthouse logo for marketing", color: "#FBCFE8" },
  ],
  "crm.interactionTypes": [
    { id: "it-001", label: "Meeting", icon: "calendar" },
    { id: "it-002", label: "Call", icon: "phone" },
    { id: "it-003", label: "Email", icon: "mail" },
    { id: "it-004", label: "Note", icon: "note" },
  ],

  "clients.industries": [
    { id: "ind-001", label: "Banking & Finance", active: true },
    { id: "ind-002", label: "Retail & E-commerce", active: true },
    { id: "ind-003", label: "Logistics", active: true },
    { id: "ind-004", label: "Energy", active: true },
    { id: "ind-005", label: "HealthTech", active: true },
    { id: "ind-006", label: "AgriTech", active: true },
    { id: "ind-007", label: "EdTech", active: true },
    { id: "ind-008", label: "Insurance", active: true },
    { id: "ind-009", label: "F&B", active: true },
    { id: "ind-010", label: "Real Estate", active: true },
    { id: "ind-011", label: "Automotive", active: true },
  ],
  "clients.healthLabels": [
    { id: "hl-001", label: "excellent", color: "#34D399", score: 85 },
    { id: "hl-002", label: "stable", color: "#60A5FA", score: 70 },
    { id: "hl-003", label: "at-risk", color: "#FBBF24", score: 50 },
    { id: "hl-004", label: "churn-risk", color: "#F87171", score: 0 },
  ],

  "projects.statuses": [
    { id: "ps-001", label: "Discovery", color: "#60A5FA", isActive: true },
    { id: "ps-002", label: "Planning", color: "#60A5FA", isActive: true },
    { id: "ps-003", label: "In Development", color: "#FBCFE8", isActive: true },
    { id: "ps-004", label: "QA", color: "#FBBF24", isActive: true },
    { id: "ps-005", label: "UAT", color: "#FBBF24", isActive: true },
    { id: "ps-006", label: "Delivered", color: "#34D399", isActive: false },
    { id: "ps-007", label: "Maintenance", color: "#A1A1AA", isActive: false },
  ],
  "projects.methodologies": [
    { id: "pm-001", label: "Scrum", description: "Iterative, fixed-length sprints with backlog grooming." },
    { id: "pm-002", label: "Kanban", description: "Continuous flow, WIP limits, no fixed sprint." },
    { id: "pm-003", label: "Waterfall", description: "Sequential phases with sign-off gates." },
    { id: "pm-004", label: "Hybrid", description: "Discovery in waterfall, build in scrum." },
  ],

  "tasks.priorities": [
    { id: "tp-001", label: "low", weight: 1, color: "#A1A1AA" },
    { id: "tp-002", label: "medium", weight: 2, color: "#60A5FA" },
    { id: "tp-003", label: "high", weight: 3, color: "#FBBF24" },
    { id: "tp-004", label: "critical", weight: 4, color: "#F87171" },
  ],
  "tasks.statuses": [
    { id: "ts-001", label: "Backlog", isDone: false },
    { id: "ts-002", label: "To Do", isDone: false },
    { id: "ts-003", label: "In Progress", isDone: false },
    { id: "ts-004", label: "Review", isDone: false },
    { id: "ts-005", label: "QA", isDone: false },
    { id: "ts-006", label: "Done", isDone: true },
  ],

  "resources.skills": [
    { id: "sk-001", label: "React", category: "Engineering" },
    { id: "sk-002", label: "Next.js", category: "Engineering" },
    { id: "sk-003", label: "Go", category: "Engineering" },
    { id: "sk-004", label: "PostgreSQL", category: "Engineering" },
    { id: "sk-005", label: "Figma", category: "Design" },
    { id: "sk-006", label: "Design Systems", category: "Design" },
    { id: "sk-007", label: "Discovery", category: "Product" },
    { id: "sk-008", label: "Kubernetes", category: "Ops" },
    { id: "sk-009", label: "AWS", category: "Ops" },
  ],
  "resources.seniority": [
    { id: "sl-001", label: "Junior", minYears: 0 },
    { id: "sl-002", label: "Mid", minYears: 2 },
    { id: "sl-003", label: "Senior", minYears: 5 },
    { id: "sl-004", label: "Lead", minYears: 7 },
    { id: "sl-005", label: "Principal", minYears: 10 },
  ],

  "hr.departments": [
    { id: "dept-001", label: "Product", code: "PRD" },
    { id: "dept-002", label: "UI/UX", code: "UX" },
    { id: "dept-003", label: "Frontend", code: "FE" },
    { id: "dept-004", label: "Backend", code: "BE" },
    { id: "dept-005", label: "QA", code: "QA" },
    { id: "dept-006", label: "DevOps", code: "DO" },
    { id: "dept-007", label: "Project Management", code: "PM" },
    { id: "dept-008", label: "Business Analyst", code: "BA" },
  ],
  "hr.positions": [
    { id: "pos-001", label: "Head of Engineering", department: "Backend", level: "Director" },
    { id: "pos-002", label: "Lead Product Designer", department: "UI/UX", level: "Lead" },
    { id: "pos-003", label: "Senior Frontend Engineer", department: "Frontend", level: "Senior" },
    { id: "pos-004", label: "Senior Backend Engineer", department: "Backend", level: "Senior" },
    { id: "pos-005", label: "QA Lead", department: "QA", level: "Lead" },
    { id: "pos-006", label: "DevOps Engineer", department: "DevOps", level: "Mid" },
    { id: "pos-007", label: "Business Analyst", department: "Business Analyst", level: "Mid" },
    { id: "pos-008", label: "Project Manager", department: "Project Management", level: "Senior" },
  ],
  "hr.leaveTypes": [
    { id: "lt-001", label: "Annual", entitled: 12, paid: true },
    { id: "lt-002", label: "Sick", entitled: 12, paid: true },
    { id: "lt-003", label: "Maternity", entitled: 90, paid: true },
    { id: "lt-004", label: "Bereavement", entitled: 5, paid: true },
    { id: "lt-005", label: "Unpaid", entitled: 0, paid: false },
  ],

  "timesheet.activityTypes": [
    { id: "at-001", label: "Development", billable: true },
    { id: "at-002", label: "Design", billable: true },
    { id: "at-003", label: "Review", billable: true },
    { id: "at-004", label: "Discovery", billable: true },
    { id: "at-005", label: "Meeting (internal)", billable: false },
    { id: "at-006", label: "Training", billable: false },
  ],

  "finance.taxRates": [
    { id: "tx-001", label: "PPN", code: "PPN-11", rate: 11 },
    { id: "tx-002", label: "PPh 21", code: "PPH-21", rate: 5 },
    { id: "tx-003", label: "PPh 23", code: "PPH-23", rate: 2 },
    { id: "tx-004", label: "PPh 4(2)", code: "PPH-42", rate: 2 },
  ],
  "finance.currencies": [
    { id: "cur-001", code: "IDR", label: "Indonesian Rupiah", symbol: "Rp", isDefault: true },
    { id: "cur-002", code: "USD", label: "US Dollar", symbol: "$", isDefault: false },
    { id: "cur-003", code: "SGD", label: "Singapore Dollar", symbol: "S$", isDefault: false },
    { id: "cur-004", code: "EUR", label: "Euro", symbol: "€", isDefault: false },
  ],
  "finance.banks": [
    { id: "bk-001", label: "Bank Central Asia", code: "BCA", swift: "CENAIDJA" },
    { id: "bk-002", label: "Bank Mandiri", code: "BMRI", swift: "BMRIIDJA" },
    { id: "bk-003", label: "Bank Negara Indonesia", code: "BNI", swift: "BNINIDJA" },
    { id: "bk-004", label: "Bank Rakyat Indonesia", code: "BRI", swift: "BRINIDJA" },
    { id: "bk-005", label: "Permata Bank", code: "PRMA", swift: "BBBAIDJA" },
  ],

  "transaction.paymentMethods": [
    { id: "pmt-001", label: "Bank Transfer", type: "Bank" },
    { id: "pmt-002", label: "Cash", type: "Cash" },
    { id: "pmt-003", label: "Cheque", type: "Bank" },
    { id: "pmt-004", label: "Card", type: "Card" },
    { id: "pmt-005", label: "E-Wallet (GoPay)", type: "E-Wallet" },
    { id: "pmt-006", label: "E-Wallet (OVO)", type: "E-Wallet" },
  ],
  "transaction.expenseCategories": [
    { id: "ec-001", label: "Travel", policyMax: 5_000_000 },
    { id: "ec-002", label: "Meals", policyMax: 1_500_000 },
    { id: "ec-003", label: "Software", policyMax: 10_000_000 },
    { id: "ec-004", label: "Equipment", policyMax: 15_000_000 },
    { id: "ec-005", label: "Marketing", policyMax: 8_000_000 },
    { id: "ec-006", label: "Other", policyMax: 2_000_000 },
  ],

  "contracts.types": [
    { id: "ct-001", label: "Fixed-Price", description: "Locked scope and price per phase." },
    { id: "ct-002", label: "Time & Materials", description: "Billed by actual hours per role." },
    { id: "ct-003", label: "Retainer", description: "Recurring monthly engagement." },
  ],
  "contracts.signatureStatuses": [
    { id: "ss-001", label: "unsigned", color: "#A1A1AA" },
    { id: "ss-002", label: "client-signed", color: "#60A5FA" },
    { id: "ss-003", label: "fully-signed", color: "#34D399" },
  ],

  "support.severities": [
    { id: "sv-001", label: "critical", slaHours: 4, color: "#F87171" },
    { id: "sv-002", label: "high", slaHours: 12, color: "#FBBF24" },
    { id: "sv-003", label: "medium", slaHours: 24, color: "#60A5FA" },
    { id: "sv-004", label: "low", slaHours: 72, color: "#A1A1AA" },
  ],
  "support.categories": [
    { id: "scat-001", label: "Production Incident", team: "On-call" },
    { id: "scat-002", label: "Bug", team: "Engineering" },
    { id: "scat-003", label: "Change Request", team: "Delivery" },
    { id: "scat-004", label: "Question", team: "Customer Success" },
  ],

  "knowledge.categories": [
    { id: "kc-001", label: "SOP", color: "#FBCFE8" },
    { id: "kc-002", label: "Templates", color: "#BAE6FD" },
    { id: "kc-003", label: "Tech Stack", color: "#DDD6FE" },
    { id: "kc-004", label: "API Docs", color: "#7DD3FC" },
    { id: "kc-005", label: "Onboarding", color: "#A7F3D0" },
    { id: "kc-006", label: "Delivery Checklist", color: "#FDE68A" },
  ],
  "knowledge.tags": [
    { id: "ktag-001", label: "delivery" },
    { id: "ktag-002", label: "security" },
    { id: "ktag-003", label: "frontend" },
    { id: "ktag-004", label: "backend" },
    { id: "ktag-005", label: "ops" },
    { id: "ktag-006", label: "compliance" },
  ],

  "admin.lookupCategories": [
    { id: "lc-001", label: "Lead Sources", module: "leads" },
    { id: "lc-002", label: "Pipeline Stages", module: "leads" },
    { id: "lc-003", label: "Departments", module: "hr" },
    { id: "lc-004", label: "Tax Rates", module: "finance" },
    { id: "lc-005", label: "Ticket Severities", module: "support" },
  ],
  "admin.numberingSequences": [
    { id: "ns-001", label: "Sales Invoice", prefix: "INV-2026-", next: 52, padding: 4 },
    { id: "ns-002", label: "Payment", prefix: "PAY-2026-", next: 124, padding: 4 },
    { id: "ns-003", label: "Purchase Order", prefix: "PO-2026-", next: 47, padding: 4 },
    { id: "ns-004", label: "Expense Claim", prefix: "EXP-2026-", next: 66, padding: 4 },
    { id: "ns-005", label: "Journal Entry", prefix: "JE-2026-", next: 516, padding: 4 },
    { id: "ns-006", label: "Employee Number", prefix: "WIT-", next: 2017, padding: 4 },
  ],

  "portal.meetingPurposes": [
    { id: "pmp-001", label: "One-on-one with HR", defaultDurationMinutes: 30 },
    { id: "pmp-002", label: "Compensation review", defaultDurationMinutes: 45 },
    { id: "pmp-003", label: "Career path planning", defaultDurationMinutes: 45 },
    { id: "pmp-004", label: "Leave / time-off discussion", defaultDurationMinutes: 30 },
    { id: "pmp-005", label: "Conflict resolution", defaultDurationMinutes: 60 },
    { id: "pmp-006", label: "Exit interview", defaultDurationMinutes: 60 },
  ],
  "portal.onboardingChecklist": [
    { id: "poc-001", label: "Sign offer letter & NDA", weekNumber: 1, category: "Compliance" },
    { id: "poc-002", label: "Pick up laptop & swag", weekNumber: 1, category: "Setup" },
    { id: "poc-003", label: "Set up SSO & Okta", weekNumber: 1, category: "Setup" },
    { id: "poc-004", label: "Meet your buddy", weekNumber: 1, category: "People" },
    { id: "poc-005", label: "Read the engineering handbook", weekNumber: 2, category: "Training" },
    { id: "poc-006", label: "Shadow standups", weekNumber: 2, category: "Training" },
    { id: "poc-007", label: "First merged PR", weekNumber: 3, category: "Product" },
    { id: "poc-008", label: "30-day check-in with manager", weekNumber: 4, category: "People" },
  ],
  "portal.attendancePolicy": [
    { id: "pap-001", label: "Standard start", value: "09:00" },
    { id: "pap-002", label: "Standard end", value: "18:00" },
    { id: "pap-003", label: "Grace minutes", value: "15" },
    { id: "pap-004", label: "Remote allowed", value: "Yes" },
    { id: "pap-005", label: "Min hours / day", value: "8" },
  ],

  "dashboard.kpis": [
    { id: "kpi-001", label: "Monthly Revenue", target: 2_000_000_000, unit: "IDR" },
    { id: "kpi-002", label: "Utilization Rate", target: 85, unit: "%" },
    { id: "kpi-003", label: "Win Rate", target: 60, unit: "%" },
    { id: "kpi-004", label: "Avg SLA Resolution", target: 14, unit: "h" },
    { id: "kpi-005", label: "Outstanding Invoices", target: 5, unit: "count" },
  ],
};
