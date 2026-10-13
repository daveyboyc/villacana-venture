# Villacana Roam

A small third-person stroll through **Villacana**, the beach urbanization in Estepona, on the Costa del Sol. The lanes, the shoreline, the pools, and the traced houses come from the real map. You walk, run, and jump, with the camera over your shoulder.

This is an original prototype. It is not affiliated with Nintendo.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:4731`.

| Action | Control |
| --- | --- |
| Walk | WASD or arrow keys |
| Run | Shift |
| Jump | Space |
| Look | Drag the mouse, or hold Q and R |
| Zoom | Mouse wheel |
| Read a photo frame | E, or the Look button when you are beside one |
| About this map | H, or the button in the corner |
| Phone | Stick on the left, drag the right side to look, Jump and Run |

On a phone the same dev server works if you open it from another device on the network.

## How the prototype is put together

The playable place is the rectangle of Villacana between the beach and the inland lanes, about 800 by 700 metres, centred near Calle de Picasso.

1. **The map.** `data/villacana.osm.gz` is an OpenStreetMap extract (© OpenStreetMap contributors, [ODbL](https://opendatacommons.org/licenses/odbl/)). `scripts/build_map.py` projects it into local metres and writes `public/map/villacana.json`.
2. **What is real.** The coastline, Playa del Sol, named streets, parks, pitches, and building footprints that exist in OpenStreetMap are kept. The five pool outlines are traced from a georeferenced aerial photo of the Villacana block, using the same metre grid as the streets, so a street corner on the photo is the same point in the game. The base of the resort is the aerial photo itself (`scripts/build_ground.py`). It uses the same metre origin as the streets, and it checks that those streets land on the paved pixels. Invented houses are not drawn on top of that photo. `scripts/trace_pools.py` traces the pools on that same grid. OpenStreetMap's own pool outlines for this rectangle are elsewhere, so they are not used.
3. **What is filled in.** Most of the white terraces were never drawn house by house. Along residential lanes that are empty, the script places ordinary low houses set back from the curb, the kind of building the urbanization is full of. Palms and bougainvillea are planted along those lanes for the same reason. The about panel in the game gives the counts.
4. **The walk.** A Vite app and Three.js turn that JSON into a lit neighbourhood: sand, sea, roads, pools, and roofs. A character walks it in third person.
5. **The photos.** Frames stand at real spots (Playa del Sol, Barraca, Calle de Picasso, Gregorio, the middle of Villacana). Two of them use Creative Commons photographs of the Estepona coast, which is the same shore. The others are empty on purpose, so your own pictures can go in.

## Add your own photos

Edit `public/photos/album.json`. A frame needs a title, a latitude, a longitude, and optionally an image in `public/photos/`:

```json
{
  "id": "pool",
  "title": "The long pool",
  "lat": 36.4555,
  "lon": -5.0505,
  "image": "/photos/pool.jpg",
  "caption": "Saturday morning, before anyone else is in.",
  "credit": "Photo by you."
}
```

Leave `"image": null` for an empty frame. Refresh the page. You do not need to rebuild the map.

On `blueprint.html`, tap a photo pin, enter a label, then tap **Save** or press
**Enter/Done**. The photo stays open and confirms whether the label was saved on
this browser. Reopening the photo or refreshing restores saved labels. If browser
storage is unavailable, the message explains that the label only lasts for this
visit; use **Send changes** before leaving.

Labels do not automatically update GitHub or sync between devices. **Send changes**
shares or copies the edits so they can be applied with `scripts/apply_map_edits.py`
and published in `public/photos-ref/labels.json`.

The two pictures already in the game:

- Playa del Sol uses [Estepona beach](https://commons.wikimedia.org/wiki/File:Estepona_beach.jpg) by Jay Cross, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- Barraca uses [Playa del Cristo in winter](https://commons.wikimedia.org/wiki/File:Playa_del_cristo_winter_-_Estepona_beach_(cropped).jpg) by Turista Inglesa, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). That beach is further along the same coast. Replace it with your own picture of Barraca when you have one.

## Rebuild the map

The JSON in the repo is already built. To regenerate it from a fresh extract:

```bash
curl -A "VillacanaRoam/1.0" -o data/villacana.osm \
  "https://api.openstreetmap.org/api/0.6/map?bbox=-5.0605,36.4495,-5.0425,36.4635"
gzip -f data/villacana.osm
npm run map
```

## What this slice leaves out

Interiors, cars, a true height map, and your own photographs of each street. The next useful step is to drop those photographs into the frames, and, if you want the houses to match a specific block, to trace any missing footprints in OpenStreetMap and rebuild the map.

Production builds require Python 3.10+ to regenerate photo associations (standard library only). Importing original photos additionally uses Pillow and pillow-heif.

Photo placement and the evidence graph: see [PHOTO_MAP_WORKFLOW.md](docs/PHOTO_MAP_WORKFLOW.md). Use **Photo evidence** on the reference map to inspect camera uncertainty and proposed street associations.
