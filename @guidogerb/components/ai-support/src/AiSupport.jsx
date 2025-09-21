import { useEffect, useMemo, useRef, useState } from 'react'
import { createStorageController } from '@guidogerb/components-storage'

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_HISTORY_LIMIT = 10
const DEFAULT_STORAGE_NAMESPACE = 'guidogerb.ai-support'
const DEFAULT_STORAGE_KEY = 'transcript'
const DEFAULT_TENANT_ID = 'default'

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

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

const normalizeTenantKey = (value) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  if (value === null || value === undefined) {
    return DEFAULT_TENANT_ID
  }

  return String(value)
}

const normalizeStorageKey = (value) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  return DEFAULT_STORAGE_KEY
}

const normalizeNamespace = (value) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  return DEFAULT_STORAGE_NAMESPACE
}

const normalizeRetentionOptions = (retention, context) => {
  if (typeof retention === 'function') {
    return normalizeRetentionOptions(retention(context), context)
  }

  if (typeof retention === 'number') {
    return retention > 0 ? { maxAgeMs: retention } : {}
  }

  if (!isPlainObject(retention)) {
    return {}
  }

  const options = {}

  if (typeof retention.maxAgeMs === 'number' && retention.maxAgeMs > 0) {
    options.maxAgeMs = retention.maxAgeMs
  }

  if (Number.isInteger(retention.maxMessages) && retention.maxMessages > 0) {
    options.maxMessages = retention.maxMessages
  }

  return options
}

const sanitizeMessagesForStorage = (messages) =>
  messages.map((message) => ({
    role: typeof message?.role === 'string' ? message.role : 'assistant',
    content: typeof message?.content === 'string' ? message.content : String(message?.content ?? ''),
  }))

const extractStoredMessages = (value) => {
  if (Array.isArray(value)) {
    return value
  }

  if (isPlainObject(value) && Array.isArray(value.messages)) {
    return value.messages
  }

  return []
}

const getStoredUpdatedAt = (value) => {
  if (isPlainObject(value) && typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)) {
    return value.updatedAt
  }

  return undefined
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

function getContentType(response) {
  if (!response?.headers || typeof response.headers.get !== 'function') {
    return ''
  }

  return response.headers.get('Content-Type') ?? response.headers.get('content-type') ?? ''
}

function detectStreamMode(response) {
  if (!response?.body || typeof response.body.getReader !== 'function') {
    return null
  }

  const contentType = String(getContentType(response) || '').toLowerCase()

  if (!contentType) {
    return null
  }

  if (contentType.includes('text/event-stream')) {
    return 'sse'
  }

  if (contentType.includes('ndjson') || contentType.includes('jsonl')) {
    return 'ndjson'
  }

  if (contentType.includes('stream')) {
    return 'sse'
  }

  return null
}

function extractStreamSegments(buffer, mode) {
  if (mode === 'ndjson') {
    const parts = buffer.split(/\r?\n/)
    const remainder = parts.pop() ?? ''
    const events = parts.map((part) => part.trim()).filter(Boolean)
    return { events, remainder }
  }

  const rawEvents = buffer.split(/\n\n/)
  const remainder = rawEvents.pop() ?? ''
  const events = rawEvents
    .map((event) => {
      const dataLines = event
        .split(/\n/)
        .map((line) => line.replace(/^data:\s*/, ''))
        .join('\n')
        .trim()

      return dataLines
    })
    .filter(Boolean)

  return { events, remainder }
}

function parseStreamingEvent(event) {
  const trimmed = event.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed === '[DONE]') {
    return { done: true }
  }

  try {
    const data = JSON.parse(trimmed)
    const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined
    const deltaContent =
      typeof choice?.delta?.content === 'string' ? choice.delta.content : undefined
    const messageContent =
      typeof choice?.message?.content === 'string' ? choice.message.content : undefined
    const aggregatedContent = typeof data?.content === 'string' ? data.content : undefined

    return {
      done: false,
      data,
      deltaContent,
      messageContent,
      aggregatedContent,
    }
  } catch (error) {
    return {
      done: false,
      data: null,
      deltaContent: trimmed,
      messageContent: undefined,
      aggregatedContent: undefined,
    }
  }
}

async function processStreamingResponse({
  response,
  mode,
  historyLimit,
  setMessages,
  onResponse,
  payload,
  rag,
  guardrailResult,
}) {
  if (!response?.body || typeof response.body.getReader !== 'function') {
    return false
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let streamingContent = ''
  let latestData = null
  let sawContent = false

  setMessages((current) =>
    applyHistoryLimit(
      [...current, /** @type {const} */ ({ role: 'assistant', content: '', __streaming: true })],
      historyLimit,
    ),
  )

  const updateStreamingMessage = (content, { markFinal = false } = {}) => {
    streamingContent = content

    setMessages((current) => {
      if (!current.length) {
        return current
      }

      const lastIndex = current.length - 1
      const lastMessage = current[lastIndex]

      if (lastMessage.role !== 'assistant' || (!lastMessage.__streaming && !markFinal)) {
        return current
      }

      const nextMessages = current.slice()
      const nextMessage = { role: 'assistant', content }
      if (!markFinal) {
        nextMessage.__streaming = true
      }
      nextMessages[lastIndex] = nextMessage
      return nextMessages
    })
  }

  const appendContent = (delta) => {
    if (!delta) return
    sawContent = true
    updateStreamingMessage(streamingContent + delta)
  }

  const setFullContent = (content) => {
    if (typeof content !== 'string') return
    sawContent = true
    updateStreamingMessage(content)
  }

  const handleEvent = (event) => {
    const parsed = parseStreamingEvent(event)

    if (!parsed) {
      return
    }

    if (parsed.done) {
      return
    }

    if (parsed.data) {
      latestData = parsed.data
    }

    if (parsed.deltaContent) {
      appendContent(parsed.deltaContent)
    }

    if (parsed.messageContent) {
      setFullContent(parsed.messageContent)
    }

    if (!parsed.deltaContent && parsed.aggregatedContent) {
      appendContent(parsed.aggregatedContent)
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const { events, remainder } = extractStreamSegments(buffer, mode)
    buffer = remainder
    events.forEach(handleEvent)
  }

  if (buffer.trim()) {
    const { events } = extractStreamSegments(`${buffer}\n\n`, mode)
    events.forEach(handleEvent)
  }

  updateStreamingMessage(streamingContent, { markFinal: true })

  const assistantMessage = { role: 'assistant', content: streamingContent }
  const responseData =
    latestData ?? (sawContent ? { choices: [{ message: assistantMessage }] } : null)

  onResponse?.({
    data: responseData,
    request: payload,
    assistantMessage,
    rag,
    guardrail: guardrailResult,
  })

  return true
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
  storage,
  storageNamespace = DEFAULT_STORAGE_NAMESPACE,
  storageKey = DEFAULT_STORAGE_KEY,
  tenantId = DEFAULT_TENANT_ID,
  persistConversation = true,
  transcriptRetention,
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

  const resolvedTenantId = useMemo(() => normalizeTenantKey(tenantId), [tenantId])
  const resolvedNamespace = useMemo(() => normalizeNamespace(storageNamespace), [storageNamespace])
  const resolvedStorageKey = useMemo(() => normalizeStorageKey(storageKey), [storageKey])

  const retentionOptions = useMemo(
    () => normalizeRetentionOptions(transcriptRetention, { tenantId: resolvedTenantId }),
    [transcriptRetention, resolvedTenantId],
  )

  const resolvedStorage = useMemo(() => {
    if (!persistConversation) return null
    if (storage) return storage
    return createStorageController({ namespace: resolvedNamespace })
  }, [persistConversation, storage, resolvedNamespace])

  const conversationStorageKey = useMemo(
    () => `${resolvedStorageKey}::${resolvedTenantId}`,
    [resolvedStorageKey, resolvedTenantId],
  )

  const persistedTranscript = useMemo(() => {
    if (!resolvedStorage || !persistConversation) {
      return { messages: null, expired: false }
    }

    const storedValue = resolvedStorage.get(conversationStorageKey, null)

    if (storedValue == null) {
      return { messages: null, expired: false }
    }

    const storedMessages = normalizeMessages(extractStoredMessages(storedValue), {
      defaultRole: 'system',
    })

    const normalizedMessages =
      retentionOptions.maxMessages && retentionOptions.maxMessages > 0
        ? applyHistoryLimit(storedMessages, retentionOptions.maxMessages)
        : storedMessages

    const updatedAt = getStoredUpdatedAt(storedValue)

    const expired = Boolean(
      retentionOptions.maxAgeMs &&
        typeof updatedAt === 'number' &&
        updatedAt > 0 &&
        Date.now() - updatedAt > retentionOptions.maxAgeMs,
    )

    return {
      messages: expired ? null : normalizedMessages,
      expired,
    }
  }, [
    conversationStorageKey,
    persistConversation,
    resolvedStorage,
    retentionOptions.maxAgeMs,
    retentionOptions.maxMessages,
  ])

  useEffect(() => {
    if (!persistConversation || !resolvedStorage) return undefined
    if (!persistedTranscript.expired) return undefined
    resolvedStorage.remove(conversationStorageKey)
    return undefined
  }, [
    conversationStorageKey,
    persistConversation,
    resolvedStorage,
    persistedTranscript.expired,
  ])

  const normalizedInitialMessages = useMemo(
    () => normalizeMessages(initialMessages, { defaultRole: 'system' }),
    [initialMessages],
  )

  const persistedMessages = persistedTranscript.messages

  const baseMessages = useMemo(() => {
    if (persistedMessages && persistedMessages.length > 0) {
      return persistedMessages
    }
    return normalizedInitialMessages
  }, [normalizedInitialMessages, persistedMessages])

  const [messages, setMessages] = useState(() => applyHistoryLimit(baseMessages, historyLimit))
  const baseMessagesRef = useRef(baseMessages)
  const historyLimitRef = useRef(historyLimit)

  useEffect(() => {
    const baseChanged = baseMessagesRef.current !== baseMessages
    const limitChanged = historyLimitRef.current !== historyLimit
    if (!baseChanged && !limitChanged) {
      return
    }
    baseMessagesRef.current = baseMessages
    historyLimitRef.current = historyLimit
    setMessages(applyHistoryLimit(baseMessages, historyLimit))
  }, [baseMessages, historyLimit])

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    if (!persistConversation || !resolvedStorage) {
      return undefined
    }

    const sanitized = sanitizeMessagesForStorage(messages)

    if (sanitized.length === 0) {
      resolvedStorage.remove(conversationStorageKey)
      return undefined
    }

    const limited =
      retentionOptions.maxMessages && retentionOptions.maxMessages > 0
        ? applyHistoryLimit(sanitized, retentionOptions.maxMessages)
        : sanitized

    resolvedStorage.set(conversationStorageKey, {
      tenantId: resolvedTenantId,
      updatedAt: Date.now(),
      messages: limited,
    })

    return undefined
  }, [
    messages,
    persistConversation,
    resolvedStorage,
    conversationStorageKey,
    retentionOptions.maxMessages,
    resolvedTenantId,
  ])

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

      const streamMode = detectStreamMode(response)

      if (streamMode) {
        const handled = await processStreamingResponse({
          response,
          mode: streamMode,
          historyLimit,
          setMessages,
          onResponse,
          payload,
          rag,
          guardrailResult,
        })

        if (!handled) {
          throw new Error('Failed to process streaming response for AI support')
        }
      } else {
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
      }
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
