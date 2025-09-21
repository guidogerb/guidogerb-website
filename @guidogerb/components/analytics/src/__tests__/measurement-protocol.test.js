import { describe, expect, it, vi } from 'vitest'

import {
  createMeasurementProtocolClient,
  MEASUREMENT_PROTOCOL_DEBUG_ENDPOINT,
  MEASUREMENT_PROTOCOL_ENDPOINT,
} from '../measurement-protocol.js'

const createFetchMock = () =>
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 204,
      json: async () => ({}),
    }),
  )

describe('createMeasurementProtocolClient', () => {
  it('sends events to the Measurement Protocol endpoint', async () => {
    const fetchMock = createFetchMock()
    const client = createMeasurementProtocolClient({
      measurementId: 'G-TEST123',
      apiSecret: 'secret-key',
      fetch: fetchMock,
    })

    await client.sendEvent({
      clientId: '555',
      name: 'test_event',
      params: { value: 1, ignore: undefined },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(
      `${MEASUREMENT_PROTOCOL_ENDPOINT}?measurement_id=G-TEST123&api_secret=secret-key`,
    )
    expect(options).toMatchObject({ method: 'POST' })
    expect(options.headers['content-type']).toBe('application/json')

    const body = JSON.parse(options.body)
    expect(body).toMatchObject({
      client_id: '555',
      events: [
        {
          name: 'test_event',
          params: { value: 1 },
        },
      ],
    })
  })

  it('merges default configuration, user properties, and payload overrides', async () => {
    const fetchMock = createFetchMock()
    const client = createMeasurementProtocolClient({
      measurementId: 'G-DEFAULTS',
      apiSecret: 'secret-key',
      fetch: fetchMock,
      clientId: 'default-client',
      userProperties: { plan: 'pro', locale: { value: 'en-US', setTimestampMicros: 100 } },
      nonPersonalizedAds: false,
    })

    await client.sendEvents({
      events: [
        { name: 'purchase', params: { value: 42 } },
        { params: { value: 17 } },
        { name: 'ignored_invalid', params: undefined },
      ],
      userProperties: { plan: { value: 'enterprise', setTimestampMicros: 200 }, region: 'us' },
      timestampMicros: 123456.7,
      nonPersonalizedAds: true,
    })

    const [, options] = fetchMock.mock.calls[0]
    const body = JSON.parse(options.body)

    expect(body.client_id).toBe('default-client')
    expect(body.timestamp_micros).toBe(123457)
    expect(body.non_personalized_ads).toBe(true)
    expect(body.events).toHaveLength(2)
    expect(body.events[0]).toMatchObject({ name: 'purchase' })
    expect(body.events[1]).toMatchObject({ name: 'ignored_invalid' })
    expect(body.user_properties).toMatchObject({
      locale: { value: 'en-US', set_timestamp_micros: 100 },
      plan: { value: 'enterprise', set_timestamp_micros: 200 },
      region: { value: 'us' },
    })
  })

  it('uses the debug endpoint when requested', async () => {
    const fetchMock = createFetchMock()
    const client = createMeasurementProtocolClient({
      measurementId: 'G-DEBUG',
      apiSecret: 'secret-key',
      fetch: fetchMock,
    })

    await client.sendEvents({
      debug: true,
      clientId: '555',
      events: [{ name: 'debug_event' }],
    })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe(
      `${MEASUREMENT_PROTOCOL_DEBUG_ENDPOINT}?measurement_id=G-DEBUG&api_secret=secret-key`,
    )
  })

  it('throws when required identifiers or events are missing', async () => {
    const fetchMock = createFetchMock()
    const client = createMeasurementProtocolClient({
      measurementId: 'G-ERROR',
      apiSecret: 'secret-key',
      fetch: fetchMock,
    })

    await expect(() => client.sendEvents({ events: [] })).rejects.toThrow('At least one event')
    await expect(() => client.sendEvents({ events: [{ name: 'page_view' }] })).rejects.toThrow(
      'clientId or userId',
    )
  })
})
