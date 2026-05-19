# WIT ERP OS

A full-stack ERP system with a MacOS/iPadOS-inspired shell, Clean Architecture on both sides of the wire, and a microservices-ready Go backend.

```
┌─────────────────────────────────────────────────────────┐
│                      WIT ERP OS                         │
├──────────────────────────────┬──────────────────────────┤
│   FRONTEND (this folder)     │   BACKEND  (backend/)    │
│   Next.js 16 + TypeScript    │   Go 1.22                │
│   Tailwind v4 + Zustand      │   chi + pgx + zerolog    │
│   Clean Arch (domain/usecase)│   Clean Arch (hex)       │
│   In-memory mocks today      │   PostgreSQL persistence │
│                              │   golang-migrate         │
└──────────────────────────────┴──────────────────────────┘
```

The frontend and backend are independent — the frontend currently runs entirely on mock data in [`src/infrastructure/data/`](./src/infrastructure/data) and can be developed without ever touching the backend. When you wire them up, replace the mock factories with `fetch` calls to the backend's `/api/v1/*` routes.

---

## Repo layout

```
.
├── src/                  ← Next.js frontend (this is what `npm run dev` serves)
│   ├── app/              ← App-router pages
│   ├── domain/           ← entities, value objects, repository ports
│   ├── application/      ← use cases, services, factories
│   ├── infrastructure/   ← mock data + concrete repository implementations
│   └── presentation/     ← React components (shells, modules, shared UI)
│
├── backend/              ← Go services + Postgres migrations  (see backend/README.md)
│   ├── cmd/              ← service binaries (api-gateway, hr-service, …)
│   ├── internal/         ← clean-architecture layers per bounded context
│   ├── migrations/       ← golang-migrate SQL files
│   ├── deploy/           ← Dockerfile
│   ├── docker-compose.yml
│   └── Makefile
│
├── public/               ← static assets
├── AGENTS.md / CLAUDE.md ← instructions for the AI assistant
└── README.md             ← you are here
```

---

## Frontend

```bash
npm install
npm run dev
# → http://localhost:3000
```

15 module apps, login screen, drill-down everywhere, OneUI + macOS icon style, aurora wallpaper. State persists to localStorage. Detailed feature list in [src/presentation/](./src/presentation/).

---

## Backend

```bash
cd backend
make db-up         # start Postgres (Docker)
make dev           # run HR microservice on :8081 (auto-migrate on boot)
# Try it:
curl http://localhost:8081/healthz
curl http://localhost:8081/api/v1/hr/employees
```

Full instructions, architecture diagram, and the recipe for adding a new microservice: **[backend/README.md](./backend/README.md)**.

---

## Why the split?

- **Frontend stays fast to iterate**: the existing mock-driven flow means designers/PMs can ship UI changes without a running backend.
- **Backend grows independently**: each bounded context (HR, Payroll, Performance) is its own Go package under `backend/internal/<domain>/` with `domain ⇢ usecase ⇢ repo ⇢ transport` layers. Same code runs as part of the `api-gateway` monolith **or** its own `cmd/<service>/` binary — no rewrite when you split.
- **PostgreSQL is the system of record**: migrations in [`backend/migrations/`](./backend/migrations) are numbered SQL files sourced from the spec docs (HR, Performance 360, master data). Apply them with `make migrate-up` or let services auto-apply on boot.

---

## Cutting over from mocks to backend

The frontend's data access is already abstracted behind repository interfaces (`src/domain/repositories/*` ports + `src/infrastructure/repositories/mock/*` implementations). To switch a module to the live backend:

1. Implement an HTTP adapter under `src/infrastructure/repositories/http/` (e.g. `HttpEmployeeRepository`).
2. Swap the factory (`src/application/factories/createHRService.ts`) to use the HTTP repo when `NEXT_PUBLIC_API_URL` is set.
3. The use case + view layers don't change.

See [backend/README.md § Frontend wiring](./backend/README.md#frontend-wiring) for the contract.

---

## Project docs

- **AI assistant instructions**: [CLAUDE.md](./CLAUDE.md) → [AGENTS.md](./AGENTS.md)
- **Module specs (Master Data, HR, Payroll, Performance)**: see the markdown files in `docs/modules/` (referenced by backend migrations)
