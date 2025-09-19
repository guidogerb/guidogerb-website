# @guidogerb/components/catalog – Tasks

## Productization

- [ ] Publish responsive design tokens and reference styles for the default renderer so tenants can align catalog visuals with
      brand guidelines without rewriting markup.
- [ ] Wire the component into Storybook with knobs for GraphQL variables, mocked products, and layout toggles to accelerate
      QA and stakeholder demos.
- [ ] Ship a headless wrapper (hooks-only) that exposes the same data model for teams building bespoke UIs outside React.

## Data & GraphQL

- [ ] Extend the default GraphQL document to request structured media (thumbnails, audio previews, trailers) sized for the
      responsive breakpoints defined in design.
- [ ] Add support for GraphQL fragments so tenants can supply additional fields without re-implementing the query plumbing.
- [ ] Implement optimistic pagination that merges cache entries when the API returns overlapping cursors.
- [ ] Surface GraphQL error extensions (codes, retry hints) in the UI and analytics payloads to help diagnose catalog
      ingestion issues.

## Personalization & storage

- [ ] Introduce per-tenant storage namespaces that combine tenant ID + environment to avoid leaking preferences between
      staging and production.
- [ ] Persist recently viewed products and surface them as a dedicated fulfillment group rendered above other sections.
- [ ] Allow tenants to pre-seed storage with promotional collections (e.g., holiday bundles) fetched from CMS.

## Commerce integrations

- [ ] Trigger shopping-cart mutations (`@guidogerb/components/shopping-cart`) when a product CTA is activated and the product
      is eligible for direct purchase.
- [ ] Connect to subscription management APIs so that active subscribers see upgrade/downgrade messaging instead of a buy
      button.
- [ ] Emit analytics events through `@guidogerb/components/analytics` whenever filters, sorts, or layout preferences change.

## Testing & quality

- [ ] Snapshot the normalized product payload shape to guard against unexpected GraphQL schema regressions.
- [ ] Add contract tests ensuring the component gracefully handles partial outages (e.g., digital fulfillment returns data
      while physical fulfillment errors out).
- [ ] Implement visual regression coverage once the design system tokens ship.

## Documentation

- [ ] Document strategies for customizing the `renderProduct` prop, including examples for grid cards, list rows, and media
      previews.
- [ ] Provide a migration guide for legacy tenants transitioning from REST-based catalog endpoints to the GraphQL-driven
      component.
