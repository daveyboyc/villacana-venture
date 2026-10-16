Issue #39 implementation checkpoint, owner issue39, status in-progress.

Base: origin/main adca41e (includes upstream #31 steps and levels survey).
The earlier dependency branch was discarded from this isolated worktree; no
duplicate southwest gateway, local access run or terrain rules are included.

Immutable current-main baseline: IMG_2334-before.png (Layout, pool=middle),
checksum in baseline.sha256. Historic obsolete-dependency Details renders are
outside the repo at /workspace/issue39-save/historical-baseline and are not the
accepted baseline. Fresh Details baseline attempt hit screenshot timeout under
concurrent graphics load; the fresh Layout baseline succeeded before integration.

Passed locally: photo assignment + its 10 tests; reference build/check;
check_map, check_street_layout, check_boundary_reference, check_terrain,
check_dali_threshold, check_cervantes_patio_walls, check_elena_north,
check_middle_pool (extended for this issue), check_paseo_wall, check_seafront,
check_pool_levels, check_levels; TypeScript and production build.

Coordinator still owns final sequential layout/overview browser tests and the
matching IMG_2334 after render plus visual comparison, then done status. Browser
test now traverses this gate both ways and checks a level transition <= 0.05 m.
No child browser checks are queued.

Limits: estimated placement, opening, heights and ends; approximate metal ribs,
curved white head and blue/yellow tile motifs. Photo-supported south entrance is
separate from southwest steps. Through ground stays level; inset planter step
stays outside the through lane. No registry or terrain files changed.
