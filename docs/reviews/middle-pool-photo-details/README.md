# Middle pool photo details — 13 November 2026

The owner requested a new photo check of the middle pool and additional assets and details.
This pass adds two parallel curved stainless shower posts, a dark circular path drain,
a separate pale deck access lid, and paired curls within the existing east gateway leaf.
The shower, drain and cap are reusable mesh assets in `src/pool-detail-assets.ts`.
The additions appear in Inspect with Show details; the gate's structural leaf remains in Layout.

## Sources and inventory

Full public photos and the private middle-pool contact sheet were inspected. Public source
locators, image dimensions and SHA-256 hashes are recorded in `observations.json`.
`source-details.jpg` contains crops of public web copies only; private pixels are not published.

| Component | Evidence | Observation | Limits |
| --- | --- | --- | --- |
| S01 twin shower posts | IMG_2679, IMG_2193, IMG_2194 | Two slim parallel stainless stems, inclined curved necks, separate small downward heads, mid-height controls | 2.15 m height, 0.38 m spacing, 48 mm pipe and midpoint are estimates; bases partly obscured |
| D01 west path cover | IMG_2332, IMG_2713 | Concentric interrupted slots around a substantial solid centre; pale square surround in crazy paving outside the deck | 0.30 m diameter and exact path anchor estimated |
| C01 deck lid | IMG_2332, IMG_2713 | Separate pale circular inspection lid on cream slab deck | 0.28 m diameter, lifting hole and exact anchor estimated |
| G01 east leaf ornament | IMG_2340 | Paired curled iron motifs in the lower-middle panel of the open leaf | Rod diameter and curves stylised; hinge, opening and open angle retained |

`detail-assets.png` shows the actual reusable assets. Drain and cap are shown at twice their
estimated scale there to make their forms legible. Independent source review identified the
two overlapping shower posts and corrected the drain's formerly undersized solid centre.
It also caught an initially floating deck cap: its final top is now derived from the actual
asset bounding box and shared `DECK_TOP`, 3 mm above the slab surface. Shower feet sit on
that same deck top. The path cover follows the existing path datum independently.

## Elevation check

IMG_2193/2194 show the deck close to lawn level. IMG_2332/2713 show local grade on the west
path and steps into the higher western approaches; IMG_2333 shows the three southwest risers.
IMG_2340 shows continuous paving through the east gateway. These support retaining the
current overall pool level. The existing terrain checks report southwest rise 0.53 m,
northwest rise 0.52 m, east-gateway difference 0.03 m. The terrain at the pool is +0.02 m
relative to the recorded survey datum (5.05 m orthometric); deck/coping offsets are separate.
No pool ring, deck outline, terrain, gate transform, building footprint or structural collision
is moved by this pass.

## Placement and comparisons

`estimated-placement-overlay.jpg` uses one georeferenced aerial transform from the actual
`public/map/ground.json` bounds and image dimensions. Cyan is the existing water ring, yellow
the existing deck, pink circles an indicative 1 m anchor uncertainty. The aerial does not
resolve the small fittings. No control/held-out residual or calibrated alignment is claimed.
The shower pair is placed beside the east-lobe life ring; the dark cover lies between the
west deck and planter, and the pale lid lies on the slabs. Upright shower geometry uses the
shared route-clearance guard including its full footprint; covers are flush paving fittings.

Before/after Inspect captures use exactly the same scripted camera per pair:

- `inspect-before.png` / `inspect-after.png`: courtyard context.
- `west-before.png` / `west-after.png`: path cover and separate deck cap.
- `east-before.png` / `east-after.png`: twin shower posts beside the life ring.
- `gate-before.png` / `gate-after.png`: original open east leaf and added curls.
- `layout-after.png`: structural view without the new freestanding Details fittings.

Run `node scripts/review_middle_pool_details.cjs --before` and then without `--before`.
The before server reads the original middle-pool renderer from immutable commit
`866e166ee1fabee68b6ba4bc2fc9bba325f90b61`; it does not edit the working files or emulate missing
geometry with invented fixtures. These are Inspect cameras with no avatar, not Walk views.
`--views=west,east,gate` selects views for a resumed capture. `export=model` builds Details
before the first frame so software rendering does not delay the deferred build queue.

These cameras are explicitly **not solved photo cameras**. Photo checks remain
`not-comparable` for calibrated placement: forms and surface ordering can be inspected, but
pixel registration and metre residuals cannot be established from these captures. In
particular, new anchors retain approximately metre-scale uncertainty. Source/form review
is separate from placement approval. No `placement-verified-by` edge or resolution of an
existing discrepancy is asserted; the geometry task remains `in-progress` for placement.

## Validation

The production build, middle-pool geometry/clearance checks, terrain and level checks pass.
The shower foot is outside the water and on the deck, clears mapped routes including its
radius, and does not enter a house; the dark and pale covers occupy distinct surfaces.
The Inspect capture script checks that all three new fitting IDs exist in Details, are absent
from the original and Layout views, and that the avatar remains hidden.

Two unrelated checks were found during the full handover run and checked on the unchanged
base commit separately: the reference-index suite rejects `jorge-west-walk`'s existing photo
request status, and the layout browser traversal reports `South Dalí approach has a reachable
step at 0.00`. Their inputs and affected terrain were not changed here. The strict placement
gate also remains red for the declared estimated additions, because no calibrated independent
placement packet exists. This is recorded explicitly rather than weakening the gate or
claiming the whole courtyard is verified. See `validation.json` for command outcomes and
`independent-source-review.md` for independent source/form review.
