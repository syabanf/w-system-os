"use client";

import type { ReactNode } from "react";

/**
 * Standard labelled form field with a required marker and inline error slot.
 * Drop-in replacement for the per-dialog `Field` components, so validation
 * looks/behaves identically everywhere.
 *
 * Usage:
 *   <FormField label="Name" required error={submitted ? errors.name : undefined}>
 *     <input aria-invalid={submitted && !!errors.name} className={inputCls} ... />
 *   </FormField>
 */
export function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
        {required ? <span className="text-rose-300"> ·</span> : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="mt-1 block text-[10px] font-medium text-rose-300">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[10px] text-zinc-500">{hint}</span>
      ) : null}
    </label>
  );
}
