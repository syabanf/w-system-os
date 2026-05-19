"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Eraser,
  Sparkles,
  X,
} from "lucide-react";
import { useReddieStore, type ReddieMessage } from "@/state/reddie.store";
import { cn } from "@/lib/cn";

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-[reddie-bounce_1s_ease-in-out_infinite] rounded-full bg-current opacity-60" />
      <span className="h-1.5 w-1.5 animate-[reddie-bounce_1s_ease-in-out_0.15s_infinite] rounded-full bg-current opacity-60" />
      <span className="h-1.5 w-1.5 animate-[reddie-bounce_1s_ease-in-out_0.3s_infinite] rounded-full bg-current opacity-60" />
    </span>
  );
}

function MessageBubble({ msg, onSuggest }: { msg: ReddieMessage; onSuggest: (s: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[82%] space-y-1.5", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-[12px] leading-relaxed",
            isUser
              ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-[0_4px_18px_-6px_rgba(244,63,94,0.55)]"
              : "bg-white/8 text-zinc-100",
          )}
        >
          {msg.content.split("\n").map((line, i) => (
            <p key={i} className={i > 0 ? "mt-1" : ""}>
              {line}
            </p>
          ))}
        </div>
        {!isUser && msg.suggestions && msg.suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {msg.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggest(s)}
                className="rounded-full border border-rose-300/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-medium text-rose-200 transition-colors hover:bg-rose-500/20 hover:text-rose-100"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ReddieChat() {
  const isOpen = useReddieStore((s) => s.isOpen);
  const messages = useReddieStore((s) => s.messages);
  const isTyping = useReddieStore((s) => s.isTyping);
  const close = useReddieStore((s) => s.close);
  const send = useReddieStore((s) => s.send);
  const clear = useReddieStore((s) => s.clear);
  const markRead = useReddieStore((s) => s.markRead);

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      markRead();
      // Focus input on next tick so the entry animation finishes first.
      const t = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen, markRead]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const value = (text ?? draft).trim();
    if (!value) return;
    send(value);
    setDraft("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="glass-strong z-[55] flex w-[380px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(244,63,94,0.45)] animate-[reddie-pop_220ms_cubic-bezier(0.16,1,0.3,1)_both]"
      style={{
        position: "fixed",
        bottom: 104,
        right: 20,
        height: "min(560px, calc(100vh - 200px))",
      }}
      role="dialog"
      aria-label="Reddie assistant"
    >
          <header className="flex items-center gap-3 border-b border-white/8 bg-gradient-to-r from-rose-500/15 to-pink-500/10 px-4 py-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-[0_6px_18px_-6px_rgba(244,63,94,0.7)]">
              <Sparkles className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white/30 bg-emerald-400" />
            </span>
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-zinc-50">Reddie</span>
                <span className="text-[10px] text-zinc-400">.io</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                Always-on workspace AI
              </div>
            </div>
            <button
              onClick={clear}
              aria-label="Clear conversation"
              title="Clear conversation"
              className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
            >
              <Eraser className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={close}
              aria-label="Close Reddie"
              className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="glass-scroll flex-1 space-y-3 overflow-y-auto px-3 py-4"
          >
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} onSuggest={(s) => handleSend(s)} />
            ))}
            {isTyping ? (
              <div className="flex items-center gap-2 pl-1 text-[11px] text-zinc-400">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-rose-500/20 text-rose-300">
                  <Sparkles className="h-2.5 w-2.5" />
                </span>
                <span className="rounded-2xl bg-white/8 px-3 py-1.5 text-zinc-200">
                  <TypingDots />
                </span>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-white/8 bg-white/[0.03] px-3 py-2.5"
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask Reddie anything…"
              className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-rose-300/40 focus:bg-white/[0.07]"
              aria-label="Message Reddie"
            />
            <button
              type="submit"
              disabled={draft.trim().length === 0}
              aria-label="Send message"
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all",
                draft.trim().length > 0
                  ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-[0_6px_18px_-6px_rgba(244,63,94,0.7)] hover:scale-105"
                  : "cursor-not-allowed bg-white/10 text-zinc-500",
              )}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
    </div>
  );
}
