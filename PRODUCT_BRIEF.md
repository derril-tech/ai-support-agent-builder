# AI SUPPORT AGENT BUILDER — END‑TO‑END PRODUCT BLUEPRINT

*(React 18 + Next.js 14 App Router; **Chakra UI** + Tailwind utilities; TypeScript‑first contracts; Node/NestJS API gateway; Python orchestration/runtime for agent skills; Postgres + pgvector; Redis; NATS event bus; S3/R2 for artifacts; optional ClickHouse for high‑volume events; multi‑tenant; seats + usage‑based billing.)*

---

## 1) Product Description & Presentation

**One‑liner**
“Design, deploy, and monitor AI support agents across every channel.” Build intent‑aware agents with tools (RAG, ticketing, billing, order status), test them with evals, and ship to **Web Widget, Slack/Teams, Intercom/Zendesk, WhatsApp/Twilio SMS, Email**, with live escalation to humans and rigorous analytics.

**What it produces**

* **Agent definitions**: intents, prompts, policies, tools, flows, guardrails, SLAs.
* **Deployments**: channel connectors and endpoints, routing rules, business hours, availability.
* **Conversation transcripts** with citations, tool calls, privacy redaction, and CSAT.
* **Dashboards**: deflection rate, FCR (first‑contact resolution), CSAT, time‑to‑first‑token, cost per resolution.
* **Knowledge bundles**: indexed docs/FAQs with versions and retriever configs.

**Scope/Safety**

* Not a human replacement; always includes escalation and fallback.
* PII masking and policy enforcement (financial/health disclaimers) configurable per tenant and channel.
* Rate‑limits and cost budgets per org/channel.

---

## 2) Target User

* Support/Success leaders and operations managers.
* AI engineers / MLEs integrating tools and data sources.
* Solutions architects and agencies packaging support bots for clients.

---

## 3) Features & Functionalities (Extensive)

### Agent Studio

* **Intent graph**: intents with training examples, required entities/slots, and confidence thresholds.
* **Flow builder**: no‑code steps (Ask → Retrieve → Tool → Confirm → Escalate), branches on conditions, loops, retries.
* **Prompt composer**: system/task/few‑shot blocks with variables; channel‑specific tone.
* **Policies**: forbidden actions/claims, sensitive topics, brand/style guide, safety toggles (avoid medical/financial advice).
* **Guardrails**: jailbreak/injection detection, PII/PCI filters, profanity mask, self‑harm routing.

### Knowledge & Retrieval

* **Collections**: FAQs, product manuals, policy docs; file uploads and connectors (Notion, Confluence, Google Drive, Zendesk Guide).
* **Indexing**: chunking, embeddings, hybrid search (dense + BM25), cross‑encoder rerank; per‑collection freshness and TTL.
* **Citations**: inline with page/section links and confidence scores.
* **Answer modes**: strict (citation required), balanced, creative (internal use only).

### Tools & Integrations

* **Ticketing**: Zendesk, Intercom, Freshdesk, Jira Service Management (create/update tickets, add comments).
* **Commerce/Account**: Stripe (billing lookups, refunds with policy), Shopify/WooCommerce order status, internal REST/GraphQL.
* **User systems**: CRM lookups (Salesforce/HubSpot), entitlement checks, feature flags.
* **Notifications**: Email, Slack/Teams DM, webhooks.
* **Actions framework**: write custom Python tools with JSON schema I/O; rate‑limited and audited.

### Channels

* **Web Widget** with SSE/WS streaming, file upload, auth handoff.
* **Slack/Teams** bots with thread awareness.
* **Intercom/Zendesk** channel apps; **WhatsApp/Twilio SMS**; **Email** (inbound parsing + reply).
* **Voice (optional)**: Twilio Voice + TTS/ASR for IVR‑like flows.

### Routing & Escalation

* Business hours, waitroom, queue sizes, VIP routing, language detection.
* **Live handoff** to human agents (Zendesk/Intercom helpdesk or internal console).
* **Context transfer** with full convo, user profile, gathered entities/slots.
* Satisfaction check and post‑conversation survey.

### Evals & QA

* **Datasets** of real transcripts and synthetic cases; red‑team/jailbreak packs.
* **Rubrics**: helpfulness, policy adherence, citation coverage, tool correctness, escalation timing.
* **Regression gates** on flows/prompts/tools before deploy.
* **Shadow mode** comparisons on a % of traffic.

### Analytics & Costing

* **KPIs**: deflection rate, FCR, CSAT, average handle time, time‑to‑first‑token, resolution cost.
* Slice by channel, intent, language, cohort; drill to transcripts and step traces.
* Token and provider cost breakdown; anomaly detection and alerts.

### Collaboration & Governance

* Roles: Owner, Admin, Designer, Operator, Viewer.
* Reviews/approvals for releases; comments and diffs.
* SSO/SAML/OIDC, SCIM; audit log for every access and action.

---

## 4) Backend Architecture (Extremely Detailed & Deployment‑Ready)

### 4.1 Topology

* **Frontend/BFF:** Next.js 14 (Vercel). Server Actions for presigned URLs and light mutations; SSR for analytics and transcript viewers.
* **API Gateway:** **NestJS (Node 20)** — REST `/v1` (OpenAPI 3.1), Zod validation, Problem+JSON, RBAC (Casbin), RLS, rate limits, Idempotency‑Key, Request‑ID (ULID).
* **Workers (Python 3.11 + FastAPI control):**
  `router-worker` (intent classification, language detect), `retriever-worker`, `rerank-worker`, `agent-worker` (LLM steps and tools), `tool-worker` (external API calls), `ticket-worker`, `email-worker`, `voice-worker` (optional ASR/TTS), `eval-worker`, `export-worker`, `quality-worker`.
* **Event Bus/Queues:** NATS (subjects: `conv.*`, `agent.*`, `tool.*`, `eval.*`, `export.*`) + Redis Streams for short tasks; Celery/RQ orchestration.
* **Datastores:** Postgres 16 + pgvector; S3/R2 for files/artifacts; Redis for cache/session; optional ClickHouse for high‑volume events.
* **Observability:** OpenTelemetry (traces/logs/metrics), Prometheus/Grafana, Sentry.
* **Secrets:** Cloud Secrets Manager/KMS.

### 4.2 Data Model (Postgres + pgvector)

```sql
-- Tenancy & Identity
CREATE TABLE orgs (
  id UUID PRIMARY KEY, name TEXT NOT NULL, plan TEXT DEFAULT 'pro', region TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE users (
  id UUID PRIMARY KEY, org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  email CITEXT UNIQUE NOT NULL, name TEXT, role TEXT DEFAULT 'designer', tz TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE memberships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  workspace_role TEXT CHECK (workspace_role IN ('owner','admin','designer','operator','viewer')),
  PRIMARY KEY (user_id, org_id)
);

-- Agents & Versions
CREATE TABLE agents (
  id UUID PRIMARY KEY, org_id UUID, name TEXT, slug TEXT, description TEXT, created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(org_id, slug)
);
CREATE TABLE agent_versions (
  id UUID PRIMARY KEY, agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  version TEXT, status TEXT CHECK (status IN ('draft','released','archived')) DEFAULT 'draft',
  intents JSONB, flows JSONB, prompts JSONB, policies JSONB, tools JSONB, guardrails JSONB,
  created_by UUID, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(agent_id, version)
);

-- Knowledge & Collections
CREATE TABLE collections (
  id UUID PRIMARY KEY, org_id UUID, name TEXT, description TEXT, tags TEXT[], created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE documents (
  id UUID PRIMARY KEY, org_id UUID, collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  title TEXT, mime TEXT, s3_key TEXT, bytes BIGINT, meta JSONB, created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE chunks (
  id UUID PRIMARY KEY, document_id UUID, collection_id UUID, order_no INT,
  text TEXT, embedding VECTOR(1536), meta JSONB
);
CREATE INDEX chunks_embedding_idx ON chunks USING ivfflat (embedding vector_cosine_ops);

-- Deployments & Channels
CREATE TABLE deployments (
  id UUID PRIMARY KEY, agent_id UUID, agent_version_id UUID, env TEXT CHECK (env IN ('dev','staging','prod')),
  channel TEXT CHECK (channel IN ('web','slack','teams','intercom','zendesk','whatsapp','sms','email','voice')),
  config JSONB, rate_limit JSONB, enabled BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations & Messages
CREATE TABLE conversations (
  id UUID PRIMARY KEY, org_id UUID, agent_version_id UUID, deployment_id UUID,
  channel TEXT, external_thread_id TEXT, user_id_hash TEXT, locale TEXT, opened_at TIMESTAMPTZ, closed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('open','pending','escalated','closed')) DEFAULT 'open'
);
CREATE TABLE messages (
  id UUID PRIMARY KEY, conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user','assistant','system','tool','human_agent')),
  content TEXT, citations JSONB, tool_name TEXT, tool_input JSONB, tool_output JSONB,
  cost_usd NUMERIC, tokens_in BIGINT, tokens_out BIGINT, latency_ms BIGINT, created_at TIMESTAMPTZ DEFAULT now()
);

-- Evals & QA
CREATE TABLE datasets (
  id UUID PRIMARY KEY, org_id UUID, name TEXT, schema JSONB, storage_uri TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE eval_runs (
  id UUID PRIMARY KEY, agent_version_id UUID, dataset_id UUID, baseline_version_id UUID,
  rubric JSONB, judge TEXT, status TEXT, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, summary JSONB
);
CREATE TABLE eval_results (
  id UUID PRIMARY KEY, eval_run_id UUID, sample_id TEXT, input JSONB, output JSONB, baseline_output JSONB,
  score NUMERIC, label TEXT, rationale TEXT, passed BOOLEAN
);

-- Feedback & Metrics
CREATE TABLE csat (
  id UUID PRIMARY KEY, conversation_id UUID, value INT CHECK (value BETWEEN 1 AND 5),
  comment TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE kpis (
  id BIGSERIAL PRIMARY KEY, org_id UUID, agent_id UUID, day DATE,
  deflection_rate NUMERIC, fcr NUMERIC, csat_avg NUMERIC, ttf_token_ms NUMERIC, cost_per_resolution NUMERIC
);

-- Audit & Secrets
CREATE TABLE connections (
  id UUID PRIMARY KEY, org_id UUID, kind TEXT, name TEXT, config JSONB, env TEXT, enabled BOOLEAN DEFAULT TRUE
);
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY, org_id UUID, user_id UUID, agent_id UUID, action TEXT, target TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
```

**Invariants**

* RLS by `org_id`; `agent_versions.status='released'` is immutable.
* Conversations are channel‑scoped and carry an external thread id for mapping back to Slack/Zendesk/etc.
* In strict answer mode, assistant messages must contain ≥1 citation when knowledge collections are enabled.

### 4.3 API Surface (REST `/v1`, OpenAPI)

**Auth/Orgs/Users**

* `POST /auth/login`, `POST /auth/refresh`, `GET /me`.

**Agents & Versions**

* `POST /agents` `{name, slug, description}`
* `POST /agents/:id/versions` `{intents, flows, prompts, policies, tools, guardrails}`
* `POST /agent-versions/:id/release`
* `GET /agents/:id|/versions/:id`
* `POST /agent-versions/:id/diff/:otherId`

**Knowledge**

* `POST /collections` `{name, description}`
* `POST /documents` `{collection_id}` → upload URL
* `POST /documents/:id/process`
* `POST /search` `{collection_id, q, k?, hybrid?:true}`

**Deployments & Channels**

* `POST /deployments` `{agent_version_id, env, channel, config, rate_limit}`
* `PATCH /deployments/:id` `{enabled}`
* `POST /webhook/:deploymentId` inbound handler (Slack/Intercom/Zendesk/WhatsApp/SMS/Email)

**Conversations**

* `POST /execute/:deploymentId` `{input, user, locale}` (SSE for streaming)
* `GET /conversations?agent_id&from&to&channel&status`
* `GET /conversations/:id/messages`
* `POST /conversations/:id/escalate` `{reason, to_queue}`
* `POST /conversations/:id/csat` `{value, comment?}`

**Evals & QA**

* `POST /datasets` → signed upload
* `POST /eval-runs` `{agent_version_id, dataset_id, baseline_version_id?, rubric, judge}`
* `GET /eval-runs/:id|/results`

**Analytics**

* `GET /analytics/kpis?agent_id&from&to&channel`
* `GET /analytics/costs?agent_id&from&to`

**Conventions**

* Mutations require **Idempotency‑Key**; errors as **Problem+JSON**; cursor pagination; per‑IP/org rate limits.

### 4.4 Pipelines & Execution

**Route**

1. Inbound message → `router-worker` detects language/intent → confidence check → pick flow path (or ask a clarifying question).
   **Retrieve**
2. Context build via hybrid search and rerank; enforce diversity; construct citations.
   **Act**
3. `agent-worker` composes prompt, calls LLM; if tool needed, `tool-worker` executes (e.g., order lookup, ticket create), returns JSON to agent.
   **Reply**
4. Stream tokens to channel; include citations and action summaries.
   **Guard**
5. Safety filters (PII, jailbreak, policy) on output; block or warn and escalate.
   **Persist**
6. Write messages, tool logs, costs, latency; update KPIs; trigger feedback survey.

### 4.5 Realtime

* WebSocket channels: `conv:{id}:stream`, `agent:{id}:deployments`, `evalrun:{id}:progress`.
* Presence and typing indicators for web widget; handoff status messages; operator console receives live transcript.

### 4.6 Caching & Performance

* Redis: recent intents per user, session context, connection tokens, rate‑limit counters.
* ANN warmers for active collections; provider call batching; streaming everywhere with backpressure.
* Circuit breakers on failing tools; per‑channel concurrency caps.

### 4.7 Observability

* OTel spans: `route`, `retrieve`, `rerank`, `agent.llm`, `tool.call`, `reply`; attributes include `channel`, `intent`, `model`, `cost`.
* Metrics: deflection, FCR, CSAT, time‑to‑first‑token, errors by tool/provider; DLQ depth.
* Logs: structured JSON; request/trace correlation; Sentry alerts on policy violations and escalation spikes.

### 4.8 Security & Compliance

* TLS/HSTS/CSP; signed URLs; KMS‑encrypted secrets; tenant isolation via RLS and S3 prefixing.
* SSO/SAML/OIDC; SCIM; per‑role permissions; immutable `audit_log`.
* DSR endpoints; configurable retention; redaction for stored transcripts; consent banners on web widget.
* HIPAA/BAA option (restricted tools/channels; access logs; PHI safeguards).

---

## 5) Frontend Architecture (React 18 + Next.js 14)

### 5.1 Tech Choices

* **UI:** Chakra UI (Theme, Drawer, Modal, Table, Tabs, Steps) + Tailwind utilities.
* **State/Data:** TanStack Query; Zustand for editor/runtime UI; URL‑synced filters.
* **Graph/Flows:** React Flow for intent/flow editor.
* **Charts:** Recharts for KPIs.
* **Editor:** Monaco for prompts and tool code; JSON schema forms for policies and tools.
* **Realtime:** WS client; SSE for conversation streams.
* **i18n/A11y:** next‑intl; ARIA roles; keyboard‑first navigation.

### 5.2 App Structure

```
/app
  /(marketing)/page.tsx
  /(auth)/sign-in/page.tsx
  /(app)/dashboard/page.tsx
  /(app)/agents/page.tsx
  /(app)/agents/[agentId]/studio/page.tsx
  /(app)/agents/[agentId]/versions/[versionId]/page.tsx
  /(app)/deployments/page.tsx
  /(app)/conversations/page.tsx
  /(app)/conversations/[conversationId]/page.tsx
  /(app)/knowledge/page.tsx
  /(app)/datasets/page.tsx
  /(app)/evals/[evalRunId]/page.tsx
  /(app)/analytics/page.tsx
  /(app)/settings/page.tsx
/components
  Studio/*          // IntentGraph, FlowEditor, PromptComposer, PolicyEditor, GuardrailPanel
  Knowledge/*       // Uploader, CollectionTable, ReindexButton
  Channels/*        // Slack, Intercom, Zendesk, WhatsApp, Email setup forms
  Widget/*          // Web widget preview
  Console/*         // LiveTranscript, ToolLogs, EscalateButton
  Analytics/*       // KPI cards, Timeseries, Breakdown tables
  DeployPanel/*     // Env picker, Rate limits, Keys
  DiffViewer/*
  Comments/*
/lib
  api-client.ts
  ws-client.ts
  zod-schemas.ts
  rbac.ts
/store
  useStudioStore.ts
  useConsoleStore.ts
  useFilterStore.ts
```

### 5.3 Key Pages & UX Flows

**Dashboard**

* KPI cards: deflection, FCR, CSAT, cost; recent incidents and escalations; top failing tools.

**Agent Studio**

* IntentGraph + FlowEditor; PromptComposer per channel; PolicyEditor and GuardrailPanel; test bench with sample messages; run evals; create release.

**Deployments**

* Create connectors for Slack/Teams/Intercom/Zendesk/WhatsApp/SMS/Email/Web; configure rate limits and business hours; copy keys and snippets; enable/disable.

**Conversations**

* Explorer with filters and search; open a conversation to view transcript, citations, tool calls, costs; escalate or close; send human reply.

**Knowledge**

* Upload docs; reindex; set retriever parameters; view citation coverage per collection.

**Analytics**

* Timeseries + breakdowns by channel/intent/language; drill‑through to transcripts.

### 5.4 Component Breakdown (Selected)

* **Studio/FlowEditor/Node.tsx**
  Props: `{ type, config, onChange }`
  Dynamic form for node config; validates schemas; supports retries and timeouts.

* **Console/LiveTranscript.tsx**
  Props: `{ conversationId }`
  Streams tokens, shows citations inline; tool logs side panel; escalate button.

* **Widget/Preview\.tsx**
  Props: `{ theme, welcome, channels }`
  Renders embeddable widget; simulates auth handoff and file uploads.

* **Analytics/BreakdownTable.tsx**
  Props: `{ dimension, metrics }`
  Sortable table; links to filtered conversation list.

### 5.5 Data Fetching & Caching

* Server Components for dashboards and agent/version snapshots.
* TanStack Query for conversations, deployments, analytics; WS updates caches; optimistic UI for studio edits.
* Prefetch chain: agents → version → studio → deployments → console.

### 5.6 Validation & Error Handling

* Zod schemas; Problem+JSON renderer; inline hints for policy/guardrail violations.
* Guard: release blocked if must‑pass evals fail or required channels not configured; strict mode blocks uncited answers.

### 5.7 Accessibility & i18n

* Keyboard shortcuts; focus management; live‑region updates for streaming; localized dates/numbers.

---

## 6) SDKs & Integration Contracts

**Web Widget Embed**

```html
<script src="https://cdn.example.com/support-widget.js" data-agent="agent_123" data-env="prod" data-key="pub_xxx"></script>
```

**Execute via REST (server‑side)**

```http
POST /v1/execute/{deploymentId}
Authorization: Bearer <server-key>
Content-Type: application/json
{"input": {"message": "Where is my order 100234?"}, "user": {"id": "u_abc", "email": "a@co"}, "locale": "en"}
```

**Slack Events Webhook**
`POST /v1/webhook/{deploymentId}` with Slack `event_callback` body; verify signature header `X-Slack-Signature`.

**Zendesk Ticket Create Tool (JSON schema)**

```json
{
  "name": "create_ticket",
  "input": {"type": "object", "properties": {"subject": {"type": "string"}, "priority": {"type": "string"}, "description": {"type": "string"}}, "required": ["subject","description"]},
  "output": {"type": "object", "properties": {"id": {"type": "integer"}, "url": {"type": "string"}}}
}
```

**Signature for incoming webhooks**
`X-ASAB-Signature: t=timestamp,v1=HMAC_SHA256(body, secret)`

---

## 7) DevOps & Deployment

* **FE:** Vercel (Next.js).
* **APIs/Workers:** Render/Fly/GKE; separate autoscaling pools (router, agent, tools, evals).
* **DB:** Managed Postgres + pgvector; PITR; replicas.
* **Cache/Bus:** Redis + NATS; DLQ with retries/backoff.
* **Storage:** S3/R2 with lifecycle; CDN for widget assets.
* **CI/CD:** GitHub Actions (lint/typecheck/unit/integration, Docker build, scan, sign, deploy); blue/green; migrations gated.
* **IaC:** Terraform modules for DB/Redis/NATS/buckets/CDN/secrets/DNS.
* **Envs:** dev/staging/prod; region pinning; error budgets and auto‑rollback.

**Operational SLOs**

* Time‑to‑first‑token **< 1.8 s p95** (web channel).
* Median resolution time **< 3 min** for Tier‑1 intents.
* Run success **≥ 99%** excl. provider outages.
* 5xx **< 0.5%/1k**; DLQ drain within SLA.

---

## 8) Testing

* **Unit:** intent classifier thresholds; guardrail detectors; tool schema validation; policy enforcement.
* **Integration:** channel webhooks (Slack/Intercom/Zendesk/WhatsApp/SMS/Email); ticket create/update; RAG citations.
* **Regression:** must‑pass evals on top intents; red‑team packs; strict‑mode citation tests.
* **E2E (Playwright):** design intent → add tool → run eval → release → deploy to Slack → run conversation → escalate → collect CSAT.
* **Load:** burst traffic on web widget and SMS; provider rate‑limit handling; retries/backoff.
* **Chaos:** tool provider 5xx/timeout; webhook signature mismatch; network egress blocked; ensure safe degradation.
* **Security:** RLS checks; secret leaks prevention; audit completeness.

---

## 9) Success Criteria

**Product KPIs**

* Deflection rate **≥ 35%** in 60 days without lower CSAT.
* First‑contact resolution **≥ 65%** for covered intents.
* CSAT **≥ 4.3/5** for bot‑resolved conversations.
* Time‑to‑value: first deployment within **1 day** for new orgs.

**Engineering SLOs**

* Evaluation pipeline success **≥ 99%**; citation coverage in strict mode **≥ 95%**.
* Widget error rate **< 0.1%** of sessions; webhook latency p95 **< 400 ms**.

---

## 10) Visual/Logical Flows

**A) Design → Evaluate → Release**
Define intents/prompts/policies → attach knowledge → run evals/regressions → review diffs → release version.

**B) Deploy**
Create deployment per channel/env → configure rate limits/hours → enable.

**C) Run**
Inbound message → route intent → retrieve/rerank → agent think/tool call → reply with citations → satisfaction check.

**D) Escalate**
Trigger human handoff with full context → human replies in thread → close and record CSAT.

**E) Observe**
Dashboards show KPIs/costs → alerts on anomalies → drill to transcripts and tool logs.
