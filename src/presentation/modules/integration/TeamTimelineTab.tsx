"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Calendar as CalendarIcon,
  CheckSquare,
  Home,
  Package,
  PlayCircle,
  Users,
} from "lucide-react";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { Avatar } from "@/presentation/shared/Avatar";
import { useToast } from "@/state/toast.store";
import { cn } from "@/lib/cn";

type NavId = "announcement" | "task" | "calendar" | "product" | "project";

const NAV_ITEMS: { id: NavId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "announcement", label: "Announcement", icon: Bell },
  { id: "task", label: "Task", icon: CheckSquare },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "product", label: "My Product", icon: Package },
  { id: "project", label: "My Project", icon: Users },
];

const EXTERNAL_APPS: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "back-office", label: "Back Office", icon: Home },
  { id: "attendance", label: "Attendance", icon: CalendarIcon },
  { id: "hr", label: "Human Resource", icon: Users },
];

export function TeamTimelineTab() {
  const toast = useToast();
  const me = mockTeam[0];
  const [activeNav, setActiveNav] = useState<NavId>("project");

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr_280px]">
      <aside className="glass space-y-4 rounded-[20px] p-4">
        <div className="flex flex-col items-center text-center">
          <Avatar name="Irfan Arsandi" color={me.avatarColor} size="lg" />
          <div className="mt-2 text-sm font-semibold text-zinc-50">
            Irfan Arsandi
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
            Chief Executive Officer
          </div>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((n) => {
            const Icon = n.icon;
            const active = activeNav === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setActiveNav(n.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors",
                  active
                    ? "bg-[#2563EB] text-white shadow-[0_8px_22px_-12px_rgba(37,99,235,0.7)]"
                    : "text-zinc-300 hover:bg-white/8 hover:text-zinc-100",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="flex-1 truncate font-medium">{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-2">
          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Connect with Other App
          </div>
          <ul className="space-y-1">
            {EXTERNAL_APPS.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => toast.info(`Opening ${a.label}…`)}
                    className="flex w-full items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5 text-left text-[11px] text-zinc-300 transition-colors hover:bg-white/8 hover:text-zinc-100"
                  >
                    <Icon className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="flex-1 truncate">{a.label}</span>
                    <ArrowUpRight className="h-3 w-3 text-zinc-500" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <section className="space-y-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Internal Feed
          </div>
          <div className="text-base font-semibold text-zinc-50">
            Explore & Updates
          </div>
        </div>

        <div className="glass relative overflow-hidden rounded-[20px] p-0">
          <div className="desktop-bg relative grid aspect-video place-items-center">
            <div className="absolute inset-0 bg-black/30" />
            <button
              type="button"
              onClick={() => toast.info("Playing video", "Demo only")}
              className="relative grid h-16 w-16 place-items-center rounded-full bg-white/85 text-zinc-900 shadow-xl transition-transform hover:scale-105"
              aria-label="Play video"
            >
              <PlayCircle className="h-9 w-9" />
            </button>
          </div>
          <div className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              27 April 2025
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-50">
              WIT. Indonesia Surabaya Chapter 1
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Post-event WIT & BINUS SCHOOL Surabaya&apos;s Seminar on AI in Port
              Operations for Empowering HR.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FeedStrip label="Calendar & Event" />
          <FeedStrip label="Post in This Week" />
          <FeedStrip label="Announcement" />
        </div>
      </section>

      <aside className="space-y-4">
        <FeatureCard
          eyebrow="New Product"
          title="New Product Presentation"
          gradient="linear-gradient(135deg, #06B6D4 0%, #6366F1 100%)"
          onView={() => toast.info("Opening presentation", "Demo only")}
        />
        <FeatureCard
          eyebrow="Portfolio"
          title="New Portfolio Publish"
          gradient="linear-gradient(135deg, #F472B6 0%, #A855F7 100%)"
          onView={() => toast.info("Opening portfolio", "Demo only")}
        />
      </aside>
    </div>
  );
}

function FeedStrip({ label }: { label: string }) {
  return (
    <div className="glass-soft grid min-h-[88px] place-items-center rounded-[16px] border border-dashed border-white/12 p-4">
      <div className="text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </div>
        <div className="mt-1 text-[10px] text-zinc-500">Nothing new yet.</div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  eyebrow: string;
  title: string;
  gradient: string;
  onView: () => void;
}

function FeatureCard({ eyebrow, title, gradient, onView }: FeatureCardProps) {
  return (
    <div className="glass overflow-hidden rounded-[20px]">
      <div
        className="aspect-[4/3] w-full"
        style={{ background: gradient }}
        aria-hidden
      />
      <div className="p-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          {eyebrow}
        </div>
        <div className="mt-0.5 text-xs font-semibold text-zinc-50">{title}</div>
        <button
          type="button"
          onClick={onView}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
        >
          View
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
