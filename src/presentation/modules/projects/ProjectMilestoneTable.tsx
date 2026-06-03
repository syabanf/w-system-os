"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronRight, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import type {
  MilestoneSection,
  ProjectMilestone,
} from "@/domain/entities/ProjectMilestone";
import {
  useMilestonesStore,
  useProjectMilestones,
  type ProjectMilestoneDraft,
} from "@/state/milestones.store";
import { useToast } from "@/state/toast.store";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
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

interface ProjectMilestoneTableProps {
  projectId: string;
}

/**
 * Table presentation of a project's milestones, fully separated into
 * Technical / Commercial **tabs**. Each tab shows only its own category's
 * rows — switching tabs swaps the entire table body.
 */
export function ProjectMilestoneTable({ projectId }: ProjectMilestoneTableProps) {
  const milestones = useProjectMilestones(projectId);
  const addMilestone = useMilestonesStore((s) => s.add);
  const updateMilestone = useMilestonesStore((s) => s.update);
  const removeMilestone = useMilestonesStore((s) => s.remove);
  const toast = useToast();

  const [category, setCategory] = useState<MilestoneCategory>("technical");
  const [formOpen, setFormOpen] = useState(false);
  const [formSection, setFormSection] = useState<MilestoneSection>("workflow");
  const [editing, setEditing] = useState<ProjectMilestone | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProjectMilestone | null>(
    null,
  );
  // Expanded rows reveal the "detailed items" panel inline beneath the row.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Count per category for the tab badges.
  const counts = useMemo(() => {
    const result: Record<MilestoneCategory, ProjectMilestone[]> = {
      technical: [],
      commercial: [],
    };
    for (const m of milestones) {
      const cat = CATEGORY_SECTIONS.technical.includes(m.section)
        ? "technical"
        : "commercial";
      result[cat].push(m);
    }
    return result;
  }, [milestones]);

  const rows = useMemo(() => {
    const order = CATEGORY_SECTIONS[category];
    return [...counts[category]].sort((a, b) => {
      const bySection = order.indexOf(a.section) - order.indexOf(b.section);
      if (bySection !== 0) return bySection;
      return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    });
  }, [counts, category]);

  const pct = progressOf(counts[category]);

  const openCreate = () => {
    setEditing(null);
    setFormSection(CATEGORY_SECTIONS[category][0]);
    setFormOpen(true);
  };

  const openEdit = (m: ProjectMilestone) => {
    setEditing(m);
    setFormSection(m.section);
    setFormOpen(true);
  };

  const handleSubmit = (draft: ProjectMilestoneDraft, editingId?: string) => {
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

  return (
    <div className="glass rounded-[20px] p-4">
      {/* Category tabs — fully separate the table between Technical / Commercial */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Milestone category"
          className="inline-flex rounded-full bg-white/5 p-0.5"
        >
          {CATEGORY_ORDER.map((cat) => {
            const active = cat === category;
            const accent = CATEGORY_ACCENT[cat];
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(cat)}
                className={cn(
                  "press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                  active
                    ? "bg-white/12 text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                />
                {CATEGORY_LABEL[cat]}
                <span className="rounded-full bg-white/10 px-1.5 text-[10px] font-mono text-zinc-300">
                  {counts[cat].length}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-400">{pct}% done</span>
          <button
            type="button"
            onClick={openCreate}
            className="press inline-flex items-center gap-1 rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-white/12"
          >
            <Plus className="h-3 w-3" />
            Add milestone
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <th className="px-2 py-2 font-semibold">Milestone</th>
              <th className="px-2 py-2 font-semibold">Section</th>
              <th className="px-2 py-2 font-semibold">Status</th>
              <th className="px-2 py-2 text-right font-semibold">Due</th>
              <th className="px-2 py-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-2 py-8 text-center text-[11px] text-zinc-500"
                >
                  No {CATEGORY_LABEL[category].toLowerCase()} milestones yet.
                </td>
              </tr>
            ) : (
              rows.map((m) => {
                const isOpen = expanded.has(m.id);
                return (
                  <Fragment key={m.id}>
                    <tr
                      onClick={() => toggleExpanded(m.id)}
                      aria-expanded={isOpen}
                      className={cn(
                        "group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]",
                        isOpen && "bg-white/[0.04]",
                      )}
                    >
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <ChevronRight
                            className={cn(
                              "h-3 w-3 shrink-0 text-zinc-500 transition-transform",
                              isOpen && "rotate-90 text-zinc-300",
                            )}
                          />
                          {m.driveLink ? (
                            <a
                              href={m.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-100 hover:underline"
                            >
                              {m.label}
                              <ExternalLink className="h-2.5 w-2.5 text-zinc-400" />
                            </a>
                          ) : (
                            <span className="text-[11px] font-medium text-zinc-100">
                              {m.label}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-[11px] text-zinc-400">
                        {SECTION_TITLE[m.section]}
                      </td>
                      <td className="px-2 py-2">
                        <StatusPill status={m.status} />
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-[11px] text-zinc-400">
                        {formatMilestoneDate(m.dueDate)}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(m);
                            }}
                            className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                            aria-label={`Edit ${m.label}`}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(m);
                            }}
                            className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
                            aria-label={`Delete ${m.label}`}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-white/5 bg-white/[0.015]">
                        <td colSpan={5} className="px-3 pb-3 pt-1">
                          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                            <MilestoneDetail milestone={m} />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
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
    </div>
  );
}
