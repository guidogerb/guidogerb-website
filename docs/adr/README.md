# Architecture Decision Records

This directory tracks architecture decisions that complement the high-level
[SPEC](../SPEC.md), deployment runbooks in the
[publishing guide](../PUBLISHING.md), and the repository-wide overview in the
[main README](../../README.md). Each record captures the context, options, and
outcomes for choices that affect multiple packages or tenant sites.

## How we work with ADRs

1. Propose a change that impacts the shared architecture or developer
   experience.
2. Capture the motivation, considered alternatives, and final call in a new
   record file named `NNNN-short-title.md` (zero-padded sequence number).
3. Set the **Status** field to `Proposed`, `Accepted`, `Superseded`, or
   `Deprecated`. Update the record when decisions evolve.
4. Link relevant documentation (SPEC, publishing guide, READMEs) so readers can
   follow the reasoning and implementation details.
5. Submit the ADR alongside any code or documentation updates in the same PR to
   keep history cohesive.

### Suggested template

```markdown
# ADR NNNN – Title

- Status: Proposed | Accepted | Superseded | Deprecated
- Date: YYYY-MM-DD
- Tags: short, keywords

## Context
- Why the decision is needed.
- Key constraints, research, and related documents.

## Decision
- Summary of the selected approach.
- How it interacts with other systems or packages.

## Consequences
- Follow-up actions, risks, and monitoring.
- References to impacted workspaces and docs.
```

## Index

- [ADR 0001 – Establish architecture documentation workflow](0001-establish-architecture-documentation-workflow.md)
