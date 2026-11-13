# Independent source and detail review

Reviewer: Codex independent review agent `/root/middle_pool_review`, 2026-11-13.
The reviewer did not implement the runtime assets, data or scene changes. This is
a source/form and model-compatibility review, **not calibrated placement approval**.

## Sources actually inspected

I inspected the full public web copies of IMG_2193, IMG_2194, IMG_2331, IMG_2332,
IMG_2333, IMG_2340, IMG_2245, IMG_2679 and IMG_2713, including enlarged detail
crops, and the private `contact-sheets/middle-pool.jpg`. Private contact-sheet
pixels are not included in this report. `observations.json` binds the primary
public source dimensions, locators and SHA-256 values. I also inspected
`public/map/ground.jpg` with the actual `ground.json` bounds, the unchanged
middle-pool water/deck outlines, the placement overlay, source crop sheet, asset
atlas and the initial actual Inspect before/after screenshots.

## Source findings and resulting form

| Detail | Photo evidence | Assessment |
| --- | --- | --- |
| Paired showers | IMG_2679 clearly resolves **two** parallel stainless swan-neck posts, two downward heads and small mid-height controls. They overlap in IMG_2193/2194. | The revised asset contains two posts, small heads and controls, rather than a single shower, broad rain disc or invented enclosure. Height 2.15 m, separation 0.38 m, shaft diameter and exact curvature are estimates. The atlas supports the bounded form interpretation. |
| Slotted path cover | IMG_2332 and IMG_2713 show a dark circular cover in the crazy-paved path outside the cream deck, with concentric interrupted slots, a broad solid centre and pale square surround. | The first version had too small a centre and too many ring bands. The author corrected this after review to two slot bands and a 0.48-radius solid centre. The revised atlas reads substantially closer to the source. Diameter and exact slots remain estimated. |
| Deck access lid | A separate pale round lid with a small lifting hole is visible on the cream deck in IMG_2332/2713. | Correctly represented separately from the dark path cover. Review found the initial hard-coded height would float above the slab. The revision derives the asset top from the shared `DECK_TOP`, plus 3 mm; the shower flange also now starts at deck level. |
| East gate ironwork | IMG_2340 shows paired curled iron motifs within the existing open leaf, beyond plain vertical bars. | New slender central curls are a simplified interpretation, not a traced reproduction of every decorative loop. Existing opening, hinge, width, height and 92-degree angle are retained. No new gate or closed opening is inferred. |

The photographs continue to support a deck close to lawn level, a local rise on
the west approaches and higher bounded patios. They do not establish a need to
raise or lower the whole pool. The unchanged pool and terrain inputs preserve
that distinction; this review does not claim every surrounding terrace is accurate.

## Independent model-compatibility checks

I inspected `src/pool-detail-assets.ts`, `src/middle-pool.ts`, the shared deck-top
constant and the changed data. I independently calculated these model distances
from the actual outlines and current transform, separate from the author's tests:

- Shower feet are at `[-121.7, 90.21]` and `[-121.7, 90.59]`, at least 0.80 m
  outside the water ring and 0.68 m inside the deck edge.
- The overhanging heads at x = -122.19 remain at least 0.338 m outside the water.
- The complete declared 0.72 m shower radius clears the nearest mapped lane by
  3.19 m beyond its half-width, declared radius and 0.15 m guard margin.
- The cover and lid are assigned to the path and deck respectively. They are
  flush surface details, not new obstacles; the shower still uses the shared
  clearance guard. No pool/house ring, path axis, gate transform or terrain grid
  is changed by this pass.
- `python3 scripts/check_middle_pool.py` passed during this review. It supports
  software compatibility, not photographic placement accuracy.

## Inspect visibility review

The initial actual `inspect-after.png` shows the twin posts beside the existing
life ring on the east-lobe deck. Its viewport differs from `inspect-before.png`,
so the pair cannot support pixel-difference or calibrated alignment claims.
Close matched east/west/gate screenshots and the Layout render are pending at
this draft stage. Their visibility and grounding will be reviewed separately
when those files exist. The standalone asset atlas demonstrates the generated
asset forms, not their visibility or true position in the resort.

## Limits and decision

The primary sources support adding these bounded details and the corrected asset
forms. This review supports that limited implementation direction. **It grants
no measured horizontal-placement approval and no `placement-verified-by` edge.**

None of the cited cameras has a solved pose in the inspected `data/photo_poses.json`.
The aerial is approximately 0.24 m per source pixel and does not resolve the
concealed shower feet, cover or lid. No calibrated camera residual, RMS error,
held-out landmark validation or surveyed dimensions can truthfully be supplied.
The roughly metre-scale anchor uncertainty remains explicit in the data and
placement overlay. Source pixel locators identify pictured components; they are
not solved geometric measurements. Keep placement unverified and the task open
for any required measured evidence; retain earlier area discrepancies.
