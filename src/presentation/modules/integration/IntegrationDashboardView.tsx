"use client";

import { useState } from "react";
import { LayoutDashboard, Users, Package } from "lucide-react";
import { cn } from "@/lib/cn";
import { ClientWorkflowTab } from "./ClientWorkflowTab";
import { TeamTimelineTab } from "./TeamTimelineTab";
import { ProductCatalogTab } from "./ProductCatalogTab";

type IntegrationTab = "workflow" | "timeline" | "catalog";

const TABS: { id: IntegrationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "workflow", label: "Client Workflow", icon: LayoutDashboard },
  { id: "timeline", label: "Team Timeline", icon: Users },
  { id: "catalog", label: "Product Catalog", icon: Package },
];

export function IntegrationDashboardView() {
  const [tab, setTab] = useState<IntegrationTab>("workflow");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Integration · Unified View
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Integration Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            One surface for client workflow drills, team updates, and product
            catalog — collapsed from three legacy modules.
          </p>
        </div>
        <TabSwitch tab={tab} onChange={setTab} />
      </header>

      {tab === "workflow" ? (
        <ClientWorkflowTab />
      ) : tab === "timeline" ? (
        <TeamTimelineTab />
      ) : (
        <ProductCatalogTab />
      )}
    </div>
  );
}

interface TabSwitchProps {
  tab: IntegrationTab;
  onChange: (t: IntegrationTab) => void;
}

function TabSwitch({ tab, onChange }: TabSwitchProps) {
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {TABS.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors",
              tab === o.id
                ? "bg-white/12 text-zinc-50"
                : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            <Icon className="h-3 w-3" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
