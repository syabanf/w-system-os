"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardCheck,
  Cog,
  FileCheck2,
  GraduationCap,
  ScrollText,
} from "lucide-react";
import type { KnowledgeArticle } from "@/infrastructure/data/knowledge.mock";
import { cn } from "@/lib/cn";

const CATEGORY_ICON: Record<KnowledgeArticle["category"], LucideIcon> = {
  SOP: ScrollText,
  Templates: ClipboardCheck,
  "Tech Stack": Cog,
  "API Docs": FileCheck2,
  Onboarding: GraduationCap,
  "Delivery Checklist": BookOpen,
};

const CATEGORY_ACCENT: Record<KnowledgeArticle["category"], string> = {
  SOP: "#FAFAF9",
  Templates: "#3B82F6",
  "Tech Stack": "#A855F7",
  "API Docs": "#06B6D4",
  Onboarding: "#22C55E",
  "Delivery Checklist": "#F59E0B",
};

interface Props {
  articles: KnowledgeArticle[];
  category: string | null;
  onSelect: (c: string | null) => void;
}

export function KnowledgeCategoryGrid({ articles, category, onSelect }: Props) {
  const counts = new Map<string, number>();
  articles.forEach((a) => counts.set(a.category, (counts.get(a.category) ?? 0) + 1));

  const categories = Array.from(counts.entries());

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "glass-soft rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5",
          category === null ? "border-white/25 bg-white/8" : "border-white/8",
        )}
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-zinc-200">
          <BookOpen className="h-4 w-4" />
        </span>
        <div className="mt-2 text-xs font-semibold text-zinc-100">All articles</div>
        <div className="text-[10px] text-zinc-400">{articles.length} entries</div>
      </button>
      {categories.map(([cat, count]) => {
        const Icon = CATEGORY_ICON[cat as KnowledgeArticle["category"]];
        const accent = CATEGORY_ACCENT[cat as KnowledgeArticle["category"]];
        const active = category === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              "glass-soft rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5",
              active ? "border-white/25 bg-white/8" : "border-white/8",
            )}
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ background: `${accent}22`, color: accent }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="mt-2 text-xs font-semibold text-zinc-100">{cat}</div>
            <div className="text-[10px] text-zinc-400">{count} entries</div>
          </button>
        );
      })}
    </div>
  );
}
