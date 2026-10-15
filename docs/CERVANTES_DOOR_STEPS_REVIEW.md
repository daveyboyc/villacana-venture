# Cervantes door steps: placement review, issue #33

Reviewed 15 October 2026. Task `cervantes-door-steps` remains **in-progress**,
owned by `issue_33`; geometry is not implemented. A door/facade anchor is needed
before placing a walkable stoop. Existing terrain, registry footprints, the ramp,
and its separate three steps remain unchanged.

## Observed structure

IMG_2327 shows two red tiled treads, white risers/sides, and a brown timber house
door on the right when looking west along Cervantes. Its top tread stops at the
door. The stoop lies beside the foreground lane, immediately east/downhill of the
drain and separate from the three steps beside the ramp beyond the drain.
IMG_2328 independently shows the door-step corner at the lower right. The task
title's “west of the Elena junction” does not mean west/uphill of the drain.
Plumbago and bougainvillea frame the door; vegetation must not substitute for
locating the facade.

Read the Cervantes contact sheet and inspected IMG_2327/2328 at full size.
Also inspected IMG_2368, IMG_2369 and IMG_2359 roof views: these corroborate the
patio/enclosure arrangement but roofs, planting and perspective hide a unique
anchor for this particular foreground doorway. The aerial was compared with
registry rings and the current Cervantes centerline. It cannot resolve the door
or its small stoop.

## Why placement is blocked

The modeled ramp drain is at `[-152.41, 57.06]` (unrotated map metres).
The camera pin shared by IMG_2327/2328 is `[-150.5, 56.0]`, with reported
uncertainty of ±4.2/4.0 m; headings are 264° and 252°. These locate an uncertain
camera, not the door. The renderer uses a third-person view and is not calibrated
to match photo pixels.

The nearest north-side solid registry facade to the modeled drain belongs to
`6265201UF1366N_part4`. Its nearest segment runs from `[-154.24, 50.96]` to
`[-157.84, 53.13]`; the closest point is approximately
`[-155.595, 51.777]`, **6.17 m** from the drain. There is no nearby zero-storey
registry part that supplies a closer door-bearing facade. This discrepancy is
also visible in the before render: a broad paved frontage separates the modeled
lane wall from the house fronts, whereas the photographed stoop meets the lane.
Neither the nearest point nor a repeated procedural brown door establishes the
correct house entrance.

Adding two guessed treads at that facade would preserve route clearance but
would not reproduce the observed lane/door relationship. Adding them beside the
drain would leave the door detached from the registry house. Moving the house,
extending its facade, adding a connecting wall/path, or shifting the lane would
assert a larger layout correction without sufficient evidence. Those are not
safe ways to claim this task complete.

## Evidence needed to continue

Identify the house/corner containing the brown door in IMG_2327 on the reference
map or a roof view, then check whether the local facade or lane trace needs a
specific correction. A useful question for someone who knows the location is:

> Which house or roof corner contains the brown door with two red steps in
> IMG_2327, immediately downhill of the Cervantes ramp drain?

Once that anchor is known, implement only the two-step footprint ending at the
facade, share it between map/mesh/player ground, and preserve the ramp and all
site levels. Repeat both camera renders and the full geometry/movement checks.

## Review artifacts and checks

Ignored local artifacts in this worktree:

- `layout-checks.local/issue-33-before/IMG_2327.png`
- `layout-checks.local/issue-33-before/IMG_2328.png`
- `layout-checks.local/issue-33-before/aerial-registry-lane.png`

The aerial overlay uses yellow registry outlines, cyan Cervantes centerline,
red modeled drain, and magenta camera pin. It is a review aid, not a traced door.
Both camera renders completed without runtime errors using:

```bash
flock /tmp/villacana-browser.lock -c 'PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/shoot_views.cjs IMG_2327 IMG_2328 --pool=north,middle --details'
```

No “after” render or geometry acceptance is claimed because no geometry changed.
Source checks for patio walls and terrain, photo assignment validation and the
regenerated reference catalogue were checked for this review.
