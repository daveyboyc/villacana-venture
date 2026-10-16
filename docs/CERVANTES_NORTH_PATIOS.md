# Partial north Cervantes patio partitions

Issue #44 uses the three roof photos IMG_2368, IMG_2369 and IMG_2359.
The full-size views show white transverse garden partitions beneath climbers,
with shrubs/trees in the patios. The camera stands on the eastern end of the
north-frontage row; its GPS is not a patio corner.

`data/cervantes_north_patios.json` adds three **partial** near-Elena partition
spans. Positions were compared with the existing north Cervantes wall, the aerial
and the unchanged registry row `6265201UF1366N_part4`. Heights (1.55–1.65 m),
endpoints and spacing are estimates at roughly 1–2 m plan precision. Roofs and
foliage obscure the house-end junctions: the spans stop short, and neither a full
closed enclosure nor a gate is asserted. Further western partitions are omitted.

The module supplies the map lines, mesh coordinates and collision from the same
wall records. Short slabs follow the existing Cervantes ground datum. No terrain,
registry footprint, existing north longitudinal wall or lane alignment changes.
Bougainvillea and small broad-leaved shrubs are Details-only sprites and use the
existing route-clearance guard; their individual planting positions are illustrative
within the photographed garden band, not botanical identification or a tree survey.

Check `python3 scripts/check_cervantes_north_patios.py`; compare the before and
after `IMG_2368 --pool=north,middle --high --details` renders. These checks establish
source linkage and clearance, not surveyed photographic fidelity.

## Validation and render limits

All handover source/photo checks, the new partition check, TypeScript, production
build and both browser regressions passed. Layout traversal covered 20 routes in
both directions (217 segments), with no runtime errors. The unchanged site levels
and registry geometry passed their existing checks.

The required IMG_2368 `--high` pair renders successfully but currently frames the
Elena beds: the existing render helper follows a ground player and its collision
resolution from the roof pin, rather than a free camera at roof altitude. It is
therefore not usable as a direct photographic match. An additional diagnostic
before/after pair from clear ground at (-157, 62), aimed at (-160, 55), shows the
partial white partitions and planting appearing behind the unchanged Cervantes
wall and lane. This diagnostic is explicitly not the source photo camera. A
proper roof-altitude camera remains needed for a close photographic comparison.
