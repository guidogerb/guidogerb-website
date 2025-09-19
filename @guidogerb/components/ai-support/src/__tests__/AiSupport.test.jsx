import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { AiSupport } from '../AiSupport.jsx'

describe('AiSupport', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals?.()
  })

  it('submits an OpenAI-compatible payload with user context and RAG messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { role: 'assistant', content: 'Here is the information you requested.' },
          },
        ],
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const guardrail = vi.fn().mockResolvedValue({ allow: true })
    const embeddingRetriever = vi.fn().mockResolvedValue({
      messages: [
        { role: 'system', content: 'Document excerpt A' },
        'Document excerpt B',
      ],
      metadata: { chunkCount: 2 },
    })

    render(
      <AiSupport
        endpoint="/api/ai/support"
        model="gpt-test"
        userContext={{ userId: 'user-123', locale: 'en-US' }}
        historyLimit={4}
        initialMessages={[{ role: 'system', content: 'You are a helpful assistant.' }]}
        guardrail={guardrail}
        embeddingRetriever={embeddingRetriever}
      />,
    )

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'I need help resetting my password.' },
    })

    fireEvent.submit(screen.getByTestId('ai-support-form'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    expect(guardrail).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'I need help resetting my password.',
        userContext: { userId: 'user-123', locale: 'en-US' },
      }),
    )

    expect(embeddingRetriever).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'I need help resetting my password.',
        userContext: { userId: 'user-123', locale: 'en-US' },
      }),
    )

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/ai/support')

    expect(options).toMatchObject({
      method: 'POST',
    })
    expect(options.headers['Content-Type']).toBe('application/json')

    const payload = JSON.parse(options.body)
    expect(payload).toMatchObject({
      model: 'gpt-test',
      temperature: 0.2,
      top_p: 1,
      user: 'user-123',
    })

    expect(payload.messages).toHaveLength(5)
    expect(payload.messages[0].role).toBe('system')
    expect(payload.messages[0].content).toContain('User context')
    expect(payload.messages[0].content).toContain('user-123')
    expect(payload.messages[1]).toMatchObject({ role: 'system', content: 'Document excerpt A' })
    expect(payload.messages[2]).toMatchObject({ role: 'system', content: 'Document excerpt B' })
    expect(payload.messages[3]).toMatchObject({ role: 'system', content: 'You are a helpful assistant.' })
    expect(payload.messages[4]).toMatchObject({
      role: 'user',
      content: 'I need help resetting my password.',
    })

    await waitFor(() => {
      expect(screen.getByText('Here is the information you requested.')).toBeInTheDocument()
    })
  })

  it('prevents submission when the guardrail rejects the prompt', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const guardrail = vi.fn().mockResolvedValue({ allow: false, reason: 'PII detected' })

    render(<AiSupport endpoint="/api/ai/support" guardrail={guardrail} />)

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'My SSN is 123-45-6789' },
    })

    fireEvent.submit(screen.getByTestId('ai-support-form'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('PII detected')
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('trims chat history to the configured limit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { role: 'assistant', content: 'Second answer.' },
          },
        ],
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <AiSupport
        endpoint="/api/ai/support"
        historyLimit={3}
        initialMessages={[
          { role: 'system', content: 'System instructions' },
          { role: 'user', content: 'First question?' },
          { role: 'assistant', content: 'First answer.' },
        ]}
      />,
    )

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Second question?' },
    })

    fireEvent.submit(screen.getByTestId('ai-support-form'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByText('Second answer.')).toBeInTheDocument()
    })

    const renderedMessages = screen.getAllByTestId('ai-support-message')
    expect(renderedMessages).toHaveLength(3)
    expect(renderedMessages[0]).toHaveTextContent('system')
    expect(renderedMessages.map((node) => node.textContent).join(' ')).not.toContain('First question?')
  })
})
