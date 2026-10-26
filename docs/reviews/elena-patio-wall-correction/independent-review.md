# Independent Elena patio-wall correction review

Reviewed 26 October 2026 by `Codex:elena_independent_review`. Model snapshot: `f879f907e141984b1261a9b92ec2ed014ede2329`, compared with baseline `3326375bd5358103a7b72030947d2b6571abf20b`. No remaining blocker was found for this bounded, estimated form/topology/material correction. This is not placement approval, a calibrated photographic match, or measured-height/clearance certification.

I reopened full public IMG_2363, IMG_2199, IMG_2200, IMG_2201, IMG_2197 and IMG_2356, plus roof IMG_2364, IMG_2365 and IMG_2366. I inspected the full Esri aerial and private Apple06 top-down/Apple08 north-pool mesh views at private revision `afdc57ad0c8af217a04170bc4265b06a609e9ac4`. The maps cannot independently resolve thin garden-wall heights or concealed returns. Private pixels remain private.

IMG_2363 supports a full-height lane-facing privacy wall and normal-height timber door, correcting the earlier1.15m wall/1.0m door relationship. The new1.85m wall/1.8m door is a plausible relative estimate, with the stated0.2–0.3m vertical uncertainty retained. The gateway-side return visibly meets the lane wall and house. One further divider into the house frontage is visible above the table/tarp; the implementation adds only this bounded divider. Exact world coordinates remain estimated from existing model anchors. The approximately0.95m continuation to the window return is foliage-hidden and remains explicitly estimated, not independently source-registered.

IMG_2199 supports raised curved door coping above the ordinary garden wall. The final garden-door after render shows this change and a visible timber leaf meeting the floor. IMG_2200/2201 support the garden wall meeting the solid barred-shutter return. IMG_2197/2356 distinguish low bed/hedge fronts from taller enclosure walls; the correction leaves those low kerbs separate. IMG_2366's trained-trunk frontage, curved door and cane pergola belong to Cervantes and do not justify partitions behind the Elena magnolia canopy.

The final elevated before/after pair exposes the corrected lane wall, gateway/house connection, single divider and bounded first-patio tile surface. The new plain square tiles are supported by the exposed first patio in IMG_2363; the decorated circular object is a table. Patio grid phase is independent of the public lane. The floor's exact bounds and terrain-following level remain model assumptions, not source measurements. Concealed garden-patio floors remain unmodelled. I also inspected the actual canonical map: it shows the same bounded floor/divider and preserves the plain-square lane/spur pattern.

The north-patio, north-join and Cervantes-corner first-person contexts are occluded or too close to wall surfaces and are **not-comparable**. Their successful screenshot capture cannot certify photo fidelity. The useful garden-door and elevated views are uncalibrated model-context cameras. Other historical source/model differences remain open.

Code review covered `elena-north.ts`, `elena-east-patios.ts`, `elena-wall-ground.ts`, `blueprint.ts` and their shared records. Connected wall bodies/copings now use the same terrain field at vertices and skip a second generic drape; doors/window details use their explicit anchors. Map and collision consume the shared wall records. Registry house/pool footprints and terrain data are unchanged. The mesh check records six sampled joins, visible door leaves, nominal wall tops and one-time ground application; these are model-consistency checks, not real-world measurements.

Review findings resolved before final assessment: the patio door was projected onto the changed wall axis so its painted leaf is not buried; the divider was moved before the near lane door; the source-plan public-photo href was corrected; and its proposed divider was regenerated from final coordinates. I inspected the source-plan photo overlay: finite coping/wall/divider traces and the separate door locator correspond to the source, with no source-to-world transform claimed.

Unresolved limits remain: independent registration, concealed returns, actual wall/floor datums, doorway/route dimensions and photographic camera alignment. The shared terrain product does not measure thin privacy-wall heights. This review cannot approve exact hidden joins or turn estimated boundaries into surveyed placements.

Reviewed artifact SHA-256 values:

- `source-plan.svg`: `8feb538d250c5a6c2d18678c02155d651ebfd935addedf927d562ccd6253b0c1`
- `elevated-patios-before.png`: `99fbfa8c57671b4a08019c1fa76ec389765f1b08f5e4adb29d7ca6b311689101`
- `elevated-patios-after.png`: `2bfffba2510ceb87ff8846445811af2bf0c6e3011dbfcb4685a4e0ec0ae23df2`
- `garden-door-before.png`: `6236a4fae184519ecb52f557ee1bdf2af1a48f50be868fa0f6b9cfb2b666c91f`
- `garden-door-after.png`: `9c24ce61de38a458b503b3fa024a667c2f41baf5bf34cc08d31c0b7a5ce7ea88`

## Supplemental review: south cross-lawn tile alignment

Reviewed 26 October 2026 against the separate material snapshot `57ee2f000d01bf46f3f96cbacd56e2193c4d1c5e`. The original north-wall review and its snapshot above remain unchanged. Scope here is only `cervantes-lawn-door-path` material/UV and its canonical map pattern.

I reopened full IMG_2261, IMG_2330 and IMG_2358. They support a plain square-tiled approach between the two lawns, aligned with the main lane's square-course axes, with separate white kerbs. The junction is partly hidden/foreshortened, so an exact shared joint phase is not measured from these photos. Sharing the existing lane's model pitch and phase is an explicit consistency choice. The decorated private patio in the foreground of IMG_2358 remains a distinct surface.

I inspected the actual south-crosspath before/after elevated renders and the current canonical map. The old darker, diagonal-to-route tile field is replaced by the same plain square field as the lane. The original path footprint, white kerbs, lawns and other surroundings remain represented in the same positions. The camera eye/target are identical model-context coordinates, not a calibrated source camera. Broader south wall/door discrepancies remain outside this UV correction.

The `frontages.ts` selection targets this one region ID and uses the south Elena UV frame and plain texture. `blueprint.ts` applies the corresponding pattern to that same map region. The diff preserves the existing ring, mesh positions/height and collision inputs; it adds no hidden private floor or decorative inserts. The extended browser check compares the actual crosspath mesh UVs/material with the lane frame and checks its map fill. No remaining blocker was found for this bounded material correction. No placement, measured dimensions/levels, exact source grid origin or whole-photo match is approved.

Supplemental render SHA-256 values:

- `south-crosspath-before.png`: `39a6284bb3000f523b6937e2a9a35fad0be0e12511df6efdfaa77f7424681938`
- `south-crosspath-after.png`: `95318237b480f6e0aa0d74a529e72b2b05cd8c25f646b13a1762e8f16f0767c9`
