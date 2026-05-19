"use client";

import type { ClientPortfolioItem } from "@/application/use-cases/clients/GetClientPortfolio";
import { Avatar } from "@/presentation/shared/Avatar";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { cn } from "@/lib/cn";
import { formatIDRCompact, formatPercent } from "@/lib/currency";

const HEALTH_TONE: Record<string, "success" | "warning" | "danger" | "info"> = {
  excellent: "success",
  stable: "info",
  "at-risk": "warning",
  "churn-risk": "danger",
};

interface Props {
  clients: ClientPortfolioItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ClientDirectory({ clients, selectedId, onSelect }: Props) {
  return (
    <ul className="grid gap-2 lg:grid-cols-2">
      {clients.map((c) => {
        const active = selectedId === c.id;
        return (
          <li
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "glass-soft cursor-pointer rounded-2xl border p-4 transition-all",
              "hover:-translate-y-0.5 hover:border-white/20",
              active ? "border-white/25 bg-white/8" : "border-white/8",
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar name={c.name} color={c.logoColor} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-semibold text-zinc-100">{c.name}</div>
                  <StatusBadge tone={HEALTH_TONE[c.health]} dot>
                    {c.health}
                  </StatusBadge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>{c.industry}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{c.region}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <div className="text-zinc-500">LTV</div>
                    <div className="font-mono text-zinc-200">{formatIDRCompact(c.contractValue)}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">Projects</div>
                    <div className="font-mono text-zinc-200">{c.projectCount}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500">CSAT</div>
                    <div className="font-mono text-zinc-200">{formatPercent(c.satisfactionScore, 0)}</div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
