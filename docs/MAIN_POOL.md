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

## Seaward slope (2026-10-13)

The lawn now rises evenly from pool level to the paseo: 3 m over 22 m, about
1 in 7, with no wall or step at the beach. The slope is measured from the mapped
paseo line (`levels.seawardSlope` in `data/main_pool.json`). It is uphill to the
beach only because the model keeps the beach and paseo at street level; a
gentler, truer slope needs the whole seafront lowered, which has not been done.
Pool names in the 3D overview sit just north of each pool so they do not cover
the water.
