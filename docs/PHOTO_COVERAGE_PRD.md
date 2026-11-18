# PRD: photo coverage, so we know where to take photos and when we have enough

Status: slices 1 and 2 built, 18 November 2026 (section 8); slices 3-5 to do. Written after the Elena junction work (`docs/HANDOVER_ELENA_JUNCTION.md`).
For a new chat to build. Read `AGENTS.md`, `docs/PHOTO_LOOP_PRD.md` and `docs/PHOTO_ALIGNMENT.md` first.

## 1. Problem

Dave walks the resort with a phone, and photos are the only way to fix what the model gets wrong. Today we cannot
answer two questions:

1. **Where are photos needed?** Photo requests (`data/photo_requests.json`, red spots on the map) are written by
   hand, only when an agent happens to notice a gap. There are 42 open now, of uneven quality.
2. **When do we have enough?** Nothing says whether a feature's photos can settle its position, depth and height.
   In the Elena work, several items stalled for the same reasons:
   - a feature seen only from far away: one camera at 20+ m fixes direction, not depth;
   - hidden behind a wall in every view;
   - photographed, but from a camera that is not solved;
   - two cameras that disagree with nothing to break the tie.

## 2. Goal

A coverage model that, for every feature and every area, says how well the photos pin it down. From that it writes
the shot list: where to stand, which way to face, what must be in frame. Dave can then walk a route on his phone
and know the area is done when its features turn green.

## 3. What "enough" means

Each feature needs evidence for the things that matter to it. Coverage is graded per feature, per question:

| Question | Enough when | Not enough when |
| --- | --- | --- |
| **Is it there, what does it look like** | One photo shows it clearly (tagged `shows`/`subject`, reviewed) | Only seen far off, cropped or behind planting |
| **Plan position (direction)** | One solved camera sees it, within 25 m | No solved camera sees it |
| **Plan position (depth)** | Two solved cameras see it with view directions at least 30° apart; or one solved camera within about 12 m; or one solved camera plus a feature the aerial shows sharply (lawn edge, roof edge) | All views come from one spot or one direction (the Elena roof: both cameras on one parapet) |
| **Height and levels** | A side-on or square-on view with a scale reference (door, tiles, steps), or the laser survey for open ground | Top hidden (the west wall under bougainvillea); seen only from above |
| **Hidden parts** | Recorded as `inferred` with the reason, and a request that names a viewpoint that can see it | Silently guessed |

The measured-approval bar (`docs/PLACEMENT_VERIFICATION.md`: 0.3 m rms with two solved cameras, or one plus the
aerial) is the top grade. Coverage says whether the photos *could* reach it, before anyone does the work.

Grades per feature: `unseen` → `seen` → `located` (direction) → `fixed` (position and depth) → `measured` (a
recorded measured approval). An area is **enough** when every structural feature in it is at least `fixed` and
every height-critical one has a height view. The scorecard turns green on that, not on "no open requests".

## 4. Requirements

1. **Coverage computation** (`scripts/photo_coverage.py` → `data/photo_coverage.json`):
   - **Inputs:** every feature in the evidence graph with a ring or points; every photo with a solved pose (a full
     view frustum) or an unsolved pin plus heading (a weaker, wider wedge).
   - **Visibility:** in frame, in range, and not blocked in plan by registry buildings or modelled walls taller
     than eye height (use the model export).
   - **Per feature:** the cameras that see it, their distances and view directions, the widest angle between two
     views, and the grade for each question in section 3.
2. **Requests from gaps:**
   - For each feature below `fixed` (or without a height view where one matters), propose a standing point on
     the walkable network. Pick a spot 4-12 m away that sees the feature, from a bearing at least 30° from its
     existing views and unblocked in plan, and give a look point.
   - State what must be in frame: the feature, plus two or three fixed corners for solving (registry corners,
     measured walls, kerbs).
   - Merge requests that one standing point serves. Keep hand-written requests and their wording; mark
     generated ones `generated: true`.
3. **Map layer and shot list:**
   - On `?view=map`, colour features by grade and show request spots with a look arrow. Group spots into a
     walking route per area.
   - Give a phone-friendly list: standing spot, facing, what to frame, why.
   - The existing `scripts/photo_requests.py` matching (position, heading, date) marks a request received when a
     matching photo arrives.
4. **Solve on intake:**
   - A new photo that answers a request gets a starting pose from its request (stand point and look point).
   - Its fixed corners get proposed as matches, so an agent only confirms them. Without this, new photos stay
     unsolved and coverage cannot rise past `seen`.
5. **Scorecard:** an area's colour comes from its coverage grades (section 3), and the count of features per
   grade shows in the scorecard panel.

## 5. Slices

1. **Coverage report only.** Run the computation on today's data; print the grades for the Elena and Cervantes
   areas. Check it against the handover's open items: it must flag the lawn's north edge, the cypress wall and the
   east patio wall as below `fixed`.
2. **Map layer.** Colour features by grade; show the existing 42 requests with arrows.
3. **Generated requests.** Propose requests for the gaps; an agent reviews them before they go live.
4. **Phone shot list.** A route per area, with the request text.
5. **Solve on intake.** Starting poses and proposed matches from the request.

## 6. Acceptance

- Slice 1 reproduces the known Elena gaps, and does not flag the measured lawns and west wall.
- For one area, Dave can open the map on his phone, walk the route, take the photos, and see that area's features
  move up a grade after intake and solving.
- No feature is shown `fixed` or `measured` on a single camera's depth beyond about 12 m.

## 7. Out of scope

- Automatic placement changes from coverage: coverage only says what the photos can support.
- New camera hardware (drones, laser measures). A tape measure note in a request is fine.

## 8. Built: slices 1 and 2 (18 November 2026)

### Running it

```bash
node scripts/shoot_views.cjs --model                          # the scene export: ground, walls, beds, buildings
python3 scripts/photo_coverage.py                             # writes data/photo_coverage.json and public/photo-coverage.json
python3 scripts/photo_coverage.py --report-only --area elena  # prints an area's grades, part by part, with reasons
python3 scripts/test_photo_coverage.py                        # JSON checks, including the Elena handover gaps
node scripts/test_coverage_browser.cjs                        # the map layer
```

Re-run it after solving a camera, adding photos or changing geometry. The test warns when the report is older
than its inputs; regenerating needs the scene export, so it is not done in CI.

### How it grades (scripts/photo_coverage.py)

- **Features:** every feature in the shared inventory (`scripts/assign_photo_map.py`) with a ring or points,
  except seafront areas, car parks and backdrop trees: 501. Each is sampled every 0.5 m along its rendered edges
  from the scene export (wall feet and tops, kerbs, lawn outlines, roof edges); registry houses at base and roof.
- **Cameras:** a solve counts as solved when its plan sigma is 1.5 m or less and its yaw sigma 3 degrees or less.
  That is 6 today: the north-pool station (IMG_2204-2206) and the Elena 24 roof (ELENA-ROOF-2026-11-17,
  IMG_2220, IMG_2358). IMG_2359 and IMG_2360 (4-6 m sigma) count as pins. The other 493 photos are wedges of
  +-45 degrees out to 30 m from their pin, aimed at the reviewed `looksAt` (or the phone heading), and can only
  make a feature `seen`.
- **Line of sight:** a 3D ray from the camera to each sample through a 0.1 m height field of registry buildings,
  exported walls, steps and bed kerbs, and the planted beds in `data/*.json` (planting is not in the export). The ray
  must clear each top by the combined uncertainty of that top (0.25 m), the camera's height sigma, and its pitch
  sigma times the range, so a grazing view does not count. Occluders within 1 m of the camera (the parapet the
  phone is held over) are ignored. Trees and climbers are not occluders.
- **Grades** follow section 3: `located` within 25 m of a solved camera; `fixed` with two solved rays 30-150
  degrees apart in plan, or one solved camera within 12.5 m (3D) that sees the feature's foot on the ground with
  a ground cast good to 0.5 m for its pitch sigma, or one solved camera plus a shape the aerial shows sharply
  (registry roofs, pool rings, lawns); `measured` from `measuredApprovals` in `data/placement_reviews.json`.
- **Parts and stretches:** each feature is cut into its plan sides (a ring's north, east, south and west sides) or
  ends (a line's two ends and middle), and graded per 1 m stretch from every camera that sees any edge there.
  A part takes the grade 60% of its stretches reach. A feature takes the grade 60% of all its stretches reach;
  its parts below `fixed` are listed as weak parts. A registry outline is rigid, so it takes its best side. A
  photo cited in a feature's evidence keeps it at least `seen`.
- **Height:** a feature with upright edges of 0.3 m or more in the export (walls, raised beds, steps) is
  height-critical. It has a height view when a camera within 15 m sees its foot and top within 25 degrees of level,
  or two solved cameras 30 degrees apart see its top. Registry roofs take their height from the laser survey.
- **Areas:** `enough` when every structural feature (not detail, not a lane) is at least `fixed` and every
  height-critical one has a height view. Today no area is enough.
- **Requests:** each photo request is linked to the features it would settle: those named in its text, those of a
  discrepancy it names, and those within 3 m of its look point.

### Slice 1 check against the Elena handover

| Handover item | Feature | Coverage | Why |
| --- | --- | --- | --- |
| Lawn's north edge | `cervantes_patio_walls.json:cervantes-patio-south-2` (the kerb) | seen | The roof cameras see 1 of its 5 one-metre stretches; the rest is behind the Cervantes north bed and garden wall. |
| | `frontage_divisions.json:cervantes-elena-lawn-1`, north side | seen (weak part of a measured lawn) | The same. The other three sides are `fixed` (roof camera plus the aerial). |
| Cypress wall | `lane_walls.json:elena-south-cypress-wall` | seen | The nearest solved camera is 25.3 m away; the ground photos of it (IMG_2261, IMG_2330, ...) are not solved. |
| East patio wall | `lane_walls.json:elena-south-mouth-patio-wall` | seen | The 1.35 m hedge in front hides 4 of its 5 stretches from the roof; the widest angle between the roof cameras is 3.7 degrees. |
| Measured lawns | `cervantes-elena-lawn-1`, `cervantes-elena-lawn-2` | measured (photos alone: fixed) | Not flagged. Lawn 2's far (south) side, about 20 m out, is a weak part. |
| Measured west wall | `lane_walls.json:elena-south-lawn-west-wall` | measured (photos alone: seen) | Not flagged. On the photos alone it is `located` at best: the roof cameras stand within 3 m of each other (widest angle 11 degrees); the nearest wall foot they see clearly is 13.3 m away, where a ground cast is good to about 1 m, not 0.5 m; and the far end is beyond 25 m. That is the limit the approval itself records. |

Also below `fixed` at the junction, as the handover says: the Cervantes steps and ramp (`seen`: the ground
photos of them are not solved) and the east hedge beds.

`scripts/test_photo_coverage.py` holds these while the requests that settle them
(`cervantes-elena-junction-square`, `elena-south-cypress-wall-gate`, `elena-south-east-patio-wall-square`)
are open.

### What it shows

- Almost everything is `seen` (261 structural features) or `unseen` (152); 15 are `located` or better. The
  lever is solving cameras: most features are already in some photo, but only 6 of 499 cameras are solved. Solving
  the junction ground photos (IMG_2262, IMG_2286, IMG_2328) would lift the kerb, steps and ramp without a new photo.
- `unseen` features are mostly house faces and patios inside blocks, and registry parts no photo points at.

### Map layer (slice 2)

On **Map & photos** (and in **Inspect**), press **Photo coverage**, or add `?coverage=1` (and
`&coverageArea=elena` for one area). Each side of a feature is drawn in its own grade, so a hidden edge shows. The
legend gives the area's counts and whether it has enough photos, and each grade can be hidden. Photo requests
appear as numbered spots with an arrow to the look point: red needs photos, amber is waiting for review. The
scorecard's own request pins are hidden while the layer is on. Tap a feature for its grade per side, the reason,
the solved cameras, the height view, open discrepancies and the requests that settle it. Tap a spot for what to
photograph and which features it settles.

### Limits

- Occluder heights are the model's: a hedge, wall or roof drawn too low or too high changes what a camera can see.
  Trees, climbers and parasols are not occluders, so some views through canopy count as clear.
- Pins are wedges: an unsolved photo's view is a guess from its pin and heading, so `seen` can be generous.
- The aerial rule trusts lawn outlines, roof edges and pool rings. The aerial does not show kerb or wall lines.
- Coverage says what the photos could support. It is not a measurement and grants no placement approval.
