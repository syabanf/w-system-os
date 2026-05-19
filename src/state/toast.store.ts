"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** ms before auto-dismiss; 0 = sticky. Default 4000. */
  duration?: number;
  /** Optional inline action: shown on the right; closes the toast on click. */
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;
const nextId = () => `t-${Date.now()}-${counter++}`;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId();
    set((s) => ({ toasts: [...s.toasts, { id, duration: 4000, ...t }] }));
    const dur = t.duration ?? 4000;
    if (dur > 0) {
      setTimeout(() => get().dismiss(id), dur);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

// Convenience hook — small wrapper so callers don't need to learn the store API.
// Use as: `const toast = useToast(); toast.success("Saved", "Employee added.")`.
export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    success: (title: string, description?: string) =>
      push({ tone: "success", title, description }),
    error: (title: string, description?: string) =>
      push({ tone: "error", title, description }),
    info: (title: string, description?: string) =>
      push({ tone: "info", title, description }),
    warning: (title: string, description?: string) =>
      push({ tone: "warning", title, description }),
    push,
    dismiss: useToastStore.getState().dismiss,
  };
}
