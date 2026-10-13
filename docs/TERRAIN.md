# Ground heights

From Dave (2026-10-13): the Pintor Dalí side is about half a metre higher than
the middle of the resort, and the change is mostly at short ramps on the lanes.

## What is built

- `data/terrain.json` holds one rule: west of a "foot" line the ground climbs
  0.5 m over 7 m and then stays level out to Dalí. `siteY` in `src/terrain.ts`
  reads it. Zero is the level of the middle pool.
- **Confirmed by photos:** the Cervantes ramp at Elena (IMG_2262, IMG_2265) and
  Calle Eva rising towards the Dalí car park (IMG_2248).
- **Guessed:** where the foot line runs between and beyond those two ramps. It is
  kept west of the north pool lawn, and 20 m in from Dalí south of Eva, so
  Patricia and Jorge also get a short ramp near Dalí. Nobody has confirmed those.
- The north, middle and south pools are all on level ground. The big pool, the
  beach and the sea keep their own levels (`docs/MAIN_POOL.md`).

## How it is applied

The scene is still built flat. Just before the first frame `drapeScene` lifts
it: houses move as a whole to the height at their middle, details fixed to a
house move with it, long flat things (roads, the car park) are bent to follow
the ground, and the raised ground is drawn over the flat sheet with the same
painted texture. The player's ground height adds `siteY`. New code does not need
to know about heights unless it places things after the scene is built.

Cervantes no longer carries its own hump in `heights`; the ramp is in the ground.

## Not built yet

- A ramp on Calle Eva towards the Picasso car park. Dave remembers one; no photo
  in the set shows it (IMG_2243 looks the other way, along a level lane to the
  middle pool gate).
- The south pool being lower, and the fall from the entrance to the sea.
- The master map does not show heights.

`scripts/check_terrain.py` checks the rule against the photographed ramps.
