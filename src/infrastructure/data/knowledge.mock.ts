export interface KnowledgeArticle {
  id: string;
  title: string;
  category: "SOP" | "Templates" | "Tech Stack" | "API Docs" | "Onboarding" | "Delivery Checklist";
  excerpt: string;
  updatedAt: string;
  authorId: string;
  readMinutes: number;
  bookmarked: boolean;
  /** Optional full markdown body. When present, the detail pane renders this
   *  instead of the placeholder text. Supports a small subset: # / ## / ###
   *  headings, paragraphs, `- ` lists, **bold**, *italic*, `inline code`, and
   *  fenced ```code blocks```. */
  body?: string;
  /** Free-form tags for filtering + tag chips in the article header. */
  tags?: string[];
}

// Bodies use a deliberately small markdown subset that the in-app renderer
// supports — no external markdown library, no XSS risk via HTML embeds.

const DELIVERY_LIFECYCLE = `# Delivery Lifecycle SOP

End-to-end gate criteria from **Discovery** to **Maintenance**. Use this as the
playbook for every engagement; deviations require an approved exception ticket.

## Stages

The five stages every project flows through:

- **Discovery** — problem framing, stakeholder map, success criteria.
- **Planning** — scope, technical design, capacity plan, risk register.
- **Build** — sprint execution against the agreed plan.
- **UAT** — client validation, defect triage, sign-off.
- **Maintenance** — post-go-live support under SLA.

## Discovery gate

To exit Discovery, you must have:

- Signed-off problem statement (one page, no jargon).
- Stakeholder map with named decision-makers.
- Three success metrics, each with a baseline and a target.
- A go / no-go recommendation from the Delivery Lead.

## Planning gate

To exit Planning:

- Approved technical design doc (architecture, data model, integrations).
- Sprint plan covering at least the first three sprints in detail.
- Risk register with mitigations for every \`high\` and \`critical\` item.
- Commercial terms locked: budget, payment schedule, scope-change policy.

## Build gate (per sprint)

Each sprint demos at the end. Stories must:

- Have acceptance criteria written *before* development starts.
- Pass code review and CI before merging.
- Be linked to a positive QA result.

## UAT gate

UAT begins only when:

- All P0 and P1 defects from the last sprint are closed.
- Test plan is approved by the client.
- A rollback procedure is documented.

## Maintenance gate

Go-live is approved only when:

- SLA targets are accepted in writing.
- On-call rotation is staffed for the first 14 days.
- The incident runbook has been rehearsed once with the on-call team.
`;

const SPRINT_CADENCE = `# Sprint Cadence & Ceremonies

How we run sprints, stand-ups, retros, and demos at WIT.

## Sprint length

Default sprint is **two weeks**. Single-week sprints only with delivery-lead approval
and only for the first or last sprint of an engagement.

## Ceremonies

- **Planning** — Monday, 90 min. Refines the top of the backlog; commits the sprint.
- **Daily standup** — 15 min, async on Slack by 10:00 WIB, in-person at 10:15.
- **Mid-sprint review** — Wednesday of week 2, 30 min. Re-baseline if needed.
- **Demo** — Friday of week 2, 45 min. Client attends. Recorded.
- **Retro** — same day, 45 min. Internal only. Output: one process change.

## Rules

- Do **not** add scope mid-sprint. Use the change-request channel.
- Done means *demoable* — no work-in-progress shown at demo.
- One blocker raised in standup must be unblocked by EOD.
`;

const PROJECT_KICKOFF = `# Project Kickoff Template

Charter, RACI, comms plan, risk register starter pack. Copy this into a new doc
at the start of every engagement.

## Charter

- **Objective:** one sentence.
- **Success metrics:** three measurable outcomes.
- **In scope:** bullet list.
- **Out of scope:** explicit bullet list. Saves arguments later.
- **Constraints:** budget, deadline, regulatory.

## RACI

A simple RACI grid for the first three weeks. Refine after the kickoff.

- **Tech direction** — Responsible: Tech Lead, Accountable: Delivery Lead.
- **Sprint commitments** — Responsible: PM, Accountable: Delivery Lead.
- **Commercial changes** — Responsible: Delivery Lead, Accountable: Director.

## Communication plan

- **Weekly status email** — Friday 17:00. PM owns.
- **Slack channel** — \`#client-<name>\`. Joint client + WIT.
- **Escalation path** — PM → Delivery Lead → Director.

## Risk register starter

Pre-populate with these five risks; add project-specific ones during planning.

1. Key person dependency on either side.
2. Third-party integration delays.
3. Data quality lower than assumed.
4. Scope creep via informal channels.
5. UAT timeline compressed.
`;

const FRONTEND_STACK = `# Frontend Tech Stack Standard 2026

Reference setup for new frontend projects. Stick to this stack unless you have a
written exception. Drift is the #1 cause of long-term maintenance pain.

## Core

- **Next.js 16** — App Router, Turbopack in dev. RSC by default.
- **TypeScript** — strict mode on. No \`any\` without a comment explaining why.
- **Tailwind v4** — design tokens live in \`globals.css\` under \`@theme\`.
- **Zustand** — global state. One store per concern, hydrate on mount.

## Component conventions

- File name = component name. PascalCase. One default export per file.
- Props interface lives in the same file. Suffix with \`Props\`.
- Server components by default; opt into client with \`"use client"\` only when needed.
- Co-locate styles with components. No CSS modules unless legacy.

## Forms

- Use \`react-hook-form\` for anything beyond 3 fields.
- Validation via \`zod\` schemas; share the schema between client + server.
- Show inline errors below the field — never as toasts only.

## Data fetching

- RSC: fetch directly in the component with \`await\`.
- Client: \`@tanstack/react-query\` for cache + retry semantics.
- Mutations: optimistic by default; reconcile on error.

## What we **do not** use

- Styled-components / Emotion — Tailwind wins.
- Redux — Zustand covers our needs.
- Material UI / Ant Design — bespoke + Tailwind primitives.
`;

const BACKEND_STACK = `# Backend Tech Stack Standard 2026

Go + PostgreSQL baseline + observability stack. Same drift warning as the frontend doc.

## Core

- **Go 1.22+** — \`chi\` for routing, \`pgx\` for Postgres, \`zerolog\` for logs.
- **PostgreSQL 16** — single source of truth for relational data.
- **Redis 7** — caches, rate limits, ephemeral state only.
- **NATS** — async eventing between services. No Kafka unless we have ordered partitions to justify it.

## Service layout

We follow Clean Architecture per module:

- \`domain/\` — entities, value objects, repository interfaces.
- \`usecase/\` — orchestration. Pure Go, no infra imports.
- \`repository/postgres/\` — concrete adapters.
- \`transport/http/\` — handlers; thin, no business logic.

## Conventions

- Migrations via \`golang-migrate\` in \`backend/migrations/\`. Forward-only.
- Every public endpoint requires a request struct + response struct. No raw maps.
- Errors at the boundary are typed (\`domain.ErrNotFound\` etc.); HTTP layer maps to status codes.
- Logging with \`zerolog\` — structured fields only, never \`fmt.Sprintf\` into the message.

## Observability

- OpenTelemetry traces auto-injected via middleware.
- Metrics exposed at \`/metrics\` — Prometheus scrape compatible.
- Health checks at \`/healthz\` (liveness) and \`/readyz\` (readiness).

## What we **do not** use

- ORMs. \`sqlc\` if you want generated query code; otherwise plain \`pgx\`.
- gRPC for external APIs — REST + OpenAPI. Internal RPC is fine.
`;

const AUTH_API = `# Internal Auth API v2

JWT issuance, refresh, revoke, and rotation flows for the WIT identity service.

## Endpoints

### POST /v2/auth/login

Exchange email + password for an access token (15 min) and refresh token (30 days).

\`\`\`json
{
  "email": "user@wit.id",
  "password": "..."
}
\`\`\`

Response:

\`\`\`json
{
  "access_token": "ey...",
  "refresh_token": "rt_...",
  "expires_in": 900
}
\`\`\`

### POST /v2/auth/refresh

Rotate the refresh token. **Single-use** — using an old refresh token revokes the entire chain.

### POST /v2/auth/logout

Revokes the access token's jti and invalidates the refresh chain. Always returns 204.

### GET /v2/auth/sessions

Lists active sessions for the authenticated user. Used by the Admin · Sessions tab.

## Token shape

Access tokens are JWT, signed with RS256. Claims:

- \`sub\` — user id.
- \`tid\` — tenant id.
- \`role\` — current role slug.
- \`perms\` — flat permission slugs ("finance.invoice.create", ...).
- \`jti\` — revocation id.

## Rotation policy

Signing key rotates every 90 days. Old key stays valid for verification for 14 days
after rotation to drain in-flight tokens.
`;

const ONBOARDING_PLAN = `# Engineering Onboarding · Day 1–14

Two-week ramp for new engineers. The hiring manager owns this plan.

## Day 1

- Laptop provisioned, accounts created, MFA enrolled.
- 1:1 with the manager — goals for first 30/60/90 days.
- Read the four standards docs (Delivery, Frontend, Backend, Auth).

## Day 2–3

- Pair with a senior engineer on one in-progress story.
- Run the full dev environment locally — must hit a real API and ship one commit.

## Day 4–5

- Pick up a small starter ticket. Aim for a merged PR by EOW.
- Shadow one standup, one retro.

## Week 2

- Own a small story end-to-end (design → PR → demo).
- Pair on one production incident if one happens (otherwise simulate one).
- Present the change you shipped at Friday demo.

## End of Day 14

The new engineer should:

- Know who owns what across the team.
- Have shipped at least one user-visible change.
- Have written or updated at least one wiki page (this one counts).
`;

const PRE_PROD_READINESS = `# Pre-Production Readiness Checklist

Run through every item before flipping the feature flag or moving DNS. No exceptions.

## Security

- Secrets in vault, none in env files committed.
- Auth checks on every mutating endpoint.
- Rate limits configured per route.
- Dependency vulnerabilities scanned (\`npm audit\`, \`govulncheck\`).

## Performance

- Load test at 2× expected peak.
- P99 latency under target with cache cold.
- Memory profile clean at 1h sustained load.

## Observability

- Dashboard for the service exists and is linked from the runbook.
- Three alerts wired: error rate, latency, saturation.
- Logs ship to central aggregation. No PII leakage.

## Reliability

- Rollback procedure tested in staging.
- Feature flag in place — kill switch verified.
- Database migration is forward-only and idempotent.

## Operations

- On-call rotation staffed for the first 14 days.
- Runbook updated for known failure modes.
- Customer comms drafted for incident scenarios.
`;

const CLIENT_DEMO_PLAYBOOK = `# Client Demo Playbook

Pre-demo checklist, scripting, contingency plans. The 30 minutes before a demo
are the highest-leverage minutes of the sprint — don't wing them.

## T-24h

- Lock the demo branch. No commits after this point.
- Run the full demo flow on the staging environment. Time it.
- Have a backup recording of the happy path in case the network dies.

## T-30m

- Restart the demo environment. Cold start surfaces issues you haven't seen.
- Open every tab you need ahead of time. Close Slack, email, browser dev tools.
- Disable notifications.

## During the demo

- Lead with the **outcome**, not the feature. "Last sprint we cut the order time
  from 8 minutes to 90 seconds — here's how."
- Show the happy path first. Edge cases only if the client asks.
- Pause for questions every 5 minutes. Don't power through 30 min of monologue.

## Contingencies

- If something breaks live, switch to the backup recording. Don't debug on stage.
- If the client wants something not built yet, write it in the parking lot, don't commit on the call.
- If a P0 issue is found, halt the demo, schedule a follow-up. Do not paper over.
`;

const INCIDENT_RESPONSE = `# Incident Response Runbook

Severity matrix, escalation paths, postmortem template. The on-call engineer
opens this within five seconds of a page.

## Severity matrix

- **SEV-1** — Customer-facing outage or data loss. First response 15 min. Page Director.
- **SEV-2** — Major degradation. First response 30 min. Notify Director.
- **SEV-3** — Minor degradation, workaround exists. First response 2 hours.
- **SEV-4** — Cosmetic / single user. Next business day.

## First five minutes (any SEV-1 / SEV-2)

1. Acknowledge the page. Set yourself as IC in the incident channel.
2. Pull up the service dashboard. Confirm impact and scope.
3. Post a status: \`Investigating <thing>. Impact: <who>. ETA on next update: 15m.\`
4. Page a peer if you'll be heads-down debugging — you need a comms buddy.
5. Page the next-up role if you can't confirm scope within 15 minutes.

## During the incident

- One change at a time. Document every action in the channel.
- If a rollback is available, prefer it over a fix-forward.
- Customer comms every 30 min minimum, even if "still investigating."

## After the incident

- Write the postmortem within 48 hours. Use the template.
- Action items get tickets with owners and dates. No "we should..." with no owner.
- Postmortems are blameless. Focus on the system, not the person.

## Postmortem template

- **Summary:** one paragraph.
- **Impact:** users affected, duration, money at stake.
- **Timeline:** events in UTC, terse.
- **Root cause:** the chain of failures, not just the last one.
- **What went well / what went poorly.**
- **Action items.**
`;

const CHANGE_REQUEST = `# Change Request Workflow

How to handle requests for work outside the agreed scope. Saves both sides from awkward conversations later.

## Trigger

A change request is anything that:

- Adds a new feature not in the planning doc, **or**
- Materially changes acceptance criteria for an existing story, **or**
- Affects the delivery timeline.

Defect fixes are **not** change requests.

## Flow

1. **Capture** — anyone can file. Use the change-request template in the project's wiki.
2. **Estimate** — Tech Lead provides a t-shirt estimate within two business days.
3. **Decide** — Delivery Lead + Client PM approve, defer, or reject. Recorded in the project log.
4. **Schedule** — approved CRs land in the next sprint planning, not the current sprint.

## Pricing

- Inside the original scope: no charge, slot into capacity.
- Outside the original scope: time + materials at the standard rate, or fixed price if the change is well-bounded.

## Anti-patterns

- "Just one tiny thing" via DM — politely redirect to the CR template.
- Stacking small unrecorded changes that aggregate into a full sprint.
- Approving CRs verbally on a call without writing them down.
`;

const PR_REVIEW = `# Pull Request Review Standards

How we review PRs at WIT. Reviewing well is a multiplier; reviewing badly is friction.

## Author responsibilities

- Keep the PR small. Under 400 lines diff is the target.
- Write the PR description like the reviewer has zero context — because they often do.
- Link the ticket. State the user-visible change.
- Include a screenshot for any UI change. A short clip if it's interactive.

## Reviewer responsibilities

- Reply within one business day. If you can't, hand it off.
- Look for *correctness*, *clarity*, and *security* — in that order.
- Don't bikeshed style. Linters handle that.
- Comment with prefixes:
  - \`nit:\` purely cosmetic, author can ignore.
  - \`question:\` need clarification.
  - \`concern:\` blocks the merge until resolved.

## Approving

Approve when:

- The change does what the description claims.
- Tests cover the new behavior (or there's a documented reason).
- You'd be comfortable on-call for this code at 3am.

## Merging

- Squash by default. Preserve full history only for refactors that benefit from per-commit review.
- Author merges, not the reviewer.
- Delete the branch after merge.
`;

const RUNBOOK_TEMPLATE = `# Runbook Template

Every service in production needs one. Stored in the service's repo at \`/docs/runbook.md\`.

## Service identity

- **Name:** the service.
- **Owner team:** team name + on-call rotation link.
- **Tier:** SEV definitions per service (Tier 1 = customer-facing, etc.).

## Operations

### How to deploy

Step-by-step. Include the actual commands.

### How to roll back

Step-by-step. Test this monthly.

### Common failure modes

For each failure mode:

- **Symptom:** what an alert or user complaint looks like.
- **Diagnosis:** how to confirm.
- **Mitigation:** what to do.
- **Long-term fix:** ticket link if applicable.

## Dependencies

- Upstream services we call.
- Downstream services that call us.
- Third-party APIs with their failure modes.

## Useful queries

- Dashboards (Grafana / Datadog links).
- Common log queries (saved in the aggregator).
- Database queries for one-off diagnostics — read-only, parameterized.
`;

const DESIGN_REVIEW = `# Design Review Template

For any system change that touches multiple services, alters the data model, or
introduces a new external dependency. Light touch — should fit on one page.

## What is changing

Two paragraphs max. What the change is, why we're doing it now.

## Alternatives considered

Two alternatives plus the chosen approach. Why each was rejected.

## Risks

- Blast radius if this goes wrong.
- Migration steps if data is involved.
- Rollback strategy.

## Observability hooks

- New metrics this change requires.
- New alerts.
- New logs.

## Open questions

The things you don't know yet. List them; reviewers help close them.
`;

const ESCALATION_POLICY = `# Escalation Policy

When and how to escalate. Default is: do it earlier than feels comfortable.

## Roles

- **IC (Incident Commander)** — owns the incident, coordinates response. *Not* necessarily the debugger.
- **Tech Lead** — technical decisions, second pair of eyes.
- **Delivery Lead** — client comms, scope decisions.
- **Director** — executive decisions, money, headcount.

## Triggers

Escalate immediately if:

- Customer data may have been exposed.
- A regulator may need to be informed.
- The fix may take more than 4 hours.
- You are unsure who else should know.

When in doubt, page. Apologizing for over-paging is cheap; under-paging is not.
`;

export const mockKnowledge: KnowledgeArticle[] = [
  {
    id: "kb-001",
    title: "Delivery Lifecycle SOP v3.2",
    category: "SOP",
    excerpt: "End-to-end gate criteria from Discovery to Maintenance.",
    updatedAt: "2026-04-22",
    authorId: "tm-005",
    readMinutes: 9,
    bookmarked: true,
    tags: ["delivery", "process", "gates"],
    body: DELIVERY_LIFECYCLE,
  },
  {
    id: "kb-002",
    title: "Sprint Cadence & Ceremonies",
    category: "SOP",
    excerpt: "How we run sprints, stand-ups, retros, and demos.",
    updatedAt: "2026-03-18",
    authorId: "tm-014",
    readMinutes: 6,
    bookmarked: false,
    tags: ["scrum", "ceremonies"],
    body: SPRINT_CADENCE,
  },
  {
    id: "kb-003",
    title: "Project Kickoff Template",
    category: "Templates",
    excerpt: "Charter, RACI, comms plan, risk register starter pack.",
    updatedAt: "2026-02-10",
    authorId: "tm-008",
    readMinutes: 4,
    bookmarked: true,
    tags: ["template", "kickoff"],
    body: PROJECT_KICKOFF,
  },
  {
    id: "kb-004",
    title: "Frontend Tech Stack Standard 2026",
    category: "Tech Stack",
    excerpt: "Next.js + Tailwind + Zustand reference setup.",
    updatedAt: "2026-04-30",
    authorId: "tm-003",
    readMinutes: 11,
    bookmarked: true,
    tags: ["frontend", "standards"],
    body: FRONTEND_STACK,
  },
  {
    id: "kb-005",
    title: "Backend Tech Stack Standard 2026",
    category: "Tech Stack",
    excerpt: "Go + PostgreSQL services baseline + observability stack.",
    updatedAt: "2026-05-02",
    authorId: "tm-001",
    readMinutes: 13,
    bookmarked: false,
    tags: ["backend", "standards", "go"],
    body: BACKEND_STACK,
  },
  {
    id: "kb-006",
    title: "Internal Auth API v2",
    category: "API Docs",
    excerpt: "JWT issuance, refresh, revoke, and rotation flows.",
    updatedAt: "2026-03-29",
    authorId: "tm-001",
    readMinutes: 7,
    bookmarked: false,
    tags: ["auth", "api"],
    body: AUTH_API,
  },
  {
    id: "kb-007",
    title: "Engineering Onboarding Day 1–14",
    category: "Onboarding",
    excerpt: "Two-week ramp plan for new engineers joining the firm.",
    updatedAt: "2026-04-12",
    authorId: "tm-005",
    readMinutes: 8,
    bookmarked: false,
    tags: ["onboarding", "hiring"],
    body: ONBOARDING_PLAN,
  },
  {
    id: "kb-008",
    title: "Pre-Production Readiness Checklist",
    category: "Delivery Checklist",
    excerpt: "Security, performance, observability, and rollback gates.",
    updatedAt: "2026-05-04",
    authorId: "tm-007",
    readMinutes: 5,
    bookmarked: true,
    tags: ["go-live", "checklist"],
    body: PRE_PROD_READINESS,
  },
  {
    id: "kb-009",
    title: "Client Demo Playbook",
    category: "Templates",
    excerpt: "Pre-demo checklist, scripting, contingency plans.",
    updatedAt: "2026-01-25",
    authorId: "tm-010",
    readMinutes: 4,
    bookmarked: false,
    tags: ["demo", "client"],
    body: CLIENT_DEMO_PLAYBOOK,
  },
  {
    id: "kb-010",
    title: "Incident Response Runbook",
    category: "SOP",
    excerpt: "Severity matrix, escalation paths, postmortem template.",
    updatedAt: "2026-05-12",
    authorId: "tm-001",
    readMinutes: 10,
    bookmarked: true,
    tags: ["oncall", "incident"],
    body: INCIDENT_RESPONSE,
  },
  // ── Newly added wiki pages ───────────────────────────────────────────────
  {
    id: "kb-011",
    title: "Change Request Workflow",
    category: "SOP",
    excerpt: "How to handle requests for work outside the agreed scope.",
    updatedAt: "2026-05-14",
    authorId: "tm-008",
    readMinutes: 4,
    bookmarked: false,
    tags: ["scope", "client"],
    body: CHANGE_REQUEST,
  },
  {
    id: "kb-012",
    title: "Pull Request Review Standards",
    category: "SOP",
    excerpt: "Author + reviewer responsibilities, prefixes, merge policy.",
    updatedAt: "2026-05-08",
    authorId: "tm-003",
    readMinutes: 4,
    bookmarked: true,
    tags: ["code-review", "process"],
    body: PR_REVIEW,
  },
  {
    id: "kb-013",
    title: "Runbook Template",
    category: "Templates",
    excerpt: "Every service in production needs one. Copy this into the repo.",
    updatedAt: "2026-04-18",
    authorId: "tm-001",
    readMinutes: 5,
    bookmarked: false,
    tags: ["template", "runbook"],
    body: RUNBOOK_TEMPLATE,
  },
  {
    id: "kb-014",
    title: "Design Review Template",
    category: "Templates",
    excerpt: "One-pager for changes that touch multiple services or new deps.",
    updatedAt: "2026-04-29",
    authorId: "tm-001",
    readMinutes: 3,
    bookmarked: false,
    tags: ["template", "design"],
    body: DESIGN_REVIEW,
  },
  {
    id: "kb-015",
    title: "Escalation Policy",
    category: "SOP",
    excerpt: "When and how to escalate during an incident.",
    updatedAt: "2026-05-13",
    authorId: "tm-005",
    readMinutes: 3,
    bookmarked: true,
    tags: ["incident", "escalation"],
    body: ESCALATION_POLICY,
  },
];
