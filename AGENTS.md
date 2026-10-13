# Villacana project direction

Prioritise structural accuracy before additional decorative detail. Read
`docs/LAYOUT_ACCURACY.md` for the current layout view, sources and remaining
uncertainties; `docs/PHOTO_MAP_WORKFLOW.md` explains camera pins and evidence.

- Keep map, 3D geometry and collision consistent. Preserve original registry
  house/pool footprints unless a specific evidence-backed correction is intended.
- GPS locates a camera, not the photographed subject. Source citations and passed
  movement tests do not prove photographic fidelity or surveyed dimensions.
- Distinguish photo-supported wall/opening arrangements from estimated extents,
  untraced enclosure boundaries and likely passages. Do not invent repeated walls
  or gates as substitutes for tracing.
- Default to the clear Layout view. Decorative objects must respect the shared
  route-clearance guard, including their visible footprint. Keep Details optional.
- Buildings keep a level datum, opaque materials and extrusion material groups.
  Terrain refinement is for ground surfaces and must preserve drawable groups.
- For geometry/collision/terrain changes, run relevant source and route checks,
  production build and the layout browser regression test. Summarise the observed
  outcome and remaining accuracy limits rather than claiming the whole resort is
  fully verified.
- Keep Google keys in ignored private environment files. Never publish API keys,
  signed download URLs, original photo metadata blobs or fetched Google imagery.
