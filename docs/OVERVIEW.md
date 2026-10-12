# Villacana overview and reference map

Open `blueprint.html` for the detailed map, or select **Overview** while walking for the 3D view. The map’s **3D overview** link opens all four pool areas together, including the seafront. Both views use the same map coordinates, street names, car parks and ramp data.

The map has zoom buttons, wheel/pinch zoom, rotation buttons, two-finger rotation, North and Fit whole resort. Drag to pan. Keyboard +/− zoom and Q/E rotate. Street labels stay upright and keep a readable screen size; overlapping labels are hidden until there is room at a closer zoom. User annotations, pools and the principal connecting streets receive priority.

The 3D overview freezes walking and has zoom/rotate buttons, North, Top down, Fit area, and a Drag: pan / Drag: rotate switch. Touch gestures pan or rotate according to this switch, and two fingers pinch to zoom. WASD pans in overview. Decorative distant mountains are hidden in overview. Return with Walk.

## Labels and references

Tap an existing named label to change its name, add notes, choose any indexed reference photo, or attach a web/Drive URL. The Cervantes/Elena ramp and Dalí car park have relevant reference photos already attached. Use **+ Label / reference**, then tap the map to add a new pin. Save keeps the editor open and confirms the result. Move pin relocates the selected reference; Delete removes a custom pin; Reset label restores a built-in label.

Annotations are saved in this browser under `villacana-reference-points-v1` and are shared between the 2D and 3D views and other tabs on the same site. They are not automatically published or synchronized across devices. Existing photo-caption and object edits retain their original storage/workflow. If browser storage fails, the editor reports it explicitly and still permits exporting the in-memory references.

**Export references** downloads `villacana-references.json`. Keep it as a backup or share it for incorporation into the project. **Import** merges such an export by reference ID, preserving other pins. An imported matching ID replaces the local version. Files are validated before changes are applied; malformed files, invalid coordinates and unsafe link schemes are rejected without modifying existing references. Imported exports from another device must come from the same map coordinate system.

Validation covered desktop and mobile zoom/rotate controls, placement in both views, saving/reloading, shared coordinates across views, export/import round trips, rejected imports preserving data, and visible feedback when browser storage is unavailable. The production build and map, seafront and boundary checks pass.
