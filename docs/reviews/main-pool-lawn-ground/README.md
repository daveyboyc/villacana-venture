# main-pool-lawn-ground: Inspect before and after

Rendered in Inspect with Show details by `scripts/shoot_inspect.cjs` (fixed orbit camera,
`&inspect=x,z,distance,pitch,bearing`, turned-frame metres), not from the photo cameras.

- `lawn-paths-before.jpg` / `lawn-paths-after.jpg` (`-8,122,26,35,0`): before, the pink paths,
  apron, white walls, hedge and bollards were buried under the surveyed lawn; only the bin tops
  showed. After, they stand on the lawn. `lawn-from-south-before.jpg` is the low view from the lawn.
- `top-before.jpg` (`-15,98,60,60,0`): the original east edge of the lowered area, where the draped
  3 m retaining face stood as a band of beige triangles across the lawn's east side.
- `east-edge-before.jpg` / `east-edge-after.jpg` (`9,97,22,40,270`): an intermediate state with that
  face simply left out shows the pale gap where the two ground sheets bent apart; after the
  side-aware survey offset the lawn meets the ground beyond it cleanly.
- `west-edge-after.jpg` (`-30,100,22,35,90`): the Guillermo retaining wall and the restaurant front
  after the change, with no slivers.
- `lawn-kit-after.jpg`: the Blender lawn-kit bollard and slatted bin by the path near the beach
  gateway; the gateway threshold seam beyond is the open `beach-gate-verge` work.
- `shop-awnings-after.jpg`: the three lettered awnings at the head of Enrique's steps, which still
  have no storey behind them (`enrique-shop-storey`).

`scripts/shoot_views.cjs` without `--pose` now renders the whole-resort Overview rather than the
photo camera (the page opens in Inspect by default), so the photo checks below go through `--pose`.

## Photo-camera check, 2026-11-13

`IMG_xxxx-after.png` are renders through each photo's own camera (`shoot_views.cjs --pose --initial
--query=details=1`), a hand-set starting pose from photo content in `data/photo_poses.json` (eye
1.5 m above the surveyed ground), not a solved camera. The comparison found and fixed: a twist at the
start of each pink-path ribbon (the first cross-section was built backwards); the near bin and
bollard on the wrong side of the path and the branches in the wrong places (IMG_2603, IMG_2764);
a missing bin by the gate bollard (IMG_2759, IMG_2761); generic shutters, an arched door and tiled
porch roofs on the plain white kiosk (IMG_2759, IMG_2762, IMG_2763); white riser tiles where the
photos show cobalt patterned ones (IMG_2776, IMG_2777); eight summer loungers in the gate corner and
out beyond the railing. Results and what still differs are in `data/photo_checks.json`.
