# North-pool alignment and discrepancy audit — 18 October 2026

The available evidence supports the broad courtyard arrangement, but does **not** verify the entire north-pool area or justify moving its registry building coordinates. Six sampled roof corners disagree with the registry plan by **0.61–1.52 m**; the independently held-out Google/Esri landmarks disagree by **1.51–2.13 m** after one global registration. Roof overhang/parallax, edge selection and source registration remain mixed in those differences. A confirmed reference error conflates two different Elena entrances. Concealed ground boundaries remain unresolved.

This report and the comparison were produced against `main` **e043c0e** (PR #97), before correcting any source associations. **No runtime geometry is changed by this audit.** PR #97's three western upper roofs are one bounded correction, not certification of the courtyard.

## Review artifacts

- [Labelled plan in metres](layout.svg) · [PNG](layout.png) · [building-label key](building-labels.json).
- [Registration residual diagram](alignment-residuals.svg), [measured results](measurements.json), [original pixel picks and method](observations.json), [individual discrepancy register](discrepancies.csv).
- Private source-image overlays and comparison viewer: [`villacana-reference/uploads/north-pool-audit-2026-10-18`](https://github.com/daveyboyc/villacana-reference/tree/task/north-pool-alignment-audit/uploads/north-pool-audit-2026-10-18). Download/open `index.html`, or inspect `esri-context.png`, `esri-courtyard.png`, `google-satellite-overlay.png`, `esri-landmarks.png`, `google-landmarks.png`. Source pixels remain private. The plan and residual diagrams contain no source-image pixels.
- [Current diagnostic model captures](current/): north, whole-context, western oblique and the retained estimated IMG2204 pool-ring camera. These are estimated review cameras, not photographic matches.

The overlays distinguish nominal registry house plans (red), elevated passage parts open below (dashed purple), zero-storey enclosure plans (dotted grey), projecting upper roofs (orange), pool construction outline (cyan), existing estimated terraces (green), photo-traced path (teal), and street axes (ochre). A red registry polygon is a **baseline nominal plan**, not proof that every visible roof edge is a ground wall. Estimated terrace cut ends are not verified enclosure walls.

## Sources actually inspected

| Source | Inspection and useful evidence | Limitations |
| --- | --- | --- |
| `public/map/ground.jpg` and `ground.json` | Entire georeferenced Esri aerial, then courtyard/connecting-road crops; 1792×1792, zoom 19 | About 0.2402 m/pixel; capture date and orthorectification accuracy unknown. Roof displacement, trees, shadows and compression conceal walls. Pixel resolution is not positional accuracy. |
| Private `google-maps/02-satellite-lane-names.png` | Whole 1260×2736 screenshot and original-pixel crops; registered globally using distributed landmarks | Rotated screenshot; no embedded map bounds or camera calibration; labels/UI obscure ground. Capture date unknown. Not a fresh Google API fetch. |
| Private `google-maps/01-street-map-lane-names.png` | Whole 1260×2736 standard-map screenshot | Qualitative topology/names only: schematic paths/buildings, UI and blue camera pin. Not used for dimensions or silently treated as georeferenced imagery. |
| Registry extract `data/catastro/{buildingpart,otherconstruction}.gml.gz`; `scripts/build_skeleton.py`; `public/map/skeleton.json` | Provenance, original plans and current house/pool/passage rings | Downloaded 11 October 2026; underlying survey/update epoch unknown. Pool rings are smoothed in the builder. Building storeys/registry enclosures do not resolve overhangs, concealed ground walls or access rights. |
| Private `contact-sheets/north-pool.jpg` | Read before individual images | Index/overview only; labels were re-evaluated against visible content. |
| IMG_2202, 2204–2208, 2363 | Each available repository image inspected at its full raster size (1600×1200 / 1200×1600) | These are web copies, not the full camera originals held in Drive. No calibrated camera pose. |
| Private photos 01, 03–07 | Each full available raster inspected: 01 is 1260×2736 screenshot; 03–07 are 1932×2576 / 2576×1932 | 03–07 largely reproduce the same scenes as 2208/2207/2206/2205/2204, with different crops/resolution. They are not five independent spatial anchors. |
| Private Apple north-pool 02/07/08/09 | Each full 1260×2736 screenshot inspected | Distorted 3D surfaces, trees and hidden walls: evidence for existence/order and broad topology only; no precise dimensions extracted. |
| Additional IMG_2361 and IMG_2203 | Full available raster inspected to connect the two Elena entries | Corroborate different openings and different approaches; do not determine surveyed distances. Independent reviewer also inspected 2362/2364/2365. |

All requested project documents were read. `/workspace/north-pool-reference-audit.md` was absent. Both repositories were fetched from origin; public baseline e043c0e, private baseline b134735. No fresh Google credentials were configured in this environment; existing private screenshots were sufficient for this bounded comparison. No original metadata blobs, credentials, Google imagery or private photos are copied into the public repository.

## Common frame and alignment

The fixed frame is the project's origin **36.4552° N, −5.05°**, `x` east and `z` south in metres. Registry UTM30 coordinates are converted through the existing builder. Esri uses its existing `ground.json` bounds: x −332.27…98.09, z −98.38…331.99. No translation, rotation or local deformation was applied to registry or Esri. The affine raster interpolation from the bounds differs slightly from exact tile projection over this small extent; it is far below the stated metre-scale source limits.

For Google satellite, one least-squares **similarity** (uniform scale, rotation, translation; four parameters, no shear, no local warping) maps original screenshot pixel `(u,v)` to Esri pixel `(px,py)`:

```
px = 0.694484534*u + 0.313632182*v + 122.817126439
py = -0.313632182*u + 0.694484534*v - 2.091076509
```

Scale is 0.76202 Esri pixel per screenshot pixel, rotation −24.304°. This is a screenshot registration, not a model correction. The source image is left unchanged; the overlay projects model lines back into its pixels.

| ID / feature | Google pixel | Esri pixel | Role | Residual (m) |
| --- | --- | --- | --- | --- |
| C1 NW outer roof corner at Dalí/Loira | 149,698 | 448,438 | Fit | 0.83 |
| C2 NE outer roof corner on northern Picasso frontage | 797,609 | 866,168 | Fit, outside correction scope | 0.76 |
| C3 south-pool water-colour centroid | 410.57,1908.46 | 1005.04,1195.35 | Fit, outside correction scope | 0.40 |
| V1 north-pool water-colour centroid | 359.30,875.84 | 640.12,498.49 | **Held out** | 2.05 |
| V2 middle-pool water-colour centroid | 440.40,1339.61 | 843.09,792.72 | **Held out** | 1.51 |
| V3 toddler-pool water-colour centroid | 1052.84,1567.21 | 1336.65,756.17 | **Held out** | 2.13 |

Fit RMS **0.69 m**; validation RMS **1.92 m**, maximum **2.13 m**. The controls span the north-west, north-east and southern site. None of V1–V3 was fitted or used to adjust the transform afterwards. V2/V3 and C3 are context only; no correction outside the north-pool scope is proposed. Water-colour centroid extraction uses fixed windows and the existing `trace_pools.components` threshold; shadows/plants bias it. The main pool was excluded because its threshold mask breaks into differently lit components. Raw pixel windows are recorded for reproduction.

Manual roof picks carry approximately 0.7–1.2 m selection/edge ambiguity; water landmarks approximately 0.8 m. These are working uncertainty estimates, not confidence intervals. Mixing elevated roof-corner controls with ground-water controls can itself contribute height/parallax effects to a coherent residual. The held-out north landmark is displaced about **+1.66 m east / −1.20 m south** after registration. That is a **cross-source residual**; moving the north pool by it would confuse registration with model error. Three fit controls and three pool validations cannot prove the entire imagery mosaic has uniform accuracy. There are no independent surveyed ground checkpoints, so **absolute map accuracy is not established**. The fit/validation split is independent of parameter fitting, not independent geodetic truth.

## Building positions, orientation, gaps and projections

In the courtyard detail, B4 is the western long row, B1 the separate western house, B48 the north/east-facing long terrace across the lawn, B20 the southern border, B26 the eastern border; B0/B18/B23 are lower registry parts. Full registry IDs are in the key. B2/B5/B47/B24/B22 are elevated passage parts; their plans must not be filled as ground obstructions.

| Check | Registry feature / observed Esri roof point | Difference | Interpretation |
| --- | --- | --- | --- |
| R1 | `6165501UF1366N_part4` vertex 5, NW corner | +0.86 x, −1.25 z; **1.52 m** | Roof/nominal ground-plan disagreement; same source point as C1, not independent validation |
| R2 | `6165501UF1366N_part2` vertex 4, standalone west corner | +0.77 x, −0.32 z; **0.84 m** | Within roof/selection ambiguity |
| R3 | Same house vertex 10, north corner | +0.05 x, −0.61 z; **0.61 m** | Within ambiguity |
| R4 | `6266601UF1366N_part2` vertex 5, Loira-side row | +1.36 x, −0.67 z; **1.52 m** | Similar direction to other roof offsets; cannot attribute to house displacement |
| R5 | `6265401UF1366N_part4` vertex 12, eastern terrace | +0.80 x, −1.00 z; **1.28 m** | Roof edge/parallax and registry baseline differ |
| R6 | `6265201UF1366N_part3` vertex 26, southern terrace/Elena | +0.59 x, −0.40 z; **0.72 m** | Within ambiguity |

These are sampled point differences, not whole-building Hausdorff errors. No plane was shifted to minimize them. Their mostly east/north tendency is compatible with systematic imagery/roof displacement; it does not establish a common correct ground-wall translation.

The R2–R3 edge is **13.86 m** in the registry and **13.39 m** between selected roof pixels, with **2.60°** orientation difference. Two uncertain corners over a short baseline cannot establish an actual rotation; an approximately 1 m corner error can produce several degrees. Preserve the baseline pending visible ground corners or a higher-quality orthophoto.

Nominal minimum building-plan gaps are **7.75 m** B4–B1 (western gap), **1.67 m** B4–B48 (north-row alley), and **5.99 m** B20–B26 (Elena-side gap). These are model distances, not independently measured usable widths. Canopies, private margins and elevated bridges make the distinction material. The photos support an alley and upper roof projections, but do not expose continuous wall toes to measure their true clearances. The three PR #97 canopies agree in existence/order with Esri and Apple02/08/09; their plans remain approximately ±1 m and their elevations estimated. Further facade balconies/awnings visible in 2204/2205 are not thereby verified or individually traced.

## Pool and courtyard ground

Four tentative manual Esri rim/water-transition picks give nearest registry-outline distances **0.02, 1.55, 0.12, 0.64 m** (P1–P4 in the overlay), with approximately 0.5 m selection ambiguity. These are image diagnostics, not measured water-edge agreement. Independent review rejected the initial P2=(665,501) bright-deck pick and P4=(618,505) pale rim/deck pick; a first revision of P2=(661,501) was also rejected on exact-pixel inspection. The final tentative dark-rim/transition picks are (656,501) and (621,505). The rejected picks remain documented in observations.json. P4 is blurred; planting conceals another part of the southwest lobe. The eastern dark-rim pick differs from the model construction outline by about 1.6 m, but the physical datum and source registration are unresolved. This sparse sample does not validate the complete ring; the northern curved/deck edge and concealed western lobe need a clean water-edge trace. Registry construction outline, water edge and cream deck are different features. No pool shift/reshape is justified from these samples.

The photos establish the order **facade/patio → plinth/retaining face → crazy-paving path → lawn → deck → water**. The existing traced north/NW path has estimated width **0.96 m** and plan registration about ±2 m. The module covers a bounded arc, not a surveyed complete perimeter. Broad courtyard ground in `build_skeleton.py` also uses procedural rules (2.4 m deck growth, 1.5 m path, 2.5 m porch depth); those are not traced real-world boundaries. A plausible green/deck render cannot certify their extents. Hidden east/south continuation, private patio divisions and the west terrace's concealed ends remain open. No boundary is extended to close a polygon from the photos.

## Connecting streets, junctions, widths and access openings

| Feature | What was checked against actual maps/photos | Magnitude / confidence / action |
| --- | --- | --- |
| Dalí and Loira junction, west frontage | Esri/Google show the same western road and NW junction; overlay follows that corridor. Elevated B2/B5 alley parts distinguished from walls. | Modeled Dalí width 4.0 m, Loira 6.0 m; **not independently measured**. Parked cars, fence/shadow and roof overhang prevent a defensible narrow-edge width or proof of every ground opening. No confirmed shift. |
| Picasso outer road / inner car-park access | Separate outer Picasso road and inner frontage aisle identifiable in both aerials; Apple07 confirms their relation to intervening rows. Cervantes/Alberto provide the visible eastward connection context. | Modeled widths 6.0 / 4.0 m; parking boundary/aisle dimensions estimated. Google labels cover edges, cars hide kerbs. No confirmed centreline or opening-width correction. Direct passage from pool to parking is not asserted. |
| North-row alley toward Dalí | 2204/private07 show narrow alley/pier after blue-striped awning, separate from the tiled stair; aerial shows the row gap and bridge plans. | Model gap 1.67 m; usable ground width and the Dalí exit remain **unresolved**, passage records retain `likely`. Do not invent an entrance through a roof polygon. |
| Isabel branch and lawn gate | 2205/private06 and 2207/private04 show a gate at the eastern facade setback with crazy-paving branch into lawn; aerial constrains bend around B26. | Shared street axis width 1.2 m is estimated; exact gate width/hinge and wall toes obscured. No measured mismatch from which to relocate the lane. |
| Elena north → courtyard | 2363 shows narrow plain-tiled lane and distinct lawn arch; aerial locates gap B20–B26. Current axis runs through it; arch centre about (−158.78,27.90). | Street axis 1.2 m versus local lane-surface estimate 1.45 m; gateway 1.5 m. These are different model definitions, not source-measured accuracy. Preserve pending calibrated edge trace. |
| Elena covered walkway/private 36/34 spur | 2202 + 2361 identify patterned paving/paired iron gates; 2203 is opposite view through covered arch onto Elena. Distinct from 2363 lawn gateway. | Current gate centres **18.74 m apart** and approaches differ. Distance is model-only. **High-confidence citation correction**, no geometry move. |

The standard map is evidence for broad topology and the names Dalí, Picasso, Elena/Alberto; it is not a measurement of private boundaries or of every junction. Isabel's full canonical name is retained from the repository; no new sign reading is claimed from these maps.

## Individual discrepancy decisions

Each item is also recorded in [the CSV](discrepancies.csv), including evidence, magnitude, confidence, cause category and proposed correction.

| ID | Feature / difference | Evidence and magnitude | Decision |
| --- | --- | --- | --- |
| NP-01 | Google↔Esri registration | V1–V3 residual 1.51–2.13 m; fit RMS0.69 m | Source registration uncertainty; **do not translate model** |
| NP-02 | Sampled house plans vs roof corners | R1–R6, 0.61–1.52 m | Actual ground-wall error unconfirmed; preserve registry coordinates |
| NP-03 | Standalone house orientation/length | R2–R3, 2.60° / −0.47 m roof edge length | Within pick/roof ambiguity; no rotation/scale change |
| NP-04 | West pool edge / complete ring | Revised tentative rim/transition diagnostics 0.02–1.55 m; initial deck/rim picks rejected | Blur/planting and construction/water ambiguity; no reshape |
| NP-05 | Elena entrance evidence conflation | 2202 private36/34 vs2363 lawn; supported by2361/2203; 18.74 m model separation | **Correct citations/titles**, not opening coordinates |
| NP-06 | Hidden patio/terrace ground boundaries | 2204–2208/private03–07; magnitude unmeasurable | Keep hidden ends unresolved; retain estimated extent labels |
| NP-07 | Western ground doors vs marked canopy gap | 2206/2208 and private03/05 show poolward doors; different frontage | **Do not relocate doors**; no complete wall-end trace |
| NP-08 | Additional balcony/awning projections | 2204/2205 show facade variation beyond PR97 roofs; metric plans unestablished | Record bounded tracing follow-up; no repeated generic roof/porch additions |
| NP-09 | Connecting lane widths/openings | Aerials and Apple07; model widths listed above, source-measured error unavailable | No correction; seek clear kerb/wall-toe/opening views |
| NP-10 | Missing modern photo-check records described as “never checked” | Earlier manual reviews documented in NORTH_POOL_REVIEW/RAISED_TERRACES and committed review pairs | **Correct generated wording** to “no recorded photo check”; do not erase review history or manufacture matches |
| NP-11 | Courtyard complete path/lawn/deck extent | Photos show bounded sections; procedural widths used elsewhere | Whole perimeter/ground classification unverified; follow-up trace, no assumed closed path |

## Photo assessment and recording

| Image(s) | Can establish | Cannot establish / quality limits |
| --- | --- | --- |
| IMG_2204 | Courtyard/facade order; pool lobes/deck/lawn; NW curved face/tiled flight; alley/pier and shallow northern openings | Hedges hide patio rear/side boundaries; trees hide facade portions; perspective/uncalibrated pose preclude surveyed plans/heights |
| IMG_2205 | Eastward facade continuation, northern shallow openings, Isabel-side gate and lawn/path branch | Pool cropped on left; foreground roof/wall/yucca hide southeast ground; no whole-building footprint or precise gate width |
| IMG_2206 | Western terraces, curved retaining face, six-riser tiled stair, handrail, two poolward brown garden doors | Large foreground building, trees and planting hide wall ends; cannot place those doors in the western canopy gap |
| IMG_2207 | Local roof tiles/parapet, adjacent patio/path/lawn and gate at upper left | Mostly foreground roof/wall and yucca; tightly cropped; unsuitable for complete building footprint, north-patio trace or canopy-gap placement |
| IMG_2208 | Close local path/lawn/door/hedge ordering on poolward west frontage | Roof fills foreground; planting and crop hide ends; pool cropped; no exact boundary or whole-building dimensions |
| IMG_2202 | Covered-building arch, patterned tile passage, paired iron gates36/34 and shaped lintel | No lawn visible beyond; **not the2363 lawn gateway**; plants hide margins; no calibrated width |
| IMG_2363 | Plain-grid-tiled lane, separate lawn arch, crazy paving/lawn beyond, adjacent brown private patio door | Foreground house walls/crop hide overhead passage; roof perspective/shadows/planting obscure ends; no direct identity with2202 |
| Private01 | Older April2021 local lawn/plinth/path and facade details | Screenshot/UI/crop; person/cactus/hedges obscure ground. Date differs from2026; unsuitable for dimensions or whole court location alone |
| Private03 | Higher-resolution counterpart of2208 local west doors/path | Duplicate viewpoint; same obstruction/crop limits, not independent anchor |
| Private04 | Higher-resolution counterpart of2207 local roof/yucca/patio | Duplicate viewpoint; mostly foreground roof, not whole footprint |
| Private05 | Higher-resolution counterpart of2206 western stair/face/doors | Duplicate viewpoint; foreground facade/planting hide ends |
| Private06 | Higher-resolution counterpart of2205 east facade/gate | Duplicate viewpoint; pool/foreground crop limits |
| Private07 | Higher-resolution counterpart of2204 broad courtyard/facades | Best broad view, but hidden patio divisions remain hidden; no extra independent camera calibration |
| Apple02 | Courtyard surrounding rows, upper roof projections, path/lawn relationships | Melted walls, canopy/vegetation occlusion; no precise dimensions |
| Apple07 | Looking toward eastern rows/Picasso parking and separate aisles | Oblique depth compression, distorted houses/trees; no reliable access widths |
| Apple08 | Three western upper balcony canopies and relation to Dalí | Distorted eaves/walls and trees; existence/order only, not surveyed edge/height |
| Apple09 | Opposite oblique context, western roofs and lawn/path ordering | Tree/roof occlusion, distorted surfaces; no concealed ground layout |
| Additional2361 /2203 |2361 repeats36/34 gates from above;2203 shows CALLE ELENA plaque and opposite passage exit | Useful topological bridge between2202 and2363, not a measured baseline |

None of the requested repository rasters is rejected as globally too blurry to identify these broad features. The map screenshots and Apple surfaces are too blurred/distorted for fine wall-toe/door-width measurement; the listed obstructions and crops are measurement-specific limitations. Identifying a subject does not calibrate a camera. Phone accuracy is about ±3.4 m for2204, ±4.7 m for2205–2208/2363, ±5.3 m for2202; pins locate cameras, not subject corners. No GPS pin was moved to force a match.

Audit source inspection is recorded here separately from render-versus-photo checks. Seven new audit comparability records in data/photo_checks.json link the committed IMG2202/2204–2208/2363 high diagnostics; all seven are not-comparable. The high captures crop or omit key original-photo subjects and do not reproduce the original eye height/pitch. They do not complete the older build tasks’ verification. The additional current/estimated-fit-IMG_2204.png reuses the earlier model-pool camera fit for gross feature order; because the model pool supplied its fit, it cannot independently validate that same pool geometry. Current overview/oblique renders are diagnostic. A check without calibrated pose must be `not-comparable` for a claimed photographic match; an estimated image fit or a successful browser traversal is not promoted to `matches`. Earlier manual reviews remain documented; missing entries in the newer photo-check dataset do not mean nobody previously reviewed the work.

Follow-up issue: [#98 — unresolved ground edges, widths and projections](https://github.com/daveyboyc/villacana-venture/issues/98). Private comparison PR: [villacana-reference#5](https://github.com/daveyboyc/villacana-reference/pull/5).

## Reproduction, review and disposition

```
python3 scripts/audit_north_pool.py \
  --reference ../villacana-reference \
  --private-out ../villacana-reference/uploads/north-pool-audit-2026-10-18
```

The script writes observations/results diagrams without mutating runtime map/geometry. Source SHA256 hashes are in measurements. Water landmark windows and manual picks are retained, so another reviewer can challenge them rather than accept a hidden image fit.

An independent source reviewer inspected the actual maps/photos separately from this implementation and confirmed the entrance distinction and source limits. A second pass against the saved overlays/measurements is recorded in [review-and-validation.md](review-and-validation.md). No plan correction is approved merely because its coordinates remain unchanged.

**Map accuracy:** broad arrangement is supported; absolute accuracy, full footprints and narrow access widths remain unverified. **Photographic agreement:** visible feature/order evidence is recorded; no calibrated photographic match is claimed. **Software:** see the separate validation record; passing it establishes consistency/usability, not real-world fidelity.
