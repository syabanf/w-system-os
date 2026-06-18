"use client";

import { create } from "zustand";

const STORAGE_KEY = "wit-erp-os.profile";

export type ProfileStatus = "online" | "away" | "busy" | "focus" | "offline";

export interface Profile {
  name: string;
  role: string;
  org: string;
  avatarColor: string;
  /** Custom avatar photo as a (downscaled) data URL. Falls back to initials. */
  avatarImage?: string;
  /** Override the auto-derived initials shown on the avatar tile. */
  initials?: string;
  /** Availability, shown as a presence dot on the avatar. */
  status: ProfileStatus;
  /** Short tagline shown under the name in the account menu. */
  tagline?: string;
}

// Matches the demo identity the shell shipped with, so nothing changes until
// the user edits their profile.
const DEFAULT_PROFILE: Profile = {
  name: "Damar Wicaksono",
  role: "Director of Operations",
  org: "WIT.ID",
  avatarColor: "#E8C170",
  status: "online",
  tagline: "Keeping delivery, finance, and people in sync.",
};

/** Palette offered by the profile editor for the avatar tile. */
export const PROFILE_AVATAR_COLORS = [
  "#E8C170",
  "#FBBF24",
  "#F472B6",
  "#FB7185",
  "#A78BFA",
  "#60A5FA",
  "#34D399",
  "#2DD4BF",
];

/** Availability presets offered by the profile editor (id → label + dot color). */
export const PROFILE_STATUSES: ReadonlyArray<{
  id: ProfileStatus;
  label: string;
  color: string;
}> = [
  { id: "online", label: "Active", color: "#34D399" },
  { id: "away", label: "Away", color: "#FBBF24" },
  { id: "busy", label: "Busy", color: "#FB7185" },
  { id: "focus", label: "Focus", color: "#A78BFA" },
  { id: "offline", label: "Offline", color: "#71717A" },
];

/** Resolve a status id to its label + dot color (falls back to Active). */
export function statusMeta(status: ProfileStatus) {
  return PROFILE_STATUSES.find((s) => s.id === status) ?? PROFILE_STATUSES[0];
}

function load(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function persist(p: Profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

interface ProfileState {
  profile: Profile;
  isHydrated: boolean;
  /** Load the persisted profile on the client (avoids an SSR hydration mismatch). */
  hydrate: () => void;
  update: (patch: Partial<Profile>) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  isHydrated: false,
  hydrate: () => {
    if (get().isHydrated) return;
    set({ profile: load(), isHydrated: true });
  },
  update: (patch) => {
    const next = { ...get().profile, ...patch };
    persist(next);
    set({ profile: next });
  },
  reset: () => {
    persist(DEFAULT_PROFILE);
    set({ profile: DEFAULT_PROFILE });
  },
}));
