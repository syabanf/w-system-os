"use client";

import { APP_MODULES, type AppModule, type AppModuleId } from "@/constants/appModules";
import { useWindowStore } from "@/state/window.store";
import { useCommandIntentStore } from "@/state/commandIntent.store";
import { useInvoicesStore } from "@/state/invoices.store";
import { useProjectsStore } from "@/state/projects.store";
import { useLeadsStore } from "@/state/leads.store";
import { useTicketsStore } from "@/state/tickets.store";
import { useKpisStore, type KPI } from "@/state/kpis.store";
import { useClientsStore } from "@/state/clients.store";
import { useNotificationStore } from "@/state/notification.store";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { formatIDRCompact } from "@/lib/currency";
import { formatDemoToday } from "@/lib/date";

/** A reply Reddie shows after (optionally) performing an action. */
export interface ReddieReply {
  content: string;
  suggestions?: string[];
}

const MODULE_BY_ID = new Map<AppModuleId, AppModule>(
  APP_MODULES.map((m) => [m.id, m]),
);
const moduleName = (id: AppModuleId) => MODULE_BY_ID.get(id)?.name ?? id;
const openApp = (id: AppModuleId) => useWindowStore.getState().openApp(id);
const requestCreate = (id: AppModuleId, prefill?: string) =>
  useCommandIntentStore.getState().requestCreate(id, prefill);

/** Module synonyms → AppModuleId, most-specific first. */
const NAV_WORDS: { id: AppModuleId; words: RegExp }[] = [
  { id: "integration", words: /\b(integration|unified)\b/ },
  { id: "transaction", words: /\b(transaction|invoice|invoices|payment|payments|purchase order|expense|expenses|billing)\b/ },
  { id: "finance", words: /\b(finance|accounting|ledger|gl|cashflow|cash flow|general ledger)\b/ },
  { id: "leads", words: /\b(sales|pipeline|leads?|crm|deals?|opportunit)\b/ },
  { id: "clients", words: /\b(clients?|accounts?|customers?)\b/ },
  { id: "projects", words: /\b(projects?|sprints?|backlog|epics?|stor(y|ies)|kanban)\b/ },
  { id: "support", words: /\b(support|tickets?|helpdesk|change request)\b/ },
  { id: "hr", words: /\b(people|hr|employees?|headcount|team members?)\b/ },
  { id: "timesheet", words: /\b(timesheets?|time tracking|productivity)\b/ },
  { id: "knowledge", words: /\b(knowledge|wiki|docs?|sop|runbook|articles?)\b/ },
  { id: "admin", words: /\b(admin|iam|identity|access|roles?|users?|permissions?)\b/ },
  { id: "portal", words: /\b(portal|self-service|self service)\b/ },
  { id: "reports", words: /\b(reports?)\b/ },
  { id: "kpis", words: /\b(kpis?|targets?|metrics?|scoreboard)\b/ },
  { id: "performance", words: /\b(performance|360|reviews?|appraisal)\b/ },
  { id: "dashboard", words: /\b(dashboard|home|executive|overview)\b/ },
];

function matchModule(q: string): AppModuleId | null {
  for (const { id, words } of NAV_WORDS) if (words.test(q)) return id;
  return null;
}

/** Entities the user can "create"; each opens its module's create form. */
const CREATE_MAP: { test: RegExp; module: AppModuleId; label: string }[] = [
  { test: /\b(client|account|customer)\b/, module: "clients", label: "client" },
  { test: /\b(lead|deal|opportunit)\b/, module: "leads", label: "lead" },
  { test: /\b(invoice)\b/, module: "transaction", label: "invoice" },
  { test: /\b(ticket|incident|change request)\b/, module: "support", label: "ticket" },
  { test: /\b(project)\b/, module: "projects", label: "project" },
  { test: /\b(kpi|metric|target)\b/, module: "kpis", label: "KPI" },
];

/** Pull a trailing name out of "new client Acme" / "add client called Acme Corp". */
function extractName(original: string): string | undefined {
  const m = original.match(
    /\b(?:new|add|create)\s+(?:a\s+)?[a-z ]*?(?:client|account|customer|lead|project|ticket|kpi|invoice)\s+(?:called\s+|named\s+|for\s+|titled\s+)?(.+)$/i,
  );
  const name = m?.[1]?.trim().replace(/^["']|["']$/g, "");
  return name && name.length > 0 ? name : undefined;
}

function statusOfKpi(k: KPI): "on" | "at" | "off" {
  const ratio = k.target !== 0 ? k.current / k.target : 1;
  if (k.direction === "higher") return ratio >= 1 ? "on" : ratio >= 0.9 ? "at" : "off";
  return ratio <= 1 ? "on" : ratio <= 1.1 ? "at" : "off";
}

const NAV_CTA = ["Show overdue invoices", "Which projects are at risk?", "Draft a sprint update"];

// ── draft composers (grounded in live store data) ────────────────────────────
function draftSprintUpdate(): string {
  const projects = useProjectsStore.getState().items;
  const red = projects.filter((p) => p.health === "red");
  const avg = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
    : 0;
  const tickets = useTicketsStore.getState().items.filter(
    (t) => t.status !== "Resolved" && t.status !== "Closed",
  );
  return [
    `Subject: Delivery update — ${formatDemoToday()}`,
    ``,
    `Team,`,
    `Here's where delivery stands across ${projects.length} active engagements (avg ${avg}% complete).`,
    red.length
      ? `• At risk (${red.length}): ${red.slice(0, 4).map((p) => p.name).join(", ")} — recovery plans in flight.`
      : `• No projects currently flagged red.`,
    `• Support load: ${tickets.length} open ticket${tickets.length === 1 ? "" : "s"} being worked this week.`,
    `Shout if you need a deeper drill on any item.`,
  ].join("\n");
}

function draftClientCheckIn(named?: string): string {
  const clients = useClientsStore.getState().items;
  const c =
    (named && clients.find((x) => x.name.toLowerCase().includes(named.toLowerCase()))) ||
    clients.find((x) => x.health === "at-risk" || x.health === "churn-risk") ||
    clients[0];
  if (!c) return "I couldn't find a client to draft a check-in for.";
  return [
    `Subject: Checking in — ${c.name}`,
    ``,
    `Hi ${c.primaryContact},`,
    `Wanted to touch base on how things are going with ${c.name}. From our side the account is **${c.health}**${c.retainerActive ? ", retainer active" : ""}, with renewal coming up ${c.renewalDate}.`,
    `Happy to walk through current progress and anything on your wishlist for next quarter — does a short call this week work?`,
    ``,
    `Best,\nDamar`,
  ].join("\n");
}

function draftExecSummary(): string {
  const inv = useInvoicesStore.getState().items;
  const overdue = inv.filter((i) => i.status === "overdue").length;
  const red = useProjectsStore.getState().items.filter((p) => p.health === "red").length;
  const leads = useLeadsStore.getState().items.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
  const pipeline = leads.reduce((s, l) => s + l.dealValue, 0);
  const open = useTicketsStore.getState().items.filter((t) => t.status !== "Resolved" && t.status !== "Closed").length;
  return [
    `Subject: Weekly exec summary — ${formatDemoToday()}`,
    ``,
    `• Pipeline: ${formatIDRCompact(pipeline)} across ${leads.length} active deals.`,
    `• Delivery: ${red} project${red === 1 ? "" : "s"} flagged red; the rest on track.`,
    `• Finance: ${overdue} overdue invoice${overdue === 1 ? "" : "s"} in collections.`,
    `• Support: ${open} open ticket${open === 1 ? "" : "s"}.`,
    `Detail on any line available on request.`,
  ].join("\n");
}

/**
 * Parse a free-text message into a workspace command and (optionally) execute
 * it. Returns a grounded reply, or null if it isn't a command.
 */
export function runReddieCommand(raw: string): ReddieReply | null {
  const original = raw.trim();
  const q = original.toLowerCase();

  // ── HELP / capabilities ─────────────────────────────────────────────────────
  if (/\b(help|what can you do|capabilities|commands|how do you work)\b/.test(q)) {
    return {
      content:
        "I can act on your workspace, not just chat:\n• **Open** any module — “open clients”, “go to reports”\n• **Answer from live data** — “show overdue invoices”, “who's over-allocated?”, “pipeline value”\n• **Create** records — “new client Acme”, “new ticket”\n• **Draft** updates — “draft a sprint update”, “draft a client check-in”",
      suggestions: ["Summarize this week", "Show overdue invoices", "New client", "Draft a sprint update"],
    };
  }

  // ── DRAFTS ──────────────────────────────────────────────────────────────────
  if (/\b(draft|write|compose|prepare)\b/.test(q) || (/\bupdate|note|memo|email|summary\b/.test(q) && /\bdraft\b/.test(q))) {
    if (/\b(client|account|customer|check[- ]?in|renewal)\b/.test(q)) {
      const named = extractName(original);
      return { content: draftClientCheckIn(named), suggestions: ["Open Clients", "Draft an exec summary"] };
    }
    if (/\b(exec|executive|leadership|board|weekly|status)\b/.test(q)) {
      return { content: draftExecSummary(), suggestions: ["Draft a sprint update", "Summarize this week"] };
    }
    if (/\b(sprint|delivery|project|stakeholder|standup)\b/.test(q)) {
      return { content: draftSprintUpdate(), suggestions: ["Draft an exec summary", "Open Projects"] };
    }
    // Generic draft → offer the menu.
    return {
      content: "Happy to draft that. Which one should I start with?",
      suggestions: ["Draft a sprint update", "Draft a client check-in", "Draft an exec summary"],
    };
  }

  // ── CREATE ──────────────────────────────────────────────────────────────────
  if (/\b(new|add|create)\b/.test(q)) {
    const hit = CREATE_MAP.find((c) => c.test.test(q));
    if (hit) {
      const name = extractName(original);
      openApp(hit.module);
      requestCreate(hit.module, name);
      return {
        content:
          `Opening the new-${hit.label} form` +
          (name ? `, prefilled with “${name}”` : "") +
          `. Fill in the rest and save.`,
        suggestions: [`Open ${moduleName(hit.module)}`],
      };
    }
  }

  // ── LIVE DATA ANSWERS ───────────────────────────────────────────────────────
  if (/\b(overdue|outstanding|receivable|unpaid|aging|aged)\b/.test(q) || (/\binvoices?\b/.test(q) && /\b(owe|owed|chase|due)\b/.test(q))) {
    const inv = useInvoicesStore.getState().items;
    const clients = useClientsStore.getState().items;
    const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";
    const open = inv.filter((i) => i.status === "sent" || i.status === "overdue");
    const overdue = inv.filter((i) => i.status === "overdue");
    const outstanding = open.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
    const largest = [...open].sort((a, b) => b.amount - b.paidAmount - (a.amount - a.paidAmount))[0];
    openApp("transaction");
    return {
      content:
        `${overdue.length} overdue invoice${overdue.length === 1 ? "" : "s"}; ${formatIDRCompact(outstanding)} outstanding across ${open.length} open.` +
        (largest ? `\nLargest: ${name(largest.clientId)} — ${formatIDRCompact(largest.amount - largest.paidAmount)} (${largest.number}).` : ""),
      suggestions: ["Draft a dunning email", "Who's over-allocated?", "Pipeline value"],
    };
  }

  if ((/\b(at[- ]risk|red|blocked|slipping|health)\b/.test(q) && /\b(projects?|delivery|engagements?)\b/.test(q)) || /\bprojects?\b.*\b(risk|red|health|status)\b/.test(q)) {
    const projects = useProjectsStore.getState().items;
    const red = projects.filter((p) => p.health === "red");
    const amber = projects.filter((p) => p.health === "amber");
    openApp("projects");
    return {
      content:
        `${red.length} project${red.length === 1 ? "" : "s"} flagged red, ${amber.length} amber, out of ${projects.length}.` +
        (red.length ? `\nRed: ${red.slice(0, 3).map((p) => p.name).join(", ")}${red.length > 3 ? "…" : ""}.` : " All others on track."),
      suggestions: ["Draft a sprint update", "Show overdue invoices", "Which deals are at risk?"],
    };
  }

  if (/\b(over[- ]?allocat|utilization|capacity|overloaded|workload|bandwidth)\b/.test(q)) {
    const over = mockTeam.filter((m) => m.allocationPercent > 100).sort((a, b) => b.allocationPercent - a.allocationPercent);
    const avg = Math.round(mockTeam.reduce((s, m) => s + m.allocationPercent, 0) / Math.max(1, mockTeam.length));
    openApp("hr");
    return {
      content:
        `${over.length} of ${mockTeam.length} people are over-allocated (avg ${avg}%).` +
        (over.length ? `\nTop: ${over.slice(0, 3).map((m) => `${m.name} (${m.allocationPercent}%)`).join(", ")}.` : ""),
      suggestions: ["Open People", "Show at-risk projects"],
    };
  }

  if (/\b(pipeline|weighted|deal value|forecast|win rate)\b/.test(q) || (/\bdeals?\b/.test(q) && /\b(risk|value|worth|how much)\b/.test(q))) {
    const leads = useLeadsStore.getState().items;
    const active = leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
    const total = active.reduce((s, l) => s + l.dealValue, 0);
    const weighted = active.reduce((s, l) => s + l.dealValue * (l.probability / 100), 0);
    openApp("leads");
    return {
      content: `${formatIDRCompact(total)} pipeline across ${active.length} active deals — ${formatIDRCompact(weighted)} weighted.`,
      suggestions: ["Open Sales", "New lead"],
    };
  }

  if (/\b(tickets?|sla|breach|incident|p0|p1)\b/.test(q)) {
    const tickets = useTicketsStore.getState().items;
    const open = tickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed");
    const critical = open.filter((t) => t.severity === "critical");
    openApp("support");
    return {
      content:
        `${open.length} open ticket${open.length === 1 ? "" : "s"}` + (critical.length ? `, ${critical.length} critical` : "") + `.` +
        (critical[0] ? `\nTop: ${critical[0].code} — ${critical[0].title}.` : ""),
      suggestions: ["Open Support", "New ticket"],
    };
  }

  if (/\b(kpis?|targets?|metrics?|off[- ]track|on track|scoreboard)\b/.test(q)) {
    const kpis = useKpisStore.getState().items;
    const off = kpis.filter((k) => statusOfKpi(k) === "off");
    const at = kpis.filter((k) => statusOfKpi(k) === "at");
    openApp("kpis");
    return {
      content:
        `${kpis.length} KPIs tracked — ${off.length} off-track, ${at.length} at-risk.` +
        (off.length ? `\nOff-track: ${off.slice(0, 3).map((k) => k.name).join(", ")}.` : " All on target."),
      suggestions: ["Open KPIs", "New KPI"],
    };
  }

  // Renewals coming up
  if (/\b(renew|expir|contract end)/.test(q)) {
    const clients = useClientsStore.getState().items;
    const upcoming = [...clients]
      .filter((c) => c.renewalDate)
      .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate))
      .slice(0, 4);
    openApp("clients");
    return {
      content:
        `Next renewals:\n` +
        upcoming.map((c) => `• ${c.name} — ${c.renewalDate}${c.retainerActive ? " (auto-renews)" : ""}`).join("\n"),
      suggestions: ["Draft a client check-in", "Open Clients"],
    };
  }

  // Top clients by contract value
  if (/\b(top|biggest|largest|key)\b.*\b(clients?|accounts?)\b/.test(q)) {
    const top = [...useClientsStore.getState().items]
      .sort((a, b) => b.contractValue - a.contractValue)
      .slice(0, 4);
    openApp("clients");
    return {
      content:
        `Top accounts by contract value:\n` +
        top.map((c, i) => `${i + 1}. ${c.name} — ${formatIDRCompact(c.contractValue)}`).join("\n"),
      suggestions: ["Renewals coming up", "Draft a client check-in"],
    };
  }

  // Headcount
  if (/\b(headcount|how many people|team size|how many employees|staff)\b/.test(q)) {
    const roles = new Set(mockTeam.map((m) => m.role));
    openApp("hr");
    return {
      content: `${mockTeam.length} people across ${roles.size} roles. ${mockTeam.filter((m) => m.allocationPercent > 100).length} are over-allocated.`,
      suggestions: ["Open People", "Who's over-allocated?"],
    };
  }

  // Summary
  if (/\b(summar|this week|status|overview|brief|pulse|how are we)\b/.test(q)) {
    const inv = useInvoicesStore.getState().items;
    const overdue = inv.filter((i) => i.status === "overdue").length;
    const red = useProjectsStore.getState().items.filter((p) => p.health === "red").length;
    const leads = useLeadsStore.getState().items.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
    const pipeline = leads.reduce((s, l) => s + l.dealValue, 0);
    const openTickets = useTicketsStore.getState().items.filter((t) => t.status !== "Resolved" && t.status !== "Closed").length;
    return {
      content:
        `This week at a glance:\n• Pipeline ${formatIDRCompact(pipeline)} (${leads.length} active deals)\n• ${red} project${red === 1 ? "" : "s"} flagged red\n• ${overdue} overdue invoice${overdue === 1 ? "" : "s"}\n• ${openTickets} open ticket${openTickets === 1 ? "" : "s"}`,
      suggestions: ["Draft an exec summary", "Show overdue invoices", "Which projects are at risk?"],
    };
  }

  // ── NAVIGATION ──────────────────────────────────────────────────────────────
  if (/\b(open|go to|show me|take me to|launch|jump to|navigate|switch to)\b/.test(q)) {
    const id = matchModule(q);
    if (id) {
      openApp(id);
      return { content: `Opening ${moduleName(id)}.`, suggestions: NAV_CTA };
    }
  }
  if (q.split(/\s+/).length <= 3) {
    const id = matchModule(q);
    if (id) {
      openApp(id);
      return { content: `Opening ${moduleName(id)}.`, suggestions: NAV_CTA };
    }
  }

  return null;
}
