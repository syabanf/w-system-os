"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { type AppModuleId, APP_MODULE_MAP } from "@/constants/appModules";
import { useWindowStore } from "@/state/window.store";
import { useAccent } from "@/hooks/useAccent";
import { ExecutiveDashboardView } from "@/presentation/modules/dashboard/ExecutiveDashboardView";
import { LeadsView } from "@/presentation/modules/leads/LeadsView";
import { ClientManagementView } from "@/presentation/modules/clients/ClientManagementView";
import { ProjectManagementView } from "@/presentation/modules/projects/ProjectManagementView";
import { HRView } from "@/presentation/modules/hr/HRView";
import { TimesheetView } from "@/presentation/modules/timesheet/TimesheetView";
import { FinanceBillingView } from "@/presentation/modules/finance/FinanceBillingView";
import { TransactionView } from "@/presentation/modules/transaction/TransactionView";
import { SupportTicketView } from "@/presentation/modules/support/SupportTicketView";
import { KnowledgeBaseView } from "@/presentation/modules/knowledge/KnowledgeBaseView";
import { AdminAccessView } from "@/presentation/modules/admin/AdminAccessView";
import { UserPortalView } from "@/presentation/modules/portal/UserPortalView";
import { ReportsView } from "@/presentation/modules/reports/ReportsView";
import { KPIsView } from "@/presentation/modules/kpis/KPIsView";
import { Performance360View } from "@/presentation/modules/performance/Performance360View";
import { MobileStatusBar } from "./MobileStatusBar";
import { MobileLauncher } from "./MobileLauncher";
import { MobileAppDrawer } from "./MobileAppDrawer";

function renderModule(id: AppModuleId) {
  switch (id) {
    case "dashboard": return <ExecutiveDashboardView />;
    case "leads": return <LeadsView />;
    case "clients": return <ClientManagementView />;
    case "projects": return <ProjectManagementView />;
    case "hr": return <HRView />;
    case "timesheet": return <TimesheetView />;
    case "finance": return <FinanceBillingView />;
    case "transaction": return <TransactionView />;
    case "support": return <SupportTicketView />;
    case "knowledge": return <KnowledgeBaseView />;
    case "admin": return <AdminAccessView />;
    case "portal": return <UserPortalView />;
    case "reports": return <ReportsView />;
    case "kpis": return <KPIsView />;
    case "performance": return <Performance360View />;
    default: return null;
  }
}

export function MobileAppCanvas({ id }: { id: AppModuleId }) {
  const closeApp = useWindowStore((s) => s.closeApp);
  const module = APP_MODULE_MAP[id];
  const accent = useAccent(module);
  const Icon = module.icon;

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
      className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-[var(--bg-base)]"
    >
      <MobileStatusBar />
      <header className="glass-strong flex items-center gap-2 border-b border-white/8 px-3 py-2">
        <button
          onClick={() => closeApp(id)}
          aria-label="Back to home"
          className="flex items-center gap-0.5 rounded-full px-2 py-1 text-xs text-zinc-200 transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Home
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <span
            className="grid h-6 w-6 place-items-center rounded-md"
            style={{ background: `${accent}33`, color: accent }}
          >
            <Icon className="h-3 w-3" />
          </span>
          <span className="truncate text-xs font-semibold text-zinc-50">{module.shortName}</span>
        </div>
        <span className="w-12" />
      </header>

      <div className="glass-scroll flex-1 overflow-y-auto px-3 py-3">
        {renderModule(id)}
      </div>

      <MobileLauncher activeId={id} onOpenDrawer={() => setDrawerOpen(true)} />

      <button
        onClick={() => closeApp(id)}
        aria-label="Return home"
        className="mx-auto mb-2 mt-0.5 h-1 w-32 rounded-full bg-white/75 transition-opacity hover:opacity-80 active:opacity-60"
      />

      <MobileAppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeId={id}
      />
    </motion.div>
  );
}
