# WIT ERP — Backend

Go services backing the WIT ERP frontend. Clean Architecture, Postgres, microservices-ready.

---

## TL;DR

```bash
# 1. Start Postgres
make db-up

# 2. Run the HR service locally (auto-runs migrations on boot)
make dev
# → HR API at http://localhost:8081/api/v1/hr/employees

# Or run everything in docker:
make full
```

`make help` lists every target.

---

## Architecture

Standard Clean / Hexagonal layering. Each domain (`hr`, `payroll`, …) is a self-contained slice that can be deployed as its own binary **or** mounted into the API gateway as a modular monolith. Same code path, different `cmd/`.

```
                ┌─────────────────┐
   HTTP/JSON →  │  transport/http │      ←  external adapter
                └────────┬────────┘
                         │ DTOs ↔ domain
                ┌────────▼────────┐
                │    usecase      │      ←  application services (orchestration)
                └────────┬────────┘
                         │ ports
                ┌────────▼────────┐
                │     domain      │      ←  entities, value objects, validation
                └────────┬────────┘
                         │ Repository interface
                ┌────────▼────────┐
                │ repository/...  │      ←  Postgres adapter (or in-memory for tests)
                └─────────────────┘
```

**Dependency rule**: arrows only point inward.
`transport` may import `usecase` and `domain`. `usecase` may import `domain`. `domain` imports nothing from the other layers.

---

## Folder map

```
backend/
├── cmd/                          # service binaries (one per microservice)
│   ├── api-gateway/main.go       #   mounts every service for local/monolith deploy
│   └── hr-service/main.go        #   HR standalone
├── internal/
│   ├── shared/                   # cross-cutting infrastructure
│   │   ├── config/               #   viper-backed config loader
│   │   ├── database/             #   pgx pool + golang-migrate
│   │   ├── httpx/                #   JSON envelope, error helpers
│   │   ├── logger/               #   zerolog wrapper
│   │   └── middleware/           #   request ID, tenant context, CORS, recovery
│   └── hr/                       # HR bounded context
│       ├── domain/               #   Employee, Filter, Repository interface, errors
│       ├── usecase/              #   EmployeeService (Create, Get, List, Update, Delete)
│       ├── repository/postgres/  #   EmployeeRepo (pgx)
│       └── transport/http/       #   EmployeeHandler (chi routes, DTO mapping)
├── migrations/                   # golang-migrate SQL files (numbered up/down pairs)
├── deploy/Dockerfile             # multi-stage build, picks binary via --build-arg SERVICE
├── docker-compose.yml            # postgres + (optional) gateway + hr-service
├── Makefile                      # dev workflow
└── .env.example                  # env vars reference
```

---

## Running

### Prerequisites
- Go 1.22+
- Docker + Docker Compose (for Postgres)
- `make`

### Local dev (Go on host, Postgres in Docker)

```bash
make db-up         # starts Postgres on :5432
make run-hr        # starts HR service on :8081, auto-runs migrations
# or
make dev           # both of the above
```

Sanity check:

```bash
curl http://localhost:8081/healthz
# {"status":"ok","service":"hr"}

curl http://localhost:8081/api/v1/hr/employees
# {"data":[],"total":0,"limit":50,"offset":0}
```

### Everything in Docker

```bash
make full
# Postgres + api-gateway (:8080) + hr-service (:8081), with migrations applied automatically.
```

---

## Migrations

Files live in [`migrations/`](./migrations) as numbered up/down pairs (`NNN_name.up.sql` / `NNN_name.down.sql`).

```bash
make migrate-up                       # apply all pending
make migrate-down                     # roll back the last one
make migrate-status                   # current version
make migrate-new name=add_payroll     # scaffold a new pair
```

Migrations applied on service boot too (controlled by `DB_AUTO_MIGRATE=true`). Set `false` in prod and run them out-of-band.

| #   | File                          | Domain                                      |
| --- | ----------------------------- | ------------------------------------------- |
| 001 | `extensions`                  | pgcrypto / citext / pg_trgm                 |
| 002 | `organizations`               | entities, departments, divisions             |
| 003 | `hr_core`                     | grades, positions, shifts, calendars, leave types |
| 004 | `user_profiles`               | central person record                       |
| 005 | `employees`                   | HR extension of user_profiles               |
| 006 | `salary_core`                 | components, salary matrix, allowance matrix  |
| 007 | `attendance`                  | records, fine config, fine tiers (per spec) |
| 008 | `leave`                       | requests, employee leave balances           |
| 009 | `employee_histories`          | salaries, allowances, family, education, work history |
| 010 | `payroll`                     | periods + per-employee details + calibration logs |
| 011 | `performance_360`             | templates, questions, submissions, rater settings |
| 012 | `position_eligibility`        | allowance + fine subject toggles per position |
| 013 | `clients`                     | customer accounts                            |
| 014 | `leads`                       | sales pipeline + activities                  |
| 015 | `projects`                    | projects + epics + stories + sprints + tasks |
| 016 | `support`                     | tickets + change requests                    |
| 017 | `transactions`                | invoices + payments + POs + expense claims   |
| 018 | `timesheet`                   | time entries with approval workflow          |
| 019 | `knowledge`                   | articles + categories + tags (gin search)    |
| 020 | `admin`                       | auth users, RBAC roles/permissions, sessions, audit log |
| 021 | `portal`                      | chat, onboarding tasks, HR meeting slots/requests |
| 022 | `master_data`                 | generic md_categories + jsonb md_items       |

Every frontend domain now has a corresponding migration. Add a new one with `make migrate-new name=add_xyz`.

---

## API surface

All routes are tenant-scoped via the `X-Tenant-Id` header (falls back to `TENANT_ID` env var). Every list endpoint accepts `?search=`, `?limit=`, `?offset=` and entity-specific filters. List responses wrap data in `{ data, total, limit, offset }`; single-item responses wrap in `{ data }`.

| Domain      | Base path                  | Endpoints (CRUD unless noted)                          |
| ----------- | -------------------------- | ------------------------------------------------------ |
| HR          | `/api/v1/hr/employees`     | full CRUD                                              |
| Clients     | `/api/v1/clients/clients`  | full CRUD                                              |
| Sales       | `/api/v1/sales/leads`      | full CRUD                                              |
| Projects    | `/api/v1/projects/projects`| full CRUD                                              |
| Support     | `/api/v1/support/tickets`  | full CRUD                                              |
| Transactions| `/api/v1/transactions/invoices` | full CRUD                                          |
| Performance | `/api/v1/performance/templates` | full CRUD                                          |
| Dashboard   | `/api/v1/dashboard/overview` | GET (computed)                                       |
| KPIs        | `/api/v1/kpis`             | GET (computed)                                         |
| Reports     | `/api/v1/reports/templates`<br>`/api/v1/reports/runs`<br>`/api/v1/reports/scheduled` | GET (catalogue + stubs) |

Quick smoke test once the gateway is up:

```bash
curl http://localhost:8080/healthz
curl http://localhost:8080/api/v1/clients/clients
curl http://localhost:8080/api/v1/sales/leads
curl http://localhost:8080/api/v1/projects/projects
curl http://localhost:8080/api/v1/support/tickets
curl http://localhost:8080/api/v1/transactions/invoices
curl http://localhost:8080/api/v1/performance/templates
curl http://localhost:8080/api/v1/dashboard/overview
curl http://localhost:8080/api/v1/kpis
curl http://localhost:8080/api/v1/reports/templates
```

Every table:
- Carries `tenant_id` for multi-tenancy.
- Has `created_at` / `updated_at` (where mutable).
- Enables **Row-Level Security** (currently permissive — tighten in prod by setting policies that filter `tenant_id` against a session var).

---

## Adding a new microservice

Repeat the HR pattern. Example: payroll.

1. **Migration**: `migrations/010_payroll.up.sql` + `.down.sql` for `payroll_periods`, `payroll_details`, etc. Source from `docs/modules/payroll.md`.
2. **Domain**: `internal/payroll/domain/period.go` (entities + `Repository` interface).
3. **Usecase**: `internal/payroll/usecase/period.go` (`PeriodService` orchestrating the domain).
4. **Repo**: `internal/payroll/repository/postgres/period.go` (pgx adapter implementing the interface).
5. **Transport**: `internal/payroll/transport/http/period_handler.go` (chi routes).
6. **Binary**: `cmd/payroll-service/main.go` (copy hr-service/main.go, swap imports).
7. **Gateway mount**: add `r.Route("/api/v1/payroll", ...)` to `cmd/api-gateway/main.go`.
8. **Docker**: optional — duplicate the `hr-service` block in `docker-compose.yml`.

The domain stays a **pure Go package**. The same code can be exposed via gRPC, message queue, or CLI — write another transport adapter, no domain changes.

---

## Config

Every binary reads env vars (also via `.env` if loaded by your shell). Service-scoped overrides win over the shared defaults:

| Env var                 | Default                                 | Notes                                |
| ----------------------- | --------------------------------------- | ------------------------------------ |
| `DATABASE_URL`          | `postgres://wit:wit@localhost:5432/...` | Required                             |
| `HTTP_PORT`             | 8080                                    | Gateway default                      |
| `HR_HTTP_PORT`          | —                                       | Overrides `HTTP_PORT` for HR service |
| `DB_AUTO_MIGRATE`       | `true`                                  | Set `false` in prod                  |
| `DB_MIGRATIONS_DIR`     | `migrations`                            | Relative to working dir              |
| `LOG_LEVEL`             | `info`                                  | `debug` / `info` / `warn` / `error`  |
| `LOG_PRETTY`            | `true`                                  | Pretty console; `false` = JSON       |
| `TENANT_ID`             | `0000…0001`                             | Default tenant if header missing     |

---

## Tenancy

Every request is tenant-scoped via `X-Tenant-Id` header. Missing/invalid → falls back to `TENANT_ID` env var. Tenant is pulled into the request context by middleware and read in handlers via `middleware.TenantFrom(ctx)`. SQL is parameterised; every `WHERE` includes `tenant_id`.

When you turn on RLS in prod, swap the permissive policies for ones that compare `tenant_id` to a per-connection setting (e.g. `current_setting('app.tenant_id')::uuid`) — the schema already has the policy hooks in place.

---

## Why two `cmd/` binaries?

`api-gateway` is the **modular monolith** entry — one process, all routes, fastest to boot in dev. `hr-service` is the same code wired up as a **standalone microservice** — proves the separation works and gives you a deploy target the day you split it off.

Production options:
- **Monolith**: ship `api-gateway`, scale horizontally.
- **Microservices**: ship `hr-service`, `payroll-service`, etc., each behind its own load balancer or service mesh. The HTTP contracts are stable; cross-service calls become HTTP/gRPC instead of in-process function calls.

The domain code doesn't change between the two.

---

## Testing

```bash
make test       # unit tests; uses in-memory repos where the use case is exercised.
make lint       # go vet (extend with golangci-lint when set up)
```

Integration tests against a real Postgres are recommended — wire them up under `internal/<domain>/repository/postgres/*_test.go` using `testcontainers-go` or a disposable DB created via `docker-compose run`.

---

## Frontend wiring

The Next.js frontend (root of the repo) is unchanged. To point it at this backend, set the API base URL on the frontend side (e.g. `NEXT_PUBLIC_API_URL=http://localhost:8080`) and replace the in-memory mocks in `src/infrastructure/data/*` with `fetch` calls to `/api/v1/hr/employees` (etc.) when you're ready to cut over.

---

## What's missing (deliberately)

- gRPC transport (HTTP-only for now).
- Service discovery / circuit breakers — bolt on when you actually split services.
- Auth middleware — the slot exists (`middleware.Stack`) but no JWT verifier yet. Plug Supabase / Cognito / your IdP into the tenant context middleware.
- `golangci-lint`, `goreleaser`, CI — pure preference, add as you go.

The skeleton is intentionally lean so you can shape it. Everything above is the floor, not the ceiling.
