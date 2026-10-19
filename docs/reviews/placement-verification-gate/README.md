# Placement graph gate review

Task: `placement-verification-gate` ([#101](https://github.com/daveyboyc/villacana-venture/issues/101)).
This changes evidence tooling and the photo reference card, with no geometry,
sprite, collision, material or registry coordinate changes.

## Problem and resulting checks

Previously, a single `matches` record could dominate incomplete/non-comparable
photo coverage. The reference graph included only cited features and had dangling
`looks-at` edges. Neither citations nor task completion measured placement. The
Barraka sign's estimated centre could therefore appear well supported without a
measured comparison of that coordinate.

The graph now includes all 357 shared model features with unique namespaced IDs.
Placement status is separate from photographic diagnostics and software results.
Only a current measured packet with independent source-review attestation can
produce `placement-verified-by`. It binds source/model/context/artifact hashes,
one global registration, three controls, two held-out landmarks, measurements of
all represented points and stated metre tolerance including uncertainty.

Open discrepancies override positives. A resolution requires a current approved
same-feature packet explicitly naming the report. A later match, unrelated
approval or task closure cannot remove it. New geometry task completion and PR
geometry changes are gated. See [the policy](../../PLACEMENT_VERIFICATION.md) for
format, commands, enforcement boundaries and remaining limitations.

## Actual evidence status

- 172 references remain discoverable. Content/area tags are separate from model
  approval; thumbnails and GPS pins do not establish subject coordinates.
- 355 model features have no complete measured placement packet in the new system.
  This preserves earlier manual reviews and does not mean all those placements
  are wrong or were never reviewed.
- Two features are disputed: the user-reported Barraka planter and an existing
  middle-pool south gate photographic disagreement. No real placement approvals
  were invented to demonstrate the policy; positive approvals exist only in
  explicitly synthetic unit-test fixtures.
- [Barraka report](barraka-planter.md): inspected public IMG_2346/2347, private
  contact sheet and georeferenced Esri aerial during this conversation. These
  establish visible object identity/order; the replacement coordinate remains
  unmeasured. Follow-up [#102](https://github.com/daveyboyc/villacana-venture/issues/102).
  This tooling task does not perform a fresh whole-site Google alignment audit.

## Review limits

The validator checks records, hashes and arithmetic. It cannot tell whether an
author measured the correct pixels or whether a claimed reviewer actually
inspected them. The independent reviewer must inspect actual maps/full photos and
the current render, rather than accepting implementation or tests as evidence.
Private sources require immutable revisions; CI does not fetch their pixels.
GitHub branch protection is not configured by this change.

Placement approval is scoped to represented horizontal points and stated
tolerance, not every dimension, concealed boundary, height, material or calibrated
photographic match. Point/axis-only inventory features need separate dimension
assessment in their comparison report. Shared inputs invalidate packets
conservatively; feature removal currently fails closed pending reviewed retirement
support. Existing details and sprites are retained.

[Validation outcomes](validation.md) and a public-safe [graph excerpt](graph-status.json)
record the policy behavior and current evidence state. [The UI example](planter-warning.png) and [copied agent reference](agent-reference.txt)
show the dispute reaching the actual map card and agent handoff. This is a
discrepancy warning, not an alignment comparison or placement approval.
