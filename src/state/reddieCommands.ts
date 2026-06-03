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

/** Module synonyms → AppModuleId, longest/most-specific words first. */
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

/** Entities the user can ask to "create"; only clients opens its form prefilled. */
const CREATE_MAP: { test: RegExp; module: AppModuleId; label: string }[] = [
  { test: /\b(client|account|customer)\b/, module: "clients", label: "client" },
  { test: /\b(lead|deal|opportunit)\b/, module: "leads", label: "lead" },
  { test: /\b(invoice)\b/, module: "transaction", label: "invoice" },
  { test: /\b(ticket|incident|change request)\b/, module: "support", label: "ticket" },
  { test: /\b(project)\b/, module: "projects", label: "project" },
  { test: /\b(kpi|metric|target)\b/, module: "kpis", label: "KPI" },
];

/** Pull a name out of "new client Acme" / "add client called Acme Corp". */
function extractName(q: string, original: string): string | undefined {
  const m = original.match(
    /\b(?:new|add|create)\s+(?:a\s+)?[a-z ]*?(?:client|account|customer)\s+(?:called\s+|named\s+|for\s+)?(.+)$/i,
  );
  const name = m?.[1]?.trim().replace(/^["']|["']$/g, "");
  return name && name.length > 0 ? name : undefined;
}

function statusOfKpi(k: KPI): "on" | "at" | "off" {
  const ratio = k.target !== 0 ? k.current / k.target : 1;
  if (k.direction === "higher") return ratio >= 1 ? "on" : ratio >= 0.9 ? "at" : "off";
  return ratio <= 1 ? "on" : ratio <= 1.1 ? "at" : "off";
}

const NAV_CTA = ["Show overdue invoices", "Which projects are at risk?", "New client"];

/**
 * Parse a free-text message into a workspace command and (optionally) execute
 * it. Returns a grounded reply, or null if it isn't a command (caller falls
 * back to the canned conversational reply).
 */
export function runReddieCommand(raw: string): ReddieReply | null {
  const original = raw.trim();
  const q = original.toLowerCase();

  // ── CREATE ────────────────────────────────────────────────────────────────
  if (/\b(new|add|create|draft a)\b/.test(q)) {
    const hit = CREATE_MAP.find((c) => c.test.test(q));
    if (hit) {
      openApp(hit.module);
      if (hit.module === "clients") {
        const name = extractName(q, original);
        useCommandIntentStore.getState().requestCreate("clients", name);
        return {
          content: name
            ? `Opening a new client form, prefilled with “${name}”. Fill in the rest and save.`
            : "Opening the new-client form for you.",
          suggestions: ["Open Clients", "Risk-ranked accounts"],
        };
      }
      return {
        content: `Opening ${moduleName(hit.module)} — use the “New ${hit.label}” button to add one.`,
        suggestions: [`Open ${moduleName(hit.module)}`],
      };
    }
  }

  // ── LIVE DATA ANSWERS ───────────────────────────────────────────────────────
  // Overdue / outstanding receivables
  if (/\b(overdue|outstanding|receivable|unpaid|ar\b|aging|aged)\b/.test(q) || /\binvoices?\b/.test(q) && /\b(overdue|owe|owed|chase)\b/.test(q)) {
    const inv = useInvoicesStore.getState().items;
    const clients = useClientsStore.getState().items;
    const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";
    const open = inv.filter((i) => i.status === "sent" || i.status === "overdue");
    const overdue = inv.filter((i) => i.status === "overdue");
    const outstanding = open.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
    const largest = [...open].sort(
      (a, b) => b.amount - b.paidAmount - (a.amount - a.paidAmount),
    )[0];
    openApp("transaction");
    return {
      content:
        `${overdue.length} overdue invoice${overdue.length === 1 ? "" : "s"}; ` +
        `${formatIDRCompact(outstanding)} outstanding across ${open.length} open.` +
        (largest ? `\nLargest: ${name(largest.clientId)} — ${formatIDRCompact(largest.amount - largest.paidAmount)} (${largest.number}).` : ""),
      suggestions: ["Open Finance", "Who's over-allocated?", "Pipeline value"],
    };
  }

  // At-risk / red / blocked projects
  if (/\b(at[- ]risk|at risk|red|blocked|slipping|health)\b/.test(q) && /\b(projects?|delivery|engagements?)\b/.test(q) || /\bprojects?\b.*\b(risk|red|health|status)\b/.test(q)) {
    const projects = useProjectsStore.getState().items;
    const red = projects.filter((p) => p.health === "red");
    const amber = projects.filter((p) => p.health === "amber");
    openApp("projects");
    return {
      content:
        `${red.length} project${red.length === 1 ? "" : "s"} flagged red, ${amber.length} amber, out of ${projects.length}.` +
        (red.length ? `\nRed: ${red.slice(0, 3).map((p) => p.name).join(", ")}${red.length > 3 ? "…" : ""}.` : " All others on track."),
      suggestions: ["Open Projects", "Show overdue invoices", "Which deals are at risk?"],
    };
  }

  // Over-allocated / utilization (people)
  if (/\b(over[- ]?allocat|utilization|capacity|overloaded|workload|bandwidth)\b/.test(q)) {
    const over = mockTeam
      .filter((m) => m.allocationPercent > 100)
      .sort((a, b) => b.allocationPercent - a.allocationPercent);
    const avg = Math.round(
      mockTeam.reduce((s, m) => s + m.allocationPercent, 0) / Math.max(1, mockTeam.length),
    );
    openApp("hr");
    return {
      content:
        `${over.length} of ${mockTeam.length} people are over-allocated (avg ${avg}%).` +
        (over.length ? `\nTop: ${over.slice(0, 3).map((m) => `${m.name} (${m.allocationPercent}%)`).join(", ")}.` : ""),
      suggestions: ["Open People", "Show at-risk projects"],
    };
  }

  // Sales pipeline value
  if (/\b(pipeline|weighted|deal value|forecast|win rate)\b/.test(q) || (/\bdeals?\b/.test(q) && /\b(risk|value|worth|how much)\b/.test(q))) {
    const leads = useLeadsStore.getState().items;
    const active = leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
    const total = active.reduce((s, l) => s + l.dealValue, 0);
    const weighted = active.reduce((s, l) => s + l.dealValue * (l.probability / 100), 0);
    openApp("leads");
    return {
      content:
        `${formatIDRCompact(total)} pipeline across ${active.length} active deals — ` +
        `${formatIDRCompact(weighted)} weighted.`,
      suggestions: ["Open Sales", "Show overdue invoices"],
    };
  }

  // Tickets / SLA
  if (/\b(tickets?|sla|breach|incident|p0|p1|support)\b/.test(q)) {
    const tickets = useTicketsStore.getState().items;
    const open = tickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed");
    const critical = open.filter((t) => t.severity === "critical");
    openApp("support");
    return {
      content:
        `${open.length} open ticket${open.length === 1 ? "" : "s"}` +
        (critical.length ? `, ${critical.length} critical` : "") + `.` +
        (critical[0] ? `\nTop: ${critical[0].code} — ${critical[0].title}.` : ""),
      suggestions: ["Open Support", "Show at-risk projects"],
    };
  }

  // KPIs off-track
  if (/\b(kpis?|targets?|metrics?|off[- ]track|on track|scoreboard)\b/.test(q)) {
    const kpis = useKpisStore.getState().items;
    const off = kpis.filter((k) => statusOfKpi(k) === "off");
    const at = kpis.filter((k) => statusOfKpi(k) === "at");
    openApp("kpis");
    return {
      content:
        `${kpis.length} KPIs tracked — ${off.length} off-track, ${at.length} at-risk.` +
        (off.length ? `\nOff-track: ${off.slice(0, 3).map((k) => k.name).join(", ")}.` : " All on target."),
      suggestions: ["Open KPIs", "Summarize this week"],
    };
  }

  // Notifications / signals / inbox
  if (/\b(signals?|notifications?|alerts?|inbox|what needs|attention)\b/.test(q)) {
    const unread = useNotificationStore.getState().unread;
    return {
      content: `You have ${unread} unread signal${unread === 1 ? "" : "s"} in your inbox — open the bell in the top bar to triage.`,
      suggestions: ["Show overdue invoices", "Which projects are at risk?"],
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
      suggestions: ["Show overdue invoices", "Which projects are at risk?", "Pipeline value"],
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
  // Bare module name (e.g. just "clients") also navigates.
  if (q.split(/\s+/).length <= 3) {
    const id = matchModule(q);
    if (id) {
      openApp(id);
      return { content: `Opening ${moduleName(id)}.`, suggestions: NAV_CTA };
    }
  }

  return null;
}
