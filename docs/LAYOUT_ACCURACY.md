# Layout accuracy before decorative detail

The working priority is structural layout: Calle axes and usable paths, registry
house footprints, patio/enclosure boundaries, photo-backed walls, openings and
changes in level. Default **Layout** views omit decorative clutter. **Show details**
is optional and is not a claim that every procedural object matches a photograph.

## Corrections in this pass

- Large buildings were routed through the terrain's flat-surface refinement. That
  rebuilt geometry without material groups; meshes using separate roof/wall
  materials then lost their drawable groups and appeared missing/transparent.
  House-tagged objects now keep one level datum and their original geometry.
  Refinement also preserves material groups for surfaces that legitimately bend.
- House and enclosure fills in the flat map are opaque. House outlines are distinct
  from dashed zero-storey enclosure outlines; no floor-count opacity implies a
  missing building. Long Calles repeat their names so cropped views retain labels.
- Zero-storey registry parts identify yards/terraces, not solid houses. They now
  show paving and their outline, rather than an invented 1.1 m solid volume. Their
  full footprints no longer act as solid house collision. Photo-traced patio walls
  retain their own geometry and collision. Untraced enclosure edges are not asserted
  as actual walls or surveyed property boundaries.
- The 3D layout has visual route markers and a nearby-route name while walking.
  Map objects, generic wall blocks/gates, scatter planting, invented porches and
  furniture are omitted by default. In Details, all named road corridors, the Dalí
  shared footpath, paseo and gate connection use a shared decoration-clearance
  guard that includes the visible object's radius. This protects the entire path,
  rather than only filtering the centre of an object near a ramp. Generated wall
  details stay illustrative and do not change structural collision when Details
  is selected; only the traced walls and original solid houses do that.

## Coastal wall and door: IMG_2297

`data/coastal_gate.json` records the three visible structural parts: a white
plinth with rigid metal mesh, a narrow dark pedestrian gate and a taller solid
white wall. IMG_2284, IMG_2296 and IMG_2297 corroborate the arrangement. A fresh
focused satellite view checked on 13 October constrains the coastal-end enclosure.
The final Dalí road/fence points and asphalt end area have been refitted inside
that boundary. Earlier Calle connections and original house/pool rings are kept.

The map and 3D scene share the wall lines and gate opening. The gate starts closed,
as photographed, and blocks walking. Near it, **Open coastal gate** rotates the
leaf out of the opening and clears gate collision; closing restores it. Wall and
mesh/plinth collision remain intact. A marked short connection joins the mapped
paseo. Inspect it using the **Coastal gate** link in the 3D view.

The gate is about 1.1 m wide; the taller wall/gate are modeled about 1.9 m high and
mesh sits above a 0.45 m plinth. These dimensions and the plan trace are estimates,
not measured from calibrated photographs. The connector and parking-end trace
remain at approximate 1–2 m map precision. Do not describe this pass as a surveyed
reconstruction. The photos support which parts exist and how they relate.

The old single parking ring contains self-intersections and separate bay runs
linked by zero-width edges. `parking.bayRings` stores valid components, preserves
all the earlier bay runs and clips the seaward tail to the end enclosure. The 2D
and 3D renderers and bay checks use these components; the legacy ring is retained
for older consumers. Do not discard small/independent runs by keeping only the
largest polygon when repairing that ring.

## Reproducible checks

```bash
npm run build
python3 scripts/check_street_layout.py
python3 scripts/check_boundary_reference.py
python3 scripts/check_terrain.py
python3 scripts/check_dali_threshold.py
npx playwright install chromium
npm run test:layout
```

The browser test starts its own local Vite server. To use an existing system
Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Screenshots
are written to the ignored `layout-checks.local/` folder. The test walks all 18
mapped streets plus the shared footpath and gate connector in both directions,
using the real Player, site/seaside ground sampling and structural collision.
It checks closed/open gate collision and the control, opaque house material-group
preservation and ray visibility, refinement group coverage, and removal of an
actual sprite whose footprint would obstruct a route. It also renders the map,
Cervantes and coastal gate without runtime errors.

Original house/pool footprints are compared before publishing. Map checks validate
geometry compatibility; traversals validate movement. Neither establishes exact
real-world dimensions or photographic fidelity of every frontage.

## What still needs verification

Many enclosure walls have not yet been traced individually. Some covered passages
remain marked likely from registry/aerial context. Elena's steps beside its ramp
are now built (docs/ELENA_NORTH.md); their tread sizes are estimated. Site and big-pool
levels retain their existing estimated dimensions; this pass preserves their
recent corrections. The beach/sea outline disagreement flagged for IMG_2285 is
still a review item. Keep those limits visible; do not fill them with repeating
walls, extra scenery or unverified entrances to make the model appear finished.
