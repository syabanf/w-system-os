"use client";

import { Calendar, CheckCircle2, FileSignature } from "lucide-react";
import type { EnrichedContract } from "@/application/use-cases/contracts/GetContractSummary";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDRCompact } from "@/lib/currency";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "neutral",
  review: "info",
  active: "success",
  expiring: "warning",
  expired: "danger",
  terminated: "neutral",
};

export function ContractStatusPanel({ contracts }: { contracts: EnrichedContract[] }) {
  return (
    <ul className="grid gap-2 xl:grid-cols-2">
      {contracts.map((c) => (
        <li
          key={c.id}
          className="glass-soft rounded-2xl border border-white/8 p-4 transition-all hover:-translate-y-0.5 hover:border-white/15"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 text-zinc-300">
              <FileSignature className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-semibold text-zinc-100">{c.title}</div>
                <StatusBadge tone={STATUS_TONE[c.status]}>{c.status}</StatusBadge>
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">
                <span className="font-mono">{c.number}</span> · {c.clientName}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
                <span className="font-mono">{formatIDRCompact(c.value)}</span>
                <span className="text-zinc-600">·</span>
                <span>{c.type}</span>
                <span className="text-zinc-600">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {c.daysToExpiry > 0
                    ? `${c.daysToExpiry}d to expiry`
                    : `${Math.abs(c.daysToExpiry)}d past expiry`}
                </span>
                {c.signed ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Signed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-300">Unsigned</span>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
