# Lane walls review (task `lane-walls-jorge-elena`, 16 November 2026)

Inspect renders (Layout, then Show details) of the walls in `data/lane_walls.json`, before and after,
and the aerial strips they were traced from. See `docs/LANE_WALLS.md` for what was built and why.

| File | What it shows |
| --- | --- |
| `inspect-elena-before.jpg`, `inspect-elena-after.jpg` | Elena south lawns from the east, Layout: before, the two red door sills stand in open ground; after, the white wall with two brown doors on them |
| `inspect-jorge-top-before.jpg`, `inspect-jorge-top-after.jpg` | Calle Jorge 85-135 m from above, Layout: the cactus garden now ends at its east wall and the planter runs on from it; patio walls at the house corners |
| `inspect-jorge-west-after.jpg` | Calle Jorge from about 115 m looking west, Layout: the planter, the patio walls and the tall garden wall, as IMG_2230 sees them |
| `aerial-elena-south-esri.jpg` | Esri World Imagery zoom 20 resampled to model metres (5 m grid), registry in magenta, lawns in green, sills in orange |
| `aerial-jorge-*-esri.jpg`, `aerial-jorge-*-google.jpg` | Strips along the mapped Calle Jorge centreline: columns are metres along the lane (yellow), rows metres off it (cyan; negative is the north side), registry in magenta. Esri zoom 20 lines up with the registry; Imagery © Google 2026 satellite zoom 21 (fetched 16 November 2026) is sharper but sits about 1-2 m off and leans |

Strips are made with a throwaway resampler from the public tile services; the frame is the one in
`scripts/build_ground.py` (origin 36.4552 N, 5.0500 W, +x east, +z south).

## Independent review

A second agent that did not make the change reviewed the full-size photos (IMG_2261, IMG_2260,
IMG_2330, IMG_2358, IMG_2230 and the other Jorge views), these renders, the Show details renders and the
aerial strips, on 16 November 2026. Its verdicts:

- `elena-south-lawn-west-wall`: approve. One plain wall along the whole west side of both lawns, two
  closed doors (one in the bed by lawn 1, one set back at the end of the cross-path), Cervantes wall to
  cypress wall; the renders match.
- `elena-south-mouth-patio-wall`: approve with notes. In IMG_2358 the low wall that shows clearly runs
  across the patio's north side; the lane-side line is better supported by the Google aerial, now cited.
  Gate still open.
- `jorge-garden-east-wall`: approve with notes. The wall in IMG_2230 is there; its east face in the photo
  runs 4-5 m back to the awning and door, so the lantern and meter box are probably on the house face
  behind the stub (detail, not structure).
- `jorge-patio-wall-111`: **reject.** At 111.3 m it stood west of the first brick entrance (112.4 m), so
  the patio IMG_2230 shows behind the long planter had no way in. **Removed**; the conflict between the
  pin-placed entrances and the aerial is discrepancy `jorge-planter-gaps-vs-aerial`.
- `jorge-patio-wall-117`, `-124`: approve with notes. Both aerials show them; inferred is honest; re-check
  against the entrances when those are re-placed.
- Garden end moved to 104.4 / 104.1 m: approve. IMG_2230 shows planter and patio east of the wall; the
  Google strip shows the lawn ending against it.
- Lawn 2 vertex: approve. Old vertex 0.24 m through the wall, new one 0.45 m inside; the move is 0.69 m
  (0.61 m east, 0.32 m north), wording corrected.

This is a structure-stage sign-off in Inspect, not measured placement approval: no camera is solved.
