"use client";

import { create } from "zustand";

export type ReddieRole = "user" | "assistant";

export interface ReddieMessage {
  id: string;
  role: ReddieRole;
  content: string;
  at: string;
  /** Optional CTA chips the assistant can suggest under a reply. */
  suggestions?: string[];
}

interface ReddieState {
  isOpen: boolean;
  isTyping: boolean;
  messages: ReddieMessage[];
  unreadFromBot: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  send: (content: string) => void;
  clear: () => void;
  markRead: () => void;
}

let counter = 0;
const nextId = () => `r-${Date.now()}-${counter++}`;

const GREETING: ReddieMessage = {
  id: "r-greeting",
  role: "assistant",
  at: new Date(2026, 4, 19, 8, 0).toISOString(),
  content:
    "Hi, I'm Reddie. I can answer questions about your sales pipeline, projects, SLAs, finance, or people — and draft updates for you.",
  suggestions: [
    "Summarize this week",
    "Which deals are at risk?",
    "Show overdue invoices",
    "Draft a sprint update",
  ],
};

/** Lightweight keyword router. Picks the best canned reply for a user message.
 *  Real LLM integration would replace this — keeping the shape async so the
 *  swap is local. */
function craftReply(query: string): { content: string; suggestions?: string[] } {
  const q = query.toLowerCase();

  if (/(hi|hello|hey|halo|hai)\b/.test(q)) {
    return {
      content:
        "Hey 👋 — what would you like to dig into? I can pull from Sales, Projects, Support, Finance, or HR.",
      suggestions: ["Pipeline status", "Burning tickets", "Headcount"],
    };
  }

  if (/(help|what can you do|capabilities|commands)/.test(q)) {
    return {
      content:
        "I can:\n• Summarize any module (Sales, Projects, Support, Finance, HR)\n• Flag risks — overdue invoices, breached SLAs, blocked sprints\n• Draft updates — sprint notes, client check-ins, internal memos\n• Explain any number on a dashboard.\n\nTry asking me about a specific deal, client, or sprint.",
    };
  }

  if (/(sales|pipeline|deal|lead|opportunity|quota)/.test(q)) {
    return {
      content:
        "Pipeline snapshot — IDR 4.82B weighted, 23 active deals. Two are slipping: **Cendrawasih Logistics** (no movement 11d) and **Galuh FinTech** (champion changed). Want me to draft re-engagement notes?",
      suggestions: ["Draft re-engagement", "Open Sales module", "Show won this month"],
    };
  }

  if (/(ticket|sla|incident|support|breach|p0|p1)/.test(q)) {
    return {
      content:
        "Support pulse — 7 open, 1 SLA breach (GRD-T-1024, 7h over). Avg resolution this week is 4.2h, down from 6.1h. Want a deeper drill into the breach?",
      suggestions: ["Open ticket GRD-T-1024", "Show all breaches", "Weekly support report"],
    };
  }

  if (/(invoice|payment|finance|cash|overdue|ar|ap|receivable)/.test(q)) {
    return {
      content:
        "Finance — 3 invoices overdue >14 days totaling IDR 412M. Largest: Cendrawasih Logistics (IDR 195M, 27d). Cash runway holds at 7.8 months. Want me to draft a dunning sequence?",
      suggestions: ["Draft dunning", "Open Finance", "Show aged AR"],
    };
  }

  if (/(sprint|project|burn|velocity|epic|story|task|backlog)/.test(q)) {
    return {
      content:
        "Sprint 18 — 22 points still in progress, ends tomorrow. Velocity is tracking 87% of plan. The Lab Order epic is blocked on FHIR mapping from Selasar HealthTech. Want a status note ready to send?",
      suggestions: ["Draft sprint update", "Open Projects", "Show blocked tasks"],
    };
  }

  if (/(people|hr|employee|hire|headcount|leave|payroll|attendance)/.test(q)) {
    return {
      content:
        "People — 64 active, 3 on leave this week, 2 probations ending in 10 days. Payroll for May is locked at IDR 1.21B. Need me to flag the probation reviews?",
      suggestions: ["List probation reviews", "Open HR", "Payroll variance"],
    };
  }

  if (/(report|kpi|target|metric|dashboard)/.test(q)) {
    return {
      content:
        "Top KPIs are green except **Cycle time to close** (12.4d vs 9d target). Reports landed today: Weekly Ops, Pipeline Health, Support Pulse. Open any one?",
      suggestions: ["Open Reports", "KPI deep dive", "Compare to last week"],
    };
  }

  if (/(client|account|customer|cendrawasih|galuh|selasar|sinar)/.test(q)) {
    return {
      content:
        "5 strategic accounts. **Sinar Properti** renews in 12 days — retainer auto-renews unless flagged. **Selasar HealthTech** has 1 blocker, 0 escalations. Want a renewal-prep pack?",
      suggestions: ["Open Clients", "Draft renewal note", "Risk-ranked accounts"],
    };
  }

  if (/(draft|write|send|email|message|update|note)/.test(q)) {
    return {
      content:
        "Sure — what should it cover and who's the audience? I can mirror your usual tone if you point me at a recent note.",
      suggestions: ["Sprint update for stakeholders", "Client check-in", "Exec one-pager"],
    };
  }

  if (/(thank|thanks|cheers|appreciate)/.test(q)) {
    return { content: "Anytime. Ping me if you want this turned into an action item." };
  }

  // Generic fallback — acknowledge + offer entry points.
  return {
    content: `I haven't been trained on that specific question yet, but I can point you to the right module. Try one of these:`,
    suggestions: ["Sales pipeline", "Open tickets", "Finance overview", "People & HR"],
  };
}

export const useReddieStore = create<ReddieState>((set, get) => ({
  isOpen: false,
  isTyping: false,
  messages: [GREETING],
  unreadFromBot: 0,
  open: () => set({ isOpen: true, unreadFromBot: 0 }),
  close: () => set({ isOpen: false }),
  toggle: () =>
    set((s) => ({ isOpen: !s.isOpen, unreadFromBot: s.isOpen ? s.unreadFromBot : 0 })),
  markRead: () => set({ unreadFromBot: 0 }),
  send: (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const userMsg: ReddieMessage = {
      id: nextId(),
      role: "user",
      content: trimmed,
      at: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], isTyping: true }));

    // Simulated thinking latency for the bot.
    const latency = 600 + Math.min(trimmed.length * 18, 1400);
    setTimeout(() => {
      const reply = craftReply(trimmed);
      const botMsg: ReddieMessage = {
        id: nextId(),
        role: "assistant",
        content: reply.content,
        suggestions: reply.suggestions,
        at: new Date().toISOString(),
      };
      const state = get();
      set({
        messages: [...state.messages, botMsg],
        isTyping: false,
        unreadFromBot: state.isOpen ? 0 : state.unreadFromBot + 1,
      });
    }, latency);
  },
  clear: () => set({ messages: [GREETING], isTyping: false }),
}));
