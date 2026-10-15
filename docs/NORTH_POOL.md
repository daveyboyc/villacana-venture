# North pool: west and north patio frontage

Issue #36, reviewed 15 October 2026. Sources: IMG_2204, IMG_2205,
IMG_2207 and IMG_2208, plus private reference photos 03–07 and the north-pool
contact sheet, all inspected full size. The private photos remain in the
reference repository.

The photos distinguish the roughly metre-high curved retaining wall on the
west/north side from the much lower northeast patio kerbs. The west wall runs
beside a crazy-paving path, with a five-riser tiled flight opening onto a raised
patio. Hedges obscure several ends; these are not evidence for repeated gates
or a complete new courtyard enclosure.

`data/north_pool.json` records only the visible northwest curved wall band,
its open stair flight and the adjacent paving arc. Coordinates follow the aerial
pool/lawn edge against unchanged registry footprints; registration remains
approximately 1–2 m, not a survey. The west end stops short of the obscured
private patio dividers; the north end stops before the passage. Northeast kerbs,
southern boundaries and private doors remain separate untraced work.

`src/north-pool.ts` shares wall rings between solid meshes and collision and
shares tread/path rectangles with the blueprint. Generated garden-wall/gate
blocks are suppressed only within the reviewed northwest band. No new hedges,
props or invented gates are added.

The local plateau and flight live in `data/terrain.json` and are sampled by
`siteY`, including the player's ground height. The five risers are estimated
at 0.15 m each, totalling 0.75 m. Patio depth/rear edge are approximate and do
not establish the height of the adjoining houses or unseen gardens. The pool
and lawn stay at their original datum. The patio top has a notch for the flight,
so a raised surface cannot cover its lower treads.

Validation covers source citations, wall clearance from buildings/pools/lanes,
shared flight data, pool height preservation and browser walks along the paving
and through the stair opening both ways. These checks establish internal
consistency and walkability; photographic fidelity still requires the paired
IMG_2204 high camera review, and the dimensional uncertainty remains explicit.

## Validation checkpoint

Source checks, photo-assignment tests, reference regeneration/`--check`, the
north-pool check and the production build pass. An additional local run of the
actual `Player`, `Solids` and `siteY` code walked both the paving arc and stair
flight both ways and checked each tread centre against its mesh height.

The required stock IMG_2204 `--high --details` baseline completed without page
errors, but its third-person framing is obstructed by foreground roofs and
crops much of the target frontage. It is not sufficient evidence to accept
fidelity. A paired Layout overview, the after camera render and the two standard
browser regressions are queued under the shared browser lock. Artifacts, logs
and exit files are in `layout-checks.local/issue-36/`; the isolated baseline is
`/workspace/issue-36-before` (commit `4e1b540`). The task deliberately remains
`in-progress` until those outputs have been inspected and accepted.
