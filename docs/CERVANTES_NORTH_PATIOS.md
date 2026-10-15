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
