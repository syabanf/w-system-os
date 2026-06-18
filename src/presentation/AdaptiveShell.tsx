"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useThemeStore, hydrateThemeFromStorage } from "@/state/theme.store";
import { useWindowStore } from "@/state/window.store";
import { useAuthStore } from "@/state/auth.store";
import { DEFAULT_OPEN_MODULE } from "@/constants/navigation";
import { DesktopShell } from "@/presentation/desktop/DesktopShell";
import { TabletShell } from "@/presentation/tablet/TabletShell";
import { MobileShell } from "@/presentation/mobile/MobileShell";
import { LoginPage } from "@/presentation/auth/LoginPage";
import { ToastViewport } from "@/presentation/shared/ToastViewport";
import { ReddieChat } from "@/presentation/desktop/ReddieChat";
import { ReddieLauncher } from "@/presentation/desktop/ReddieLauncher";
import { SetupWizard } from "@/presentation/shared/SetupWizard";
import { useSetupStore } from "@/state/setup.store";
import { useProfileStore } from "@/state/profile.store";

export function AdaptiveShell() {
  const { mode, ready } = useViewportMode();
  const theme = useThemeStore((s) => s.theme);
  const openApp = useWindowStore((s) => s.openApp);
  const orderLength = useWindowStore((s) => s.order.length);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthHydrated = useAuthStore((s) => s.isHydrated);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const isSetupComplete = useSetupStore((s) => s.isComplete);
  const isSetupHydrated = useSetupStore((s) => s.isHydrated);
  const hydrateSetup = useSetupStore((s) => s.hydrate);
  const hydrateProfile = useProfileStore((s) => s.hydrate);

  useEffect(() => {
    hydrateThemeFromStorage();
    hydrateAuth();
    hydrateSetup();
    hydrateProfile();
  }, [hydrateAuth, hydrateSetup, hydrateProfile]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  // Desktop auto-opens the dashboard so the welcome surface isn't empty.
  // Gated on `ready` + auth so phone/tablet visitors don't get auto-opened during
  // the SSR-to-client viewport detection, and the dashboard only opens post-sign-in.
  useEffect(() => {
    if (
      ready &&
      isAuthenticated &&
      isSetupComplete &&
      mode === "desktop" &&
      orderLength === 0
    ) {
      openApp(DEFAULT_OPEN_MODULE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready, isAuthenticated, isSetupComplete]);

  if (!ready || !isAuthHydrated || !isSetupHydrated) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.24 }}
          >
            <LoginPage />
          </motion.div>
        ) : !isSetupComplete ? (
          // Full-screen takeover — render without an animated wrapper so the
          // surface is always fully opaque (avoids a Framer entry animation
          // stalling mid-fade and washing the wizard out).
          <SetupWizard key="setup" />
        ) : (
          <motion.div
            key="shell"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.9, 0.25, 1.0] }}
          >
            {mode === "phone" ? (
              <MobileShell />
            ) : mode === "tablet" ? (
              <TabletShell />
            ) : (
              <DesktopShell />
            )}
            <ReddieLauncher />
            <ReddieChat />
          </motion.div>
        )}
      </AnimatePresence>
      <ToastViewport />
    </>
  );
}
