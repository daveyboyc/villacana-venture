# Mountain backdrop

`panorama.webp` (4096 x 224 RGBA) is a flat photographic backdrop of the ranges behind Villacana,
covering compass bearings -112 to 82 degrees (0 = north, + = east) and elevations -2.1 to 8.5
degrees at 21.1 px per degree. `addRidge` in `src/backdrop.ts` wraps it around a cylinder of radius
4200 m centred on `RESORT_CENTRE`.

## How it is built

`scripts/build_mountain_texture.py` builds `panorama.webp` directly from Dave's own rooftop photo
(`public/photos-ref/IMG_2214.jpg`) and the skyline measured from his solved cameras:

- Every pixel on the cylinder is reprojected through the photo's camera so the backdrop lines up
  with the photo when seen from that camera.
- Because `IMG_2214` has no solved camera, its pose (yaw, pitch, roll and focal length from its pin
  position) is fitted so two peaks — the pointed Monte Mayor peak and the eastern summit — land
  where the solved `IMG_2205` sees them.
- Each bearing range uses one photo, with no repeated tiles.
- The sky is cut away with a soft feathered edge.
- Where trees, roofs or gaps hide the ridge (or where no photo covers the bearing), the crest falls
  back to the measured skyline, smoothed so it has no polygon corners, with colours filled from the
  photographed mountain and its average crest-to-foot shading.
- Below the mountains the photo's distant town and palms are kept down to the first roofs next to
  the resort (horizon level); under that, and at the foot of the filled stretches, the town's own
  colours are carried down, blurred over a few degrees.
- Filled stretches get a little low-frequency light and shade so they do not look flat.
- No haze band is added.

## Bearing coverage

| Bearing range | Source | Notes |
| --- | --- | --- |
| -112° to -20.5° | Measured skyline fill | Trees hide the range in IMG_2204–2206; a roof water heater hides it in IMG_2214 west of -20.5° |
| -20.5° to +27° | `IMG_2214` (`public/photos-ref/IMG_2214.jpg`) | Rooftop view of the range, cross-faded over 2° at each end |
| +27° to +82° | Measured skyline fill | IMG_2205 is clouded and IMG_2360 shows mostly trees there |

## Source

Built solely from Dave's own photo (`public/photos-ref/IMG_2214.jpg`), already published in this
repository with no EXIF metadata. No third-party imagery is used.
