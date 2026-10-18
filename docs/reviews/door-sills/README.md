# Issue #57 visual review

The six full-size source photos were inspected: IMG_2260, IMG_2261, IMG_2330,
IMG_2291, IMG_2293 and IMG_2283. The Elena/Dalí/whole-resort contact sheets,
georeferenced Esri aerial, Apple south-half overview and unchanged registry/road
outlines constrain the finite feature locations. Camera pins are cameras, not
surveyed subject anchors. See [the evidence and datum notes](../../DOOR_SILLS.md).

Initial exact-pin game views were attempted for all six sources. The
2260/2261/2330 cameras have substantial foreground wall/house occlusion, 2291 can
fall inside a solid registry part within its GPS uncertainty, and 2293 is also
substantially obstructed. 2283 gives exterior context, but the existing registry
part still closes the photographed arch. These attempts are unusable for
accepting the individual new features; preliminary/stale images are excluded
from this final review set. They did not establish photo fidelity.

The paired game renders below instead use explicitly estimated, fixed cameras.
They show Layout structural context with only the new feature Details forced on
by the review harness, avoiding unrelated plant overdraw. This isolation changes
neither production code nor the source photo pins. The before snapshot lacks
these new features. The sill and approach after views use source commit
`bcb1323`; the Dalí after view uses `29985c3`, including the finite asphalt apron.
All paired camera positions and framing are unchanged.

| Estimated diagnostic camera | Before | After |
| --- | --- | --- |
| South approach from its foot | [Before](before/feature-south-approach.png) | [After](after/feature-south-approach.png) |
| Dalí bands from parking | [Before](before/feature-dali-bands.png) | [After](after/feature-dali-bands.png) |
| Elena sill pair from above the lane | [Before](before/feature-elena-sills.png) | [After](after/feature-elena-sills.png) |

Camera eye/target coordinates are fixed in `featureViews` in
`scripts/review_door_sills.cjs`. Both snapshots use identical 800×600 framing.
The harness injects a test-only ready attribute after the first completed scene
render, awaits it, allows settling, then calls WebGL `finish()` before capture.
After snapshots additionally assert more than 100 new feature meshes to catch a
failed Details isolation hook. The full product's movement/ground regression is
separate from these visual diagnostics.

The approach comparison can establish the new continuous slope, flared side
kerbs and grooved toe against the source arrangement. It cannot validate an arch
passage: the untraced solid registry part remains unchanged. The Dalí comparison
shows the finite house-side path / lawn / outer parking kerb ordering and the
bounded asphalt apron connecting the kerb directly to the existing Dalí road
edge. The apron closes an inherited brown-ground gap; its local plan extent
is estimated, with the road axis and registry footprints unchanged. The Elena
comparison shows only two sills with closed brown leaves and short white
surrounds; no complete garden enclosure or connecting wall is inferred. Plan
anchors, finite ends, widths and heights remain estimates.

Reproduce using independent before/after worktrees (set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` if needed):

```bash
flock /workspace/villacana-browser.lock node scripts/review_door_sills.cjs feature-south-approach feature-dali-bands feature-elena-sills --details --root=/path/to/pre-task-worktree --out=docs/reviews/door-sills/before
flock /workspace/villacana-browser.lock node scripts/review_door_sills.cjs feature-south-approach feature-dali-bands feature-elena-sills --details --root=/path/to/frozen-after-worktree --out=docs/reviews/door-sills/after
```

Only game renders are included. Reference imagery remains in its existing public
photo catalogue/private map repository.

Independent subagents reviewed the source photographs, aerial placement, shared
geometry and paired diagnostic views. The final Dalí apron was independently
rechecked after its correction: path, lawn, white kerb and directly adjoining
asphalt now follow IMG_2291. The finite apron retains the checked road axis and
registry footprints; its inferred extent remains explicitly estimated.
