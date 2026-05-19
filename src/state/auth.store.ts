"use client";

import { create } from "zustand";

const STORAGE_KEY = "wit-erp-os.auth";

interface PersistedAuth {
  isAuthenticated: boolean;
  signedInAt: string | null;
}

function loadFromStorage(): PersistedAuth {
  if (typeof window === "undefined") return { isAuthenticated: false, signedInAt: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, signedInAt: null };
    return JSON.parse(raw) as PersistedAuth;
  } catch {
    return { isAuthenticated: false, signedInAt: null };
  }
}

function persist(state: PersistedAuth) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface AuthState {
  isAuthenticated: boolean;
  signedInAt: string | null;
  isHydrated: boolean;
  hydrate: () => void;
  signIn: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  signedInAt: null,
  isHydrated: false,
  hydrate: () => {
    if (get().isHydrated) return;
    const persisted = loadFromStorage();
    set({ ...persisted, isHydrated: true });
  },
  signIn: () => {
    const next = { isAuthenticated: true, signedInAt: new Date().toISOString() };
    persist(next);
    set(next);
  },
  signOut: () => {
    const next = { isAuthenticated: false, signedInAt: null };
    persist(next);
    set(next);
  },
}));
