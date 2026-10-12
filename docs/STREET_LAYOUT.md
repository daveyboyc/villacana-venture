# Google-checked Villacana street layout

Checked 12 October 2026 using both Google Maps satellite imagery and standard street maps at zoom 18/19, walking-route cross-checks, Dave’s Apple Maps screenshot, IMG_2260–IMG_2270, and the original Catastro footprints. This is the reference-check date; Google did not supply the satellite imagery’s capture date.

Street coordinates use the existing local metre origin (36.4552, −5.05). The Google images were compared on that same coordinate system, rather than measured from a tilted screenshot. API keys, raw API responses and downloaded Google imagery remain outside the public project assets. The public layout contains coordinates, source/precision notes and key-free links opening Google’s satellite and standard map views.

| Street | Checked layout |
| --- | --- |
| Calle Miguel de Cervantes | Straight axis at its actual angle across the block, connecting Dalí to the inner Picasso car-park access; full name replaces the separate uncertain “Miguel” label |
| Calle Pintor Dalí | Refined centreline with the photographed bays and outer fence re-aligned to it |
| Calle Pintor Picasso | Named outer road, distinct from the unnamed inner parking access aisle |
| Calle Loira / Calle Bolivia | Northern boundary and short connector into Picasso |
| Calle Isabel de Oyarzábal | Placed curved connection around the northern pool’s upper/eastern side to Alberto; replaces uncertain “Isabel” |
| Calle Alberto | Full link from Loira to Cervantes |
| Calle Elena | Separate north and south sections joining Cervantes; southern bends connect to Eva around the middle-pool courtyard |
| Calle Eva | Connected west/east route around the middle pool and a west-side footpath to Patricia |
| Calle Patricia | Corrected angle and connections across Silvia, Teodoro Rojo and Guillermo |
| Calle Silvia | North/south sections with the staggered junction at Patricia, continuing to Jorge |
| Calle Jorge | Corrected Dalí–Guillermo crossing |
| Calle Teodoro Rojo | Full Eva–Jorge connection |
| Calle Guillermo | Full route from Eva toward the beach, crossing Patricia and Jorge |

`data/street_layout.json` supplies adjoining streets and checked parking frontage. `data/dali_cervantes.json` supplies Dalí, Cervantes, its ramp, parking and fence. `scripts/build_skeleton.py` merges these into one street list and one shared 3D road layer. Registry aliases are attached to the canonical names rather than drawn as extra uncertain streets. Existing reference IDs remain stable for previously editable street labels. New labels sit at each segment’s length midpoint, away from crowded junctions. Long street labels abbreviate “Calle” to “C.” on the overview; the editor and tooltip keep the full name. Cervantes receives priority at the widest zoom. The original walking view also uses the checked street name near a mapped lane.

Geometry remains approximate: routing coordinates have metre-level precision; a few sub-metre lateral adjustments and junction extensions were checked against the satellite view and original registry clearances. Pedestrian widths, parking dimensions and the 0.4 m ramp rise are estimates, not surveyed measurements. All 230 building footprints and all five pool shapes use the original registry data; frontage modifications from the previous horizontal Cervantes alignment are removed. Generated garden walls leave openings at mapped street corridors. The photographed Dalí fence remains a separate visible/collision boundary.

Validation: 18 mapped segments, canonical names, 25 parent-street joins, no street centreline through a house or pool, independent player-radius clearances, original registry frontages, whole-resort Player traversal in both directions on all segments, ramp jump landing, and the existing map/seafront/boundary checks. Google reference links contain no API key. The static site does not need the private credential or call the paid APIs to render this layout.
