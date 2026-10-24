# Photo camera alignment: north pool test

Test of `docs/PHOTO_ALIGNMENT.md` on the three upper-floor photos taken from one spot on the
south side of the north pool (IMG_2204, IMG_2205, IMG_2206). The north-pool alignment audit
recorded all three as `not-comparable`: its renders stood at the phone pin in third person and
could not reproduce the photos. Inputs and full results are in `data/photo_poses.json`.

`*-before-now.jpg`: the audit's render at the phone pin, the photo, and the render through the
solved camera. `*-overlay.jpg`: render edges over the photo with matched points (left) and a 50/50
blend (right). `*-after.png`: the render through the solved camera at the photo's own size.

## The solved camera

Solved as one station: one position and lens, a direction for each photo.

| | Value |
| --- | --- |
| Position (scene metres) | x −170.1 ± 0.3, z 37.1 ± 0.7, 8.5 ± 0.5 m above pool level |
| Lens | 27.7 mm equivalent (1281 px on these 1600 × 1200 images) |
| Distance from the phone pins | 4.9–5.3 m (pins reported ±3.4–4.7 m) |
| Directions | IMG_2204 yaw 333°, IMG_2205 4°, IMG_2206 301°; pitch −16 to −18° |
| Control fit | 7–10 px rms (pool edge, two building corners, nine upright edges) |

The height fits a roof terrace on a two-storey house plus eye height. The lens matches a recent
iPhone's default 28 mm main camera. Solved alone, IMG_2204 and IMG_2205 land within 2 m of the
station. IMG_2206 alone lands 6 m away: it shows only part of the pool and one corner, so it
cannot fix its own distance. Shared-station solving is what makes the camera dependable.

## What the model gets right

- **Pool outline** (traced from the aerial): 55 points on the photographed water edge sit a median
  0.07–0.11 m from the model's edge, at most 0.38 m. These are controls, so this is a fit, not an
  independent check. A wrong pool outline could not have fitted this closely alongside the corners
  and verticals, though.
- **Facade step** on the tall house (registry `6165501UF1366N_part5`, corner 36), held out:
  0.24 m from where the model puts it.
- **Tiled steps** up from the west lawn, by eye: they land on the photographed flight.

## What differs

- **Roof heights, measured.** All four held-out roof corners sit above the model's tops:
  1.01 and 1.10 m on the tall house, 1.06 and 1.24 m on the east block (`6266601UF1366N_part4`).
  That is about 0.3 m of camera uncertainty either way. The model gives a two-storey house
  2 × 3 m and no parapet; the photographed parapets stand about 7.0–7.2 m above their ground.
  Follow-up: task `north-pool-roof-heights`.
- **East side of the courtyard, by eye (IMG_2205).** A model building block stands where the
  photo shows the big yucca in front of an arched house set further back. A tiled route with
  route markers crosses what the photo shows as lawn and hedge. The model export does not cover
  either yet, so they are not measured. They belong to `north-pool-unresolved-plan`.
- **Garden walls and patios on the west side (IMG_2206)** are compared only by eye. The
  overlay shows the curved low wall and raised patios close to their photographed places. A
  measurement needs walls in the model export.

## Limits

Pixels were read off gridded zooms of the web copies; read errors of 2–5 px are likely. The
model's building heights and the pool trace are themselves estimates; footprint corners are
registry outlines. Upright edges only fix tilt. None of this is a placement approval under
`docs/PLACEMENT_VERIFICATION.md`, and no geometry was changed.
