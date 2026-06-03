"use client";

import { useEffect, type ComponentType } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useWindowStore } from "@/state/window.store";
import { AppWindow } from "@/presentation/windows/AppWindow";
import type { AppModuleId } from "@/constants/appModules";

/**
 * Small centered spinner shown while a lazily-loaded module view's chunk is
 * still being fetched. Kept dependency-free so it lives inside the already-
 * loaded shell bundle (no extra import to defeat the point of code-splitting).
 */
function ModuleLoading() {
  return (
    <div className="grid h-full w-full place-items-center p-8">
      <span
        aria-label="Loading module"
        role="status"
        className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/80"
      />
    </div>
  );
}

/**
 * Raw import thunks, one per module id. These are the single source of truth
 * for "how to load module X". We use them in two places:
 *   1. `dynamic(thunk, …)` below, to build the lazily-rendered component.
 *   2. `preloadModule(id)`, to warm a chunk on hover/focus before click.
 *
 * The `import()` expressions are written out explicitly (not via a variable
 * path) and live at module top level, which is what the bundler needs to map
 * each chunk to its dynamic() call and to make preloading effective.
 */
const MODULE_LOADERS: Record<AppModuleId, () => Promise<unknown>> = {
  dashboard: () => import("@/presentation/modules/dashboard/ExecutiveDashboardView"),
  leads: () => import("@/presentation/modules/leads/LeadsView"),
  clients: () => import("@/presentation/modules/clients/ClientManagementView"),
  projects: () => import("@/presentation/modules/projects/ProjectManagementView"),
  hr: () => import("@/presentation/modules/hr/HRView"),
  timesheet: () => import("@/presentation/modules/timesheet/TimesheetView"),
  finance: () => import("@/presentation/modules/finance/FinanceBillingView"),
  transaction: () => import("@/presentation/modules/transaction/TransactionView"),
  support: () => import("@/presentation/modules/support/SupportTicketView"),
  knowledge: () => import("@/presentation/modules/knowledge/KnowledgeBaseView"),
  admin: () => import("@/presentation/modules/admin/AdminAccessView"),
  portal: () => import("@/presentation/modules/portal/UserPortalView"),
  reports: () => import("@/presentation/modules/reports/ReportsView"),
  kpis: () => import("@/presentation/modules/kpis/KPIsView"),
  performance: () => import("@/presentation/modules/performance/Performance360View"),
  integration: () => import("@/presentation/modules/integration/IntegrationDashboardView"),
};

/**
 * Lazily-rendered module components. Each view is fetched only the first time
 * its window is rendered. `ssr: false` keeps these out of the server/initial
 * payload (they're client-only desktop windows), and `loading` shows a small
 * centered spinner while the chunk arrives.
 *
 * The module files export their view as a NAMED export, so each loader resolves
 * the named member to the `default`-shaped component next/dynamic expects.
 */
const MODULE_COMPONENTS: Record<AppModuleId, ComponentType> = {
  dashboard: dynamic(() => import("@/presentation/modules/dashboard/ExecutiveDashboardView").then((m) => m.ExecutiveDashboardView), { ssr: false, loading: () => <ModuleLoading /> }),
  leads: dynamic(() => import("@/presentation/modules/leads/LeadsView").then((m) => m.LeadsView), { ssr: false, loading: () => <ModuleLoading /> }),
  clients: dynamic(() => import("@/presentation/modules/clients/ClientManagementView").then((m) => m.ClientManagementView), { ssr: false, loading: () => <ModuleLoading /> }),
  projects: dynamic(() => import("@/presentation/modules/projects/ProjectManagementView").then((m) => m.ProjectManagementView), { ssr: false, loading: () => <ModuleLoading /> }),
  hr: dynamic(() => import("@/presentation/modules/hr/HRView").then((m) => m.HRView), { ssr: false, loading: () => <ModuleLoading /> }),
  timesheet: dynamic(() => import("@/presentation/modules/timesheet/TimesheetView").then((m) => m.TimesheetView), { ssr: false, loading: () => <ModuleLoading /> }),
  finance: dynamic(() => import("@/presentation/modules/finance/FinanceBillingView").then((m) => m.FinanceBillingView), { ssr: false, loading: () => <ModuleLoading /> }),
  transaction: dynamic(() => import("@/presentation/modules/transaction/TransactionView").then((m) => m.TransactionView), { ssr: false, loading: () => <ModuleLoading /> }),
  support: dynamic(() => import("@/presentation/modules/support/SupportTicketView").then((m) => m.SupportTicketView), { ssr: false, loading: () => <ModuleLoading /> }),
  knowledge: dynamic(() => import("@/presentation/modules/knowledge/KnowledgeBaseView").then((m) => m.KnowledgeBaseView), { ssr: false, loading: () => <ModuleLoading /> }),
  admin: dynamic(() => import("@/presentation/modules/admin/AdminAccessView").then((m) => m.AdminAccessView), { ssr: false, loading: () => <ModuleLoading /> }),
  portal: dynamic(() => import("@/presentation/modules/portal/UserPortalView").then((m) => m.UserPortalView), { ssr: false, loading: () => <ModuleLoading /> }),
  reports: dynamic(() => import("@/presentation/modules/reports/ReportsView").then((m) => m.ReportsView), { ssr: false, loading: () => <ModuleLoading /> }),
  kpis: dynamic(() => import("@/presentation/modules/kpis/KPIsView").then((m) => m.KPIsView), { ssr: false, loading: () => <ModuleLoading /> }),
  performance: dynamic(() => import("@/presentation/modules/performance/Performance360View").then((m) => m.Performance360View), { ssr: false, loading: () => <ModuleLoading /> }),
  integration: dynamic(() => import("@/presentation/modules/integration/IntegrationDashboardView").then((m) => m.IntegrationDashboardView), { ssr: false, loading: () => <ModuleLoading /> }),
};

/** Track which module chunks have already been requested, so repeated
 *  hover/focus events don't fire duplicate imports. */
const preloaded = new Set<AppModuleId>();

/**
 * Warm a module's chunk before it's needed (e.g. on dock-icon hover/focus) so
 * clicking opens it instantly. Safe to call repeatedly — it dedupes and is a
 * no-op on the server. Failures are swallowed: this is a pure optimization and
 * the real render path will surface any genuine load error.
 */
export function preloadModule(id: AppModuleId) {
  if (typeof window === "undefined") return;
  if (preloaded.has(id)) return;
  preloaded.add(id);
  const load = MODULE_LOADERS[id];
  if (!load) return;
  void Promise.resolve()
    .then(load)
    .catch(() => {
      // Allow a later attempt to retry if the warm-up failed.
      preloaded.delete(id);
    });
}

function renderModule(id: AppModuleId) {
  const Component = MODULE_COMPONENTS[id];
  if (!Component) return null;
  return <Component />;
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
