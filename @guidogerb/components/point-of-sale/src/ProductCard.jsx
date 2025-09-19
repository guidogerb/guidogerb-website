import { useMemo } from 'react'
import { useCart } from '@guidogerb/components-shopping-cart'

const formatCurrency = (amount, currency) => {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency ?? 'USD',
    })
    return formatter.format((amount ?? 0) / 100)
  } catch (error) {
    return `$${((amount ?? 0) / 100).toFixed(2)}`
  }
}

const computeBadges = (product) => {
  const badges = new Set()
  if (product.type) badges.add(product.type)
  if (product.format) badges.add(product.format)
  if (Array.isArray(product.tags)) product.tags.forEach((tag) => badges.add(tag))
  if (Array.isArray(product.badges)) product.badges.forEach((tag) => badges.add(tag))
  return Array.from(badges)
}

export function ProductCard({ product, viewMode = 'grid', onAdd, onViewDetails, disabled }) {
  const { addItem } = useCart()
  const priceLabel = useMemo(
    () => formatCurrency(product?.price?.amount ?? 0, product?.price?.currency),
    [product?.price?.amount, product?.price?.currency],
  )

  const availability = product?.availability?.status ?? 'AVAILABLE'
  const badges = useMemo(() => computeBadges(product ?? {}), [product])

  const handleAdd = () => {
    if (!product) return
    if (onAdd) {
      onAdd(product)
      return
    }
    addItem({
      id: product.id,
      sku: product.sku,
      name: product.title ?? product.name,
      description: product.description,
      price: product.price,
      metadata: {
        productType: product.type,
        fulfillment: product.availability?.fulfillment,
      },
    })
  }

  return (
    <article
      className={`gg-pos__product-card gg-pos__product-card--${viewMode}`}
      data-product-id={product?.id}
    >
      <header className="gg-pos__product-card-header">
        <h3>{product?.title ?? product?.name}</h3>
        <span className="gg-pos__product-card-price">{priceLabel}</span>
      </header>
      {product?.subtitle && <p className="gg-pos__product-card-subtitle">{product.subtitle}</p>}
      <p className="gg-pos__product-card-description">{product?.description}</p>
      <dl className="gg-pos__product-card-meta">
        <div>
          <dt>Availability</dt>
          <dd>{availability}</dd>
        </div>
        {product?.availability?.fulfillment && (
          <div>
            <dt>Fulfillment</dt>
            <dd>{product.availability.fulfillment}</dd>
          </div>
        )}
      </dl>
      {badges.length > 0 && (
        <ul className="gg-pos__product-card-badges">
          {badges.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
      )}
      <footer className="gg-pos__product-card-actions">
        <button type="button" onClick={handleAdd} disabled={disabled}>
          Add to cart
        </button>
        {onViewDetails && (
          <button
            type="button"
            className="gg-pos__product-card-secondary"
            onClick={() => onViewDetails(product)}
          >
            View details
          </button>
        )}
      </footer>
    </article>
  )
}

ProductCard.displayName = 'PointOfSaleProductCard'
