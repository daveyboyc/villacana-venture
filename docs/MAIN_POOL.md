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
- Two tall white triangular walls stand above the west restaurant block
  (`roofFins`). As read from the photos, the front one peaks at the west end,
  where the weathervane is, and the one behind peaks towards the middle. Heights
  are estimates; the weathervane and awnings are not modelled.

A link can now start the walk anywhere: add `&at=x,z` and optionally
`&look=x,z`, in the master map's turned-frame metres. For example
`slice.html?pool=main&at=-66,92&look=-72,64` stands on the lawn facing the steps.
