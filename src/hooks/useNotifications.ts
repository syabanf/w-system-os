"use client";

import { useShallow } from "zustand/react/shallow";
import { useNotificationStore } from "@/state/notification.store";

export function useNotifications() {
  return useNotificationStore(
    useShallow((s) => ({
      notifications: s.notifications,
      unread: s.unread,
      markAllRead: s.markAllRead,
    })),
  );
}
