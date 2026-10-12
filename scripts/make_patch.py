#!/usr/bin/env python3
"""Make a self-contained pack for one small patch of the map.

An agent adding detail works from the pack alone: two gridded pictures of the
patch, the photos taken there, what is already mapped, and a brief.

  .venv/bin/python scripts/make_patch.py calle-elena -155 -36 28

The centre is given in the turned frame used on the master map (block square,
sea at the bottom); the radius is in metres. Output goes to patches/<name>/.
"""

from __future__ import annotations

import json
import math
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SCALE = 18  # pixels per metre


def main() -> None:
    name, tx, tz, radius = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
    skeleton = json.loads((ROOT / "public/map/skeleton.json").read_text())
    ground = json.loads((ROOT / "public/map/ground.json").read_text())
    kinds = json.loads((ROOT / "data/kinds.json").read_text())
    objects = json.loads((ROOT / "data/objects.json").read_text())
    photos = json.loads((ROOT / "public/photos-ref/manifest.json").read_text())
    labels = json.loads((ROOT / "public/photos-ref/labels.json").read_text())

    a = math.radians(-skeleton["viewRotation"])
    cx = tx * math.cos(a) - tz * math.sin(a)
    cz = tx * math.sin(a) + tz * math.cos(a)
    x0, z0 = cx - radius, cz - radius
    size = int(radius * 2 * SCALE)
    out = ROOT / "patches" / name
    shutil.rmtree(out, ignore_errors=True)
    (out / "photos").mkdir(parents=True)

    def at(x: float, z: float) -> tuple[float, float]:
        return ((x - x0) * SCALE, (z - z0) * SCALE)

    def near(x: float, z: float, extra: float = 0.0) -> bool:
        return abs(x - cx) <= radius + extra and abs(z - cz) <= radius + extra

    def grid(draw: ImageDraw.ImageDraw, colour: tuple) -> None:
        for v in range(math.ceil(x0 / 2) * 2, int(x0 + radius * 2) + 1, 2):
            bold = v % 10 == 0
            draw.line([at(v, z0), at(v, z0 + radius * 2)], fill=colour if bold else colour[:3] + (70,), width=2 if bold else 1)
            if bold:
                draw.text((at(v, z0)[0] + 3, 3), f"x={v}", fill=(255, 255, 0))
        for v in range(math.ceil(z0 / 2) * 2, int(z0 + radius * 2) + 1, 2):
            bold = v % 10 == 0
            draw.line([at(x0, v), at(x0 + radius * 2, v)], fill=colour if bold else colour[:3] + (70,), width=2 if bold else 1)
            if bold:
                draw.text((3, at(x0, v)[1] + 3), f"z={v}", fill=(255, 255, 0))

    # Picture 1: the aerial photo.
    aerial = Image.open(ROOT / "public/map/ground.jpg").convert("RGB")
    per = aerial.width / (ground["maxX"] - ground["minX"])
    box = tuple(int(v) for v in ((x0 - ground["minX"]) * per, (z0 - ground["minZ"]) * per, (x0 + radius * 2 - ground["minX"]) * per, (z0 + radius * 2 - ground["minZ"]) * per))
    picture = aerial.crop(box).resize((size, size), Image.LANCZOS).convert("RGBA")
    layer = Image.new("RGBA", picture.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    grid(draw, (255, 255, 255, 200))
    for b in skeleton["buildings"]:
        if b["floors"] > 0 and any(near(*p, 5) for p in b["ring"]):
            pts = [at(*p) for p in b["ring"]]
            draw.line(pts + [pts[0]], fill=(255, 0, 255, 255), width=2)
    Image.alpha_composite(picture, layer).convert("RGB").save(out / "aerial.jpg", quality=88)

    # Picture 2: what is mapped, with the photo positions.
    plan = Image.new("RGBA", (size, size), (201, 160, 122, 255))
    draw = ImageDraw.Draw(plan, "RGBA")
    for b in skeleton["buildings"]:
        if any(near(*p, 5) for p in b["ring"]):
            draw.polygon([at(*p) for p in b["ring"]], fill=(247, 243, 234, 255) if b["floors"] else (217, 168, 135, 255), outline=(90, 80, 70, 255))
    for p in skeleton["pools"]:
        draw.polygon([at(*q) for q in p["ring"]], fill=(79, 195, 232, 255))
    for x, z in skeleton["gardenWalls"]:
        u, v = at(x, z)
        draw.ellipse((u - 3, v - 3, u + 3, v + 3), fill=(255, 255, 255, 255), outline=(120, 110, 100, 255))
    grid(draw, (60, 60, 60, 160))
    here = [o for o in objects if near(o["x"], o["z"])]
    for o in here:
        u, v = at(o["x"], o["z"])
        r = kinds[o["kind"]]["r"] * SCALE
        draw.ellipse((u - r, v - r, u + r, v + r), outline=(20, 110, 40, 255), width=3)
        draw.text((u + 4, v - 6), f"{o['id']} {o['kind']}", fill=(0, 70, 20, 255))
    taken = [p for p in photos if "x" in p and near(p["x"], p["z"])]
    for n, p in enumerate(taken, 1):
        u, v = at(p["x"], p["z"])
        h = math.radians(p["heading"] - 90)
        draw.line([(u, v), (u + math.cos(h) * 70, v + math.sin(h) * 70)], fill=(214, 51, 108, 255), width=3)
        draw.ellipse((u - 9, v - 9, u + 9, v + 9), fill=(214, 51, 108, 255))
        draw.text((u - 6, v - 6), str(n), fill=(255, 255, 255, 255))
        picture = Image.open(ROOT / "public/photos-ref" / p["file"])
        picture.thumbnail((1100, 1100))
        picture.save(out / "photos" / f"{n:02d}_{p['file']}", quality=80)
    plan.convert("RGB").save(out / "plan.png")

    lines = [
        f"# Patch: {name}",
        "",
        "You are adding detail to one small patch of a map of Villacana, a residential",
        "development in Estepona, Spain. Work only from the files in this folder.",
        "",
        "## Files",
        "- `plan.png`: what is mapped now. White shapes are houses, tan shapes are yards,",
        "  blue is pool, white dots are garden walls (generated, unreliable). Green rings are",
        "  objects already placed, with their ids. Numbered pink dots are where photos were",
        "  taken; the line shows which way each camera pointed.",
        "- `aerial.jpg`: the aerial photo of the same square, house outlines in magenta.",
        "- `photos/NN_*.jpg`: the photos, numbered as on the plan.",
        "",
        "Both pictures share one grid: map metres, x increasing east (right), z increasing",
        f"south (down), north at the top. Thin lines every 2 m, labelled lines every 10 m. The square covers x {x0:.0f} to {x0 + radius * 2:.0f}, z {z0:.0f} to {z0 + radius * 2:.0f}.",
        "",
        "## Rules",
        "1. House outlines and pool outlines are surveyed. Never contradict them.",
        "2. Photo positions come from a phone and can be 5 to 10 m out, worse under",
        "   archways. Compass directions are reliable. Use what a photo shows to correct",
        "   your idea of where it was taken.",
        "3. A photo tells you WHAT is there. Take WHERE from the aerial photo and the house",
        "   outlines. If you cannot place something to within about 3 m, leave it out.",
        "4. Only use the kinds listed below. If something does not fit, leave it out and",
        "   mention it in `notes`.",
        "5. Do not put anything inside a house outline unless its kind says it may be, and",
        "   nothing in pool water except pool fittings.",
        "6. Do not re-add an object that is already on the plan.",
        "",
        "## Kinds",
    ]
    for kind, k in kinds.items():
        lines.append(f"- `{kind}`: {k['means']}." + (" May be inside a house outline." if k.get("indoors") else ""))
    lines += ["", "## Photos in this patch"]
    for n, p in enumerate(taken, 1):
        label = labels.get(p["file"])
        lines.append(f"- {n:02d} `{p['file']}` at x={p['x']}, z={p['z']}, facing {p['heading']}° (0 is north, 90 east)" + (f". Dave's label: {label}" if label else ""))
    lines += ["", "## Already mapped here"]
    lines += [f"- {o['id']}: {o['kind']} at x={o['x']}, z={o['z']}" for o in here] or ["- nothing"]
    lines += [
        "",
        "## What to write",
        f"Write `proposals/{name}.json` in the repository root, in this shape:",
        "",
        "```json",
        "{",
        f'  "patch": "{name}",',
        '  "changes": [',
        '    {"op": "add", "kind": "bench", "x": -150.5, "z": 30.0,',
        '     "evidence": "photo:IMG_2231.jpg", "confidence": "high",',
        '     "note": "white bench on the lawn, left of the path"}',
        "  ],",
        '  "notes": "anything that did not fit the kinds, or that looks wrong on the map"',
        "}",
        "```",
        "",
        "`op` is `add`, `move` (give `id`, `x`, `z`) or `remove` (give `id`). `evidence` names",
        "the photo file, or `aerial`. `confidence` is `high`, `medium` or `low`. Fewer,",
        "well-supported changes are better than many uncertain ones.",
    ]
    (out / "BRIEF.md").write_text("\n".join(lines) + "\n")
    print(f"patches/{name}: {len(taken)} photos, {len(here)} objects already mapped")


if __name__ == "__main__":
    main()
