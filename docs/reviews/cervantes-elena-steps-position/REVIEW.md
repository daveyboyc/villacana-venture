# Review: Cervantes/Elena ramp, steps and the Elena 24 garden door

Reviewer: `reviewer-subagent-ztsc2t` (agent; did not make the change), 17 November 2026.
Change reviewed: commit 52ea687, "Cervantes/Elena ramp, steps and Elena 24 garden door moved west". The
request said the change was uncommitted, but it was already committed when I looked.

**Verdict: approved as an estimated correction.** This is not a measured placement: no ground camera at the
junction is solved. Two moves are approved:

- the drain, the three steps and the ramp, 2.0 m west, good to about 0.3-0.5 m;
- the garden door, its steps, patio, east planter and hedge bed, 1.0 m west, good to about 0.4 m.

No fixes are required. Three points are left open below.

## 1. The drain at the lawn corner (IMG_2262) and the tile count

IMG_2262 is taken at the junction looking west up the flight.
- The near lawn's north-east kerb corner (around 400,1440) stops right at the drain's west edge. The ramp runs
  up between the lawn kerb and the three white-risered steps on the north half. I agree with the reading.
- That corner is where the lawn's north edge meets the Elena south lane kerb. The lane kerb runs at right angles
  to Cervantes (direction (0.513, 0.858) against u = (-0.859, 0.513)). So the corner's position along
  Cervantes is set by the lane-kerb line, which the roof cameras measured, and not by the lawn's north edge,
  which is only inferred. Moving the north edge slides the corner along the lane kerb, not along Cervantes.
  This makes the drain position the best-fixed part of the change.
- Tile count: along the ramp column beside the lawn's north kerb I count 10 to 10.5 rows of 0.4 m tiles from
  the drain to where the white kerb ends at the shrubs below the CALLE ELENA wall. That is 4.0-4.3 m against
  the model's 4.6 m lawn north edge. The 0.3-0.6 m difference points at the kerb's west end (it may stop at the
  shrub bed short of the wall) or the inferred north edge. It does not move the drain. Left open.

## 2. Door 1.0 m against drain 2.0 m (IMG_2196, IMG_2327)

- **IMG_2196** looks square-on at the door. In the tile row in front of the bottom step, the grout spacing is
  about 123 px per 0.4 m tile, and the 1.2 m bottom step spans 350 px (2.85 tiles), which agrees. Measured
  from the drain's far end:
  - the bottom step's west end is about 340 px away (**1.1 m**);
  - the door centre is about 515 px away (**1.65-1.7 m**).
- The model now gives **1.12 m** and **1.72 m**. Before the change it gave 0.72 m to the door centre. So the
  split between the two moves (drain 2.0 m, door 1.0 m) matches the photo to about 0.1 m.
- **IMG_2327** looks west from the door. It shows the same order: door step, then the planter's rounded end,
  then the drain at the planter foot, then the flight beside the hedge. It cannot add a metric check.
- **Roof cameras.** I projected the old and new door jambs (0.72 m door, 0.45 m threshold, head at 2.25 m)
  through the solved poses:
  - IMG_2358 puts the photographed door centre 0.61-0.62 m west of the old door, at both head and foot;
  - ELENA-ROOF puts it about 0.75 m west.
  - That is 0.6-0.75 m, against the packet's 0.6-0.9 m.
  - In both photos the door looks 1.3-1.6 times wider than the model's 0.72 m door. The close-range geometry,
    or the door size, is off, so I give these casts less weight than the IMG_2196 spacing.
  - The 1.0 m move is 0.25-0.4 m beyond the roof casts. It is accepted at an absolute uncertainty of about
    0.4 m. The door's width (about 0.9 m in the roof views) is open.

## 3. Laser survey (sampled myself)

I sampled `layout-checks.local/lidar` with `lidar_check.Survey` and `to_utm`, interpolating bilinearly. The
profile runs along u through the old foot (-152.41, 57.06), at offsets of -0.6, 0 and +0.6 m across the lane.

- **mdt2021 (1 m grid):** level at 5.58-5.61 m from 3 m east to 2.0 m west of the old foot. It then climbs:
  5.67 at 2.5 m, 5.90 at 4.0 m, 6.04 at 5.0 m, 6.13 at 6.0 m. With 1 m smoothing, the middle of the 3 m rise
  is near 4 m, so the foot is about **2.0-2.5 m west**.
- **mdt2015 (2 m grid):** the rise starts about 0.5-1.0 m west and is level again by 4 m, which puts the foot
  about 1.0-1.5 m west.
- Plan registration of either survey is about 1 m. The 2021 survey supports the 2.0 m move; the 2015 one does
  not contradict it.

## 4. Other changes

- **Hedge bed:** it now runs from the door 3.8 m west along the lane, past the drain and beside the flight, as
  IMG_2327, IMG_2328 and IMG_2196 show.
- **North garden wall:** its east end follows the door wall.
- **Before/after renders:** IMG_2328 and IMG_2286 now have the drain in front of the flight, with the steps
  beyond it next to the bed, matching the photos. The before renders had the flight on the drain's door side.
- **Terrain:**
  - Ten grid cells were regenerated around the junction.
  - The vertex at (-152, 54) went from 0.59 to 0.87 m. It lies 0.42 m behind the door-wall line, under the
    east planter and patio side, between 0.60 and 0.67 m neighbours. The lane in front of the planter still
    samples about 0.63 m and `check_terrain` passes.
  - Worth a look in Inspect (Layout) for a small hump at the planter's foot.

## Checks

- `check_terrain`, `check_cervantes_garden_door`, `check_cervantes_lane_edges`, `check_lane_walls`,
  `check_levels`, `check_boundary_reference`: all PASS.
- `build_references.py --check`: 533 references, 0 problems.

## Open (not blocking)

1. The lawn north kerb reads 4.0-4.3 m in IMG_2262 against the model's 4.6 m: check the kerb's west end and
   the lawn north edge.
2. Door position: the roof casts give 0.6-0.75 m, the drain spacing gives about 1.05 m. The door's width
   (0.72 m in the model, about 0.9 m in the roof views) is also unsettled. A solved ground camera (IMG_2196 or
   IMG_2327) would settle both.
3. The terrain vertex (-152, 54) at 0.87 m: confirm there is no visible lane hump in Inspect.
