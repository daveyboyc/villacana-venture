# Middle pool south gate — issue 39

The southern courtyard exit in IMG_2334 is separate from the southwest stone
steps of IMG_2333. The double iron leaves stand open against the entrance sides.
The photograph shows a shallow curved **white rendered head**, with thin metal
pergola members above; it does not support replacing the whole head with bare
iron. The model retains both. There is no solid roof or inferred enclosing wall.

`data/middle_pool_south_gate.json` supplies the shared frame, outlines and sizes
for `src/middle-pool-south-gate.ts`, blueprint and collision. The gate crosses
Calle Silvia near its courtyard end, in the gap between unchanged registry
blocks. A 1.85 m opening gives clearance beyond the mapped 1.2 m lane. The
photographs and `data/levels_survey.json` support level ground through this gate;
no terrain changes are made. The planter's recessed 0.22 m step is outside the
through route and is part of its solid footprint.

The forecourt uses an original procedural irregular stone texture, with a flush
slatted drain. IMG_2335 supplies the white raised planter, recessed step and the
white tile panel framed with blue/yellow patterned tiles. Motifs are schematic;
no private photograph is used as a texture. Planting is left to existing Details
coverage. Generated props/walls are suppressed only in the local reviewed band.

## Limits and validation

Placement follows the lane and registry gap, not the GPS subject assumption.
Position accuracy is roughly 1–2 m; all dimensions and planter/wall fragment ends
are estimated. Full planter ends are not visible. The white head's curvature and
metal ribs are approximations. The blue tile motifs are not exact replicas.
The existing southwest steps, all survey levels and registry footprints remain.

The immutable Layout baseline was rendered from IMG_2334 on origin/main
`adca41e`, after replacing the outdated dependency checkout. Its checksum is in
`docs/reviews/issue-39/baseline.sha256`. The original Details attempt timed out
under concurrent graphics load. Final browser regression, overview and matching
IMG_2334 after render are owned by the coordinating agent after handoff.
