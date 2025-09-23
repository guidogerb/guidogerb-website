export function MarketplacePreviewSection() {
  return (
    <section className="market" id="market">
      <div>
        <h2>Marketplace preview</h2>
        <p>
          Subscribe for early access to market drops featuring cult-favorite jars, cheeze kits,
          pantry toppers, and pairing bundles curated with local makers.
        </p>
      </div>
      <ul className="market-items" aria-label="Marketplace teasers">
        <li>
          <h3>Golden hour pickle flight</h3>
          <p>Charred pineapple kimchi, turmeric daikon, and smoked carrot coins</p>
        </li>
        <li>
          <h3>Cellar cheeze duo</h3>
          <p>Koji-washed bloom rind and ash-aged basil wheels</p>
        </li>
        <li>
          <h3>Brine pantry kit</h3>
          <p>House crackers, pickled mustard seeds, and rhubarb shrub concentrate</p>
        </li>
      </ul>
    </section>
  )
}
