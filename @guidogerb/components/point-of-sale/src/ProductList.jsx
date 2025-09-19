import { useCallback, useEffect, useMemo, useState } from 'react'
import { Catalog } from '@guidogerb/components-catalog'
import { useCart } from '@guidogerb/components-shopping-cart'
import { ProductCard } from './ProductCard.jsx'

export function ProductList({
  products = [],
  isLoading = false,
  error = null,
  onRefresh,
  onProductSelect,
  catalog,
  emptyState = 'No products available.',
}) {
  const { addItem } = useCart()
  const [localProducts, setLocalProducts] = useState(products)

  useEffect(() => {
    setLocalProducts(products)
  }, [products])

  const handleSelect = useCallback(
    (product) => {
      addItem(product)
      onProductSelect?.(product)
    },
    [addItem, onProductSelect],
  )

  const renderCatalogProduct = useCallback(
    ({ product, onSelect, viewMode }) => (
      <ProductCard
        product={product}
        viewMode={viewMode}
        onAdd={(item) => {
          handleSelect(item)
          onSelect?.(item)
        }}
        onViewDetails={catalog?.onViewDetails}
      />
    ),
    [catalog?.onViewDetails, handleSelect],
  )

  if (catalog) {
    return (
      <Catalog
        {...catalog}
        onProductSelect={handleSelect}
        renderProduct={catalog.renderProduct ?? renderCatalogProduct}
      />
    )
  }

  const sections = useMemo(() => {
    const byCategory = new Map()
    localProducts.forEach((product) => {
      const key = product.availability?.fulfillment ?? 'GENERAL'
      if (!byCategory.has(key)) {
        byCategory.set(key, [])
      }
      byCategory.get(key).push(product)
    })
    return Array.from(byCategory.entries())
  }, [localProducts])

  return (
    <div className="gg-pos__product-list">
      <header className="gg-pos__product-list-header">
        <h2>Catalog</h2>
        <div className="gg-pos__product-list-actions">
          {onRefresh && (
            <button type="button" onClick={onRefresh} disabled={isLoading}>
              Refresh
            </button>
          )}
        </div>
      </header>
      {isLoading && <p role="status">Loading products…</p>}
      {error && (
        <div role="alert" className="gg-pos__product-list-error">
          <p>{error.message ?? String(error)}</p>
          {onRefresh && (
            <button type="button" onClick={onRefresh}>
              Retry
            </button>
          )}
        </div>
      )}
      {!isLoading && !error && sections.length === 0 && (
        <p className="gg-pos__product-list-empty">{emptyState}</p>
      )}
      {sections.map(([section, items]) => (
        <section key={section} className="gg-pos__product-section">
          <h3>{section}</h3>
          <div className="gg-pos__product-grid">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={() => handleSelect(product)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
