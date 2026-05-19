import type { ID, ISODate } from "@/types/common";

export type ContractStatus = "draft" | "review" | "active" | "expiring" | "expired" | "terminated";

export interface Contract {
  id: ID;
  number: string;
  clientId: ID;
  projectId?: ID;
  title: string;
  value: number;
  startDate: ISODate;
  endDate: ISODate;
  status: ContractStatus;
  signed: boolean;
  type: "Fixed-Price" | "Time & Materials" | "Retainer";
}
