# `@guidogerb/components-ui`

A shared React component package that houses the forthcoming **GuidoGerb UI Container** system. The container introduces a deterministic, breakpoint-aware shell around feature modules so that async rendering, streaming, and layout editing do not cause layout shift. The detailed functional contract lives in [`GuidoGerbUI_Container.spec.md`](./GuidoGerbUI_Container.spec.md).

> **Status:** The package currently exposes the legacy `ResponsiveSlot` implementation and a `JsonViewer` helper. The new API surface (`ResponsiveSlotProvider`, `GuidoGerbUI_Container`, and `useResponsiveSlotSize`) is being designed to meet the new specification. Track the implementation work in [`tasks.md`](./tasks.md).

## Exports overview

- Marketing site sections
  - `HeroSection`, `PlatformSection`, `DistributionSection`, `ResourcesSection`, `NewsletterSection`, `PartnerPortalSection`
- Artist site sections
  - `ProgramsHeroSection`, `ConsultingSection`, `RecordingsEducationSection`, `AboutPressSection`, `NewsletterSignupSection`, `RehearsalRoomSection`, `Welcome`
- Utilities/primitives
  - `ResponsiveSlot`, `EditModeProvider`, `useEditMode`, `JsonViewer`

## Welcome – authentication-agnostic by design

`Welcome` intentionally does not import an authentication library. Consumers provide a hook function to retrieve auth state.

Props:

- `useAuthHook: () => { isAuthenticated?: boolean; error?: any; user?: { profile?: Record<string, any> } }`
  - Typically pass `useAuth` from `@guidogerb/components-auth`.
- `rehearsalResources?: { stagePlotHref?: string; rehearsalChecklistHref?: string; productionEmailHref?: string }`
- `children?: ReactNode`

Example:

```jsx
import { Welcome } from '@guidogerb/components-ui'
import { useAuth } from '@guidogerb/components-auth'

function RehearsalCard() {
  const rehearsalResources = {
    stagePlotHref: '/files/stage-plot.pdf',
    rehearsalChecklistHref: '/files/rehearsal-checklist.pdf',
    productionEmailHref: 'mailto:hello@example.com?subject=Notes',
  }
  return <Welcome useAuthHook={useAuth} rehearsalResources={rehearsalResources} />
}
```

## PartnerPortalSection – pluggable Welcome

`PartnerPortalSection` renders a protected shell and, by default, the `Welcome` component. It accepts the same inputs so sites can control auth and resource links.

Props:

- `logoutUri: string` – forwarded to the protected wrapper.
- `useAuthHook?: Function` – passed to `Welcome`.
- `rehearsalResources?: object` – passed to `Welcome`.
- `WelcomeComponent?: ComponentType` – override the inner welcome component in tests or custom sites.

Example (website usage):

```jsx
import { PartnerPortalSection } from '@guidogerb/components-ui'
import { useAuth } from '@guidogerb/components-auth'
;<PartnerPortalSection logoutUri={import.meta.env.VITE_LOGOUT_URI} useAuthHook={useAuth} />
```

## Why this package exists

- Provide a single source of truth for layout slot sizing across GuidoGerb properties.
- Guarantee deterministic inline/block sizing during SSR, hydration, and client-side breakpoint changes.
- Offer a runtime editing experience (local drafts + GraphQL persistence) so designers can tweak slot dimensions, variants, and payloads without touching code.
- Bridge design tokens from `@guidogerb/css` into React layouts through CSS custom properties.

## Getting started (current state)

Until the new container is released, consumers can experiment with the existing primitives:

```jsx
import { ResponsiveSlotProvider, ResponsiveSlot } from '@guidogerb/components-ui'

function App() {
  return (
    <ResponsiveSlotProvider>
      <ResponsiveSlot slot="catalog.card">
        <ProductCard />
      </ResponsiveSlot>
    </ResponsiveSlotProvider>
  )
}
```

The `ResponsiveSlot` component already:

- Provides deterministic inline/block sizing across the default breakpoint set (`xs | sm | md | lg | xl`).
- Supplies base registry presets (`catalog.card`, `dashboard.panel`, `hero.banner`, `list.row`).
- Emits CSS custom properties so nested content can opt into the sizing values.
- Includes a development-only overflow warning powered by `ResizeObserver`.

However, the component still needs to be renamed, wrapped with the new editing capabilities, and migrated to the SSR-safe variable buffering defined in the spec.

## Planned API surface

Once the specification is fulfilled, the package will export:

- **`ResponsiveSlotProvider`** – merges registry extensions, exposes breakpoint descriptors, and provides the deterministic default breakpoint for SSR/SSG.
- **`GuidoGerbUI_Container`** – wraps layout regions, applies the double-buffered CSS variables, supports inheritance, overflow controls, runtime editing hooks, and persistence identifiers.
- **`useResponsiveSlotSize(slot, overrides?)`** – returns the resolved size map and the active breakpoint so child components can drive their own layout decisions.

Additional utilities (registry helpers, editing contexts, GraphQL hooks) may ship as named exports alongside the core trio. Refer to the [`GuidoGerbUI_Container.spec.md`](./GuidoGerbUI_Container.spec.md) document for the exact prop and type definitions that must be respected.

## Runtime editing & persistence (planned)

The spec requires:

- An opt-in editing mode that lets authors change per-breakpoint sizes, select component variants, and edit serialized props payloads.
- Local Storage drafts keyed by `editableId`, with reconciliation against server data and optimistic GraphQL mutations when publishing.
- A diagnostics surface that reports overflow, hydration mismatches, and sizing deltas in development builds.

These behaviors are not yet implemented—the work is tracked in [`tasks.md`](./tasks.md). Consumers should treat the API as experimental until the editing surface lands.

## Development notes

- Source files currently live under [`src/`](./src). Migration to TypeScript and a more granular folder structure is expected.
- Vitest is configured for unit testing; additional storybook/regression tooling is part of the roadmap.
- The package is marked `private` today. Publication will require the release criteria outlined in the tasks checklist.

## Contributing

1. Review the open tasks in [`tasks.md`](./tasks.md) and the detailed requirements in [`GuidoGerbUI_Container.spec.md`](./GuidoGerbUI_Container.spec.md).
2. Coordinate large changes with the core contributors so work on runtime editing, GraphQL persistence, and theming stays aligned.
3. Update the README files and tests whenever the public API or developer workflows change.
