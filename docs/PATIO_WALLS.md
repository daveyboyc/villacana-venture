# Patio wall markings and level estimates

Open the canonical map and choose **Patio walls**, or use `/?view=map&walls=1`.
Select a line or a searchable list entry. `wall=<feature ID>` makes a shareable
selection. **Inspect wall guides here** opens the selected line in Layout with the 3D guide layer enabled.
The panel links the original photo references and the aerial.

The inventory covers all active wall axes from the six explicit Cervantes/Elena/
Jorge patio-wall datasets: 24 walls and two nominal low edges. Retired records are
excluded. All 23 standing zero-storey registry outlines are marked separately as
untraced enclosures. Other existing wall/patio/terrace groups are shown as grey
context and recorded wall-related gaps as red markers. Context includes the
north-pool gated-wall group, raised terraces and garden-door structure. It is not
a claim that every physical patio wall has been found. Grey group outlines may
represent a feature extent or station-generated context, not physical wall edges.

Each explicit axis has its source ID, evidence, confidence, placement status,
nominal height and thickness, calculated length and **gross single-face** area.
These are model estimates: openings, both faces, coping and waste are not included
in a net quantity. Separate parent-source route openings remain recorded. Registry
perimeters and group extents never enter wall quantities. JSON can be downloaded
from the panel for further measurement/render preparation.

The panel screens model terrain along each axis at intervals no greater than
0.5 m and reports its elevation range. This is not the wall's base or top profile.
Area-level photo rise estimates are contextual, not assigned as wall elevations.
Use a separate datum for each patio/continuous wall, check both ends, doors and
steps, then decide whether its top should be level, stepped or sloped. The current
model includes real level changes: do not flatten the whole resort. No wall or
terrain geometry has been moved by this inventory task.

Independent source observations and remaining photo gaps are in
[the source review](reviews/patio-wall-inventory/SOURCE-REVIEW.md). The review
inspected eight full repository photo copies and the Esri aerial. It does not
grant measured placement approval. Concealed Elena east divisions, Cervantes
partition joins and lightly photographed northern lanes still require evidence.

Regenerate with `python3 scripts/build_patio_walls.py` after references/confidence
are regenerated. `npm run build` does this automatically. Check freshness with
`--check`, and run `python3 scripts/test_patio_walls.py`. This is an inventory and
estimation tool; physical tracing, wall-specific level decisions and 3D corrections
remain work to complete against measured evidence.

## Guide lines in the model

Open `/?view=overview&wallGuides=1` or press **Wall guides** beside the Inspect
area selector. This works in Layout and Show details, including on phones.
Choose a wall in the guide panel to highlight and frame it; **Check selected wall
on map / photos** returns to its source record. Map selections open the same
guide automatically. The guide toggle and selected wall survive reloads and
Layout/Details switches through the URL.

Blue solid lines follow existing wall axes, teal marks nominal low edges, orange
dashes show untraced registry enclosure edges, and pink highlights the selection.
The lines follow model ground at 0.5 m intervals, lifted 0.16 m for visibility.
They show through buildings as a planning overlay, so an overlapping line does
not prove a wall should pass through a building. Dashed outlines may include
openings, building faces or no wall at all. Other model-group extents and point
gaps are deliberately not converted into 3D wall traces.

Use these lines to compare a proposed wall run with the aerial and photos. Once
the endpoints and openings are established, author height, thickness and a
local floor/top datum in the wall source and render a solid wall. The guides do
not create walls, change collision, flatten the ground or certify placement.
They remain hidden in Walk and photo-camera renders.
