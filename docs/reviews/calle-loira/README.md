# Calle Loira resort boundary

The overlay shows the checked-in Esri aerial in the existing map-metre frame
(+x east, +z south). Cyan shows registry footprints, white the existing road
centre, magenta the wall, orange the footpath centre, and green the grass
outlines. The eastern wall trace was adjusted by up to 1.6 m to clear the
existing mapped road. The aerial already has a global registration in
`public/map/ground.json`. Roof edges and vegetation obscure parts of the wall foot.
The trace is approximate. There are no independent check points or solved cameras
for this frontage, so there is no measured placement result.

| Observation | Source | Model and limits |
| --- | --- | --- |
| L01 · Asphalt bends between Dalí and Picasso/Bolivia | Esri aerial, Google Maps lane-name satellite screenshot (Imagery © Google, 2026), IMG_3150 | Existing six-metre nominal ribbon retained. Road edge and junction dimensions remain approximate. |
| L02 · Long white rendered wall, street plaque on its inside face | IMG_3133 (wall occupies the right half), IMG_3141 (right edge and window pier) | Shorter visible run follows the aerial boundary band. Photos establish form and relative side. Absolute height and western continuation are unresolved. |
| L03 · Adjacent terracotta lane, signed Calle de Juan Gris | IMG_3133 (left foreground and sign), IMG_3141 and IMG_3153 (lower half, four courses visible) | A narrow strip on the resort side, sized from tile count and fitted into the registry gap. Side accesses and covered connections are outside the trace. |
| L04 · Shallow arched grille opening with terracotta sill | IMG_3150 and IMG_3151 (central frame) | Opens toward Loira above a sill. Camera pins on Juan Gris give an approximate station. IMG_3153 shows another grille farther along, whose location and identity are unresolved. |
| L05 · Grass on the resort side of Loira | IMG_3150 (bottom of aperture), Esri aerial (western bend) | The window-side grass and the separately visible western bend are represented as separate patches. The intervening edge is obscured. |
| L06 · Opposite wall and planting | IMG_3150 (through the opening) | Brief view with no traceable extent. Roadside photo request covers this frontage and the west bend. |

`data/photo_poses.json` contains no solved cameras for IMG_3133, IMG_3141,
IMG_3150 or IMG_3153. The diagnostic views use phone pins and estimated headings.
The LiDAR report records a 0.06 m median and 0.46 m worst model-to-survey ground
difference along Loira. The road datum remains intact. New ground surfaces and
the wall follow that existing terrain, with the wall height estimated from the
photos. The report measures ground, so it supplies no wall or sill heights.

[Layout](inspect-layout.jpg) and [Show details](inspect-details.jpg) show the
white wall, fixed arched grille, sill and adjacent terracotta surface. An
independent reviewer checked both views against the full reference images and
the aerial. Their plan check found no overlap with the nominal road or registry
buildings after the eastern adjustment. The tile strip and wall are visible
in both modes. General paving remains visible behind the strip, and the grille
and lintel are simplified. These views show the built structure from a useful
angle. The phone-based photo comparisons remain non-comparable for placement.
