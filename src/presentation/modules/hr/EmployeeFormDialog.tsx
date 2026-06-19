"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ContactRound, X } from "lucide-react";
import type {
  Employee,
  EmployeeStatus,
  EmploymentType,
} from "@/domain/entities/Employee";
import type { EmployeeDraft } from "@/state/employees.store";
import { FormField } from "@/presentation/shared/FormField";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";
import { demoDateInput } from "@/lib/date";

const EMPLOYMENT_TYPES: EmploymentType[] = ["Permanent", "Contract", "Probation", "Intern"];
const STATUSES: EmployeeStatus[] = ["active", "probation", "on-leave", "resigned", "terminated"];
const DEPARTMENTS = [
  "Product",
  "UI/UX",
  "Frontend",
  "Backend",
  "QA",
  "DevOps",
  "Project Management",
  "Business Analyst",
];

interface EmployeeFormDialogProps {
  open: boolean;
  /** When set, dialog opens in edit mode for this employee. Null/undefined = create. */
  editing?: Employee | null;
  onClose: () => void;
  onSubmit: (draft: EmployeeDraft, editingId?: string) => void;
}

function emptyDraft(): EmployeeDraft {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    joinDate: demoDateInput(),
    employmentType: "Permanent",
    status: "active",
    department: DEPARTMENTS[0],
    position: "",
    managerName: "Damar Wicaksono",
    basicSalary: 12_000_000,
    bpjsKes: true,
    bpjsTk: true,
    bankAccount: "BCA · ",
  };
}

function draftFromEmployee(e: Employee): EmployeeDraft {
  const { id: _id, memberId: _memberId, employeeNumber: _en, ...rest } = e;
  void _id;
  void _memberId;
  void _en;
  return rest;
}

export function EmployeeFormDialog({
  open,
  editing,
  onClose,
  onSubmit,
}: EmployeeFormDialogProps) {
  const [draft, setDraft] = useState<EmployeeDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? draftFromEmployee(editing) : emptyDraft());
  }, [open, editing]);

  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof EmployeeDraft>(key: K, value: EmployeeDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors: Record<string, string> = {};
  if (draft.firstName.trim().length === 0) errors.firstName = "Required";
  if (draft.lastName.trim().length === 0) errors.lastName = "Required";
  if (draft.email.trim().length === 0) errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
    errors.email = "Enter a valid email";
  if (draft.position.trim().length === 0) errors.position = "Required";

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
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/8 text-zinc-200">
                <ContactRound className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                  {editing ? "Edit employee" : "Create employee"}
                </div>
                <div className="text-sm font-semibold text-zinc-50">
                  {editing
                    ? `${editing.firstName} ${editing.lastName} · ${editing.employeeNumber}`
                    : "New employee record"}
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
                <FormField label="First name" required error={submitted ? errors.firstName : undefined}>
                  <input
                    type="text"
                    value={draft.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.firstName}
                    autoFocus
                  />
                </FormField>
                <FormField label="Last name" required error={submitted ? errors.lastName : undefined}>
                  <input
                    type="text"
                    value={draft.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.lastName}
                  />
                </FormField>
                <FormField label="Email" required error={submitted ? errors.email : undefined}>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={inputCls}
                    aria-invalid={submitted && !!errors.email}
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Department">
                  <SearchableSelect
                    value={draft.department}
                    onChange={(v) => set("department", v)}
                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                    ariaLabel="Department"
                  />
                </FormField>
                <FormField label="Position" required error={submitted ? errors.position : undefined}>
                  <input
                    type="text"
                    value={draft.position}
                    onChange={(e) => set("position", e.target.value)}
                    className={inputCls}
                    placeholder="Senior Backend Engineer"
                    aria-invalid={submitted && !!errors.position}
                  />
                </FormField>
                <FormField label="Employment type">
                  <SearchableSelect
                    value={draft.employmentType}
                    onChange={(v) => set("employmentType", v as EmploymentType)}
                    options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t }))}
                    ariaLabel="Employment type"
                  />
                </FormField>
                <FormField label="Status">
                  <SearchableSelect
                    value={draft.status}
                    onChange={(v) => set("status", v as EmployeeStatus)}
                    options={STATUSES.map((s) => ({ value: s, label: s }))}
                    ariaLabel="Status"
                  />
                </FormField>
                <FormField label="Join date">
                  <input
                    type="date"
                    value={draft.joinDate}
                    onChange={(e) => set("joinDate", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Manager">
                  <input
                    type="text"
                    value={draft.managerName}
                    onChange={(e) => set("managerName", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
                <FormField label="Basic salary (IDR)">
                  <input
                    type="number"
                    value={draft.basicSalary}
                    onChange={(e) =>
                      set("basicSalary", Number(e.target.value) || 0)
                    }
                    className={inputCls}
                    step={100000}
                  />
                </FormField>
                <FormField label="Bank account">
                  <input
                    type="text"
                    value={draft.bankAccount}
                    onChange={(e) => set("bankAccount", e.target.value)}
                    className={inputCls}
                  />
                </FormField>
              </div>

              <fieldset className="grid grid-cols-2 gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2">
                <legend className="px-1 text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                  BPJS
                </legend>
                <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={draft.bpjsKes}
                    onChange={(e) => set("bpjsKes", e.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-400"
                  />
                  BPJS Kesehatan
                </label>
                <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={draft.bpjsTk}
                    onChange={(e) => set("bpjsTk", e.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-400"
                  />
                  BPJS Ketenagakerjaan
                </label>
              </fieldset>

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
                  {editing ? "Save changes" : "Create employee"}
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
