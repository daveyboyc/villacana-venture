# Villacana overview and reference map

Open `blueprint.html` for the detailed map, or select **Overview** while walking for the 3D view. The map’s **3D overview** link opens all four pool areas together, including the seafront. Both views use the same map coordinates, street names, car parks and ramp data.

The map has zoom buttons, wheel/pinch zoom, rotation buttons, two-finger rotation, North and Fit whole resort. Drag to pan. Keyboard +/− zoom and Q/E rotate. Street labels stay upright and keep a readable screen size; overlapping labels are hidden until there is room at a closer zoom. User annotations, pools and the principal connecting streets receive priority.

The 3D overview freezes walking and has zoom/rotate buttons, North, Top down, Fit area, and a Drag: pan / Drag: rotate switch. Touch gestures pan or rotate according to this switch, and two fingers pinch to zoom. WASD pans in overview. Decorative distant mountains are hidden in overview. Return with Walk.

## Labels and references

Tap an existing named label to change its name, add notes, choose any indexed reference photo, or attach a web/Drive URL. The Cervantes/Elena ramp and Dalí car park have relevant reference photos already attached. Use **+ Label / reference**, then tap the map to add a new pin. Save keeps the editor open and confirms the result. Move pin relocates the selected reference; Delete removes a custom pin; Reset label restores a built-in label.

Annotations are saved in this browser under `villacana-reference-points-v1` and are shared between the 2D and 3D views and other tabs on the same site. They are not automatically published or synchronized across devices. Existing photo-caption and object edits retain their original storage/workflow. If browser storage fails, the editor reports it explicitly and still permits exporting the in-memory references.

**Export references** downloads `villacana-references.json`. Keep it as a backup or share it for incorporation into the project. **Import** merges such an export by reference ID, preserving other pins. An imported matching ID replaces the local version. Files are validated before changes are applied; malformed files, invalid coordinates and unsafe link schemes are rejected without modifying existing references. Imported exports from another device must come from the same map coordinate system.

Validation covered desktop and mobile zoom/rotate controls, placement in both views, saving/reloading, shared coordinates across views, export/import round trips, rejected imports preserving data, and visible feedback when browser storage is unavailable. The production build and map, seafront and boundary checks pass.

## Mobile camera and surfaces

The 3D walk has **+**, **−** and **Fit area** controls. Fit area opens a north-up
view of the selected courtyards. The overview keeps zoom and fit visible, with
rotation, pan mode and alignment checks under **More**. Alignment checks start
off on small screens; reference tools scroll on a single row. Two fingers can
pinch across either half of the canvas, including while walking. Adding the
second finger stops joystick movement. Zoom out can reach three times the fit
distance; Fit area recentres and resets the camera. **Walk** returns to walking.

The 2D map's **Fit whole resort** button is beside its zoom controls. Grass uses
a small repeating blade texture at a constant metre scale, including the large
painted ground and raised surfaces. Existing lawn classification limits the
detail to grass. Both mobile and desktop use these materials in Layout and
Details; small blades blend naturally at overview distances. No additional
plants, buildings or collision are introduced.

Requirements: [MOBILE_MAP_PRD.md](MOBILE_MAP_PRD.md). Run the mobile regression
with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test_mobile_browser.cjs`
(or omit the executable override when Playwright Chromium is installed).
