# Validation and release limits

North geometry snapshot: `f879f907e141984b1261a9b92ec2ed014ede2329`.
South approach material snapshot: `57ee2f000d01bf46f3f96cbacd56e2193c4d1c5e`.

Passed production build/typecheck, reference generation/check, 76 Python
source/reference/placement-validator/inventory/pack tests, and relevant street,
registry, terrain, wall, frontage, pool, level, sill and seafront checks.

The actual-mesh check passed six joined wall vertices (sampled within 2 mm for
Float32 endpoint precision), expected wall tops, visible timber door faces,
one-time ground application and the bounded patio/map pattern. The UV check
passed rotated three-column fields, square pitch and matching grid phase on both
the north garden spur and south cross-lawn approach. The final comparison viewer
passed source selection, current-first/history labels, private-pixel separation
and three mobile viewports.

Full layout regression passed with the north wall correction: 20 routes in both
directions, 438 traversal segments, closed/open gate behaviour, preserved material
groups, and zero page errors. Full overview regression passed zoom, rotation,
north reset, focus, overlays, walk visibility and mobile controls. The subsequent
south approach change is material/UV only; its ring, vertices, height and collision
are unchanged, and it passed the targeted UV/map check and actual scene capture.

Photo-map discovery, full-photo opening, local review/caption persistence, stable
aliases and overview navigation passed. Its existing blueprint alias navigation
then hit the same 45-second page.goto timeout recorded under #143. No assertion
was removed or relabelled as passed. Software-rendered captures remain slow;
this is not a physical-device performance certification.

The placement gate reports 28 geometry/source-dependent feature snapshots without
fresh verified placement packets. Source/reference checks pass; measured placement
approval does not. Independent source/form/render review permits only the bounded,
estimated correction described here. Task #153 remains in progress, and the
foliage-hidden join, exact dimensions/levels and south wall/terminal discrepancies
remain open. AGENTS.md authorises provisional merge with these warnings recorded
in the PR; no placement approvals or completed-area counts were invented.
