"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookOpenCheck, Clock3, FileText, Hash, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { MarkdownView, extractHeadings } from "@/presentation/shared/MarkdownView";
import type { KnowledgeArticle } from "@/infrastructure/data/knowledge.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { useKnowledgeStore } from "@/state/knowledge.store";
import { useToast } from "@/state/toast.store";
import { useHotkey } from "@/hooks/useHotkey";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { SearchInput } from "@/presentation/shared/SearchInput";
import { Avatar } from "@/presentation/shared/Avatar";
import { KnowledgeCategoryGrid } from "./KnowledgeCategoryGrid";
import { ArticleFormDialog } from "./ArticleFormDialog";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function KnowledgeBaseView() {
  const articles = useKnowledgeStore((s) => s.items);
  const hydrate = useKnowledgeStore((s) => s.hydrate);
  const addArticle = useKnowledgeStore((s) => s.add);
  const updateArticle = useKnowledgeStore((s) => s.update);
  const removeArticle = useKnowledgeStore((s) => s.remove);
  const toast = useToast();

  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KnowledgeArticle | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Auto-select the first article once data is available — preserves the
  // existing UX where the right pane shows something on load.
  useEffect(() => {
    if (!selectedId && articles.length > 0) setSelectedId(articles[0].id);
    if (selectedId && !articles.some((a) => a.id === selectedId)) {
      setSelectedId(articles[0]?.id ?? null);
    }
  }, [articles, selectedId]);

  const selected = selectedId ? articles.find((a) => a.id === selectedId) ?? null : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category && a.category !== category) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
    });
  }, [articles, category, query]);

  const bookmarked = articles.filter((a) => a.bookmarked);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: KnowledgeArticle) => {
    setEditing(a);
    setFormOpen(true);
  };

  useHotkey("mod+n", (e) => {
    e.preventDefault();
    openCreate();
  });

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
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
          >
            <Plus className="h-3 w-3" />
            New article
          </button>
          <ManageMasterDataButton moduleId="knowledge" />
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          emphasis
          icon={BookOpenCheck}
          label="Articles"
          value={String(articles.length)}
          delta={`${new Set(articles.map((a) => a.category)).size} categories`}
        />
        <MetricCard icon={Bookmark} label="Bookmarked" value={String(bookmarked.length)} accent="#F59E0B" />
        <MetricCard
          icon={Sparkles}
          label="Recently updated"
          value={String(articles.filter((a) => a.updatedAt >= "2026-04-01").length)}
          accent="#22C55E"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader eyebrow="Browse" title="Categories" />
        <KnowledgeCategoryGrid articles={articles} category={category} onSelect={setCategory} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_560px]">
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Library" title={`Articles (${filtered.length})`} />
          <ul className="space-y-2">
            {filtered.map((a) => {
              const author = teamMap.get(a.authorId);
              const isActive = selected?.id === a.id;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => setSelectedId(a.id)}
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
            <WikiPage
              article={selected}
              authorName={teamMap.get(selected.authorId)?.name}
              onEdit={() => openEdit(selected)}
              onDelete={() => setConfirmDelete(selected)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
              Pick an article to start reading.
            </div>
          )}
        </aside>
      </div>

      <ArticleFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateArticle(editingId, draft);
            toast.success("Article updated", draft.title);
          } else {
            const created = addArticle(draft);
            setSelectedId(created.id);
            toast.success("Article published", draft.title);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Remove article?"
        description={
          confirmDelete
            ? `${confirmDelete.title} will be removed from the knowledge base. Bookmarks and links break.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const title = confirmDelete.title;
          removeArticle(confirmDelete.id);
          setConfirmDelete(null);
          toast.info("Article removed", `${title} has been archived.`);
        }}
      />
    </div>
  );
}

function WikiPage({
  article,
  authorName,
  onEdit,
  onDelete,
}: {
  article: KnowledgeArticle;
  authorName?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const body = article.body ?? article.excerpt;
  const headings = body ? extractHeadings(body) : [];
  return (
    <div className="space-y-4">
      {/* Title block */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-zinc-500">
            <FileText className="h-3 w-3" />
            <span>{article.category}</span>
            <span className="text-zinc-700">·</span>
            <span>Updated {formatDate(article.updatedAt)}</span>
            <span className="text-zinc-700">·</span>
            <span>{article.readMinutes}m read</span>
          </div>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-50">
            {article.title}
          </h2>
        </div>
        <div className="mt-1 flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit article"
            title="Edit"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete article"
            title="Delete"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tags + author */}
      <div className="flex flex-wrap items-center gap-2 border-y border-white/6 py-2">
        {authorName ? (
          <span className="text-[10px] text-zinc-400">
            by <span className="text-zinc-200">{authorName}</span>
          </span>
        ) : null}
        {article.tags && article.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {article.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300"
              >
                <Hash className="h-2.5 w-2.5 opacity-70" />
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {article.bookmarked ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-amber-200">
            <Bookmark className="h-2.5 w-2.5" />
            Bookmarked
          </span>
        ) : null}
      </div>

      {/* TOC — only if there are 2+ headings to navigate */}
      {headings.length >= 2 ? (
        <nav
          aria-label="Table of contents"
          className="glass-soft rounded-xl border border-white/8 px-3 py-2"
        >
          <div className="mb-1 text-[9px] uppercase tracking-[0.22em] text-zinc-500">
            On this page
          </div>
          <ul className="space-y-0.5">
            {headings.map((h) => (
              <li
                key={h.id}
                style={{ paddingLeft: (h.level - 1) * 10 }}
                className="text-[11px]"
              >
                <a
                  href={`#${h.id}`}
                  className={cn(
                    "block truncate rounded px-1 py-0.5 transition-colors",
                    h.level === 1
                      ? "font-semibold text-zinc-200 hover:bg-white/8 hover:text-zinc-50"
                      : "text-zinc-400 hover:bg-white/6 hover:text-zinc-200",
                  )}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {/* Body */}
      {article.body ? (
        <MarkdownView source={article.body} />
      ) : (
        <p className="text-xs leading-relaxed text-zinc-300">{article.excerpt}</p>
      )}
    </div>
  );
}
