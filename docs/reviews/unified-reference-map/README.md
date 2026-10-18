# Unified map and photo discovery review — 18 October 2026

This change consolidates the app and evidence lookup. It changes no runtime map,
3D, collision or terrain geometry. The complete north-pool alignment audit remains
in [north-pool-alignment-audit](../north-pool-alignment-audit/README.md); this UI
review does not extend its accuracy conclusions.

## Comparison artifacts

| Capture | What to review |
| --- | --- |
| [Whole-resort map](map-desktop.png) | Canonical navigation, detailed registry geometry, photo IDs on by default, complete searchable source list |
| [Boat reference](boat-reference.png) | Three boat sources, source photograph and explicit camera-to-subject disagreement |
| [Mobile selection](map-mobile.png) | Same source IDs and photo card on a narrow screen |
| [Overview photo IDs](overview-photo-labels.png) | Same current 3D world; photo labels reopen the canonical source card |

These are clean UI captures, with no saved test captions or review notes. Public
photo pixels are already published in `public/photos-ref`; private images are
linked to their private repository and are not embedded in these artifacts.

## Source findings

Inspected the Barraka private contact sheet and full IMG_2223, IMG_2346 and
IMG_2347. Their visible boat is sand-filled and used for cooking (logs and smoke
in IMG_2223). The planted sign is a separate object. All three captions now name
the barbecue boat and searching “boat” or “Barraka beach boat” returns all three.
The photo labels, source paths, private links, camera uncertainty, reviewed
subject and citation/check state come from one generated reference index shared
by the browser and `scripts/find_reference.py`.

The existing independently aerial-anchored boardwalk is used for approximate
subject discovery only: [37,126], about 3 m estimated uncertainty. Camera pins
remain [39.3,102], [35.6,95.2], [35.3,96.5]; no camera calibration or local imagery
warp is invented. The card and copied reference explicitly flag their inland
conflict, including the limitation of IMG_2346's earlier content confirmation.

The boat mesh is absent from the model. It is recorded as open task
`barraka-barbecue-boat`, with these three sources and requirements for measuring
placement, comparing renders and sharing map/3D/collision geometry. A citation of
these images by existing boardwalk/sign/seating code does not establish a boat.
No modern photo-check record is added for this tooling task, and no calibrated
photographic match is claimed. Existing earlier manual reviews are preserved.

## Verification

| Check | Observed outcome |
| --- | --- |
| Reference generation and validation | 172 references, 0 problems; contact sheets regenerated with no private-repo changes |
| Photo/map assignment tests | 11 pass |
| Shared index and agent-discovery tests | 5 pass: complete links, private/unplaced discovery, boat lookup, unchanged camera frame, honest tooling verification |
| Geometry/source checks | All 12 handover checks pass (map, streets, boundary, terrain, Dalí, Cervantes, Elena, middle pool, paseo, seafront, pool levels and levels) |
| TypeScript and production build | Pass |
| Layout browser regression | 20 routes in both directions, 404 segments; gate behaviour and material groups pass, no page errors |
| Overview browser regression | Zoom, bearing/reset, focus, alignment controls, walk visibility and mobile toolbar pass |
| Mobile browser regression | Portrait/landscape controls, touch pinch/cancel/pan, fit and compiled grass-material parity pass |
| Unified-map browser regression | 172 sources; multiword boat search; full photos; canonical/legacy links; overview-to-photo navigation; private/unplaced sources; saved captions/reviews/moved cameras and exports; narrow-screen navigation and visible subject focus pass |

The tooling task is explicitly **photos: not-applicable (tooling)** in the queue,
not a photographic match or an unreviewed geometry item. A tooling task that names
model-photo inputs still requires the normal checks; geometry tasks do not gain
this exemption. Existing photographic checks are unchanged.

## Separate conclusions

- Map accuracy: existing coordinates and geometry are unchanged. The UI now uses
  the detailed registry map for the canonical entry, replacing the old default
  OSM world and separate simplified photo-map renderer. This does not certify
  the map against satellite imagery.
- Photographic agreement: full sources support the corrected boat identification
  and relative side/order beside the boardwalk; dimensions, precise placement and
  a 3D photographic match remain unresolved. No blanket area verification.
- Software: the tests below check discovery, privacy boundaries, links, persistence,
  controls, geometry consistency and rendering; they are separate from fidelity.
