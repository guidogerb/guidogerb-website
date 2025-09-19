import { InvoiceView } from '../InvoiceView.jsx'

export function InvoicePage({ invoice, renderInvoice, onBack, onHistory }) {
  const content = renderInvoice ? renderInvoice(invoice) : <InvoiceView invoice={invoice} />
  return (
    <div className="gg-pos__page gg-pos__page--invoice">
      <header className="gg-pos__page-header">
        <h1>Invoice</h1>
        <nav aria-label="Invoice navigation">
          <ul>
            <li>
              <button type="button" onClick={onBack}>
                Back to POS
              </button>
            </li>
            <li>
              <button type="button" onClick={onHistory}>
                Order history
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <main className="gg-pos__page-content gg-pos__page-content--single">{content}</main>
    </div>
  )
}
