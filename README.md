# ServiceOps AI

ServiceOps AI is an AI-powered service operations management platform designed to streamline workflows, automate repetitive tasks, and improve operational efficiency.

The platform aims to provide a centralized system for managing service requests, work orders, task assignments, and operational activities.

Future capabilities will include intelligent automation, AI-assisted decision-making, and knowledge-based assistance.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **Backend:** Node.js, Express.js, TypeScript
- **Frontend (Planned):** React + TypeScript
- **Database (Planned):** PostgreSQL
- **AI Integration:** Planned

## Current Development Status

The project is in its initial development stage.

**Implemented:**

- Monorepo setup using Turborepo and pnpm
- Express.js backend initialization
- TypeScript configuration
- `GET /health` API endpoint

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm

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

## Project Status

🚧 **Under active development**

ServiceOps AI is being developed incrementally, following software engineering practices focused on scalability, maintainability, security, testing, and production reliability.
