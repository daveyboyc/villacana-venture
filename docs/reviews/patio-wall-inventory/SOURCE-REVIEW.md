# Patio-wall source review

Reviewer: independent agent `/root/review_patio_sources`, 19 November 2026.
Scope: source-content review for a resort-wide **inventory of model wall lines and unresolved enclosure outlines**. This is not a measured placement approval, a full resort wall survey, or approval to flatten all wall tops to one elevation. No geometry changed in this review.

## Sources actually inspected

Opened the complete repository web-copy images below, not just thumbnails. These are the available 1200×1600 / 1600×1200 copies, not original camera-resolution files. Also opened `public/map/ground.jpg` (Esri World Imagery zoom 19, bounds from `public/map/ground.json`) and the Cervantes, Elena and north-pool contact sheets for context. Read the layout topic and the relevant Cervantes, Elena, north-pool, north-lanes, seaward-lanes and whole-resort briefs, plus the wall datasets and `docs/LEVELS.md`.

| Source | Visible evidence | Limits for marking walls / levels |
| --- | --- | --- |
| `IMG_2363.jpg` | Elena north: tall lane-side privacy wall and brown door, transverse patio divider, plain tiled patio floor, end wall with a second brown door, separate open garden arch onto crazy paving/lawn. | Plants cover parts of the wall top and joins. Foreground patio is cropped. One roof view does not fix metric depth, thickness or floor datum. No solved camera in `data/photo_poses.json`. |
| `IMG_2206.jpg` | North pool: curved terrace retaining wall and tiled stair; nearer tall gated patio walls are a separate structure. | Vegetation hides rear joins and patio limits. Do not apply the retaining-wall rise to the privacy walls. Has a solved camera, control RMS 6.82 px, but no held-out RMS in the stored solve. This does not approve new wall measurements. |
| `IMG_2362.jpg` | Roof and house-front context behind a dense magnolia canopy. | Patio floor and most internal boundaries are concealed. Cannot establish a full sequence of patio divisions or their levels. No solved camera. |
| `IMG_2366.jpg` | Cervantes-side tiled strip, high white wall with climbing plants, curved coping above brown door, cane-covered pergola at the house. | Canopy hides neighbouring patios. This is not evidence that all Elena east partitions or floors are visible. Depth, concealed returns and level remain unresolved. No solved camera. |
| `ELENA-ROOF-2026-11-17.jpg` | Elena south: high patio privacy walls behind the two lawns, transverse walls and brown doors; lawn edges are low kerbs, distinct from privacy walls. | Foliage conceals joins. Far walls are foreshortened and cannot be moved in depth on one image alone. Stored solve has 3.48 px control RMS and 0.36 m held-out RMS; that is not ≤0.3 m independent wall placement approval. |
| `IMG_2368.jpg` | Cervantes north near Elena: several transverse white partition fragments, lane-facing wall/door and planted private patios. | House-side joins, near ends and floors are partly covered by trees, parasols and roofs. Existing three partial fragments must not be closed into complete enclosures merely from registry outlines. No solved camera. |
| `IMG_2274.jpg` | Cervantes: planted strip with low rounded white kerb along the tiled lane, and a taller planted white wall behind it. | The front kerb and rear privacy wall must remain separate records/heights. Planting hides most base/top relationships and endpoints. No solved camera. |
| `IMG_2774.jpg` | Guillermo by main pool: long raised white lantana planter to the right; lower hedge planters, taller privacy walls and entrances on the left; lane falls toward the camera. | Different structures have different height/ground relationships. A continuous screen-space wall top is not evidence of a common world elevation. No solved camera. |
| `public/map/ground.jpg` | Resort-wide house blocks, pool courts, open terrace/lawn areas and some white boundary traces. | Roofs project over edges; trees and shadow conceal ground walls. A cadastral zero-storey ring is a candidate enclosure boundary, not proof of a wall on every edge. No new pixel-to-world measurements were made in this review. |

## Consequences for the inventory

1. Separate existing explicit wall axes, retaining faces, and **untraced registry enclosure outlines**. Only the first two are model wall geometry. Keep retired/tombstoned records out of active counts and totals.
2. Preserve source IDs and feature IDs so each wall can be checked from map to photograph. A photo citation describes evidence; it does not make an estimated line surveyed or placement-verified.
3. Report model line lengths and nominal heights as estimates. A length from an enclosure perimeter is not a quantity of physical wall. Do not mix it into wall-length totals. Gross face areas omit door deductions, returns, coping and concealed/shared surfaces unless explicitly calculated.
4. Preserve door/opening records and distinguish height above local base from absolute top elevation. Levelling needs a chosen, documented datum for each continuous wall/patio run; forcing one height over sloping ground can create sloping tops, floating bases or blocked thresholds.
5. Use the latest 16–18 November level records, not older prose in the area history: Cervantes has distinct upper plateau, Elena drop (~0.6 m), intermediate plateau and Alberto drop (~0.27 m). `docs/LEVELS.md` and `data/levels_survey.json` explain the laser comparison. This review did not run or independently resurvey LiDAR values.
6. Explicit coverage gaps remain under Elena magnolias, at concealed Cervantes partition ends, and in northern lanes with very few references. The inventory may mark these candidates so they can be surveyed, but cannot honestly claim every physical patio wall is traced/render-ready.

## Priorities for follow-up evidence

- Side-on ground shots of each patio wall with both endpoints, its door sill, adjoining lane and wall top visible; include a known measured length or staff for height.
- Inside-patio or opposite-direction views of Elena east beneath magnolias, and Cervantes north partition joins.
- Separate confirmation of north-pool retaining faces versus tall gated patio enclosure boundaries.
- Along-lane ground coverage for Loira/Bolivia/Alberto/Isabel before any repeated wall inference.

No global residuals, held-out wall measurements or placement-review packets were produced here. Existing placement discrepancies remain open. Software inventory completion must not be described as completion of the physical wall survey or levelling work.
