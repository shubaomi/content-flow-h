# Execution Feedback Export Requirements

## Objective

Make ContentFlow execution choices visible to the ecosystem without turning ContentFlow into a strategy or reminder system.

## Requirements

1. Export active videos with enough metadata for Psychelog to know what is already accepted, in review, filming, editing, published, skipped, or archived.
2. Preserve import markers and original packet dates in exported state.
3. Export cover readiness and platform status where available.
4. Keep import idempotent and avoid overwriting daily state through the automatic local workflow.

## Acceptance

- Existing `vault:import-packet` still works.
- Existing export script still writes `state/contentflow-active.json`.
- Psychelog can infer selection memory from exported state.
