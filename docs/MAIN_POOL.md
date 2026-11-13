# Main pool reference pass

Reference: five web photographs supplied by Dave on 2026-10-12, including
Villacana Playa and villacanaholidays.co.uk watermarked views. Used by eye;
the source photos are not bundled in the public site.

The large turquoise pool and dark-blue toddler pool retain their Catastro outlines.
Cream stone paving surrounds both; terracotta paths lead to a seaward lawn with
tall palms, blue loungers and cream parasols. Bird-of-paradise clumps and spiky
planting sit beside the toddler pool and white restaurant terraces. The terraces
receive glazing, white balcony fascia, blue awnings and cafe furniture.

Object positions are approximate visual placements, explicitly recorded in
data/objects.json. Restaurant facade details are illustrative, anchored to the
existing registry footprints, not a measured reconstruction of elevations.
The existing OSM coastline provides the sea and beach. No glass pool fence is
added, following Dave's earlier choice.

Open slice.html?pool=main for the new walkable area; Overview shows its layout.

## Platform and lower deck

The main pool and children's pool now sit below the street-level restaurant
platform. The curved terrace footprint is a walkable roof over the lower glazed
frontage, with café furniture and awnings above. Steps at the restaurant end and
a separate ramp at the seaward end connect the two levels. Pools, paving,
plants, furniture, pool-floor movement and jump landings use the same offsets.
The overview and reference map include editable platform, steps and ramp labels;
3D reference placement intersects the actual surfaces.

Dave confirmed this arrangement and the five web photos show the two storeys.
Google satellite/standard maps corroborate the footprint and restaurant positions.
The **3 m drop, 18 steps, access widths and ramp endpoints are approximate**,
not elevations measured by the Google API. The seaward lawn grading back into
the existing terrain is also an illustrative join, pending closer photographs
or measurements. `data/main_pool.json` stores these assumptions separately from
the original registry footprints. Derived surface rings cut access openings and
keep mapped lanes and houses on their existing level. The recent south-pool
objects and sea wall remain included from main.

Validation: production build, all 18 mapped streets in both directions, steps and
ramp in both directions with jump landings, and separate main/children's/south
pool floor checks. The Google key remains only in the existing ignored private
environment file; this change contains no API key or Google imagery.

## Beach and sea levels (2026-10-13)

From Dave: the big pool is level with the beach, the beach falls gently to the
sea, and the sea is lower. So:

- The pool lawn runs out level onto the paseo and the sand. No wall, no step.
- The beach falls from the paseo to the waterline (about 0.7 m in front of the
  big pool), and the sea surface lies 0.6 m below pool level.
- Barraka stands on the sand at beach level.
- The paseo is at pool level in front of the big pool and Barraka, and climbs
  back to street level towards the south pool (3 m over 34 m) and to the east.
  Beside the south pool it is level with the lawn, as the photos show.
  (Corrected 2026-10-14: IMG_2349 and IMG_2350 show it about 1 m below the
  lawn, behind a sandstone retaining wall; see docs/SEAFRONT.md.)
- Where the land behind the paseo is higher, a plain bank holds it back.
- Calle Guillermo now ends at the top of that bank; the way down to the beach is
  the pool ramp or steps, then across the lawn.

The heights are in `levels.seafront` in `data/main_pool.json` and are estimates,
not measurements. `src/seaside.ts` turns them into the ground seaward of the
paseo; the flat ground sheet is cut away there. The master map is unchanged.
Pool names in the 3D overview sit just north of each pool so they do not cover
the water.

## Steps to Enrique's and the roof walls (2026-10-13)

From Dave, with two web photos:

- The way up to Enrique's at the west end of the platform is a flight of
  steepish steps that curves at the top, not a ramp. The satellite photo shows
  the treads fanning round the curve and a straight lower flight below it.
  Eighteen terracotta steps between white walls now follow that line from the
  platform down to the pool deck (`levels.enriqueSteps`): 3 m down over 8.3 m.
  The platform's narrow west tip is cut back to where the steps begin. Width
  (1.4 m) and the number of steps are approximate. The old ramp along Calle
  Guillermo is gone. Flights of steps can now bend (`accessSection`).
- Two tall white swooping walls stand above the restaurant (`roofFins`), taken
  from the square-on photo from the lawn. The west one, over Enrique's, is
  highest at its west end and swoops down to the middle. The east one is highest
  where it meets the first and falls gently along the rest of the building. A
  tall white block stands at the east end, where the weathervane is. Sizes are
  read off the photo against a 3 m storey; the weathervane, awnings and the
  "Bistro Enrique's" sign are not modelled.

A link can now start the walk anywhere: add `&at=x,z` and optionally
`&look=x,z`, in the master map's turned-frame metres. For example
`slice.html?pool=main&at=-66,92&look=-72,64` stands on the lawn facing the steps.

## Steps to Enrique's: walls and planting (2026-10-13)

From Dave's web photos: the steps are now 2 m wide; the west side is a tall
white wall with a clipped hedge on top (`enriqueSteps.tallWall`); the pool side
has a planting bed held by a low curved white wall (`enriqueSteps.bed`) with
two yuccas and a bird-of-paradise, and a tall palm stands on the lawn at the
foot (`data/objects.json`, ids `enrique-steps-1` to `-4`). Shapes and positions
are approximate. The bed wall does not block the player. Plants and the hedge
show only with "Show details" on.

## Calle Guillermo runs down to the paseo; the east steps (2026-10-21)

Dave's Apple Maps 3D screenshots (private `villacana-reference`, apple-maps/10 to 13)
showed two things the model had wrong.

- **Calle Guillermo ends in a ramp down to the paseo, not on a bank.** The lane runs
  down to the paseo between the house gardens and a white wall on the lawn side.
  This replaces "Calle Guillermo now ends at the top of that bank" above. Dave then
  said Calle Jorge meets Guillermo on the level and the ramp starts just past it, and
  that it is a smooth ramp with no steps, so
  Guillermo stays at street level to the Jorge junction and falls from 0.66 m past
  it (clear of Jorge's paving) to paseo level at the lane's foot: 3 m over 15.5 m,
  about 19 %, then runs on level through the gateway to the paseo. Its heights are
  road `heights` in `data/street_layout.json`, as for the Cervantes ramp, and the
  road carries `maxGrade` 0.2 for this documented steep ramp (other lanes keep the
  10 % limit). A 0.5 m white parapet stands on the lawn side; on the garden side a
  white face holds the street-level gardens back. (An earlier version of this task
  sloped the lane from the foot of the Enrique's steps and ramped Jorge down to meet
  it; Dave's correction replaced that.)
- **The kiosk at the foot** (registry part `6364501UF1366S_part2`) stands on the
  lowered lawn, not 3 m up on street-level ground, and the old street-level channel
  past it to the beach gate is lowered with the lawn.
- **The east steps** are a narrow (1.1 m) flight from an opening in the white wall
  along Calle Pintor Picasso, between the curved 90 Miles terrace and the long white
  building on the east side of the lawn, down to the paving north-east of the
  toddler pool. They replace the wide flight off the restaurant roof; the lobe's
  facade returns to its registry line where that flight was cut into it.
- **The corner garden and the east end of the paseo wall.** On a render of the corner,
  Dave said the sandstone wall is not that tall (about 3 m in the model). The garden
  behind the wall's east end now falls from street level at the house fronts to 1 m
  above the paseo at the wall (`levels.gardenFall`), so the wall stays about 1 m all
  along, as IMG_2227 suggested (issue #40).

`data/guillermo_slope.json` holds the inputs, evidence and trust;
`scripts/build_lowered_lanes.py` derived the outlines from it once (needs shapely):
`levels.lowerArea` (now with the lawn strip beside the lane, the kiosk and the old
channel, never a lane's centre line), `surfaceRing`, `terraceRing`, `steps`,
`gardenFall` and `sheetCut`, the hole cut in the street-level ground for the deck,
the lowered lanes and the falling garden. `src/lowered-lanes.ts` draws the lane walls;
`scripts/check_lowered_lanes.py` checks them.

All heights here are estimates: Apple's mesh shows which way the ground falls, not
how far. The ramp's start is Dave's description, not a measurement; its 3 m comes
from Dave's pool level, so its 19 % grade is only as good as that. The parapet, the
1 m wall and the garden's fall are not measured, and the houses beside the ramp stay
at street level, so the lane passes the last house before the kiosk up to about
2.4 m below it. Placement
of the changed streets and kiosk is unapproved until an independent review.

## The fence and gateway onto the paseo (2026-10-21)

Dave: a fence and a coastal gate run in front of the slope, separating Villacana from
Barraka beach. IMG_2226, from the beach looking north-west, shows them west to east:
a white wall with a tiled panel where the sandstone wall ends (also IMG_2227), a white
round-arched gateway at paseo level at the foot of Calle Guillermo, a short white wall,
then white railings along the big-pool lawn up to Barraka's raised deck.
`data/seafront_fence.json` and `src/seafront-fence.ts` build them 1.75 m inland of the
paseo's centre line, just off the paving; the walls and railings are solid, and the
1.4 m gateway is open (no photo shows a closed leaf). The map draws them and
`scripts/check_seafront_fence.py` checks their order, the gateway's line with the lane,
and that they keep clear of the paseo, lanes, houses and pools. Heights (wall 1.5 m,
railings 1.1 m, arch 2.4 m) are by eye. This replaces "no wall, no step" between the
lawn and the paseo above: still no step, but a fence.

No ground photo shows the slope of Calle Guillermo itself. IMG_2226 and IMG_2227 show
its foot: the gateway at paseo level and the corner house about 1 m above the beach.

## The lawn on the surveyed ground, the lowered edge and the lawn kit (2026-11-12)

Task `main-pool-lawn-ground`, found by looking at the lawn in Inspect
(`scripts/shoot_inspect.cjs` renders Inspect from a fixed orbit camera; `&inspect=x,z,distance,pitch,bearing`
opens Inspect there).

- **Buried lawn work.** `src/main-pool-lawn.ts` built the pink paths, flagstone apron, white walls,
  hedge, shower and bollards at the old flat deck (-3 m) and opted out of the terrain drape, while
  the lawn now follows the laser survey at about -2.2 to -2.8 m. Only the bin tops showed. Every
  piece is now laid on the game's live ground (`liveGroundY`): paths and apron vertex by vertex,
  walls with a level top above their higher end, the step nosings, risers and rail with the same
  survey offset as the flight they sit on.
- **The lowered edge east of the lawn.** The survey grid holds the survey plus the 3 m drop at
  nodes inside the lowered area and the survey alone outside, so a 2 m cell across the edge mixed
  two datums. Where the survey has a real step (Calle Guillermo) that hardly shows; east of the
  lawn, where the ground beyond the edge is at lawn level (-2.1 m against -2.3 m), the draped
  retaining face became a jagged 3 m sliver of beige triangles and the ground sheets bent into a lip.
  `src/terrain.ts` now reads a node across the edge on the querying side's datum when that brings it
  nearer that side's own corners of the cell (the generator holds the pool deck level across both
  sides, so near the restaurant nothing changes). The lawn and street sheets are draped each on their
  own side (`siteYLowered`, `siteYStreet`), and each retaining face runs between the two, left out
  where they meet within 5 cm. The grid file is unchanged.
- **Path end and apron at the gateway.** The first pink path ran 3 m out onto the paseo through
  the gateway, the apron straddled the wall line and one bollard stood on the paseo side. They now
  stop on the lawn side (IMG_2759 shows the path running straight into the gate across the apron).
  The gateway threshold still stands about 0.8 m above the lawn just inland of it, where the
  seafront heights meet the survey (open in `beach-gate-verge`).
- **Lawn kit.** `scripts/build_lawn_kit.py` builds the bollard light (green body on a concrete
  collar, cream diffuser), the slatted wooden bin and a square grey service lid in Blender
  (`public/models/lawn/`, byte-identical rebuilds, 40 kB together), from IMG_2759-2765 and IMG_2603.
  `src/pool-kit.ts` `addKitModel` instances any kit model with a stand-in until it loads. One lid is
  placed from IMG_2761; IMG_2759/2760 show more that their pins cannot place.
- **Enrique's awnings.** One two-sided panel (its lettering read mirrored from the lane side) is
  now the three lettered box awnings IMG_2775 shows, with menu boards and a lantern. The storey they
  hang on is not modelled, so they stand in the air (gap and task `enrique-shop-storey`).

## The gate corner closed, the gate and crossing, the path on the aerial (2026-11-13)

Dave: the slope down has no opening, you can only leave through the gate, and the zebra crossing is
immediately outside the gate.

- **Closed slope.** The corner wall ran to (-11.1, 139.6) and the ramp wall started at (-9.5, 138.0);
  Calle Guillermo ran out through that 2.3 m gap onto the paseo. The ramp wall now starts where the
  corner wall ends, Calle Guillermo ends inside at (-12.2, 137.4) (`data/street_layout.json`, patched
  into `public/map/skeleton.json`), and the inner tiled path IMG_2600 and IMG_2601 show runs from its
  foot along the inside of the wall to the gate (`main_pool_lawn.json` innerPath, terracotta squares).
  `check_seafront_fence.py` now requires the closed boundary instead of the open lane foot, and the
  layout browser test walks down the lane, along the inner path and out through the gate.
- **Gate.** IMG_2602, IMG_2766 and IMG_2485 show square white piers, a rectangular opening with a
  ring-pattern iron leaf, a moulded lintel and a shallow segmental hood with a cornice, and the
  COMUNIDAD VILLACANA sign on the paseo face beside it; this replaces the round-arched slab. Opening
  1.25 m, crown 2.85 m, by eye.
- **Crossing.** The eight bars sit side by side along the paseo and each runs straight across it from
  the gate threshold, centred on the opening (IMG_2766, IMG_2767); they were lengthwise and 0.7 m off.
- **Path and palm against the aerial.** The georeferenced aerial shows the pink path as a 2.5 m brown
  strip running straight from the gate to the pool's south-west corner; the model's line ran 5-6 m
  further east. The tall palm's crown is just west of the path's end, so the path passes on the
  palm's right seen from the gate, as the photos show; it moves there from 10 m away.
- **Kiosk.** Its registry outline matches its pale flat roof on the aerial; the strelitzia and silver
  bush that stood inside it are moved in front of its north corner (IMG_2762), the short left branch
  ends at its north-east wall, and its roof is no longer a tiled terrace.
- **Sand under the lawn.** Behind the lawn the land is lower than the paseo, so the seaside sand's
  inland cells now also stay under the inland ground; they poked up through the lawn inside the gate.

Photo requests for what is still by eye: `guillermo-foot-closure`, `lawn-palm-foot`, `kiosk-faces`,
`enrique-shop-front-square`, and the open `beach-gateway`.
