# Responsive Slot Container — Specification

## 1. Overview

Introduce a lightweight wrapper component that pre-reserves layout real estate for every functional component rendered from
`@guidogerb/components`. The wrapper ensures that each component advertises a deterministic footprint for the current
breakpoint, preventing DOM reflow "bouncing" when the component toggles between loading/loaded/empty states. The container
is opt-in but designed to become the standard shell around cards, table regions, media panels, and widgets exposed by
`@guidogerb/components/ui`.

## 2. Goals

- Eliminate noticeable layout shifts caused by async data, suspense boundaries, or optimistic UI states.
- Provide a single source of truth for component size budgets keyed by the design-system breakpoints.
- Keep authoring friction low — wrapping should be one component import plus a `slot` name.
- Support SSR/SSG by resolving a deterministic size on the server (using default breakpoint) and hydrating seamlessly.
- Allow per-instance overrides for exceptional cases while encouraging tokenized, reusable size definitions.

## 3. Scope

### In Scope

- New public exports from `@guidogerb/components/ui`: `ResponsiveSlotProvider`, `ResponsiveSlot`, and
  `useResponsiveSlotSize`.
- Base size registry that ships with core slot presets (e.g., `card`, `panel`, `hero`, `aside`) mapped to the shared breakpoints.
- Hook + CSS utility that sets inline CSS custom properties for width/height/flex-basis based on the active breakpoint.
- Type definitions (TS in consuming apps) documenting accepted size keys and optional overrides.

### Out of Scope

- Automatic migration of existing components — adoption happens incrementally.
- Complex layout managers (e.g., masonry) beyond reserving inline/block sizes.
- Persisting runtime measurements to storage; the registry is static config evaluated at runtime.

## 4. Breakpoint Model

Adopt the following shared breakpoint tokens (aligned with Tailwind defaults + future design-system tokens):

| Token | Min Width | Media Query                  |
| ----- | --------- | ---------------------------- |
| `xs`  | `0px`     | `@media (max-width: 479px)`  |
| `sm`  | `480px`   | `@media (min-width: 480px)`  |
| `md`  | `768px`   | `@media (min-width: 768px)`  |
| `lg`  | `1024px`  | `@media (min-width: 1024px)` |
| `xl`  | `1280px`  | `@media (min-width: 1280px)` |

The provider exposes this breakpoint list so custom slots can be defined by consumers if necessary.

## 5. Public API Draft

```tsx
// ResponsiveSlotProvider.tsx
export interface SlotSizeMap {
  inline: number | string; // width/flex-basis, e.g., `320`, `"320px"`, `"min(100%, 420px)"`
  block: number | string;  // height/min-height token
  maxInline?: string;
  maxBlock?: string;
}

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type Registry = Record<string, Partial<Record<BreakpointKey, SlotSizeMap>>>;

export interface ResponsiveSlotProviderProps {
  registry?: Registry;     // merges with defaults
  defaultBreakpoint?: BreakpointKey; // SSR fallback, default `md`
  children: React.ReactNode;
}

export interface ResponsiveSlotProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements; // default `div`
  slot: string;                     // looks up registry entry
  sizes?: Partial<Record<BreakpointKey, SlotSizeMap>>; // optional per-instance override
  inherit?: boolean;                // use parent slot sizing when nesting
}
```

Usage:

```tsx
<ResponsiveSlot slot="catalog.card">
  <ProductCard product={product} />
</ResponsiveSlot>
```

`useResponsiveSlotSize(slot, overrides?)` returns `{ inline, block, maxInline, maxBlock }` so other layout primitives (e.g.,
CSS Grid wrappers) can reuse the same measurement data.

## 6. Runtime Behavior

1. `ResponsiveSlotProvider` attaches a context with the merged registry and breakpoint descriptors.
2. On the client, `useBreakpoint()` monitors `matchMedia` queries (or `react-responsive`) and emits the active key.
3. `ResponsiveSlot` combines the registry entry, optional overrides, and the active breakpoint to compute final size tokens.
4. Computed tokens become CSS custom properties on the wrapper:

   ```css
   --slot-inline-size: 24rem;
   --slot-block-size: 18rem;
   --slot-max-inline-size: min(100%, 28rem);
   --slot-max-block-size: none;
   ```

5. The rendered element receives inline styles referencing the variables:

   ```jsx
   const style = {
     '--slot-inline-size': inline,
     '--slot-block-size': block,
     '--slot-max-inline-size': maxInline ?? 'unset',
     '--slot-max-block-size': maxBlock ?? 'unset',
     inlineSize: 'var(--slot-inline-size)',
     blockSize: 'var(--slot-block-size)',
     maxInlineSize: 'var(--slot-max-inline-size)',
     maxBlockSize: 'var(--slot-max-block-size)',
     contain: 'layout paint style',
     display: 'grid',
     placeItems: 'stretch',
   } satisfies React.CSSProperties;
   ```

6. Child components render normally; because the slot has a fixed inline/block size the DOM no longer shifts when the child
   suspends, animates in, or toggles internal layout.
7. For SSR, the provider falls back to `defaultBreakpoint` so the server markup already contains a deterministic size. On
   hydration the breakpoint hook synchronizes without layout jumps by double-buffering the size variables.

## 7. Size Registry Defaults

Ship a registry (can live in `slot-presets.js`) with at least the following presets:

```ts
export const baseSlots: Registry = {
  'catalog.card': {
    xs: { inline: 'min(100%, 20rem)', block: '24rem' },
    sm: { inline: '20rem', block: '24rem' },
    md: { inline: '22rem', block: '26rem' },
    lg: { inline: '24rem', block: '26rem' },
  },
  'dashboard.panel': {
    xs: { inline: 'min(100%, 100vw)', block: '18rem' },
    md: { inline: '32rem', block: '20rem' },
    lg: { inline: '36rem', block: '22rem' },
  },
  'hero.banner': {
    xs: { inline: '100%', block: '28rem' },
    md: { inline: '100%', block: '32rem' },
    xl: { inline: '100%', block: '36rem' },
  },
  'list.row': {
    xs: { inline: '100%', block: 'auto' },
    md: { inline: '100%', block: '5rem' },
  },
};
```

The registry encourages consistent footprinting while staying extensible. Product teams can register additional slots by
passing a merged registry into the provider (e.g., via site shell or layout route modules).

## 8. Handling Dynamic Content

- **Overflow strategy** — default to `overflow: hidden auto;` with customizable prop (`overflow="visible"`). This prevents
  stray overflow while allowing vertical scroll when content exceeds the budget.
- **Measurement opt-out** — A `sizes="content"` override bypasses the registry and simply wraps children with `display: contents`
  to avoid double containment when deterministic sizing is undesirable.
- **Adaptive minimums** — Provide optional `minInline`/`minBlock` tokens when content should never collapse below a threshold
  (e.g., skeleton loaders). When defined they are applied as `minInlineSize`/`minBlockSize`.

## 9. Accessibility & Performance

- Wrapper uses `role="presentation"` unless the author overrides `role`; ensures assistive tech perceives only the child.
- Apply `contain: layout style paint;` so the browser treats the component as a layout boundary, further reducing reflow cost.
- Reuse a singleton `ResizeObserver` to optionally log or warn when children exceed allocated size (dev-only helper). This aids
  future tuning and ensures budgets are realistic.

## 10. Integration Plan

1. Implement the provider + hook in a new file `responsive-slot.jsx` and export from `@guidogerb/components/ui`.
2. Add a story/vitest snapshot verifying SSR fallback and breakpoint switching.
3. Update key UI packages to wrap components gradually (cards, dashboards, hero modules).
4. Document usage in `@guidogerb/components/README.md` and create coding guideline to always declare slot budgets for new UI.

## 11. Open Questions

- Should slot sizes live in design tokens (CSS custom properties) rather than JS objects for easier theming?
- Do we need per-tenant overrides (multi-tenant theming) at runtime, implying registry hydration from API?
- How does this approach interact with auto-layout features in design tools (Figma) — do we need translation utilities?

