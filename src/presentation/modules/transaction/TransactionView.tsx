"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, ChevronsUpDown, ChevronUp, FileSignature, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import { createTransactionService } from "@/application/factories/createTransactionService";
import type { TransactionOverviewDTO } from "@/application/use-cases/transaction/GetTransactionOverview";
import type { ExpenseClaim, Payment, PurchaseOrder } from "@/domain/entities/Transaction";
import type { Invoice } from "@/domain/entities/Invoice";
import { mockClients } from "@/infrastructure/data/clients.mock";
import { usePaymentsStore } from "@/state/payments.store";
import { useInvoicesStore } from "@/state/invoices.store";
import { usePurchaseOrdersStore } from "@/state/purchaseOrders.store";
import { useExpenseClaimsStore } from "@/state/expenseClaims.store";
import { useToast } from "@/state/toast.store";
import { useHotkey } from "@/hooks/useHotkey";
import { MetricCard } from "@/presentation/shared/MetricCard";
import { SectionHeader } from "@/presentation/shared/SectionHeader";
import { StatusBadge } from "@/presentation/shared/StatusBadge";
import { type Column } from "@/presentation/shared/DataTable";
import { formatIDR, formatIDRCompact } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/cn";
import { ManageMasterDataButton } from "@/presentation/shared/ManageMasterDataButton";
import { DrillBreadcrumb, type Crumb } from "@/presentation/shared/DrillBreadcrumb";
import { SkeletonLoadingView } from "@/presentation/shared/Skeleton";
import { TransactionDetailView, type DocRef } from "./TransactionDetailView";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { InvoiceFormDialog } from "./InvoiceFormDialog";
import { POFormDialog } from "./POFormDialog";
import { ExpenseFormDialog } from "./ExpenseFormDialog";
import { DeleteConfirmDialog } from "@/presentation/shared/DeleteConfirmDialog";

type Tab = "invoices" | "payments" | "po" | "expenses";

type SortDir = "asc" | "desc";
type SortState = { key: string; dir: SortDir } | null;

/**
 * A column that can be sorted. Extends the shared {@link Column} with an
 * optional `sortValue` extractor — when present the column header becomes a
 * clickable sort toggle. Action columns simply omit `sortValue`.
 */
type SortableColumn<T> = Column<T> & {
  sortValue?: (row: T) => string | number | null | undefined;
};

/** Compare two extracted sort values, sorting nullish to the end of "asc". */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/**
 * Drop-in replacement for {@link DataTable} for the transaction tables.
 * Adds clickable column-header sorting (asc ⇄ desc) and a sticky header that
 * stays pinned while the body scrolls. Sorting returns a sorted COPY of `rows`
 * — the source array is never mutated. Cell rendering, row striping, and click
 * behaviour mirror DataTable exactly so nothing visual changes besides the new
 * sort affordances.
 */
function SortableTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
}: {
  columns: SortableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  const [sort, setSort] = useState<SortState>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const extract = col.sortValue;
    const factor = sort.dir === "asc" ? 1 : -1;
    // Sort a COPY — never mutate the source rows array.
    return [...rows].sort((a, b) => compareValues(extract(a), extract(b)) * factor);
  }, [rows, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev && prev.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-400">
        No records.
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-auto rounded-2xl border border-white/8">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-white/[0.03] backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70">
          <tr>
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const sortable = Boolean(col.sortValue);
              return (
                <th
                  key={col.key}
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                  style={{ width: col.width }}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-zinc-100",
                        col.align === "right" && "flex-row-reverse",
                        active && "text-zinc-100",
                      )}
                    >
                      {col.header}
                      {active ? (
                        sort!.dir === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 text-zinc-600" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-t border-white/5 transition-colors hover:bg-white/[0.04]",
                onRowClick && "cursor-pointer",
                i % 2 === 1 && "bg-white/[0.015]",
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-2 text-xs text-zinc-200",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  // Payments + Invoices CRUD via stores. PO + Expenses still use the DTO.
  const storePayments = usePaymentsStore((s) => s.items);
  const hydratePayments = usePaymentsStore((s) => s.hydrate);
  const addPayment = usePaymentsStore((s) => s.add);
  const updatePayment = usePaymentsStore((s) => s.update);
  const removePayment = usePaymentsStore((s) => s.remove);

  const storeInvoices = useInvoicesStore((s) => s.items);
  const hydrateInvoices = useInvoicesStore((s) => s.hydrate);
  const addInvoice = useInvoicesStore((s) => s.add);
  const updateInvoice = useInvoicesStore((s) => s.update);
  const removeInvoice = useInvoicesStore((s) => s.remove);

  const storePOs = usePurchaseOrdersStore((s) => s.items);
  const hydratePOs = usePurchaseOrdersStore((s) => s.hydrate);
  const addPO = usePurchaseOrdersStore((s) => s.add);
  const updatePO = usePurchaseOrdersStore((s) => s.update);
  const removePO = usePurchaseOrdersStore((s) => s.remove);

  const storeExpenses = useExpenseClaimsStore((s) => s.items);
  const hydrateExpenses = useExpenseClaimsStore((s) => s.hydrate);
  const addExpense = useExpenseClaimsStore((s) => s.add);
  const updateExpense = useExpenseClaimsStore((s) => s.update);
  const removeExpense = useExpenseClaimsStore((s) => s.remove);

  const toast = useToast();

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<Payment | null>(null);

  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<Invoice | null>(null);

  const [poFormOpen, setPOFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [confirmDeletePO, setConfirmDeletePO] = useState<PurchaseOrder | null>(null);

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseClaim | null>(null);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<ExpenseClaim | null>(null);

  // ⌘N opens whichever creator matches the currently-selected tab.
  useHotkey("mod+n", (e) => {
    e.preventDefault();
    if (tab === "invoices") {
      setEditingInvoice(null);
      setInvoiceFormOpen(true);
    } else if (tab === "payments") {
      setEditingPayment(null);
      setPaymentFormOpen(true);
    } else if (tab === "po") {
      setEditingPO(null);
      setPOFormOpen(true);
    } else if (tab === "expenses") {
      setEditingExpense(null);
      setExpenseFormOpen(true);
    }
  });

  useEffect(() => {
    hydratePayments();
    hydrateInvoices();
    hydratePOs();
    hydrateExpenses();
    let cancelled = false;
    (async () => {
      const d = await createTransactionService().getOverview();
      if (!cancelled) setData(d);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydratePayments, hydrateInvoices, hydratePOs, hydrateExpenses]);

  // Merge store payments + invoices into the DTO so the tabs reflect live edits.
  const mergedData: TransactionOverviewDTO | null = useMemo(() => {
    if (!data) return null;
    const clientMap = new Map(mockClients.map((c) => [c.id, c.name]));
    const enrichedPayments = storePayments.map((p) => ({
      ...p,
      clientName: p.clientId ? clientMap.get(p.clientId) : undefined,
    }));
    const enrichedInvoices = storeInvoices.map((i) => ({
      ...i,
      clientName: clientMap.get(i.clientId) ?? "Unknown",
    }));
    return {
      ...data,
      payments: enrichedPayments,
      invoices: enrichedInvoices,
      purchaseOrders: storePOs,
      expenseClaims: storeExpenses,
    };
  }, [data, storePayments, storeInvoices, storePOs, storeExpenses]);

  if (!mergedData) return <SkeletonLoadingView />;
  const view = mergedData;

  const docRef = drillId ? buildDocRef(tab, drillId, view) : null;
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
              value={formatIDRCompact(view.metrics.invoicedThisMonth)}
              delta={`${formatIDRCompact(view.metrics.collectedThisMonth)} collected`}
              trend="up"
            />
            <MetricCard
              icon={ArrowUpFromLine}
              label="Outstanding"
              value={formatIDRCompact(view.metrics.outstandingTotal)}
              delta={`${view.metrics.overdueCount} overdue`}
              accent="#F87171"
              trend={view.metrics.overdueCount > 0 ? "down" : "flat"}
            />
            <MetricCard
              icon={FileSignature}
              label="POs Pending"
              value={formatIDRCompact(view.metrics.pendingPOValue)}
              accent="#FBBF24"
            />
            <MetricCard
              icon={ReceiptText}
              label="Expense Approvals"
              value={formatIDRCompact(view.metrics.expensesAwaitingApproval)}
              accent="#60A5FA"
            />
          </div>

          {tab === "invoices" && (
            <InvoicesTab
              data={view}
              onDrill={setDrillId}
              onAdd={() => {
                setEditingInvoice(null);
                setInvoiceFormOpen(true);
              }}
              onEdit={(i) => {
                setEditingInvoice(i);
                setInvoiceFormOpen(true);
              }}
              onDelete={setConfirmDeleteInvoice}
            />
          )}
          {tab === "payments" && (
            <PaymentsTab
              data={view}
              onDrill={setDrillId}
              onAdd={() => {
                setEditingPayment(null);
                setPaymentFormOpen(true);
              }}
              onEdit={(p) => {
                setEditingPayment(p);
                setPaymentFormOpen(true);
              }}
              onDelete={setConfirmDeletePayment}
            />
          )}
          {tab === "po" && (
            <POTab
              data={view}
              onDrill={setDrillId}
              onAdd={() => {
                setEditingPO(null);
                setPOFormOpen(true);
              }}
              onEdit={(p) => {
                setEditingPO(p);
                setPOFormOpen(true);
              }}
              onDelete={setConfirmDeletePO}
            />
          )}
          {tab === "expenses" && (
            <ExpenseTab
              data={view}
              onDrill={setDrillId}
              onAdd={() => {
                setEditingExpense(null);
                setExpenseFormOpen(true);
              }}
              onEdit={(c) => {
                setEditingExpense(c);
                setExpenseFormOpen(true);
              }}
              onDelete={setConfirmDeleteExpense}
            />
          )}
        </>
      )}

      <PaymentFormDialog
        open={paymentFormOpen}
        editing={editingPayment}
        onClose={() => setPaymentFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updatePayment(editingId, draft);
            toast.success("Payment updated", draft.reference || "Updated payment");
          } else {
            addPayment(draft);
            toast.success("Payment recorded", draft.reference || "New payment");
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDeletePayment}
        title="Remove payment?"
        description={
          confirmDeletePayment
            ? `${confirmDeletePayment.number} for ${confirmDeletePayment.amount.toLocaleString("id-ID")} IDR will be removed. The matching GL journal will need to be reversed manually.`
            : ""
        }
        onCancel={() => setConfirmDeletePayment(null)}
        onConfirm={() => {
          if (!confirmDeletePayment) return;
          const ref = confirmDeletePayment.number;
          removePayment(confirmDeletePayment.id);
          setConfirmDeletePayment(null);
          setDrillId(null);
          toast.info("Payment removed", `${ref} has been archived.`);
        }}
      />

      <InvoiceFormDialog
        open={invoiceFormOpen}
        editing={editingInvoice}
        onClose={() => setInvoiceFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateInvoice(editingId, draft);
            toast.success("Invoice updated", `${editingInvoice?.number ?? "Updated"}`);
          } else {
            const created = addInvoice(draft);
            toast.success("Invoice created", created.number);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDeleteInvoice}
        title="Void & remove invoice?"
        description={
          confirmDeleteInvoice
            ? `${confirmDeleteInvoice.number} (${confirmDeleteInvoice.currency} ${confirmDeleteInvoice.amount.toLocaleString("id-ID")}) will be removed from AR. Any linked payments stay but become orphaned.`
            : ""
        }
        onCancel={() => setConfirmDeleteInvoice(null)}
        onConfirm={() => {
          if (!confirmDeleteInvoice) return;
          const ref = confirmDeleteInvoice.number;
          removeInvoice(confirmDeleteInvoice.id);
          setConfirmDeleteInvoice(null);
          setDrillId(null);
          toast.info("Invoice removed", `${ref} has been archived.`);
        }}
      />

      <POFormDialog
        open={poFormOpen}
        editing={editingPO}
        onClose={() => setPOFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updatePO(editingId, draft);
            toast.success("PO updated", editingPO?.number ?? "Updated");
          } else {
            const created = addPO(draft);
            toast.success("PO created", created.number);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDeletePO}
        title="Remove purchase order?"
        description={
          confirmDeletePO
            ? `${confirmDeletePO.number} from ${confirmDeletePO.vendor} (total IDR ${confirmDeletePO.total.toLocaleString("id-ID")}) will be removed. Receipts and approval history are archived for audit.`
            : ""
        }
        onCancel={() => setConfirmDeletePO(null)}
        onConfirm={() => {
          if (!confirmDeletePO) return;
          const ref = confirmDeletePO.number;
          removePO(confirmDeletePO.id);
          setConfirmDeletePO(null);
          setDrillId(null);
          toast.info("PO removed", `${ref} has been archived.`);
        }}
      />

      <ExpenseFormDialog
        open={expenseFormOpen}
        editing={editingExpense}
        onClose={() => setExpenseFormOpen(false)}
        onSubmit={(draft, editingId) => {
          if (editingId) {
            updateExpense(editingId, draft);
            toast.success("Claim updated", editingExpense?.number ?? "Updated");
          } else {
            const created = addExpense(draft);
            toast.success("Claim submitted", created.number);
          }
        }}
      />
      <DeleteConfirmDialog
        open={confirmDeleteExpense}
        title="Remove expense claim?"
        description={
          confirmDeleteExpense
            ? `${confirmDeleteExpense.number} (${confirmDeleteExpense.category}, IDR ${confirmDeleteExpense.amount.toLocaleString("id-ID")}) will be removed. If already reimbursed, reverse the GL entry manually.`
            : ""
        }
        onCancel={() => setConfirmDeleteExpense(null)}
        onConfirm={() => {
          if (!confirmDeleteExpense) return;
          const ref = confirmDeleteExpense.number;
          removeExpense(confirmDeleteExpense.id);
          setConfirmDeleteExpense(null);
          setDrillId(null);
          toast.info("Claim removed", `${ref} has been archived.`);
        }}
      />
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
  onAdd,
  onEdit,
  onDelete,
}: {
  data: TransactionOverviewDTO;
  onDrill: (id: string) => void;
  onAdd: () => void;
  onEdit: (i: Invoice) => void;
  onDelete: (i: Invoice) => void;
}) {
  type Row = TransactionOverviewDTO["invoices"][number];
  const cols: SortableColumn<Row>[] = [
    {
      key: "no",
      header: "Invoice",
      sortValue: (r) => r.number,
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-zinc-100">{r.number}</div>
          <div className="text-[10px] text-zinc-400">{r.clientName}</div>
        </div>
      ),
    },
    { key: "issue", header: "Issued", sortValue: (r) => r.issueDate, render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.issueDate)}</span> },
    { key: "due", header: "Due", sortValue: (r) => r.dueDate, render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.dueDate)}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, render: (r) => <span className="font-mono text-xs">{formatIDR(r.amount)}</span> },
    { key: "paid", header: "Paid", align: "right", sortValue: (r) => r.paidAmount, render: (r) => <span className={`font-mono text-xs ${r.paidAmount >= r.amount ? "text-emerald-300" : r.paidAmount > 0 ? "text-amber-300" : "text-rose-300"}`}>{formatIDR(r.paidAmount)}</span> },
    { key: "balance", header: "Balance", align: "right", sortValue: (r) => Math.max(0, r.amount - r.paidAmount), render: (r) => <span className="font-mono text-xs text-zinc-100">{formatIDR(Math.max(0, r.amount - r.paidAmount))}</span> },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <StatusBadge tone={INVOICE_TONE[r.status]}>{r.status}</StatusBadge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => {
        const stripId = (id: string) => id;
        const fullRow: Invoice = {
          id: stripId(r.id),
          number: r.number,
          clientId: r.clientId,
          projectId: r.projectId,
          issueDate: r.issueDate,
          dueDate: r.dueDate,
          amount: r.amount,
          paidAmount: r.paidAmount,
          status: r.status,
          currency: r.currency,
          notes: r.notes,
        };
        return (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onEdit(fullRow)}
              aria-label="Edit invoice"
              className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(fullRow)}
              aria-label="Delete invoice"
              className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        );
      },
    },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="AR"
        title={`Invoices (${data.invoices.length})`}
        description="Click any row to inspect linked payments + status."
        action={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
          >
            <Plus className="h-3 w-3" />
            New invoice
          </button>
        }
      />
      <SortableTable
        rows={data.invoices}
        columns={cols}
        rowKey={(r) => r.id}
        onRowClick={(r) => onDrill(r.id)}
      />
    </div>
  );
}

function PaymentsTab({
  data,
  onDrill,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: TransactionOverviewDTO;
  onDrill: (id: string) => void;
  onAdd: () => void;
  onEdit: (p: Payment) => void;
  onDelete: (p: Payment) => void;
}) {
  type Row = TransactionOverviewDTO["payments"][number];
  const cols: SortableColumn<Row>[] = [
    { key: "no", header: "Payment", sortValue: (r) => r.number, render: (r) => <span className="font-mono text-xs">{r.number}</span> },
    {
      key: "type",
      header: "Type",
      sortValue: (r) => r.type,
      render: (r) => (
        <StatusBadge tone={r.type === "incoming" ? "success" : "info"}>{r.type}</StatusBadge>
      ),
    },
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.date)}</span> },
    {
      key: "party",
      header: "Counterparty",
      sortValue: (r) => r.clientName ?? r.vendor ?? "",
      render: (r) => (
        <span className="text-[11px] text-zinc-300">{r.clientName ?? r.vendor ?? "—"}</span>
      ),
    },
    { key: "method", header: "Method", sortValue: (r) => r.method, render: (r) => <span className="text-[11px] text-zinc-400">{r.method}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, render: (r) => <span className={`font-mono text-xs ${r.type === "incoming" ? "text-emerald-300" : "text-rose-300"}`}>{r.type === "incoming" ? "+" : "-"}{formatIDR(r.amount)}</span> },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => (
        <StatusBadge tone={r.status === "cleared" || r.status === "reconciled" ? "success" : r.status === "failed" ? "danger" : "warning"}>
          {r.status}
        </StatusBadge>
      ),
    },
  ];
  const actionCol: SortableColumn<Row> = {
    key: "actions",
    header: "",
    align: "right",
    render: (r) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onEdit(r)}
          aria-label="Edit payment"
          className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(r)}
          aria-label="Delete payment"
          className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    ),
  };
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="Cash"
        title={`Payments (${data.payments.length})`}
        description="Click any row to inspect the linked invoice."
        action={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
          >
            <Plus className="h-3 w-3" />
            Record payment
          </button>
        }
      />
      <SortableTable
        rows={data.payments}
        columns={[...cols, actionCol]}
        rowKey={(r) => r.id}
        onRowClick={(r) => onDrill(r.id)}
      />
    </div>
  );
}

function POTab({
  data,
  onDrill,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: TransactionOverviewDTO;
  onDrill: (id: string) => void;
  onAdd: () => void;
  onEdit: (p: PurchaseOrder) => void;
  onDelete: (p: PurchaseOrder) => void;
}) {
  type Row = TransactionOverviewDTO["purchaseOrders"][number];
  const cols: SortableColumn<Row>[] = [
    {
      key: "no",
      header: "PO",
      sortValue: (r) => r.number,
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-zinc-100">{r.number}</div>
          <div className="text-[10px] text-zinc-400">{r.vendor}</div>
        </div>
      ),
    },
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.date)}</span> },
    { key: "deliver", header: "Delivery", sortValue: (r) => r.deliveryDate, render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.deliveryDate)}</span> },
    { key: "items", header: "Items", align: "right", sortValue: (r) => r.items, render: (r) => <span className="font-mono text-xs text-zinc-400">{r.items}</span> },
    { key: "total", header: "Total", align: "right", sortValue: (r) => r.total, render: (r) => <span className="font-mono text-xs text-zinc-100">{formatIDR(r.total)}</span> },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <StatusBadge tone={PO_TONE[r.status]}>{r.status}</StatusBadge> },
    { key: "approver", header: "Approver", sortValue: (r) => r.approverName ?? "", render: (r) => <span className="text-[11px] text-zinc-400">{r.approverName ?? "—"}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(r)}
            aria-label="Edit purchase order"
            className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(r)}
            aria-label="Delete purchase order"
            className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="AP"
        title={`Purchase orders (${data.purchaseOrders.length})`}
        description="Click any row to inspect approval workflow + delivery."
        action={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
          >
            <Plus className="h-3 w-3" />
            New PO
          </button>
        }
      />
      <SortableTable
        rows={data.purchaseOrders}
        columns={cols}
        rowKey={(r) => r.id}
        onRowClick={(r) => onDrill(r.id)}
      />
    </div>
  );
}

function ExpenseTab({
  data,
  onDrill,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: TransactionOverviewDTO;
  onDrill: (id: string) => void;
  onAdd: () => void;
  onEdit: (c: ExpenseClaim) => void;
  onDelete: (c: ExpenseClaim) => void;
}) {
  type Row = TransactionOverviewDTO["expenseClaims"][number];
  const cols: SortableColumn<Row>[] = [
    {
      key: "no",
      header: "Claim",
      sortValue: (r) => r.number,
      render: (r) => (
        <div>
          <div className="font-mono text-xs text-zinc-100">{r.number}</div>
          <div className="text-[10px] text-zinc-400">{r.employeeName}</div>
        </div>
      ),
    },
    { key: "date", header: "Date", sortValue: (r) => r.date, render: (r) => <span className="text-[11px] text-zinc-300">{formatDate(r.date)}</span> },
    { key: "cat", header: "Category", sortValue: (r) => r.category, render: (r) => <span className="text-[11px] text-zinc-300">{r.category}</span> },
    { key: "desc", header: "Description", sortValue: (r) => r.description, render: (r) => <span className="text-[11px] text-zinc-300">{r.description}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, render: (r) => <span className="font-mono text-xs text-zinc-100">{formatIDR(r.amount)}</span> },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <StatusBadge tone={EXPENSE_TONE[r.status]}>{r.status}</StatusBadge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(r)}
            aria-label="Edit claim"
            className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(r)}
            aria-label="Delete claim"
            className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="glass rounded-[20px] p-5">
      <SectionHeader
        eyebrow="Reimbursement"
        title={`Expense claims (${data.expenseClaims.length})`}
        description="Click any row to inspect approval state + reimbursement."
        action={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-900 transition-colors hover:bg-white"
          >
            <Plus className="h-3 w-3" />
            New claim
          </button>
        }
      />
      <SortableTable
        rows={data.expenseClaims}
        columns={cols}
        rowKey={(r) => r.id}
        onRowClick={(r) => onDrill(r.id)}
      />
    </div>
  );
}
