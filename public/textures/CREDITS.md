# Surface textures

CC0 textures from [Poly Haven](https://polyhaven.com), downloaded at 1k on 31 October
2026, recoloured to the Villacana photos and recompressed (colour 1024 px, normal map
512 px). `src/materials.ts` sets the size each image covers.

| File | Source | Author | Covers | Recoloured to |
| --- | --- | --- | --- | --- |
| `plaster.jpg`, `plaster-normal.jpg` | [Painted Plaster Wall](https://polyhaven.com/a/painted_plaster_wall) | Amal Kumar | 2 m | near-white, half contrast; tinted by the wall colour |
| `roof-tiles.jpg`, `roof-tiles-normal.jpg` | [Clay Roof Tiles 02](https://polyhaven.com/a/clay_roof_tiles_02) | Amal Kumar | 2.5 m | the lichen-mottled barrel tiles in IMG_2207/IMG_2208 in sun (#a07c68, as the facade-kit tiles), 30% towards grey |
| `crazy-paving.jpg`, `crazy-paving-normal.jpg` | [Stone Pathway](https://polyhaven.com/a/stone_pathway) | Amal Kumar | 2 m | the crazy-paving path in IMG_2192 and round the north-pool lawn in IMG_2204-2206, in sun |
| `terracotta.jpg`, `terracotta-normal.jpg` | [Terracotta Floor Tiles](https://polyhaven.com/a/terracotta_floor_tiles) | Dimitrios Savva | 3.2 m (8 tiles of 0.4 m) | mean of the lane tiles in IMG_2189, warmed slightly |

## Banana leaf and bunch

The leaf colour of the banana plant (`public/models/plants/banana.glb`, built by
`scripts/build_banana.py`) is photographic. It is cut from Dave's own photo IMG_3092 of the plant,
already published in this repo as `public/photos-ref/IMG_3092.jpg`. Three leaves were traced in the
full-size original and unrolled into flat strips, which are kept in `scripts/assets/banana/`. No
external images were used. The bunch (fruit, rachis and bud) is also cut from IMG_3092. The stem
texture is generated in the build script.

| File | Source | Author | Licence |
| --- | --- | --- | --- |
| `scripts/assets/banana/leaf-green.jpg` | IMG_3092, the upright leaf in the centre | Dave (resort photo set) | own photo, published in this repo |
| `scripts/assets/banana/leaf-yellow.jpg` | IMG_3092, one half of the leaf reaching out to the left | Dave | own photo, published in this repo |
| `scripts/assets/banana/leaf-scorch.jpg` | IMG_3092, the big arching leaf to the right with the brown band | Dave | own photo, published in this repo |
| `scripts/assets/banana/bunch-photo.jpg` | IMG_3092, the hanging bunch, rachis, bud and lifted bract, cut out of the sky | Dave | own photo, published in this repo |
