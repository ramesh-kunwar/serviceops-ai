# ServiceOps AI — MVP Design

**Status:** Draft for engineering review  
**Version:** 0.1  
**Updated:** 2026-11-06  
**Scope:** First end-to-end demo vertical slice (not the full product)

> This document records the product decisions made during simulated discovery and proposes the smallest implementation needed for a working demo. Proposed details are not implemented or approved until reviewed. Update this document as requirements change.

## 1. Product overview

ServiceOps AI is an **organization-based B2B SaaS platform** intended to help service organizations manage customer requests and coordinate work through a central system. It is **not** a marketplace for finding independent providers.

**Initial example domain:** property and facility maintenance (e.g., AC repair, plumbing, electrical work, painting). One organization may coordinate several service categories.

**Problem:** Requests and updates can be scattered across calls, email, chat, and spreadsheets, making them difficult to track and fulfill.

**Long-term product goal:** A customer submits a service request; an organization reviews it, creates/assigns work, tracks progress, and communicates the outcome. AI assistance may be added later, with human oversight.

**Initial demo goal:** Prove that a request can move from a web form through an API into PostgreSQL and appear in an organization's basic request view.

## 2. Users and workflow

**Envisioned users (future product):**

- **Customer:** submits requests and views request history/status.
- **Operations employee:** reviews, assigns, progresses, or rejects requests.
- **Technician/contractor:** performs assigned work and records progress.
- **Organization admin:** manages users and organization settings.

For the **first demo**, these are _interfaces_, not implemented user accounts or permissions. We use one fictional organization and synthetic customer data.

**First demo flow:**

1. A demo customer opens a basic request form in a restricted demo environment.
2. They enter a fictional customer name, title, and description.
3. The API validates the input and creates a request with status `NEW`.
4. PostgreSQL stores the request.
5. A basic organization-facing view retrieves requests and displays the newest first.
6. The demo confirms that data persists after an API restart.

No assignment, rejection, email, authentication, or AI is needed for this first vertical slice.

## 3. Requirements and scope

### 3.1 MVP functional requirements

| ID        | Requirement                        | Acceptance check                                                                         |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| MVP-FR-01 | Display a request form             | Customer can enter fictional name, title, description.                                   |
| MVP-FR-02 | Validate submissions on the server | Blank/whitespace-only fields and overlong values are rejected without creating a record. |
| MVP-FR-03 | Create a request                   | Valid submission returns HTTP `201`, a generated ID, and status `NEW`.                   |
| MVP-FR-04 | Persist the request                | Record exists in PostgreSQL and survives API restart.                                    |
| MVP-FR-05 | List requests                      | Basic organization-facing view shows saved requests, newest first.                       |
| MVP-FR-06 | Provide a health endpoint          | Existing `GET /health` continues returning HTTP `200` and `{ "status": "ok" }`.          |

### 3.2 Agreed product direction — later increments, **not MVP**

- Customers can log in, view their request history and see statuses/rejection reasons.
- Authorized employees review and assign service requests.
- Authorized employees can reject a request **only with a reason**.
- Planned request lifecycle: `NEW → UNDER_REVIEW → ASSIGNED → IN_PROGRESS → COMPLETED`, with a possible `REJECTED` outcome. Exact transitions remain open for design review.
- Important-event emails are intended for **submitted, assigned, completed, and rejected** events; no email for every minor status change.
- Separate organizations eventually need isolated workspaces and data.
- AI assistance is future scope, not part of the initial slice.

### 3.3 Non-goals for the first demo

Authentication, multi-tenancy, technician management, work orders, category catalogs, rejection flows, customer history, notifications, file uploads, payments, AI, background queues, analytics, and advanced search.

## 4. Non-functional requirements (first demo)

- **Safety and privacy:** Use fictional data only; never collect real customer details in the demo. Restrict access to the demo at the hosting/network layer or keep it local. **Do not publicly expose unauthenticated writable or customer-listing endpoints.** A public customer-facing release requires authentication, authorization, and abuse controls.
- **Validation:** Validate again in the API, even if the form also validates. Return predictable errors. Reject excessive input sizes.
- **Data integrity:** Use database constraints, generated identifiers, and migrations. Do not silently drop valid submitted requests.
- **Reliability:** A successful `201` response means the database operation committed; on database failure return an error instead of pretending success.
- **Observability:** Log startup and failures without leaking customer descriptions or secrets. Keep the existing `/health` endpoint; it is a process health signal, not proof that PostgreSQL is healthy.
- **Maintainability:** Start as one Express API and one React app. Add modules/abstractions when a real feature needs them.
- **Performance:** No speculative load target yet. Test with a small synthetic dataset; add pagination and query optimization before increasing scale.
- **Deployment:** Use environment-based configuration and a reproducible build. Keep secrets out of Git. Add CI, controlled hosting, migrations, and deployment smoke checks incrementally.

## 5. High-level design

**Already implemented on `main` (OPS-002):** pnpm/Turborepo workspace, Express + TypeScript API, TypeScript build/start scripts, and `GET /health`.

**Proposed for the MVP:** React + TypeScript frontend (likely Vite), request API endpoints, PostgreSQL, database migration, and restricted demo deployment.

```text
[Demo customer form]             [Organization request list]
          |                                  |
          +---------------+------------------+
                          |
                    React frontend
                          |
                       HTTP/JSON
                          |
                    Express REST API
                 validation + request logic
                          |
                       PostgreSQL
```

For this slice, **one API process and one database** are sufficient. Frontend and backend use a small, documented JSON contract. There is no need for microservices, Redis, or messaging yet.

### Security boundary

The diagram shows functional data flow, **not public access approval**. Until real authentication and authorization exist, the demo must remain restricted and contain synthetic data only. Do not assume hiding a UI button secures an API endpoint.

## 6. Initial data model (proposed)

The MVP represents **one fictional organization**. We are **not introducing an `organizations` table or tenant IDs yet**; adding true tenant isolation requires a separate design and migration before serving multiple organizations.

### `service_requests`

| Column          | Type         | Constraint / meaning                                      |
| --------------- | ------------ | --------------------------------------------------------- |
| `id`            | UUID         | Primary key; generated by database or application         |
| `customer_name` | VARCHAR(100) | Required; fictional demo name only                        |
| `title`         | VARCHAR(120) | Required; short problem summary                           |
| `description`   | TEXT         | Required; 1–2000 non-whitespace characters after trimming |
| `status`        | VARCHAR(20)  | Required; defaults to `NEW` (only MVP-supported status)   |
| `created_at`    | TIMESTAMPTZ  | Required; defaults to current timestamp                   |

**Constraints:** reject blank/whitespace-only names and titles at the API, enforce length limits, and enforce the MVP's permitted status in the database. The implementation should choose and document the exact SQL constraints. Additional status values, organization relationships, contact details, and work orders will be added via later migrations.

**Data ownership assumption:** The demo treats all requests as belonging to its one fictional organization. This is _not_ an acceptable multi-tenant design for production.

## 7. API contract (proposed)

Base path: `/api/requests` (final naming can be confirmed at implementation review).

### `POST /api/requests`

Request:

```json
{
  "customerName": "Demo Customer",
  "title": "Leaking bathroom pipe",
  "description": "Water is leaking from the pipe under the sink."
}
```

Success: **`201 Created`**

```json
{
  "id": "<uuid>",
  "customerName": "Demo Customer",
  "title": "Leaking bathroom pipe",
  "description": "Water is leaking from the pipe under the sink.",
  "status": "NEW",
  "createdAt": "<ISO-8601 timestamp>"
}
```

Invalid input: **`400 Bad Request`** with a predictable structure, for example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the request fields."
  }
}
```

Unexpected server/database failure: **`500`**, without exposing stack traces or credentials.

**Input rules (proposed):** trim text; `customerName` 1–100 characters, `title` 1–120, `description` 1–2000. The API must enforce limits regardless of frontend behavior.

### `GET /api/requests`

Success: **`200 OK`** with an array of request objects in descending `createdAt` order. For the first restricted demo, return only a small bounded set (proposed: 50 latest requests); document the limit. Pagination is a later increment.

### Existing `GET /health`

Returns **`200 OK`** and `{ "status": "ok" }`. No change required in this ticket.

## 8. Verification and definition of done

The MVP is ready for review when:

- [ ] A user can submit a valid **fictional** request through the React form.
- [ ] The request is saved in PostgreSQL with an ID and `NEW` status.
- [ ] The request appears in the organization-facing view after a refresh.
- [ ] Records survive API restart.
- [ ] Invalid, blank, and oversized inputs return a validation error and do not create rows.
- [ ] A database failure produces a non-success response.
- [ ] API build/type-check and relevant tests pass; evidence is included in the PR.
- [ ] A restricted demo deployment is reachable by intended testers only, or the work is explicitly marked local-only.
- [ ] After deployment, request submission and retrieval have been smoke-tested with synthetic data.
- [ ] `README.md` and this document reflect what is actually implemented.

## 9. Open decisions (resolve before related implementation)

1. **Service catalog:** Can customers enter any kind of request, or only services offered by their organization? For MVP, no category catalog is implemented; revisit before adding categories.
2. **Authentication:** The full product is expected to use customer/employee authentication; which method and roles will be handled in a later design.
3. **Organization model:** How will an organization invite customers and manage staff, and how will tenant isolation work?
4. **Request vs work order:** When does a request create a separate work order, and can one request lead to several work orders?
5. **Lifecycle:** Final statuses, permitted transitions, rejection rules, cancellation, and reassignment.
6. **Notifications:** Which events trigger messages, and how will delivery failures/retries be handled?
7. **Hosting:** Which inexpensive platform and restriction mechanism will be used for the first deployed demo?

## 10. Implementation notes

- Keep this as **one living document** until the architecture is complex enough to warrant separate PRD, architecture, and database documents.
- A proposed API or table is **not proof of implementation**; update the status when code merges.
- Record material decisions and their trade-offs in the relevant PR or a short ADR when needed.
- Implement in small, reviewable tickets rather than treating this entire design as one coding task.
