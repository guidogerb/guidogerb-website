import { useMemo, useState } from 'react'

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_HISTORY_LIMIT = 10

/**
 * Normalize a single chat message.
 */
function normalizeMessage(entry, defaultRole = 'user', fallbackContent = '') {
  if (entry == null) {
    return null
  }

  if (typeof entry === 'string') {
    return { role: defaultRole, content: entry }
  }

  if (typeof entry === 'object') {
    const role = typeof entry.role === 'string' ? entry.role : defaultRole
    const content = extractContent(entry.content, fallbackContent)
    return { role, content }
  }

  return { role: defaultRole, content: String(entry) }
}

function extractContent(value, fallbackContent = '') {
  if (value == null) return fallbackContent
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) {
          return String(part.text)
        }
        return JSON.stringify(part)
      })
      .join('\n')
  }
  if (typeof value === 'object' && 'text' in value) {
    return String(value.text)
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (error) {
      return fallbackContent
    }
  }
  return String(value)
}

function normalizeMessages(value, { defaultRole = 'user', fallbackContent = '' } = {}) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeMessage(entry, defaultRole, fallbackContent))
      .filter(Boolean)
  }
  const message = normalizeMessage(value, defaultRole, fallbackContent)
  return message ? [message] : []
}

function applyHistoryLimit(messages, limit) {
  if (!Number.isInteger(limit) || limit <= 0) {
    return messages
  }

  if (messages.length <= limit) {
    return messages
  }

  const firstSystemIndex = messages.findIndex((message) => message.role === 'system')

  if (firstSystemIndex === -1) {
    return messages.slice(-limit)
  }

  const pinned = messages[firstSystemIndex]
  const remainder = messages.filter((_, index) => index !== firstSystemIndex)
  const remainingSlots = limit - 1

  if (remainingSlots <= 0) {
    return [pinned]
  }

  return [pinned, ...remainder.slice(-remainingSlots)]
}

async function evaluateGuardrail(guardrail, context) {
  if (typeof guardrail !== 'function') {
    return { allow: true, input: context.input, messages: null, metadata: undefined }
  }

  const result = await guardrail(context)

  if (result == null) {
    return { allow: true, input: context.input, messages: null, metadata: undefined }
  }

  if (typeof result === 'boolean') {
    return { allow: result, input: context.input, messages: null, metadata: undefined }
  }

  if (typeof result === 'string') {
    return { allow: true, input: result, messages: null, metadata: undefined }
  }

  const allow = result.allow !== false
  const input = typeof result.input === 'string' ? result.input : context.input
  const messages = Array.isArray(result.messages)
    ? normalizeMessages(result.messages, { defaultRole: 'user' })
    : null

  return {
    allow,
    input,
    messages,
    reason: typeof result.reason === 'string' ? result.reason : undefined,
    metadata: result.metadata,
  }
}

async function resolveRag(retriever, context) {
  if (typeof retriever !== 'function') {
    return { messages: [], metadata: undefined }
  }

  const raw = await retriever(context)

  if (!raw) {
    return { messages: [], metadata: undefined }
  }

  if (Array.isArray(raw) || typeof raw === 'string') {
    return { messages: normalizeMessages(raw, { defaultRole: 'system' }), metadata: undefined }
  }

  if (typeof raw === 'object') {
    if (Array.isArray(raw.messages) || typeof raw.messages === 'string') {
      return {
        messages: normalizeMessages(raw.messages, { defaultRole: 'system' }),
        metadata: raw.metadata,
      }
    }

    if (Array.isArray(raw.documents)) {
      const content = raw.documents
        .map((doc) => (typeof doc === 'string' ? doc : JSON.stringify(doc)))
        .join('\n\n')
      return {
        messages: [{ role: 'system', content }],
        metadata: raw.metadata,
      }
    }

    if (typeof raw.content !== 'undefined' || typeof raw.role !== 'undefined') {
      return {
        messages: normalizeMessages([raw], { defaultRole: 'system' }),
        metadata: raw.metadata,
      }
    }
  }

  return { messages: normalizeMessages(raw, { defaultRole: 'system' }), metadata: undefined }
}

function formatUserContext(userContext) {
  if (!userContext) return null

  if (typeof userContext === 'string') {
    return userContext
  }

  if (typeof userContext === 'object') {
    try {
      return `User context:\n${JSON.stringify(userContext, null, 2)}`
    } catch (error) {
      return `User context: ${String(userContext)}`
    }
  }

  return String(userContext)
}

function pickUserIdentifier(userContext) {
  if (!userContext || typeof userContext !== 'object') return undefined
  const id = userContext.userId ?? userContext.id ?? userContext.email
  return typeof id === 'undefined' ? undefined : String(id)
}

function buildContextMessages({ userContext, ragMessages }) {
  const messages = []
  const formattedContext = formatUserContext(userContext)

  if (formattedContext) {
    messages.push({ role: 'system', content: formattedContext })
  }

  if (Array.isArray(ragMessages) && ragMessages.length > 0) {
    messages.push(...ragMessages)
  }

  return messages
}

function mergeHeaders(defaults, overrides) {
  return { ...defaults, ...(overrides || {}) }
}

export function AiSupport({
  endpoint,
  method = 'POST',
  model = DEFAULT_MODEL,
  temperature = 0.2,
  topP = 1,
  headers,
  userContext,
  historyLimit = DEFAULT_HISTORY_LIMIT,
  initialMessages = [],
  guardrail,
  embeddingRetriever,
  fetcher,
  className = '',
  onResponse,
  onError,
}) {
  if (!endpoint) {
    throw new Error('AiSupport requires an `endpoint` to send chat requests')
  }

  const [messages, setMessages] = useState(() =>
    applyHistoryLimit(normalizeMessages(initialMessages, { defaultRole: 'system' }), historyLimit),
  )
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const fetchImpl = useMemo(() => fetcher ?? globalThis.fetch, [fetcher])

  async function handleSubmit(event) {
    event.preventDefault()

    if (isLoading) return

    const trimmed = inputValue.trim()

    if (!trimmed) {
      return
    }

    if (!fetchImpl) {
      const error = new Error('No fetch implementation available for AiSupport')
      setErrorMessage(error.message)
      onError?.(error)
      return
    }

    setErrorMessage(null)

    let guardrailResult
    try {
      guardrailResult = await evaluateGuardrail(guardrail, {
        input: trimmed,
        messages,
        userContext,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setErrorMessage(err.message)
      onError?.(err)
      return
    }

    if (!guardrailResult.allow) {
      const reason = guardrailResult.reason ?? 'Message blocked by guardrail.'
      setErrorMessage(reason)
      onError?.(new Error(reason))
      return
    }

    const outgoingUserMessage = normalizeMessage(
      { role: 'user', content: guardrailResult.input ?? trimmed },
      'user',
    )

    const nextHistory = guardrailResult.messages?.length
      ? guardrailResult.messages
      : [...messages, outgoingUserMessage]

    const limitedHistory = applyHistoryLimit(nextHistory, historyLimit)

    setMessages(limitedHistory)
    setInputValue('')
    setIsLoading(true)

    let rag

    try {
      rag = await resolveRag(embeddingRetriever, {
        input: outgoingUserMessage.content,
        messages: limitedHistory,
        userContext,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setIsLoading(false)
      setErrorMessage(err.message)
      onError?.(err)
      return
    }

    const contextMessages = buildContextMessages({
      userContext,
      ragMessages: rag.messages,
    })

    const requestMessages = [...contextMessages, ...limitedHistory].map((message) => ({
      role: message.role,
      content: message.content,
    }))

    const payload = {
      model,
      messages: requestMessages,
      temperature,
      top_p: topP,
    }

    const userId = pickUserIdentifier(userContext)
    if (userId) {
      payload.user = userId
    }

    try {
      const response = await fetchImpl(endpoint, {
        method,
        headers: mergeHeaders({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = new Error(`AI support request failed with status ${response.status}`)
        error.status = response.status
        throw error
      }

      const data = await response.json()
      const assistantPayload = (data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message) ||
        data?.message || { role: 'assistant', content: data?.content ?? '' }

      const assistantMessage = normalizeMessage(assistantPayload, 'assistant')

      setMessages((current) => {
        const updated = [...current, assistantMessage]
        return applyHistoryLimit(updated, historyLimit)
      })

      onResponse?.({
        data,
        request: payload,
        assistantMessage,
        rag,
        guardrail: guardrailResult,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setErrorMessage(err.message)
      onError?.(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`ai-support ${className}`.trim()}>
      <ul className="ai-support__messages" data-testid="ai-support-messages">
        {messages.map((message, index) => (
          <li key={`${message.role}-${index}`} data-testid="ai-support-message">
            <div className="ai-support__message-role">{message.role}</div>
            <div className="ai-support__message-content">{message.content}</div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} data-testid="ai-support-form" className="ai-support__form">
        <label className="ai-support__label">
          <span className="ai-support__label-text">Message</span>
          <textarea
            aria-label="Message"
            className="ai-support__input"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            disabled={isLoading}
            placeholder="Ask the AI support agent..."
            rows={3}
          />
        </label>
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="ai-support__submit"
        >
          {isLoading ? 'Sending…' : 'Send'}
        </button>
      </form>

      {errorMessage ? (
        <div role="alert" className="ai-support__error">
          {errorMessage}
        </div>
      ) : null}
    </div>
  )
}

export default AiSupport
