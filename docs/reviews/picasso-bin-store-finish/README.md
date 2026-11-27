# Bin store finish (package 6)

Task `picasso-bin-store-finish`, 27 November 2026. A detail pass (stage 5 of the structure-first order) on the bin
store, whose structure passed review in `docs/reviews/picasso-bin-store-service-road/`. Everything added is
**Show details only** (`details=1`); Layout is unchanged. The yard's walls, doorway, street door and the four yellow
containers (Dave's placement) are not moved.

Frame: **s** metres south-east along the long car-park wall from its south end (-35.7, 23.9); **e** metres east of
its centre line. **t** metres along the bin store's car-park front from its south end (the doorway is at t 4.5).

## What was built

Data: `data/picasso_service_frontage.json` `binStoreDetails` (`front.bougainvillea`, `front.shrub`,
`front.planter`, `front.motorbikeBay`, `inside`). Code: `src/picasso-bin-store-details.ts`. Check:
`scripts/check_picasso_service_frontage.py`.

| Piece | Photo | Placement |
| --- | --- | --- |
| BASURA / RUBBISH BINS sign with its left-pointing maroon arrow and BURGER COMIC mark | IMG_3101 | on the long wall's yard face, centre s -0.75, 1.45 m up, 0.70 x 0.68 m: read at about 520 px a metre from the street door's north edge (s 0), about 0.2 m |
| Green recycling sign ("PLEASE USE RECYCLING BINS ... OTHER SIDE OF THIS WALL") | IMG_3101 | s -0.2, 1.42 m up, 0.25 x 0.35 m |
| Grey plinth band, 1.3 m, on every inside face | IMG_3101, IMG_3103 | about half the wall's height in both photos |
| Terrazzo floor, 1 m slabs, and the slot drain along the containers' fronts | IMG_3101, IMG_3103 | floor level with the car-park doorway's sill (see open points) |
| Black carriage lantern standing on a scrolled bracket | IMG_3103 | long wall's yard face, 1.2 m short of the north-west end wall, 2.5 m up, 0.42 m out |
| Bougainvillea: one continuous dark-green mass along the whole top, a shallow skirt down the car-park face, deeper drapes where photographed (stopping above the signs), one drape into the yard, few magenta bracts, and its grey trunk from the bed south of the doorway | IMG_3099, IMG_3100, IMG_3103 | t 0.4-13.8; trunk at t 3.75. Replaces the separate pink sprites |
| Clipped dark shrub south of the doorway, round the trunk, under the glazed cabinet | IMG_3099 (x 765-900) | t 2.75-3.85, 1.45 m high |
| White planter with a lilac-flowered shrub under the fire-hose box | IMG_3099 (x 0-75), IMG_3100 | t 9.1 |
| Motorbike-bay lines: a line 2.3 m out parallel to the front from t 5.2 to 7.3, crossed at its north end by a short end mark | IMG_3099 (x 250-420, y 1185-1240) | depth from an unsolved camera with an assumed 1.5 m eye height, about 0.5 m; the line's south end is hidden by the parked Fiat and stopped at the doorway's north jamb (inferred) |

Grades stay `estimated` (`data/confidence.json`, `picasso_service_frontage.json:picasso-bin-store-details`): no
camera here is solved. New gap `gap:picasso-bin-store-inside-arch` (the arch over the street door inside, and the
door's motor box) is left for the yard's structural revision.

## Camera pins corrected

- **IMG_3101** moved 1.6 m from the car park into the car-park doorway (-39.1, 23.6), heading 75 read from the photo
  (the north jamb at the left edge, the sign central, the door at the right).
- **IMG_3103** moved 1.9 m from the road side of the long wall into the middle of the yard just north-west of the
  doorway (-38.2, 22.4), about 1.4 m in from the front's inner face, heading 329 along the yard. (First placed at
  (-38.6, 22.6), in line with the container row; moved after the review, below.)

Both in `data/photo_positions.json` with the GPS kept, the manifest updated, and `looksAt` set in
`data/reference_tags.json`. The before renders already use the corrected pins.

## Renders

`<photo>-before.png` / `<photo>-after.png` are Walk first-person renders from the pins with Show details
(`scripts/shoot_views.cjs --details --task=picasso-bin-store-finish`). `IMG_3099-pose-before.png` /
`IMG_3099-pose-after.png` look through IMG_3099's starting pose at photo size (`--pose --initial --details`; not
solved). `*-pair.jpg` put the photo beside the after render (IMG_3099: photo, pin render, pose render). Scripted Inspect orbit renders (`scripts/shoot_inspect.cjs`) did not frame the bin store with the turned-frame target and bearing tried, so none is committed; open Inspect at the car park's south-east corner with Show details on to see it.

The pin renders were taken with a copy of `shoot_views.cjs` whose 120 s page timeouts were raised (the machine was heavily loaded); the script itself is unchanged. `IMG_3099-after.png` and `IMG_3099-pose-after.png` predate two inside-only changes (the draped floor and a lighter hull colour under the bougainvillea), which do not show from the car park.

## Open

- **Structure (not changed):** discrepancy `picasso-bin-yard-far-wall` stays open on photo request
  `picasso-bin-store-front`. IMG_3103's far wall reads about 7 m from its corrected camera against 8.8 m in the
  model. IMG_3099 also puts the front's south corner only about 2-2.5 m south of the doorway, where the model has
  4.5 m; both belong to that request. The lantern is tied to the end wall so it follows any correction.
- **Level:** the yard floor is drawn level with the doorway's sill (car-park paving height); the terrain inside the
  walls is 0.1-0.8 m lower, and the street door's foot is about 0.55 m below the floor, against the ramp up from the
  road in IMG_3123/IMG_3124. Open discrepancy `picasso-bin-yard-floor-level`, for `picasso-service-road-levels-and-beach`.
- IMG_3103 may show a fifth container across the far wall; the model keeps Dave's four (open question).
- The arch over the street door inside and the door's motor box (gap above).

## Review packet (for the independent reviewer)

No reviewer subagent could be started from this session, so the task stays `in-progress` until a reviewer who did
not make the change signs off here. Please check, with Show details on (`details=1`) and against the full-size photos
in `public/photos-ref/`:

1. **IMG_3101** (`IMG_3101-pair.jpg`): sign wording and arrow direction (left, towards the containers); the signs'
   order and spacing relative to the street door; the band's top near the sign's foot; the terrazzo floor.
2. **IMG_3103** (`IMG_3103-pair.jpg`): the lantern's side (right-hand, long wall), height and position near the far
   end; band on all faces; floor and drain. The yard's length differs (open discrepancy, not this task).
3. **IMG_3099 / IMG_3100** (`IMG_3099-pair.jpg`, `IMG_3100-pair.jpg`): the bougainvillea reads as one continuous
   green mass with few flowers and does not hide the signs; the trunk and shrub south of the doorway; the planter
   under the fire-hose box; the motorbike-bay line in front of the north part.
4. Layout is unchanged (nothing new outside Show details); the four containers are where Dave placed them (only
   their base now follows the floor); no wall, opening or footprint moved.
5. Data and grades: `data/picasso_service_frontage.json` `binStoreDetails`, `data/confidence.json`
   (`picasso-bin-store-details` estimated, new `gap:picasso-bin-store-inside-arch`), `data/photo_checks.json` (four
   `picasso-bin-store-finish` checks), the two corrected pins in `data/photo_positions.json`.

Record the verdict (sign-off or a list of errors) below.

### Verdict

Independent review, 27 Nov 2026: **changes needed**.
1. The IMG_3103 pin sat in line with the container row (1.07 m from the front's centre line), so a container blocked
   the after render. Fixed: the pin is moved about 0.5 m into the middle of the yard and IMG_3103 is re-shot
   (`IMG_3103-after.png`, `IMG_3103-pair.jpg`); its photo-check note is corrected.
2. The floor-level conflict was recorded only here. Fixed: discrepancy `picasso-bin-yard-floor-level` (linked to
   `picasso-service-road-levels-and-beach`), and the confidence entry's `why` mentions it.
Minor: the possible fifth container is recorded as an open question (area note, photo check); the terrazzo is warmer
beige (`#e3d5bb`).

Final sign-off after these fixes: **APPROVED** (27 Nov 2026, the same independent reviewer subagent, which made
neither revision). The new IMG_3103 pin (-38.2, 22.4) sits about 1.4 m in from the front's inner face with the
original GPS kept; the far wall's centre falls at 0.51 of the frame width against the photo's 0.52. The far wall
still looks narrower than in the photo (22% of the frame against 43%), which belongs to the open
`picasso-bin-yard-far-wall` discrepancy, so that check stays `differs`. The floor-level discrepancy
`picasso-bin-yard-floor-level` is honest and routed to the levels stage. Open: yard length, floor level, the
possible fifth container, the inside arch and the small motor box.
