"use client";

import { useEffect } from "react";
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

/**
 * Focus-aware glass tuning, scoped entirely to this file (we may not touch
 * globals.css or AppWindow). Each AppWindow's surface uses `.glass-strong`,
 * whose background is driven by the inheritable CSS custom property
 * `--surface-glass-strong-bg` (read via `var()` in globals.css). We wrap every
 * window in a `display: contents` shell — which generates no box and therefore
 * leaves the inner absolutely-positioned <section> completely untouched:
 * size, position, drag/resize, framer-motion's inline opacity/transform
 * animations, AND the per-window inline `z-index` (no extra stacking context is
 * introduced, so cross-window z-ordering still works). Yet the custom property
 * still inherits down into the surface.
 *
 *  - The FOCUSED / top-most window gets a fully OPAQUE surface bg so overlapping
 *    windows behind it can no longer bleed through and hurt readability.
 *  - UNFOCUSED windows get a deeper, lower-contrast surface so they visibly
 *    recede and the active window stands forward. (We intentionally drive this
 *    through the surface color rather than element `opacity`/`transform` on a
 *    wrapper, both of which would create a stacking/containing-block context
 *    and break z-ordering or absolute positioning.)
 *
 * Values are theme-aware via the data attributes below, matching the dark and
 * light tokens from globals.css — just pushed to higher/lower opacity.
 */
const FOCUS_STYLE = `
[data-window-shell] { display: contents; }

/* FOCUSED: opaque body so nothing behind shows through. */
[data-window-shell="focused"] {
  --surface-glass-strong-bg: rgb(12, 10, 20);
}
[data-theme="light"] [data-window-shell="focused"] {
  --surface-glass-strong-bg: rgb(248, 249, 252);
}

/* UNFOCUSED: recede with a deeper, slightly translucent surface. */
[data-window-shell="unfocused"] {
  --surface-glass-strong-bg: rgba(8, 7, 15, 0.74);
}
[data-theme="light"] [data-window-shell="unfocused"] {
  --surface-glass-strong-bg: rgba(232, 234, 242, 0.66);
}
`;

/** True when a keydown originated in an editable field, so app shortcuts must
 *  yield to normal text editing/navigation. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function WindowManager() {
  const windows = useWindowStore((s) => s.windows);
  const order = useWindowStore((s) => s.order);
  // The store tracks the active window id directly (also reflected by the
  // highest zIndex). We use `focused` as the single source of truth so chrome
  // here matches AppWindow's own `isFocused` styling.
  const focused = useWindowStore((s) => s.focused);
  const hydrate = useWindowStore((s) => s.hydrate);

  // Restore the saved window layout once, after mount (client-only).
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Global window-management keyboard shortcuts. We read the latest store state
  // inside the handler (via getState) so the effect can stay mounted for the
  // component's lifetime without re-subscribing on every focus change.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const store = useWindowStore.getState();
      const id = store.focused;
      if (!id) return;

      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (meta && key === "w") {
        e.preventDefault();
        store.closeApp(id);
        return;
      }
      if (meta && key === "m") {
        e.preventDefault();
        store.toggleMinimize(id);
        return;
      }
      // Snap uses Ctrl specifically (not ⌘) to avoid clashing with macOS
      // Mission Control / Spaces left/right gestures bound to ⌘+Arrow.
      if (e.ctrlKey && !e.metaKey && e.key === "ArrowLeft") {
        e.preventDefault();
        store.snapLeft(id);
        return;
      }
      if (e.ctrlKey && !e.metaKey && e.key === "ArrowRight") {
        e.preventDefault();
        store.snapRight(id);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <style>{FOCUS_STYLE}</style>
      <div className="pointer-events-auto absolute inset-0">
        <AnimatePresence>
          {order
            .filter((id) => windows[id] && !windows[id].isMinimized)
            .map((id) => (
              <div
                key={id}
                data-window-shell={focused === id ? "focused" : "unfocused"}
              >
                <AppWindow id={id}>{renderModule(id)}</AppWindow>
              </div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
