# ADR 0001 – Establish architecture documentation workflow

- Status: Accepted
- Date: 2025-09-22
- Tags: documentation, knowledge-sharing

## Context

Historically, architectural changes were captured ad hoc across the
[`SPEC`](../SPEC.md) and operational notes in the
[publishing guide](../PUBLISHING.md), with additional expectations hidden in the
root [README](../../README.md). The lack of an explicit decision log made it
hard for new contributors to understand why the multi-tenant stack uses Vite,
AWS serverless services, and strict PWA requirements out of the box. The team
needs a shared place to narrate trade-offs, rejected alternatives, and follow-up
work so future updates reference the same source of truth.

## Decision

- Create a dedicated `docs/adr/` directory that houses sequentially numbered
  Architecture Decision Records (ADRs).
- Define a lightweight template covering context, decision, and consequences,
  and require that every ADR reference supporting material in the SPEC,
  publishing guide, or README when applicable.
- Cross-link the key documents so developers can move between the architecture
  overview, operational guide, and ADR index without manual searching.

## Consequences

- New decisions inherit a consistent structure and can be reviewed alongside the
  implementation changes that landed them.
- Onboarding improves because the SPEC, publishing instructions, and repository
  README now promote the ADR log as the canonical history of architectural
  choices.
- Documentation reviews can validate that updates either reference an existing
  ADR or open a new one, avoiding knowledge silos.

## Related documents

- [SPEC-1 — Creative Assets Marketplace](../SPEC.md)
- [Publishing install & deployment guide](../PUBLISHING.md)
- [Repository overview](../../README.md)
