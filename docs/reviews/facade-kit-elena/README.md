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

## Second attempt (25 October): walls and lane edges in the export

The model export (`exportModel` in `src/photo-camera.ts`) now also carries, as placed in the scene:

- **every rendered edge of the other solid meshes**, grouped by the nearest named object:
  traced garden and patio walls, gateways, steps, kerbs, beds, terraces and pergolas.
  That is 1,176 groups, with unnamed meshes numbered in build order.
- **both edges of every mapped street**, on the walkable ground.

`photo_pose.py` matches them as lines: `edge:<feature>`, `road:<id>:left|right`, and
`building:<id>:*:top|base` for anywhere on a roofline. `guide` draws them as E<n> and R<n>
(`IMG_2358-guide-new-refs.jpg`). A photo can also carry `heightPrior` to hold the camera height.

### Matches tried

| Photo | Matches |
| --- | --- |
| IMG_2358 | Elena south lane: both paving edges (11 points); the middle pool's near edge at the end of the lane |
| IMG_2359 | Building 44's parapet line (10 points); two upright facade edges |
| IMG_2360 | Building 39's parapet line (8 points); both ends of its facade block |

The laser survey gives building 21's roof at the pin as 6.9–7.1 m above the middle-pool deck,
so the camera height was held at 8.5 ± 0.4 m.

### Result: not stable, nothing traced

As one station the matches fit to 5.6 / 7.2 / 10.5 px. The station still fails:

- **Lens:** the shared lens comes out at 37 mm. These phones shoot at 24–28 mm.
- **Direction:** IMG_2360 is turned to 131°, although its own solve and its phone compass both say 66–73°.
- **Single photos:** solved alone, each photo lands 0.5 m (IMG_2358), 4.2 m (IMG_2359) and
  4.4 m (IMG_2360) from the joint camera. That is outside the 2 m test.
- **Without the height prior** the joint camera sat at 6.4 m, below the surveyed roof.

The likeliest cause is that the photos were not taken from one spot. They share a GPS pin, but
the solo solutions are about 4 m apart, which is easy to walk on a roof terrace. The
anywhere-on-the-roofline matches also make it easy to slide onto the wrong face of a building.
No parts were traced, and the matches are kept unsolved in `data/photo_poses.json`.
`station-attempt-IMG_2359-2360.jpg` shows the joint solve: building 44 lines up roughly, and
building 39 in IMG_2360 does not.

### The roof at the pin

The survey does not confirm a large error there. Building 21's roof around the pin is 6.9–7.1 m
(model 7.19 m), with one 2 m cell at 3.6 m. That fits a small tiled slope below the upper
terrace, as the photos show, too small for the survey grid to resolve. No follow-up task.

### What would solve it

Solve each photo on its own, each with more independent matches at several depths, and with
held-out checks for each photo:

- **IMG_2358:** registry corners and upright edges of the left-hand house.
- **IMG_2360:** the Cervantes lane edges.
- **IMG_2359:** upright edges and garden walls.

Or confirm from Dave where on the terrace each photo was taken.

## Third attempt (26 October): on the roof of Elena 24

Dave confirmed that IMG_2358, IMG_2359, IMG_2360 and IMG_2220 were taken from the roof of Elena 24.
That is the east end of building 21 (`6265201UF1366N_part4`), at the lane junction, the end with
the door. The photos may be from different spots on that roof, so each was solved on its own,
with three priors (`data/photo_poses.json`):

- **Roof region** (`regionPrior`, new in `photo_pose.py`): building 21's footprint from its east
  end to its second facade step, about 9 by 9.6 m. Inside it there is no pull; outside it, the
  sigma is 0.3 m per metre.
- **Height** (`heightPrior`): the model's roof at 7.19 m plus 1.6 m eye height, sigma 0.3 m.
- **Lens** (`lensPrior`, new): 26.8 mm-equivalent ±3%. That is the lens of the north-pool station
  IMG_2204–2206, which is assumed to be the same phone. Without this prior, focal length and
  distance traded off freely.

Matches favour registry corners, upright edges and street edges. IMG_2358 and IMG_2220 now also
use the north-west corner of building 39 (corner 3) at the lane, the lane edges, a lamp post
and other upright edges. Each holds out a check.

A fix on the way: the export's `road:<id>:left` was the right-hand edge, because +z is south.
It now is the left-hand edge looking along the road's points, and IMG_2358's matches are swapped
to suit.

| Photo | Position ± (x, z) | Controls rms | Held-out checks | Pass? |
| --- | --- | --- | --- | --- |
| IMG_2220 | (−159.1, 50.8) ± (0.6, 1.1) m | 20 px | building 39 roof corner 0.76 m above the model's | no |
| IMG_2358 | (−158.4, 49.9) ± (1.6, 2.0) m | 11 px | garden-door frame 0.6–2.0 m (rms 1.27 m) | no |
| IMG_2359 | (−156.5, 46.9) ± (6.3, 4.7) m | 8 px | none identified | no |
| IMG_2360 | (−155.9, 52.0) ± (4.5, 2.6) m | 4 px | none identified | no |

All four land on the roof, but mostly because the prior holds them there. IMG_2358 and IMG_2220
show the same lane view from the same parapet, yet they solve 1.4 m apart, outside the 1 m test.
In IMG_2220 the lane edges and building 39's corner disagree by up to 0.4 m. The street's mapped
centre line and width are approximate, and they likely account for part of that. IMG_2359 and
IMG_2360 have no registry feature matched with confidence, so the roof prior alone places them.
**Nothing was traced.**

Held-out discrepancies, with the cameras this uncertain:
- **Building 39's roof corner** (6265601UF1366N_part1, corner 3) appears 0.76 m higher in
  IMG_2220 than the model's top (6.70 m). A parapet would explain it: the 2 m survey grid
  misses parapets. A camera-height error would too.
- **The traced Cervantes garden door** (`cervantes-garden-door`) misses the door below the
  camera in IMG_2358 by 0.6–2.0 m. It cannot yet be told apart from camera error.

`roof-prior-IMG_2358-2220-overlay.jpg` shows render edges through both solved cameras, with
50/50 blends: the lane and the lawn beds visibly slide against the photo.

### What would solve it

- **More registry corners at different depths:** building 39's north face, building 44's
  north-east corners and the far end of the lane, each held out in turn.
- **A photo from that roof with a known mark,** such as the parapet corner by the door, to
  pin each camera to within a metre.
