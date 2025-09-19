# @guidogerb/components/ai-support — Task List

## Phase 1 · Guardrailed chat MVP

- [ ] Implement the `<AiSupport>` component with an accessible chat UI, streaming-friendly state updates, and a configurable REST client that posts OpenAI-compatible chat payloads to the API Gateway endpoint.
- [ ] Wire in guardrail hooks that can transform, reject, or replace user prompts before dispatch while surfacing rich error messaging in the UI.
- [ ] Support Retrieval-Augmented Generation (RAG) by accepting an embedding retriever that returns contextual system messages or metadata to prepend before every request.
- [ ] Persist chat history in component state with a configurable `historyLimit`, trimming older turns while preserving the earliest system instructions.
- [ ] Document the public props, guardrail contract, and retriever contract in the README with code examples.

## Phase 2 · Observability and resilience

- [ ] Surface lifecycle callbacks (`onRequest`, `onResponse`, `onError`) so host apps can instrument requests, log telemetry, or feed analytics pipelines.
- [ ] Add retry/backoff helpers and optimistic UI affordances for transient API Gateway/network failures.
- [ ] Expose loading skeleton slots + message level status indicators (pending, succeeded, failed) for richer UX.
- [ ] Expand unit coverage around guardrail short-circuits, retriever failures, and API error serialization.

## Phase 3 · Enterprise features

- [ ] Support configurable chat presets (models, temperature caps, escalation triggers) injected via context for multi-tenant hosting scenarios.
- [ ] Integrate optional conversation persistence to storage (e.g., DynamoDB or Firestore) keyed by the provided user context.
- [ ] Add hosted guardrail policies (PII, safety, compliance) with built-in redaction helpers and admin override tooling.
- [ ] Ship Storybook stories + visual regression tests covering the major UI states (empty, loading, answer, error, escalated).
