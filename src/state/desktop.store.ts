"use client";

import { create } from "zustand";

interface DesktopState {
  isNotificationsOpen: boolean;
  isSettingsOpen: boolean;
  isProfileOpen: boolean;
  isLauncherOpen: boolean;
  toggleNotifications: () => void;
  toggleSettings: () => void;
  toggleProfile: () => void;
  toggleLauncher: () => void;
  openLauncher: () => void;
  closeLauncher: () => void;
  closeAllPanels: () => void;
}

export const useDesktopStore = create<DesktopState>((set, get) => ({
  isNotificationsOpen: false,
  isSettingsOpen: false,
  isProfileOpen: false,
  isLauncherOpen: false,
  toggleNotifications: () =>
    set({
      isNotificationsOpen: !get().isNotificationsOpen,
      isSettingsOpen: false,
      isProfileOpen: false,
      isLauncherOpen: false,
    }),
  toggleSettings: () =>
    set({
      isSettingsOpen: !get().isSettingsOpen,
      isNotificationsOpen: false,
      isProfileOpen: false,
      isLauncherOpen: false,
    }),
  toggleProfile: () =>
    set({
      isProfileOpen: !get().isProfileOpen,
      isNotificationsOpen: false,
      isSettingsOpen: false,
      isLauncherOpen: false,
    }),
  toggleLauncher: () =>
    set({
      isLauncherOpen: !get().isLauncherOpen,
      isNotificationsOpen: false,
      isSettingsOpen: false,
      isProfileOpen: false,
    }),
  openLauncher: () =>
    set({
      isLauncherOpen: true,
      isNotificationsOpen: false,
      isSettingsOpen: false,
      isProfileOpen: false,
    }),
  closeLauncher: () => set({ isLauncherOpen: false }),
  closeAllPanels: () =>
    set({
      isNotificationsOpen: false,
      isSettingsOpen: false,
      isProfileOpen: false,
      isLauncherOpen: false,
    }),
}));
