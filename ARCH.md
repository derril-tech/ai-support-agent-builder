# ARCH.md — AI Support Agent Builder

## Topology
- **Frontend/BFF:** Next.js 14 (Vercel). Server Actions for uploads/mutations; SSR for analytics and transcript views.
- **API Gateway:** NestJS (Node 20), REST `/v1` with OpenAPI 3.1, Problem+JSON, Zod validation, RBAC (Casbin), RLS, rate limits, Idempotency-Key, Request-ID.
- **Workers:** Python 3.11 (FastAPI control):
  - router-worker (intent/lang detect)
  - retriever-worker, rerank-worker
  - agent-worker (LLM + tools)
  - tool-worker (API calls)
  - ticket-worker, email-worker, voice-worker
  - eval-worker, export-worker, quality-worker
- **Event Bus/Queues:** NATS + Redis Streams; Celery/RQ orchestration.
- **Datastores:** Postgres 16 + pgvector, S3/R2, Redis, optional ClickHouse.
- **Observability:** OpenTelemetry, Prometheus/Grafana, Sentry.
- **Secrets:** Cloud Secrets Manager/KMS.

## Data Model (Postgres + pgvector)
- Orgs, users, memberships, API keys.
- Agents + immutable versions (intents, flows, prompts, policies, tools, guardrails).
- Collections, documents, chunks (vector embeddings).
- Deployments (env, channel).
- Conversations & messages (with citations, tool I/O, cost, latency).
- Eval datasets, runs, results.
- CSAT, KPIs, costs.
- Audit log, connections, secrets.

## API Surface
- **Agents:** CRUD, versions, release, diff.
- **Knowledge:** collections, document upload, search.
- **Deployments:** CRUD, enable/disable, webhook handlers.
- **Conversations:** execute, list, messages, escalate, CSAT.
- **Evals:** dataset upload, eval runs, results.
- **Analytics:** KPIs, costs.
- **Auth/Users:** login, refresh, me.
- All mutations require Idempotency-Key; errors use Problem+JSON.

## Pipelines
1. Route: classify intent, detect language.
2. Retrieve: hybrid search, rerank, citations.
3. Act: agent-worker → LLM/tool calls.
4. Reply: stream tokens to channel, include citations.
5. Guard: safety filters (PII, jailbreak, policy).
6. Persist: messages, metrics, costs, KPIs.

## Realtime
- WS channels for conversation streams, eval progress, deployment status.
- Presence/typing indicators for web widget; operator console handoff.

## Security
- TLS/HSTS, KMS secrets, RLS tenant isolation.
- Audit log, immutable release history.
- SSO/SAML/OIDC, SCIM.
- DSR endpoints, retention sweeps.
- HIPAA/BAA mode (restricted tools, PHI safeguards).
