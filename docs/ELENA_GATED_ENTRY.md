# Elena private entry, issue #46

`data/elena_gated_entry.json` and `src/elena-gated-entry.ts` add only the first
private gateway west of registry covered walkway `6265201UF1366N_part5`.
IMG_2361 shows two black iron gates, a white shaped lintel, patterned red paving
and bougainvillea. IMG_2202 corroborates the paired gates from the covered
walkway; IMG_2203 faces the opposite, open arch and planted bed.

The gateway is approximately 4 m beyond the west mouth, across the private
entry, with the complete registry passage left open underneath. The map and
collision share the gateway outline. Iron gates, white piers/lintel and paving
remain in Layout; bougainvillea uses the existing Details sprite guard. No
registry footprint, terrain datum, public lane, or existing Elena bed changes.

The entry trace is constrained by the adjacent registry fronts and aerial.
Placement is approximate to 0.5–1 m and heights/tile size are estimates, not
measurements. Extra private gates/enclosures behind this gateway in IMG_2361
are deliberately untraced. Source and route-clearance tests establish software
geometry constraints, not photographic precision.

`python3 scripts/check_elena_gated_entry.py` checks photo citations, gate/house
separation, tiled court/house separation, public route clearance and separation
from the end-to-end passage probe. The normal source suite, photo assignment
tests, reference check, TypeScript and production build passed for this branch.
Full layout/overview browser regressions remain for the integrating agent.

Before baseline: `/workspace/issue-46-before` (git archive after claim commit,
before feature edits). IMG_2203 renders use the unchanged camera pin/heading
and `--pool=north,middle --details`. This camera looks east, away from the new
gates; its pair verifies the retained existing outlook rather than gateway
fidelity. Compare the gateway against IMG_2361/2202 directly as well.

The baseline IMG_2203 render completed without page errors. The attempted
post-change render could not acquire the shared browser lock within 45 seconds
(exit 1, empty render log); the integrating agent still needs that after image
and the two browser regression suites. No queued browser process remains.
