"use client";

import { useMemo, useState } from "react";
import { Bookmark, BookOpenCheck, Clock3, Sparkles } from "lucide-react";
import { mockKnowledge, type KnowledgeArticle } from "@/infrastructure/data/knowledge.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { Avatar } from "@/presentation/shared/Avatar";
import { KnowledgeCategoryGrid } from "./KnowledgeCategoryGrid";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function KnowledgeBaseView() {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<KnowledgeArticle | null>(mockKnowledge[0]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockKnowledge.filter((a) => {
      if (category && a.category !== category) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const bookmarked = mockKnowledge.filter((a) => a.bookmarked);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            System · Knowledge
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">Knowledge base</h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            SOPs, templates, tech stack standards, and onboarding paths — everything we build with.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search docs…"
            className="w-full sm:w-auto md:w-72 lg:w-80"
          />
          <ManageMasterDataButton moduleId="knowledge" />
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard emphasis icon={BookOpenCheck} label="Articles" value={String(mockKnowledge.length)} delta={`${new Set(mockKnowledge.map((a) => a.category)).size} categories`} />
        <MetricCard icon={Bookmark} label="Bookmarked" value={String(bookmarked.length)} accent="#F59E0B" />
        <MetricCard icon={Sparkles} label="Recently updated" value={String(mockKnowledge.filter((a) => a.updatedAt >= "2026-04-01").length)} accent="#22C55E" />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Browse" title="Categories" />
        <KnowledgeCategoryGrid articles={mockKnowledge} category={category} onSelect={setCategory} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,420px]">
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Library" title={`Articles (${filtered.length})`} />
          <ul className="space-y-2">
            {filtered.map((a) => {
              const author = teamMap.get(a.authorId);
              const isActive = selected?.id === a.id;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => setSelected(a)}
                    className={cn(
                      "glass-soft flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5",
                      isActive ? "border-white/25 bg-white/8" : "border-white/8",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-zinc-100">{a.title}</span>
                        <span className="rounded-full bg-white/8 px-1.5 text-[9px] uppercase tracking-wider text-zinc-300">
                          {a.category}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-zinc-400">{a.excerpt}</div>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500">
                        {author ? (
                          <>
                            <Avatar name={author.name} initials={author.initials} color={author.avatarColor} size="sm" />
                            <span>{author.name}</span>
                            <span className="text-zinc-600">·</span>
                          </>
                        ) : null}
                        <Clock3 className="h-3 w-3" />
                        <span>{a.readMinutes}m read</span>
                        <span className="text-zinc-600">·</span>
                        <span>Updated {formatDate(a.updatedAt)}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <aside className="glass rounded-[20px] p-5">
          {selected ? (
            <>
              <SectionHeader
                eyebrow={selected.category}
                title={selected.title}
                description={`Updated ${formatDate(selected.updatedAt)}`}
              />
              <p className="text-xs leading-relaxed text-zinc-300">{selected.excerpt}</p>
              <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
                This article is a mock preview. In production, the full document, attachments, comments
                and revision history would render here, with linked artifacts surfaced from the
                Knowledge service.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                <div className="glass-soft rounded-xl border border-white/6 p-3">
                  <div className="uppercase tracking-wider text-zinc-500">Read time</div>
                  <div className="mt-1 text-zinc-100">{selected.readMinutes} minutes</div>
                </div>
                <div className="glass-soft rounded-xl border border-white/6 p-3">
                  <div className="uppercase tracking-wider text-zinc-500">Bookmark</div>
                  <div className="mt-1 text-zinc-100">{selected.bookmarked ? "Yes" : "No"}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
              Select an article to preview.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
