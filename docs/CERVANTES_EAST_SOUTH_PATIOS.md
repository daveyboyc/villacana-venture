# Cervantes east south frontage (issue #89)

IMG_2366/IMG_2360 show the south frontage east of Elena, with the continuous
white lane-side wall, brown closed door below curved coping, woody climber,
rectangular timber pergola with a cane roof, and round clipped shrubs. IMG_2197
corroborates the trained trunk and white wall on the right of the lane. The roof
pins sit on the north row; they are not the patio or pergola positions.

The pre-build aerial/registry overlay was inspected against the georeferenced
Esri `public/map/ground.jpg` (`ground.json` bounds), checked Cervantes centerline
and original registry `6265601UF1366N_part1`. The private Google satellite lane-name
screenshot and Apple whole-block top-down corroborate the row/lane context, but
cannot measure the small wall or door. No private map screenshot is committed.

`data/cervantes_east_south_patios.json` records one bounded 18.2 m frontage,
1.35 m south of the checked axis. It runs approximately from (-142.40,52.66) to
(-126.76,43.34), with a closed door near the Elena end, at (-140.94,51.79).
The 4.8 by 3.4 m pergola sits between that wall and the unchanged house frontage;
its rear edge stops about .2–.35 m before the registry face. Height above the lane
is estimated at 1.85 m for the wall and 2.35 m for the pergola. Mesh wall faces and
posts extend down to the courtyard datum so the lane's .27 m datum leaves no gap.

The map, structural mesh and collision use the same wall and post records; the
closed door is a timber face on the continuous solid wall. The cane shade cover
appears in Layout. Climber/shrubs are Details only and pass the shared decoration
clearance guard. Generated walls, gates and props are suppressed inside this
reviewed band. No internal patio partitions, speculative enclosure returns,
floors, levels, house alterations or extra doors are added.

Positions and extents remain estimated to roughly 1–2 m; foliage hides the wall's
continuation. Bounded ends do not establish openings or legal parcel boundaries.
The wooden balcony is a source landmark; this task does not alter registry houses
to invent a specific balcony. Plant species, spread and positions are illustrative.

## Camera review

`docs/reviews/issue-89/` contains before/after diagnostic renders from the two roof
camera locations, adjusted south within the reported GPS uncertainty to clear the
modeled roof edge (IMG_2360: 2.5 m, accuracy ±2.8 m; IMG_2366: 3 m, accuracy ±3.9 m).
The catalogue pins themselves are unchanged. Initial exact-pin renders showed roof
slabs occluding the subject, corroborating the need for a roof-edge diagnostic. `scripts/review_cervantes_east_south.cjs` uses a local Vite transform
for an independent roof camera, avoiding the standard shoot helper's ground
player displacement inside buildings. It preserves the scene geometry and uses
an estimated 7.2 m local eye elevation and subject targets; this is an architectural
comparison, not calibrated photogrammetry or a pixel fit. It also throttles the
review animation to one frame per second for software-renderer capture. Product
camera behavior is unchanged. The baseline worktree is at the claiming commit,
before geometry edits. The georeferenced overlay stays in ignored local artifacts.

Run `python3 scripts/check_cervantes_east_south_patios.py` for source, boundedness,
registry and route clearances. Layout browser checks include wall/closed-door
collision and all named lanes, including Cervantes both ways. These establish
software behavior and clearance, not surveyed dimensional accuracy.
