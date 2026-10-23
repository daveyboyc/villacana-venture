# Tunnel entrance context and pool spacing

The user suspects the gate, bench and planter are too close to the middle pool.
The independent review inspected full gate/bench photos2334/2335, reverse approach
2192, Silvia passage2190/2191, lane2189, both area contact sheets, existing Esri
aerial and Apple/Google satellite screenshots. A focused Esri zoom20 fetch is
also preserved here. Its acquisition date is unknown: fetch date is not image
age, and another zoom is not an independent provider or survey.

The photographs and satellite show a lawn/planted approach between the pool and
pool gate. The actual gate head, bench base and planter ground ends are hidden by
foliage/shadow from above. Nearby registry roof corners lie about3.4m farther
along the lane, but roof projection cannot establish a ground gate position.
There is therefore no support for a measured translation of the assembly.

Current model distances: gate to closest water-ring edge7.58m, bench-front centre
to water6.49m, planter courtyard end5.90m. These measure existing model geometry,
not satellite/photo distances. The original pool, house outlines, gate centre,
bench/planter footprint, street axes, levels and Silvia transform are retained.
A new open `middle-south-pool-spacing` report preserves the user's concern.

The pool's open pergola gate and the covered Silvia1–15 tunnel are separate
structures in the sources. The current approximate tunnel entrance is15.02m
from the pool gate. No source photo establishes their precise connecting identity.
Do not move the bench beside the tunnel or transfer the Jorge fanlight gate.

## Built detail

The PR108 draft's source-backed details were never in deployed main. This pass
transplants its finite left low planted border, separate raised right bed sections
with an open doorway gap, square projecting metal cages over brown shutters, and
four tile columns along the lane. It replaces the generic paving ribbon only in
that surface and suppresses inferred windows/porches locally. Registry-front
attachments constrain the estimate; they do not prove the photograph's identity.
All bed dimensions, grille positions and tile pitch remain provisional.

The existing bench planter now has finite columnar evergreen and geranium-like
planting observed in2334/2335/2192, with full visible radius checked by the shared
route guard. A small pale vented cabinet face follows2192; its contents/services
are unknown. Paired middle-band gate scrolls follow2334, within the existing open
leaves. No cabinet or plant introduces a new walk barrier. Optional planting
stays in Details. All four single tunnel doors with round knobs and mobile
movement/camera controls are preserved.

Map, 3D bed footprints and collision share the same data. Existing gate-frame
positions and the doorway break remain. Exact checks show no new lane bed overlaps
the tunnel floor/apron/walls; source/registration uncertainty is still explicit.

## Evidence and validation

`satellite-current-overlay.png` is the current model on the existing georeferenced
Esri aerial, not a trace or placement approval. Yellow is registry, cyan water,
red gate, green planters and purple approximate tunnel. Script:
`python3 scripts/review_entrance_satellite.py`.

`esri-zoom20-mosaic.jpg` is the raw768×768 tile mosaic with frame metadata.
`esri-zoom20-closeup.png` is a1000×1300 crop over local bounds[-150,76,-100,141];
its own crop bounds are in `esri-zoom20-frame.json`. Never apply raw-mosaic bounds
to the resized crop. Public Esri imagery only; private Apple/Google pixels remain
in the reference repository.

Before/after game views use identical illustrative first-person at/look bookmarks
on canonical main-app scenes. Before is unchanged PR114 code, after this branch.
These are functional scene comparisons, not calibrated photographic matches.
The source-view directions, hidden endpoints, source identity and satellite
occlusions prevent any surveyed placement claim. The source-check history and
all earlier discrepancies remain intact. The task stays in progress pending
measured placement review.

## Final checks

The production build/TypeScript, 60 Python tests, 14 handover source/level/terrain checks,
lane-frontage source check, main-app layout test (20 routes / 434 segments in both
directions), overview/mobile controls and photo-map/mobile regressions pass. All
176 references are reviewed and reference-pack outputs are current. See
`validation.json`, `render-results.json` and the independent source review. The
private contact-sheet companion is villacana-reference PR11.

The placement change gate **fails** because current measured independent placement
packets are unavailable, including conservative shared-renderer context changes.
`placement-gate.txt` preserves the actual output. No approvals, matches or hidden
boundaries have been invented. Original discrepancy history is retained; the task
stays in progress. Software passing does not resolve the owner's spacing concern.
