"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Settings, ShieldCheck, User, X } from "lucide-react";
import { useDesktopStore } from "@/state/desktop.store";
import { useAuthStore } from "@/state/auth.store";
import { useToast } from "@/state/toast.store";
import { useWindowStore } from "@/state/window.store";
import { useProfileStore } from "@/state/profile.store";
import { Avatar } from "@/presentation/shared/Avatar";
import { DismissLayer } from "@/presentation/shared/DismissLayer";

export function UserProfileMenu() {
  const isProfileOpen = useDesktopStore((s) => s.isProfileOpen);
  const toggleProfile = useDesktopStore((s) => s.toggleProfile);
  const toggleSettings = useDesktopStore((s) => s.toggleSettings);
  const closeAllPanels = useDesktopStore((s) => s.closeAllPanels);
  const openApp = useWindowStore((s) => s.openApp);
  const signOut = useAuthStore((s) => s.signOut);
  const openProfileEdit = useDesktopStore((s) => s.openProfileEdit);
  const profile = useProfileStore((s) => s.profile);
  const toast = useToast();

  const handleSignOut = () => {
    toggleProfile();
    signOut();
    toast.info("Signed out", "You can sign back in anytime.");
  };

  // Close the profile panel first, then run the item's action.
  const run = (fn: () => void) => () => {
    toggleProfile();
    fn();
  };

  return (
    <>
      {isProfileOpen ? <DismissLayer onDismiss={closeAllPanels} /> : null}
      <AnimatePresence>
      {isProfileOpen ? (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          // position:fixed inline so it beats .glass-strong's `position: relative`.
          style={{ position: "fixed" }}
          className="glass-strong fixed right-3 top-12 z-40 w-[300px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        >
          <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-50">Account</span>
            <button
              onClick={toggleProfile}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/8 hover:text-zinc-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </header>
          <div className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <Avatar name={profile.name} color={profile.avatarColor} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-50">{profile.name}</div>
                <div className="truncate text-xs text-zinc-400">{profile.role}</div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  {profile.org}
                </div>
              </div>
            </div>
            <ul className="space-y-1">
              <MenuItem icon={User} onClick={openProfileEdit}>
                Edit profile
              </MenuItem>
              <MenuItem icon={ShieldCheck} onClick={run(() => openApp("admin"))}>
                Roles & permissions
              </MenuItem>
              <MenuItem icon={Settings} onClick={run(() => toggleSettings())}>
                Preferences
              </MenuItem>
              <MenuItem icon={LogOut} tone="danger" onClick={handleSignOut}>
                Sign out
              </MenuItem>
            </ul>
          </div>
        </motion.aside>
      ) : null}
      </AnimatePresence>
    </>
  );
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  tone?: "neutral" | "danger";
  onClick?: () => void;
}

function MenuItem({ icon: Icon, children, tone = "neutral", onClick }: MenuItemProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
          tone === "danger"
            ? "text-rose-300 hover:bg-rose-500/10"
            : "text-zinc-200 hover:bg-white/[0.06]"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {children}
      </button>
    </li>
  );
}
