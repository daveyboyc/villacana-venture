# Middle pool south-west steps and gateway — issue #31

IMG_2333 shows three stone treads with white risers on the raised-planter side
of Calle Eva where it leaves the middle pool courtyard, with a terracotta ramp
beside them. Both reach a short tiled landing before a white gateway; two black
iron leaves stand open along the lane edges. IMG_2332 locates the west planter.

The work came in two parts:

- **Steps and level (PR #53).** The rise is the resort's 0.5 m step up to the
  Dalí side. `data/terrain.json` brings the foot line along the back of the
  planter to the bottom step, and the lane stays on the upper level beyond
  them, as IMG_2248 shows. `data/middle_pool_steps.json` holds the three steps,
  which `src/ramp-steps.ts` builds the same way as the Cervantes steps. See
  `docs/MIDDLE_POOL.md` and `docs/LEVELS.md`.
- **Gateway and review band (PR #60).** `data/middle_pool_sw_gateway.json` places
  the gateway in the steps' frame, 3.3 m up the lane from the foot: about 2.3 m
  past the top riser and beyond the top of the ramp, so it stands on the upper
  level. `src/middle-pool-sw-gateway.ts` builds the piers, head, coping and the
  two open leaves. `middleSwRings()` gives the map and collision the piers and
  leaves; the blueprint also draws the three riser lines. A review band in
  `data/middle_pool.json` keeps generated walls and props out of the entrance.

PR #60 first built its own raised path (three 0.15 m risers, a landing and a
3 m slope back down beyond the gateway). That duplicated the steps already on
`main` and, merged with them, would have raised the lane about 1 m, so the merge
kept the terrain and steps from `main` and the gateway from #60.

## Accuracy limits

Positions, tread depths, landing length and gateway dimensions are estimates
from photographed tiles, not measurements. IMG_2333's camera pin is ±3 m and its
heading does not agree exactly with the lane; IMG_2332 is ±14 m.

`check_middle_pool.py` covers the gateway's evidence, piers, opening, its place
above the ramp and route/registry clearance, and keeps the steps' footprint out
of the planter, houses and pools. `check_terrain.py` covers the rise. The
layout browser test climbs the steps one riser at a time and walks up the lane
through the open gateway and back.
