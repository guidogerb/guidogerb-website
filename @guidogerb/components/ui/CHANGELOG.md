# Changelog

All notable changes to `@guidogerb/components-ui` will be documented in this file.

## 0.0.2 - 2025-09-21

- Feature: Exported marketing sections from package root: `HeroSection`, `PlatformSection`, `DistributionSection`, `ResourcesSection`, `NewsletterSection`, `PartnerPortalSection`.
- Feature: Artist site exports (unchanged, now documented): `ProgramsHeroSection`, `ConsultingSection`, `RecordingsEducationSection`, `AboutPressSection`, `NewsletterSignupSection`, `RehearsalRoomSection`, `Welcome`.
- API: `Welcome` no longer imports auth or site resources; accepts `useAuthHook` and `rehearsalResources` props instead.
- API: `PartnerPortalSection` accepts `useAuthHook`, `rehearsalResources`, and an overridable `WelcomeComponent` prop for testing/customization.
- Docs: README updated with exports overview and examples for `Welcome` and `PartnerPortalSection`.
- Chore: Removed unused dependency on `@guidogerb/components-auth` (consumers should pass `useAuthHook`).
- Fix: Corrected `PartnerPortalSection` import path for `Welcome` to prevent Rollup/Vite build resolution errors.

## 0.0.1 - Initial

- Initial private package with `ResponsiveSlot`, `EditModeProvider`, `useEditMode`, and `JsonViewer`.
