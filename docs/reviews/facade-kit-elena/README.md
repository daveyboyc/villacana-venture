# Elena roof station: camera not solved, nothing traced

Second photo station after the north pool, for tracing the facade kit from photos. The
candidates were grouped by camera pin and phone altitude. The best spread of headings is the
roof station at about (−155.7, 50.1): IMG_2358 (150°), IMG_2359 (218°) and IMG_2360 (73°), all
from one pin in one session, plus IMG_2220 from a pin 0.9 m away. The views look down on the
Elena lanes and gardens and show many doors, windows and balconies. Other stations were weaker:
IMG_2214–2218 are rooftop panoramas of distant roofs, and the ground stations face gates and
hedges at close range.

## What happened

- `photo_pose.py init` gave starting cameras from the pins. Pitch and eye height were set by eye.
  Renders through them (`starting-pose-edges.jpg`) are close for IMG_2358 and well off for
  IMG_2359 and IMG_2360.
- A first solve of IMG_2359 matched six features:
  - the parapet line of building 44's north facade (`6265801UF1366N_part5`)
  - one facade step (corner 31)
  - two upright edges

  It fitted them to 5.6 px but landed 16 m from the pin, about 5 m from the facade. The held-out
  checks missed by 90–690 px (0.9–1.6 m). That is a wrong solution, not a measurement. The
  matches were discarded and nothing was traced.

## Why this station is hard

- **The model is wrong right where the camera stands.** The photos are taken from an upper
  terrace over a sloping barrel-tile roof, looking down onto patios. The model has building 21
  (`6265201UF1366N_part4`) there as a flat block 7.2 m high (`IMG_2359-photo-and-model.jpg`,
  right half). The near half of every frame therefore has nothing in the model to match.
- **The solver's model export covers only registry buildings and pools.** Most of what these
  photos show clearly is not in it: lane edges, garden walls, raised patios and the paving
  traced for Elena (`data/elena_*.json`, raised terraces). IMG_2358's lane and garden walls
  line up with the rendered ones almost from the start, but the solver cannot use them.
- **Few registry corners can be identified.** Building 44's facade steps are short (0.4–1.1 m),
  half hidden by trees, and seen steeply from above. Which photographed edge is which corner
  stays ambiguous without more structure to anchor them.

## What would make it solvable

1. Add traced walls and lane edges to the model export (`exportModel` in `src/photo-camera.ts`)
   as polylines with heights, so `photo_pose.py` can match them like pool edges. IMG_2358
   alone has two long, clear lane-edge walls.
2. Check the roof form of building 21 at this pin (a tiled pitched roof below an upper terrace,
   not a flat 7.2 m block) before using any near-field feature.
3. Then solve IMG_2358–2360 as one station and trace the facades of buildings 44 and 39.

The starting cameras for IMG_2220 and IMG_2358–2360 are kept in `data/photo_poses.json`
(unsolved, no matches) so this can resume from here.
