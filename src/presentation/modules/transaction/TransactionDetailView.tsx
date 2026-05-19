"use client";

import { useMemo } from "react";
import {
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  FileSignature,
  Link2,
  Package,
  Receipt,
  UserCircle,
  Wallet,
} from "lucide-react";
import type { Invoice } from "@/domain/entities/Invoice";
import type {
  ExpenseClaim,
  Payment,
  PurchaseOrder,
} from "@/domain/entities/Transaction";
import { mockPayments } from "@/infrastructure/data/transactions.mock";
import { mockInvoices } from "@/infrastructure/data/invoices.mock";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { formatIDR, formatIDRCompact } from "@/lib/currency";
import { formatDate } from "@/lib/date";

const INVOICE_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

const PAYMENT_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "warning",
  cleared: "success",
  reconciled: "success",
  failed: "danger",
};

const PO_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "neutral",
  "pending-approval": "warning",
  approved: "success",
  "partially-received": "info",
  received: "success",
  cancelled: "neutral",
};

const EXPENSE_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "neutral",
  submitted: "warning",
  approved: "success",
  rejected: "danger",
  reimbursed: "info",
};

export type DocRef =
  | { kind: "invoice"; doc: Invoice & { clientName: string } }
  | { kind: "payment"; doc: Payment & { clientName?: string } }
  | { kind: "po"; doc: PurchaseOrder }
  | { kind: "expense"; doc: ExpenseClaim };

export function TransactionDetailView({ ref }: { ref: DocRef }) {
  if (ref.kind === "invoice") return <InvoiceDetail invoice={ref.doc} />;
  if (ref.kind === "payment") return <PaymentDetail payment={ref.doc} />;
  if (ref.kind === "po") return <PODetail po={ref.doc} />;
  return <ExpenseDetail claim={ref.doc} />;
}

function InvoiceDetail({ invoice }: { invoice: Invoice & { clientName: string } }) {
  const payments = useMemo(
    () => mockPayments.filter((p) => p.appliedToInvoiceId === invoice.id),
    [invoice.id],
  );
  const balance = Math.max(0, invoice.amount - invoice.paidAmount);
  const paidPct = invoice.amount > 0 ? Math.min(100, (invoice.paidAmount / invoice.amount) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {invoice.number}
              </span>
              <StatusBadge tone={INVOICE_TONE[invoice.status]}>{invoice.status}</StatusBadge>
              <span className="rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-300">
                {invoice.currency}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {invoice.clientName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Issued {formatDate(invoice.issueDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Due {formatDate(invoice.dueDate)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Wallet}
          label="Amount"
          value={formatIDR(invoice.amount)}
          trend="up"
        />
        <MetricCard
          icon={Banknote}
          label="Paid"
          value={formatIDR(invoice.paidAmount)}
          delta={`${Math.round(paidPct)}%`}
          accent="#22C55E"
        />
        <MetricCard
          icon={Receipt}
          label="Outstanding"
          value={formatIDR(balance)}
          accent={balance > 0 ? "#EF4444" : "#71717A"}
          trend={balance > 0 ? "down" : "flat"}
        />
        <MetricCard
          icon={Link2}
          label="Payments applied"
          value={String(payments.length)}
          accent="#3B82F6"
        />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Receipts"
          title={`Linked payments (${payments.length})`}
          description="Payment receipts that have been applied against this invoice."
        />
        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/8 p-6 text-center text-xs text-zinc-400">
            No payment receipts applied yet.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {payments.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
              >
                <span className="col-span-3 font-mono text-[11px] text-zinc-200">{p.number}</span>
                <span className="col-span-3 text-[11px] text-zinc-400">{formatDate(p.date)}</span>
                <span className="col-span-2 text-[11px] text-zinc-400">{p.method}</span>
                <span className="col-span-2 text-right font-mono text-[11px] text-emerald-300">
                  +{formatIDR(p.amount)}
                </span>
                <span className="col-span-2 text-right">
                  <StatusBadge tone={PAYMENT_TONE[p.status]}>{p.status}</StatusBadge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PaymentDetail({ payment }: { payment: Payment & { clientName?: string } }) {
  const linkedInvoice = useMemo(
    () => mockInvoices.find((i) => i.id === payment.appliedToInvoiceId) ?? null,
    [payment.appliedToInvoiceId],
  );
  const counterparty = payment.clientName ?? payment.vendor ?? "—";

  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {payment.number}
              </span>
              <StatusBadge tone={payment.type === "incoming" ? "success" : "info"}>
                {payment.type}
              </StatusBadge>
              <StatusBadge tone={PAYMENT_TONE[payment.status]}>{payment.status}</StatusBadge>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {counterparty}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {formatDate(payment.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 text-zinc-500" />
                {payment.method} · {payment.bankAccount}
              </span>
            </div>
            {payment.notes ? (
              <p className="mt-2 text-[11px] italic text-zinc-400">{payment.notes}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emphasis
          icon={Wallet}
          label="Amount"
          value={formatIDR(payment.amount)}
          trend={payment.type === "incoming" ? "up" : "down"}
          accent={payment.type === "incoming" ? "#22C55E" : "#EF4444"}
        />
        <MetricCard
          icon={Receipt}
          label="Reference"
          value={payment.reference}
          accent="#71717A"
        />
        <MetricCard
          icon={UserCircle}
          label="Counterparty"
          value={counterparty}
          accent="#3B82F6"
        />
        <MetricCard
          icon={Link2}
          label="Applied to"
          value={linkedInvoice ? linkedInvoice.number : "—"}
          delta={linkedInvoice ? linkedInvoice.status : ""}
          accent={linkedInvoice ? "#A855F7" : "#71717A"}
        />
      </div>

      {linkedInvoice ? (
        <div className="glass rounded-[20px] p-5">
          <SectionHeader eyebrow="Linked" title="Source invoice" />
          <div className="glass-soft grid grid-cols-12 items-center gap-2 rounded-xl border border-white/6 px-3 py-3">
            <span className="col-span-3 font-mono text-[11px] text-zinc-200">
              {linkedInvoice.number}
            </span>
            <span className="col-span-3 text-[11px] text-zinc-400">
              {formatDate(linkedInvoice.issueDate)} → {formatDate(linkedInvoice.dueDate)}
            </span>
            <span className="col-span-3 text-right font-mono text-[11px] text-zinc-100">
              {formatIDRCompact(linkedInvoice.amount)}
            </span>
            <span className="col-span-3 text-right">
              <StatusBadge tone={INVOICE_TONE[linkedInvoice.status]}>{linkedInvoice.status}</StatusBadge>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PODetail({ po }: { po: PurchaseOrder }) {
  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {po.number}
              </span>
              <StatusBadge tone={PO_TONE[po.status]}>{po.status}</StatusBadge>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">{po.vendor}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                {po.vendorContact}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {formatDate(po.date)} → {formatDate(po.deliveryDate)}
              </span>
            </div>
          </div>
          {po.approverName ? (
            <div className="glass-soft flex items-center gap-2 rounded-xl border border-white/6 px-3 py-2 text-[11px] text-zinc-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              Approved by {po.approverName}
              {po.approvedAt ? <span className="text-zinc-500">· {formatDate(po.approvedAt)}</span> : null}
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard emphasis icon={Wallet} label="Total" value={formatIDR(po.total)} trend="up" />
        <MetricCard icon={Receipt} label="Subtotal" value={formatIDR(po.subtotal)} accent="#71717A" />
        <MetricCard icon={Receipt} label="Tax" value={formatIDR(po.taxAmount)} accent="#F59E0B" />
        <MetricCard icon={Package} label="Line items" value={String(po.items)} accent="#3B82F6" />
      </div>

      <div className="glass rounded-[20px] p-5">
        <SectionHeader
          eyebrow="Workflow"
          title="Approval & fulfilment"
          description="Status snapshot — full audit trail will appear here once procurement logs are wired up."
        />
        <ol className="space-y-2 text-[11px]">
          <StepItem
            done
            label="Raised"
            detail={`Created ${formatDate(po.date)}`}
          />
          <StepItem
            done={po.status !== "draft"}
            label="Approved"
            detail={
              po.approverName
                ? `${po.approverName}${po.approvedAt ? ` · ${formatDate(po.approvedAt)}` : ""}`
                : po.status === "pending-approval"
                  ? "Awaiting approver"
                  : "—"
            }
          />
          <StepItem
            done={po.status === "received" || po.status === "partially-received"}
            label="Received"
            detail={
              po.status === "received"
                ? "Fully delivered"
                : po.status === "partially-received"
                  ? "Partial delivery"
                  : `Expected by ${formatDate(po.deliveryDate)}`
            }
          />
        </ol>
      </div>
    </div>
  );
}

function ExpenseDetail({ claim }: { claim: ExpenseClaim }) {
  return (
    <div className="space-y-5">
      <header className="glass rounded-[20px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {claim.number}
              </span>
              <StatusBadge tone={EXPENSE_TONE[claim.status]}>{claim.status}</StatusBadge>
              <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-300">
                {claim.category}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
              {claim.employeeName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {formatDate(claim.date)}
              </span>
              {claim.approverName ? (
                <span className="inline-flex items-center gap-1.5">
                  <FileSignature className="h-3.5 w-3.5 text-zinc-500" />
                  {claim.approverName}
                </span>
              ) : null}
              {claim.reimbursedAt ? (
                <span className="text-emerald-300">
                  reimbursed {formatDate(claim.reimbursedAt)}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-zinc-300">{claim.description}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard emphasis icon={Wallet} label="Amount" value={formatIDR(claim.amount)} trend="up" />
        <MetricCard icon={Receipt} label="Category" value={claim.category} accent="#71717A" />
        <MetricCard icon={UserCircle} label="Employee" value={claim.employeeName} accent="#3B82F6" />
        <MetricCard
          icon={CheckCircle2}
          label="Status"
          value={claim.status}
          accent={
            claim.status === "approved" || claim.status === "reimbursed"
              ? "#22C55E"
              : claim.status === "rejected"
                ? "#EF4444"
                : "#F59E0B"
          }
        />
      </div>
    </div>
  );
}

function StepItem({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="relative mt-1 flex h-2 w-2 shrink-0">
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            done ? "bg-emerald-400" : "bg-zinc-600"
          }`}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className={done ? "font-semibold text-zinc-100" : "text-zinc-300"}>{label}</div>
        <div className="text-[10px] text-zinc-400">{detail}</div>
      </div>
    </li>
  );
}
