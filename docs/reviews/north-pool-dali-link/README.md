# North pool to Calle Pintor Dalí · provisional tiled link

## Scope

A visible 1.2 m wide terracotta-tiled path has been added as `ground_plan_north_pool.json:north-pool-dali-link` in `data/ground_plan_north_pool.json`. It starts beside the Dalí parking-side access at approximately (-208, 44), follows the open corridor south of the north-pool row, bends around the **outside** of the mapped north-pool west gated patio, and terminates at the existing south-west crazy-paving path near (-179.7, 31.3). Approximate centreline length: 44 m.

This is a **candidate placement**, not a surveyed or placement-verified route. No building footprints, patio enclosures or gates were moved. No private-gate opening or additional pedestrian network was inferred.

## Ground-level evidence and limitations

- `IMG_2551.jpg`: tiled path facing the Dalí edge with kerbed planting on one side and a kerbed lawn island on the other.
- `IMG_2552.jpg`: the curved tiled approach to the parking, white kerbs, transverse slot drain and a lantern.
- `IMG_2553.jpg`: looking back east along the tiled route between white house fronts, kerbed lawn and a planted bed.
- `IMG_2705.jpg`, `IMG_2706.jpg`, `IMG_2707.jpg`: further views from near the Dalí end, showing the planting, path width, kerbs, porch fronts and relationship between the narrow path and the parking-side lawn.

These images support the **existence and general material treatment** of a tiled connector. Their camera pins are not solved and some project close to or inside the unchanged registry polygons. They do **not** justify exact measured waypoints or the hidden path-to-pool joins. This trace follows free space between the registry polygons; its side-of-wall placement is deliberately conservative.

The first 10 m is given low white kerbs on both sides to represent the photographed Dalí-side entrance. Elsewhere no new walls, planted beds or gates are asserted. The full extent, whether the final south-west join is the precise real connection, and the kerb flare geometry require registered ground-level verification.

## Renderer and safety checks

The existing `src/ground-plan.ts` automatically renders the new path in **Inspect Layout** and **Show details** (terracotta squares using the existing finish/material). It is not a new Walk feature. The end overlaps the photographed north-pool path and declares `above: ["north-pool-lawn-path"]` for the surface join.

Before merge:
1. Run `python3 scripts/check_ground_plan.py` and `npm run build`.
2. Capture fresh Inspect Layout and Show details renders of the complete connector, both from the Dalí side and looking back from the north-pool south-west corner.
3. Compare with `IMG_2551-2553` and `IMG_2705-2707`, the current aerial, the building outlines and `north-pool-west-gated-patio`; independently review route and kerb placement.
4. Correct the alignment if imagery shows a different mouth or alley; do **not** certify or merge based only on the geometric clearance check.

## Known follow-up

The transverse drainage slot, the exact flare at the Dalí kerb, the lawn/planting sides, and the potentially concealed final connection are intentionally not modelled as measured facts. A second side-on view with identifiable building corners is needed to reduce the plan uncertainty.

User reference: screenshot of the north pool and Calle Pintor Dalí, 22 November 2026.
