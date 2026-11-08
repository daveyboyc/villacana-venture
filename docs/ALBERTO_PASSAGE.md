# Calle Alberto 22-40: the covered porch off Calle Eva east

Task `alberto-passage-porch` (8 November 2026), from IMG_2792.

## What the photo shows

IMG_2792 looks into a covered porch off the path north of Calle Eva east. It shows:

- an arch on square piers with a stepped impost;
- a red studded rubber ramp running in beside the near pier;
- a tiled step platform with a potted jade and a big-leaved plant;
- a plain white back wall, one to two metres in, with black letter tiles reading
  CALLE ALBERTO 22 40 and a white AGUA POTABLE hatch.

Because the back wall faces the entrance, the passage must turn out of view.

## Where it is

The pin (±4.7 m) is just east of registry block `6265601UF1366N_part1`. That facade has one
recess, 3.1 m wide and 1.0 m deep, and the porch is built in it. Its frame follows the recess edges.

The phone compass reads 289°, about 50° west of the direction into the recess. Compass errors
beside walls are common in this photo set, but the error is the reason the placement is graded
`estimated`, not `photographed`.

The plaque names houses 22-40 of Calle Alberto, reached through this porch. The street the map
labels Calle Alberto, from Google on 12 October, is in the north lanes about 80 m away. That
label covers at most part of the street, and the question is open in the north-lanes notes.

## What is built

`data/alberto_passage.json` is drawn by `src/alberto-passage.ts`:

- the piers, impost and arch;
- the house closed over the porch from a 2.65 m ceiling to the roof;
- the studded ramp beside the near pier;
- the tiled two-tier step platform;
- the letter-tile plaque and the hatch on the back wall;
- in Details, the potted jade and the big-leaved plant, guarded against the routes.

The generic shutters and the facade kit leave the porch's back wall bare (`inAlbertoPorch`).
Generated walls and clutter in the recess are suppressed. The porch is outside the house footprint,
so collision and walking are unchanged.

## What is not built

The block has an inner courtyard in the registry, about 7 m behind the porch. A covered passage
from the porch to it is likely, so the map draws that line as **inferred** (orange, dashed).

It is not cut through the house in 3D, because three things are unseen:

- which way it turns behind the back wall;
- its width and height;
- its line through the house.

It is listed as `gap:calle-alberto-22-40-tunnel`. Photo request `calle-alberto-22-40-inside` asks
for the turn, a view along the passage and its far end.

## Checks

- `python3 scripts/check_alberto_passage.py` checks:
  - the frame is the registry recess;
  - the porch is outside the house and clear of mapped streets;
  - ramp and platform don't overlap;
  - the inferred route ends on the courtyard;
  - wiring into scene, map, shutters and kit.
- `node scripts/test_layout_browser.cjs` checks:
  - map paths;
  - the porch parts are in the scene;
  - the plants are only in Details and clear of routes.
- The before/after render through IMG_2792's hand-set camera is in
  `docs/reviews/alberto-passage-porch/` and recorded in `data/photo_checks.json`.
