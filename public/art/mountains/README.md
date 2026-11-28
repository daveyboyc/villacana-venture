# Mountain backdrop

`panorama.webp` (4096 x 224 RGBA) is a flat photographic backdrop of the ranges behind Villacana,
covering compass bearings -112 to 82 degrees (0 = north, + = east) and elevations -2.1 to 8.5
degrees at 21.1 px per degree. `addRidge` in `src/backdrop.ts` wraps it around a cylinder of radius
4200 m centred on `RESORT_CENTRE`.

## How it is built

`scripts/build_mountain_texture.py` builds `panorama.webp` from four of Dave's own photos — one per
bearing range, cross-faded over 1.5° at the joins, with colours matched to `IMG_2214` — and the
measured skyline:

- Every pixel on the cylinder is reprojected through the source photo's camera so the backdrop
  lines up with the photo from that viewpoint.
- `IMG_2204` uses its solved camera; `IMG_2214` is fitted to two peaks seen by solved `IMG_2205`.
  Cameras for `IMG_2483` and `IMG_2224` were fitted with `scripts/fit_skyline_camera.py`: GPS pin
  position, focal length from the lens (52 / 26 mm equivalent), and yaw, pitch and roll fitted so
  the crest lies on the measured skyline (median error 0.12° and 0.32°).
- The sky is cut away with a soft edge. Per column, the crest uses the photo where it shows clear
  sky over mountain within -1° / +2.2° of the measured skyline, and falls back to the measured
  skyline elsewhere, smoothed.
- Near trees and palms standing in front of the mountain are taken out and the hillside is carried
  across them.
- Below each photo's lowest kept elevation (close-up palms and roofs), the town colours are carried
  down.
- Uncovered stretches use a fill: a soft-edged silhouette along the measured skyline in the
  neighbouring photos' colours, lighter and bluer further from any photo, with two faint ridge
  lines and a subtle mottle, over a darker tree-belt colour below.
- No haze band is added.

## Bearing coverage

Bearing 0° = north, + = east.

| Bearing range | Source | Notes |
| --- | --- | --- |
| -112° to -29.5° | Fill | No photo shows the range west of -30° clearly: from the resort trees hide it and from the beach the buildings |
| -29.5° to -20.5° | `IMG_2204` | Solved camera; west of -29.5° trees and a pine hide the range |
| -20.5° to +27.5° | `IMG_2214` | Rooftop; fitted to two peaks seen by solved `IMG_2205` |
| +27.5° to +38° | Fill | From the rooftop trees and a hotel hide it; from the beach the resort does |
| +38° to +67° | `IMG_2483` | Paseo, 2x lens, the whole La Concha massif |
| +67° to +77.5° | `IMG_2224` | Beach east of the resort |
| +77.5° to +82° | Fill | The range meets the coast |

## Photos considered and not used

- `IMG_2205` / `IMG_2206`: clouds and trees.
- `IMG_2360`: solved pose is off for distant things (its sea horizon comes out about 2° low and tilted).
- `IMG_2215`: trees and a hotel.
- `IMG_2219`: shade sail across the range.
- `IMG_2481` / `IMG_2482` / `IMG_2480` / `IMG_2350` / `IMG_2300`: same view as `IMG_2483` / `IMG_2224`, less sharp or worse fit.
- `IMG_2597`: fit unreliable.
- West of -30°: no photo shows the range clearly — from the resort trees hide it and from the beach the buildings do.

## Source

Built solely from Dave's own photos already in `public/photos-ref` (downscaled, no EXIF/GPS). No
third-party imagery is used.
