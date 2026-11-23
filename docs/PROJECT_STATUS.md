# ServiceOps AI — Project Status

**Last updated:** 2026-11-23  
**Project phase:** MVP development and cloud operations  
**Deployment status:** First private AWS deployment verified  
**Current focus:** Reliability and deployment hardening

---

## 1. Project Overview

ServiceOps AI is a SaaS application for managing service requests and operational workflows for service businesses.

The current MVP demonstrates a complete vertical slice:

1. Submit a service request through the React frontend.
2. Validate and process it through the Express API.
3. Persist it in PostgreSQL.
4. Retrieve and display service requests in the frontend.

AI capabilities are planned but have not yet been implemented.

## 2. Implemented Technology Stack

| Layer                          | Technology                            |
| ------------------------------ | ------------------------------------- |
| Frontend                       | React, TypeScript, Vite, Tailwind CSS |
| Backend                        | Node.js, Express, TypeScript          |
| Database                       | PostgreSQL 17, Drizzle ORM            |
| Monorepo                       | pnpm, Turborepo                       |
| Containerization               | Docker, Docker Compose                |
| CI                             | GitHub Actions                        |
| Hosting                        | AWS EC2                               |
| Reverse proxy / static serving | Nginx                                 |

## 3. Verified Progress

### Application

- React service-request submission form implemented.
- Service-request list implemented.
- Express API provides service-request operations.
- PostgreSQL persistence implemented.
- Drizzle migrations configured and used.

### Containerization

- Backend Dockerfile created.
- Frontend Dockerfile created with an Nginx runtime stage.
- Docker Compose configured for PostgreSQL, API, and frontend.
- Local application containerization tested successfully.

### AWS Deployment — OPS-010

**Status: First private deployment verified**

- Deployment configuration merged into `main`.
- AWS EC2 instance configured with Docker, Docker Compose, and Git.
- Docker images built for `linux/amd64` on the local development machine.
- Images transferred securely to EC2 through SSH.
- PostgreSQL container started and verified healthy.
- Database migrations executed.
- API and frontend containers started successfully.
- Application accessed remotely through an SSH tunnel.
- Service-request creation and persistence verified through the browser.

**Deployment environment:**

- Platform: AWS EC2
- Instance type: `t3.micro`
- Operating system: Amazon Linux 2023
- Memory: Approximately 1 GiB
- Disk: 8 GiB
- Services: Nginx, Express, PostgreSQL

**Access model:** Private SSH tunnel. Application and database ports are bound to loopback addresses. Public HTTPS access is not yet configured.

**Data policy:** Fictional demonstration data only. No real customer or confidential information.

## 4. Known Limitations and Risks

- No application authentication or authorization.
- No public HTTPS endpoint.
- No automated deployment pipeline.
- No automated PostgreSQL backups or tested restore procedure.
- No application-level alerting or monitoring.
- Limited EC2 memory and disk capacity.
- Deployment currently involves manual image building and transfer.
- Infrastructure restart/recovery behavior has not been fully verified.
- Multi-tenancy and AI capabilities are not implemented.

The current hosted demonstration must remain access-restricted until appropriate security controls are implemented.

## 5. Verification Summary

| Verification                              | Result                          |
| ----------------------------------------- | ------------------------------- |
| PostgreSQL container health               | Passed                          |
| API and frontend containers running       | Passed                          |
| Application accessible through SSH tunnel | Passed                          |
| Create service request                    | Passed                          |
| Refresh and retrieve saved request        | Passed                          |
| Latest CI after deployment                | Not independently recorded here |
| Automated backup and restore              | Not tested                      |
| Public HTTPS                              | Not configured                  |

## 6. Next Engineering Priorities

**Next ticket: Deployment reliability and observability**

Acceptance criteria:

- Define and test health checks for API and frontend.
- Verify container restart behavior.
- Inspect application and container logs.
- Measure resource consumption on the EC2 instance.
- Document basic troubleshooting and recovery commands.

**Subsequent priorities:**

- Database backup and restore.
- Repeatable deployment and rollback.
- Automated CI/CD deployment.
- Authentication and secure public HTTPS access.

These priorities should be implemented as small, independently verifiable tickets.

## 7. Decisions and Trade-offs

**EC2 instance:** Selected a small `t3.micro` instance to keep the initial infrastructure simple. Limited resources remain a reliability concern.

**Build strategy:** Built Docker images locally for `linux/amd64` to avoid resource-intensive builds on EC2. A CI/CD-based image build and registry workflow is a future improvement.

**Access strategy:** Used SSH port forwarding rather than exposing the unauthenticated application publicly.

**Architecture:**
