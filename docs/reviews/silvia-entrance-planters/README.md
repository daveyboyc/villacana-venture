# Silvia tunnel and pool entrance planters

Owner correction, 24 October: the required work is the planters immediately at
the Silvia covered passage and the pool entrance. Baseline main is
`9735d000f9e3e3b7b819285cbaa339f2a538d37f` (PR115).

Full IMG_2190/2191 establish four terracotta pots inside/at the covered passage.
They remain. Beyond the garden arch on photo-right, IMG_2190 shows low pale
edging around strappy planting and a tree pocket. The two former illustrative
tall garden pots are unsupported containers and are replaced by finite garden
planting and the bounded observed right kerb/soil fragment. The left base is
heavily occluded and may be a plinth/arch return, so only its visible greenery
is represented; no matching structural left bed is asserted. A finite near
terracotta path continues between them, without a new remote gate or garden
perimeter. The remaining courtyard is still incomplete.

At the pool entrance, IMG_2334/2335/2192 show rounded rendered returns beside
the recessed bench. The existing two raised-bed pieces gain a white rim and
recessed soil, with .14 m corners rounded *inside* their previous bounding boxes.
The corner radius and .09 m coping thickness are estimates. Bench/panel,
cabinet end, gate frame, pool/house outlines, street axes, terrain and existing
tunnel transform are retained. The source's opposite hedge has a separate LOW
weathered grey/beige kerb face, visible particularly in IMG_2192. Only the
current 1.5 m hedge fragment receives estimated .13 m high edging; it does not
extend across the mapped Eva crossing. Real hidden continuation remains open.

## Satellite and source review

Inspected public georeferenced Esri ground imagery and the existing zoom-20
mosaic/frame, plus actual private Apple south-half and Google lane-name satellite
screenshots. The lawn/approach, planting masses and courtyard/roof arrangement
are visible. Small bed bases/hidden backs remain concealed by foliage, shadow
and roof projection. The zoom-20 fetch date is 23 October, acquisition date
unknown. No new measured footprint or pool/gate relocation is justified.

`satellite-planters-overlay.png` labels the current model on the existing public
Esri image. Orange marks new finite low-bed fragments; it is a model diagnostic,
not an aerial trace or placement approval. `plan.svg` is a source-relative model
schematic, with no asserted connection between tunnel and pool panels. The left
schematic box denotes a foliage region, not a traced structural bed.

Independent full-source inspection, interpretation corrections and final render
review are in `independent-review.md`. The entrance reference pack adds T15/T16
and A14 locators; these keep the old PR108 model snapshot historical and never
award placement approval. Private map pixels/crops remain private.

## Render comparisons

Five actual canonical-main-app camera pairs show the tunnel entrance, garden
arch, pool gate, reverse forecourt and bench. They are illustrative first-person
bookmarks with Details, not calibrated source cameras. Tunnel garden view is
from local z3.6, looking toward z10.2. Source camera/heading uncertainty and the
unresolved host association still prevent a photographic match.

IMG_2334/2335 pairs use their stored reviewed camera/look directions. Their
before files reuse the committed PR115 renders byte-for-byte from baseline main
(the scene code is identical), avoiding another synthetic baseline. New after
captures come from this task. The report is `not-comparable`: schematic foliage,
tile-panel artwork, procedural surrounding facades and uncalibrated pose remain.
All prior discrepancies, including pool spacing/tunnel host direction, remain.

Map, structural collision and 3D use the same bounded bed polygons. The unbuilt
left base has no solid footprint. Planting is Details-only and its full visible
radius clears both the garden axis and named routes. Keep the task in progress:
software tests and independent source-detail review do not supply missing
measured placement packets. Final validation is recorded in `validation.json`.

## Validation and publication limit

Production build, 60 Python tests, 17 source/terrain/level checks, the layout
browser test (20 routes / 436 segments, both directions), overview/mobile
controls and photo-map/mobile navigation pass. Generated references and the
46-component source inventory are current. The private contact-sheet companion
is villacana-reference PR12.

The placement gate still fails: missing measured independent packets and hidden
bases cannot be repaired by software tests. See `placement-gate.txt`. This remains
a provisional source-detail build under the owner's ongoing main-map review; it
does not resolve any placement discrepancy or mark the geometry task done.
