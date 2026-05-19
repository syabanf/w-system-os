import type { ID, ISODate } from "@/types/common";

export type ProposalStatus = "drafting" | "sent" | "in-review" | "approved" | "rejected" | "expired";

export interface Proposal {
  id: ID;
  number: string;
  title: string;
  leadId?: ID;
  clientId?: ID;
  value: number;
  status: ProposalStatus;
  approvalStage: "pending-internal" | "pending-client" | "approved" | "rejected" | "n/a";
  expiryDate: ISODate;
  signatureStatus: "unsigned" | "client-signed" | "fully-signed";
  createdAt: ISODate;
}
