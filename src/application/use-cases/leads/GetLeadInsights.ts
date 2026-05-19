import type { LeadRepository } from "@/domain/repositories/LeadRepository";
import type { Lead, LeadSource } from "@/domain/entities/Lead";
import type {
  LeadActivity,
  LeadQualification,
  LeadScoringRule,
  LeadSourceMetric,
} from "@/domain/entities/LeadSource";
import { mockLeadActivities, mockScoringRules } from "@/infrastructure/data/leadActivities.mock";

const SOURCES: LeadSource[] = ["Referral", "Website", "Outbound", "Event", "Partner", "Inbound"];

function deriveQualification(lead: Lead): LeadQualification {
  if (lead.stage === "Won") return "SQL";
  if (lead.stage === "Negotiation") return "SQL";
  if (lead.stage === "Proposal Sent") return "MQL";
  if (lead.probability >= 50) return "Hot";
  if (lead.probability >= 30) return "Warm";
  return "Cold";
}

function deriveScore(lead: Lead, rules: LeadScoringRule[]): number {
  let score = lead.probability; // baseline
  if (lead.dealValue > 1_000_000_000) score += rules.find((r) => r.id === "sr-001")?.points ?? 0;
  if (
    lead.companyName.toLowerCase().includes("bank") ||
    lead.companyName.toLowerCase().includes("fin") ||
    lead.companyName.toLowerCase().includes("health")
  ) {
    score += rules.find((r) => r.id === "sr-004")?.points ?? 0;
  }
  if (lead.source === "Referral" || lead.source === "Partner") score += 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface LeadInsight extends Lead {
  qualification: LeadQualification;
  score: number;
  ageDays: number;
  ownerName: string;
}

export interface LeadInsightsDTO {
  leads: LeadInsight[];
  totalLeads: number;
  qualifiedCount: number;
  hotCount: number;
  averageScore: number;
  conversionRate: number;
  pipelineValue: number;
  weightedValue: number;
  sourceMetrics: LeadSourceMetric[];
  qualificationCounts: Record<LeadQualification, number>;
  recentActivities: (LeadActivity & { leadName: string })[];
  scoringRules: LeadScoringRule[];
}

const NOW = new Date("2026-05-19T09:00:00Z");

export class GetLeadInsights {
  constructor(private leads: LeadRepository) {}

  async execute(): Promise<LeadInsightsDTO> {
    const all = await this.leads.getAll();

    const insights: LeadInsight[] = all.map((lead) => {
      const ageDays = Math.max(
        0,
        Math.floor((NOW.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      );
      return {
        ...lead,
        qualification: deriveQualification(lead),
        score: deriveScore(lead, mockScoringRules),
        ageDays,
        ownerName: "Citra Anggraini",
      };
    });

    const won = insights.filter((l) => l.stage === "Won");
    const closed = insights.filter((l) => l.stage === "Won" || l.stage === "Lost");
    const conversionRate = closed.length > 0 ? (won.length / closed.length) * 100 : 0;

    const pipelineValue = insights
      .filter((l) => l.stage !== "Won" && l.stage !== "Lost")
      .reduce((s, l) => s + l.dealValue, 0);
    const weightedValue = insights
      .filter((l) => l.stage !== "Won" && l.stage !== "Lost")
      .reduce((s, l) => s + l.dealValue * (l.probability / 100), 0);

    const sourceMetrics: LeadSourceMetric[] = SOURCES.map((source) => {
      const sourceLeads = insights.filter((l) => l.source === source);
      const qualified = sourceLeads.filter(
        (l) => l.qualification === "MQL" || l.qualification === "SQL" || l.qualification === "Hot",
      );
      const sourceWon = sourceLeads.filter((l) => l.stage === "Won");
      const totalValue = sourceLeads.reduce((s, l) => s + l.dealValue, 0);
      const closedInSource = sourceLeads.filter(
        (l) => l.stage === "Won" || l.stage === "Lost",
      );
      return {
        id: `src-${source.toLowerCase()}`,
        source,
        leadCount: sourceLeads.length,
        qualifiedCount: qualified.length,
        wonCount: sourceWon.length,
        totalValue,
        conversionRate:
          closedInSource.length > 0 ? (sourceWon.length / closedInSource.length) * 100 : 0,
        averageDealValue:
          sourceLeads.length > 0 ? totalValue / sourceLeads.length : 0,
      };
    });

    const qualificationCounts = insights.reduce<Record<LeadQualification, number>>(
      (acc, lead) => {
        acc[lead.qualification] = (acc[lead.qualification] ?? 0) + 1;
        return acc;
      },
      { Cold: 0, Warm: 0, Hot: 0, MQL: 0, SQL: 0 },
    );

    const leadNameMap = new Map(insights.map((l) => [l.id, l.companyName]));
    const recentActivities = mockLeadActivities
      .slice()
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 8)
      .map((a) => ({ ...a, leadName: leadNameMap.get(a.leadId) ?? "Unknown lead" }));

    return {
      leads: insights.sort((a, b) => b.score - a.score),
      totalLeads: insights.length,
      qualifiedCount: insights.filter(
        (l) => l.qualification === "MQL" || l.qualification === "SQL" || l.qualification === "Hot",
      ).length,
      hotCount: insights.filter((l) => l.qualification === "Hot" || l.qualification === "SQL").length,
      averageScore:
        insights.length > 0 ? insights.reduce((s, l) => s + l.score, 0) / insights.length : 0,
      conversionRate,
      pipelineValue,
      weightedValue,
      sourceMetrics,
      qualificationCounts,
      recentActivities,
      scoringRules: mockScoringRules,
    };
  }
}
