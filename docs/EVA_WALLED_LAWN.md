# Eva walled lawn corner — issue #47

IMG_2339 shows two white walls with woody bougainvillea trained flat against both
faces, a small lawn, a dark green bollard with an opal cap and a clipped hedge.
The first wall is the existing north-west wing of the middle pool east gateway;
its data, shape, opening and collision are unchanged. `data/eva_walled_lawn.json`
adds only a 4.2 m return at its north-west end, estimated from the aerial,
registry and lane, not obtained by treating the camera pin as the corner.

The map, structural mesh and collision use `evaWallRings()`. The lawn is a ground
surface in Layout and Details. Details adds two single wall-aligned transparent
painted planes (one per wall face), a green/opal bollard and the low hedge. The
old crossed bougainvillea on that gateway wing is removed. The adjacent bounded
lawn fragment, rounded tree and lantern reference IMG_2336/2337; IMG_2338 confirms
the lawn/frontage ordering. All props and the entire visible flat plant footprint
pass the shared route guard. Neither levels nor house/pool footprints change.

The photos support the corner arrangement and types of planting/light. Return
length, exact lawn boundaries, wall height, tree/lantern placement and all small
sizes remain estimated. The return stops without closing an unphotographed
boundary. Brown doors/yellow shrubs belong to frontage work; no extra doors or
gates have been invented here. The rounded tree is a simple illustrative mesh.

Source baseline: `/workspace/baselines/issue-47` (claim commit `0e4028d`). This
immutable copy preserves the full before implementation for root camera/browser
verification. Compare IMG_2339 with `--pool=middle --details`, and optionally
IMG_2336–2338, before marking the queue task done. The queue remains in-progress
until those browser/photo checks complete.
