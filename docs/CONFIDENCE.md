# How sure is the model? (the "Sure / unsure" overlay)

Every modelled feature has a level saying how sure the model is about it, judged for the game.
The levels are about whether a feature looks right in the game. They are separate from the strict
measured placement approval in [PLACEMENT_VERIFICATION.md](PLACEMENT_VERIFICATION.md), which is
still the only thing that grants placement approval.

| Colour | Level | Meaning |
| --- | --- | --- |
| Green | photographed | Clearly photographed: what it is and how it fits its neighbours is clear. Sizes and exact map position can still be off by up to about a metre. |
| Amber | estimated | Seen in photos, but only partly (one angle, cropped, distant, behind planting): shape, size or extent estimated. |
| Orange | inferred | Not seen directly: built from the aerial, the levels survey or what must be there. |
| Blue | registry | Official land-registry house or pool footprint. The outline is reliable; the whole map sits about 1-1.5 m off the laser survey. |
| Red "?" | gap | Known gap: visibly there in photos or the aerial, but not modelled yet. |

## Using it

- On **Map & photos** or in **Overview**, press **Sure / unsure** (or add `?confidence=1` to the
  link). Outlines appear in their colours with a legend; untick a level to hide it.
- Tap an outline or a "?" to see why it has that level, which photos it was built from, and two
  buttons:
  - **Good enough**: no more work is wanted. The outline fades.
  - **Needs photos**: worth improving. The outline turns dashed.

  The decisions are saved in that browser. **Export my decisions** downloads them. Give the file
  to an agent to record in `data/confidence.json`, so everyone sees them.
- A red dotted ring means a check disagrees: an open placement discrepancy, or a photo check that
  found it differs.
- The area scorecard (`refs/SCORECARD.md` and the in-game panel) counts each level per area.

## Where the levels come from

`scripts/build_confidence.py` writes `public/confidence.json` from the shared feature inventory
(`scripts/assign_photo_map.py`) and `data/confidence.json`. `build_references.py` runs it, and
`scripts/test_confidence.py` (run in CI with the reference index tests) fails when the file is stale.

- Defaults:
  - Registry houses and pools are blue.
  - Mapped streets, car parks and seafront areas are amber.
  - An authored feature is amber if it cites a photo and orange if it cites none.
- `data/confidence.json` `features` overrides a level with a one-line `why`. It also records the
  owner's `decision` (`accepted` or `needs-photos`) with an optional `note`.
- `gaps` lists known missing things, each with a place, its photos and why it is missing.

The first grading (27 October 2026) was made by Claude from each feature's own recorded trust
note:

- **Green:** the arrangement is clear in good photos and only sizes are estimated.
- **Orange:** the note says the thing itself is not confirmed. Examples: a provisional enclosure,
  a pergola of which only one beam shows, a wall whose position is guessed.
- **Amber:** everything else.

Change any of them by editing `data/confidence.json` and rebuilding.

## For agents

When you build or change a feature, set or update its level and `why` in `data/confidence.json`.

Structure that is plainly there, but only partly visible or seen only on the aerial, may be built
as **inferred** (orange) rather than left out. Examples are a wall line, a patio floor or a door in
a wall. Say what was guessed in its `trust`, and never grade it photographed.

Do not use inferred building to fill an area with repeated walls or gates. Anything left out goes
in `gaps`.

Respect the owner's decisions: leave `accepted` features alone unless asked, and prefer
`needs-photos` features when new photos arrive.
