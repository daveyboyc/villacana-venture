# Banana plant asset (`public/models/plants/banana.glb`)

The banana (Musa) behind the white garden wall on Calle de Miguel. It has a fruit bunch and a
purple male bud. This is an original procedural model built in Blender (bpy) by
`scripts/build_banana.py`. It is not a scan and not a downloaded model.

Build: `python3 scripts/build_banana.py`. The build is seeded: two runs gave the same sha256,
`8191e61c…8246519`.

## Source photos

- `public/photos-ref/IMG_3092.jpg` is the key view, looking up from the lane. Leaf count and posture,
  dried and torn margins, the bunch, the rachis and the bud come from this photo.
- `public/photos-ref/IMG_3090.jpg` shows the same plant from further west. It was used for overall
  proportion.
- `public/photos-ref/IMG_3093.jpg` shows a leaf edge in shade. It was used for leaf colour and sheen.

![comparison](comparison.jpg)

## Size estimate

None of these sizes is measured. They come from proportions in the photos, with the garden wall
(about 1.8-2.0 m) and the pseudostem (about 0.25-0.3 m across) as rough scales.
- **Pseudostem:** the leaves part from it at about 2.75 m.
- **Top leaf tip:** 5.97 m above the origin.
- **Bunch and bud:** the bunch spans 2.32-2.80 m and the bud hangs from 2.01 m down to 1.65 m. In
  IMG_3092 the bud hangs clearly above the wall top. If the garden ground is level with the lane,
  the model's bud would sit just below a 1.9 m wall, so either the garden bed is raised or the wall
  there is lower. This is not resolved.
- **Blades:** 1.55-2.55 m long and 0.54-0.70 m wide, about 4:1 as photographed.
- **Petioles:** 0.45-1.05 m long. The upright leaves have the longest ones.

Bounding box in glTF coordinates (y up, metres):
- x: -1.90 to 2.52
- y: 0 to 5.97
- z: -2.09 to 2.00

That is about 4.4 × 4.1 m across and 5.97 m tall. The largest horizontal radius from the origin is
2.57 m. The plant stands on its origin.

## Budget

| | |
|---|---|
| File | 639,132 bytes (624 kB), textures embedded, standard glTF 2.0, no extensions |
| Triangles | 12,865 |
| Materials | 4 |
| Textures | leaf 1024² palette PNG (alpha mask), leaf normal 512² JPEG, stem 512² JPEG, fruit 128×256 JPEG, bud 256² JPEG |

The four materials:
- **`banana-leaf`:** alphaMode MASK, double-sided, normal map, roughness 0.48.
- **`banana-stem`:** pseudostem, petioles, midribs, fruit stalk and rachis share one atlas. Roughness 0.78.
- **`banana-fruit`:** roughness 0.55.
- **`banana-bud`:** double-sided, glossy, roughness 0.32.

## What is modelled

- **Leaves:** 10 green leaves and 1 dead leaf hanging on the stem. The two upper leaves are nearly
  upright and the lower ones arch out and down.
  - The atlas has four painted leaves: green, yellow-margined, scorched brown on one half (the big
    right-hand leaf), and dead.
  - Painting details: lateral vein striping, a pale midrib and ragged, alpha-cut margins.
  - The blades are torn along the lateral veins. The torn strips are separate geometry that sags
    loose, and there are finer slits in the alpha.
- **Pseudostem:** has dried brown sheath patches. Leaf sheaths wrap its top.
- **Fruit:** a curved stalk carries 6 hands (67 fingers). Each finger is five-sided, curves up and
  has a dark dried tip.
- **Rachis and bud:** a knobbly bare rachis ends in a teardrop bud. The bud has overlapping
  purple-maroon bracts, and its top bract is lifted to show a red inner face.

## Known differences from the photo

- **Leaf glow:** the photographed leaves glow yellow-green because sun shines through them. The model
  has no transmission, so in shade its leaf undersides render darker and more olive.
- **Uprights:** the two upright leaves look somewhat shorter, and the side leaves somewhat wider,
  than in IMG_3092 from a similar low view. The photo camera's distance is unknown, so proportions
  were matched by eye, not measured.
- **Scorched leaf:** on the big right-hand leaf the photo has a broad brown band inside a yellow edge.
  The model's brown band sits closer to the edge and is less extensive.
- **Bud height:** see the size estimate above. The bud may sit 0.2-0.3 m too low against the wall.
- **Bud colour:** the photographed bud is greyer, with a matte bloom. The model's bud is more saturated and
  glossier. The rachis in the photo is relatively longer and thinner.
- **Bunch:** in the photo the bunch looks like two denser clusters. The model's six hands are spread
  more evenly.
- **Leaf directions:** the leaves are arranged to match the lane view. Seen from the side (90°) the
  crown is narrower, because the real azimuths of the leaves pointing toward or away from the camera
  are unknown.
- **Stem base:** the pseudostem base is hidden by the wall and bougainvillea in every photo. Its
  colour and the hanging dead leaf are typical of the plant, not seen.
- **Texture banding:** the leaf texture is palette-quantized (256 colours, no dither) to save size,
  which shows slight banding on close-ups.
