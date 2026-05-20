"use client";

import { useMemo } from "react";

/** Minimal in-app markdown renderer.
 *
 *  Supports the small subset our wiki authors actually use:
 *   - `# / ## / ###` headings (each becomes a node with an `id` slug for TOC links)
 *   - paragraphs separated by blank lines
 *   - `- ` bullet lists (single level)
 *   - `1.` ordered lists (single level)
 *   - ```` ``` ```` fenced code blocks (no language highlighting)
 *   - `**bold**`, `*italic*`, `` `inline code` ``
 *   - simple `[label](url)` links — only http(s):// and # anchors are rendered
 *     as <a>; anything else falls back to plain text.
 *
 *  We deliberately avoid raw HTML and a real markdown library — this keeps the
 *  surface small, predictable, and XSS-safe by construction. */

export interface MarkdownHeading {
  level: 1 | 2 | 3;
  text: string;
  id: string;
}

export function extractHeadings(source: string): MarkdownHeading[] {
  const out: MarkdownHeading[] = [];
  const seen = new Map<string, number>();
  const slugify = (s: string) => {
    const base = s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
  for (const line of source.split("\n")) {
    const m = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (m) {
      const level = m[1].length as 1 | 2 | 3;
      const text = m[2];
      out.push({ level, text, id: slugify(text) });
    }
  }
  return out;
}

interface MarkdownViewProps {
  source: string;
  /** Optional className applied to the outer container. */
  className?: string;
}

export function MarkdownView({ source, className = "" }: MarkdownViewProps) {
  const nodes = useMemo(() => parse(source), [source]);
  return (
    <div className={`wiki-body space-y-3 text-[13px] leading-relaxed text-zinc-300 ${className}`}>
      {nodes}
    </div>
  );
}

// ── Inline parser ────────────────────────────────────────────────────────────

type InlineNode = string | { kind: "bold" | "italic" | "code" | "link"; text: string; href?: string };

function parseInline(text: string): React.ReactNode[] {
  // Tokenize via a regex that matches each inline form. Order matters: code
  // first (so we don't try to bold inside `**` inside backticks), then bold,
  // then italic, then links.
  const tokens: InlineNode[] = [];
  let remaining = text;
  // Combined regex: code | bold | italic | link
  // The lookbehind guards on `*` avoid matching `**` as italic and vice versa.
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/;
  while (remaining.length > 0) {
    const m = re.exec(remaining);
    if (!m) {
      tokens.push(remaining);
      break;
    }
    if (m.index > 0) tokens.push(remaining.slice(0, m.index));
    const matched = m[0];
    if (matched.startsWith("`")) {
      tokens.push({ kind: "code", text: matched.slice(1, -1) });
    } else if (matched.startsWith("**")) {
      tokens.push({ kind: "bold", text: matched.slice(2, -2) });
    } else if (matched.startsWith("*")) {
      tokens.push({ kind: "italic", text: matched.slice(1, -1) });
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(matched);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        tokens.push({ kind: "link", text: label, href });
      } else {
        tokens.push(matched);
      }
    }
    remaining = remaining.slice(m.index + matched.length);
  }

  return tokens.map((tok, i) => {
    if (typeof tok === "string") return <span key={i}>{tok}</span>;
    if (tok.kind === "bold")
      return (
        <strong key={i} className="font-semibold text-zinc-100">
          {tok.text}
        </strong>
      );
    if (tok.kind === "italic")
      return (
        <em key={i} className="italic">
          {tok.text}
        </em>
      );
    if (tok.kind === "code")
      return (
        <code
          key={i}
          className="rounded-md bg-white/8 px-1.5 py-0.5 font-mono text-[12px] text-zinc-100"
        >
          {tok.text}
        </code>
      );
    // link — only accept safe schemes; otherwise render the label as plain text.
    const safe =
      tok.href !== undefined &&
      (tok.href.startsWith("http://") ||
        tok.href.startsWith("https://") ||
        tok.href.startsWith("#"));
    if (!safe) return <span key={i}>{tok.text}</span>;
    return (
      <a
        key={i}
        href={tok.href}
        target={tok.href!.startsWith("#") ? undefined : "_blank"}
        rel={tok.href!.startsWith("#") ? undefined : "noopener noreferrer"}
        className="text-rose-300 underline-offset-2 hover:underline"
      >
        {tok.text}
      </a>
    );
  });
}

// ── Block parser ─────────────────────────────────────────────────────────────

function parse(source: string): React.ReactNode[] {
  const lines = source.split("\n");
  const nodes: React.ReactNode[] = [];
  const seen = new Map<string, number>();
  const slugify = (s: string) => {
    const base = s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };

  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block.
    if (line.trim().startsWith("```")) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      // Skip the closing fence if present.
      if (i < lines.length) i += 1;
      nodes.push(
        <pre
          key={key++}
          className="overflow-x-auto rounded-xl border border-white/8 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-zinc-100"
        >
          <code>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Heading.
    const headingMatch = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      const text = headingMatch[2];
      const id = slugify(text);
      const sizeCls =
        level === 1
          ? "text-[18px] font-semibold tracking-tight text-zinc-50"
          : level === 2
            ? "text-[15px] font-semibold text-zinc-50"
            : "text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-300";
      const marginCls = level === 1 ? "mt-2" : level === 2 ? "mt-4" : "mt-3";
      const Tag = (level === 1 ? "h2" : level === 2 ? "h3" : "h4") as keyof React.JSX.IntrinsicElements;
      nodes.push(
        <Tag key={key++} id={id} className={`${sizeCls} ${marginCls} scroll-mt-16`}>
          {parseInline(text)}
        </Tag>,
      );
      i += 1;
      continue;
    }

    // Bullet list.
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      nodes.push(
        <ul key={key++} className="ml-4 list-disc space-y-1 marker:text-zinc-600">
          {items.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list.
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      nodes.push(
        <ol key={key++} className="ml-4 list-decimal space-y-1 marker:text-zinc-600">
          {items.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Blank line — just skip; spacing handled by container.
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Paragraph: accumulate consecutive non-empty, non-special lines.
    const paragraph: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("```")
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    nodes.push(
      <p key={key++} className="text-zinc-300">
        {parseInline(paragraph.join(" "))}
      </p>,
    );
  }

  return nodes;
}
