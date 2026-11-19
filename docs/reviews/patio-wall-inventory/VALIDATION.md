# Patio wall inventory validation

This change adds map/UI tooling and generated inventory. It does not move or
reshape physical walls, ground, buildings or pools. Only the tooling task is
complete; the resort-wide physical wall survey and wall-top level decisions
remain open.

The independent reviewer `/root/review_patio_sources` inspected the eight full
repository photo copies, aerial and contact sheets documented in
[SOURCE-REVIEW.md](SOURCE-REVIEW.md). In the live map the reviewer also checked
search → Elena north wall → estimates → IMG_2363, desktop/mobile deep links and
photo handoff, and reported no page errors. Its review identified unrelated patio
furniture in the context selector; these were removed. Source review is not
measured placement approval.

The inventory keeps explicit model wall axes separate from registry enclosures,
other structure groups and evidence gaps. It preserves retired-wall exclusion,
route-opening context and door records, with no quantities for untraced outlines.
Terrain sampling is labelled as screening of the model ground, not a wall-top
survey. Inspect navigation frames the existing model in Layout.

The placement-change gate flags the shared blueprint renderer/context edit and
requires fresh placement packets for existing features. No physical geometry is
changed and no new placement approval is claimed. The gate has not been weakened
or bypassed; its failure is retained and reported under AGENTS.md's merge rule.

Validation after rebasing onto `a12c902` (new Drive photos and main-pool work):

- Production build/typecheck passed; reference generation reports 581 references,
  581 reviewed and zero problems. The build retains its existing large-chunk warning.
- Inventory tests and freshness check passed: active axes, retirement handling,
  lengths/areas, unique IDs, complete registry enclosure accounting and exclusion
  of uncertain outlines from quantities.
- Focused browser test passed: saved wall link, estimates, Inspect framing,
  photo handoff, enclosure filtering and 390/320/844 px responsive layouts.
- Placement-policy unit tests and all 16 Handover source/geometry checks passed.
- Reference-index test: 16/17 pass; the boat search assertion expects three older
  sources, while the updated base correctly includes new `IMG_3051.jpg`.
  The general photo-map browser test fails on the same stale expected list.
- Overview browser regression times out at its zoom-distance assertion (line 23)
  in software-rendered Chromium. It does not exercise the new map panel.
- Placement-change gate remains red for the shared-renderer fingerprint reason
  above. No review/discrepancy history or gate policy was removed.
- Full layout browser regression completed its in-page geometry/route assertions
  and saved the map and closed coastal-gate renders, then timed out at line 795:
  `#gate-control` is hidden in the existing coastal-gate scene. The wall inventory
  changes neither that control nor the 3D gate. This remains an explicit failed
  regression; it is not counted as a passing end-to-end layout check.
