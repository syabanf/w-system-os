"use client";

import { useEffect, useState } from "react";
import type { Client } from "@/domain/entities/Client";
import { useClientsStore } from "@/state/clients.store";
import { useToast } from "@/state/toast.store";
import { useCommandIntentStore } from "@/state/commandIntent.store";
import { useHotkey } from "@/hooks/useHotkey";
import { ClientFormDialog } from "./ClientFormDialog";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";
import { ClientWorkflowTab } from "@/presentation/modules/integration/ClientWorkflowTab";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";

/** Clients module entry — mirrors the PDF Integrated Dashboard exactly by
 *  composing the same `ClientWorkflowTab` used by the Integration module, but
 *  driven by the persistent Clients store and wired to real CRUD dialogs. */
export function ClientManagementView() {
  const items = useClientsStore((s) => s.items);
  const hydrate = useClientsStore((s) => s.hydrate);
  const addClient = useClientsStore((s) => s.add);
  const updateClient = useClientsStore((s) => s.update);
  const removeClient = useClientsStore((s) => s.remove);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [prefillName, setPrefillName] = useState<string | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);

  // ⌘N / Ctrl-N → quick add client.
  useHotkey("mod+n", (e) => {
    e.preventDefault();
    setEditing(null);
    setPrefillName(undefined);
    setFormOpen(true);
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Reddie / command-surface intent: open the create form (optionally prefilled).
  const intent = useCommandIntentStore((s) => s.intent);
  const clearIntent = useCommandIntentStore((s) => s.clear);
  useEffect(() => {
    if (intent?.module === "clients" && intent.action === "create") {
      setEditing(null);
      setPrefillName(intent.prefill);
      setFormOpen(true);
      clearIntent();
    }
  }, [intent, clearIntent]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Growth · Clients
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Client portfolio
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            Accounts, project workflow, milestones, and payment progress —
            unified dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ManageMasterDataButton moduleId="clients" />
        </div>
      </header>

      {/*  The same component the Integration Dashboard renders, fed by our
            store + real CRUD callbacks so newly-added clients appear inline
            and the row action icons (Edit / Delete) drive the right dialogs. */}
      <ClientWorkflowTab
        clients={items}
        hideFilterChip
        onAddClient={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEditClient={(c) => {
          setEditing(c);
          setFormOpen(true);
        }}
        onDeleteClient={(c) => setConfirmDelete(c)}
        onUpdateClient={(id, patch) => updateClient(id, patch)}
        onBulkDelete={(clients) => {
          clients.forEach((c) => removeClient(c.id));
          toast.info(
            "Clients removed",
            `${clients.length} account${clients.length === 1 ? "" : "s"} archived.`,
          );
        }}
      />

      <ClientFormDialog
        open={formOpen}
        editing={editing}
        initialName={prefillName}
        onClose={() => {
          setFormOpen(false);
          setPrefillName(undefined);
        }}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateClient(editingId, draft);
            toast.success("Client updated", draft.name);
          } else {
            addClient(draft);
            toast.success("Client added", `${draft.name} joined the portfolio`);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDelete}
        title="Remove client?"
        description={
          confirmDelete
            ? `${confirmDelete.name} will be removed from the portfolio. Linked projects and invoices remain orphaned for now.`
            : ""
        }
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const name = confirmDelete.name;
          removeClient(confirmDelete.id);
          setConfirmDelete(null);
          toast.info("Client removed", `${name} has been archived.`);
        }}
      />
    </div>
  );
}
