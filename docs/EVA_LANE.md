# Calle Eva: the tiled lane as photographed

Task `eva-lane-details` (6 November 2026). Before this, Calle Eva was the generic 1.2 m
terracotta ribbon with a thin white edge, laid over the tiled ground sheet. The house fronts
ran straight down to it. The photos show a lane that is distinct and consistent from end to end.

## What the photos show

| Photo | Where | What it shows |
| --- | --- | --- |
| IMG_2504, IMG_2677, IMG_2676 | east stretch, looking south-west to the middle pool east gateway | four big square tiles across with pale grey joints; grey exposed-aggregate margin each side; white rounded kerb and clipped hedge against the house (left); flush lawn (right); a two-tile spur across the lawn towards a brown door; the path centred on the gateway opening |
| IMG_2336 | east stretch, looking north-east | the same lane; lawn on the left with the only lantern about 16 tile rows (9-10 m) ahead; kerbed bed on the right |
| IMG_2503 | north-east end of the lawn, by the Teodoro Rojo junction | a kerbed bed with a clipped oleander, the lantern and the round clipped tree just behind it |
| IMG_2553, IMG_2551 | west stretch, from the Dalí end and back towards it | kerbed lawn island with a strelitzia on the north-west side, kerbed bed with low hedge edging and bare soil on the south-east side |
| IMG_2552 | west end | the path curving onto the Dalí car park between white kerbs, a rust-red slot drain across it, lawn and lantern |
| IMG_2549 | west stretch towards the middle pool corner | a raised white planter against the north-west house; the south-east house wall right at the margin |

## What is built

`data/eva_lane.json`, drawn by `src/eva-lane.ts` in the scene and by `src/blueprint.ts` on the map.
Each run has an axis; `s` is metres along it and `c` metres to its right (south-east on both).

- **Tiled band:** 1.72 m, four tiles of 0.40 m with 0.03 m joints, in a drawn texture (no photo
  pixels). **Margins:** 0.14 m of grey aggregate each side. Both are flush with the walking height.
  This is checked in the browser test.
- **Kerbs:** white, rounded, 0.12 m wide and 0.12 m high. They run along the kerbed beds and
  lawns, with returns where the photos show a bed end.
- **Beds:**
  - East: a 0.83 m bed against the house from the gateway to the junction.
  - East north-east end: a small bed in the lawn.
  - West: a deep bed (2.5-3.6 m) in front of the south-east houses.
  - West: a 0.42 m raised planter against the north-west house.
- **Lawns:** a flush strip along the east lawn edge, and the kerbed lawn island at the west end.
- **Door spur:** the two-tile spur across the east lawn.
- **Slot drain:** across the west end.
- **Details only, guarded against the walking routes:**
  - leafy plants from `src/clipped-plants.ts` (task `eva-planting-shapes`): each is a lumpy clipped hull covered in thousands of small leaf cards in several greens, seeded so it is the same on every load
    - clipped hedge in the east house bed (about 0.85 m)
    - low box edging (about 0.35 m) with pink-flowering roses behind it in the west beds
    - a clipped narrow-leaved oleander at the north-east end
    - jasmine and shrubs up the east house wall, with white flowers
    - the round clipped tree on the lawn, on a 2 m pale trunk (in `src/eva-walled-lawn.ts`)
  - the west lantern and the strelitzia
- **Clipping:** the generic ribbon and its white edge are cut out over both runs (`outsideEvaLane`).
  Generated garden walls, gates and clutter inside the dressed area are suppressed.

### Placement

- **East:** the mapped Eva centreline. The middle pool east gateway opening is defined around the
  point where that line crosses the gateway wall (`data/middle_pool.json`, `scripts/check_middle_pool.py`).
  The photos show the path centred on the opening, so the two agree. The south-east house front
  stands 2.0 m from the line, which leaves 0.83 m for the photographed bed. The run starts at the
  gateway's street face and stops at the edge of the Teodoro Rojo ribbon.
- **West:** the registry house north-west of the lane stands 0.6 m from the mapped centreline
  (0.9 m beyond a = 27.6 m), with a planter in front of it. The house south-east of it stands
  1.9 m away. The photographed band, margins and planter only fit between them if the band's
  axis is 0.9 m south-east of the mapped line, so it is drawn there. The run starts at the edge
  of the mapped Dalí parking bay and ends where the photographed stretch ends.
- **Lantern and tree:** the one lantern and the round tree on the east lawn moved from about
  a = 12-13 m to the north-east bed (`data/eva_walled_lawn.json`), from IMG_2336 and IMG_2503.

The mapped Eva route, its 1.2 m width and walking are unchanged. On the west stretch the route
runs along the planter face. The planter has no collision and its plants are left out, because
they sit inside the route. Moving the route is walking work, which is paused.

## Limits

- Widths come from tile proportions: 0.40 m tiles with 0.03 m joints, four across.
- Bed depths, lawn extents, the spur's length and the west curve are estimates. They are bounded
  by the registry fronts and the Dalí parking bay.
- None of the cameras is solved. The comparisons use starting poses set from photo content:
  - on the path at the pin's distance along it, facing along the lane
  - pins 0.4-3.5 m to the side, within their GPS accuracy

  They are photographic diagnostics, not measurements or placement approval.
- The plants are original illustrative models of the photographed plant types, not scans. Their
  shapes, leaf counts and flower counts are estimated.
- Not modelled, and listed under `gaps` in `data/confidence.json`:
  - climbers against the west house walls
  - the plants in the west planter
- The covered passage off Eva remains `gap:eva-covered-passage`.
- Eva east of the Teodoro Rojo junction has no photos (photo request `eva-east`) and keeps the
  generic ribbon.

## Checks

- `python3 scripts/check_eva_lane.py` checks:
  - evidence
  - the four-tile width
  - every surface and kerb is clear of registry houses, pools, the gateway, asphalt and parking bays
  - the generic ribbon is cut over the mapped route
  - wiring into scene, map and Details guard
- `node scripts/test_layout_browser.cjs` checks:
  - map paths for every surface
  - nothing leaks into Layout
  - paving is flush with the walking height
  - hedge and plant footprints clear every route
- Before and after renders through each photo's starting camera are in `docs/reviews/eva-lane-details/`.
  They are recorded in `data/photo_checks.json`.
