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
import {
  collectClientChildren,
  removeClientChildren,
  restoreClientChildren,
  summarizeClientChildren,
} from "@/lib/cascade";

/** Clients module entry — mirrors the PDF Integrated Dashboard exactly by
 *  composing the same `ClientWorkflowTab` used by the Integration module, but
 *  driven by the persistent Clients store and wired to real CRUD dialogs. */
export function ClientManagementView() {
  const items = useClientsStore((s) => s.items);
  const hydrate = useClientsStore((s) => s.hydrate);
  const addClient = useClientsStore((s) => s.add);
  const updateClient = useClientsStore((s) => s.update);
  const removeClient = useClientsStore((s) => s.remove);
  const restoreClient = useClientsStore((s) => s.restore);
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
          // Capture each client's children first so Undo can restore everything.
          const batches = clients.map((c) => ({
            client: c,
            children: collectClientChildren(c.id),
          }));
          clients.forEach((c) => removeClient(c.id));
          batches.forEach((b) => removeClientChildren(b.children));
          const linked = batches.reduce(
            (s, b) => s + b.children.projects.length + b.children.invoices.length,
            0,
          );
          toast.push({
            tone: "info",
            title: `${clients.length} client${clients.length === 1 ? "" : "s"} deleted`,
            description: linked
              ? `Plus ${linked} linked record${linked === 1 ? "" : "s"} (projects · invoices).`
              : undefined,
            action: {
              label: "Undo",
              onClick: () => {
                restoreClient(clients);
                batches.forEach((b) => restoreClientChildren(b.children));
              },
            },
          });
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
        description={(() => {
          if (!confirmDelete) return "";
          const summary = summarizeClientChildren(collectClientChildren(confirmDelete.id));
          return summary
            ? `${confirmDelete.name} and its linked ${summary} will be removed. You can undo this.`
            : `${confirmDelete.name} will be removed from the portfolio. You can undo this.`;
        })()}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          const client = confirmDelete;
          const children = collectClientChildren(client.id);
          removeClient(client.id);
          removeClientChildren(children);
          setConfirmDelete(null);
          const summary = summarizeClientChildren(children);
          toast.push({
            tone: "info",
            title: "Client removed",
            description: summary
              ? `${client.name} + ${summary} archived.`
              : `${client.name} has been archived.`,
            action: {
              label: "Undo",
              onClick: () => {
                restoreClient([client]);
                restoreClientChildren(children);
              },
            },
          });
        }}
      />
    </div>
  );
}
