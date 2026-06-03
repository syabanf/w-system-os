"use client";

import type { LeaveRequest } from "@/domain/entities/Employee";
import type { ChatMessage, HRMeetingRequest } from "@/domain/entities/Portal";
import {
  mockChatMessages,
  mockEmployeeLeaveRequests,
  mockHRMeetingRequests,
} from "@/infrastructure/data/portal.mock";
import { createCRUDStore } from "./createCRUDStore";

export type ChatMessageDraft = Omit<ChatMessage, "id">;
export type LeaveRequestDraft = Omit<LeaveRequest, "id">;
export type HRMeetingRequestDraft = Omit<HRMeetingRequest, "id">;

/** Self-service chat — messages the employee sends to HR/managers. */
export const usePortalChatStore = createCRUDStore<ChatMessage, ChatMessageDraft>({
  storageKey: "wit-erp-os.portal-chat",
  seed: mockChatMessages,
  idPrefix: "cm",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});

/** Employee leave requests raised from the portal. */
export const usePortalLeaveStore = createCRUDStore<LeaveRequest, LeaveRequestDraft>({
  storageKey: "wit-erp-os.portal-leave",
  seed: mockEmployeeLeaveRequests,
  idPrefix: "elr",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});

/** HR meeting bookings raised from the portal. */
export const usePortalHRStore = createCRUDStore<
  HRMeetingRequest,
  HRMeetingRequestDraft
>({
  storageKey: "wit-erp-os.portal-hr",
  seed: mockHRMeetingRequests,
  idPrefix: "hmr",
  fromDraft: (draft, { id }) => ({ ...draft, id }),
});
