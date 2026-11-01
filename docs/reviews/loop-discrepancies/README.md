# First full comparison at the north pool (task `loop-discrepancies`)

Slice 1 of the photo-to-model loop (`docs/PHOTO_LOOP_PRD.md`), 1 November 2026. The model, as on
`main` after the north-pool detail pilot, rendered with Details on through the three solved cameras
of the `north-pool-south-upper` station, and compared with each photo at full size.

| Photo | Render | 50% blend | Numbered side-by-side |
| --- | --- | --- | --- |
| [IMG_2204](../../../public/photos-ref/IMG_2204.jpg) | [render](IMG_2204-render.jpg) | [blend](IMG_2204-blend.jpg) | [compare](IMG_2204-compare.jpg) |
| [IMG_2205](../../../public/photos-ref/IMG_2205.jpg) | [render](IMG_2205-render.jpg) | [blend](IMG_2205-blend.jpg) | [compare](IMG_2205-compare.jpg) |
| [IMG_2206](../../../public/photos-ref/IMG_2206.jpg) | [render](IMG_2206-render.jpg) | [blend](IMG_2206-blend.jpg) | [compare](IMG_2206-compare.jpg) |

Regenerate:

```bash
node scripts/shoot_views.cjs IMG_2204 IMG_2205 IMG_2206 --pose --details
python3 scripts/compare_photo.py IMG_2204 IMG_2205 IMG_2206 --task loop-discrepancies
```

In the side-by-sides each region is outlined in its kind's colour (red missing, orange extra, cyan
shape, magenta position, green look) and numbered D1-D52 as in `data/discrepancies.json`, the area
brief (`refs/areas/north-pool.md`) and the map's **Differences** layer; `+` marks the contact pixel
cast to the map, and the key under each pair repeats the description and position.

## What was found

52 differences: 20 missing, 11 shape, 10 look, 9 position, 2 extra; 51 open, one won't fix (the
glass fence, Dave's decision). 32 have a map position from the cameras.

- **Pool:** the squared deck tongue east of the steps (D1) and the square south-west spur with the
  ladder (D2) are edges of the water the registry ring rounds off; the north steps read only faintly
  (D3); water and deck colours differ (D4, D5).
- **Fittings:** the pump box is about 1.5 m east of the model's (D7), the east ladder 3.5 m north-east
  (D8), the east life ring 5 m north (D9), the north ring 1.2 m south (D10); the showers and frosted
  screen, a deck pole, a grate slab and lawn covers are missing (D11-D14).
- **Planting:** the strelitzia is twice as tall (D16) and two extra clumps stand where the photos show
  lawn (D17); the feathery tree is 3 m off and looks different (D18, D19); the west-terrace tree is
  missing (D20, known gap); the pollarded tree is 2.4 m east and bare (D21); the big yucca is 6 m from
  the model's (D22); hedges are the wrong shape and size (D23, D24); bougainvillea, climbers and
  flowering shrubs are mostly missing (D25-D27).
- **Parasols, awnings and furniture:** five parasols, the passage hood, the blue awning and all the
  furniture are missing; the north-east awnings are misplaced and one awning is extra (D28-D38).
- **Walls, paths and steps:** the west curved wall carries on round further south-east (D39); the
  north plinth frontage and its step openings stand 1.5-2.5 m further north (D40); the Isabel path's
  line and paving differ (D41, D42); the iron gate is missing (D43); patios are terracotta in the model
  and stone in the photos (D44); the west-row gates are flat-capped piers, not an arch (D45).
- **Buildings:** the station building itself rises higher (D46); openings, the north-east balcony and
  the west-row facade differ (D47-D49); roof equipment is missing (D50).
- **Surroundings:** background trees and mountains (D51, D52).

## Limits

- Positions use the solved cameras, which fit the pool ring to about 0.1 m; the stated uncertainties
  (about 1-2 m, up to 4.7 m for things cast at an assumed height) treat the solve's sigmas as
  independent and overstate the error near the pool. Where two or three cameras see the same
  ground point they agree to 0.2-0.7 m; the west-terrace tree, a parasol and the north-east awnings
  disagree by 1.6-2.7 m because their contact heights are assumed.
- IMG_2204 puts the north end of the west curved wall about 1 m east of where IMG_2206 does, with the
  wall foot partly hidden by the hedge; D39 records only the south end, which both agree on.
- Facade, roof and planting differences are recorded by region, not measured: the model export has
  no geometry for them to cast against.
- Only these three cameras are solved; IMG_2207, IMG_2208 and the rest wait for `loop-camera-solving`.
- Nothing is fixed here; `loop-north-pool-fixes` takes the open records.
