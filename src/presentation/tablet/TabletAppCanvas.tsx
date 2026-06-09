"use client";

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
import { TabletStatusBar } from "./TabletStatusBar";

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

export function TabletAppCanvas({ id }: { id: AppModuleId }) {
  const closeApp = useWindowStore((s) => s.closeApp);
  const appModule = APP_MODULE_MAP[id];
  const accent = useAccent(appModule);
  const Icon = appModule.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
      className="absolute inset-3 z-30 flex flex-col overflow-hidden rounded-[26px] bg-[var(--bg-base)] shadow-[0_30px_90px_-25px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
    >
      <TabletStatusBar />
      <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
        <button
          onClick={() => closeApp(id)}
          aria-label="Back to home"
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-zinc-200 transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Home
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ background: `${accent}33`, color: accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-zinc-50">{appModule.name}</span>
        </div>
        <span className="w-12" />
      </header>
      <div className="glass-scroll flex-1 overflow-y-auto px-4 py-4 sm:px-5">{renderModule(id)}</div>
      <button
        onClick={() => closeApp(id)}
        aria-label="Return home"
        className="mx-auto my-2.5 h-1 w-40 rounded-full bg-white/75 transition-opacity hover:opacity-80 active:opacity-60"
      />
    </motion.div>
  );
}
