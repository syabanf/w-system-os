import { describe, it, expect } from "vitest";
import { bulkDeleteWithUndo, bulkDeleteWithCascade } from "@/lib/bulkDelete";

interface Row {
  id: string;
  name: string;
}

/** Tiny in-memory stand-in for a CRUD store's items/remove/restore. */
function makeStore(seed: Row[]) {
  let items = [...seed];
  return {
    get items() {
      return items;
    },
    remove: (id: string) => {
      items = items.filter((r) => r.id !== id);
    },
    restore: (recs: Row[]) => {
      items = [...recs, ...items];
    },
  };
}

function makeToast() {
  const pushed: Array<{
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  }> = [];
  return {
    pushed,
    push: (t: (typeof pushed)[number]) => {
      pushed.push(t);
      return "toast-id";
    },
  };
}

describe("bulkDeleteWithUndo", () => {
  it("removes the selected rows, runs onDone, and undo restores them", () => {
    const store = makeStore([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ]);
    const toast = makeToast();
    let cleared = false;

    bulkDeleteWithUndo({
      ids: ["a", "c"],
      items: store.items,
      remove: store.remove,
      restore: store.restore,
      toast,
      noun: "row",
      onDone: () => {
        cleared = true;
      },
    });

    expect(store.items.map((r) => r.id)).toEqual(["b"]);
    expect(cleared).toBe(true);

    const t = toast.pushed[0];
    expect(t.title).toBe("2 rows deleted");
    expect(t.action?.label).toBe("Undo");

    t.action!.onClick();
    expect(store.items.map((r) => r.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("is a no-op (no toast) when nothing matches", () => {
    const store = makeStore([{ id: "a", name: "A" }]);
    const toast = makeToast();
    bulkDeleteWithUndo({
      ids: ["zzz"],
      items: store.items,
      remove: store.remove,
      restore: store.restore,
      toast,
      noun: "row",
    });
    expect(store.items).toHaveLength(1);
    expect(toast.pushed).toHaveLength(0);
  });

  it("uses the singular noun for a single row", () => {
    const store = makeStore([{ id: "a", name: "A" }]);
    const toast = makeToast();
    bulkDeleteWithUndo({
      ids: ["a"],
      items: store.items,
      remove: store.remove,
      restore: store.restore,
      toast,
      noun: "lead",
    });
    expect(toast.pushed[0].title).toBe("1 lead deleted");
  });
});

describe("bulkDeleteWithCascade", () => {
  it("removes parents + their children and undo restores both", () => {
    const parents = makeStore([
      { id: "p1", name: "P1" },
      { id: "p2", name: "P2" },
    ]);
    const children = makeStore([
      { id: "c1", name: "C1" },
      { id: "c2", name: "C2" },
      { id: "c3", name: "C3" },
    ]);
    const childOf: Record<string, string[]> = { p1: ["c1", "c2"], p2: ["c3"] };
    const toast = makeToast();

    bulkDeleteWithCascade({
      ids: ["p1"],
      items: parents.items,
      remove: parents.remove,
      restore: parents.restore,
      collectChildren: (id) =>
        children.items.filter((c) => (childOf[id] ?? []).includes(c.id)),
      removeChildren: (recs) => recs.forEach((r) => children.remove(r.id)),
      restoreChildren: (recs) => children.restore(recs),
      countChildren: (recs) => recs.length,
      childLabel: "item",
      toast,
      noun: "parent",
    });

    expect(parents.items.map((r) => r.id)).toEqual(["p2"]);
    expect(children.items.map((r) => r.id)).toEqual(["c3"]);

    const t = toast.pushed[0];
    expect(t.title).toBe("1 parent deleted");
    expect(t.description).toContain("2 items");

    t.action!.onClick();
    expect(parents.items.map((r) => r.id).sort()).toEqual(["p1", "p2"]);
    expect(children.items.map((r) => r.id).sort()).toEqual(["c1", "c2", "c3"]);
  });
});
