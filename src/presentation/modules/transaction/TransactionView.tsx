"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, FileSignature, ReceiptText } from "lucide-react";
import { createTransactionService } from "@/application/factories/createTransactionService";
import type { TransactionOverviewDTO } from "@/application/use-cases/transaction/GetTransactionOverview";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { DataTable, type Column } from "@/presentation/shared/DataTable";
import { formatIDR, formatIDRCompact } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { DrillBreadcrumb, type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { TransactionDetailView, type DocRef } from "./TransactionDetailView";

type Tab = "invoices" | "payments" | "po" | "expenses";

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

const INVOICE_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "wit"> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

const TAB_LABEL: Record<Tab, string> = {
  invoices: "Invoices",
  payments: "Payments",
  po: "Purchase Orders",
  expenses: "Expenses",
};

function buildDocRef(tab: Tab, id: string, data: TransactionOverviewDTO): DocRef | null {
  if (tab === "invoices") {
    const doc = data.invoices.find((d) => d.id === id);
    return doc ? { kind: "invoice", doc } : null;
  }
  if (tab === "payments") {
    const doc = data.payments.find((d) => d.id === id);
    return doc ? { kind: "payment", doc } : null;
  }
  if (tab === "po") {
    const doc = data.purchaseOrders.find((d) => d.id === id);
    return doc ? { kind: "po", doc } : null;
  }
  const doc = data.expenseClaims.find((d) => d.id === id);
  return doc ? { kind: "expense", doc } : null;
}

function docLabel(ref: DocRef): { label: string; sublabel: string } {
  if (ref.kind === "invoice") return { label: ref.doc.clientName, sublabel: ref.doc.number };
  if (ref.kind === "payment")
    return {
      label: ref.doc.clientName ?? ref.doc.vendor ?? "Payment",
      sublabel: ref.doc.number,
    };
  if (ref.kind === "po") return { label: ref.doc.vendor, sublabel: ref.doc.number };
  return { label: ref.doc.employeeName, sublabel: ref.doc.number };
}

export function TransactionView() {
  const [data, setData] = useState<TransactionOverviewDTO | null>(null);
  const [tab, setTab] = useState<Tab>("invoices");
  const [drillId, setDrillId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await createTransactionService().getOverview();
      if (!cancelled) setData(d);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return <SkeletonLoadingView />;

  const docRef = drillId ? buildDocRef(tab, drillId, data) : null;
  const crumbLabels = docRef ? docLabel(docRef) : null;
  const crumbs: Crumb[] = docRef
    ? [
        { id: tab, label: TAB_LABEL[tab] },
        { id: drillId!, label: crumbLabels!.label, sublabel: crumbLabels!.sublabel },
      ]
    : [{ id: tab, label: TAB_LABEL[tab] }];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
            Finance · Transactions
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            {docRef ? "Document drill-down" : "Documents & money in flight"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-400">
            {docRef
              ? "Top-down: tab → document → line items / linked payments / workflow."
              : "Invoices, payments, purchase orders, and employee expense claims — each posts a journal entry to the GL when finalized."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabSwitch
            tab={tab}
            onChange={(t) => {
              setTab(t);
              setDrillId(null);
            }}
          />
          <ManageMasterDataButton moduleId="transaction" />
        </div>
      </header>

      {docRef ? (
        <>
          <DrillBreadcrumb
            crumbs={crumbs}
            onJump={(i) => i === 0 && setDrillId(null)}
            ariaLabel="Transaction drill-down"
          />
          <TransactionDetailView ref={docRef} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              emphasis
              icon={ArrowDownToLine}
              label="Invoiced (May)"
              value={formatIDRCompact(data.metrics.invoicedThisMonth)}
              delta={`${formatIDRCompact(data.metrics.collectedThisMonth)} collected`}
              trend="up"
            />
            <MetricCard
              icon={ArrowUpFromLine}
              label="Outstanding"
              value={formatIDRCompact(data.metrics.outstandingTotal)}
              delta={`${data.metrics.overdueCount} overdue`}
              accent="#F87171"
              trend={data.metrics.overdueCount > 0 ? "down" : "flat"}
            />
            <MetricCard
              icon={FileSignature}
              label="POs Pending"
              value={formatIDRCompact(data.metrics.pendingPOValue)}
              accent="#FBBF24"
            />
            <MetricCard
              icon={ReceiptText}
              label="Expense Approvals"
              value={formatIDRCompact(data.metrics.expensesAwaitingApproval)}
              accent="#60A5FA"
            />
          </div>

          {tab === "invoices" && <InvoicesTab data={data} onDrill={setDrillId} />}
          {tab === "payments" && <PaymentsTab data={data} onDrill={setDrillId} />}
          {tab === "po" && <POTab data={data} onDrill={setDrillId} />}
          {tab === "expenses" && <ExpenseTab data={data} onDrill={setDrillId} />}
        </>
      )}
    </div>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string }[] = [
    { id: "invoices", label: "Invoices" },
    { id: "payments", label: "Payments" },
    { id: "po", label: "Purchase Orders" },
    { id: "expenses", label: "Expenses" },
  ];
  return (
    <div className="glass-soft inline-flex rounded-full border border-white/8 p-0.5 text-[11px]">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            tab === o.id ? "bg-white/12 text-zinc-50" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function InvoicesTab({
  data,
  onDrill,
}: {
  data: TransactionOverviewDTO;
  onDrill: (id: string) => void;
}) {
  type Row = TransactionOverviewDTO["invoices"][number];
  const cols: Column<Row>[] = [
    {
      key: "no",
      header: "Invoice",
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-zinc-100">{r.number}</div>
          <div className="text-[10px] text-zinc-400">{r.clientName}</div>
        </div>
      ),
    },
    { key: "issue", header: "Issued", render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.issueDate)}</span> },
    { key: "due", header: "Due", render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.dueDate)}</span> },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-mono text-xs">{formatIDR(r.amount)}</span> },
    { key: "paid", header: "Paid", align: "right", render: (r) => <span className={`font-mono text-xs ${r.paidAmount >= r.amount ? "text-emerald-300" : r.paidAmount > 0 ? "text-amber-300" : "text-rose-300"}`}>{formatIDR(r.paidAmount)}</span> },
    { key: "balance", header: "Balance", align: "right", render: (r) => <span className="font-mono text-xs text-zinc-100">{formatIDR(Math.max(0, r.amount - r.paidAmount))}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge tone={INVOICE_TONE[r.status]}>{r.status}</StatusBadge> },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="AR"
        title={`Invoices (${data.invoices.length})`}
        description="Click any row to inspect linked payments + status."
      />
      <DataTable
        rows={data.invoices}
        columns={cols}
        rowKey={(r) => r.id}
        onRowClick={(r) => onDrill(r.id)}
        dense
      />
    </div>
  );
}

function PaymentsTab({
  data,
  onDrill,
}: {
  data: TransactionOverviewDTO;
  onDrill: (id: string) => void;
}) {
  type Row = TransactionOverviewDTO["payments"][number];
  const cols: Column<Row>[] = [
    { key: "no", header: "Payment", render: (r) => <span className="font-mono text-xs">{r.number}</span> },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <StatusBadge tone={r.type === "incoming" ? "success" : "info"}>{r.type}</StatusBadge>
      ),
    },
    { key: "date", header: "Date", render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.date)}</span> },
    {
      key: "party",
      header: "Counterparty",
      render: (r) => (
        <span className="text-[11px] text-zinc-300">{r.clientName ?? r.vendor ?? "—"}</span>
      ),
    },
    { key: "method", header: "Method", render: (r) => <span className="text-[11px] text-zinc-400">{r.method}</span> },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className={`font-mono text-xs ${r.type === "incoming" ? "text-emerald-300" : "text-rose-300"}`}>{r.type === "incoming" ? "+" : "-"}{formatIDR(r.amount)}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusBadge tone={r.status === "cleared" || r.status === "reconciled" ? "success" : r.status === "failed" ? "danger" : "warning"}>
          {r.status}
        </StatusBadge>
      ),
    },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="Cash"
        title={`Payments (${data.payments.length})`}
        description="Click any row to inspect the linked invoice."
      />
      <DataTable
        rows={data.payments}
        columns={cols}
        rowKey={(r) => r.id}
        onRowClick={(r) => onDrill(r.id)}
        dense
      />
    </div>
  );
}

function POTab({
  data,
  onDrill,
}: {
  data: TransactionOverviewDTO;
  onDrill: (id: string) => void;
}) {
  type Row = TransactionOverviewDTO["purchaseOrders"][number];
  const cols: Column<Row>[] = [
    {
      key: "no",
      header: "PO",
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-zinc-100">{r.number}</div>
          <div className="text-[10px] text-zinc-400">{r.vendor}</div>
        </div>
      ),
    },
    { key: "date", header: "Date", render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.date)}</span> },
    { key: "deliver", header: "Delivery", render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.deliveryDate)}</span> },
    { key: "items", header: "Items", align: "right", render: (r) => <span className="font-mono text-xs text-zinc-400">{r.items}</span> },
    { key: "total", header: "Total", align: "right", render: (r) => <span className="font-mono text-xs text-zinc-100">{formatIDR(r.total)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge tone={PO_TONE[r.status]}>{r.status}</StatusBadge> },
    { key: "approver", header: "Approver", render: (r) => <span className="text-[11px] text-zinc-400">{r.approverName ?? "—"}</span> },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="AP"
        title={`Purchase orders (${data.purchaseOrders.length})`}
        description="Click any row to inspect approval workflow + delivery."
      />
      <DataTable
        rows={data.purchaseOrders}
        columns={cols}
        rowKey={(r) => r.id}
        onRowClick={(r) => onDrill(r.id)}
        dense
      />
    </div>
  );
}

function ExpenseTab({
  data,
  onDrill,
}: {
  data: TransactionOverviewDTO;
  onDrill: (id: string) => void;
}) {
  type Row = TransactionOverviewDTO["expenseClaims"][number];
  const cols: Column<Row>[] = [
    {
      key: "no",
      header: "Claim",
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-zinc-100">{r.number}</div>
          <div className="text-[10px] text-zinc-400">{r.employeeName}</div>
        </div>
      ),
    },
    { key: "date", header: "Date", render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.date)}</span> },
    { key: "cat", header: "Category", render: (r) => <span className="text-[11px] text-zinc-300">{r.category}</span> },
    { key: "desc", header: "Description", render: (r) => <span className="text-[11px] text-zinc-300">{r.description}</span> },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-mono text-xs text-zinc-100">{formatIDR(r.amount)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge tone={EXPENSE_TONE[r.status]}>{r.status}</StatusBadge> },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="Reimbursement"
        title={`Expense claims (${data.expenseClaims.length})`}
        description="Click any row to inspect approval state + reimbursement."
      />
      <DataTable
        rows={data.expenseClaims}
        columns={cols}
        rowKey={(r) => r.id}
        onRowClick={(r) => onDrill(r.id)}
        dense
      />
    </div>
  );
}
