# Testing Backlog

This backlog enumerates every application-facing workspace in the monorepo and captures the next test milestones so the new Vitest suite can expand consistently across packages.

## Shared component packages

| Package                                  | Current coverage                                                                                      | Follow-up tasks                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `@guidogerb/components/api-client`       | ✅ Unit tests cover configuration, token injection, retries, and error normalization.                 | Plan contract tests for new endpoints (pagination helpers, error mapping).                                |
| `@guidogerb/components/app`              | ✅ Smoke test confirms `<AppBasic />` renders while the provider stack is scaffolded.                 | Mock auth/router/api providers once the real composition replaces the placeholder implementation.         |
| `@guidogerb/components/auth`             | ✅ Provider, wrapper, and callback tests cover the core auth flow.                                    | Add integration tests with OIDC context mocks (refresh, logout) and guard assertions in consuming apps.   |
| `@guidogerb/components/menu`             | ✅ Navigation menu tests cover hierarchical rendering, active states, and custom link rendering.      | Plan keyboard/focus management suites once interactive disclosures or drawers are introduced.             |
| `@guidogerb/components/pages-public`     | _None_                                                                                                | When the public page shells are available, verify required routes render without protected context.        |
| `@guidogerb/components/pages-protected`  | ✅ Guard tests cover loading, error, and authenticated pass-through states.                           | Expand into integration suites once dashboard pages expose real data and auth-driven feature flags.       |
| `@guidogerb/components/router-public`    | _None_                                                                                                | Plan routing smoke tests to ensure the public router exposes expected paths and fallbacks.                |
| `@guidogerb/components/router-protected` | _None_                                                                                                | Add tests validating protected route guards, redirects, and breadcrumb helpers.                           |
| `@guidogerb/components/storage`          | _None_                                                                                                | Outline storage controller, cookie helper, and cache-governance tests once the placeholder is replaced.   |
| `@guidogerb/components/sw`               | ✅ Registration helpers have unit tests for load-event wiring and unregister fallbacks.               | Expand coverage to include storage-driven cache toggles and update notifications once lifecycle hooks exist. |
| `@guidogerb/components/ui`               | ✅ JsonViewer tests validate rendering, fallback handling, and custom props.                          | Add coverage for future UI widgets and a11y assertions when the component catalog grows.                  |
| `@guidogerb/css`                         | ✅ Export smoke tests ensure reset/tokens CSS entry points stay resolvable.                            | Add style snapshots to guard CSS variables once the design tokens stabilize.                              |
| `@guidogerb/footer`                      | _None_                                                                                                | Add render tests verifying link sets per tenant once the footer is implemented.                           |
| `@guidogerb/header`                      | ✅ Settings store, provider, and header tests cover context hydration, navigation wiring, and hooks. | Plan responsive/mobile interaction tests (disclosure menus, toggle wiring) once interactive behaviour ships. |

## Tenant websites

| Package                            | Current coverage                                                                                                     | Follow-up tasks                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `websites/garygerber.com`          | ✅ App-level tests cover hero content, rehearsal room wiring, and header navigation scroll handling.                 | Follow up with router-based smoke tests (newsletter form, error states) once public/protected routes are implemented. |
| `websites/guidogerbpublishing.com` | ✅ App-level tests validate the publishing hero content, portal guard wiring, and header navigation scroll handling. | Plan follow-up coverage for catalog submission flows once routes are introduced.                                      |
| `websites/picklecheeze.com`        | _None_                                                                                                               | Add snapshot/interaction tests for unique theming once components exist.                                              |
| `websites/this-is-my-story.org`    | _None_                                                                                                               | Add tests for story navigation flows and ensure 404 handling works.                                                   |
| `websites/stream4cloud.com`        | _None_                                                                                                               | Cover the landing page hero, CTA wiring, and route guards once the app shell exists.                                  |

## Cross-cutting infrastructure

- Create shared test utilities (test render wrapper, auth context factory, storage mocks) as soon as multiple packages consume the new suite.
- Decide on coverage thresholds once core packages add real logic; start by monitoring Vitest's HTML/text reports generated by `pnpm -r test`.
