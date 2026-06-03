"use client";

import { create } from "zustand";
import type { AppModuleId } from "@/constants/appModules";

/**
 * Cross-module "do this when you open" channel. Reddie (or anything else) can
 * request an action a module should perform on mount/focus — e.g. open its
 * create form. The target module consumes the intent in an effect and clears it.
 */
export interface CommandIntent {
  module: AppModuleId;
  action: "create";
  /** Optional prefill, e.g. a new record's name. */
  prefill?: string;
  /** Bumped each request so re-issuing the same intent still re-triggers. */
  nonce: number;
}

interface CommandIntentState {
  intent: CommandIntent | null;
  requestCreate: (module: AppModuleId, prefill?: string) => void;
  clear: () => void;
}

let nonce = 0;

export const useCommandIntentStore = create<CommandIntentState>((set) => ({
  intent: null,
  requestCreate: (module, prefill) =>
    set({ intent: { module, action: "create", prefill, nonce: ++nonce } }),
  clear: () => set({ intent: null }),
}));
