# Front patios, lawns and Calle paths

The current resort model is not a complete reconstruction of every frontage.
Buildings/pools use registry footprints and the main street axes are cross-checked,
but the original courtyard cover expands lawns by rules and generates repeating
wall blocks and gateways. That does not establish individual patio/lawn boundaries.

This pass introduces `data/frontage_divisions.json` for explicit, photo-backed
surface regions and white lawn edging in the Cervantes/Elena junction and western
Cervantes lane. It separates two small front lawns, a planting strip, a paved
front enclosure and the entrance approach between lawns. The Calle paths keep
using the existing checked street geometry. Photos IMG_2260/2261/2263 show the
lawn/white-edge/path relationship; IMG_2273/2274 show the planting and tiled lane.
Satellite context and the registry enclosure constrain the approximate outlines.
The ring extents and curb dimensions are estimates, not a measurement survey.
The paved enclosure’s detailed surface/use remains less certain than the two lawns.

Both the reference map and pool scene consume the same regions and borders.
The ground-cover build preserves these distinctions rather than smoothing them
into a general courtyard lawn. Generated wall blocks inside the reviewed surfaces
are suppressed in these views. The low curbs are visual surface divisions and do
not add collision fences or close the entrance. Buildings, pool rings and checked
Calle center lines stay in place.

Use **Patios & lawns** on the reference map to zoom to this reviewed section.
The legend distinguishes front patio, entrance approach and white edging; each
new reference label can be edited and attached to a photo in the usual editor.
Other frontages, including much of Dalí’s house-side lawns and the remaining pool
courtyards, still need individual tracing. Do not interpret these five reviewed
regions as verification of the entire resort or proof of legal parcel boundaries.

## Cervantes patio wall test

`data/cervantes_patio_walls.json` adds continuous white patio/planting walls along
the photographed western Cervantes section, from the Dalí entrance through the
Elena junction. Photos IMG_2263–2265 and IMG_2273–2275 distinguish those taller
walls beneath planting from the low curbs around lawns. The wall traces follow
this checked lane and are trimmed against registry facades, the Elena paths and
the recorded lawn door approach. Where the house itself bounds the path, another
wall is not placed through the facade. The map marks entrance openings and the
same wall lines provide visible meshes and collision rings in the pool scene.

The wall top is approximately 0.65 m above the path, with estimated 0.20 m
thickness. Vegetation obscures some edges, so these are a reference-based test,
not surveyed dimensions. The meshes follow the existing Cervantes ramp elevation.
Generated wall blocks, gateways and broad veranda columns are suppressed inside
this reviewed lane band. Unphotographed eastern frontage walls remain unasserted.

Validation: wall/photo/route/opening checks, all 18 streets walked both directions
with the real Player and new collision rings, sprint/jump blocked at the wall,
map/editor and pool-scene rendering without runtime errors, and production build.

## Dalí parking / Cervantes entrance separation

Fresh focused Google satellite and standard map views were checked on 13 October
2026 against IMG_2267, IMG_2268 and IMG_2275. The ground photos establish the
surface order: asphalt parking bays, a narrow grass band, a shared tiled footpath,
then building/private frontage. The satellite view also shows a tiled Cervantes
crossing through the parking bays to the aisle; it is not an asphalt lane.

`data/dali_cervantes_threshold.json` records separate polygons for those surfaces
in the entrance test area, about 18 m either side of Cervantes. The shared footpath
bends/narrows around the unchanged registry facade corners; the grass strip narrows
or disappears there. White kerbs stop at the crossing. Bay paint is clipped to the
reviewed asphalt in both the map and 3D scene, and Cervantes patio walls start
beyond the shared footpath. The classified cover uses the same surface distinctions.

The overview's dashed private-front edge and editable labels identify where the
shared path ends and the buildings/private walls begin. That dashed line is a
reference boundary, not an extra physical wall or a surveyed ownership boundary.
Approximate widths/edge placement remain at roughly 1–2 m source precision. The
remaining Dalí frontage still needs tracing rather than extrapolating this test.

Procedurally generated white patio tables and chairs have been removed from the
pool/reference scene. The latest main-branch covered passages and removal of
invented veranda columns are preserved. Validation includes source/photo and
facade/wall/kerb clearances, walking the shared footpath both ways, all 18 streets
both ways, wall collision, map/3D rendering and a production build.
