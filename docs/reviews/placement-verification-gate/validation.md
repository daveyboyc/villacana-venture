# Validation record

Executed on the task branch against main `1935545`, 18–19 October 2026.
This is evidence of software/policy behavior, not a source survey or photographic
match. No real placement packet was approved by these tests.

| Check | Observed result |
| --- | --- |
| Photo assignment tests | 11 passed |
| Reference index / graph tests | 7 passed; all 357 model IDs represented, unique graph nodes, no dangling edges, Barraka dispute preserved |
| Placement policy tests | 31 passed; synthetic positive fixtures and adversarial negative cases |
| Reference generation `--check` | 172 references, 0 problems |
| Contact sheets `--sheets` | Regenerated; private repo unchanged |
| PR change gate against `origin/main` | PASS; no unapproved geometry changes |
| Source checks | All 12 handover scripts passed: map, street layout, boundary reference, terrain, Dalí threshold, Cervantes patio walls, Elena north, middle pool, paseo wall, seafront, pool levels, levels |
| TypeScript / production build | PASS; existing large-chunk advisory remains |
| Layout browser regression | 20 routes in both directions, 404 segments, closed/open gate behavior and material groups; no browser errors |
| Overview browser regression | Zoom, rotation, north reset, focus notes, overlay toggle, walk visibility and mobile toolbar passed |
| Canonical map / photo browser regression | 172 sources, boat search, subject/camera distinction, full images, links, private/unplaced discovery, local reviews and mobile passed; new dispute warning/copy assertions passed |
| Mobile browser regression | PASS: portrait/landscape controls, cross-screen pinch/cancel, pan, fit, 2D fit and compiled grass material parity |
| Public-only CI reproduction | Assignment/reference generation and unit suites passed without a private checkout; generated outputs identical |

Browser tests use `/usr/bin/chromium` with software WebGL. The photo/browser tests
exercise the real app. Policy test approvals and images are temporary synthetic
fixtures, not attestations about Villacana.

[Graph status excerpt](graph-status.json) shows the actual Barraka feature →
discrepancy → sources/follow-up chain. [The source report](barraka-planter.md)
records what the inspected sources establish and what remains unmeasured.

The map/placement conclusion remains **disputed for the planter, otherwise no new
whole-area accuracy claim**. Photographic agreement remains separate and
uncalibrated. Passing these software checks does not resolve either limitation.
