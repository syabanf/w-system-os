"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Database, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useMasterDataStore, MASTER_DATA_CATEGORIES } from "@/state/masterData.store";
import type { MDCategoryDef, MDFieldDef, MDItem } from "@/domain/entities/MasterData";
import { APP_MODULE_MAP } from "@/constants/appModules";
import { cn } from "@/lib/cn";
import { StatusBadge } from "./StatusBadge";

export function MasterDataDrawer() {
  const isOpen = useMasterDataStore((s) => s.isDrawerOpen);
  const activeModuleId = useMasterDataStore((s) => s.activeModuleId);
  const activeCategoryId = useMasterDataStore((s) => s.activeCategoryId);
  const closeDrawer = useMasterDataStore((s) => s.closeDrawer);
  const setActiveCategory = useMasterDataStore((s) => s.setActiveCategory);
  const itemsByCategory = useMasterDataStore((s) => s.itemsByCategory);
  const addItem = useMasterDataStore((s) => s.addItem);
  const updateItem = useMasterDataStore((s) => s.updateItem);
  const deleteItem = useMasterDataStore((s) => s.deleteItem);
  const resetCategory = useMasterDataStore((s) => s.resetCategory);

  const moduleCategories = useMemo(
    () =>
      activeModuleId
        ? MASTER_DATA_CATEGORIES.filter((c) => c.module === activeModuleId)
        : [],
    [activeModuleId],
  );

  const category =
    moduleCategories.find((c) => c.id === activeCategoryId) ?? moduleCategories[0] ?? null;
  const items = category ? itemsByCategory[category.id] ?? [] : [];

  const [editing, setEditing] = useState<MDItem | "new" | null>(null);

  useEffect(() => {
    setEditing(null);
  }, [category?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) setEditing(null);
        else closeDrawer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, editing, closeDrawer]);

  const moduleAccent = activeModuleId ? APP_MODULE_MAP[activeModuleId] : null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/45 backdrop-blur-md"
          onClick={closeDrawer}
        >
          <motion.aside
            initial={{ x: 540, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 540, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong flex h-full w-[min(720px,calc(100vw-32px))] flex-col overflow-hidden rounded-l-3xl border-l border-white/10 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.7)]"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/8 text-zinc-200">
                <Database className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {moduleAccent?.name ?? "System"} · Master Data
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {category?.label ?? "Manage reference data"}
                </div>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            {moduleCategories.length === 0 ? (
              <div className="grid flex-1 place-items-center px-6 text-center text-xs text-zinc-400">
                No master-data categories defined for this module yet.
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden">
                {/* Categories list (sidebar) */}
                <nav className="w-44 shrink-0 border-r border-white/8 p-2">
                  <ul className="space-y-0.5">
                    {moduleCategories.map((c) => {
                      const isActive = category?.id === c.id;
                      const count = itemsByCategory[c.id]?.length ?? 0;
                      return (
                        <li key={c.id}>
                          <button
                            onClick={() => setActiveCategory(c.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors",
                              isActive
                                ? "bg-white/10 text-zinc-50"
                                : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200",
                            )}
                          >
                            <span className="truncate">{c.label}</span>
                            <span className="ml-2 rounded-full bg-white/8 px-1.5 text-[9px] text-zinc-300">
                              {count}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Main pane: table + add/edit form */}
                <section className="glass-scroll flex flex-1 flex-col overflow-y-auto">
                  {category ? (
                    <div className="p-5">
                      <header className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-50">{category.label}</div>
                          {category.description ? (
                            <div className="text-[11px] text-zinc-400">{category.description}</div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => resetCategory(category.id)}
                            title="Reset to seed defaults"
                            className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                          </button>
                          <button
                            onClick={() => setEditing("new")}
                            className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[10px] font-semibold text-zinc-50 hover:bg-white/20"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </button>
                        </div>
                      </header>

                      <MasterDataTable
                        category={category}
                        items={items}
                        onEdit={(item) => setEditing(item)}
                        onDelete={(id) => deleteItem(category.id, id)}
                      />

                      {editing ? (
                        <MasterDataForm
                          category={category}
                          initial={editing === "new" ? null : editing}
                          onCancel={() => setEditing(null)}
                          onSubmit={(payload) => {
                            if (editing === "new") {
                              addItem(category.id, payload);
                            } else {
                              updateItem(category.id, editing.id, payload);
                            }
                            setEditing(null);
                          }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </section>
              </div>
            )}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface MasterDataTableProps {
  category: MDCategoryDef;
  items: MDItem[];
  onEdit: (item: MDItem) => void;
  onDelete: (id: string) => void;
}

function MasterDataTable({ category, items, onEdit, onDelete }: MasterDataTableProps) {
  const displayFields = category.displayKeys
    ? (category.displayKeys
        .map((k) => category.fields.find((f) => f.key === k))
        .filter(Boolean) as MDFieldDef[])
    : category.fields;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
        No items yet. Tap “Add” to create one.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/[0.03]">
          <tr>
            {displayFields.map((f) => (
              <th
                key={f.key}
                className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400"
              >
                {f.label}
              </th>
            ))}
            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={item.id}
              className={cn(
                "border-t border-white/5 transition-colors hover:bg-white/[0.04]",
                i % 2 === 1 && "bg-white/[0.015]",
              )}
            >
              {displayFields.map((f) => (
                <td key={f.key} className="px-3 py-2 text-zinc-200">
                  {renderCell(f, item[f.key])}
                </td>
              ))}
              <td className="px-3 py-1.5 text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => onEdit(item)}
                    aria-label="Edit"
                    className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        const ok = window.confirm(
                          `Delete this entry from ${category.label}?`,
                        );
                        if (!ok) return;
                      }
                      onDelete(item.id);
                    }}
                    aria-label="Delete"
                    className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-rose-500/12 hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(field: MDFieldDef, value: unknown) {
  if (field.type === "boolean") {
    return <StatusBadge tone={value ? "success" : "neutral"}>{value ? "yes" : "no"}</StatusBadge>;
  }
  if (field.type === "color" && typeof value === "string") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full ring-1 ring-white/15" style={{ background: value }} />
        <span className="font-mono text-[10px] text-zinc-400">{value}</span>
      </span>
    );
  }
  if (field.type === "number" && typeof value === "number") {
    return <span className="font-mono">{value.toLocaleString("en-US")}</span>;
  }
  if (value == null || value === "") return <span className="text-zinc-500">—</span>;
  return String(value);
}

interface MasterDataFormProps {
  category: MDCategoryDef;
  initial: MDItem | null;
  onCancel: () => void;
  onSubmit: (payload: Omit<MDItem, "id">) => void;
}

function MasterDataForm({ category, initial, onCancel, onSubmit }: MasterDataFormProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    const seed: Record<string, unknown> = {};
    category.fields.forEach((f) => {
      seed[f.key] =
        initial?.[f.key] ??
        (f.type === "boolean" ? false : f.type === "number" ? 0 : "");
    });
    return seed;
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // basic required validation
    for (const f of category.fields) {
      if (f.required && (draft[f.key] === "" || draft[f.key] == null)) return;
    }
    onSubmit(draft as Omit<MDItem, "id">);
  };

  return (
    <form
      onSubmit={submit}
      className="glass-soft mt-4 rounded-2xl border border-white/10 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          {initial ? "Edit entry" : "New entry"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {category.fields.map((f) => (
          <FieldInput
            key={f.key}
            field={f}
            value={draft[f.key]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.05] hover:text-zinc-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-50 hover:bg-white/20"
        >
          {initial ? "Save" : "Create"}
        </button>
      </div>
    </form>
  );
}

interface FieldInputProps {
  field: MDFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const baseInput =
    "w-full rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-white/25 focus:bg-white/8 focus:outline-none";

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-zinc-400">
        {field.label}
        {field.required ? <span className="ml-1 text-rose-300">*</span> : null}
      </span>
      {field.type === "text" ? (
        <input
          type="text"
          required={field.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        />
      ) : field.type === "number" ? (
        <input
          type="number"
          required={field.required}
          value={(value as number) ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={baseInput}
        />
      ) : field.type === "color" ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(value as string) || "#A1A1AA"}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent"
          />
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={baseInput}
          />
        </div>
      ) : field.type === "boolean" ? (
        <button
          type="button"
          onClick={() => onChange(!(value as boolean))}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
            value
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/[0.05] text-zinc-400",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              value ? "bg-emerald-400" : "bg-zinc-500",
            )}
          />
          {value ? "Enabled" : "Disabled"}
        </button>
      ) : field.type === "select" ? (
        <select
          required={field.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        >
          <option value="" disabled>
            — choose —
          </option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : null}
      {field.hint ? (
        <span className="text-[9px] text-zinc-500">{field.hint}</span>
      ) : null}
    </label>
  );
}
