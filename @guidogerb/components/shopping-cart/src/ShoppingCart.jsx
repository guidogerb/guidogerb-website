import { Fragment, useMemo, useState } from 'react'
import { useCart } from './context/CartContext.jsx'

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

export function ShoppingCart({
  onCheckout,
  allowPromoCodes = true,
  promoPlaceholder = 'Promo code',
  readOnly = false,
}) {
  const { items, totals, updateQuantity, removeItem, clearCart, applyPromoCode } = useCart()

  const lineItemCount = useMemo(
    () =>
      items.reduce(
        (count, item) =>
          count + 1 + (Array.isArray(item.bundleItems) ? item.bundleItems.length : 0),
        0,
      ),
    [items],
  )

  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState(null)

  const handleApplyPromo = (event) => {
    event.preventDefault()
    if (!promoInput) {
      setPromoError('Enter a promo code to apply.')
      return
    }
    applyPromoCode(promoInput.trim().toUpperCase())
    setPromoInput('')
    setPromoError(null)
  }

  return (
    <section className="gg-pos__cart">
      <header className="gg-pos__cart-header">
        <h2>Cart</h2>
        <span>{lineItemCount} items</span>
      </header>
      {items.length === 0 && <p className="gg-pos__cart-empty">Your cart is empty.</p>}
      <ol className="gg-pos__cart-items">
        {items.map((item) => {
          const bundleItems = Array.isArray(item.bundleItems) ? item.bundleItems : []
          return (
            <li key={item.lineId ?? item.id} className="gg-pos__cart-item">
              <div>
                <h3>
                  {item.name}
                  {item.isBundle ? <span className="gg-pos__cart-item-bundle"> Bundle</span> : null}
                </h3>
                {item.description && <p>{item.description}</p>}
                <p className="gg-pos__cart-item-price">
                  {formatMoney(item.price.amount, item.price.currency)} each
                </p>
                {bundleItems.length > 0 ? (
                  <ol className="gg-pos__cart-bundle-items">
                    {bundleItems.map((bundleItem) => {
                      const totalQuantity = bundleItem.quantity * item.quantity
                      return (
                        <li
                          key={bundleItem.lineId ?? bundleItem.id}
                          className="gg-pos__cart-bundle-item"
                        >
                          <div>
                            <h4>{bundleItem.name}</h4>
                            {bundleItem.description && <p>{bundleItem.description}</p>}
                            <p className="gg-pos__cart-bundle-item-quantity">Qty {totalQuantity}</p>
                          </div>
                          <div className="gg-pos__cart-bundle-item-price">
                            {formatMoney(bundleItem.price.amount, bundleItem.price.currency)}
                            {bundleItem.includeInTotals === false ? (
                              <Fragment>
                                <span aria-hidden="true"> · </span>
                                <span className="gg-pos__cart-bundle-item-included">
                                  Included in bundle
                                </span>
                              </Fragment>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                ) : null}
              </div>
              <div className="gg-pos__cart-item-controls">
                <label>
                  Qty
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                    disabled={readOnly}
                  />
                </label>
                <button type="button" onClick={() => removeItem(item.id)} disabled={readOnly}>
                  Remove
                </button>
              </div>
            </li>
          )
        })}
      </ol>
      <footer className="gg-pos__cart-summary">
        {allowPromoCodes && (
          <form className="gg-pos__cart-promo" onSubmit={handleApplyPromo}>
            <label htmlFor="gg-pos__promo-code">Promo code</label>
            <div className="gg-pos__cart-promo-input">
              <input
                id="gg-pos__promo-code"
                type="text"
                value={promoInput}
                placeholder={promoPlaceholder}
                onChange={(event) => setPromoInput(event.target.value)}
                disabled={readOnly}
              />
              <button type="submit" disabled={readOnly}>
                Apply
              </button>
            </div>
            {promoError && <p role="alert">{promoError}</p>}
          </form>
        )}
        <dl className="gg-pos__cart-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatMoney(totals.subtotal, totals.currency)}</dd>
          </div>
          <div>
            <dt>Discounts</dt>
            <dd>-{formatMoney(totals.discount, totals.currency)}</dd>
          </div>
          <div>
            <dt>Tax</dt>
            <dd>{formatMoney(totals.tax, totals.currency)}</dd>
          </div>
          {totals.shipping > 0 && (
            <div>
              <dt>Shipping</dt>
              <dd>{formatMoney(totals.shipping, totals.currency)}</dd>
            </div>
          )}
          <div className="gg-pos__cart-total">
            <dt>Total</dt>
            <dd>{formatMoney(totals.total, totals.currency)}</dd>
          </div>
        </dl>
        <div className="gg-pos__cart-actions">
          <button type="button" onClick={clearCart} disabled={readOnly || items.length === 0}>
            Clear cart
          </button>
          {onCheckout && (
            <button type="button" onClick={onCheckout} disabled={readOnly || items.length === 0}>
              Proceed to checkout
            </button>
          )}
        </div>
      </footer>
    </section>
  )
}
