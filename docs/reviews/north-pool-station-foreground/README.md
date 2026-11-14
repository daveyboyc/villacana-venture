# North pool: the station foreground (north-pool-station-foreground)

IMG_2204-2206 were taken from one upper-floor station on the south row's roof, whose camera is solved
(`data/photo_poses.json`: x -170.29, y 8.55, z 36.59, f 1241). Rendered through that camera, the model's
own surroundings filled the left half of IMG_2206 and the lower right of IMG_2205. These are the renders
after the fix, with Show details on (`node scripts/shoot_views.cjs IMG_xxxx --pool=north --pose
--query=details=1 --task=north-pool-station-foreground --as=after`).

## What was in the way, and why

Every finding below came from casting photo pixels as rays through the solved camera, onto the surveyed
ground or against registry edges. `scripts/probe_ground.cjs ray:x,y,z,dx,dy,dz` names the mesh each ray
hits in the scene.

| In the model | In the photos | Change |
| --- | --- | --- |
| Generated wooden balconies and tiled porch roofs on the north face of the south row | IMG_2205-2208: plain white face, no projecting balconies | `data/plain_fronts.json` fronts, `src/plain-fronts.ts` skip porches there |
| Generated shutter window on the notch face (-178.5, 35.2) and kit openings on the near block | IMG_2206, IMG_2207: plain white walls | same fronts, `noOpenings` |
| Nothing at the camera's feet; a pergola roof read in its place | IMG_2205-2208: barrel-tile coping on the roof edge that part3 shares with part1 | `src/station-parapet.ts`: rays through the tile ends meet that edge at 8.01-8.15 m, so the parapet is built from the roof to 8.02 m outside and 8.3 m inside, with a 0.6 m tiled coping |
| Hashed hedge runs (1.7 m sprites) on the skeleton garden walls south of the west path | IMG_2206, IMG_2208: white patio walls with brown gates, bougainvillea and plumbago, terracotta patio and parasol | `bareWalls` box; the hedge runs there are left out |
| Hibiscus hedge 1.4 m wide | IMG_2204-2206 | 1.0 m (`data/ground_plan_north_pool.json`) |

Rejected: lidar suggested part1 stands 6.1 m above ground, so a second storey with a tiled roof was tried.
It filled the view with roof. The photos show the tiles as a coping within a metre of the camera, with
garden beyond it. At the 2 m lidar cells the parapet and the tall blocks either side blur together.
Reverted.

## Checks (data/photo_checks.json)

- **IMG_2204: matches.** Nothing next to the camera blocks the view.
- **IMG_2205: differs.** The foreground is now the tile coping and white block, as in the photo. The yucca in
  the middle is not drawn. It is placed where its trunk casts (o13, -164.2, 22.45), but its 4.2 m canopy
  needs 2.85 m from the Calle Elena protected route and it stands 1.3 m away, so the route-clearance guard
  drops it. It is left out rather than bypassing the guard (`gap:north-pool-station-yucca`).
- **IMG_2206: differs.** The west gardens now show. Still different:
  - the patio walls are the generated 1 m walls, not 1.8 m with curved cappings and brown doors;
  - registry part3's notch corner (-179.4, 33.7) projects about 40 px (0.4-0.5 m) east of the photo's
    edge;
  - the near block reads about 1 m taller in the photo.

  These are single-camera findings, so they are recorded as discrepancies, not corrected. Follow-up:
  `north-pool-station-details`; evidence request `north-pool-gated-patio-gates` asks for ground-level
  photos of the gates.

These are photographic diagnostics through a solved camera, agent-reviewed only. They are not placement
approval.
