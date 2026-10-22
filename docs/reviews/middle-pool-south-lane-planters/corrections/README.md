# Source correction: rectangular grilles and four tile columns

Owner review, 22 October 2026: the new game grilles bow outward but the photo's grilles are squared; the lane floor is four tiles across. Full-size IMG_2334 and IMG_2189 re-inspected before this correction. Existing after renders are retained unchanged in the parent folder and copied here as the correction's before views.

Source originals: [IMG_2334](../../../../public/photos-ref/IMG_2334.jpg) and [IMG_2189](../../../../public/photos-ref/IMG_2189.jpg).

## Source versus current draft

IMG_2334: the fixed grille behind the right gate leaf has straight uprights, a flat projecting front and rectangular side returns over the planted border. The foreground hinged gate leaf is separate. IMG_2189 gives clearer rectangular cages on both sides: long straight vertical members, horizontal ties and right-angle returns. Some metal ornament curls, but the overall cage is not a bowed profile. The prior sine-shaped bow was an incorrect interpretation and will be removed. Brown shutter backing remains.

IMG_2189 shows four terracotta tile columns across the main through lane, with three internal longitudinal grout lines and perimeter joints. IMG_2334 supports a square, lane-aligned terracotta grid beyond the crazy-paving threshold; wet surfaces, planting, gate leaves and equipment partly obscure its edges. The old game uses the generic globally rotated 0.4 m tile atlas, giving too many tiles and the wrong alignment through this bounded lane.

## Bounded proposed correction

Keep the existing grille world attachment, width, height and maximum projection, but use straight square-section uprights at constant projection, rectangular perimeter rails and orthogonal side returns. No curved cage silhouette; decorative curls remain schematic only.

Give this lane a local four-column grid, aligned to the gate/lane frame, bounded by the existing bed fronts and the actual east registry frontage. Three longitudinal joints separate the four columns; row spacing is estimated from model width divided by four. Four is the observed count, not a measured tile size or an instruction to rescale the lane. Bed/house footprints, route width, doorway gap, terrain and courtyard crazy paving remain as before. At offsets the edge course can vary in width; do not invent a complete resurvey or claim all tiles have a measured size.

Affected IDs: the two existing `south-lane-right-*-grille` features and a new `middle_pool_lane_frontages.json:south-lane-four-column-paving` surface in the same in-progress task. New surface rings are visual/material bounds, not collision barriers. The same bounded ring appears on the map and in the reference inventory.

Existing placement reports and prior photo-check results are retained. Absolute tile size, lane width and globally registered placement remain unapproved; this correction addresses confirmed appearance/count errors only.

## Corrected build and comparisons

- [Close before](lane-close-before.png) / [after](lane-close-after.png): square-profile cages and a single lane-aligned four-column grid.
- [IMG_2334 before](IMG_2334-before.png) / [after](IMG_2334-after.png).
- [IMG_2189 before](IMG_2189-before.png) / [after](IMG_2189-after.png), construction/count evidence only.
- [Bounded surface overlay](surface-overlay.svg): same unchanged ground frame as the parent overlay, cyan floor bounds and three internal yellow grout lines. Gold beds and registry ground outlines are retained. Hidden edges and full source registration remain unresolved.

The local floor uses one full four-column atlas across each section, with three longitudinal joints also shown on the map. The generic road ribbon and its white edges are clipped only inside that same surface, so the old diagonal grid cannot overlay it. It remains a visual surface, without a new solid/collision barrier or movement-height change. Variable section widths keep existing bed/facade offsets; the approximate .6 m row pitch is not a real-world tile measurement.

Reproduce the close after view with `REVIEW_OUTPUT=docs/reviews/middle-pool-south-lane-planters/corrections node scripts/review_lane_frontages.cjs --as=after`. Source-camera pairs use `shoot_views.cjs` with `--task=middle-pool-south-lane-planters/corrections --as=after --pool=middle --details`. Earlier parent-folder renders/checks are retained.

See [independent corrective review](../corrective-review.md) and [validation.txt](validation.txt). The task and PR remain drafts because measured placement is unapproved.
