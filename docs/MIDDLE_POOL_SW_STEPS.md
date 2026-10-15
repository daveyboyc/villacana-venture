# Middle pool south-west steps — issue #31

IMG_2333 shows three stone treads with white risers on the raised-planter side
of the path, with a terracotta ramp alongside. Both reach the same tiled
landing before the white gateway; two black iron leaves stand open along the
lane edges. IMG_2332 locates the west planter and the approach around the pool.

`data/middle_pool_sw_steps.json` describes the gateway; the local rise and its
extent live in `data/terrain.json` under `localAccessRuns`. The dedicated
`src/middle-pool-sw-steps.ts` uses that one record for the meshes and player
ground. Steps rise 0.15 m three times; the adjacent ramp gains the same 0.45 m.
The map and collision use `middleSwRings()` for the gateway piers and open
leaves; the map also draws the three riser lines. Planting stays in Details.

The frame follows the existing Eva segment leaving the pool junction towards
Dalí, beside the already built planter. No pool, registry building or existing
planter outline moves. A small additional review band suppresses generated
walls/props around the photographed entrance. Meshes opt out of draping so the
steps and landing keep their specified elevations.

## Accuracy limits

Positions, rise, tread depths, path width, landing length and gateway dimensions
are estimates from photographed tiles, not measurements. IMG_2333's camera
pin is ±3 m and its heading does not agree exactly with the route alignment;
IMG_2332 is ±14 m. Camera-pin renders therefore do not prove a surveyed match.

The photos do not establish the grade beyond the gateway. A provisional 3 m
smooth tie-in returns the end of this short access to the old terrain datum.
That tie-in is a modelling seam, not evidence of a downhill ramp or a complete
reconstruction of Calle Eva. The broader land level should be corrected when
additional evidence establishes it. Dalí's existing 0.5 m rise, the middle pool
datum and the lower main pool remain unchanged.

`check_middle_pool.py` covers evidence, piers, opening and route/registry
clearance; `check_terrain.py` covers rise and gradients. The layout browser test
samples exactly three risers, walks a player up/down them and through the
open gateway in both directions, and checks that ramp and steps share a landing.
