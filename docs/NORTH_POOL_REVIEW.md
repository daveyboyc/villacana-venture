# North pool issue #36: lower patio frontage

The lower north-side patios are now built separately from #54's north-west
1.0 m terrace and six-riser tiled flight. `data/raised_terraces.json` contains the
0.325 m northern patio band; `data/north_pool_gardens.json` and
`src/north-pool-gardens.ts` contain the visible crazy-paving path.

IMG_2204 and IMG_2205 show three distinct shallow openings after the central
alley/pier and before Calle Isabel's pool-side gate. Their plinth toes are gently
curved, with white noses and irregular pale stone treads; the hedges sit above
the low white plinth. The two-riser 0.1625 m flights use the survey's 0.25–0.4 m
rise, rather than the red-and-blue finish of the separate northwest flight.
The shared module now honors the riser finish and optional white noses, and
supports multiple openings whose feet share the same path datum.

The reference sheet, public IMG_2202/2204–2208/2363, private photos 01 and 03–07,
and Apple Maps north-pool views 02/07/08/09 were inspected at full size.
`public/map/ground.jpg` (Esri, bounds in ground.json), the unchanged registry
house/pool rings and the Calle Isabel line in skeleton.json constrain placement.
The retained #54 camera fit for IMG_2204 (about -173.5,36.6; 7.8 m above datum;
heading342, pitch17, horizontal field72 degrees) projects plinth-toe pixels
(935,592), (1035,604), (1170,618), (1395,641), (1580,658) to approximately
(-178.4,10.65), (-175.9,10.9), (-172.9,11.1), (-168.2,11.25), (-164.8,11.25).
Only the first three openings west of the mapped Isabel route are constructed;
the further eastern opening in IMG_2205 is not copied across that route.

The original survey centre (-166,8) was a coarse position for the whole band.
It has been refined explicitly to (-172,9), retaining its ±8 m uncertainty;
the individual photo-fitted openings lie approximately at x=-177 to -168,z=11.
The floor stops at a conservative 2.5–3 m visible band behind the plinths. Its
rear and side limits are estimated untraced ends, dashed in the map, and do not
claim hidden property divisions. No repeated garden partitions, gates or changes
to house floors are invented. The continuous floor band does not establish that
the separate private patios connect behind their concealed divisions.

The path is only the photographed northwest/north arc, about0.96 m wide and flush
with the lawn. Its south/east continuation is not asserted. Mesh and blueprint
use the same path ring; it adds no collision or ground rise. Terrace floor,
faces, cut-back openings, ground heights and collision all use the shared module.
Generated blocks give way to that module's existing suppression band. Hedges
stay Details only. Registry houses, pool, lawn and #54's geometry remain intact.

The old review-only traces in `docs/reviews/issue-36/trace-draft.json` remain
historical: they concern the withdrawn five-riser model and are not runtime data.
New before/after captures are under `docs/reviews/issue-36/`; camera estimates
and a passing route test are evidence of the reviewed model, not a survey.

Run `python3 scripts/check_north_pool_gardens.py` and the standard checks from
`docs/HANDOVER.md`. The task check verifies white-nosed shallow flights, the
separate northwest structure/alley/Isabel route and the lawn-level paving.
The layout browser test climbs and descends each of the three openings, checks
faces and cheeks, traverses the band and draws it in the map.
