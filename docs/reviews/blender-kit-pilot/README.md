# Graphics pilot: lighting, occlusion and a Blender-built facade kit

The north-pool courtyard is the pilot. The lighting changes apply to the whole resort; the
facade kit is on the walls facing the north pool only. Before is `main` at the start of the
task, after is this branch, both in the Details view. The camera views use the solved station
cameras from `docs/reviews/photo-camera-alignment`.

- `IMG_2204/2205/2206-before-photo-after.jpg`: before, the photo, after.
- `*-before.jpg`, `*-after.jpg`: the renders at full size.
- `*-overlay.jpg`: after-render edges over the photo.
- `walking-before-after.jpg`: first-person view by the north pool.

## What changed

**Lighting (`src/look.ts`):**
- **Sky light:** image-based lighting from a 1k CC0 Poly Haven sky.
- **Tone mapping:** Khronos PBR Neutral. ACES was tried first and washed the painted colours out.
- **Shadows:** a shadow box fitted to where the camera looks, so shadows are sharp near the viewer.
- **Ambient occlusion:** GTAO on desktop, which gives soft contact shading under hedges, plants,
  ledges and balconies. Plant cards and the backdrop stay out of the pass; with them in, they
  occluded as rectangles.

**Facade kit (`scripts/build_kit.py`, `src/facade-kit.ts`):**
- **Built in Blender:** three parts built headless (Blender 5.2 as the `bpy` Python module) and
  exported as glTF — arched louvred shutter doors with a moulded surround, black iron balconies
  with rings, and wooden balconies under a barrel-tile lean-to.
- **Placement:** the parts go on the generated opening positions of the walls facing the north
  pool. Every ground-floor opening gets a door. Upper floors get a door with an iron balcony, or
  on some walls a wooden balcony.

## Cost

| Item | Size |
| --- | --- |
| Sky | 1.4 MB (`public/art/sky-kloofendal-1k.hdr`) |
| Kit models | 183 kB (shutter door 34, iron balcony 60, wooden balcony 89), no compression available in the pip Blender build |
| Game script | slice chunk 180 kB (57 kB gzipped) including the post-processing passes |

Frame time could only be measured in the software (SwiftShader) browser here:
- **Photo view:** about 2.0 s without occlusion and 2.7–3.1 s with it, at 1600 × 1200.
- **Walking view at 1400 × 800:** 1.3 s on main and 2.5 s after, with occlusion on.

Those numbers show that occlusion roughly adds a third of the frame cost. They say nothing about
real GPU frame rates. The kit adds about a dozen instanced draws.

## What still looks wrong

- **Which walls get which balcony is generated.** In IMG_2204 the left block has one
  wooden-roofed balcony and one iron one; the generator gave it two wooden ones. The right-hand
  canopy house is right only by chance.
- **Window positions:** openings keep the generator's 3.1 m spacing, not the real window
  positions, and the photographed house fronts have more variety (square windows, small windows).
- **Roofs and backdrop:** parapets, water tanks and roof clutter are missing, and the backdrop
  is still the flat painted ring.
- **Textures:** plaster, terracotta and crazy paving were not retextured in this pilot. The
  ground still comes from the classified aerial cover.

## Recommendation

1. **Roll the kit out resort-wide.** It changes the character more than anything else here, and
   it costs little. Pick balconies per wall from the solved photo cameras, or by hand in a small
   data file, rather than from a hash.
2. **Add parts next:** square windows with iron grilles, parapet copings with water tanks,
   arched white gateways with iron gates, pool ladders and life-ring posts.
3. **Keep occlusion on desktop.** Retexture plaster and paving with CC0 PBR sets (ambientCG) as a
   separate pass.
