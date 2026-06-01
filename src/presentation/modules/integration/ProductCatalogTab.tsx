"use client";

import { useMemo } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { mockKnowledge } from "@/infrastructure/data/knowledge.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { useToast } from "@/state/toast.store";
import { cn } from "@/lib/cn";
import { PastelKPITile } from "./PastelKPITile";

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

  const sorted = useMemo(
    () => [...mockKnowledge].sort((a, b) => b.readMinutes - a.readMinutes),
    [],
  );
  const topDealing = sorted.slice(0, 2);
  const topViewed = sorted.slice(2, 4);

  // Treat SOP/Templates/Tech Stack/etc. as "products" — same as the source
  // module's mock catalog. Services counted via heuristics on category.
  const productCount = mockKnowledge.filter(
    (k) => k.category !== "Onboarding",
  ).length;
  const serviceCount = mockKnowledge.filter(
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
                  <div className="mt-1 text-[10px] text-zinc-400">
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
                  <div className="mt-1 text-[10px] text-zinc-400">
                    {k.readMinutes * 14} View · {Math.max(2, Math.round(k.readMinutes * 2.2))} Download
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <section className="glass rounded-[20px] p-4">
          <header className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Product List
              </div>
              <div className="text-sm font-semibold text-zinc-50">
                All products
              </div>
            </div>
          </header>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/8">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
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
                {mockKnowledge.map((k) => (
                  <tr
                    key={k.id}
                    className="border-t border-white/5 transition-colors hover:bg-white/[0.04]"
                  >
                    <Td>
                      <div className="truncate text-xs font-semibold text-zinc-100">
                        {k.title}
                      </div>
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
                    <Td className="text-[11px] text-zinc-300">{k.category}</Td>
                    <Td className="text-center font-mono text-[11px] text-zinc-300">
                      2
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <RowAction
                          label={`View ${k.title}`}
                          icon={Eye}
                          tone="default"
                          onClick={() => toast.info("Opening product", k.title)}
                        />
                        <RowAction
                          label={`Edit ${k.title}`}
                          icon={Pencil}
                          tone="default"
                          onClick={() => toast.info("Edit triggered", k.title)}
                        />
                        <RowAction
                          label={`Delete ${k.title}`}
                          icon={Trash2}
                          tone="danger"
                          onClick={() =>
                            toast.warning("Delete demo", `${k.title} (no-op)`)
                          }
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
        "grid h-6 w-6 place-items-center rounded text-zinc-400 transition-colors",
        tone === "danger"
          ? "hover:bg-rose-500/15 hover:text-rose-300"
          : "hover:bg-white/10 hover:text-zinc-100",
      )}
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}
