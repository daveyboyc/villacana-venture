# Villacana Roam: rebuild spec

Status: draft for Dave's review. Nothing here is built yet.

## Goal

A walkable Villacana that someone who knows the place recognises at once: the right
buildings in the right places at the right size, the three small pools and the main
pool where they really are, the lawns and lanes between them. Then a hand-painted,
Studio Ghibli-like look on top: white houses, brown wooden Persian-blind shutters,
pools, grass.

## Progress (2026-10-11)

- Built: `scripts/build_skeleton.py`, `skeleton.json`, the blueprint page, and a first
  walkable area around the north pool (`slice.html`).
- Changed from the plan below, at Dave's suggestion: instead of finishing the whole
  skeleton before any graphics, one area (the north pool courtyard) is taken all the
  way to "right" first, then the same treatment is scaled to the rest.
- Changed from Part 1: open ground is stored as a classified picture (`cover.png`:
  lawn, planting, deck, paving) rather than as outlines. Lanes are not yet named.

## Decisions from Dave (2026-10-11)

- **No glass safety fence** round the pools, even though the real ones have it.
- **Plants and small details will be textures and sprites.** The trees, hedges,
  flowers, pots, furniture and similar details are simple 3D shapes for now, as
  placeholders. The end state is painted images: flat sprites that turn to face the
  camera for plants and props, and painted textures on walls, roofs and ground. Parts
  4, 5, 6 and 8 should place these things as data (a kind and a position) so the
  shapes can be swapped for sprites without touching the layout.
- **The player can get into the pools.** Wading and swimming are written for this
  game; no code is taken from other games.
- **North pool specifics**, from Dave's photos: lawn runs right up to a cream stone
  deck; the grey crazy-paving path runs round the outside by the garden walls; walls
  are about a metre high; balconies are a mix of wooden with a tiled roof and plain
  iron.

## Order of work

Skeleton first, graphics second. The current 3D view is set aside until the flat
skeleton has been compared against the real place and signed off. Graphics only ever
read the skeleton, so restyling cannot move a building or a pool.

| Part | What | Who | Depends on |
| --- | --- | --- | --- |
| 1 | Skeleton file format | main session | nothing |
| 2 | Skeleton build script | main session | 1 |
| 3 | Blueprint viewer | main session | 1 |
| — | **Dave signs off the skeleton** | Dave | 2, 3 |
| 4 | Buildings | subagent | sign-off |
| 5 | Pools and decks | subagent | sign-off |
| 6 | Ground, lawns, planting | subagent | sign-off |
| 7 | Walking and collisions | subagent | sign-off |
| 8 | Look: light, colour, outlines | main session | 4, 5, 6 |
| 9 | Minimap | subagent | sign-off |

Parts 1 to 3 stay in one session because every piece has to agree with the others.
Parts 4 to 7 and 9 are independent once the skeleton is fixed, so each goes to its
own subagent with only its section of this spec, the skeleton format, and the
relevant reference images. Part 8 comes last because it has to make the others look
like one picture.

## Sources of truth

| What | Source | Why |
| --- | --- | --- |
| Building outlines and floors | Catastro `BU.BUILDINGPART` (`data/catastro/`) | Surveyed; checked against the aerial photo, lands on the rooftops |
| Pool outlines | Catastro `BU.OTHERCONSTRUCTION` | Matches the photo within about 2 m; the old traced outlines were 20–30% too small |
| Lane names and positions | Catastro `AD.ADDRESS` | Official names, each tied to door positions |
| Lanes and lawns | Derived: the space inside the block that is not building or pool, split using the aerial photo | The registry does not record them as shapes |
| Coast, beach, surrounding roads | OpenStreetMap (`data/villacana.osm.gz`) | Good outside the block, poor inside it |
| Look and detail | Dave's reference images (private `villacana-reference` repo) | Compared by eye only, never traced |

Google and Apple imagery is reference only. No geometry is copied from it.

Known facts, confirmed by Dave: three small clover-shaped pools, one large main pool.
The registry also records the round toddler pool beside the main pool.

Lane names in the registry for the block: Alberto, Elena, Eva, Guillermo, Isabel,
Jorge, Miguel, Patricia, Silvia, Teodoro (Rojo), Picasso, Loira. Pintor Dalí runs
down the west side. Isabel and Miguel do not appear on Dave's Google screenshot and
need placing from the address points.

## Part 1: skeleton file format

One file, `public/map/skeleton.json`. Units are metres. `x` is east, `z` is south,
origin at latitude 36.4552, longitude −5.05 (unchanged from today, so the aerial
photo still lines up).

```json
{
  "origin": { "lat": 36.4552, "lon": -5.05 },
  "viewRotation": 24,
  "block": [[x, z], ...],
  "buildings": [{ "id": "…", "floors": 2, "ring": [[x, z], ...] }],
  "pools": [{ "id": "north", "kind": "small", "ring": [[x, z], ...] }],
  "decks": [{ "pool": "north", "ring": [[x, z], ...] }],
  "lawns": [{ "id": "…", "ring": [[x, z], ...] }],
  "lanes": [{ "name": "Calle Elena", "width": 2.2, "points": [[x, z], ...] }],
  "roads": [{ "name": "Calle Pintor Dalí", "width": 6, "points": [[x, z], ...] }],
  "promenade": { "width": 4, "points": [[x, z], ...] },
  "beach": [[x, z], ...],
  "coast": [[x, z], ...],
  "sources": { "buildings": "Catastro 2026-10-11", "…": "…" }
}
```

- `viewRotation` is the angle that turns the block square on screen, to match how
  Dave looks at it in Maps.
- `kind` for pools is `small`, `main` or `toddler`.
- Building height is `floors × 3.0 m`. Parts with `floors: 0` are patios and
  terraces: kept in the file, drawn as walled yards, not as houses.

Done when: a TypeScript type for this file exists in `src/types.ts` and the build
script's output passes a check that every ring is closed, non-self-crossing, and
inside the map bounds.

## Part 2: skeleton build script

`scripts/build_skeleton.py`, standard library only like the existing scripts.

1. Read the registry files, convert from UTM zone 30N to local metres.
2. Keep building parts and pools inside the block plus a margin for the car park,
   Barraka Beach and the hotel next door.
3. Lanes: compute the space inside the block not covered by buildings, yards, pools
   or lawns; take its centre lines; name each from the nearest address points.
4. Lawns and decks: classify the remaining open space from the aerial photo (green
   is lawn, pale ring around a pool is deck), then simplify to smooth outlines.
5. Coast, beach, promenade and outer roads from OpenStreetMap.
6. Write `skeleton.json` and print counts.

Done when: the script reports exactly 3 small pools, 1 main pool and 1 toddler pool;
no building overlaps a pool; and no lane centre line passes through a building.

## Part 3: blueprint viewer

A second page, `blueprint.html`, deployed alongside the game. Flat top-down drawing
of `skeleton.json`: buildings shaded by floor count, pools, decks, lawns, lanes with
names. Turned by `viewRotation`. Pinch to zoom, drag to pan, a toggle for the aerial
photo underneath, and a scale bar.

Done when: Dave can open it on his phone beside Apple Maps and every pool, lawn and
lane he checks is where he expects. Corrections go back into Part 2, not into
hand-edits of the JSON.

## Part 4: buildings

Reads `buildings`. Each part becomes a white box at its floor height. Flat roofs in
pale grey, with some as terracotta roof terraces; the large central block gets a
pitched clay-tile roof. Windows and doors on lane-facing walls with brown wooden
Persian-blind shutters, small tiled canopies over doors, low white yard walls.

Done when: from the three 3D reference angles, a screenshot from the same angle shows
the same massing and roof types.

## Part 5: pools and decks

Reads `pools` and `decks`. Water set slightly below a pale rim, gently animated,
lighter over the shallow lobes. Main pool gets its terracotta deck, curved wall, and
the toddler pool. Sunbeds and parasols as simple props.

Done when: standing at each pool, its shape and surround match the matching reference
close-up.

## Part 6: ground, lawns, planting

Reads `lawns`, `lanes`, `roads`, `promenade`, `beach`, `coast`. Sandy-terracotta
paved lanes, grass, the pink beach promenade, sand, sea. Palms, hedges and
bougainvillea placed along lanes and around pools.

Done when: no bare or untextured ground is visible anywhere a player can walk.

## Part 7: walking and collisions

The player cannot walk through buildings or yard walls, cannot walk on roofs, and can
walk into pools only as far as the edge. Spawn is on a lane.

Done when: an automated walk along every lane from end to end completes without
getting stuck, and a walk aimed at each building is stopped.

## Part 8: look

Soft toon shading, warm sunlight, painted sky and clouds, thin dark outlines, a
limited palette taken from the reference images. Sharper textures than today: no
stretched aerial photo on the ground.

Done when: Dave says it reads as Villacana and as hand-painted, not pixelated.

## Part 9: minimap

Draws the skeleton, turned by `viewRotation`, with pools and lawns visible.

Done when: the minimap matches the blueprint viewer at the same position.

## Open questions for Dave

1. Area: the block plus car park, Barraka Beach and the neighbouring hotel as simple
   surroundings. Anything further out?
2. Should the two restaurants by the main pool (Bistro Enrique's, 90 Miles) be named
   in the game?
3. Is there one particular house the game should start at?
