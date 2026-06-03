"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Hourglass,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Users2,
} from "lucide-react";
import { mockEmployees } from "@/infrastructure/data/employees.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import {
  mockPerformanceAnswers,
  mockPerformanceQuestions,
  mockPerformanceSubmissions,
  mockRaterSettings,
  type Performance360Status,
  type Performance360Submission,
  type Performance360Template,
  type RaterRole,
} from "@/infrastructure/data/performance360.mock";
import { usePerformanceTemplatesStore } from "@/state/performanceTemplates.store";
import { useToast } from "@/state/toast.store";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";
import { type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { DrillHeader } from "@/presentation/shared/DrillHeader";
import { DrillCue } from "@/presentation/shared/DrillCue";
import { useDrillState } from "@/state/drill.store";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { cn } from "@/lib/cn";
import { TemplateFormDialog } from "./TemplateFormDialog";

const STATUS_TONE: Record<Performance360Status, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "neutral",
  active: "success",
  closed: "info",
  archived: "neutral",
};

const SUBMISSION_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  pending: "neutral",
  in_progress: "warning",
  submitted: "success",
  expired: "danger",
};

const RATER_ROLE_TONE: Record<RaterRole, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  self: "info",
  manager: "warning",
  peer: "wit",
  subordinate: "neutral",
};

type Tab = "templates" | "submissions" | "dashboard";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));
const employeeMap = new Map(mockEmployees.map((e) => [e.id, e]));

function employeeName(id: string): string {
  const e = employeeMap.get(id);
  return e ? `${e.firstName} ${e.lastName}` : "—";
}

export function Performance360View() {
  const [tab, setTab] = useState<Tab>("templates");
  const [drillTemplateId, setDrillTemplateId] = useDrillState("perf.template");
  const [drillEmployeeId, setDrillEmployeeId] = useDrillState("perf.employee");

  const templates = usePerformanceTemplatesStore((s) => s.items);
  const hydrateTemplates = usePerformanceTemplatesStore((s) => s.hydrate);
  const addTemplate = usePerformanceTemplatesStore((s) => s.add);
  const updateTemplate = usePerformanceTemplatesStore((s) => s.update);
  const removeTemplate = usePerformanceTemplatesStore((s) => s.remove);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<Performance360Template | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<Performance360Template | null>(null);

  useEffect(() => {
    hydrateTemplates();
  }, [hydrateTemplates]);

  const openCreate = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };
  const openEdit = (t: Performance360Template) => {
    setEditingTemplate(t);
    setFormOpen(true);
  };

  const activeTemplate = useMemo(
    () => templates.find((t) => t.status === "active") ?? null,
    [templates],
  );

  const totalSubs = mockPerformanceSubmissions.length;
  const submittedSubs = mockPerformanceSubmissions.filter((s) => s.status === "submitted").length;
  const completionRate = totalSubs > 0 ? (submittedSubs / totalSubs) * 100 : 0;
  const activeRatees = new Set(mockPerformanceSubmissions.map((s) => s.rateeEmployeeId)).size;

  const drillTemplate = drillTemplateId
    ? templates.find((t) => t.id === drillTemplateId) ?? null
    : null;
  const drillEmployee = drillEmployeeId
    ? mockEmployees.find((e) => e.id === drillEmployeeId) ?? null
    : null;

  const crumbs: Crumb[] = drillTemplate
    ? [
        { id: "templates", label: "Templates" },
        { id: drillTemplate.id, label: drillTemplate.name, sublabel: drillTemplate.periodLabel },
      ]
    : drillEmployee
      ? [
          { id: "dashboard", label: "Dashboard" },
          { id: drillEmployee.id, label: `${drillEmployee.firstName} ${drillEmployee.lastName}` },
        ]
      : tab === "templates"
        ? [{ id: "templates", label: "Templates" }]
        : tab === "submissions"
          ? [{ id: "submissions", label: "Submissions" }]
          : [{ id: "dashboard", label: "Dashboard" }];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Operations · Performance
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {drillTemplate
              ? "Template detail"
              : drillEmployee
                ? "Employee dashboard"
                : "Performance 360"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            {drillTemplate
              ? "Questions, rater roles, and submission progress for this template."
              : drillEmployee
                ? "Radar chart, per-rater breakdown, and individual scores."
                : "360-degree feedback templates, submission queue, and per-employee dashboards."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!drillTemplate && !drillEmployee ? (
            <TabSwitch tab={tab} onChange={setTab} />
          ) : null}
          {!drillTemplate && !drillEmployee && tab === "templates" ? (
            <button
              type="button"
              onClick={openCreate}
              className="press inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-zinc-100 hover:bg-white/15"
            >
              <Plus className="h-3.5 w-3.5" />
              Add template
            </button>
          ) : null}
          <ManageMasterDataButton moduleId="hr" />
        </div>
      </header>

      {drillTemplate || drillEmployee ? (
        <DrillHeader
          crumbs={crumbs}
          onJump={() => {
            setDrillTemplateId(null);
            setDrillEmployeeId(null);
          }}
          onBack={() => {
            setDrillTemplateId(null);
            setDrillEmployeeId(null);
          }}
          backLabel={drillTemplate ? "Back to templates" : "Back to dashboard"}
          ariaLabel="Performance drill-down"
        />
      ) : null}

      {!drillTemplate && !drillEmployee ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            emphasis
            icon={Sparkles}
            label="Templates"
            value={String(templates.length)}
            delta={`${templates.filter((t) => t.status === "active").length} active`}
            trend="up"
          />
          <MetricCard
            icon={ListChecks}
            label="Submissions"
            value={String(totalSubs)}
            delta={`${submittedSubs} done`}
            accent="#22C55E"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Completion"
            value={`${Math.round(completionRate)}%`}
            trend={completionRate > 60 ? "up" : "down"}
            accent="#3B82F6"
          />
          <MetricCard
            icon={Users2}
            label="Employees covered"
            value={String(activeRatees)}
            accent="#A855F7"
          />
        </div>
      ) : null}

      {drillTemplate ? (
        <TemplateDetail template={drillTemplate} />
      ) : drillEmployee ? (
        <EmployeeDashboard employeeId={drillEmployee.id} />
      ) : tab === "templates" ? (
        <TemplatesList
          templates={templates}
          onOpen={setDrillTemplateId}
          onEdit={openEdit}
          onDelete={setConfirmDelete}
        />
      ) : tab === "submissions" ? (
        <SubmissionsTable activeTemplate={activeTemplate} />
      ) : (
        <DashboardList onOpen={setDrillEmployeeId} />
      )}

      <TemplateFormDialog
        open={formOpen}
        editing={editingTemplate}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateTemplate(editingId, draft);
            toast.success("Template updated", draft.name);
          } else {
            addTemplate(draft);
            toast.success("Template created", draft.name);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Delete template?"
        description={
          confirmDelete
            ? `${confirmDelete.name} will be removed. Its questions and submissions stay in the demo dataset.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const name = confirmDelete.name;
          removeTemplate(confirmDelete.id);
          setConfirmDelete(null);
          toast.info("Template deleted", name);
        }}
      />
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string }[] = [
    { id: "templates", label: "Templates" },
    { id: "submissions", label: "Submissions" },
    { id: "dashboard", label: "Dashboard" },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            tab === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TemplatesList({
  templates,
  onOpen,
  onEdit,
  onDelete,
}: {
  templates: Performance360Template[];
  onOpen: (id: string) => void;
  onEdit: (t: Performance360Template) => void;
  onDelete: (t: Performance360Template) => void;
}) {
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="Library"
        title={`Templates (${templates.length})`}
        description="Click any template to inspect its questions and submission progress."
      />
      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-zinc-400">
          No templates yet. Use “Add template” to create one.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onOpen={() => onOpen(t.id)}
              onEdit={() => onEdit(t)}
              onDelete={() => onDelete(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onOpen,
  onEdit,
  onDelete,
}: {
  template: Performance360Template;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const qCount = mockPerformanceQuestions.filter((q) => q.templateId === template.id).length;
  const subs = mockPerformanceSubmissions.filter((s) => s.templateId === template.id);
  const done = subs.filter((s) => s.status === "submitted").length;
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        role="button"
        aria-label={`Open ${template.name}`}
        className="glass-soft flex w-full flex-col gap-3 rounded-2xl border border-white/8 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/20"
      >
        <header className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 pr-12">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge tone={STATUS_TONE[template.status]} dot>
                {template.status}
              </StatusBadge>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                {template.periodLabel}
              </span>
            </div>
            <h3 className="mt-1 truncate text-sm font-semibold text-zinc-50">{template.name}</h3>
          </div>
        </header>
        <p className="line-clamp-2 text-[11px] text-zinc-400">{template.description}</p>
        <footer className="mt-auto flex items-center justify-between gap-2 text-[10px] text-zinc-500">
          <span>
            {qCount} questions · {subs.length} submissions
          </span>
          <span className="flex items-center gap-2">
            <span className="font-mono text-zinc-300">
              {subs.length > 0 ? `${Math.round((done / subs.length) * 100)}% done` : "—"}
            </span>
            <DrillCue label="Open" />
          </span>
        </footer>
      </button>
      <div className="absolute right-3 top-3 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${template.name}`}
          title="Edit"
          className="grid h-6 w-6 place-items-center rounded bg-black/20 text-zinc-300 backdrop-blur hover:bg-white/15 hover:text-zinc-50"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${template.name}`}
          title="Delete"
          className="grid h-6 w-6 place-items-center rounded bg-black/20 text-zinc-300 backdrop-blur hover:bg-rose-500/20 hover:text-rose-300"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function TemplateDetail({ template }: { template: Performance360Template }) {
  const questions = mockPerformanceQuestions.filter((q) => q.templateId === template.id);
  const sections = Array.from(new Set(questions.map((q) => q.sectionTitle)));
  const subs = mockPerformanceSubmissions.filter((s) => s.templateId === template.id);
  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={STATUS_TONE[template.status]} dot>
                {template.status}
              </StatusBadge>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                {template.periodLabel} · {template.periodKind}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {template.name}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-zinc-400">{template.description}</p>
          </div>
          <div className="text-right text-[11px] text-zinc-300">
            <div className="font-mono text-zinc-100">
              {template.periodStart} → {template.periodEnd}
            </div>
            <div className="text-[10px] text-zinc-500">Scale 1–{template.ratingScaleMax}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard emphasis icon={ListChecks} label="Questions" value={String(questions.length)} />
        <MetricCard icon={ClipboardList} label="Sections" value={String(sections.length)} accent="#3B82F6" />
        <MetricCard
          icon={CircleDot}
          label="Submissions"
          value={String(subs.length)}
          accent="#A855F7"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Submitted"
          value={String(subs.filter((s) => s.status === "submitted").length)}
          trend="up"
          accent="#22C55E"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Form"
          title={`Questions (${questions.length})`}
          description="Grouped by section. Rater-role hints show who answers each question."
        />
        <div className="space-y-4">
          {sections.map((sec) => {
            const inSec = questions.filter((q) => q.sectionTitle === sec);
            return (
              <div key={sec}>
                <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {sec}
                </div>
                <ul className="space-y-1.5">
                  {inSec.map((q) => (
                    <li
                      key={q.id}
                      className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
                    >
                      <span className="col-span-1 font-mono text-[9px] text-zinc-500">
                        #{q.sortOrder + 1}
                      </span>
                      <span className="col-span-7 text-[11px] text-zinc-200">
                        {q.questionText}
                      </span>
                      <span className="col-span-2 text-[10px] text-zinc-400 capitalize">
                        {q.questionType.replace(/_/g, " ")}
                      </span>
                      <span className="col-span-1 text-right font-mono text-[10px] text-zinc-300">
                        ×{q.weight}
                      </span>
                      <span className="col-span-1 text-right">
                        <StatusBadge tone="neutral">{q.appliesToRole}</StatusBadge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <SubmissionsTable activeTemplate={template} />
    </div>
  );
}

function SubmissionsTable({
  activeTemplate,
}: {
  activeTemplate: Performance360Template | null;
}) {
  const subs = activeTemplate
    ? mockPerformanceSubmissions.filter((s) => s.templateId === activeTemplate.id)
    : mockPerformanceSubmissions;

  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="Queue"
        title={`Submissions (${subs.length})`}
        description={
          activeTemplate
            ? `Scoped to ${activeTemplate.name} (${activeTemplate.periodLabel}).`
            : "Every submission across all templates."
        }
      />
      <ul className="space-y-1.5">
        {subs.slice(0, 16).map((s) => {
          const rater = employeeMap.get(s.raterEmployeeId);
          const ratee = employeeMap.get(s.rateeEmployeeId);
          const raterMember = rater ? teamMap.get(rater.memberId) : null;
          return (
            <li
              key={s.id}
              className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
            >
              <span className="col-span-3 flex items-center gap-2">
                {raterMember ? (
                  <Avatar
                    name={raterMember.name}
                    initials={raterMember.initials}
                    color={raterMember.avatarColor}
                    size="sm"
                  />
                ) : (
                  <Avatar name={rater ? `${rater.firstName} ${rater.lastName}` : "?"} size="sm" />
                )}
                <span className="text-[11px] text-zinc-100">{employeeName(s.raterEmployeeId)}</span>
              </span>
              <span className="col-span-1 text-center text-[10px] text-zinc-500">→</span>
              <span className="col-span-3 text-[11px] text-zinc-200">
                {employeeName(s.rateeEmployeeId)}
              </span>
              <span className="col-span-2">
                <StatusBadge tone={RATER_ROLE_TONE[s.raterRole]} dot>
                  {s.raterRole}
                </StatusBadge>
              </span>
              <span className="col-span-2">
                <StatusBadge tone={SUBMISSION_TONE[s.status]}>
                  {s.status.replace(/_/g, " ")}
                </StatusBadge>
              </span>
              <span className="col-span-1 text-right font-mono text-[10px] text-zinc-400">
                {s.submittedAt ?? ""}
              </span>
            </li>
          );
        })}
      </ul>
      {subs.length > 16 ? (
        <div className="mt-3 text-center text-[10px] text-zinc-500">
          + {subs.length - 16} more submissions
        </div>
      ) : null}
    </div>
  );
}

function DashboardList({ onOpen }: { onOpen: (id: string) => void }) {
  const rateeMap = new Map<string, Performance360Submission[]>();
  mockPerformanceSubmissions
    .filter((s) => s.templateId === "t360-2026-h1")
    .forEach((s) => {
      const list = rateeMap.get(s.rateeEmployeeId) ?? [];
      list.push(s);
      rateeMap.set(s.rateeEmployeeId, list);
    });

  const rows = Array.from(rateeMap.entries()).map(([emp, subs]) => ({
    empId: emp,
    total: subs.length,
    submitted: subs.filter((s) => s.status === "submitted").length,
    avg: averageScore(emp),
  }));

  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="By employee"
        title={`Dashboard (${rows.length})`}
        description="Click an employee to see their radar + per-question breakdown."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => {
          const emp = employeeMap.get(r.empId);
          const member = emp ? teamMap.get(emp.memberId) : null;
          if (!emp) return null;
          return (
            <button
              key={r.empId}
              type="button"
              onClick={() => onOpen(r.empId)}
              role="button"
              aria-label={`Open ${emp.firstName} ${emp.lastName}`}
              className="group glass-soft flex items-center gap-3 rounded-2xl border border-white/8 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/20"
            >
              {member ? (
                <Avatar
                  name={member.name}
                  initials={member.initials}
                  color={member.avatarColor}
                  size="lg"
                />
              ) : (
                <Avatar name={`${emp.firstName} ${emp.lastName}`} size="lg" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-50">
                  {emp.firstName} {emp.lastName}
                </div>
                <div className="truncate text-[10px] text-zinc-400">{emp.position}</div>
                <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                  <span className="inline-flex items-center gap-0.5 font-mono text-amber-300">
                    <Star className="h-3 w-3" />
                    {r.avg.toFixed(1)}
                  </span>
                  <span className="text-zinc-500">
                    {r.submitted}/{r.total} responses
                  </span>
                </div>
              </div>
              <DrillCue label="Open" className="self-center" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmployeeDashboard({ employeeId }: { employeeId: string }) {
  const emp = employeeMap.get(employeeId)!;
  const member = teamMap.get(emp.memberId);
  const settings = mockRaterSettings.find((r) => r.rateeEmployeeId === employeeId);
  const subs = mockPerformanceSubmissions.filter(
    (s) => s.rateeEmployeeId === employeeId && s.templateId === "t360-2026-h1",
  );
  const submittedSubs = subs.filter((s) => s.status === "submitted");

  // Collect answers across all submitted subs, grouped by question category
  const answers = mockPerformanceAnswers.filter((a) =>
    submittedSubs.some((s) => s.id === a.submissionId),
  );
  const questionMap = new Map(mockPerformanceQuestions.map((q) => [q.id, q]));
  const categoryRatings = new Map<string, number[]>();
  answers.forEach((a) => {
    if (a.rating == null) return;
    const q = questionMap.get(a.questionId);
    if (!q) return;
    const list = categoryRatings.get(q.category) ?? [];
    list.push(a.rating);
    categoryRatings.set(q.category, list);
  });
  const radarData = Array.from(categoryRatings.entries()).map(([category, ratings]) => ({
    category,
    score: ratings.reduce((s, r) => s + r, 0) / Math.max(1, ratings.length),
    fullMark: 5,
  }));
  const overall =
    radarData.length > 0
      ? radarData.reduce((s, r) => s + r.score, 0) / radarData.length
      : 0;

  // Per-role breakdown
  const perRole: { role: RaterRole; score: number; count: number }[] = (
    ["self", "manager", "peer", "subordinate"] as const
  ).map((role) => {
    const roleSubs = submittedSubs.filter((s) => s.raterRole === role);
    const roleAnswers = mockPerformanceAnswers.filter(
      (a) =>
        roleSubs.some((s) => s.id === a.submissionId) && a.rating != null,
    );
    const total = roleAnswers.reduce((s, a) => s + (a.rating ?? 0), 0);
    return {
      role,
      score: roleAnswers.length > 0 ? total / roleAnswers.length : 0,
      count: roleSubs.length,
    };
  });

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start gap-4">
          {member ? (
            <Avatar name={member.name} initials={member.initials} color={member.avatarColor} size="lg" />
          ) : (
            <Avatar name={`${emp.firstName} ${emp.lastName}`} size="lg" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
              {emp.firstName} {emp.lastName}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {emp.position} · {emp.department}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
              {settings?.allowSelf ? <StatusBadge tone="info">self</StatusBadge> : null}
              {settings?.allowManager ? <StatusBadge tone="warning">manager</StatusBadge> : null}
              {settings?.allowPeer ? <StatusBadge tone="wit">peer</StatusBadge> : null}
              {settings?.allowSubordinate ? (
                <StatusBadge tone="neutral">subordinate</StatusBadge>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Overall</div>
            <div className="font-mono text-3xl font-semibold text-zinc-50">
              {overall.toFixed(2)}
              <span className="ml-1 text-sm text-zinc-500">/ 5</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Star}
          label="Overall score"
          value={overall.toFixed(2)}
          delta="rolling H1 2026"
          trend={overall >= 4 ? "up" : overall >= 3 ? "flat" : "down"}
        />
        <MetricCard
          icon={ListChecks}
          label="Categories"
          value={String(radarData.length)}
          accent="#3B82F6"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Responses"
          value={String(submittedSubs.length)}
          delta={`/ ${subs.length} expected`}
          accent="#22C55E"
        />
        <MetricCard
          icon={Hourglass}
          label="Outstanding"
          value={String(subs.filter((s) => s.status !== "submitted").length)}
          trend="down"
          accent="#F59E0B"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="glass rounded-[20px] p-5">
          <SectionHeader
            eyebrow="Radar"
            title="Score by category"
            description="Averaged across every rater that submitted."
          />
          <div className="h-72">
            {radarData.length === 0 ? (
              <div className="grid h-full place-items-center text-xs text-zinc-400">
                No submitted responses yet for this employee.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.10)" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  />
                  <Radar
                    dataKey="score"
                    stroke="#FBBF24"
                    fill="#FBBF24"
                    fillOpacity={0.30}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Roles" title="By rater" />
          <ul className="space-y-2 text-[11px]">
            {perRole.map((r) => (
              <li
                key={r.role}
                className="flex items-center justify-between rounded-xl border border-white/6 px-3 py-2"
              >
                <span className="capitalize">
                  <StatusBadge tone={RATER_ROLE_TONE[r.role]} dot>
                    {r.role}
                  </StatusBadge>
                </span>
                <span className="font-mono text-zinc-100">
                  {r.count > 0 ? r.score.toFixed(2) : "—"}
                  <span className="ml-1 text-[9px] text-zinc-500">/ 5</span>
                </span>
              </li>
            ))}
          </ul>

          <SectionHeader className="mt-4" eyebrow="Detail" title="Category averages" />
          <ul className="space-y-1.5">
            {radarData
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((r) => (
                <li
                  key={r.category}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/[0.04]"
                >
                  <span className="text-[11px] text-zinc-200">{r.category}</span>
                  <span className="font-mono text-[11px] text-zinc-100">
                    {r.score.toFixed(2)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function averageScore(employeeId: string): number {
  const subs = mockPerformanceSubmissions.filter(
    (s) => s.rateeEmployeeId === employeeId && s.status === "submitted",
  );
  const answers = mockPerformanceAnswers.filter(
    (a) => subs.some((s) => s.id === a.submissionId) && a.rating != null,
  );
  if (answers.length === 0) return 0;
  return (
    answers.reduce((s, a) => s + (a.rating ?? 0), 0) / answers.length
  );
}

