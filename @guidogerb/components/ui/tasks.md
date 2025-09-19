# GuidoGerb UI Container – Implementation Tasks

The [`GuidoGerbUI_Container` specification](./GuidoGerbUI_Container.spec.md) introduces a deterministic, breakpoint-aware layout shell with runtime editing and persistence. The current codebase still exposes the legacy `ResponsiveSlot` component and lacks most of the new capabilities. The checklist below captures the work required to ship the new contract.

## Must Have

### Core API & Contracts
- [ ] Rename the public surface from `ResponsiveSlot` to `GuidoGerbUI_Container`, keeping backwards compatibility shims only if strictly necessary.
- [ ] Update `index.js`, `package.json#files`, and consumer documentation to export exactly `{ ResponsiveSlotProvider, GuidoGerbUI_Container, useResponsiveSlotSize }` alongside any deliberate auxiliary utilities.
- [ ] Promote the slot registry primitives to first-class exports (types + helpers) so downstream apps can compose registry extensions in a typed way.

### Breakpoints & Size Resolution
- [ ] Refactor `ResponsiveSlotProvider` so the exposed context includes `{ breakpoints, defaultBreakpoint, activeBreakpoint, registry }` exactly as described in the spec (with immutable descriptors for SSR usage).
- [ ] Implement the double-buffered CSS variable strategy (`--slot-inline-A/B`) to guarantee hydration stability and eliminate flash on breakpoint reconciliation.
- [ ] Extend `useResponsiveSlotSize` to return `{ inline, block, maxInline, maxBlock, minInline, minBlock, breakpoint }`, always populated with resolved values.
- [ ] Ensure inheritance (`inherit` prop) reads parent budgets even across nested `GuidoGerbUI_Container` instances rendered during SSR.

### Runtime Editing & Persistence
- [ ] Introduce an opt-in editing mode provider/context that tracks the currently editable slot instance and exposes editing APIs (update size overrides, variant, and JSON props payload).
- [ ] Build an editing UI layer (even a headless state module for now) capable of mutating `sizes`, `variant`, and `propsJSON` per breakpoint, aligned with the GraphQL schema referenced in the spec.
- [ ] Persist drafts to Local Storage immediately with namespaced keys derived from `editableId`, including reconciliation logic that merges unsynced drafts with server state on boot.
- [ ] Implement a TanStack Query mutation (or equivalent abstraction) that upserts instance edits via the planned `upsertSlotInstance` GraphQL mutation and exposes optimistic updates.

### Accessibility & Overflow Handling
- [ ] Keep the wrapper `role="presentation"` by default while allowing overrides, and document the accessibility expectations for children.
- [ ] Expand the overflow diagnostics to surface structured warnings (e.g., console group with budgets, observed sizes, and breakpoints) only in development.
- [ ] Document the default overflow strategy (`overflow="hidden auto"`) and ensure the prop accepts the broader CSS overflow shorthand described in the spec.

### TypeScript & Tooling
- [ ] Migrate the source to TypeScript (or add `.d.ts` definitions) implementing the type signatures outlined in the spec, including `BreakpointKey`, `SlotSizeMap`, `Registry`, and prop interfaces.
- [ ] Add unit tests (Vitest) verifying size resolution across breakpoints, inheritance fallback behavior, and SSR hydration stability (can be DOM snapshot tests).
- [ ] Add integration tests or stories that exercise the editing mode, Local Storage reconciliation, and GraphQL optimistic updates (can be stubbed during the first iteration).

## Should Have

### Advanced Sizing & Theming
- [ ] Support `minInline`/`minBlock` safeguards in the resolution algorithm to prevent collapsing skeletons.
- [ ] Wire a theme bridge that listens for token updates from `@guidogerb/css` (e.g., via an event emitter) and recomputes slot CSS variables without remounting children.
- [ ] Implement a runtime mode that allows descendants to request `inherit` sizing dynamically (for nested grids or layout fragments).

### Developer Experience
- [ ] Add Storybook stories demonstrating the base presets, editing workflows, and SSR hydration scenarios.
- [ ] Generate GraphQL typings via codegen for the `upsertSlotInstance` mutation and related queries.
- [ ] Provide a diagnostics panel (dev-only) that aggregates overflow counts, hydration mismatches, and slot budget deltas.

## Could Have / Future Enhancements
- [ ] Enable per-tenant registry layering so multiple design systems can extend the base presets at runtime.
- [ ] Explore container query–driven presets with feature detection to fall back to breakpoint logic where unsupported.
- [ ] Ship a codemod to wrap existing layout components with `GuidoGerbUI_Container` incrementally.
- [ ] Investigate Figma token import/export tooling to translate design file slot definitions into registry entries.

## Documentation & Release Readiness
- [ ] Keep the package README and src-level docs synchronized with the evolving API and editing workflows.
- [ ] Define migration guidance for teams currently consuming `ResponsiveSlot`.
- [ ] Establish release criteria (tests passing, documentation updated, Storybook snapshots) before publishing a non-private version of the package.
