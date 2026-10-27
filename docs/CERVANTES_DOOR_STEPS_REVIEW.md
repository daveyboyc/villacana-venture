# Cervantes door steps: placement review, issue #33

## Update after the photo levels survey

The later 15 October survey resolves the placement blocker below: IMG_2287 and
IMG_2196 show a **garden door in a wall**, with a private patio between it and the
registry house. The old review incorrectly required a house-facade anchor.
`data/levels_survey.json` anchors the garden wall near (-152.5, 55.5) ±1.5 m.

Implementation is now in `data/cervantes_garden_door.json` and
`src/cervantes-garden-door.ts`: a bounded wall with a closed timber door and
curved coping, two red treads/white risers totaling .45 m, a partial private
patio at the same datum, and a .425 m west bed. The former continuous north
patio wall is locally trimmed where it would cut across the door approach.
Map, visible treads, player ground, wall/door collision and bed collision share
the same outlines/data. Houses, lane/ramp geometry and the .5 m Dalí rise stay
unchanged. Planting uses guarded Details-only hedge sprites.

The patio association remains a low-confidence roof-view interpretation. Only a
bounded floor patch is modeled: no complete enclosure, additional entrances,
connections or facade corrections are asserted. Door position remains an
estimate, and tread lengths/wall dimensions are not measured.

Task remains in-progress pending the parent's serial before/after camera review
and final browser suite. Immutable baseline source is captured from `adca41e` in
`layout-checks.local/issue-33-survey-baseline/adca41e-source.tar`; its SHA is in
`commit.txt` there. The old baseline images below predate the survey.

Source checks: `check_cervantes_garden_door.py` checks the three photo height
ranges, bounded bed/patio above terrain, all lane clearances, unchanged registry
clearance and old-wall trimming. Browser regression includes tread raycast/player
height agreement, two equal risers, private patio datum and closed door collision.

## Historical placement review (superseded)

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

## Step detail recheck (27 October 2026)

The full-size IMG_2196, IMG_2287 and IMG_2327 show **three** white risers, not two:
the lane, two red treads of two small quarry-tile rows each, then a threshold tread
in front of the door. The bottom step is wider (about 1.2 m) with rounded ends and is
flush with the west bed front; the upper flight sits between the bed's rounded end
and a low east planter. `data/cervantes_garden_door.json` now records the three
treads (`steps`), the door frame and the planter; the wall origin, the .45 m rise and
the patio are unchanged. Sources, measurements and before/after renders:
[reviews/cervantes-door-steps-detail](reviews/cervantes-door-steps-detail/README.md).
