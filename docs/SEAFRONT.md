# Paseo, beach, sea and Barraka outline pass

Checked online on 2026-10-12:

- [Barraka Beach official website and gallery](https://barrakabeach.com/): thatched-roof restaurant, red/burgundy awnings, shaded dining terrace, and loungers with straw parasols on sand. The virtual-tour position marks the outdoor seating area, not the building centre.
- [Estepona tourism](https://turismo.estepona.es/lugares/barraka-beach/): identifies Barraka on Villacana beach, accessed from Calle Fragata.
- [OpenStreetMap Senda Litoral](https://www.openstreetmap.org/way/1136517334), joined to [the eastern connector](https://www.openstreetmap.org/way/1156611374): the paseo route behind the restaurant and along the resort frontage. The existing project OSM extract supplies the geometry.

The restaurant roof matches Catastro building `6364501UF1366S_part8` on the existing georeferenced Esri aerial. Its surveyed footprint is reused verbatim; no duplicate building is added. The location is different from the OSM restaurant point, which sits in the outdoor seating area. The terrace outline is approximate, informed by that aerial comparison and official exterior photos.

The beach polygon and coastline come from the existing OSM map. A separate view extent frames the local frontage without introducing artificial edges into the sand or water. Shorelines change with season and survey date. The sea's outer rectangle is a display boundary, not a mapped natural feature. The local beach label is Villacana beach; the larger OSM polygon is tagged Playa de Guadalmansa and extends beyond this frontage.

`scripts/build_seafront.py` builds `skeleton.seafront`, shared by the blueprint and main-pool walk. The blueprint adds labelled outlines and a Seafront toggle; Whole block includes the sand and a strip of sea. The Seafront link (`slice.html?pool=main&view=seafront`) starts on a safe mapped paseo point with a wider view toward the restaurant and beach. The main-pool view replaces the former uniform ten-metre sand band with the mapped beach polygon and adds the paseo, restaurant roof and terrace outline.

The existing registry building count, pool outlines, props, and ground classification are preserved. The source photos remain reference material, not public assets.

## Sandstone retaining wall along the paseo (14 October 2026)

Built from IMG_2349, IMG_2350, IMG_2352 and IMG_2354 (on the paseo), IMG_2227,
IMG_2298 and IMG_2299 (from the beach), the aerial and Apple Maps 03. The photos
show the paseo as faded pink stamped concrete about 3 m wide, a timber board on
its seaward edge, and on its landward side a yellow sandstone retaining wall with
a green welded-mesh fence on it and the seafront gardens behind. It is a different
wall from the low white wall with mesh at the Dalí coastal gate (IMG_2281–2284,
IMG_2296–2297), which is unchanged.

### What is built

`data/paseo_wall.json`, drawn by `src/paseo-wall.ts` in any view that shows the
seaside, on the reference map by `src/blueprint.ts` (Seafront layer), collision in
`src/slice.ts`.

| Part | From | Notes |
| --- | --- | --- |
| Retaining wall, about 134 m | IMG_2349–2354, IMG_2227, aerial | Face line traced from the dark wall line along the paseo's landward edge on the aerial, smoothed over about 10 m. Along the south lawn it follows the existing sea-wall trace, so it is the same wall, drawn once. 0.4 m thick, sandstone face with a coping. Solid. |
| Mesh fence on it | IMG_2349, IMG_2350 | Dark green rigid mesh, 1.1 m above the coping, posts every 2.5 m. |
| Timber edge | IMG_2350, IMG_2351, IMG_2352, IMG_2354 | Low board on the mapped paseo's seaward edge, over the same stretch as the wall. |
| Paseo colour | IMG_2350 | The whole paseo ribbon is now the photographed faded pink-red. |

**Extent.** West end: where the stamped paseo meets the pale apron in front of the
coastal gate (IMG_2352 looks west along it; the wall line starts there on the
aerial). East end: the corner garden by the end of Calle Guillermo, where the wall
line turns inland on the aerial and IMG_2227 shows the sandstone band stop before a
planted slope. That is also where the lowered big-pool lawn begins, which meets the
paseo with no wall. The photos show no opening along the run, so none is modelled.

**Height and levels.** The wall's height is not stored: it runs from the paseo up to
the ground behind. Before this pass the paseo was at street level beside the south
pool, so there was no wall height at all where IMG_2350 and IMG_2349 show about 1 m.
Measured by eye in IMG_2350 against the sea horizon and the paseo width (camera
about 1.5–1.6 m up): face 0.9–1.0 m, fence 1.0–1.2 m, paseo about 3 m from wall
foot to timber edge; IMG_2349 gives 1.0–1.1 m against the fence panels. So the
paseo `profile` in `data/main_pool.json` now sits 1 m below street level from turned
x −190 to −110 and rises to street level by −209, just short of the coastal gate
connector. The wall is therefore about 0.4–0.5 m at the Dalí end (IMG_2354 and
IMG_2352 show it low there), 1 m along the south lawn and the houses east of it,
and grows to 3 m over the last 40 m, where the existing descent to big-pool level
(unchanged) takes the paseo down. `src/seaside.ts` lets the beach heights reach the
foot of the wall face instead of a fixed 1.8 m from the paseo line, and drops the
plain bank where the wall stands.

### Checks

- `python3 scripts/check_paseo_wall.py`: evidence indexed, the 3 m paseo, every lane
  and the coastal gate connector clear, no house or pool crossed, clear of the end
  of Guillermo and of the lowered pool lawn, height about 1 m by the south lawn and
  low at the Dalí end, and the south lawn's sea wall on the same line.
- `python3 scripts/check_pool_levels.py`: the paseo beside the south pool is now
  checked to be about 1 m below the lawn, and at street level where the coastal
  gate connector meets it.
- `npm run test:layout`: the wall is solid, the ground steps about 1 m across it by
  the south lawn, and the paseo walks both ways from the Dalí end to the Barraka
  boardwalk with the wall's collision.

### Limits

- Plan position about 1–2 m. Where the aerial puts the wall on the mapped (OSM) paseo
  line, it is held 1.8 m in from the line so the modelled paseo keeps its width;
  where it is up to 4.6 m in, a sand strip lies between the paseo ribbon and the
  wall that the photos do not show. Re-tracing the paseo line from the wall would
  fix both; not done here because the paseo is shared OSM data.
- The east end height: the model makes the wall up to 3 m over its last 40 m, but
  IMG_2227 from the beach suggests about 1 m there. The big-pool lawn level (Dave)
  and the photos disagree; no photo from the paseo near Guillermo yet.
- Not modelled: the hedges on the garden side (IMG_2349), the green windbreak cloth
  on parts of the fence (IMG_2350, IMG_2352), the lamp posts, the drainage holes and
  the service cover (IMG_2354), the board pattern in the concrete.
- The south lawn's sea wall keeps its returns at both ends and its collision; its
  stretches along the paseo are now drawn as this wall. Whether a white parapet
  shows on the lawn side is not settled.
- Further east the mapped paseo passes 0.64 m from a registry house
  (6465801UF1366N_part5), so the browser walk stops at the Barraka boardwalk.
