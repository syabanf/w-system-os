import type { ID, ISODate } from "@/types/common";

export type AccountHealth = "excellent" | "stable" | "at-risk" | "churn-risk";

export interface Client {
  id: ID;
  name: string;
  industry: string;
  region: string;
  primaryContact: string;
  contactEmail: string;
  accountOwnerId: ID;
  contractValue: number; // total LTV in IDR
  retainerActive: boolean;
  activeProjects: number;
  satisfactionScore: number; // 0..100
  health: AccountHealth;
  renewalDate: ISODate;
  joinedAt: ISODate;
  logoColor: string; // tailwind hex for synthetic logo
}
