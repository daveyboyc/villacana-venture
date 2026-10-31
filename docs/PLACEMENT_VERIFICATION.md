# Placement evidence and the reference graph

`cites` means a source was used. `checked-against` records a render/photo diagnostic.
Only `placement-verified-by` records an approved horizontal placement within a
declared tolerance. None of these establishes the accuracy of an entire area.

The graph includes every model feature from the shared map inventory, including
features with no photo citations. IDs are `model:<feature ID>`; `featureId` retains
the data/registry ID used by tasks and checks. All edge endpoints must exist.
`public/reference-index.json`, area briefs, the map's copyable agent reference and
`scripts/find_reference.py` expose placement states and blockers.

## States and scope

| Placement state | Meaning |
| --- | --- |
| `unreviewed` | No complete measured packet and independent approval in this system. Earlier manual reviews may exist. |
| `incomplete` | A packet exists but lacks required evidence or approval. |
| `stale` | Model, renderer context, source or artifact bytes differ from the approved snapshot. |
| `disputed` | An unresolved discrepancy exists; this overrides positive comparisons. |
| `verified` | Current packet, measured placement within its stated tolerance and independent source-review attestation; no open discrepancies. |

`photoVerification` retains `matches`, `differs`, `incomplete`, `unchecked` or
`not-comparable` separately. One matching photo cannot hide a missing comparison
or a non-comparable source. A recorded `differs` creates a discrepancy even if a
later check says `matches`. Historical checks and earlier manual reviews remain.

Placement approval covers the represented horizontal points, not hidden property
boundaries, heights, materials, calibration or every rendered detail. For features
represented only by a centre or axis, this alone does not measure their width or
size: the comparison report and independent reviewer must assess those separately.
Do not call an estimated-camera comparison a calibrated photographic match.

## Before changing geometry

1. Read the area brief and private contact sheet. Inspect each relevant source at
   full size. Identify the subject from content; GPS locates the camera. Record
   blur, cropping, obstruction, uncertain identification and what each source can
   and cannot establish. Add relevant sources to the feature's evidence.
2. Establish the common frame: `map-metres-east-south`, +x east and +z south.
   Register identifiable ground landmarks across the area using one global
   transform. Reserve independent landmarks for validation. Distinguish ground
   walls from projecting roofs/balconies; separate registration residuals from
   actual model discrepancies. Never warp images locally to hide disagreements.
3. Save a labelled footprint/path/pool overlay and a source-versus-current-render
   comparison. Record feature IDs, observed differences, metre estimates,
   uncertainty, confidence and proposed corrections. Keep concealed boundaries
   unresolved. Inspect maps/photos independently before accepting a correction.
4. Correct only confirmed discrepancies. Keep shared map, 3D and collision inputs
   consistent. Establish horizontal layout before refining heights or decoration.
   Then create the final current-model packet below and obtain independent review.

## Creating a packet

Declare affected raw feature IDs in the task's `features` list. Prepare a template:

```bash
python3 scripts/placement_packet.py template barraka_boardwalk.json:barraka-sign-planter --task barraka-planter-placement > /tmp/placement-packet.json
```

This populates current fingerprints and required source IDs, **not measurements or
approval**. Complete the packet and add it to `data/placement_reviews.json`'s
`reviews` array. The validator requires:

- A known task, author, date, common frame, stated limitations and tolerance
  greater than zero and at most 2 m. Choose a tighter tolerance where justified;
  2 m is a ceiling, not a default or a claim of survey accuracy.
- Exact model, renderer context and source snapshots. Public photo pixels and
  metadata, aerial pixels and bounds are hashed. Private references require a
  full immutable Git commit in their `sourceRevision` tag. CI validates this pin;
  the independent reviewer must inspect the actual private pixels at that revision.
- Existing, SHA-256-bound public-safe `overlay`, `comparison` and `render`
  artifacts. `render` must be a PNG/JPEG at least 320×200. A software PASS file is
  not a render. Keep private imagery and credentials out of this public repo and
  link private comparisons from public-safe reports; Google imagery may be included
  with credit (AGENTS.md).
- One assessment per cited source plus `map:ground`, specifying `supports`,
  `limited` or `unusable`, capabilities and limits. Photographs need camera status
  and `consistent`, `differs` or `not-comparable` comparison. A claimed calibrated
  camera needs a hashed calibration artifact. `differs` blocks approval.
- A registration source and one six-value transform `[a,b,c,d,tx,tz]` mapping
  pixels `(u,v)` to `(a*u+b*v+tx, c*u+d*v+tz)`. `georeferenced` must use the actual
  aerial pixel dimensions and `ground.json` bounds. Other identified aerial/map
  sources permit only rigid or similarity registration, without shear/reflection.
- At least three non-collinear controls and two distinct held-out landmarks,
  spanning at least two actual model features. Every landmark identifies a
  physical corner, source pixel, transformed source point, actual model vertex,
  uncertainty and identification basis. Reusing a control with another label is
  rejected. Pixels must lie inside the inspected aerial. Residual distance
  **plus uncertainty** must fit the tolerance.
- `measurements` covering every represented feature vertex/point, with source
  pixels, transformed source points, actual model points, identity, measurement
  basis and uncertainty. Every distance plus uncertainty must fit the tolerance.
  A single centre cannot approve a represented outline. If corners are concealed,
  leave the placement unapproved and document the limitation.

After the author completes the packet, an independent reviewer inspects the actual
maps, full-size photos, overlay, current render and comparison report. Compute the
author packet digest with:

```bash
python3 scripts/placement_packet.py digest /tmp/placement-packet.json
```

The reviewer supplies a different identity, `approved`, date, this exact
`packetDigest`, every required `sourcesInspected`, and a hashed public-safe review
record. Edits to the author packet invalidate that approval. Do not manufacture a
second reviewer identity or approve from implementation/tests alone. If an
independent review is unavailable, leave the PR and placement unapproved.

This validator checks records, arithmetic, references and hashes. It does not
inspect image content, authenticate reviewer identities or prove that measured
points identify the claimed physical corners. Actual source inspection and PR
review are essential. A raster file header is not proof of a truthful render.

## Discrepancies, history and completion

Keep individual reports in `data/placement_reviews.json`'s `reports` array: stable
ID, feature ID, reporter, concrete discrepancy notes, identified sources, optional
public-safe evidence path, status and follow-up task. The Barraka sign planter is
`barraka-planter-position`; its current estimated `[35,122]` has not been replaced
with another guess. The existing middle-pool photo disagreement is also retained.

An unresolved report needs an unfinished follow-up task. To resolve it, a fresh,
valid, same-feature independent packet must explicitly list the report ID in
`resolves`; the report must name it as `resolutionReview`. Closing the task,
changing a status or adding a later positive photo check cannot resolve it.
Retain old packets; use a valid same-feature newer packet's `supersedes` list to
replace them. Self/cyclic and cross-feature supersession is rejected.

New geometry tasks cannot become `done` without declared features and current
placement approval for all of them. Frozen historical completions retain their
history but receive no automatic placement approval. Tooling/audit completion is
exempt; this does not exempt their geometry edits from the PR change check.

```bash
python3 scripts/build_references.py --check
python3 scripts/test_reference_index.py
python3 scripts/test_placement_verification.py
python3 scripts/check_placement_changes.py --base origin/main
python3 scripts/placement_packet.py status barraka_boardwalk.json:barraka-sign-planter
```

The **Evidence graph / placement-evidence** PR workflow regenerates the graph,
checks committed outputs, runs policy tests and rejects changed geometry without
current placement approval. It also rejects deletion/reassignment of discrepancy
history, removal of original discrepancy sources, and rewriting earlier placement
packets, even when no geometry file changed. Follow `docs/HANDOVER.md` for all
software checks too.
Treat this check as required before merge; whether GitHub enforces it as a branch
protection rule depends on repository settings. This workflow does not configure
branch protection or authenticated reviewer approval.

Fingerprints deliberately invalidate reviews conservatively after shared renderer
changes. Pure UI modules and descriptive/citation-only JSON edits are exempt.
For helper changes without directly identifiable model changes, declare affected
features and review them in the new renderer context. Deletions currently fail
closed: reviewed retirement/tombstone support must be added before removing model
features. Do not bypass the gate by deleting reports or loosening the policy.
