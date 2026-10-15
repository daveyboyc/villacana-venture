# Middle pool: east gateway and west planter

Built on 14 October 2026 from the ground photos of 12 and 14 October and the
older reference photos of the courtyard. Before this pass the courtyard had
generated garden-wall pieces where Calle Eva enters and along the west path,
and nothing solid on either. The photos show what is actually there.

## What is built

`data/middle_pool.json`, drawn by `src/middle-pool.ts` in the pool scene and by
`src/blueprint.ts` on the reference map. Collision uses the same outlines
(`middlePoolRings()`).

| Feature | From | Notes |
| --- | --- | --- |
| East gateway from Calle Eva | IMG_2340 (outside), IMG_2244 (inside), reference photos 12 and 09 | White wall across the end of the lane: square piers, a flat head, a gently curved coping. One black iron leaf hangs on the south-east jamb and stands open into the courtyard, against the planting. A Comunidad Villacana notice is on the street face of the north-west pier and the blue dog-rule pair on the wall beside it (flat painted panels). The north-west wing steps down with a curved top to the walled lawn (about 1.45 m); the south-east wing runs about 1.2 m to the house corner. Hedge and bougainvillea either side in Details. |
| Raised planter wall with hedge, west path | IMG_2332, IMG_2333, IMG_2331, IMG_2245, reference photos 08 and 02 | White rendered wall 0.8 m high, a 1.2 m deep bed and a clipped hedge with red hibiscus on top (hedge in Details). It runs 9.5 m along the west side of the crazy-paving path from where the path bends at the north-west lobe to the south-west corner, then turns 2.6 m along the start of the lane to the south-west gateway, beside the IMG_2333 steps. The path between it and the pool water stays at least 2.2 m wide (deck plus path). |

### How they were placed

- **Gateway.** The two photos look straight along the last straight of Calle Eva
  (heading about 230°, the lane runs at 240°), so the gateway is across that
  route. Along the lane it is set level with the north-west corner of the house
  on its south-east side (registry part `6264501UF1366S_part2`), which falls
  between the outside pin (about 4 m before the gate in IMG_2340) and the inside
  pin (just through it in IMG_2244). The view through it in IMG_2244 points at
  the pool centroid (232° against 231°). Opening 1.5 m and clear height 2.05 m
  come from the 0.6 m manhole cover and the tiles; the 1.3-1.36 height-to-width
  ratio of the opening in IMG_2340 and photo 12 agrees.
- **Planter.** The IMG_2332 pin is ±14 m, so it was not used. The planter face
  is 0.7 m west of the `elena-south` route, which follows the pale path band on
  the aerial; the dark hedge band beside it on the aerial gives the bed depth.
  The north end is where IMG_2332 shows the tall wall ending at a lower step,
  the route's bend at the north-west lobe. Reference photo 08 and IMG_2245 show
  the same wall and hedge across the pool from the east, running to the
  south-west gateway; IMG_2333 (±3 m) shows it turning that corner beside the
  steps.

Generated garden walls, gates, props and scattered grass are suppressed inside
two reviewed bands (`review.rings`) around the gateway and the planter, so
nothing invented sits on or in the traced features (`suppressInMiddlePoolReview`,
used by both the scene and the map). Wall, piers, coping, leaf, signs, planter
walls and soil show in Layout; plants only in Details.

## Checks

- `python3 scripts/check_middle_pool.py`: every feature cites photos in the
  manifest (and reference photos in `refs/catalog.json`); walls, piers, the open
  leaf and the planter keep every route's width clear, stay off houses and pools
  and inside their reviewed bands; the opening is on the lane, wider than the
  lane and a player with room to spare; the head is at least 2 m; the path beside
  the planter stays wider than the route.
- `npm run test:layout` now also walks in and out through the gateway, checks
  the planter is solid at three points along it, and that walking at it from the
  path stops at its face (as well as all routes both ways, which include Calle
  Eva through the gateway).
- `node scripts/shoot_views.cjs IMG_2340 IMG_2244 IMG_2332 IMG_2245 IMG_2333 --pool=middle --details`
  renders the game from the photo pins. The IMG_2340 and IMG_2332 pins are off
  the lane and path (GPS), so the comparison renders were also taken from the
  lane 4 m before the gate and from the path beside the planter.

## Limits

- Positions are traced to about 1-2 m (gateway, along the lane) and about 1 m
  (planter). The gateway is assumed square to the lane. Heights, the opening,
  the coping rise, pier size, the bed depth and both wing lengths are estimates
  from photos, not measurements.
- The planter walls curve gently in IMG_2332 and IMG_2341; here they are
  straight legs. Its south leg length and how it meets the IMG_2333 steps are
  estimated; the steps and the change of level there are not modelled.
- Not placed: the planter's curved north end between the north-west entrance and
  the white steps (IMG_2331, ±17 m), those steps, the garden wall with the brown
  door and the pergola entrance north of the west path (IMG_2332, IMG_2195), the
  second wall of the walled lawn north-west of the gateway (IMG_2339), the
  south-west gateway at the top of the steps (IMG_2333) and the south pergola
  double gate (IMG_2334).
- The gate leaf is fixed open; the notice text is painted, not legible.
- The glass pool fence is not built (Dave, 2026-10-11).
