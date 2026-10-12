# Handover: build out the South pool

Written 2026-10-12. For an agent picking this up with no prior context.

## The job

Bring the South pool courtyard up to the standard of the North and Middle pools:
placed on the master map with the right ground, planting and fittings, and walkable
in 3D at `slice.html?pool=south`. Work from the reference photos. Dave (the owner)
knows the place well and judges the result by whether it looks like Villacana.

Done means:

- The south courtyard has its ground laid out (deck, lawn, paths) in the skeleton.
- Its trees, plants and pool fittings are in `data/objects.json`, each with evidence.
- `slice.html?pool=south` loads, the player can walk the courtyard and enter the pool,
  and a "South pool" link exists in `slice.html` and `blueprint.html`.
- `python3 scripts/check_map.py` and `python3 scripts/check_seafront.py` pass.
- A short note of what is confirmed and what is guessed is added to this folder
  (follow `docs/MAIN_POOL.md` as the pattern).

## What this project is

A browser game of Villacana, a residential development on the beach in Estepona,
Spain. Vite, TypeScript, Three.js. Deployed by GitHub Pages on every push to `main`.

- Live master map: https://daveyboyc.github.io/villacana-venture/blueprint.html
- Live walkable view: https://daveyboyc.github.io/villacana-venture/slice.html?pool=north,middle
- Design and decisions so far: `docs/SPEC.md`. Read the sections dated 2026-10-11
  and 2026-10-12 before changing anything.

### How the data flows

1. `scripts/build_skeleton.py` writes `public/map/skeleton.json` and
   `public/map/cover.png` (ground classes: paving, lawn, planting, deck, path).
   Buildings and pools come from the Spanish land registry in `data/catastro/`.
2. `data/objects.json` is the one list of hand-placed things. `data/kinds.json` is
   the fixed vocabulary of kinds.
3. `src/blueprint.ts` (master map) and `src/slice.ts` (3D) only draw that data.
   Never place something in drawing code.

### Coordinates

- Map metres: `x` east, `z` south, origin at lat 36.4552, lon −5.05. This is what
  `objects.json` and `skeleton.json` use.
- "Turned frame": the map rotated 26° so the block is square with the sea at the
  bottom. The `AREAS` table in `build_skeleton.py` and arguments to
  `make_patch.py` use this frame. Street data in `data/street_layout.json` uses
  map metres and includes its source precision.
- South pool centre: map (−89.74, 188.06), turned (−163, 130).

## State of the South pool today

- **Pool outline:** present, from the registry, 68 m², three-lobed clover.
- **Buildings round it:** present, from the registry, with floor counts.
- **Ground:** not laid out. `COURTYARD_POOLS = ("north", "middle")` in
  `build_skeleton.py` deliberately leaves the south pool out, so it only has a plain
  2.25 m deck and whatever the aerial classifier produced. It was left out because
  its lawn is not enclosed: it runs south to the beach paseo instead of to a ring of
  garden walls, so the north/middle rule (lawn out to the house fronts, path at the
  foot of the walls) does not fit.
- **Objects:** none within 35 m.
- **3D:** `slice.html?pool=south` will load, because `slice.ts` accepts any pool id,
  but there is nothing there beyond houses, pool and flat ground, and no link to it.
- **Seafront:** another session added the paseo, beach and sea as
  `skeleton.seafront` (`scripts/build_seafront.py`, `docs/SEAFRONT.md`). The paseo
  passes just south of this courtyard. Do not redraw it; join up to it.

## Reference photos

Dave sent three web photos of the south pool on 2026-10-12, which are now the main
evidence. They carry no position data, so place what they show from the aerial.

**Public, pinned on the map** (`public/photos-ref/`, positions in `manifest.json`):

| File | Shows |
| --- | --- |
| `IMG_2188.jpg` | The south pool from the lawn, looking south to the sea. The only direct view. Shows a tall palm, a house on the east side, the lawn, the sea beyond. |
| `IMG_2185.jpg`, `IMG_2186.jpg`, `IMG_2187.jpg` | The arched covered passage about 30 m north of the pool, looking south through it. |
| `IMG_2184.jpg`, `IMG_2234`–`2236.jpg` | Tiled lanes 50–60 m to the north-east. Style only. |

Phone positions are good to 5–10 m and worse under archways. Compass headings are
reliable.

**Private** (`daveyboyc/villacana-reference`, needs access to that repo):

- `web/south-pool-01-looking-north-palm.jpg`: the pool from the south lawn looking
  north. Shows the pool's shape, a cream stone deck, a tall date palm just north of
  the deck, three life rings, two ladders, a stepped entry with handrails on the east
  side, a white pump box on the west deck, and low white curved walls with clipped
  hedges in front of the patios. Depth mark "150".
- `web/south-pool-02-looking-south-east-sea.jpg`: the pool looking south-east. Shows
  the sea, a low white wall and a dark fence along the seaward edge of the lawn, a
  single tall palm near that edge, a crazy-paving path leaving the deck, and the
  east terrace with wooden and iron balconies, a tiled chimney and parasols.
- `web/south-pool-03-lawn-from-north-west.jpg`: the lawn from further back. Shows a
  curved low white wall crossing the lawn, short green bollard lights, loungers and
  parasols on the grass, and palms round the pool. Has people in it; do not publish.
- `web/easyjet-pool-probably-middle.jpg`: probably the middle pool, not the south.
  Do not use it for this task.
- `apple-maps/03-3d-south-pool-and-promenade.png`: 3D close-up of the south pool,
  its lawn and the paseo. The best single reference for layout.
- `apple-maps/04-top-down-south-half.png`: top-down, middle and south pools.
- `apple-maps/06-top-down-whole-block.png`: whole block.

Apple and Google imagery is for comparing by eye only. Do not trace geometry from
it and do not publish it.

**Dave's labels:** `public/photos-ref/labels.json` is empty. Dave has typed labels on
his phone but has not sent them. If they arrive, they outrank your own reading.

These web photos are not to be copied into the public site.

## How to do it

Set up once (the virtual environment is not in the repo):

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install pillow numpy pillow-heif
```

1. **Lay out the ground.** In `scripts/build_skeleton.py`, give the south pool its
   own treatment. Read the aerial (`public/map/ground.jpg`, toggle "Aerial photo" on
   the master map) for where lawn, deck and paths are. Expect: a stone deck round the
   pool, lawn on all sides, the lawn open to the south, a path linking to the paseo.
   Keep the change scoped to the south pool; the north and middle layouts are
   accepted and must not shift. Rebuild:
   `.venv/bin/python scripts/build_skeleton.py`.
2. **Make a patch pack:**
   `.venv/bin/python scripts/make_patch.py south-pool -163 130 30`
   writes `patches/south-pool/` with a gridded plan, the gridded aerial, the photos
   taken there and a brief (`BRIEF.md`) stating the rules and the output format.
3. **Propose objects.** Copy the three `web/south-pool-*.jpg` files from the private
   reference repo into `patches/south-pool/photos/` (that folder is not committed) and
   list them in the pack's `BRIEF.md` as having no position. Give a subagent only that pack and have it write
   `proposals/south-pool.json`. `proposals/calle-elena.json` is a worked example.
4. **Review.** Give a second, separate subagent the pack and the proposal. It sets
   `verdict` and `reason` on every change. It should reject anything a photo does not
   show or that cannot be placed to about 3 m.
5. **Apply and check:**
   ```bash
   python3 scripts/check_map.py proposals/south-pool.json
   python3 scripts/apply_proposal.py proposals/south-pool.json
   .venv/bin/python scripts/build_skeleton.py
   python3 scripts/check_map.py && python3 scripts/check_seafront.py
   npm run build
   ```
6. **Wire up the view.** Add "South pool" links beside the others in `slice.html`
   (`#areas`) and `blueprint.html`. Check whether `slice.ts` needs anything
   south-specific; `src/main-pool.ts` shows how the main pool added its own pieces
   without disturbing the shared code.
7. **Look at it.** Load `slice.html?pool=south`, use the Overview button, and compare
   against `IMG_2188.jpg` and the Apple 3D shot. Fix what is plainly wrong.
8. **Ship.** Work on a branch and open a pull request; other sessions push to this
   repo, and a direct push to `main` has already collided once. Pages deploys when
   the PR merges.

## Rules that have already been decided

- **Pool position and outline come from the registry and the aerial**, not from
  ground photos, which are taken at an angle. Dave was firm about this.
- **Ground photos say what a thing is; the aerial says where it is.**
- **No glass safety fence** round pools, although the real ones have it.
- **Plants are sprites** (`src/sprites.ts`), painted by code as stand-ins for now.
- **The player can enter pools** (`src/water.ts`).
- **Every object carries evidence**: `photo:IMG_xxxx.jpg`, `aerial`, or `dave:map`.
- **Only kinds in `data/kinds.json`.** A new kind is added there first, then given an
  icon colour there, and a sprite in `sprites.ts` or a case in `addProps` in
  `slice.ts`. Unknown kinds are skipped in 3D, not crashed on.
- **Registry building count is 230 and the pools are 3 small, 1 main, 1 toddler.**
  `check_map.py` fails if either changes.

## Known problems to watch for

- **Registry pool outlines can miss a lobe.** The middle pool's outline omits a
  round shallow lobe that both the aerial and a photo show. Compare the south pool's
  outline with the aerial before trusting it; if it is wrong, raise it with Dave
  before redrawing.
- **The aerial sits about 1 m west of the registry outlines** in places. Shift
  aerial-read positions accordingly.
- **Garden walls and gateways are generated by rule** and are not real positions.
  They exist only for the north and middle courtyards.
- **The waterline in `skeleton.seafront` is OpenStreetMap's coastline**, which sits
  roughly 30–40 m inland of where the waves break in the aerial. Not yours to fix,
  but do not anchor anything to it.
- **Headless screenshots of the 3D view are slow** (software rendering, about a
  minute per frame) and cannot stand in for trying it on a phone. Say plainly what
  you checked and what you did not.
- **Dave works from an iPhone.** Keep replies short, and put anything he needs to
  look at on the live site.

## Open questions for Dave

Dave has answered two of the earlier questions:

- **Shape:** take it from the map. The registry outline stands; check it against the
  aerial as for any pool.
- **Seaward edge:** the web photos show a low white wall and a fence between the
  lawn and the paseo, so the lawn is not open to it.

- **Gate to the paseo:** there is no longer one. The wall and fence run unbroken, so
  the south lawn has no direct way through to the paseo. Do not add a gate or path
  there, and do not let the player walk through.

No questions are open.
