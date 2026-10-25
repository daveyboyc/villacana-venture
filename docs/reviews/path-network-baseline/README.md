# Path-network baseline software review · 2026-10-25

Scope: `path-network-baseline`, a tooling task implementing the graph-backed
accounting/inspector foundation of PATH_NETWORK_PRD. No feature geometry,
registry/pool ring, ground height, collision, source content tag or image changed.
No source inspection or placement approval is claimed.

## Results

- Reference generation: 176 references, zero integrity problems.
- Python suites: photo assignment (12), reference discovery (7), placement
  verification (31), path network (7), reference packs (10): all pass.
- All 14 standard geometry/level/clearance checks in HANDOVER pass.
- TypeScript and production build pass (existing large-bundle advisory remains).
- New browser regression passes desktop discovery, unresolved portal search,
  source switching, feature reload links, bounds at 390×844, 320×568 and 844×390,
  and map camera controls after closing the inspector. No page errors observed.
- Existing broad browser suites were attempted. Layout's first run lost its
  execution context during alias navigation. Overview timed out waiting for
  `#overview-north` to be stable; photo-map passed discovery and overview/source
  navigation then timed out loading the blueprint alias. These do not establish
  full broad-browser regression success. An isolated checkout of unchanged origin/main also timed out loading the overview labels in the photo-map suite. Runtime scene modules were not changed.
- The placement-change gate remains red. Editing `src/blueprint.ts` changes renderer
  snapshot inputs, so previously unverified feature packets are flagged, including
  Elena, middle-pool fragments and paseo boundaries. No warnings or discrepancies
  were deleted and no inventory record grants approval. Per AGENTS.md's Merging
  rule this gate is reported rather than used to claim verified reconstruction.

The screenshots show software UI only: [desktop](desktop.png) and
[small mobile](mobile-320.png). They are not measured source/model comparisons.
All 14 full-source inventory tasks remain open, with zero inventory-complete
areas and zero newly verified placements. See
[implementation limits](../../PATH_NETWORK_IMPLEMENTATION.md) and the generated
[gap ledger](../../../refs/PATH_NETWORK.md).
