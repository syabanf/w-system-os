"use client";

import { useMemo } from "react";
import {
  Activity,
  Calendar,
  ClipboardList,
  Flame,
  Mail,
  Phone,
  Sparkles,
  StickyNote,
  Target,
  UserCircle,
} from "lucide-react";
import type { LeadInsight } from "@/application/use-cases/leads/GetLeadInsights";
import { mockLeadActivities } from "@/infrastructure/data/leadActivities.mock";
import { mockTeam } from "@/infrastructure/data/team.mock";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { Avatar } from "@/presentation/shared/Avatar";
import { formatIDRCompact, formatPercent } from "@/lib/currency";
import { relativeFromNow } from "@/lib/date";
import type { LeadQualification } from "@/domain/entities/LeadSource";

const QUALIFICATION_TONE: Record<LeadQualification, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  Cold: "neutral",
  Warm: "info",
  Hot: "warning",
  MQL: "wit",
  SQL: "success",
};

const STAGE_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  "New Lead": "neutral",
  Qualified: "info",
  Discovery: "info",
  "Proposal Sent": "wit",
  Negotiation: "warning",
  Won: "success",
  Lost: "danger",
};

const STAGES = [
  "New Lead",
  "Qualified",
  "Discovery",
  "Proposal Sent",
  "Negotiation",
  "Won",
] as const;

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  Meeting: <Calendar className="h-3.5 w-3.5 text-blue-300" />,
  Call: <Phone className="h-3.5 w-3.5 text-emerald-300" />,
  Email: <Mail className="h-3.5 w-3.5 text-amber-300" />,
  Note: <StickyNote className="h-3.5 w-3.5 text-zinc-300" />,
  "Stage Change": <Activity className="h-3.5 w-3.5 text-pink-300" />,
};

const teamMap = new Map(mockTeam.map((m) => [m.id, m]));

export function LeadDetailView({ lead }: { lead: LeadInsight }) {
  const activities = useMemo(
    () =>
      mockLeadActivities
        .filter((a) => a.leadId === lead.id)
        .slice()
        .sort((a, b) => (a.at < b.at ? 1 : -1)),
    [lead.id],
  );

  const weighted = lead.dealValue * (lead.probability / 100);
  const owner = teamMap.get(lead.ownerId);

  const currentStageIdx = STAGES.indexOf(lead.stage as (typeof STAGES)[number]);

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={STAGE_TONE[lead.stage]}>{lead.stage}</StatusBadge>
              <StatusBadge tone={QUALIFICATION_TONE[lead.qualification]} dot>
                {lead.qualification}
              </StatusBadge>
              <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300">
                {lead.source}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {lead.companyName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <UserCircle className="h-3.5 w-3.5 text-zinc-500" />
                {lead.contactPerson}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-500" />
                {lead.contactEmail}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Follow-up {lead.followUpDate}
              </span>
              <span className="text-zinc-500">· created {lead.createdAt.slice(0, 10)}</span>
            </div>
            {lead.notes ? (
              <p className="mt-3 max-w-2xl rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[11px] italic text-zinc-300">
                {lead.notes}
              </p>
            ) : null}
          </div>

          {owner ? (
            <div className="glass-soft flex items-center gap-3 rounded-xl border border-white/6 px-3 py-2">
              <Avatar
                name={owner.name}
                initials={owner.initials}
                color={owner.avatarColor}
                size="sm"
              />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Owner</div>
                <div className="truncate text-xs font-semibold text-zinc-100">{owner.name}</div>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Target}
          label="Deal value"
          value={formatIDRCompact(lead.dealValue)}
          delta={`${formatIDRCompact(weighted)} weighted`}
          trend="up"
        />
        <MetricCard
          icon={Flame}
          label="Probability"
          value={formatPercent(lead.probability, 0)}
          trend={lead.probability >= 50 ? "up" : "flat"}
          accent="#FF8A92"
        />
        <MetricCard
          icon={Sparkles}
          label="Lead score"
          value={String(lead.score)}
          delta="max 100"
          accent="#3B82F6"
        />
        <MetricCard
          icon={Activity}
          label="Age"
          value={`${lead.ageDays}d`}
          delta={`${activities.length} touchpoints`}
          accent="#71717A"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Pipeline"
          title="Stage progression"
          description="Where this deal sits in the qualification ladder."
        />
        <ol className="flex flex-wrap gap-2">
          {STAGES.map((s, i) => {
            const reached = currentStageIdx >= i;
            const current = currentStageIdx === i;
            return (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                    current
                      ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/60"
                      : reached
                        ? "bg-white/15 text-zinc-100"
                        : "bg-white/5 text-zinc-500"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-[11px] ${
                    current ? "font-semibold text-zinc-50" : reached ? "text-zinc-300" : "text-zinc-500"
                  }`}
                >
                  {s}
                </span>
                {i < STAGES.length - 1 ? <span className="text-zinc-700">›</span> : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Activity"
          title={`Touchpoints (${activities.length})`}
          description="Calls, meetings, emails, notes and stage changes recorded against this lead."
        />
        {activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No activity logged for this lead yet.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {activities.map((a) => {
              const actor = teamMap.get(a.actorId);
              return (
                <li
                  key={a.id}
                  className="glass-soft flex items-start gap-3 rounded-xl border border-white/6 p-3"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
                    {ACTIVITY_ICON[a.type] ?? <ClipboardList className="h-3.5 w-3.5 text-zinc-300" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-zinc-100">{a.type}</span>
                      <span className="text-[10px] text-zinc-500">{relativeFromNow(a.at)}</span>
                      {a.nextActionDate ? (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-200">
                          next · {a.nextActionDate.slice(0, 10)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-zinc-300">{a.subject}</div>
                    {a.body ? (
                      <div className="mt-0.5 truncate text-[10px] text-zinc-500">{a.body}</div>
                    ) : null}
                  </div>
                  {actor ? (
                    <Avatar
                      name={actor.name}
                      initials={actor.initials}
                      color={actor.avatarColor}
                      size="sm"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
