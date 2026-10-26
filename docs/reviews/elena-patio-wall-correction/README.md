# Elena front-patio walls and paving recheck

The north lane privacy wall was only 1.15 m high with a 1.0 m door. Full IMG_2363
shows a full-height enclosure and door, a gateway-side return joining the house,
and one further divider from lane wall into house. The model now represents those
relationships: estimated wall 1.85 m, door 1.8 m, joined return and one divider.
The door anchor is projected onto its updated wall so the timber face stays visible.

Wall bodies, coping, gateway head, doors and barred-window details now share the
surveyed ground at their actual vertices/anchors. They skip the generic midpoint
drape, which previously gave adjoining fragments different ground offsets. The
ordinary garden boundary keeps its existing estimated height; its door head now
has the photographed shallow curved coping. Low planting kerbs remain low.

Only the first patio floor visibly bounded in IMG_2363 receives a plain square-tile
patch. Its extent fits the existing registry and estimated wall anchors; following
the existing surveyed ground is a model assumption, not a measured private floor
level. Its phase is independent of the public lane. The public paths retain three
straight columns, and the garden spur retains the north lane's phase. The existing
south cross-lawn approach now shares its adjoining lane's axes, square pitch and
model phase as well. The source junction is partly obscured: exact phase is a model
consistency choice, not a measured origin. The canonical
map now shows the corresponding square patterns on this patio and the spur.

IMG_2261/2330/2358 were also rechecked: south-lane and cross-lawn paving is plain,
but IMG_2358's foreground private patio has decorative inserts. Those patterns
remain distinct. This does not fill the concealed garden-patio floors, add repeated
partitions or certify the south garden-wall/door run. Its physical-edge registration
and terminal identity remain in #144/#147.

## Evidence and comparison

- [Labelled source traces and provisional model plan](source-plan.svg), with
  [source observations and actual final model anchors](source-check.json).
- [Elevated before](elevated-patios-before.png) / [after](elevated-patios-after.png):
  full production scene with only the camera overridden by the local render harness.
- [Garden door before](garden-door-before.png) / [after](garden-door-after.png).
- [South cross-lawn path before](south-crosspath-before.png) / [after](south-crosspath-after.png); material/UV only, unchanged ring and height.
- [Independent full-source, code and render review](independent-review.md).
- [Actual wall, door and join mesh checks](mesh-checks.json).
- [Before camera records](capture-before.json) / [after records](capture-after.json).

The elevated camera is uncalibrated. The north-patio, north-join and Cervantes-corner
first-person frames are partly or fully occluded; they are retained as limited,
not-comparable diagnostics. No whole-photo match is asserted.

## Accuracy limits

Wall/door heights are door-relative estimates, about 0.2–0.3 m uncertainty, not a
survey. Existing plan anchors retain roughly 0.5–1 m uncertainty. The short former
0.95 m gap towards the barred-window return is closed as estimated frontage
continuity: foliage prevents confirming the precise concealed join. Source-visible
relationships do not approve those coordinates. Registry houses/pools, terrain
heights, other streets and concealed subdivisions are unchanged.

The committed laser-survey report was consulted before changing heights. Its 1 m
MDT/2 m MDS products do not resolve these thin walls; raw survey tiles are absent
from this workspace. Existing derived ground supplies consistent bases, not a new
wall-height measurement. Placement remains unverified and task #153 stays in
progress under the repository policy despite provisional delivery.

The independent review pins the north wall snapshot to `f879f907` and the final
south approach material snapshot to `57ee2f00`; each comparison carries its own
immutable model revision and render hash. Historical comparisons remain available.
