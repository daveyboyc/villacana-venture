# Evidence acceptance standard v1

The machine-readable version is `data/acceptance_standard.json`. This consolidates
the existing 0.3 m placement rule; it does not grant approval to earlier work.
It applies to declared features and tracked discrepancies, not an entire area
merely because its queue is empty or its scorecard is green.

| Scope | Required evidence |
| --- | --- |
| Horizontal placement / completeness | Current independent placement approval for every declared feature, with tolerance no greater than 0.3 m; at least two solved photo cameras, or one solved camera and the georeferenced aerial; controls and held-out measurements under the placement policy. Report worst error and uncertainty. Different directions from a shared camera station are not independent triangulation. |
| Appearance / completeness | Photo/render comparison and overlay, reviewed at full size by a different agent/session. All checklist items pass in Inspect with Show details: presence, shape, materials, visible details. A reviewer records what was checked and the limits. |
| Height | Measured RMS plus uncertainty within a positive, explicitly justified source-backed tolerance, with held-out measurements. A horizontal approval never grants height approval. Use the laser survey where appropriate. |
| Software | Relevant source checks, production build and Inspect/map browser checks pass. Geometry changes also follow the complete applicable suite in HANDOVER.md. Software success is not photographic approval. |

Every acceptance packet binds the standard, criterion, model/renderer context,
camera solves, source bytes (or immutable private source revisions), render,
overlay and comparison. Changes invalidate acceptance until a new review is
recorded. Preserve old reviews in `reviewHistory`; never rewrite the history.
The validator checks records and arithmetic, not image meaning or reviewer identity.

No hidden boundary or unobserved fitting is accepted by extrapolation. Build an
obvious but incompletely seen feature as inferred under the existing confidence
rules, and keep its unverified extent explicit. Do not invent extra structure.

Missing evidence is a scoped work state. It does not fail software checks or
freeze the rest of an area. An invalid acceptance claim does fail checks.
An evidence request is answered only after its source has been inspected;
arrival alone is not an answer. A permitted exclusion remains a documented
limitation, never a fabricated measured match.
