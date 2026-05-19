-- ============================================================
-- 017_transactions.sql
-- Invoices, Payments, Purchase Orders, Expense Claims.
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  number        varchar(40) NOT NULL,
  client_id     uuid NOT NULL REFERENCES clients(id),
  project_id    uuid REFERENCES projects(id),
  issue_date    date NOT NULL,
  due_date      date NOT NULL,
  amount        numeric(15,2) NOT NULL DEFAULT 0,
  paid_amount   numeric(15,2) NOT NULL DEFAULT 0,
  status        varchar(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','paid','overdue','void')),
  currency      varchar(3) NOT NULL DEFAULT 'IDR',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number)
);

CREATE TABLE IF NOT EXISTS payments (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid NOT NULL,
  number                   varchar(40) NOT NULL,
  type                     varchar(10) NOT NULL CHECK (type IN ('incoming','outgoing')),
  date                     date NOT NULL,
  amount                   numeric(15,2) NOT NULL DEFAULT 0,
  method                   varchar(40),
  bank_account             varchar(120),
  reference                varchar(200),
  client_id                uuid REFERENCES clients(id),
  vendor                   varchar(200),
  applied_to_invoice_id    uuid REFERENCES invoices(id),
  status                   varchar(20) NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','cleared','reconciled','failed')),
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  number          varchar(40) NOT NULL,
  vendor          varchar(200) NOT NULL,
  vendor_contact  varchar(200),
  date            date NOT NULL,
  delivery_date   date,
  subtotal        numeric(15,2) NOT NULL DEFAULT 0,
  tax_amount      numeric(15,2) NOT NULL DEFAULT 0,
  total           numeric(15,2) NOT NULL DEFAULT 0,
  status          varchar(30) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','pending-approval','approved','partially-received','received','cancelled')),
  approver_name   varchar(200),
  approved_at     timestamptz,
  items           integer NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, number)
);

CREATE TABLE IF NOT EXISTS expense_claims (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL,
  number           varchar(40) NOT NULL,
  employee_name    varchar(200) NOT NULL,
  date             date NOT NULL,
  category         varchar(40) NOT NULL,
  amount           numeric(15,2) NOT NULL DEFAULT 0,
  status           varchar(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','submitted','approved','rejected','reimbursed')),
  description      text,
  approver_name    varchar(200),
  reimbursed_at    timestamptz,
  UNIQUE (tenant_id, number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(applied_to_invoice_id);
CREATE INDEX IF NOT EXISTS idx_pos_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expense_tenant ON expense_claims(tenant_id);

ALTER TABLE invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_claims   ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_all        ON invoices        FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY payments_all        ON payments        FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY purchase_orders_all ON purchase_orders FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY expense_claims_all  ON expense_claims  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
