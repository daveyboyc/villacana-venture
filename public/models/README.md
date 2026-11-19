# Asset library: 3D models

Every 3D model the game loads lives in this folder, one `.glb` per asset. Each one is built
headless in Blender (`pip install bpy==5.2.3`) by the script named below. Do not edit the
`.glb` files by hand: change the script and rebuild. Every build is seeded, so a rebuild gives
byte-identical files. The models are original procedural models, not scans or downloads.

Conventions: metres, standing on the origin, y up in the glTF file. Plants and trees are sized to
the card they replace (`SPRITE_SIZE` in `src/sprites.ts`). Small screens keep the flat cards.

Before modelling something new, look here first, then read `docs/REUSABLE_ASSETS_PRD.md`.

## Plants (`plants/`)

The map kind is the `kind` used in `data/objects.json` and `data/kinds.json`. `src/sprites.ts` (`MODELS`) maps each kind to its model.

| Model | Map kind | What it is | Built by | Photos |
| --- | --- | --- | --- | --- |
| `strelitzia.glb` | `bird_of_paradise` | Giant white bird of paradise (Strelitzia nicolai) clump | `scripts/build_plants.py` | IMG_2204, IMG_2206, IMG_3083 |
| `palm.glb` | `palm` | Canary date palm | `scripts/build_plants.py` | north pool |
| `yucca.glb` | `yucca` | Many-headed yucca | `scripts/build_plants.py` | IMG_2205 |
| `hedge.glb`, `hibiscus-hedge.glb` | `hedge`, `hibiscus_hedge` | Clipped hedge piece, plain and with red flowers | `scripts/build_plants.py` | IMG_2204-2206 |
| `banana.glb` | `banana` | Banana plant (Musa) with a fruit bunch and purple bud; painted leaf, stem, fruit and bud textures embedded | `scripts/build_banana.py` | IMG_3092, IMG_3090 (review: `docs/reviews/banana-asset/`) |
| `fan-palm-clump.glb` | `fan_palm` | Mediterranean fan palm (Chamaerops humilis), multi-trunked clump | `scripts/build_garden_plants.py` | IMG_3087, IMG_3088 |
| `cycad.glb` | `cycad` | Sago cycad (Cycas revoluta) | `scripts/build_garden_plants.py` | IMG_3086 |

## Trees (`trees/`)

Built by `scripts/build_trees.py`. The `-far` versions are lighter, for trees well beyond the resort.

| Model | Map kind |
| --- | --- |
| `broadleaf.glb`, `broadleaf-far.glb` | `tree` (also used for the Dalí loquat at scale 0.8) |
| `spreading-tree.glb` | `feathery_tree` (jacaranda and similar) |
| `pollarded-tree.glb` | `pollarded_tree` |
| `umbrella-pine.glb`, `umbrella-pine-far.glb` | `umbrella_pine` |
| `norfolk-pine.glb`, `norfolk-pine-far.glb` | `norfolk_pine` |
| `eucalyptus.glb`, `eucalyptus-far.glb` | `eucalyptus` |
| `palm-far.glb` | distant `palm` |

## Facade kit (top level)

Built by `scripts/build_kit.py`; placed through `data/facade_kit.json` (`src/facade-kit.ts`).

`shutter-door.glb`, `shutter-window.glb`, `arched-window.glb`, `iron-balcony.glb`, `wood-balcony.glb`

## Pool and lawn fittings

- `pool/` (`ladder`, `step-rail`, `life-ring`): built by `scripts/build_pool_kit.py`, placed by `src/pool-kit.ts`.
- `lawn/` (`bollard`, `bin`, `cover`): built by `scripts/build_lawn_kit.py`, placed by `src/main-pool-lawn.ts`.

## Adding a plant

1. Write a builder function (reuse `Plant` from `scripts/build_plants.py`, as `build_garden_plants.py` does) and build it.
2. Add the kind to `SpriteKind`, `SPRITE_SIZE`, `PAINTERS` (the small-screen card) and `MODELS` in `src/sprites.ts`, and to `data/kinds.json`.
3. Place it in `data/objects.json` with its photo evidence. Mark a photographed tree whose canopy overhangs a route with `canopyOverhangs`.
4. Rebuild with `python3 scripts/build_skeleton.py`, then check it in Inspect with **Show details**.
5. Add a row to this table.

Other material lives elsewhere: surface textures in `public/textures/` (credits in `CREDITS.md`), the painted plant atlas and sky in `public/art/`.
