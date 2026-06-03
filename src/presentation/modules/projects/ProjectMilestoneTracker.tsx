"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  MilestoneSection,
  ProjectMilestone,
} from "@/domain/entities/ProjectMilestone";
import type { ProjectTeamRole } from "@/domain/entities/ProjectTeamRole";
import {
  useMilestonesStore,
  useProjectMilestones,
  type ProjectMilestoneDraft,
} from "@/state/milestones.store";
import {
  useProjectTeamRoles,
  useProjectTeamRolesStore,
  type ProjectTeamRoleDraft,
} from "@/state/projectTeamRoles.store";
import { useToast } from "@/state/toast.store";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { Avatar } from "@/presentation/shared/Avatar";
import { cn } from "@/lib/cn";
import { MilestoneFormDialog } from "./MilestoneFormDialog";
import {
  CATEGORY_ACCENT,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  CATEGORY_SECTIONS,
  formatMilestoneDate,
  MilestoneDetail,
  progressOf,
  SECTION_TITLE,
  StatusPill,
  type MilestoneCategory,
} from "./milestone.shared";

interface ProjectMilestoneTrackerProps {
  projectId: string;
  /** Optional inline title above the three columns. */
  title?: string;
}

export function ProjectMilestoneTracker({
  projectId,
  title,
}: ProjectMilestoneTrackerProps) {
  const milestones = useProjectMilestones(projectId);
  const teamRoles = useProjectTeamRoles(projectId);

  const addMilestone = useMilestonesStore((s) => s.add);
  const updateMilestone = useMilestonesStore((s) => s.update);
  const removeMilestone = useMilestonesStore((s) => s.remove);

  const addTeamRole = useProjectTeamRolesStore((s) => s.add);
  const updateTeamRole = useProjectTeamRolesStore((s) => s.update);
  const removeTeamRole = useProjectTeamRolesStore((s) => s.remove);

  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [formSection, setFormSection] = useState<MilestoneSection>("workflow");
  const [editing, setEditing] = useState<ProjectMilestone | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<ProjectMilestone | null>(null);

  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ProjectTeamRole | null>(null);
  const [confirmDeleteTeam, setConfirmDeleteTeam] =
    useState<ProjectTeamRole | null>(null);

  const grouped = useMemo(() => {
    const result: Record<MilestoneSection, ProjectMilestone[]> = {
      workflow: [],
      payment: [],
      credential: [],
      development: [],
    };
    for (const m of milestones) result[m.section].push(m);
    return result;
  }, [milestones]);

  const openCreate = (section: MilestoneSection) => {
    setEditing(null);
    setFormSection(section);
    setFormOpen(true);
  };

  const openEdit = (m: ProjectMilestone) => {
    setEditing(m);
    setFormSection(m.section);
    setFormOpen(true);
  };

  const handleSubmit = (
    draft: ProjectMilestoneDraft,
    editingId?: string,
  ) => {
    if (editingId) {
      updateMilestone(editingId, draft);
      toast.success("Milestone updated", draft.label);
    } else {
      addMilestone(draft);
      toast.success("Milestone created", draft.label);
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    const { id, ...draft } = confirmDelete;
    removeMilestone(id);
    toast.push({
      tone: "info",
      title: "Milestone deleted",
      description: confirmDelete.label,
      action: { label: "Undo", onClick: () => addMilestone(draft) },
    });
    setConfirmDelete(null);
  };

  const handleSubmitTeam = (
    draft: ProjectTeamRoleDraft,
    editingId?: string,
  ) => {
    if (editingId) {
      updateTeamRole(editingId, draft);
      toast.success("Team member updated", draft.name);
    } else {
      addTeamRole(draft);
      toast.success("Team member added", draft.name);
    }
  };

  const handleConfirmDeleteTeam = () => {
    if (!confirmDeleteTeam) return;
    const { id, ...draft } = confirmDeleteTeam;
    removeTeamRole(id);
    toast.push({
      tone: "info",
      title: "Team member removed",
      description: confirmDeleteTeam.name,
      action: { label: "Undo", onClick: () => addTeamRole(draft) },
    });
    setConfirmDeleteTeam(null);
  };

  return (
    <div className="space-y-3">
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          {title}
        </h3>
      ) : null}

      {/* Board grouped by category — Technical vs Commercial. Each band owns
          its milestone sections (+ the project team under Technical). */}
      <div className="space-y-4">
        {CATEGORY_ORDER.map((category) => {
          const sections = CATEGORY_SECTIONS[category];
          const categoryItems = sections.flatMap((s) => grouped[s]);
          const pct = progressOf(categoryItems);
          const isTechnical = category === "technical";
          return (
            <div key={category} className="space-y-3">
              <CategoryBandHeader category={category} pct={pct} />
              <div
                className={cn(
                  "grid gap-4",
                  isTechnical ? "lg:grid-cols-3" : "lg:grid-cols-2",
                )}
              >
                {sections.map((section) => (
                  <div key={section} className="glass rounded-[20px] p-4">
                    <MilestoneSubsection
                      section={section}
                      items={grouped[section]}
                      onEdit={openEdit}
                      onDelete={setConfirmDelete}
                      onAdd={() => openCreate(section)}
                    />
                  </div>
                ))}
                {isTechnical ? (
                  <div className="glass rounded-[20px] p-4">
                    <ProjectTeamSubsection
                      roles={teamRoles}
                      onAdd={() => {
                        setEditingTeam(null);
                        setTeamFormOpen(true);
                      }}
                      onEdit={(r) => {
                        setEditingTeam(r);
                        setTeamFormOpen(true);
                      }}
                      onDelete={setConfirmDeleteTeam}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <MilestoneFormDialog
        open={formOpen}
        projectId={projectId}
        defaultSection={formSection}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={confirmDelete}
        title="Delete milestone?"
        description={
          confirmDelete
            ? `"${confirmDelete.label}" will be removed from this project's tracker. You can recreate it later.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <TeamRoleFormDialog
        open={teamFormOpen}
        projectId={projectId}
        editing={editingTeam}
        onClose={() => setTeamFormOpen(false)}
        onSubmit={handleSubmitTeam}
      />

      <DeleteConfirmDialog
        open={confirmDeleteTeam}
        title="Remove team member?"
        description={
          confirmDeleteTeam
            ? `${confirmDeleteTeam.name} (${confirmDeleteTeam.role}) will be removed from this project's team.`
            : ""
        }
        onCancel={() => setConfirmDeleteTeam(null)}
        onConfirm={handleConfirmDeleteTeam}
      />
    </div>
  );
}

function CategoryBandHeader({
  category,
  pct,
}: {
  category: MilestoneCategory;
  pct: number;
}) {
  const accent = CATEGORY_ACCENT[category];
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-4 w-1 rounded-full"
        style={{ background: accent }}
        aria-hidden
      />
      <h3
        className="text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        {CATEGORY_LABEL[category]}
      </h3>
      <div className="h-px flex-1 bg-white/8" />
      <span className="font-mono text-[10px] text-zinc-400">{pct}%</span>
    </div>
  );
}

interface MilestoneSubsectionProps {
  section: MilestoneSection;
  items: ProjectMilestone[];
  onEdit: (m: ProjectMilestone) => void;
  onDelete: (m: ProjectMilestone) => void;
  onAdd: () => void;
}

function MilestoneSubsection({
  section,
  items,
  onEdit,
  onDelete,
  onAdd,
}: MilestoneSubsectionProps) {
  const pct = progressOf(items);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-200">
          {SECTION_TITLE[section]}
        </h4>
        <span className="font-mono text-[10px] text-zinc-300">{pct}%</span>
      </div>
      <ProgressBar value={pct} />
      <ul className="mt-3 space-y-1">
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-white/10 px-2 py-3 text-center text-[11px] text-zinc-500">
            No milestones yet.
          </li>
        ) : (
          items.map((m) => (
            <MilestoneRow
              key={m.id}
              milestone={m}
              onEdit={() => onEdit(m)}
              onDelete={() => onDelete(m)}
            />
          ))
        )}
      </ul>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-white/12 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/25 hover:bg-white/[0.04] hover:text-zinc-100"
      >
        <Plus className="h-3 w-3" />
        Add milestone
      </button>
    </div>
  );
}

interface MilestoneRowProps {
  milestone: ProjectMilestone;
  onEdit: () => void;
  onDelete: () => void;
}

function MilestoneRow({ milestone, onEdit, onDelete }: MilestoneRowProps) {
  const { label, status, dueDate, driveLink } = milestone;
  const [open, setOpen] = useState(false);
  return (
    <li className="group rounded-lg border border-white/6 bg-white/[0.02] transition-colors hover:bg-white/[0.05]">
      {/* Summary line — clicking it expands the detailed items below. */}
      <div
        className="flex items-center gap-2 px-2 py-2"
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-90 text-zinc-300",
          )}
        />
        <div className="min-w-0 flex-1">
          {driveLink ? (
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate text-[11px] font-medium text-zinc-100 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate">{label}</span>
              <ExternalLink className="h-2.5 w-2.5 shrink-0 text-zinc-400" />
            </a>
          ) : (
            <span className="block truncate text-[11px] font-medium text-zinc-100">
              {label}
            </span>
          )}
        </div>
        <StatusPill status={status} />
        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-zinc-400">
          {formatMilestoneDate(dueDate)}
        </span>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            aria-label={`Edit ${label}`}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
            aria-label={`Delete ${label}`}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-white/8 px-3 py-2.5">
          <MilestoneDetail milestone={milestone} />
        </div>
      ) : null}
    </li>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-emerald-400/80"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

interface ProjectTeamSubsectionProps {
  roles: ProjectTeamRole[];
  onAdd: () => void;
  onEdit: (r: ProjectTeamRole) => void;
  onDelete: (r: ProjectTeamRole) => void;
}

function ProjectTeamSubsection({
  roles,
  onAdd,
  onEdit,
  onDelete,
}: ProjectTeamSubsectionProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-200">
          Project Team
        </h4>
        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
          <Users className="h-3 w-3" />
          {roles.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {roles.length === 0 ? (
          <li className="rounded-lg border border-dashed border-white/10 px-2 py-3 text-center text-[11px] text-zinc-500">
            No team members assigned.
          </li>
        ) : (
          roles.map((r) => (
            <li
              key={r.id}
              className="group flex items-center gap-2 rounded-lg border border-white/6 bg-white/[0.02] px-2 py-1.5"
            >
              <Avatar name={r.name} size="sm" color="#3B82F6" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold text-zinc-100">
                  {r.name}
                </div>
                <div className="truncate text-[11px] text-zinc-400">
                  {r.role}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                  <span className="inline-flex items-center gap-1 truncate">
                    <Phone className="h-2.5 w-2.5" />
                    <span className="truncate font-mono">{r.phone}</span>
                  </span>
                  <span className="truncate">{r.email}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => onEdit(r)}
                  className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                  aria-label={`Edit ${r.name}`}
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(r)}
                  className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
                  aria-label={`Remove ${r.name}`}
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-white/12 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/25 hover:bg-white/[0.04] hover:text-zinc-100"
      >
        <UserPlus className="h-3 w-3" />
        Add team member
      </button>
    </div>
  );
}

interface TeamRoleFormDialogProps {
  open: boolean;
  projectId: string;
  editing?: ProjectTeamRole | null;
  onClose: () => void;
  onSubmit: (draft: ProjectTeamRoleDraft, editingId?: string) => void;
}

function emptyTeamDraft(projectId: string): ProjectTeamRoleDraft {
  return { projectId, name: "", role: "", phone: "", email: "" };
}

/** Local, inline form for project-team rows. Kept here (not split into a
 *  separate file) because it's only ever used by the tracker and has just
 *  four fields — splitting it out would be premature abstraction. */
function TeamRoleFormDialog({
  open,
  projectId,
  editing,
  onClose,
  onSubmit,
}: TeamRoleFormDialogProps) {
  const [draft, setDraft] = useState<ProjectTeamRoleDraft>(() =>
    emptyTeamDraft(projectId),
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { id: _id, ...rest } = editing;
      void _id;
      setDraft(rest);
    } else {
      setDraft(emptyTeamDraft(projectId));
    }
  }, [open, editing, projectId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isValid =
    draft.name.trim().length > 0 &&
    draft.role.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(draft.email);

  if (!open) return null;

  const set = <K extends keyof ProjectTeamRoleDraft>(
    key: K,
    value: ProjectTeamRoleDraft[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(
      {
        ...draft,
        name: draft.name.trim(),
        role: draft.role.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
      },
      editing?.id,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[8vh] backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
      >
        <header className="flex items-center justify-between border-b border-white/8 px-5 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              {editing ? "Edit team member" : "Add team member"}
            </div>
            <div className="text-sm font-semibold text-zinc-50">
              {editing ? editing.name : "New team member"}
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Name <span className="text-rose-300"> ·</span>
            </span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-white/30"
              placeholder="Full name"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Role <span className="text-rose-300"> ·</span>
            </span>
            <input
              type="text"
              value={draft.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-white/30"
              placeholder="e.g. Project Manager"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Phone
            </span>
            <input
              type="tel"
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-white/30"
              placeholder="+62..."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Email <span className="text-rose-300"> ·</span>
            </span>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-white/30"
              placeholder="name@example.com"
            />
          </label>

          <footer className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t border-white/8 bg-white/[0.02] px-5 py-3">
            <span className="mr-auto text-[10px] uppercase tracking-wider text-zinc-500">
              Esc to close · Enter to save
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/8 hover:text-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[11px] font-semibold",
                isValid
                  ? "bg-white/85 text-zinc-900 hover:bg-white"
                  : "cursor-not-allowed bg-white/10 text-zinc-500",
              )}
            >
              {editing ? "Save changes" : "Add member"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
