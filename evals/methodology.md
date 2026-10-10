# Evaluation methodology

This directory contains a small sample for communicating the shape of the evaluation contract. It is intentionally not presented as a production accuracy claim.

## Current sample

- 3 manually reviewed cases
- Input types: birthday, minimal portrait, and complex couple references
- Metrics: expected/detected objects, inventory matches, missing items, review mode, and internal latency profile

## Formal benchmark still in progress

The formal evaluation will publish:

1. Dataset version and annotation rules.
2. Object detection precision and recall.
3. Inventory matching top-1 and top-3 accuracy.
4. BOM field-level accuracy.
5. AUTO / ASSIST / HUMAN escalation rate.
6. p50 and p95 end-to-end latency.
7. Cost per analyzed reference.

No customer RAW images are included in this repository.
