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
  said Calle Jorge meets Guillermo on the level and the ramp starts just past it, so
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
