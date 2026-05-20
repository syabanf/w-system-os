"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenCheck, X } from "lucide-react";
import type { KnowledgeArticle } from "@/infrastructure/data/knowledge.mock";
import type { KnowledgeDraft } from "@/state/knowledge.store";
import { cn } from "@/lib/cn";

const CATEGORIES: KnowledgeArticle["category"][] = [
  "SOP",
  "Templates",
  "Tech Stack",
  "API Docs",
  "Onboarding",
  "Delivery Checklist",
];

interface Props {
  open: boolean;
  editing?: KnowledgeArticle | null;
  onClose: () => void;
  onSubmit: (draft: KnowledgeDraft, editingId?: string) => void;
}

function emptyDraft(): KnowledgeDraft {
  return {
    title: "",
    category: "SOP",
    excerpt: "",
    authorId: "tm-001",
    readMinutes: 5,
    bookmarked: false,
    body: "",
    tags: [],
  };
}

function fromArticle(a: KnowledgeArticle): KnowledgeDraft {
  const { id: _id, updatedAt, ...rest } = a;
  void _id;
  return { ...rest, updatedAt };
}

const MD_HINT = `Markdown supported:
# Heading 1
## Heading 2
**bold**  *italic*  \`code\`
- bullet item
1. ordered item
\`\`\`
fenced code block
\`\`\``;

export function ArticleFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState<KnowledgeDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? fromArticle(editing) : emptyDraft());
  }, [open, editing]);

  const set = <K extends keyof KnowledgeDraft>(key: K, value: KnowledgeDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const isValid =
    draft.title.trim().length > 0 && draft.excerpt.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(draft, editing?.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[8vh] backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                <BookOpenCheck className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit article" : "New article"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.title : "Knowledge base entry"}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <Field label="Title" required>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputCls}
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      set("category", e.target.value as KnowledgeArticle["category"])
                    }
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Author ID">
                  <input
                    type="text"
                    value={draft.authorId}
                    onChange={(e) => set("authorId", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Read minutes">
                  <input
                    type="number"
                    value={draft.readMinutes}
                    onChange={(e) => set("readMinutes", Math.max(1, Number(e.target.value) || 1))}
                    className={inputCls}
                    min={1}
                  />
                </Field>
                <label className="mt-5 flex items-center gap-2 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={draft.bookmarked}
                    onChange={(e) => set("bookmarked", e.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-400"
                  />
                  Pin to bookmarks
                </label>
              </div>

              <Field label="Excerpt" required>
                <textarea
                  value={draft.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  className={cn(inputCls, "min-h-[60px] resize-y")}
                  placeholder="One-sentence summary shown in the article list."
                />
              </Field>

              <Field label="Tags (comma-separated)">
                <input
                  type="text"
                  value={(draft.tags ?? []).join(", ")}
                  onChange={(e) =>
                    set(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0),
                    )
                  }
                  className={inputCls}
                  placeholder="onboarding, hiring"
                />
              </Field>

              <Field label="Body (markdown)">
                <textarea
                  value={draft.body ?? ""}
                  onChange={(e) => set("body", e.target.value)}
                  className={cn(
                    inputCls,
                    "min-h-[260px] resize-y font-mono text-[12px] leading-relaxed",
                  )}
                  placeholder={MD_HINT}
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  Supports headings (#, ##, ###), lists, **bold**, *italic*, `code`, and ``` fenced
                  blocks. Plain markdown, no HTML.
                </p>
              </Field>

              <footer className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t border-white/8 bg-white/[0.02] px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/8 hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors",
                    isValid
                      ? "bg-white/85 text-zinc-900 hover:bg-white"
                      : "cursor-not-allowed bg-white/10 text-zinc-500",
                  )}
                >
                  {editing ? "Save changes" : "Publish article"}
                </button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-white/30 focus:bg-white/[0.06]";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
        {required ? <span className="text-rose-300"> ·</span> : null}
      </span>
      {children}
    </label>
  );
}
