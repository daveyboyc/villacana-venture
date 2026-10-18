# Middle pool south gate — issue 39

The southern courtyard exit in IMG_2334 is separate from the southwest stone
steps of IMG_2333. The double iron leaves stand open, the right one against the planter.
The photograph shows a shallow curved **white rendered head**, with thin metal
pergola members above; it does not support replacing the whole head with bare
iron. The model retains both. There is no solid roof or inferred enclosing wall.

`data/middle_pool_south_gate.json` supplies the shared frame, outlines and sizes
for `src/middle-pool-south-gate.ts`, blueprint and collision. The gate crosses
Calle Silvia near its courtyard end, in the gap between unchanged registry
blocks. A 1.85 m opening gives clearance beyond the mapped 1.2 m lane. The
photographs and `data/levels_survey.json` support level ground through this gate;
no terrain changes are made. The planter's recessed wall bench is outside the through route
and is part of its solid footprint.

The forecourt uses an original procedural irregular stone texture, with a flush
slatted drain. IMG_2335 supplies the white raised planter, recessed wall bench and the
white tile panel framed with blue/yellow patterned tiles. Motifs are schematic;
no private photograph is used as a texture. Planting is left to existing Details
coverage. Generated props/walls are suppressed only in the local reviewed band.

## Wall bench correction, 18 October

On the live site the tiled bench stood 0.1-1.1 m from the gate line, directly
behind the open right leaf. IMG_2334 shows otherwise. Reading it by perspective,
with the 1.85 m opening as scale, the camera is about 4.9 m back. The leaf opens
against about 1.7 m of planter. The bench recess runs from about 1.7 to 2.7 m in
from the gate, level with the drain, and the planter carries on past it. IMG_2335
shows a seat-height block (about 0.42 m) with a low plinth in front, not a 0.22 m
step. The tiled panel sits about 0.9 m up a tall white wall: figure tiles along the
top, bottom and left, plain white tiles inside. The planter is modelled to about
3.1 m in, where the approximate mapped Calle Eva route turns north-west; its real
end is not visible. Both camera pins were moved from photo content (the GPS put
IMG_2335 in the gateway itself) and both photos now have a reviewed `looksAt`.

Before/after renders are in `docs/reviews/middle-pool-south-gate/` and recorded in
`data/photo_checks.json`. IMG_2335 matches. IMG_2334 still differs: the model
shows lawn and a crossing tiled path where the photo shows a narrow crazy-paved
forecourt with a hedge on the east side. That is task
`middle-pool-south-forecourt`.

The original build passed every source and walking check, but no after-render
was ever compared with IMG_2334, so nothing caught the bench sitting behind the
leaf. That gap is why photo checks are now required (see `docs/HANDOVER.md`).

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
