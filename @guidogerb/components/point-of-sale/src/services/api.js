const toQuery = (params = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((entry) => searchParams.append(key, entry))
    } else if (typeof value === 'object') {
      searchParams.append(key, JSON.stringify(value))
    } else {
      searchParams.append(key, value)
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const resolveBaseUrl = (baseUrl) => {
  if (!baseUrl) return null
  try {
    return new URL(baseUrl, 'http://localhost').toString()
  } catch (error) {
    return baseUrl
  }
}

const createFetchClient = (baseUrl) => {
  if (!baseUrl) return null
  const resolvedBaseUrl = resolveBaseUrl(baseUrl)

  const request = async (path, { method = 'GET', body, headers = {}, search } = {}) => {
    const url = new URL(path, resolvedBaseUrl)
    if (search) {
      const searchParams = new URLSearchParams(search)
      searchParams.forEach((value, key) => {
        url.searchParams.append(key, value)
      })
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`)
      error.status = response.status
      error.body = await response.text().catch(() => null)
      throw error
    }

    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json()
    }

    return response.text()
  }

  return {
    get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
    patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
  }
}

export function createPOSApi({ baseUrl, client } = {}) {
  const resolvedClient = client ?? createFetchClient(baseUrl)
  if (!resolvedClient) {
    throw new Error('createPOSApi requires either a client or baseUrl')
  }

  const listProducts = async ({ userId, search, filters } = {}) => {
    const response = await resolvedClient.get(
      `/pos/products${toQuery({ userId, search, ...filters })}`,
    )
    return Array.isArray(response?.products) ? response.products : response
  }

  const createPaymentIntent = async ({
    amount,
    currency,
    cart,
    customerId,
    metadata,
  }) => {
    return resolvedClient.post('/pos/payments/intents', {
      amount,
      currency,
      cart,
      customerId,
      metadata,
    })
  }

  const createInvoice = async ({ cart, paymentIntent, user, metadata }) => {
    return resolvedClient.post('/pos/invoices', {
      cart,
      paymentIntent,
      user,
      metadata,
    })
  }

  const listInvoices = async ({ userId, status } = {}) => {
    const response = await resolvedClient.get(
      `/pos/invoices${toQuery({ userId, status })}`,
    )
    return Array.isArray(response?.invoices) ? response.invoices : response
  }

  const listOrders = async ({ userId, pagination, status, search } = {}) => {
    const response = await resolvedClient.get(
      `/pos/orders${toQuery({ userId, status, search, ...pagination })}`,
    )
    return Array.isArray(response?.orders) ? response.orders : response
  }

  const recordOrder = async ({ invoice, paymentIntent, cart, user }) => {
    return resolvedClient.post('/pos/orders', {
      invoice,
      paymentIntent,
      cart,
      user,
    })
  }

  const updateCustomer = async ({ user }) => {
    return resolvedClient.patch('/pos/customers', { user })
  }

  return {
    listProducts,
    createPaymentIntent,
    createInvoice,
    listInvoices,
    listOrders,
    recordOrder,
    updateCustomer,
  }
}
