# Facade kit placed from the north-pool photos

The pilot (`docs/reviews/blender-kit-pilot`) generated which walls facing the north pool get
doors, iron balconies and wooden balconies. This task reads them from IMG_2204, IMG_2205 and
IMG_2206 instead and keeps them as data in `data/facade_kit.json`.

`*-before-photo-after.jpg` shows the generated kit, the photo, and the traced kit, all through
the solved station camera. `*-overlay.jpg` shows render edges over the photo.

## How the parts were located

1. The station camera was re-solved against the surveyed ground (the north deck now stands at
   +0.82 m). It lands within 0.6 m of the earlier solve.
2. The centre pixel of each visible door, window and balcony was read off gridded zooms of the
   full photos.
3. The camera ray through that pixel was intersected with every pool-facing wall that faces the
   camera, more than 5 m away and below its roof. The nearest hit gives the wall, the distance
   along it and the storey (above or below 3 m).
4. Parts seen in two photos agree to 0.1–0.3 m along their wall:
   - wooden balcony 2.09 and 1.88 m
   - its doors 2.81/0.95 and 2.82/0.96 m
   - windows 6.45/6.55 and 2.09/2.30 m
   - right wooden balcony 1.07 and 1.29 m
   - balcony door 0.31 and 0.26 m

Heights are not read from the photos: the model's roofs still sit about 1 m low against them
(task `north-pool-roof-heights`), so parts stand at the model's storey heights.

## Result

- **Placed from photos:** 30 parts on 11 walls, plus one wall traced as having no first-floor
  parts:

  | Part | Count |
  | --- | --- |
  | Arched shutter doors | 15 |
  | Narrow arched windows | 7 |
  | Iron balconies | 4 |
  | Wooden balconies | 2 |
  | Rectangular shuttered windows | 2 |

- **Still generated:** the other 37 pool-facing walls, which these photos do not show clearly.
- **New kit parts:** the rectangular shuttered window and the narrow arched window, built in
  `scripts/build_kit.py` (27 and 24 kB). A traced `width` stretches doors and balconies along
  the wall, as for the tall narrow doors and small iron balconies on the west row.
- **The pilot's error is fixed:** the left block in IMG_2204 now has one wooden balcony, not
  two. The second came from the generator on the wall to its left (`6165501UF1366N_part5:41`),
  which the photo shows plain above the tree. That wall is now traced as having no parts.

## Still different

- Generated walls still carry invented parts. Examples:
  - a wooden balcony on the north row behind the canopy house (IMG_2206)
  - balconies on the east block at the right of IMG_2205; that block already stands too far
    forward in the model (`north-pool-unresolved-plan`)
- Ground floors hidden by trees, awnings and hedges get no parts on traced walls. That is more
  honest than guessing, but leaves those walls bare.
- Three readings were off: the tall door and small iron balcony at about x=1000 in IMG_2205,
  and one door in IMG_2206, hit no pool-facing wall or the camera's own block. They were left out.
- The parts are generic: the photographed doors differ in width, arch and surround more than
  the five kit parts can show.
- This is a materials task, so no placement packet. It stays `in-progress`, like the pilot,
  because the queue only marks it done with placement approvals.
