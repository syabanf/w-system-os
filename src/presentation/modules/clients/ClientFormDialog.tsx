"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, X } from "lucide-react";
import type { AccountHealth, Client } from "@/domain/entities/Client";
import { useClientsStore, type ClientDraft } from "@/state/clients.store";
import { FormField } from "@/presentation/shared/FormField";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";
import { cn } from "@/lib/cn";
import { demoNow } from "@/lib/date";

const HEALTH_OPTIONS: AccountHealth[] = ["excellent", "stable", "at-risk", "churn-risk"];
const REGION_OPTIONS = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Medan", "Denpasar", "Remote"];
const LOGO_COLORS = [
  "#2563EB",
  "#16A34A",
  "#DC2626",
  "#9333EA",
  "#EA580C",
  "#0891B2",
  "#DB2777",
  "#0D9488",
];

interface ClientFormDialogProps {
  open: boolean;
  /** When set, dialog opens in edit mode. Null = create. */
  editing?: Client | null;
  /** Prefill the name field on a new (create) form — used by Reddie's
   *  "new client Acme" command. Ignored in edit mode. */
  initialName?: string;
  onClose: () => void;
  onSubmit: (draft: ClientDraft, editingId?: string) => void;
}

function emptyDraft(): ClientDraft {
  return {
    name: "",
    industry: "",
    region: REGION_OPTIONS[0],
    primaryContact: "",
    contactEmail: "",
    accountOwnerId: "tm-damar",
    contractValue: 0,
    retainerActive: true,
    activeProjects: 0,
    satisfactionScore: 80,
    health: "stable",
    renewalDate: (() => { const d = demoNow(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })(),
    logoColor: LOGO_COLORS[0],
  };
}

function draftFromClient(c: Client): ClientDraft {
  const { id: _id, joinedAt, ...rest } = c;
  void _id;
  return { ...rest, joinedAt };
}

export function ClientFormDialog({
  open,
  editing,
  initialName,
  onClose,
  onSubmit,
}: ClientFormDialogProps) {
  const [draft, setDraft] = useState<ClientDraft>(emptyDraft);
  // Mirror the backend clients_tenant_name_uniq constraint (migration 023):
  // one client per (case-insensitive, trimmed) name. Read straight from the
  // store so every entry path — Clients view, Integration tab, Reddie — is
  // covered without prop threading.
  const clients = useClientsStore((s) => s.items);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? draftFromClient(editing)
        : { ...emptyDraft(), name: initialName ?? "" },
    );
  }, [open, editing, initialName]);

  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  const trimmedName = draft.name.trim();
  if (trimmedName.length === 0) errors.name = "Required";
  else if (
    clients.some(
      (c) =>
        c.id !== editing?.id &&
        c.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    )
  )
    errors.name = "A client with this name already exists";
  if (draft.industry.trim().length === 0) errors.industry = "Required";
  if (draft.primaryContact.trim().length === 0) errors.primaryContact = "Required";
  if (draft.contactEmail.trim().length === 0) errors.contactEmail = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail.trim()))
    errors.contactEmail = "Enter a valid email";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        (e.currentTarget as HTMLFormElement)
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    onSubmit(draft, editing?.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[8vh] backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -8, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
              <span
                className="grid h-8 w-8 place-items-center rounded-xl text-white"
                style={{ background: draft.logoColor }}
              >
                <Building2 className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit client" : "Create client"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing ? editing.name : "New account"}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Account name" required error={submitted ? errors.name : undefined}>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={inputCls}
                    placeholder="Garuda Finansial"
                    aria-invalid={submitted && !!errors.name}
                    autoFocus
                  />
                </FormField>
                <FormField label="Industry" required error={submitted ? errors.industry : undefined}>
                  <input
                    type="text"
                    value={draft.industry}
                    onChange={(e) => set("industry", e.target.value)}
                    className={inputCls}
                    placeholder="Banking & Finance"
                    aria-invalid={submitted && !!errors.industry}
                  />
                </FormField>
                <FormField label="Region">
                  <SearchableSelect
                    value={draft.region}
                    onChange={(v) => set("region", v)}
                    options={REGION_OPTIONS.map((r) => ({ value: r, label: r }))}
                    ariaLabel="Region"
                  />
                </FormField>
                <FormField label="Account owner ID">
                  <input
                    type="text"
                    value={draft.accountOwnerId}
                    onChange={(e) => set("accountOwnerId", e.target.value)}
                    className={inputCls}
                    placeholder="tm-damar"
                  />
                </FormField>
                <FormField
                  label="Primary contact"
                  required
                  error={submitted ? errors.primaryContact : undefined}
                >
                  <input
                    type="text"
                    value={draft.primaryContact}
                    onChange={(e) => set("primaryContact", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.primaryContact}
                  />
                </FormField>
                <FormField
                  label="Contact email"
                  required
                  error={submitted ? errors.contactEmail : undefined}
                >
                  <input
                    type="email"
                    value={draft.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.contactEmail}
                  />
                </FormField>
                <FormField label="Contract value (IDR)">
                  <input
                    type="number"
                    value={draft.contractValue}
                    onChange={(e) => set("contractValue", Number(e.target.value) || 0)}
                    className={inputCls}
                    step={1_000_000}
                  />
                </FormField>
                <FormField label="Active projects">
                  <input
                    type="number"
                    value={draft.activeProjects}
                    onChange={(e) => set("activeProjects", Number(e.target.value) || 0)}
                    className={inputCls}
                    min={0}
                  />
                </FormField>
                <FormField label="Satisfaction (0–100)">
                  <input
                    type="number"
                    value={draft.satisfactionScore}
                    onChange={(e) =>
                      set("satisfactionScore", Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                    }
                    className={inputCls}
                    min={0}
                    max={100}
                  />
                </FormField>
                <FormField label="Health">
                  <SearchableSelect
                    value={draft.health}
                    onChange={(v) => set("health", v as AccountHealth)}
                    options={HEALTH_OPTIONS.map((h) => ({ value: h, label: h }))}
                    ariaLabel="Health"
                  />
                </FormField>
                <FormField label="Renewal date">
                  <input
                    type="date"
                    value={draft.renewalDate.slice(0, 10)}
                    onChange={(e) => set("renewalDate", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Logo color">
                  <div className="flex flex-wrap gap-1.5">
                    {LOGO_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set("logoColor", c)}
                        className={cn(
                          "h-6 w-6 rounded-full ring-1 ring-white/20 transition-transform",
                          draft.logoColor === c && "scale-110 ring-2 ring-white/80",
                        )}
                        style={{ background: c }}
                        aria-label={`Pick ${c}`}
                      />
                    ))}
                  </div>
                </FormField>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={draft.retainerActive}
                  onChange={(e) => set("retainerActive", e.target.checked)}
                  className="h-3.5 w-3.5 accent-emerald-400"
                />
                Active retainer
              </label>

              <footer className="-mx-5 -mb-4 flex items-center justify-end gap-2 border-t border-white/8 bg-white/[0.02] px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/8 hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-white/85 px-3.5 py-1.5 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
                >
                  {editing ? "Save changes" : "Create client"}
                </button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-white/30 focus:bg-white/[0.06]";
