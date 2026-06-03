"use client";

import { createCRUDStore } from "@/state/createCRUDStore";
import {
  RECENT_RUNS,
  SCHEDULED,
  type ReportTemplate,
  type RunHistoryItem,
  type ScheduledReport,
} from "./reportsData";

export type RunDraft = Omit<RunHistoryItem, "id">;
export type ScheduleDraft = Omit<ScheduledReport, "id">;

/** Append-only run log. "Run now" prepends a completed entry. */
export const useReportRunsStore = createCRUDStore<RunHistoryItem, RunDraft>({
  storageKey: "wit-erp-os.report-runs",
  seed: RECENT_RUNS,
  idPrefix: "run",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});

/** Recurring delivery config. */
export const useReportSchedulesStore = createCRUDStore<
  ScheduledReport,
  ScheduleDraft
>({
  storageKey: "wit-erp-os.report-schedules",
  seed: SCHEDULED,
  idPrefix: "sch",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});

/** "YYYY-MM-DD HH:mm" stamp matching the seed format. */
export function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Build a completed run draft for "Run now". Duration is derived from the
 *  template name so it stays stable without Math.random. */
export function makeRunDraft(
  template: ReportTemplate,
  ranBy: string,
): RunDraft {
  return {
    templateId: template.id,
    templateName: template.name,
    category: template.category,
    ranAt: nowStamp(),
    ranBy,
    duration: `${(template.name.length % 18) + 6}s`,
    status: "completed",
  };
}

/** A sensible default recurring delivery when a template has none yet. */
export function makeScheduleDraft(template: ReportTemplate): ScheduleDraft {
  const cadence = template.cadence === "On-demand" ? "Weekly" : template.cadence;
  return {
    templateId: template.id,
    templateName: template.name,
    recipients: ["leadership@wit.id"],
    cadence,
    nextRun: nowStamp(),
    channel: "Email",
    paused: false,
  };
}

/** Trigger a real client-side file download of a report's contents (CSV). */
export function downloadReport(template: ReportTemplate): void {
  if (typeof window === "undefined") return;
  const rows = [
    ["Report", template.name],
    ["Category", template.category],
    ["Format", template.format],
    ["Cadence", template.cadence],
    ["Last run", template.lastRun ?? "—"],
    ["Generated at", nowStamp()],
  ];
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${template.name.replace(/\s+/g, "-").toLowerCase()}-${template.id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
