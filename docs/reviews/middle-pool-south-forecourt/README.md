# Middle pool south forecourt — draft, 21 October 2026

The entrance in IMG_2334/2335 has irregular grey/buff stone paving between an
east hedge and a west white planter with a recessed tiled bench. The previous
render covered the short gate paving with crossing terracotta route ribbons and
showed lawn beyond it. This draft extends the existing stone patch 1.4 m inward
and removes the overlapping visual road ribbons inside that patch. It adds a
short Details-only hedge fragment beside the gate.

Task `middle-pool-south-forecourt` remains **in progress**. Its estimated full
boundary and hedge continuation do not have placement approval. The existing
south-gate discrepancy is retained; this draft does not close it.

Dave's subsequent clarification identifies two planted frontage borders on the
tiled street beyond the gate. They are mapped separately in the
[annotated photograph and source-relative plan](lane-planters/README.md),
with the visible doorway break retained. This adds evidence and a future build
task; the current 3D draft has not yet built those lane-side beds.

## Repository photo accounting

[photo-inventory.json](photo-inventory.json) records the exact repository revisions
and results. All 172 primary reference records are in the canonical map catalogue:

| Sources | Count | Map accounting |
| --- | ---: | --- |
| Phone photos | 145 | 144 camera pins; one beach photo without GPS stays searchable and unplaced |
| Older own photos, private | 12 | Searchable, area-tagged source links; no invented camera pins |
| Map screenshots, private | 11 | Searchable source links; no camera positions asserted |
| Web photos, private | 4 | Searchable source links; no camera positions asserted |

All public photo files have manifest/index records and all manifest pixels exist.
The 67 private `photos/drive/` files are byte-identical duplicates of indexed
public copies. Thirteen generated contact sheets and thirteen uploaded audit
maps/renders are derived review artifacts, not additional photographed viewpoints.
No primary source is missing from the catalogue. Original Drive files were not
scanned for a newer batch in this repository audit.

Accounting is not placement verification: 77 phone associations are suggestions,
67 need review, and one is unplaced. GPS represents the camera, not the subject.
The private references remain private. The legacy prototype album is separately
credited in the root README and is not location evidence for this map.

## Sources, common frame and proposed correction

Full-size [IMG_2334](../../../public/photos-ref/IMG_2334.jpg) and
[IMG_2335](../../../public/photos-ref/IMG_2335.jpg), the private middle-pool contact
sheet, actual Esri ground raster, its georeference, registry rings and route axes
were inspected. The independently inspected source limits are in
[independent-source-review.md](independent-source-review.md).

[overlay.svg](overlay.svg) draws the unchanged aerial frame, registry ground
footprints (white), route axes (pink), old paving (cyan), bounded stone proposal
(gold) and hedge fragment (green). Roof overhangs are not ground footprints.
[alignment.json](alignment.json) retains the raster hash, exact global transform,
old/new outlines and measurable model dimensions. It contains no invented source
residuals or placement controls. No local image warping is used.

The proposed rectangle is 5.15 m long including 0.15 m beyond the gate, and 2.12 m
wide. These are model estimates tied to the existing gate frame, not independent
survey measurements. Only the material and which side the hedge/planter occupy
are established by the photos. Aerial foliage, roof projection and shadow obscure
the complete endpoints. The aerial's approximately 0.24 m/pixel sampling does not
establish its accuracy or identify concealed corners.

Calle Eva meets Silvia at local `along=-2.99 m, across=0`. The photograph does
not show terracotta crossing the stone foreground. The routes remain usable and
retain their axes; their overlapping visual surface is trimmed inside the stone
patch. The hedge stops before this crossing to protect its full visible width.
That interruption is an unresolved source conflict, **not a photographed gap**.
No new wall, inferred private boundary or hedge beyond the bounded fragment is
added. Registry house/pool rings, gate/bench/planter solids, terrain and collision
inputs remain unchanged. Hedge cards use the existing original vegetation atlas,
and stone remains procedural; no reference image becomes an app texture.

## Source-versus-render diagnostic

Both pairs use `shoot_views.cjs`, the same stored corrected camera and reviewed
look-at, middle pool and Details enabled. This is the existing third-person game
camera with uncalibrated eye height, pitch and intrinsics, not a calibrated match.

| Source | Before | After | Observed result |
| --- | --- | --- | --- |
| IMG_2334 | [Before](IMG_2334-before.png) | [After](IMG_2334-after.png) | Stone replaces crossing tiles/lawn locally and an east hedge fragment is visible. Longer corridor, continuous hedge and adjacent frontage still differ. Recorded `differs`; follow-up remains this open task. |
| IMG_2335 | [Before](IMG_2335-before.png) | [After](IMG_2335-after.png) | Stone continues beside the retained bench. Third-person wide view cannot verify the source close-up or hidden full boundary. Recorded `not-comparable`; earlier bench-specific check remains. |

Reproduce each pair on the appropriate checkout:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/shoot_views.cjs \
  IMG_2334 IMG_2335 --pool=middle --details \
  --task=middle-pool-south-forecourt --as=after
```

## Validation and completion limit

The source check verifies cited files, bounded paving against registry solids and
the hedge's full visible footprint against all protected routes. The browser
regression additionally tests road subtraction area, absence of road tiles over
stone, both-direction forecourt traversal, unchanged level through the gate,
Details-only hedge presence and clearance. The full layout run traversed 20 routes
in both directions, 406 segments, with no runtime errors.

Build and other required check outcomes are recorded in [validation.txt](validation.txt).
The placement change gate is expected to reject unapproved geometry. The source
review cannot identify all proposed boundary vertices, three distributed controls
and two held-out ground landmarks within the required tolerance. No placement
approval is fabricated. The branch must remain a draft until that source evidence
and an independent measured packet are available, as required by
[AGENTS.md](../../../AGENTS.md) and
[PLACEMENT_VERIFICATION.md](../../PLACEMENT_VERIFICATION.md).
