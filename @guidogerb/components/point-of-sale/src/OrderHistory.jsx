import { useMemo, useState } from 'react'

const formatMoney = (value, currency) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(value / 100)
  } catch (error) {
    return `$${(value / 100).toFixed(2)}`
  }
}

const formatDate = (value) => {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch (error) {
    return String(value)
  }
}

export function OrderHistory({
  orders = [],
  onSelectInvoice,
  onRefresh,
  isLoading = false,
  statuses = ['paid', 'pending', 'refunded', 'failed'],
  onFilterChange,
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' || order.status?.toLowerCase() === statusFilter
      const matchesSearch = search
        ? order.number?.toLowerCase().includes(search.toLowerCase()) ||
          order.customer?.email?.toLowerCase().includes(search.toLowerCase())
        : true
      return matchesStatus && matchesSearch
    })
  }, [orders, search, statusFilter])

  const handleStatusChange = (event) => {
    const value = event.target.value
    setStatusFilter(value)
    onFilterChange?.({ status: value === 'all' ? undefined : value, search })
  }

  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearch(value)
    onFilterChange?.({ status: statusFilter === 'all' ? undefined : statusFilter, search: value })
  }

  return (
    <section className="gg-pos__history">
      <header className="gg-pos__history-header">
        <h2>Order history</h2>
        <div className="gg-pos__history-controls">
          <label>
            Status
            <select value={statusFilter} onChange={handleStatusChange}>
              <option value="all">All</option>
              {statuses.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Search
            <input
              type="search"
              value={search}
              placeholder="Invoice # or email"
              onChange={handleSearchChange}
            />
          </label>
          {onRefresh && (
            <button type="button" onClick={onRefresh} disabled={isLoading}>
              Refresh
            </button>
          )}
        </div>
      </header>
      {isLoading && <p role="status">Loading orders…</p>}
      {!isLoading && filteredOrders.length === 0 && (
        <p className="gg-pos__history-empty">No orders match your filters.</p>
      )}
      {filteredOrders.length > 0 && (
        <table className="gg-pos__history-table">
          <thead>
            <tr>
              <th scope="col">Invoice</th>
              <th scope="col">Customer</th>
              <th scope="col">Status</th>
              <th scope="col">Total</th>
              <th scope="col">Date</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id ?? order.number}>
                <td>{order.number ?? order.invoiceNumber ?? order.id}</td>
                <td>{order.customer?.email ?? order.customer?.name}</td>
                <td className={`gg-pos__history-status gg-pos__history-status--${order.status?.toLowerCase()}`}>
                  {order.status ?? 'Paid'}
                </td>
                <td>{formatMoney(order.total?.amount ?? order.total ?? 0, order.total?.currency ?? order.currency ?? 'USD')}</td>
                <td>{formatDate(order.createdAt ?? order.placedAt)}</td>
                <td>
                  {onSelectInvoice && (
                    <button type="button" onClick={() => onSelectInvoice(order)}>
                      View invoice
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
