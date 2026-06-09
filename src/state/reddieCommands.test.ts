import { describe, it, expect } from "vitest";
import { runReddieCommand } from "@/state/reddieCommands";

/**
 * The command engine is a pure(ish) router: it returns a grounded reply (and
 * fires navigation/create side effects against the stores) or null when the
 * message isn't a workspace command. We assert on the returned reply.
 */
describe("runReddieCommand", () => {
  it("returns a capabilities reply for 'help'", () => {
    const r = runReddieCommand("help");
    expect(r).not.toBeNull();
    expect(r!.content.toLowerCase()).toContain("open");
  });

  it("answers overdue invoices from store data", () => {
    const r = runReddieCommand("show overdue invoices");
    expect(r).not.toBeNull();
    expect(r!.content.toLowerCase()).toContain("overdue invoice");
  });

  it("navigates to a module by name", () => {
    const r = runReddieCommand("open reports");
    expect(r).not.toBeNull();
    expect(r!.content).toContain("Reports");
  });

  it("opens a create form prefilled with the parsed name", () => {
    const r = runReddieCommand("new client Acme Corp");
    expect(r).not.toBeNull();
    expect(r!.content).toContain("Acme Corp");
  });

  it("returns null for messages that aren't commands", () => {
    expect(runReddieCommand("xyzzy qwop total nonsense")).toBeNull();
  });
});
