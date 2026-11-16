# Workflow lessons from the north pool (November 2026)

These lessons come from the north-pool sessions: the ground plan, the station foreground, the measured
pool ring, the north-row frontage and the west gardens. Each item says what went wrong or right, and
what to do next time.

## 1. Get the structure right before the details

Detail work that sat on a wrong layout had to be redone:
- **North patio front:** it was 0.2-2.3 m too far south, so the path and lawn in front of it were wrong
  too.
- **Pool's deck tongues:** the registry drew both short, by 0.6-0.9 m.
- **South-east patio wall:** it was first traced running the wrong way.
- **Awnings and furniture:** placed against facades that a single camera could not locate in depth.

For each area, settle these first, in order, and get them reviewed:
1. **Plan layout:** house fronts, pool rings, paths (centreline and width), walls and boundaries with
   their openings, and patio and lawn outlines.
2. **Levels:** floors, steps, ramps and stairs, checked against the laser survey (`scripts/lidar_check.py`)
   and `data/levels_survey.json`.
3. **Then the details:** furniture, awnings, climbers, planting and facade ornament.

A structural item is done when a reviewer has checked it in Layout against the photos and the aerial.

## 2. Cameras decide what can be measured

- **One position fixes direction, not depth.** All the north-pool photos come from one roof station
  (IMG_2204-2208). Positions across the view are good, but depth near the far house fronts is uncertain
  by 1-3 m, and two cameras at the same spot disagree by about 0.25 m each in depth.
- **Ask for photos early.** Before building an area, list where its depth is unconstrained and ask for
  photos from a second position (`data/photo_requests.json`): two or three ground-level shots a few
  metres apart are enough.
- **Pick the better camera, and say why.** Where two solved cameras disagree, use the one with the
  smaller residual on unchanged features. IMG_2205 read 0.11 m rms on the pool edges, IMG_2204 0.35 m.
- **Measure on known planes.** Measure on a plane you already know: the deck level, a wall's vertical
  plane, or a registry facade's projected span. A free cast can't tell a floor height or a wall's
  direction.
- **Check plausibility.** If a measured gate comes out 0.56 m wide, the wall's direction is wrong.

## 3. Independent visual review works; use it every time

A second agent comparing renders with full-size photos, region by region, caught:
- a balcony claimed removed but still there;
- a canopy rendered upside down;
- gate openings off by half a gate;
- a wall running the wrong way;
- a mis-picked measurement point;
- awnings hung too high.

None of these showed up in the checks. Give the reviewer the photos, the renders, the Inspect views and
the data. Ask for pixel and world coordinates. Repeat until it says satisfactory.

## 4. Generated detail hides photographic truth

Hashed hedges, random awnings, climbers, balconies and porch roofs, and generated garden walls and gates,
often stand exactly where a photo shows something else. Before adding photographed detail, list what the
generator puts there and switch it off with a photo-backed record:
- `data/plain_fronts.json` for porches and openings;
- `photographedFrontage` and `replacesGardenWalls` in `data/north_pool_frontages.json`.

## 5. Read the data contract before writing data

- In the ground plan, an opening's `at` is its centre, not its start.
- Hand-formatted JSON files keep their layout. Replace the changed block as text, or use a formatter
  that round-trips the committed file.
- Check scripts encode earlier design decisions. Update them with the new evidence, keep their intent,
  and say so in the PR.

## 6. Smaller points

- **Route-clearance guard:** photographed trees whose canopy overhangs a route are marked
  `canopyOverhangs`, so only their trunk keeps the clearance (Dave, 2026-11-16).
- **Skeleton patches:** `public/map/skeleton.json` is patched in place; a full `build_skeleton.py` run
  does not reproduce it. Rebuilding just the pools via `build_pools()` does reproduce them.
- **Merging:** generated files (`refs/`, `public/*.json`) conflict on merge. Take main's copy and
  regenerate.
