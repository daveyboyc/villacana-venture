# Independent review: all four single entrance doors

Reviewed 22 October 2026 by source-review agent
`/root/forecourt_source_review`, separate from the implementation author.

Inspected the current `src/silvia-tunnel.ts` and `data/silvia_tunnel.json`
diffs plus actual-app `interior-after.png`, `right-recess-after.png` and
`plan-after.png`. This correction applies the owner's latest instruction to all
four entrances, superseding the earlier paired-door interpretation and the prior
change restricted to inner recesses. Historical reviews remain historical.

The module now creates exactly one plain wooden leaf and one spherical gold knob
with round backplate per entrance. The paired render branch, centre seams,
inset panels, vent slats and lever handles have been removed. All four records
are non-paired. A maximum 0.88 m leaf with white side infill prevents the wider
near bays from continuing to read as broad double doors. The actual interior
capture visibly shows the narrower plain near leaves; the plan exposes their
individual gold knobs, and the recess close-up clearly shows one plain leaf and
one round golden knob.

No blocking visual discrepancy found for this correction. Existing bay extents,
setbacks and collision construction are unchanged in the inspected diff. Leaf
width and white infill are modelling choices under the owner's instruction,
not new source measurements. Recess depths, passage dimensions and global
location remain estimated/unresolved; this review grants no placement approval.
Software checks were not independently rerun by this reviewer.

A minor stale metadata phrase, `right-near pair` in the T12 uncertainty text,
was reported to the author for replacement with `right-near entrance`; it does
not affect rendered geometry.

Final snapshot: rechecked `interior-after.png` refreshed at 21:51:23 UTC.
Both near plain single leaves now visibly carry one round gold knob each;
their knob side was changed to make this visible from the normal interior view.
No other source-form discrepancy appeared. Bay extents, leaves, recess depths
and collision arrangement remain as reviewed above. The stale T12 wording is
also corrected to `right-near entrance`. Placement limitations are unchanged.
