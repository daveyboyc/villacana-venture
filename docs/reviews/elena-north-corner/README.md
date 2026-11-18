# Elena north mouth: the west corner on Cervantes (18 November 2026)

Dave (screenshot of Inspect, 18 November): "This corner of Elena needs a patio and walls, lamppost,
bougainvillea, and plants." The corner is the pocket west of where Calle Elena north meets Cervantes (Elena
north's mapped centreline reaches Cervantes at -145.1, 52.7), between the lane mouth, Cervantes and the
house (registry 6265201UF1366N_part4, corner -150.01, 48.72). The model had open paving there and a
0.65 m wall along the Cervantes edge (`cervantes_patio_walls.json` `cervantes-patio-north-east`).

## Stage 1: photo coverage

| Photo | Camera | Shows |
| --- | --- | --- |
| IMG_2455, IMG_2799, IMG_2800, IMG_2965, IMG_2966 | on Cervantes east of the corner, looking west; pins +-2.5-4 m, not solved | the raised fan-palm bed, the white wall facing Elena north with the CALLE DE ELENA tiles, a bracket lamp at its corner, bougainvillea over it, a brown double door near its north end, magnolia over the wall |
| IMG_2967 | the same, closer | the bed's east end and the red drain grating across the Elena north mouth |
| IMG_2514 | in the mouth looking north | fan palm (left), drain, the hedged tree bed opposite (`elena-north-tree-bed-2`) |
| IMG_2686 | in the mouth looking up Elena north | the raised bed's north end under the house's barred windows |
| IMG_2463 | on Cervantes west of the corner | the hedge and plumbago bed in front of the same wall, running west to the Elena 24 garden door |
| IMG_2969 | Elena north | a trained climber on a white wall with a stone shelf beside a barred window |
| Aerial (Esri, 0.24 m/px) | | the magnolia canopy filling the pocket |

No solved camera sees the corner: the Elena 24 roof cameras face south and east of it. A hand fit of IMG_2800's
camera to four model points and two upright edges (66 px rms) is stored as its starting pose for comparison
renders only. Photo request `elena-north-corner-square` asks for a ground view that could be solved.

## Stage 2 and 3: layout and levels (built here)

| Feature | Where | Basis |
| --- | --- | --- |
| `lane_walls.json` `elena-north-corner-patio-wall`, 2.2 m, 0.25 m thick, brown double door 1.2 x 2.0 m | from the house corner (-150.01, 48.72) along the registry house-front line to the corner (-148.07, 52.06), then west 2.07 m off the Cervantes axis to the Elena 24 garden-door wall (-152.60, 54.85) | the Elena run continues the registry front (2.24 m west of the Elena centreline); the Cervantes run lines up with the garden-door wall (2.0 m) and the existing patio partition `cervantes-north-partition-east` (2.14 m), which closes the patio on the west. Height as the CALLE ELENA wall across the junction; its top is under bougainvillea. Door width against the plaque tiles. |
| `cervantes_lane_edges.json` `cervantes-elena-corner-bed`, raised, 0.5 m kerb | along Cervantes from the Elena 24 garden-door planter to the corner, 0.95-1.95 m north of the axis | replaces the 0.65 m wall, which stood at its lane face (0.88 m). Kerb height: in IMG_2800 the bed corner is 145 px tall where the 0.4 m tiles beside it are about 125 px. |
| `elena_north_corner.json` `elena-north-corner-bed`, raised, 0.5 m kerb | up the west side of the mouth from Cervantes to the house corner, 1.0-2.1 m west of the Elena centreline | lane face from IMG_2800: the mouth between it and the tree bed opposite (0.77 m east) is about 1.8 m of tiles, margin and drain. |

Levels: no level change; the beds and wall stand on the lane ground. Nothing generated stood in the pocket.

Uncertainty: about 0.5 m in plan for the wall and the bed faces; the hand-fitted camera's residuals at the bed
corner and the tree-bed corner are 0.3-0.5 m, which is the same order. Graded `estimated` in `data/confidence.json`.

Renders: `IMG_2800-after.png` (through the hand-fitted starting pose), `corner-overhead-layout.png`,
`corner-overhead-details.png`, `corner-from-north.png`; plan on the aerial: `aerial-plan-after.jpg` (registry
yellow, lanes cyan, other features magenta, new wall and beds red). The floating paving slab across the Elena
north mouth in the renders was there before this change.
