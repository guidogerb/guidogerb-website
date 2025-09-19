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

export function InvoiceView({
  invoice,
  onDownload,
  onSend,
  onClose,
}) {
  if (!invoice) {
    return (
      <section className="gg-pos__invoice">
        <header>
          <h2>Invoice</h2>
        </header>
        <p>Select an invoice to view details.</p>
      </section>
    )
  }

  const items = invoice.items ?? []
  const totals = invoice.totals ?? {
    subtotal: invoice.subtotal ?? 0,
    tax: invoice.tax ?? 0,
    discount: invoice.discount ?? 0,
    total: invoice.total ?? 0,
    currency: invoice.currency ?? 'USD',
  }

  return (
    <section className="gg-pos__invoice">
      <header className="gg-pos__invoice-header">
        <div>
          <h2>Invoice #{invoice.number ?? invoice.id}</h2>
          <p>Status: {invoice.status ?? 'PAID'}</p>
          <p>Issued {formatDate(invoice.issuedAt ?? invoice.createdAt)}</p>
        </div>
        <div className="gg-pos__invoice-actions">
          {onDownload && (
            <button type="button" onClick={() => onDownload(invoice)}>
              Download PDF
            </button>
          )}
          {onSend && (
            <button type="button" onClick={() => onSend(invoice)}>
              Email invoice
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </header>
      <section className="gg-pos__invoice-customer">
        <h3>Customer</h3>
        <p>{invoice.customer?.name}</p>
        <p>{invoice.customer?.email}</p>
      </section>
      <table className="gg-pos__invoice-items">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Qty</th>
            <th scope="col">Price</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.name}</strong>
                {item.description && <p>{item.description}</p>}
              </td>
              <td>{item.quantity ?? 1}</td>
              <td>{formatMoney(item.unitPrice?.amount ?? item.price?.amount ?? 0, item.unitPrice?.currency ?? item.price?.currency ?? totals.currency)}</td>
              <td>{formatMoney(item.total?.amount ?? item.total ?? 0, item.total?.currency ?? totals.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="gg-pos__invoice-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(totals.subtotal ?? 0, totals.currency)}</dd>
        </div>
        <div>
          <dt>Discounts</dt>
          <dd>-{formatMoney(totals.discount ?? 0, totals.currency)}</dd>
        </div>
        <div>
          <dt>Tax</dt>
          <dd>{formatMoney(totals.tax ?? 0, totals.currency)}</dd>
        </div>
        <div className="gg-pos__invoice-total">
          <dt>Total</dt>
          <dd>{formatMoney(totals.total ?? 0, totals.currency)}</dd>
        </div>
      </dl>
      {invoice.notes && (
        <section className="gg-pos__invoice-notes">
          <h3>Notes</h3>
          <p>{invoice.notes}</p>
        </section>
      )}
    </section>
  )
}
