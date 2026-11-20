# Wall guide validation

The guide-only renderer reuses existing inventory coordinates; no physical wall,
terrain, footprint, opening or collision inputs change. The task is UI tooling,
not a completed wall survey or a wall-level correction.

- `test_wall_guides_browser.cjs` passed against the production build: exact source
  x/z, guide count, exclusion of context/gap points, selected line colour/width,
  dashed enclosure material, toggle, a 390×844 viewport and Layout → Details
  persistence, with no page errors. Screenshots are committed alongside this file.
- `test_patio_walls_browser.cjs` passed, including the new map-to-Inspect
  `wallGuides=1` and selected `wall` parameters, source navigation and mobile map UI.
- Inventory, reference-index (17 tests) and placement-policy (31 tests) suites passed.
  Levels and Cervantes wall source checks passed. Production build/typecheck passed;
  its existing large-chunk warning remains.
- The independent reviewer inspected code and the Layout, Details and mobile
  screenshots. Its scoped approval and source limitations are in REVIEW.md.
- Mobile evidence is a viewport-resize test; touch-device behaviour was not
  independently exercised. The toggle is outside the controls hidden on phones.

The conservative placement gate still flags changed shared renderer fingerprints.
It has not been weakened: no measured placement or wall-top approval is claimed,
and all discrepancy history is retained. This visual overlay uses a ground lift
only for readability; the legend distinguishes it from wall-top levels and
explicitly says that lines show through buildings.

The screenshots precede only the additional legend sentence “Ground-position
guides, not wall-top levels”; geometry and interaction code are unchanged.
Rebased onto the new photo intake at `22511f0` without changing model code.
