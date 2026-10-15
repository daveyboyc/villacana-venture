# Calle Elena north and the steps at Cervantes

Built on 14 October 2026 from the roof photos taken that day (IMG_2360–2365) and
the ground photos of 11–13 October (IMG_2197–2203, IMG_2262, IMG_2286). Before
this pass, Elena north was a tiled strip across open paving. The roof photos show
what actually lines it.

## What is built

`data/elena_north.json`, drawn by `src/elena-north.ts` in the pool scene and by
`src/blueprint.ts` on the reference map. Collision uses the same outlines.

| Feature | From | Notes |
| --- | --- | --- |
| Arched gateway onto the north pool lawn | IMG_2363, IMG_2202 | White wall across the gap between the two terraces, 1.5 m opening, arch crown 2.2 m. A brown garden door in its east part faces the patio. Bougainvillea over it in Details. |
| Patio wall, east side, north half | IMG_2363 | 1.15 m white wall between the lane and the private patios, with a brown door onto the lane. |
| Planting strip, west side, north half | IMG_2363 | Low kerb along the west houses up to the covered walkway. |
| Magnolia bed | IMG_2365, IMG_2364, IMG_2362 | Raised 0.3 m white-kerbed bed of tall glossy shrubs, edged with strap-leaved plants. |
| Two hedged beds with pollarded trees | IMG_2197–2201, IMG_2365 | Boxed by a clipped hedge, spider-plant-like strap leaves inside. A short path to a garden door runs between them. |
| Two white planter boxes | IMG_2201, IMG_2198 | Against the west house front under the barred window. |

Beds, planter boxes and walls are solid; the gateway is open. Generated garden
walls, gates, porch props and scattered planting are suppressed inside the
reviewed band (`review` in the data file), so nothing invented is drawn over the
traced features. Hedges and plants are Details only; beds, kerbs and walls show
in Layout too. The new sprite kind `magnolia` is painted in `src/sprites.ts`.

## Steps beside the Cervantes ramp

IMG_2286 and IMG_2262 show the lane at the Elena junction split in two: a smooth
ramp on the south half and three shallow steps on the north half, with one
drain across the foot. Each step stands a little above the ramp beside it, so
the whole 0.5 m rise happens within about 3 m, not the 7 m the terrain rule used.

- `data/terrain.json` `localRuns` shortens the slope to 3 m where the foot line
  crosses Cervantes, blending back to 7 m over 3 m either side. The rest of the
  foot line is unchanged. `runAt` in `src/terrain.ts` and `run_at` in
  `scripts/check_terrain.py` apply the same rule.
- The ramp record in `data/dali_cervantes.json` now ends at the Cervantes vertex
  3 m up from the drain.
- `data/cervantes_elena_steps.json` and `src/ramp-steps.ts` build the three
  steps: white risers, terracotta treads, risers at 0.4, 1.0 and 1.6 m. The
  player's ground follows the treads (`stepsGroundOffset`), one riser at a time.

## Checks

- `python3 scripts/check_elena_north.py`: every feature cites indexed photos,
  keeps every lane's width clear, stays off houses and pools and inside the
  reviewed band; the gateway opening is wide and tall enough to walk through.
- `python3 scripts/check_terrain.py`: the local run is photographed and no
  steeper than 22% (it is 17%).
- `npm run test:layout` now also walks up and down the steps (three risers,
  top level with the ramp), walks through the gateway, and checks every bed is
  solid, as well as all 20 routes both ways.
- `node scripts/shoot_views.cjs IMG_2201 --details` renders the game from a
  photo's camera pin and heading into `layout-checks.local/views/`, to compare
  with the photo by eye.

## Limits

Positions are traced against the registry fronts and the aerial to roughly
0.5–1 m. Wall heights, the gateway arch, bed sizes and tread lengths are
estimated from tiles and doors in the photos, not measured. Door positions in
the patio wall are approximate. The garden door between the hedged beds, the
east-side patios beyond the beds, and the gated entry seen in IMG_2361 (west of
the covered walkway) are not modelled yet.
