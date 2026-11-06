# ServiceOps AI

ServiceOps AI is an AI-powered service operations management platform designed to streamline workflows, automate repetitive tasks, and improve operational efficiency.

The platform aims to provide a centralized system for managing service requests, work orders, task assignments, and operational activities.

Future capabilities will include intelligent automation, AI-assisted decision-making, and knowledge-based assistance.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **Backend:** Node.js, Express.js, TypeScript
- **Frontend (Planned):** React + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **AI Integration:** Planned

## Current Development Status

The project is in its initial development stage.

**Implemented:**

- Monorepo setup using Turborepo and pnpm
- Express.js backend initialization
- TypeScript configuration
- `GET /health` API endpoint
- Local PostgreSQL setup with Docker Compose and Drizzle migrations

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm
- Docker with Docker Compose (for local PostgreSQL)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm --filter @repo/api dev
```

### Build

```bash
pnpm --filter @repo/api build
```

### Start

```bash
pnpm --filter @repo/api start
```

### Health Check

```http
GET http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Local Database Setup

Run the following commands from the repository root after `pnpm install`. Make sure Docker is running.

### 1. Create your environment file

```bash
cp .env.example .env
```

If `.env` already exists, update it instead of overwriting it. It is ignored by Git.

The example uses database `serviceops_dev`, user `serviceops`, and host port `5433`. Set a local password in `.env` and keep `DATABASE_URL` consistent with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `POSTGRES_PORT`. URL-encode special characters in the credentials used in `DATABASE_URL`.

### 2. Start PostgreSQL

```bash
docker compose up -d db
```

PostgreSQL runs in the background. Its data is stored in the named volume `postgres_data`.

### 3. Verify PostgreSQL is healthy

```bash
docker compose ps
```

Wait until the `db` service shows `healthy`. If it does not, inspect its logs:

```bash
docker compose logs --tail=50 db
```

### 4. Generate and apply Drizzle migrations

For an existing checkout, apply the committed migrations:

```bash
pnpm --filter @repo/api db:migrate
```

When changing tables, edit `apps/api/src/db/schema.ts`, generate a migration, review the new SQL under `apps/api/drizzle`, and apply it:

```bash
pnpm --filter @repo/api db:generate
pnpm --filter @repo/api db:migrate
```

`db:generate` creates migration files; `db:migrate` applies pending migrations to the database configured by `DATABASE_URL`. Commit schema changes and generated migration files together.

### 5. Connect to PostgreSQL

Open a `psql` session inside the container using its configured credentials:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Use `\dt` to list tables and `\q` to exit.

For a database client running on your machine, use host `127.0.0.1`, port `5433` (or your `POSTGRES_PORT`), and the database name, username, and password from `.env`. The container's internal PostgreSQL port is `5432`.

To browse and edit data with Drizzle Studio:

```bash
pnpm --filter @repo/api db:studio
```

Open the URL printed in the terminal.

### 6. Stop PostgreSQL and keep its data

```bash
docker compose stop db
```

Restart it with `docker compose up -d db`. You can also use `docker compose down` to remove the containers while preserving the named volume. Do not add `-v` if you want to retain the database data.

PostgreSQL initialization settings apply when the data volume is first created. Changing the user, password, or database name in `.env` later does not update an existing database automatically.

## Project Status

🚧 **Under active development**

ServiceOps AI is being developed incrementally, following software engineering practices focused on scalability, maintainability, security, testing, and production reliability.
