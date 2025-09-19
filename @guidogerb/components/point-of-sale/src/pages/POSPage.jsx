export function POSPage({
  productList,
  cart,
  checkout,
  userProfile,
  onViewHistory,
  onViewInvoices,
  onViewProfile,
}) {
  return (
    <div className="gg-pos__page gg-pos__page--pos">
      <header className="gg-pos__page-header">
        <h1>Point of Sale</h1>
        <nav aria-label="POS navigation">
          <ul>
            <li>
              <button type="button" onClick={onViewHistory}>
                Order history
              </button>
            </li>
            <li>
              <button type="button" onClick={onViewInvoices}>
                Invoices
              </button>
            </li>
            <li>
              <button type="button" onClick={onViewProfile}>
                Profile
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <main className="gg-pos__page-content">
        <section className="gg-pos__page-catalog" aria-labelledby="gg-pos__catalog-heading">
          <h2 id="gg-pos__catalog-heading" className="sr-only">
            Catalog
          </h2>
          {productList}
        </section>
        <section className="gg-pos__page-cart" aria-labelledby="gg-pos__cart-heading">
          <h2 id="gg-pos__cart-heading" className="sr-only">
            Cart
          </h2>
          {cart}
        </section>
        <section className="gg-pos__page-checkout" aria-labelledby="gg-pos__checkout-heading">
          <h2 id="gg-pos__checkout-heading" className="sr-only">
            Checkout
          </h2>
          {checkout}
        </section>
        <aside className="gg-pos__page-profile" aria-labelledby="gg-pos__profile-heading">
          <h2 id="gg-pos__profile-heading" className="sr-only">
            Profile
          </h2>
          {userProfile}
        </aside>
      </main>
    </div>
  )
}
