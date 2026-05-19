"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Briefcase, Gauge, Sparkles } from "lucide-react";
import { createProjectService } from "@/application/factories/createProjectService";
import { createSprintService } from "@/application/factories/createSprintService";
import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import type { ProjectBoardDTO } from "@/application/use-cases/tasks/GetProjectBoard";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { ProjectTable } from "./ProjectTable";
import { ProjectKanban } from "./ProjectKanban";
import { ProjectRoadmap } from "./ProjectRoadmap";
import { DrillBreadcrumb, type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { ProjectDetailView } from "./ProjectDetailView";
import { EpicDetailView } from "./EpicDetailView";
import { StoryDetailView } from "./StoryDetailView";
import { SprintTaskView } from "@/presentation/modules/tasks/SprintTaskView";
import { formatPercent } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

type View = "table" | "kanban" | "roadmap";
type Section = "portfolio" | "sprints";

type Drill =
  | { level: "portfolio" }
  | { level: "project"; projectId: string }
  | { level: "epic"; projectId: string; epicId: string }
  | { level: "story"; projectId: string; epicId: string; storyId: string };

export function ProjectManagementView() {
  const [projects, setProjects] = useState<ProjectOverviewDTO[]>([]);
  const [board, setBoard] = useState<ProjectBoardDTO | null>(null);
  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<Section>("portfolio");
  const [drill, setDrill] = useState<Drill>({ level: "portfolio" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [overview, projectBoard] = await Promise.all([
        createProjectService().getOverview(),
        createSprintService().getProjectBoard(),
      ]);
      if (!cancelled) {
        setProjects(overview);
        setBoard(projectBoard);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q),
    );
  }, [projects, query]);

  const active = projects.filter((p) => p.status !== "Delivered" && p.status !== "Maintenance");
  const atRisk = projects.filter((p) => p.health === "red").length;
  const avgProgress = projects.length
    ? projects.reduce((s, p) => s + p.progress, 0) / projects.length
    : 0;
  const avgMargin = projects.length
    ? projects.reduce((s, p) => s + p.grossMargin, 0) / projects.length
    : 0;

  const openProject = (projectId: string) =>
    setDrill({ level: "project", projectId });
  const openEpic = (epicId: string) =>
    setDrill((prev) =>
      prev.level === "portfolio"
        ? prev
        : { level: "epic", projectId: prev.projectId, epicId },
    );
  const openStory = (storyId: string) =>
    setDrill((prev) =>
      prev.level === "epic" || prev.level === "story"
        ? { level: "story", projectId: prev.projectId, epicId: prev.epicId, storyId }
        : prev,
    );
  const jumpToLevel = (idx: number) => {
    if (idx === 0) setDrill({ level: "portfolio" });
    else if (idx === 1 && drill.level !== "portfolio")
      setDrill({ level: "project", projectId: drill.projectId });
    else if (idx === 2 && (drill.level === "epic" || drill.level === "story"))
      setDrill({ level: "epic", projectId: drill.projectId, epicId: drill.epicId });
  };

  const drillProject =
    drill.level !== "portfolio"
      ? projects.find((p) => p.id === drill.projectId)
      : undefined;
  const projectEpics =
    drill.level !== "portfolio" && board
      ? board.epics.filter((e) => e.projectId === drill.projectId)
      : [];
  const drillEpic =
    (drill.level === "epic" || drill.level === "story") && board
      ? board.epics.find((e) => e.id === drill.epicId)
      : undefined;
  const drillStory =
    drill.level === "story" && drillEpic
      ? drillEpic.stories.find((s) => s.id === drill.storyId)
      : undefined;

  const crumbs: Crumb[] = useMemo(() => {
    const list: Crumb[] = [{ id: "portfolio", label: "Portfolio" }];
    if (drillProject) list.push({ id: drillProject.id, label: drillProject.name, sublabel: drillProject.code });
    if (drillEpic) list.push({ id: drillEpic.id, label: drillEpic.name, sublabel: drillEpic.code });
    if (drillStory) list.push({ id: drillStory.id, label: drillStory.title, sublabel: drillStory.code });
    return list;
  }, [drillProject, drillEpic, drillStory]);

  const showDrill = section === "portfolio" && drill.level !== "portfolio";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Delivery · Projects
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {showDrill ? "Project drill-down" : "Project portfolio"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            {showDrill
              ? "Top-down: portfolio → project → epic → story → task."
              : "Health, progress, budget and risk across every active engagement."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {section === "portfolio" && drill.level === "portfolio" ? (
            <>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search projects, code, client…"
                className="w-full sm:w-auto md:w-72"
              />
              <ViewSwitch view={view} onChange={setView} />
            </>
          ) : null}
          <SectionSwitch
            section={section}
            onChange={(s) => {
              setSection(s);
              setDrill({ level: "portfolio" });
            }}
          />
          <ManageMasterDataButton moduleId="projects" />
        </div>
      </header>

      {section === "sprints" ? (
        <SprintTaskView compact />
      ) : showDrill ? (
        <>
          <DrillBreadcrumb crumbs={crumbs} onJump={jumpToLevel} ariaLabel="Project drill-down" />
          {drill.level === "project" && drillProject ? (
            <ProjectDetailView
              project={drillProject}
              epics={projectEpics}
              onOpenEpic={openEpic}
            />
          ) : null}
          {drill.level === "epic" && drillEpic ? (
            <EpicDetailView epic={drillEpic} onOpenStory={openStory} />
          ) : null}
          {drill.level === "story" && drillStory && drillEpic ? (
            <StoryDetailView story={drillStory} epicColor={drillEpic.color} />
          ) : null}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              emphasis
              icon={Briefcase}
              label="Active Projects"
              value={String(active.length)}
              delta={`${projects.length} total`}
              trend="up"
            />
            <MetricCard
              icon={AlertTriangle}
              label="At Risk"
              value={String(atRisk)}
              trend={atRisk > 0 ? "down" : "flat"}
              accent="#EF4444"
            />
            <MetricCard
              icon={Gauge}
              label="Avg Progress"
              value={formatPercent(avgProgress, 0)}
              trend="up"
              accent="#3B82F6"
            />
            <MetricCard
              icon={Sparkles}
              label="Avg Margin"
              value={formatPercent(avgMargin, 0)}
              trend={avgMargin > 15 ? "up" : "down"}
              accent="#22C55E"
            />
          </div>

          <div className="glass rounded-[20px] p-5">
            <SectionHeader
              eyebrow={view === "kanban" ? "Pipeline" : view === "roadmap" ? "Timeline" : "Portfolio"}
              title={
                view === "kanban"
                  ? "Status board"
                  : view === "roadmap"
                    ? "Roadmap"
                    : `Project records (${filtered.length})`
              }
              description={
                view === "table"
                  ? "Click any row to drill into the project's epics, stories and tasks."
                  : view === "kanban"
                    ? "Click a card to drill into delivery details."
                    : "Click a project to drill into its epics and stories."
              }
            />
            {view === "table" && (
              <ProjectTable rows={filtered} onRowClick={(p) => openProject(p.id)} />
            )}
            {view === "kanban" && (
              <ProjectKanban projects={filtered} onCardClick={(p) => openProject(p.id)} />
            )}
            {view === "roadmap" && (
              <ProjectRoadmap projects={filtered} onRowClick={(p) => openProject(p.id)} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SectionSwitch({
  section,
  onChange,
}: {
  section: Section;
  onChange: (s: Section) => void;
}) {
  const opts: { id: Section; label: string }[] = [
    { id: "portfolio", label: "Portfolio" },
    { id: "sprints", label: "Sprints" },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            section === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ViewSwitch({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  const options: { id: View; label: string }[] = [
    { id: "table", label: "Table" },
    { id: "kanban", label: "Kanban" },
    { id: "roadmap", label: "Roadmap" },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            view === o.id
              ? "bg-white/10 text-zinc-300"
              : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
