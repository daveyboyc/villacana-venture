# Independent review and validation

## Review against actual source imagery

An independent reviewer (`independent_source_review`) inspected the original available map/photo rasters separately from the implementation, then checked the saved overlays and measurements. Reviewed: north-pool sheet; Google satellite/standard; Esri; public2202–2208/2361–2365; private01/03–07; Apple02/07/08/09. The primary audit also inspected the requested photos and additional2361/2203. These are agent reviews, not a site survey or a human owner's sign-off.

The reviewer accepted that the controls refer to corresponding identifiable roof corners/pools, that no mirror/rotation/local-warp mistake is apparent, and that the Dalí/Loira/Picasso/Elena/Isabel lines follow their visible corridors. This does not accept exact widths or hidden openings. The fitted/held-out residuals are relative image disagreement, not absolute ground accuracy. Mixed elevated-roof and ground-water controls may introduce parallax effects.

The independent review found and corrected two misleading pool picks: initial P2=(665,501) and first revised P2=(661,501) are bright deck. Final P2=(656,501) is a tentative dark-rim diagnostic, RGB 67/95/98 in the original; it is not asserted as a surveyed water boundary. Initial P4=(618,505) is pale rim/deck blur; revised P4=(621,505) is a blurred water/rim transition. Rejected picks remain documented. Final pick-to-registry distances range about 0.02–1.55 m with about 0.5 m edge-selection ambiguity and unresolved physical datum. The reviewer also corrected the registry date wording to **downloaded** 11 October 2026; underlying survey/update epoch unknown.

Both primary and independent inspection establish that IMG2202/2361 show private 36/34 gates west of the covered passage, while IMG2363 shows a separate lawn arch. IMG2203 shows the opposite exit onto Elena. Correcting the two lawn-feature citation lists and the catalogue subject/aims is supported. No camera pin or runtime coordinate was moved.

The reviewer found no sufficiently supported building, pool or street plan correction from these sources. Roof offsets/orientation differences and uncertain widths cannot be converted into surveyed ground-wall corrections. Concealed terrace/patio boundaries and additional roof plans remain open in [issue98](https://github.com/daveyboyc/villacana-venture/issues/98).

## Software and geometry consistency

The following checks passed on this branch. They establish software/source consistency only.

- `assign_photo_map.py` and all 11 `test_photo_assignment.py` tests.
- `build_references.py --sheets --check`: 172 references, 172 catalogued as reviewed, 0 reference problems. “Reviewed” here is a catalogue/source state, not a photographic match. Only Elena/north-pool private sheets changed.
- Standard handover source checks: `check_map`, `check_street_layout`, `check_boundary_reference`, `check_terrain`, `check_dali_threshold`, `check_cervantes_patio_walls`, `check_elena_north`, `check_middle_pool`, `check_paseo_wall`, `check_seafront`, `check_pool_levels`, `check_levels`.
- Focused checks: `check_elena_gated_entry`, `check_north_pool_gardens`, `check_north_west_canopies`, `check_raised_terraces` (plus Elena north above).
- `npx tsc --noEmit` and `npm run build`.
- `test_layout_browser.cjs`: 20 routes, 404 traversed segments, both directions; closed/open gate collision, level building groups and 6 refined material groups; no page errors.

`test_overview_browser.cjs` passed zoom/rotation/north reset, focus notes, overlay/walk visibility and mobile toolbar checks. `test_photo_map_browser.cjs` passed with 144 pins, stored check/note/moved-pin state, full-size photo and clipboard handoff; no page errors.

The current north/whole/west-oblique diagnostic captures and all seven photo-pin high captures loaded without page errors. The latter retain uncertain phone pins, approximate aims and uncalibrated eye height/pitch; they are recorded as `not-comparable`, not `matches`. Software WebGL animation was throttled in an audit-only wrapper to make screenshot input responsive; camera/control logic remained that of `shoot_views.cjs --high`. The extra IMG2204 estimated-fit diagnostic reuses `review_north_pool_gardens.cjs`'s existing pose with output redirected here. It fits the model pool, so cannot independently prove that pool geometry.

## Baseline preservation

Compared with e043c0e, `public/map/skeleton.json`, `ground.jpg`, `ground.json`, all `src/`, street-layout/Dalí data, terrace/path/canopy plans and passage definitions are unchanged. Recursively comparing Elena-north data while excluding `evidence`/`trust` confirms that every runtime field is identical. Map, 3D and collision retain their existing shared geometry; this does not certify that geometry's real-world accuracy.

The first audit was committed as 009f29f before citation corrections. Independent review then revised the tentative pool picks and date wording. Public source hashes and final observations/results are committed; source-image pixels and private comparisons are in [private PR5](https://github.com/daveyboyc/villacana-reference/pull/5). No private image or credential was added to the public repo.

The audit generator reproduces its fixed-window image centroids when private sources are available. A second generation reproduced layout.svg, alignment-residuals.svg, layout.png and measurements.json byte-for-byte. Public SVGs have no image elements and the public results have no private-source hash block. No geometry mutation or local image warp is part of that script.

**Map:** broad layout supported; absolute accuracy/complete boundaries remain unresolved. **Photographs:** visible features/order documented; no calibrated match. **Software:** all listed source, build and browser checks passed.
