# @guidogerb/components/ai-support

Composable AI support widget that orchestrates OpenAI-compatible REST calls through the API Gateway while layering in guardrails, retrieval-augmented context, and per-user conversation state.

## Feature highlights

- **API Gateway bridge** — Posts chat-completion payloads using the OpenAI schema (`model`, `messages`, `temperature`, `top_p`, `user`) so the gateway can proxy to OpenAI or compatible providers without translation glue.
- **Guardrail integration** — Accepts an async `guardrail` hook that can allow, block, or mutate user prompts before they leave the browser; rejected prompts surface detailed messaging in the UI.
- **RAG embeddings** — Supports a pluggable `embeddingRetriever` hook that returns contextual snippets or message objects to prepend ahead of each API call, enabling Retrieval-Augmented Generation workflows.
- **User context aware** — Injects the provided `userContext` into the outbound payload (as the `user` field + serialized system prompt) so downstream services can personalize responses or apply policy rules.
- **Configurable history limit** — Maintains a rolling chat history with a configurable `historyLimit`, trimming the oldest turns while preserving the earliest system instruction for grounding.
- **Accessible chat shell** — Ships with a minimal, keyboard-friendly UI (messages list, textarea, submit button, live error banner) that consumers can re-style via `className` overrides.

## Component API

```tsx
import { AiSupport } from '@guidogerb/components/ai-support'
;<AiSupport
  endpoint="/api/ai/support"
  model="gpt-4o-mini"
  userContext={{ userId: 'user-42', locale: 'en-US' }}
  initialMessages={[{ role: 'system', content: 'You are a helpful support concierge.' }]}
  historyLimit={6}
  guardrail={async ({ input, userContext }) => {
    if (/ssn/i.test(input)) {
      return { allow: false, reason: 'Please omit sensitive identifiers.' }
    }
    return { allow: true }
  }}
  embeddingRetriever={async ({ input, userContext }) => {
    const docs = await knowledgeBase.lookup(input, userContext)
    return {
      messages: docs.map((doc) => ({ role: 'system', content: doc.summary })),
      metadata: { sourceCount: docs.length },
    }
  }}
/>
```

### Props

| Prop                 | Type                                                                                | Default            | Description                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `endpoint`           | `string`                                                                            | —                  | Required API Gateway endpoint that accepts OpenAI chat-completion payloads.                       |
| `model`              | `string`                                                                            | `gpt-4o-mini`      | Chat-completion model identifier sent to the gateway.                                             |
| `method`             | `string`                                                                            | `POST`             | HTTP verb for the request (POST is recommended).                                                  |
| `headers`            | `Record<string, string>`                                                            | `{}`               | Additional headers merged with `Content-Type: application/json`.                                  |
| `temperature`        | `number`                                                                            | `0.2`              | Temperature parameter forwarded to the chat endpoint.                                             |
| `topP`               | `number`                                                                            | `1`                | Top-p nucleus sampling value forwarded to the chat endpoint.                                      |
| `userContext`        | `Record<string, unknown> \| string`                                                 | `undefined`        | Supplemental context serialized into a system message and (if possible) the `user` field.         |
| `historyLimit`       | `number`                                                                            | `10`               | Maximum number of conversation turns retained in local state (earliest system message is pinned). |
| `initialMessages`    | `Array<{ role: string; content: string } \| string>`                                | `[]`               | Seed conversation (commonly a system primer); counted against the history limit.                  |
| `guardrail`          | `({ input, messages, userContext }) => Promise<GuardrailResult> \| GuardrailResult` | `undefined`        | Hook invoked before dispatch; can allow, transform, or block the prompt.                          |
| `embeddingRetriever` | `({ input, messages, userContext }) => Promise<RagResult> \| RagResult`             | `undefined`        | Hook that returns contextual documents/messages injected as system prompts for RAG.               |
| `fetcher`            | `(url, init) => Promise<Response>`                                                  | `globalThis.fetch` | Override fetch implementation (useful for SSR/testing).                                           |
| `className`          | `string`                                                                            | `''`               | Optional class name applied to the root element for theming.                                      |
| `onResponse`         | `({ data, request, assistantMessage, rag, guardrail }) => void`                     | `undefined`        | Called when the gateway responds successfully.                                                    |
| `onError`            | `(error) => void`                                                                   | `undefined`        | Invoked whenever a guardrail, retriever, or network error occurs.                                 |

#### Guardrail contract

`GuardrailResult` can be:

- `boolean` — `true` to allow, `false` to block with the default message.
- `string` — sanitize/replace the user prompt content while allowing the request.
- `{ allow: boolean, reason?: string, input?: string, messages?: Message[], metadata?: unknown }`
  - `allow: false` short-circuits the request and surfaces `reason` in the UI.
  - `input` replaces the outgoing user message content when provided.
  - `messages` can supply a fully transformed conversation to send instead of the component-managed history.
  - `metadata` is forwarded to the `onResponse` callback for observability.

The guardrail receives `{ input, messages, userContext }`, where `messages` reflects the current post-trim history (excluding context injections).

#### RAG retriever contract

`RagResult` can be:

- `string` — appended as a single system message before the request.
- `string[]` — joined into one system message separated by blank lines.
- `Message` or `Message[]` — objects with `{ role, content }` that will be normalized (defaulting to `system`).
- `{ messages: RagResult, metadata?: unknown }` — explicit shape returning messages plus optional metadata.

The hook receives the sanitized prompt `{ input }`, the trimmed history, and the `userContext`. Failures throw into `onError` and halt the request.

### Request payload shape

The component posts OpenAI-style JSON payloads:

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "User context:\n{\n  \"userId\": \"user-42\"\n}" },
    { "role": "system", "content": "Knowledge base summary..." },
    { "role": "system", "content": "You are a helpful support concierge." },
    { "role": "user", "content": "How do I reset my password?" }
  ],
  "temperature": 0.2,
  "top_p": 1,
  "user": "user-42"
}
```

The first system message serializes the `userContext`, followed by any RAG snippets and the trimmed history.

### Error handling

- Guardrail rejections display a banner (`role="alert"`) with the provided `reason`.
- Retriever errors, network failures, or non-2xx responses propagate to `onError` and present a generic failure message while keeping the user’s prompt in history for retry.
- The submit button is disabled while a request is in flight to prevent duplicate submissions.

### Testing

The package ships with `vitest` + `@testing-library/react` unit coverage under `src/__tests__/AiSupport.test.jsx`. Run the suite with:

```sh
pnpm vitest run @guidogerb/components/ai-support/src/__tests__/AiSupport.test.jsx
```

This exercises guardrail short-circuits, RAG context injection, payload construction, and history trimming.
