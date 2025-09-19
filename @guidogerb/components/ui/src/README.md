# Source Layout – `@guidogerb/components-ui`

This directory contains the implementation code for the GuidoGerb UI component library. It will transition from the existing `ResponsiveSlot` proof of concept into the fully featured `GuidoGerbUI_Container` described in [`../GuidoGerbUI_Container.spec.md`](../GuidoGerbUI_Container.spec.md).

## Current modules

- [`ResponsiveSlot/ResponsiveSlot.jsx`](./ResponsiveSlot/ResponsiveSlot.jsx) – legacy slot wrapper that provides breakpoint-aware sizing, inheritance, and development overflow warnings.
- [`JsonViewer/JsonViewer.jsx`](./JsonViewer/JsonViewer.jsx) – utility component used for inspecting JSON payloads during development.

## Migration notes

1. **TypeScript conversion** – the spec demands precise typings for breakpoints, size maps, and container props. Plan to migrate the React sources to `.tsx` files or add a colocated type declaration module.
2. **GuidoGerb UI Container wrapper** – rename and extend `ResponsiveSlot.jsx` so that it:
   - Implements the double-buffered CSS variable strategy for SSR hydration stability.
   - Accepts editing props (`editableId`, `variant`, `propsJSON`) and wires them to the editing/persistence contexts.
   - Surfaces resolved sizes to descendants through `SlotInstanceContext` (or its successor) for inheritance.
3. **Provider & hooks** – the context exposed by `ResponsiveSlotProvider` must include breakpoint descriptors, registries, and editing state hooks so the rest of the app can coordinate around the container system.
4. **Runtime editing services** – introduce new modules under `./editing/` (or similar) that encapsulate Local Storage persistence, GraphQL mutations, optimistic updates, and reconciliation helpers.
5. **Theming bridge** – add a module that listens to `@guidogerb/css` token updates and notifies containers to recompute their CSS variables without remounting children.
6. **Testing harness** – colocate Vitest suites (unit + integration) alongside the modules they exercise. Snapshot SSR/hydration behavior to prevent regressions.

## Working agreements

- Keep this README in sync with the directory structure as new modules (editing, persistence, theming, diagnostics) are introduced.
- Update [`../README.md`](../README.md) and [`../tasks.md`](../tasks.md) whenever the exported API or development workflow changes.
- Prefer small, focused pull requests when introducing runtime editing or persistence features so they can be reviewed in isolation.
