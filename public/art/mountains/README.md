# Mountain backdrop

`panorama.webp` (4096 x 224, RGBA) is a flat photographic backdrop of the ranges behind
Villacana, drawn as a curved band at the horizon by `addRidge` in `src/backdrop.ts`
(bearings -112 to 82 degrees, elevations -2.1 to 8.5 degrees, 21.1 px per degree). It replaces
the old traced polygon ridges: there is no 3D mountain geometry and no hard outline.

It is built by `scripts/build_mountain_texture.py`, which downloads the photographs below from
Wikimedia Commons, cuts the sky away with a soft feathered edge, scales each so its peaks stand
about as high as the skyline measured from Dave's photos (up to 5-6 degrees), cools and hazes the
rock more toward the horizon until it matches the sky's horizon colour, and cross-fades the pieces.
The result is a modified, reduced adaptation of the originals. The photos are representative
views of these ranges placed by compass bearing, not the exact slopes seen from Villacana.

| Used for | Source (Wikimedia Commons) | Author | Licence |
| --- | --- | --- | --- |
| Pointed peaks (La Concha / Sierra Blanca) | [Marbella - Picho de la Concha (Sierra Blanca).jpg](https://commons.wikimedia.org/wiki/File:Marbella_-_Picho_de_la_Concha_(Sierra_Blanca).jpg) (2020) | Zarateman | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Broad Sierra Bermeja massif and the Benahavis ridge | [Sierra Bermeja vista.jpg](https://commons.wikimedia.org/wiki/File:Sierra_Bermeja_vista.jpg) (2007) | Larry Wentzel | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| Sierra Crestellina (west) and the lower eastern ground | [Sierra Crestellina2.jpg](https://commons.wikimedia.org/wiki/File:Sierra_Crestellina2.jpg) (2007) | Larry Wentzel | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |

The credit for the two CC BY photos is shown in the app (`#backdrop-credit` in `slice.html`).
