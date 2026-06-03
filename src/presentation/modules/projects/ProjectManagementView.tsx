"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Briefcase, Gauge, Pencil, Sparkles, Trash2 } from "lucide-react";
import { createProjectService } from "@/application/factories/createProjectService";
import { createSprintService } from "@/application/factories/createSprintService";
import type { ProjectOverviewDTO } from "@/application/dtos/ProjectDTO";
import type { ProjectBoardDTO } from "@/application/use-cases/tasks/GetProjectBoard";
import type { Project } from "@/domain/entities/Project";
import type { Epic } from "@/domain/entities/Epic";
import type { UserStory } from "@/domain/entities/UserStory";
import { mockClients } from "@/infrastructure/data/clients.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { useProjectsStore } from "@/state/projects.store";
import { useEpicsStore } from "@/state/epics.store";
import { useUserStoriesStore } from "@/state/userStories.store";
import { useToast } from "@/state/toast.store";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { ProjectTable } from "./ProjectTable";
import { ProjectKanban } from "./ProjectKanban";
import { ProjectRoadmap } from "./ProjectRoadmap";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { EpicFormDialog } from "./EpicFormDialog";
import { StoryFormDialog } from "./StoryFormDialog";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { NewButton } from "@/presentation/shared/NewButton";
import { type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { DrillHeader } from "@/presentation/shared/DrillHeader";
import { useDrillState } from "@/state/drill.store";
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
  const [baseline, setBaseline] = useState<ProjectOverviewDTO[]>([]);
  const [board, setBoard] = useState<ProjectBoardDTO | null>(null);
  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<Section>("portfolio");
  // Drill position persisted per level so a drill-down survives reloads /
  // app switches. The `Drill` union below is derived from these ids; the
  // deepest non-null id wins, mirroring the original portfolio→story logic.
  const [drillProjectId, setDrillProjectId] = useDrillState("projects.project");
  const [drillEpicId, setDrillEpicId] = useDrillState("projects.epic");
  const [drillStoryId, setDrillStoryId] = useDrillState("projects.story");

  const drill: Drill = useMemo(() => {
    if (!drillProjectId) return { level: "portfolio" };
    if (!drillEpicId) return { level: "project", projectId: drillProjectId };
    if (!drillStoryId)
      return { level: "epic", projectId: drillProjectId, epicId: drillEpicId };
    return {
      level: "story",
      projectId: drillProjectId,
      epicId: drillEpicId,
      storyId: drillStoryId,
    };
  }, [drillProjectId, drillEpicId, drillStoryId]);

  // Set the whole drill position from a `Drill` value, keeping the persisted
  // ids consistent (clearing deeper ids when stepping up).
  const setDrill = (next: Drill) => {
    setDrillProjectId(next.level === "portfolio" ? null : next.projectId);
    setDrillEpicId(
      next.level === "epic" || next.level === "story" ? next.epicId : null,
    );
    setDrillStoryId(next.level === "story" ? next.storyId : null);
  };

  const storeProjects = useProjectsStore((s) => s.items);
  const hydrate = useProjectsStore((s) => s.hydrate);
  const addProject = useProjectsStore((s) => s.add);
  const updateProject = useProjectsStore((s) => s.update);
  const removeProject = useProjectsStore((s) => s.remove);

  const epicsItems = useEpicsStore((s) => s.items);
  const hydrateEpics = useEpicsStore((s) => s.hydrate);
  const addEpic = useEpicsStore((s) => s.add);
  const updateEpic = useEpicsStore((s) => s.update);
  const removeEpic = useEpicsStore((s) => s.remove);

  const storiesItems = useUserStoriesStore((s) => s.items);
  const hydrateStories = useUserStoriesStore((s) => s.hydrate);
  const addStory = useUserStoriesStore((s) => s.add);
  const updateStory = useUserStoriesStore((s) => s.update);
  const removeStory = useUserStoriesStore((s) => s.remove);

  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const [epicFormOpen, setEpicFormOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [confirmDeleteEpic, setConfirmDeleteEpic] = useState<Epic | null>(null);

  const [storyFormOpen, setStoryFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [confirmDeleteStory, setConfirmDeleteStory] = useState<UserStory | null>(null);

  useEffect(() => {
    hydrate();
    hydrateEpics();
    hydrateStories();
    let cancelled = false;
    (async () => {
      const [overview, projectBoard] = await Promise.all([
        createProjectService().getOverview(),
        createSprintService().getProjectBoard(),
      ]);
      if (!cancelled) {
        setBaseline(overview);
        setBoard(projectBoard);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate, hydrateEpics, hydrateStories]);

  // Avoid unused-var warnings — these reactive subscriptions exist to trigger
  // re-renders when CRUD mutations happen even though we don't reach into the
  // lists directly here (the DTO drill renderers do).
  void epicsItems;
  void storiesItems;

  // Project DTOs are derived from the store. We keep baseline only as a
  // reference for service-side enrichments (clientName/managerName/margin)
  // that are stable per-record; when those aren't available (newly-created
  // projects), we fall back to local mock lookups.
  const baselineMap = useMemo(() => new Map(baseline.map((p) => [p.id, p])), [baseline]);
  const clientMap = useMemo(() => new Map(mockClients.map((c) => [c.id, c.name])), []);
  const teamMap = useMemo(() => new Map(mockTeam.map((m) => [m.id, m.name])), []);

  const projects: ProjectOverviewDTO[] = useMemo(() => {
    return storeProjects.map((p) => {
      const enriched = baselineMap.get(p.id);
      const budgetUtilization = p.budget > 0 ? (p.actualCost / p.budget) * 100 : 0;
      return enriched
        ? { ...enriched, ...p, budgetUtilization }
        : {
            ...p,
            clientName: clientMap.get(p.clientId) ?? "Unknown",
            managerName: teamMap.get(p.projectManagerId) ?? "Unknown",
            budgetUtilization,
            grossMargin: p.budget - p.actualCost,
          };
    });
  }, [storeProjects, baselineMap, clientMap, teamMap]);

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
  const openEpic = (epicId: string) => {
    if (drill.level === "portfolio") return;
    setDrill({ level: "epic", projectId: drill.projectId, epicId });
  };
  const openStory = (storyId: string) => {
    if (drill.level === "epic" || drill.level === "story")
      setDrill({ level: "story", projectId: drill.projectId, epicId: drill.epicId, storyId });
  };
  const jumpToLevel = (idx: number) => {
    if (idx === 0) setDrill({ level: "portfolio" });
    else if (idx === 1 && drill.level !== "portfolio")
      setDrill({ level: "project", projectId: drill.projectId });
    else if (idx === 2 && (drill.level === "epic" || drill.level === "story"))
      setDrill({ level: "epic", projectId: drill.projectId, epicId: drill.epicId });
  };

  // Step up exactly one level (clear the deepest active drill id). Powers the
  // DrillHeader back button + Esc / ⌘[ shortcuts.
  const drillBack = () => {
    if (drill.level === "story")
      setDrill({ level: "epic", projectId: drill.projectId, epicId: drill.epicId });
    else if (drill.level === "epic")
      setDrill({ level: "project", projectId: drill.projectId });
    else if (drill.level === "project") setDrill({ level: "portfolio" });
  };

  // Context-aware label for the back button: name the level we'll land on.
  const backLabel =
    drill.level === "story"
      ? "Back to epic"
      : drill.level === "epic"
        ? "Back to project"
        : "Back to portfolio";

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
              <NewButton
                label="New project"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              />
            </>
          ) : null}
          {section === "portfolio" && drill.level === "project" && drillProject ? (
            <>
              <NewButton
                label="New epic"
                onClick={() => {
                  setEditingEpic(null);
                  setEpicFormOpen(true);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setEditing(drillProject);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/12"
              >
                <Pencil className="h-3 w-3" />
                Edit project
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(drillProject)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-500/25"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </>
          ) : null}
          {section === "portfolio" && drill.level === "epic" && drillEpic ? (
            <>
              <NewButton
                label="New story"
                onClick={() => {
                  setEditingStory(null);
                  setStoryFormOpen(true);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  // The drill DTO is an EpicNode (extends Epic) — cast safely.
                  setEditingEpic(drillEpic as unknown as Epic);
                  setEpicFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/12"
              >
                <Pencil className="h-3 w-3" />
                Edit epic
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteEpic(drillEpic as unknown as Epic)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-500/25"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </>
          ) : null}
          {section === "portfolio" && drill.level === "story" && drillStory ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingStory(drillStory as unknown as UserStory);
                  setStoryFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-zinc-200 transition-colors hover:bg-white/12"
              >
                <Pencil className="h-3 w-3" />
                Edit story
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteStory(drillStory as unknown as UserStory)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:bg-rose-500/25"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
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
          <DrillHeader
            crumbs={crumbs}
            onJump={jumpToLevel}
            onBack={drillBack}
            backLabel={backLabel}
            ariaLabel="Project drill-down"
          />
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

      <ProjectFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateProject(editingId, draft);
            toast.success("Project updated", draft.name);
          } else {
            addProject(draft);
            toast.success("Project created", draft.name);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Archive project?"
        description={
          confirmDelete
            ? `${confirmDelete.code} · ${confirmDelete.name} will be removed from the portfolio. Linked epics, stories, tasks, tickets and invoices remain in storage but become orphans in this view.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const name = confirmDelete.name;
          removeProject(confirmDelete.id);
          setConfirmDelete(null);
          setDrill({ level: "portfolio" });
          toast.info("Project archived", `${name} has been removed.`);
        }}
      />

      <EpicFormDialog
        open={epicFormOpen}
        defaultProjectId={drillProject?.id}
        editing={editingEpic}
        onClose={() => setEpicFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateEpic(editingId, draft);
            toast.success("Epic updated", draft.name);
          } else {
            const created = addEpic(draft);
            toast.success("Epic created", `${created.code} · ${draft.name}`);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDeleteEpic}
        title="Remove epic?"
        description={
          confirmDeleteEpic
            ? `${confirmDeleteEpic.code} · ${confirmDeleteEpic.name} will be removed. User stories under this epic become orphans.`
            : ""
        }
        onCancel={() => setConfirmDeleteEpic(null)}
        onConfirm={() => {
          if (!confirmDeleteEpic) return;
          const ref = `${confirmDeleteEpic.code} · ${confirmDeleteEpic.name}`;
          removeEpic(confirmDeleteEpic.id);
          setConfirmDeleteEpic(null);
          if (drill.level === "epic" || drill.level === "story")
            setDrill({ level: "project", projectId: drill.projectId });
          toast.info("Epic removed", ref);
        }}
      />

      <StoryFormDialog
        open={storyFormOpen}
        defaultEpicId={drill.level === "epic" || drill.level === "story" ? drill.epicId : undefined}
        defaultProjectId={drill.level === "portfolio" ? undefined : drill.projectId}
        editing={editingStory}
        onClose={() => setStoryFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateStory(editingId, draft);
            toast.success("Story updated", draft.title);
          } else {
            const created = addStory(draft);
            toast.success("Story created", `${created.code} · ${draft.title}`);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDeleteStory}
        title="Remove user story?"
        description={
          confirmDeleteStory
            ? `${confirmDeleteStory.code} · ${confirmDeleteStory.title} will be removed. Sprint tasks linked to this story remain but become orphans.`
            : ""
        }
        onCancel={() => setConfirmDeleteStory(null)}
        onConfirm={() => {
          if (!confirmDeleteStory) return;
          const ref = `${confirmDeleteStory.code} · ${confirmDeleteStory.title}`;
          removeStory(confirmDeleteStory.id);
          setConfirmDeleteStory(null);
          if (drill.level === "story")
            setDrill({ level: "epic", projectId: drill.projectId, epicId: drill.epicId });
          toast.info("Story removed", ref);
        }}
      />
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
