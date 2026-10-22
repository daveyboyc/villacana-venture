# Silvia tunnel draft validation

22 October 2026. Source-relative component, with no world transform or footprint
replacement. The source photographs are unchanged 1200 × 1600 public web copies.

| Check | Outcome |
| --- | --- |
| Tunnel Chromium regression | PASS: four entrance bays, actual player walks both axial directions, side-wall/closed-door collision, required fixture meshes, optional foliage, canonical app, source comparison and 320/390px controls |
| Source/geometry checks | PASS: 16 scripts, including existing map/terrain/levels/lanes checks and new full-foliage route clearance/headroom/entrance-separation check |
| Reference/photo/placement unit tests | PASS: 60 total (10 pack, 12 assignment, 7 index, 31 policy) |
| Existing layout browser | PASS: 20 routes, 428 segments, both directions; closed/open coastal gate; level building/material group checks |
| Existing overview browser | PASS: zoom, rotation, reset, focus notes, overlay, walk and mobile toolbar |
| Existing photo/map browser | PASS: unified 176-source catalogue, navigation, camera/subject separation, private/unplaced sources, local reviews and mobile |
| Reference-pack browser | PASS: six sources, 43 rows, filters, source links, component copy/deep link, drawings, 14-area rollout and mobile |
| Pack/schema/catalogue | PASS: deterministic generation, portable schema and 176 references with zero catalogue problems |
| Figure export | PASS: 11 pack figures; actual tunnel captures and browser-results.json saved beside this report |
| Typecheck / production build | PASS; existing Vite large-chunk advisory remains |
| Production browser | PASS: built inventory link opens the built 3D app; loaded chunks and 390/320px controls; no page errors |
| Whitespace | `git diff --check` PASS |
| Independent actual-source/render review | Bounded photo-relative draft accepted, with explicit estimates and visual simplifications; not placement approval |
| Placement change gate against origin/main | BLOCKED: 231 conservative fingerprints lack fresh measured placement packets, including the new study and renderer-context-dependent building records |

The placement policy and evidence history are preserved. No independent global
registration packet, calibrated-camera match or verified world connection is
invented. The task remains in progress and the PR remains draft. The existing
Silvia passage audit and new world-registration report remain open.

The model includes the two directly visible paired-door sets and two partly
hidden entrance recesses whose identity the owner confirms. The hidden brown
back-door construction and 0.65 m recess depth are owner-authorized estimates.
Materials, plant shapes and the garden fragment are procedural approximations;
passing software checks does not establish exact photographic fidelity.
