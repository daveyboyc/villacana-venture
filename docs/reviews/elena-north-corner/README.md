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
| IMG_2686 | in the mouth looking up Elena north | the raised bed at its foot and the mouth's three tile columns; a lower bed along the house beyond |
| IMG_2463 | on Cervantes west of the corner | the hedge and plumbago bed in front of the same wall, running west to the Elena 24 garden door |
| IMG_2969 | Elena north | a trained climber on a white wall with a stone shelf beside a barred window |
| Aerial (Esri, 0.24 m/px) | | the magnolia canopy filling the pocket |

No solved camera sees the corner: the Elena 24 roof cameras face south and east of it. A hand fit of IMG_2800's
camera to four model points and two upright edges (66 px rms) is stored as its starting pose for comparison
renders only. Photo request `elena-north-corner-square` asks for a ground view that could be solved.

## Stage 2 and 3: layout and levels

Built, then reviewed by a subagent that did not build it: [STRUCTURE-REVIEW.md](STRUCTURE-REVIEW.md), approved with
changes R1-R4, all applied (the review's rough camera fits of IMG_2455, IMG_2800, IMG_2966 and IMG_2967 to the bed
corner agree with each other to about 0.2 m; they are not solved cameras).

| Feature | Where | Basis |
| --- | --- | --- |
| `lane_walls.json` `elena-north-corner-patio-wall`, 2.8 m, 0.25 m thick | from the house corner (-150.01, 48.72) along the registry house-front line to the corner (-148.07, 52.06), then west 2.07 m off the Cervantes axis to the Elena 24 garden-door wall (-152.60, 54.85) | the Elena run continues the registry front (2.24 m west of the Elena centreline); the Cervantes run lines up with the garden-door wall (2.0 m) and the patio partition `cervantes-north-partition-east` (2.14 m), which closes the patio on the west. R1: 2.8 m, not the first build's 2.2 m (coping 2.65 m in IMG_2966, wall above the 2.5-2.85 m door head). |
| its brown double door, 0.8 x 2.7 m | centre (-148.85, 50.72), 1.85 m from the corner, about 2 m of plain wall north of it | R2: the first build had it 1.2 m wide at the north end; the letter tiles are tall and narrow, so the plaque is only about 1.1 m long. |
| `cervantes_lane_edges.json` `cervantes-elena-corner-bed`, raised, 0.5 m kerb | along Cervantes from the Elena 24 garden-door planter to the corner, 0.95-1.95 m north of the axis | its face lines up with the tree-bed kerb corner across the mouth (IMG_2800, IMG_2799). Kerb: 145-150 px at the corner against 0.4 m tiles of about 125-140 px. |
| `elena_north_corner.json` `elena-north-corner-bed`, raised, 0.5 m kerb | up the west side of the mouth from Cervantes to the house corner, 0.75-2.1 m west of the Elena centreline | R3: face at the 1.45 m lane paving (three 0.4 m tile columns and two margins in IMG_2686), not 1.0 m. The two arms are one bed: the kerb between them is left out (planter `join`). |
| `cervantes_patio_walls.json` `cervantes-patio-north-east` | | retired, kept as a tombstone for the evidence graph and not drawn: the bed now draws that face. |

Levels: no level change; the beds and wall stand on the lane ground. The door's sill and the patio floor are not seen.
Nothing generated stood in the pocket.

## Stage 5: detail (`data/elena_north_corner_details.json`, Show details)

Reviewed in the follow-up section of [STRUCTURE-REVIEW.md](STRUCTURE-REVIEW.md): approved with changes D1-D4, applied.

- Hedge with plumbago along the whole Cervantes arm; fan palms (`fanPalm`, src/clipped-plants.ts) filling the Elena
  arm as one dense mound about 1.9 m high (D4).
- CALLE DE ELENA in tall single-letter tiles, bottom about 1.9 m up, from the corner towards the door, clear of the
  door's pilaster (D3). The recorded 0.2-0.3 m corner offset leaves only about 1.15 m of face there, so the tiles are
  drawn 0.075 m wide.
- The lantern on a 0.55 m iron bracket on the Cervantes face just round the corner, about 2.3 m up.
- Bougainvillea (D2): a drape over the coping of the plaque run from the corner to past the door, the letters left
  readable; on the Cervantes face flowering from about 1.3 m up and over the coping on bare trained stems, and by the
  garden door.
- No tree in the patio (D1): the house's south gallery shows clear above the wall there. The magnolia over the wall
  stands in the hedged tree bed east of the mouth (discrepancy `elena-north-tree-bed-2-magnolia`).

## Open (data/discrepancies.json, task elena-north-corner)

`elena-north-corner-offset` (0.2-0.3 m, within tolerance; photo request `elena-north-corner-square`),
`elena-north-corner-door-sill`, `elena-north-west-lower-bed` (the lower bed along the house north of the raised bed,
IMG_2686 and IMG_2969: the raised bed does not run under the barred windows; this lower bed does),
`elena-north-tree-bed-2-south-face` (0.6 m), `elena-north-tree-bed-2-magnolia`, `cervantes-garden-door-wall-height` (1.9 m modelled, about 2.4-2.5 m).

Renders: `IMG_2800-after.png` and `IMG_2800-after-details.png` (through the hand-fitted starting pose, not a solved
camera), `corner-overhead-layout.png`, `corner-overhead-details.png`, `corner-close-details.png`,
`corner-from-north.png`; plan on the aerial: `aerial-plan-after.jpg`. The floating paving slab across the Elena north
mouth in the renders was there before this change.
