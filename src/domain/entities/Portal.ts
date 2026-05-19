import type { ID, ISODate } from "@/types/common";

export type OnboardingStatus = "Done" | "In Progress" | "Pending" | "Blocked";
export type OnboardingCategory =
  | "IT"
  | "HR"
  | "Training"
  | "Compliance"
  | "Social"
  | "Tools";

export interface OnboardingTask {
  id: ID;
  title: string;
  description: string;
  category: OnboardingCategory;
  weekNumber: number;
  status: OnboardingStatus;
  ownerHint: string;
  resourceUrl?: string;
  completedAt?: ISODate;
}

export interface ChatThread {
  id: ID;
  participantIds: ID[];
  title: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  kind: "HR" | "Manager" | "Team" | "DM";
}

export interface ChatMessage {
  id: ID;
  threadId: ID;
  fromMemberId: ID;
  content: string;
  at: string;
}

export type HRMeetingPurpose =
  | "Onboarding"
  | "Performance"
  | "Career"
  | "Comp & Benefits"
  | "Wellbeing"
  | "Other";

export interface HRMeetingSlot {
  id: ID;
  hrMemberId: ID;
  date: ISODate;
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  /** Already booked → not selectable. */
  booked: boolean;
}

export interface HRMeetingRequest {
  id: ID;
  hrMemberId: ID;
  employeeMemberId: ID;
  date: ISODate;
  time: string;
  purpose: HRMeetingPurpose;
  notes: string;
  status: "Requested" | "Confirmed" | "Cancelled" | "Completed";
}
