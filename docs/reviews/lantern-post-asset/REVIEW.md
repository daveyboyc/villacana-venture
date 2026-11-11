# Review checklist: the lantern post

For the agent checking task `lantern-post-asset`. Read `docs/LANTERN_POST.md` first.

## What to look at

1. **The asset against the photos.** Open `asset-sheet.jpg`. The model's head is in the middle,
   between crops of IMG_2552 and IMG_2336. The base is on the right, under a crop of IMG_2503.
   Check:
   - lantern proportions: taller than wide, wider at the top;
   - roof: straight-sided pyramid, small overhang, vent chimney, cap and finial;
   - glass: frosted, with a pale lamp visible inside;
   - arms: four curved arms under the lantern, above a ball and collar;
   - base: square plate with four bolts and a thicker sleeve.
2. **The lamps in the scene.** For IMG_2552, IMG_2597, IMG_2336 and IMG_2234, compare
   `<photo>-before.png` and `<photo>-after.png` with `public/photos-ref/<photo>.jpg`. Check:
   - every lamp visible before is still there after, in the same place;
   - each is the new lantern, not a box or cone on a stick;
   - no lamp floats above or sinks into the ground.
3. **Nothing else changed.** `git diff 50a8676 -- src/` should touch only the lamp code in
   `jorge-lane.ts`, `eva-lane.ts`, `eva-walled-lawn.ts`, `dali-street.ts` and `slice.ts`, plus the
   new `lantern-post.ts`.

## Commands

```bash
python3 scripts/check_lantern_post.py
python3 scripts/check_jorge_lane.py && python3 scripts/check_eva_lane.py
python3 scripts/check_eva_walled_lawn.py && python3 scripts/check_dali_street.py
python3 scripts/build_references.py --check
npx tsc --noEmit && npm run build
```

To see it live, open Inspect with **Show details** on:
`?view=overview&area=jorge-detail`, `?view=overview&area=eva` and `?view=overview&area=dali`.

## Known limits, not defects

- The cameras for the scene renders are hand-set, so the lamps do not line up pixel for pixel
  with the photos.
- Pintor Dalí has no render here. The camera set from IMG_2270's pin landed inside a wall, so
  that view was dropped. One Dalí lantern is visible in the IMG_2552 pair, at the car park.
- `test_layout_browser` fails on `main` at "South Dalí approach has a reachable step", before
  and after this change.
- The placement gate is red because shared renderer files changed.
