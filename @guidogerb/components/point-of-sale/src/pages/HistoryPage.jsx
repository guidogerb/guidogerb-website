import { OrderHistory } from '../OrderHistory.jsx'

export function HistoryPage({ orders, renderHistory, onBack }) {
  const content = renderHistory ? renderHistory(orders) : <OrderHistory orders={orders} />
  return (
    <div className="gg-pos__page gg-pos__page--history">
      <header className="gg-pos__page-header">
        <h1>Order history</h1>
        <button type="button" onClick={onBack}>
          Back to POS
        </button>
      </header>
      <main className="gg-pos__page-content gg-pos__page-content--single">{content}</main>
    </div>
  )
}
