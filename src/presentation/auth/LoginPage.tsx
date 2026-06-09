"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Moon, Power, RotateCcw } from "lucide-react";
import { Avatar } from "@/presentation/shared/Avatar";
import { WitLogoMark } from "@/presentation/shared/WitLogoMark";
import { useAuthStore } from "@/state/auth.store";
import { useToast } from "@/state/toast.store";
import { cn } from "@/lib/cn";
import { demoNow } from "@/lib/date";

const USER = {
  name: "Damar Wicaksono",
  role: "Director of Operations",
  email: "damar@wit.id",
  avatarColor: "#FBBF24",
};

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(demoNow());
    const id = setInterval(() => setNow(demoNow()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function LoginPage() {
  const signIn = useAuthStore((s) => s.signIn);
  const toast = useToast();
  const now = useClock();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().length === 0) {
      setError("Enter your password to continue");
      return;
    }
    setError(null);
    setBusy(true);
    // Mock auth latency for that satisfying spring-in transition.
    window.setTimeout(() => {
      setBusy(false);
      signIn();
      toast.success(`Welcome back, ${USER.name.split(" ")[0]}`, "Session active.");
    }, 420);
  };

  const dateLabel =
    now?.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) ?? "";
  const timeLabel =
    now?.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    }) ?? "";

  return (
    <div className="auth-bg relative h-screen w-screen overflow-hidden">
      {/* Top-left brand */}
      <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-white/85">
        <WitLogoMark size={18} />
        <span className="text-[11px] font-semibold tracking-[0.18em]">WIT ERP OS</span>
      </div>

      {/* Top-centre clock */}
      <div className="pointer-events-none absolute inset-x-0 top-[7%] flex flex-col items-center text-white">
        <div className="text-[12px] uppercase tracking-[0.32em] text-white/70">
          {dateLabel}
        </div>
        <div className="mt-2 font-light tracking-tight text-[88px] leading-none drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]">
          {timeLabel}
        </div>
      </div>

      {/* Centre sign-in card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.2, 0.9, 0.25, 1.0] }}
        className="absolute left-1/2 top-1/2 w-[min(360px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2"
      >
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <span
                aria-hidden
                className="absolute inset-0 -m-1 rounded-full"
                style={{ boxShadow: `0 0 60px 6px ${USER.avatarColor}55` }}
              />
              <Avatar
                name={USER.name}
                color={USER.avatarColor}
                size="lg"
                className="relative !h-20 !w-20 !text-base ring-2 ring-white/20"
              />
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-white drop-shadow">
              {USER.name}
            </h1>
            <p className="mt-0.5 text-[11px] text-white/70">{USER.role}</p>

            <form onSubmit={handleSubmit} className="mt-6 w-full">
              <label className="relative block">
                <span className="sr-only">Password</span>
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/55" />
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={busy}
                  className={cn(
                    "w-full rounded-full border border-white/15 bg-white/[0.08] px-9 py-2.5 text-center text-[13px] tracking-[0.28em] text-white outline-none transition-all",
                    "placeholder:text-[11px] placeholder:tracking-normal placeholder:text-white/45",
                    "focus:border-white/35 focus:bg-white/[0.12]",
                    error && "border-rose-400/60 focus:border-rose-400/80",
                  )}
                  style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
                />
                <button
                  type="submit"
                  aria-label="Sign in"
                  disabled={busy}
                  className={cn(
                    "absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full transition-all",
                    password.length > 0
                      ? "bg-white text-zinc-900 hover:scale-105"
                      : "bg-white/15 text-white/70",
                    busy && "animate-pulse",
                  )}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </label>
              {error ? (
                <div className="mt-2 text-[10px] text-rose-300">{error}</div>
              ) : (
                <div className="mt-2 text-[10px] text-white/55">
                  Hint · enter anything to sign in (mock auth)
                </div>
              )}
            </form>

            <div className="mt-4 flex items-center gap-2 text-[10px] text-white/60">
              <button
                type="button"
                className="rounded-full px-2 py-1 hover:bg-white/10 hover:text-white"
              >
                Switch user
              </button>
              <span className="h-3 w-px bg-white/20" />
              <button
                type="button"
                className="rounded-full px-2 py-1 hover:bg-white/10 hover:text-white"
              >
                Reset password
              </button>
            </div>
          </div>
      </motion.div>

      {/* Bottom session controls */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-8 flex items-center justify-center gap-3 text-white/80">
        <SessionButton icon={Moon} label="Sleep" />
        <SessionButton icon={RotateCcw} label="Restart" />
        <SessionButton icon={Power} label="Shut Down" />
      </div>

      {/* Footer label */}
      <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-white/45">
        v2026.5 · build {now ? now.getTime().toString().slice(-5) : "0"}
      </div>
    </div>
  );
}

function SessionButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      className="group flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[11px] transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.10]"
      style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
    >
      <Icon className="h-3.5 w-3.5 text-white/75 transition-colors group-hover:text-white" />
      <span className="text-white/85 transition-colors group-hover:text-white">{label}</span>
    </button>
  );
}
