# Independent review: 3D patio wall guides

Reviewer: agent `/root/review_patio_sources`, 20 November 2026.
Task: `patio-wall-guides`. This review concerns visual guide lines in Inspect. It does not approve physical wall placement, surveyed boundaries, or levelling of wall tops.

## Source and implementation review

Read `src/wall-guides.ts`, its integration in `src/slice.ts`, the map handoff in `src/patio-walls.ts` / `src/app.ts`, and the controls in `slice.html`. Compared the input convention with `src/cervantes-walls.ts`, the existing patio inventory and skeleton coordinates.

- Guide x/z positions are imported unchanged from the existing inventory. No second map-view rotation is applied.
- Only explicit wall axes, low-edge axes and registry enclosure outlines become lines. Context groups and evidence-gap markers are excluded; their bounding boxes or points do not become invented wall traces.
- Only registry enclosure outlines are closed. Their dashed orange treatment and explanatory text distinguish candidates from existing wall axes.
- Each source segment is resampled at no more than 0.5 m intervals, with y set to the supplied model-ground function plus 0.16 m for visibility. This is a display offset, **not** a wall base survey or proposed top elevation.
- The group is added after structural batching, marked `dynamic` and `noDrape`, and creates no collision rings. Line raycasting is disabled. It therefore adds a visual overlay without new wall solids or picking blockers.
- Depth testing is disabled so the lines remain visible through buildings. The legend explicitly discloses this behaviour; it must not be interpreted as exposed wall-top geometry.
- Selection uses a distinct pink line, a thicker screen-space width and source name. The map/photo link preserves the selected source ID. Layout/Details link state retains guide enablement and selection.
- Runtime visibility is restricted to Inspect and hidden for the photo camera and Walk. This task does not modify Walk geometry or behaviour.

Source-content limits are recorded in [the previous independent patio source review](../patio-wall-inventory/SOURCE-REVIEW.md): full-size repository web copies of IMG_2363, IMG_2206, IMG_2362, IMG_2366, ELENA-ROOF-2026-11-17, IMG_2368, IMG_2274, IMG_2774 and the Esri aerial were actually inspected there. Particularly, IMG_2368 supports partial Cervantes transverse walls, not unseen closed enclosures; IMG_2362 hides patio ground and divisions under canopy; IMG_2274 separates a low planted kerb from a taller wall behind it. Guide visibility does not remove those limitations.

## Visual/software evidence inspected

- `layout-checks.local/wall-guides-layout.png`: blue existing axes and the pink selected Cervantes north east partition are visible over the actual Layout scene. The partition guide follows the existing fragment's plan direction. This checks visibility and the selection cue, not a measured source/render match.
- `layout-checks.local/wall-guides-details.png`: the same blue axes and pink selected partition remain visible with planting, balcony and facade details enabled. The guide overlay survives the Layout → Details transition. Vegetation no longer hides the guide, as intended by the disclosed through-building rendering.
- `layout-checks.local/wall-guides-mobile.png`: at a resized 390×844 viewport, the toggle is visible and blue/pink lines remain legible. The bottom details panel is scrollable. This is a viewport-resize check, not a separate touch-device emulation.
- Read `scripts/test_wall_guides_browser.cjs` and the completed `/tmp/wall-guides-browser.log`: PASS for source coordinate preservation, guide count/type exclusion, dashed enclosure material, selected colour/width, toggle, mobile control bounds and persistence into Details; no page errors reported. These are author-run software checks whose output I inspected, not independent geometric measurements.
- The final legend adds “Ground-position guides, not wall-top levels.” The screenshots predate that wording-only improvement. No source geometry or overlay coordinates changed after these renders.

## Review conclusion

Approved for the scoped visual-only guide implementation: the implementation is appropriate for placement comparison using existing inventory data, and the inspected Layout and Show details renders display the guides clearly. It must continue to label untraced enclosure edges separately and must not describe the guide overlay as a completed wall survey or levelled model. No placement-review packet or geometry approval is granted by this review.
