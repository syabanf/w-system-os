"use client";

import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/state/window.store";
import { AppWindow } from "@/presentation/windows/AppWindow";
import type { AppModuleId } from "@/constants/appModules";

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
import { IntegrationDashboardView } from "@/presentation/modules/integration/IntegrationDashboardView";

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
    case "integration": return <IntegrationDashboardView />;
    default: return null;
  }
}

export function WindowManager() {
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto absolute inset-0">
        <AnimatePresence>
          {order
            .filter((id) => windows[id] && !windows[id].isMinimized)
            .map((id) => (
              <AppWindow key={id} id={id}>
                {renderModule(id)}
              </AppWindow>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
