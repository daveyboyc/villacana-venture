# Silvia outdoor path to the pool

The owner asked about the uncovered path from the tunnel toward the pool entrance.
This pass separates its plain four-column terracotta paving from the decorated
square-and-insert floor inside the tunnel and the irregular stone forecourt on
the pool side of the iron gate.

## Source observations and change

Full IMG_2189 and IMG_2334 show straight, lane-aligned plain squares, broad dull
grey/beige mortar, varied salmon/red-brown tones and worn/damp patches. Four main
columns run across the narrow lane; small blue/cream inserts belong to the roofed
passage. IMG_2334 and IMG_2192 show irregular grey/buff stone and a flush grate
inside the pool entrance. Satellite imagery supports general corridor/lawn order,
not these tile details or the exact concealed connection.

The existing lane patch stopped at gate-local along11.4m, short of the provisional
tunnel side approach. Its visible surface/mask now continues to16.2m within the
open corridor, clear of original house footprints and existing planted beds. A
plain outdoor material covers the existing apron and exterior part of the tunnel
slab, ending at the estimated arch plane. Registry houses, pool/gate/bench/tunnel
transforms, bed outlines, structural collision, terrain and route axes are retained.
The main map displays the same bounded patch and approach.

The new atlas has four columns, broad neutral joints, faded terracotta, fine pitting
and patchy wear. The lane and apron share lane-relative texture coordinates. Their
small taper interpolation difference is at most .0022 atlas units (1.11 pixels in
the512px atlas) at the three sampled points. This is a visual approximation, not a
surveyed pitch or seam calibration.

## Review artifacts

- `toward-pool-*.png`: identical illustrative first-person cameras along the lane.
- `outdoor-floor-*.png`: same lane camera with a downward floor view.
- `tunnel-threshold-*.png`: same exterior camera facing into the tunnel.
- `IMG_2334-*.png`: stored reviewed source camera/look-at; uncalibrated diagnostic.
- `surface-check.json`: actual canonical main-app first-hit surfaces and UV checks.
- `source-checks.json`:17 source/clearance checks.
- `independent-review.md`: separate full-source and implementation review.
- `placement-gate.txt`: unresolved measured-placement failures; no policy weakened.

The source gateway association between2189 and2334 remains unresolved. The lane
continuation, side approach, arch material boundary, tile pitch, mortar and wear
are estimates. Facades and plants remain schematic. Existing tunnel-host, gate/
pool-spacing and forecourt-extent discrepancies stay open; this task remains in
progress in the evidence queue. No exact photographic match or new measured
placement approval is claimed.

## Main integration: survey terrain

MainPR120 (`548b3e3`) landed during this pass. Its survey grid and new tunnel datum
are retained unchanged. Fresh first-hit checks caught the former flat/noDrape
lane and garden patches below that ground. The lane now refines its existing
surface over `siteY`; only the existing garden fragment receives the positive
survey-height difference from its tunnel datum. Its existing ring, material UVs,
beds, collision and the indoor slab remain unchanged. No new slope or level data
is authored here. Garden/slab UV phase is retained, but the new survey introduces
a vertical ground-height difference beyond the exit; this pass does not claim a
measured seamless level transition there.

The original paired images retain the material-only review snapshot. Additional
`*-after-lidar.png` and `render-results-after-lidar.json` show the combined main
scene after this visibility adaptation. `surface-check.json` is rerun on that
combined code. The prior survey changes are not attributed to this paving pass.

A deeper passage check also caught generic survey ground showing through the
far interior floor. The main ground sheet now has a hole exactly matching the
existing study slab footprint (only when that footprint is in the rendered
sheet). The actual slab, inset, doors and walking datum are retained. Extended
rays sample interior stations3,4,5,6,7 as well as the near entry, so preserving
just the first rows cannot conceal a deeper floor regression.

The first combined garden view exposed sky under the raised ground edge. A visual
cut-edge fill now closes the exact guarded slab-mask perimeter between existing
slab and survey heights. It uses the existing ground paint, adds no collision,
and changes neither top surface nor datum. A horizontal ray below the raised
edge and a replacement garden capture verify closure. The approximately0.23m
model level discrepancy remains explicitly unresolved.
