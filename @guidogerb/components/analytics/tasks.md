# Analytics Component Task Board

This board tracks the scope and future work for the Google Analytics integration component. Checklist items with a check mark are covered by the current implementation; unchecked items describe follow-up enhancements.

## ✅ Current Feature Set

- [x] Auto-inject the Google Analytics 4 tag script without requiring manual script tags.
- [x] Provide a React context and `useAnalytics` hook for events, page views, and consent updates.
- [x] Support debug mode, initial event dispatch, and configurable consent defaults.
- [x] Document Google Analytics account setup, measurement ID management, and framework wiring guidance.
- [x] Add Vitest coverage validating script injection, configuration merging, and context helpers.

## 🚧 Near-term Enhancements

- [ ] Offer first-class helpers for ecommerce/event presets (e.g., purchases, refunds).
- [ ] Add router-aware utilities to automatically fire page views on SPA navigation.
- [ ] Surface TypeScript definitions once the workspace adopts TS sources.
- [ ] Ship Storybook/Playroom examples demonstrating integration patterns.

## 📋 Operational Follow-ups

- [ ] Document analytics-specific environment variables per tenant website.
- [ ] Create integration tests that exercise analytics in a running Vite application shell.
- [ ] Evaluate server-side tracking or Measurement Protocol fallbacks for non-JS environments.

Refer back to this list when planning incremental improvements or onboarding new contributors to the analytics package.
