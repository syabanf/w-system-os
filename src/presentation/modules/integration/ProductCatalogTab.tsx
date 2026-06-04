"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { KnowledgeArticle } from "@/infrastructure/data/knowledge.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { useKnowledgeStore } from "@/state/knowledge.store";
import { useToast } from "@/state/toast.store";
import { NewButton } from "@/presentation/shared/NewButton";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { ArticleFormDialog } from "@/presentation/modules/knowledge/ArticleFormDialog";
import { BulkActionBar } from "@/presentation/shared/BulkActionBar";
import { EditableCell } from "@/presentation/shared/EditableCell";
import { useRowSelection } from "@/hooks/useRowSelection";
import { cn } from "@/lib/cn";
import { PastelKPITile } from "./PastelKPITile";

const CATEGORY_OPTIONS: KnowledgeArticle["category"][] = [
  "SOP",
  "Templates",
  "Tech Stack",
  "API Docs",
  "Onboarding",
  "Delivery Checklist",
];

function teamName(id: string): string {
  return mockTeam.find((t) => t.id === id)?.name ?? "—";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProductCatalogTab() {
  const toast = useToast();

  // Products are knowledge-base entries — go through the store so edits/deletes
  // persist and stay in sync with the Knowledge module.
  const products = useKnowledgeStore((s) => s.items);
  const hydrate = useKnowledgeStore((s) => s.hydrate);
  const addProduct = useKnowledgeStore((s) => s.add);
  const updateProduct = useKnowledgeStore((s) => s.update);
  const removeProduct = useKnowledgeStore((s) => s.remove);

  const sel = useRowSelection();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KnowledgeArticle | null>(
    null,
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (k: KnowledgeArticle) => {
    setEditing(k);
    setFormOpen(true);
  };

  const sorted = useMemo(
    () => [...products].sort((a, b) => b.readMinutes - a.readMinutes),
    [products],
  );
  const topDealing = sorted.slice(0, 2);
  const topViewed = sorted.slice(2, 4);

  // The table body maps over `products` as-is, so every product id is visible.
  const visibleIds = products.map((k) => k.id);

  // Treat SOP/Templates/Tech Stack/etc. as "products" — same as the source
  // module's mock catalog. Services counted via heuristics on category.
  const productCount = products.filter(
    (k) => k.category !== "Onboarding",
  ).length;
  const serviceCount = products.filter(
    (k) => k.category === "Onboarding" || k.category === "Delivery Checklist",
  ).length || 10;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-[1fr_1fr_2fr]">
        <PastelKPITile tone="cream" value={String(productCount)} label="Product" />
        <PastelKPITile tone="mint" value={String(serviceCount)} label="Services" />
        <div className="glass grid place-items-center rounded-[20px] p-4 text-center">
          <div>
            <div className="text-xs text-zinc-400">New</div>
            <div className="text-2xl font-bold text-zinc-50">
              20 Product
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Added this month
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel title="Most Dealing Product">
            <ul className="space-y-2">
              {topDealing.map((k) => (
                <li
                  key={k.id}
                  className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2"
                >
                  <div className="truncate text-xs font-semibold text-zinc-100">
                    {k.title}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {k.readMinutes * 18} Deal · {k.category}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Most View Product">
            <ul className="space-y-2">
              {topViewed.map((k) => (
                <li
                  key={k.id}
                  className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2"
                >
                  <div className="truncate text-xs font-semibold text-zinc-100">
                    {k.title}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {k.readMinutes * 14} View · {Math.max(2, Math.round(k.readMinutes * 2.2))} Download
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <section className="glass rounded-[20px] p-4">
          <header className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Product List
              </div>
              <div className="text-sm font-semibold text-zinc-50">
                All products
              </div>
            </div>
            <NewButton label="New product" onClick={openCreate} size="sm" />
          </header>

          <BulkActionBar
            count={sel.count}
            noun="product"
            onClear={sel.clear}
            actions={[
              {
                label: "Delete",
                icon: Trash2,
                tone: "danger",
                onClick: () => {
                  [...sel.selectedIds].forEach((id) => removeProduct(id));
                  sel.clear();
                },
              },
            ]}
            className="mt-3"
          />

          <div className="mt-3 overflow-hidden rounded-xl border border-white/8">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
                  <Th className="w-9">
                    <input
                      type="checkbox"
                      aria-label="Select all products"
                      className="h-3.5 w-3.5 cursor-pointer rounded border-white/25 bg-white/5 accent-blue-500"
                      checked={sel.allSelected(visibleIds)}
                      ref={(el) => {
                        if (el) el.indeterminate = sel.someSelected(visibleIds);
                      }}
                      onChange={() => sel.toggleAll(visibleIds)}
                    />
                  </Th>
                  <Th>Product</Th>
                  <Th>Last updates</Th>
                  <Th>Created</Th>
                  <Th>PIC</Th>
                  <Th>Category</Th>
                  <Th className="text-center">Ver</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {products.map((k) => (
                  <tr
                    key={k.id}
                    className={cn(
                      "border-t border-white/5 transition-colors hover:bg-white/[0.04]",
                      sel.isSelected(k.id) && "bg-blue-500/10 hover:bg-blue-500/15",
                    )}
                  >
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${k.title}`}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-white/25 bg-white/5 accent-blue-500"
                        checked={sel.isSelected(k.id)}
                        onChange={() => sel.toggle(k.id)}
                      />
                    </Td>
                    <Td>
                      <EditableCell
                        value={k.title}
                        type="text"
                        onSave={(v) => updateProduct(k.id, { title: v as string })}
                        displayClassName="truncate text-xs font-semibold text-zinc-100"
                      />
                    </Td>
                    <Td className="text-[11px] text-zinc-300">
                      {formatDate(k.updatedAt)}
                    </Td>
                    <Td className="text-[11px] text-zinc-300">
                      {formatDate(k.updatedAt)}
                    </Td>
                    <Td className="text-[11px] text-zinc-200">
                      {teamName(k.authorId)}
                    </Td>
                    <Td className="text-[11px] text-zinc-300">
                      <EditableCell
                        value={k.category}
                        type="select"
                        options={CATEGORY_OPTIONS}
                        onSave={(v) =>
                          updateProduct(k.id, {
                            category: v as KnowledgeArticle["category"],
                          })
                        }
                      />
                    </Td>
                    <Td className="text-center font-mono text-[11px] text-zinc-300">
                      2
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <RowAction
                          label={`Edit ${k.title}`}
                          icon={Pencil}
                          tone="default"
                          onClick={() => openEdit(k)}
                        />
                        <RowAction
                          label={`Delete ${k.title}`}
                          icon={Trash2}
                          tone="danger"
                          onClick={() => setConfirmDelete(k)}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ArticleFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateProduct(editingId, draft);
            toast.success("Product updated", draft.title);
          } else {
            addProduct(draft);
            toast.success("Product added", draft.title);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Delete product?"
        description={
          confirmDelete
            ? `${confirmDelete.title} will be removed from the catalog. You can re-create it later.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const { id, updatedAt, ...draft } = confirmDelete;
          void updatedAt;
          removeProduct(id);
          setConfirmDelete(null);
          toast.push({
            tone: "info",
            title: "Product deleted",
            description: draft.title,
            action: { label: "Undo", onClick: () => addProduct(draft) },
          });
        }}
      />
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-[20px] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-3 py-2.5 text-zinc-200", className)}>{children}</td>;
}

interface RowActionProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "danger";
  onClick: () => void;
}

function RowAction({ label, icon: Icon, tone, onClick }: RowActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded text-zinc-400 transition-colors",
        tone === "danger"
          ? "hover:bg-rose-500/15 hover:text-rose-300"
          : "hover:bg-white/10 hover:text-zinc-100",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
