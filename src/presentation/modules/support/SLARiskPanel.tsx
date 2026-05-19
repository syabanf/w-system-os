"use client";

import { AlertOctagon, ShieldAlert } from "lucide-react";
import type { EnrichedTicket } from "@/application/use-cases/support/GetTicketSLAOverview";

export function SLARiskPanel({ tickets }: { tickets: EnrichedTicket[] }) {
  const critical = tickets.filter((t) => t.isBreached);
  const atRisk = tickets.filter((t) => t.isAtRisk && !t.isBreached);

  return (
    <div className="space-y-3">
      {critical.length > 0 ? (
        <section>
          <header className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-rose-300">
            <AlertOctagon className="h-3 w-3" />
            SLA breached · {critical.length}
          </header>
          <ul className="space-y-1.5">
            {critical.map((t) => (
              <li key={t.id} className="glass-soft rounded-xl border border-rose-500/20 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-zinc-100">{t.title}</div>
                    <div className="text-[10px] text-zinc-400">
                      {t.code} · {t.clientName}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-rose-300">
                    {Math.abs(Math.round(t.hoursUntilSLA))}h over
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {atRisk.length > 0 ? (
        <section>
          <header className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-amber-300">
            <ShieldAlert className="h-3 w-3" />
            At risk · {atRisk.length}
          </header>
          <ul className="space-y-1.5">
            {atRisk.map((t) => (
              <li key={t.id} className="glass-soft rounded-xl border border-amber-500/20 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-zinc-100">{t.title}</div>
                    <div className="text-[10px] text-zinc-400">
                      {t.code} · {t.clientName}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-amber-300">
                    {Math.round(t.hoursUntilSLA * 10) / 10}h left
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {critical.length === 0 && atRisk.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/8 p-4 text-center text-xs text-zinc-400">
          All open tickets are within SLA.
        </div>
      ) : null}
    </div>
  );
}
