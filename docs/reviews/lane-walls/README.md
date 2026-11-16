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

Recorded below by the reviewing agent.
