# Inspection navigation · 27 October 2026

Opening the canonical app now starts in Inspect. Jump to inspect moves the camera
to an existing pool, named lane, the west paseo, Barraka or the coastal gate.
The character is hidden and stationary; pointer dragging pans, Orbit changes the
bearing and tilt, and scrolling, pinching or +/− zooms. Whole resort restores the
wide view. Walk and Map & photos remain available separately.

West-paseo start:
https://daveyboyc.github.io/villacana-venture/?view=overview&area=paseo-west

The `overview` URL value remains compatible with existing links. Named jumps use
existing mapped points, update the URL and do not reload the iframe. A reload
restores the area. Explicit photo inspection clears an earlier area bookmark so
that the selected source determines the focus. Photo links and `?view=map` still
open the reference map.

The inspection zoom limit is eight times the whole-area fit distance, compared
with three previously. The camera clipping range covers that distance. Pan no
longer stops at the player's walking bounds. The existing walking camera range
and initial special-view cameras are preserved.

## Review evidence

- [Desktop inspection](desktop.png): coastal gate, hidden avatar and direct controls.
- [Mobile inspection](mobile.png): west paseo at 390 × 844, area picker and controls
  within the viewport. The automated test also checks 320 × 568 and 844 × 390.
- Production inspection browser test passed default mode, real avatar visibility,
  expanded zoom, west-paseo/Elena jumps without iframe reload or player movement,
  mouse pan/orbit, area deep links/reload, separate Walk and touch pinch zoom.
- Existing overview regression passed zoom, rotation, North reset, alignment
  focus/fit, overlays, Walk visibility and mobile controls/reload.
- Existing layout regression passed 20 routes in both directions, 438 segments,
  closed/open gate behavior, material groups, refinement and route-clearance checks,
  with zero browser errors.
- Existing photo/map regression passed all 185 sources, search and camera/subject
  separation, selected-photo focus after an earlier area bookmark, full photos,
  stable links, private/unplaced sources, local reviews and mobile layouts.
- Production build, photo-assignment, reference-index and placement-policy unit
  tests, and all fourteen handover map/geometry/terrain checks passed.

## Placement gate

No geometry, collision, terrain, photo tags, source positions or raw feature IDs
are changed. `src/slice.ts` and the camera-bookmark helper are conservatively
included in renderer fingerprints, so regenerated references invalidate placement
fingerprints. `check_placement_changes.py --base origin/main` reports 237 missing
fresh placement-packet flags. This navigation change does not create or claim new
placement approval. The existing evidence and unresolved discrepancies are kept.
The exception is documented under AGENTS.md's Merging rule.
