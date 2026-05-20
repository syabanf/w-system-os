"use client";

import { create, type StateCreator } from "zustand";

/** Minimum shape every CRUD entity must satisfy. */
export interface HasId {
  id: string;
}

export interface CRUDStore<T extends HasId, Draft> {
  items: T[];
  isHydrated: boolean;
  hydrate: () => void;
  add: (draft: Draft) => T;
  update: (id: string, patch: Partial<Draft>) => T | null;
  remove: (id: string) => void;
  /** Reset back to seed data (useful for testing + a "Reset demo" affordance). */
  reset: () => void;
}

interface CreateOptions<T extends HasId, Draft> {
  /** localStorage key — should be globally unique per entity type. */
  storageKey: string;
  /** Seed records used when nothing is persisted yet. */
  seed: T[];
  /** Construct a record from a draft. Caller supplies its own ID strategy
   *  (e.g. prefix + counter, nanoid, etc.). */
  fromDraft: (draft: Draft, opts: { id: string; existing: T[] }) => T;
  /** Optional patch hook so updates can derive computed fields. */
  applyPatch?: (existing: T, patch: Partial<Draft>) => T;
  /** Optional prefix used by the built-in ID generator. */
  idPrefix?: string;
}

/** Build a Zustand CRUD store with localStorage persistence in one call.
 *
 *  Usage:
 *  ```ts
 *  export const useClientsStore = createCRUDStore<Client, ClientDraft>({
 *    storageKey: "wit-erp-os.clients",
 *    seed: mockClients,
 *    fromDraft: (d, { id }) => ({ ...d, id, createdAt: new Date().toISOString() }),
 *  });
 *  ```
 *
 *  Returns a hook + a getter for non-React contexts (e.g. inside event handlers
 *  that want the latest state without subscribing).
 */
export function createCRUDStore<T extends HasId, Draft>(
  options: CreateOptions<T, Draft>,
) {
  const {
    storageKey,
    seed,
    fromDraft,
    applyPatch,
    idPrefix = "x",
  } = options;

  let counter = 0;
  const nextId = (existing: T[]) => {
    // Avoid collisions if the seed already uses a known prefix sequence.
    let candidate: string;
    do {
      counter += 1;
      candidate = `${idPrefix}-${Date.now().toString(36)}-${counter}`;
    } while (existing.some((x) => x.id === candidate));
    return candidate;
  };

  const persist = (items: T[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Quota exceeded or storage disabled — silently ignore; the in-memory
      // store still works for the session.
    }
  };

  const loadFromStorage = (): T[] | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as T[];
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const creator: StateCreator<CRUDStore<T, Draft>> = (set, get) => ({
    items: seed,
    isHydrated: false,
    hydrate: () => {
      if (get().isHydrated) return;
      const stored = loadFromStorage();
      set({ items: stored ?? seed, isHydrated: true });
    },
    add: (draft) => {
      const items = get().items;
      const id = nextId(items);
      const record = fromDraft(draft, { id, existing: items });
      const next = [record, ...items];
      set({ items: next });
      persist(next);
      return record;
    },
    update: (id, patch) => {
      const items = get().items;
      const idx = items.findIndex((x) => x.id === id);
      if (idx < 0) return null;
      const existing = items[idx];
      const merged = applyPatch
        ? applyPatch(existing, patch)
        : ({ ...existing, ...(patch as Partial<T>) } as T);
      const next = items.slice();
      next[idx] = merged;
      set({ items: next });
      persist(next);
      return merged;
    },
    remove: (id) => {
      const next = get().items.filter((x) => x.id !== id);
      set({ items: next });
      persist(next);
    },
    reset: () => {
      set({ items: seed });
      persist(seed);
    },
  });

  return create<CRUDStore<T, Draft>>(creator);
}
