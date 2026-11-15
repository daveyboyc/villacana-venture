#!/usr/bin/env python3
"""Measure a pool's water edge through the solved photo cameras, against the registry ring and the
corrected ring (data/pool_ring_corrections.json), for the measured-approval packet.

Pixels picked on the coping's water edge (the top of the bullnose over the water) are cast through
each solved camera (data/photo_poses.json) onto the deck level (data/terrain.json decks) and
compared with the drawn water ring: the registry ring as build_skeleton.py rounds it, and the same
ring with the corrections applied. Picks are grouped by role:

  fit        used to place the corrected vertices
  held-out   on the corrected edges, picked afterwards and not used to place them
  unchanged  on edges the correction leaves alone (each camera's own agreement with the registry)
  excluded   seen but not modelled (the ladder recess in the south-west tongue)

  python3 scripts/measure_pool_ring.py            report
  python3 scripts/measure_pool_ring.py --write    also write the report and overlays to
                                                  docs/reviews/pool-deck-outline/

The tolerance is Dave's measured approval (docs/PLACEMENT_VERIFICATION.md): 0.3 m rms on the
changed edges with at least two solved cameras, held-out points reported separately. The three
station cameras (IMG_2204-2206) share one position but are solved separately; they disagree by
about 0.25 m from one to the next in z, so per-camera residuals are reported as well as the total.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from photo_pose import project, rotation  # noqa: E402
import build_skeleton  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/reviews/pool-deck-outline"

# Coping water-edge picks, full-size pixels, picked on 4-6x zooms with a 10 px grid.
PICKS = {
    "north": {
        "IMG_2205.jpg": {
            "fit": {
                "east tongue corner": [[404.25, 820], [409, 826]],
                "east tongue north end": [[550, 739.5], [557.5, 741]],
                "ladder pocket": [[586, 724], [589, 733], [560, 742]],
                "south-west tongue": [[137, 896.25], [107.5, 895], [130, 907.5], [110, 927.5], [96, 940]],
            },
            "held-out": {
                "east tongue edge": [[450, 796.25], [500, 767.5], [530, 751.25]],
                "south-west tongue north edge": [[82.5, 897.5]],
            },
            "unchanged": {
                "north lobe": [[480, 698], [520, 703], [550, 708], [570, 713]],
                "south lobe by the east tongue": [[450, 832.5], [477.5, 842.5], [495, 852.5]],
                "south lobe by the south-west tongue": [[93.75, 960], [100, 980], [115, 997.5]],
            },
            "excluded": {},
        },
        "IMG_2204.jpg": {
            "fit": {
                "east tongue corner": [[1046.25, 796.25], [1051.25, 802.5]],
                "east tongue north end": [[1200, 742.5], [1210, 747]],
                "ladder pocket": [[1236.7, 730], [1243, 738], [1240.8, 743.3], [1210, 747.5]],
                "south-west tongue": [[817, 817], [798, 810], [812, 823], [802, 836], [788, 844], [781, 854], [688, 828], [713, 811], [738, 794], [754, 802]],
            },
            "held-out": {
                "east tongue edge": [[1095, 775], [1145, 758.75], [1180, 747.5]],
                "south-west tongue north edge": [[770, 809]],
            },
            "unchanged": {
                "north lobe": [[1150, 695], [1180, 702.5], [1200, 710], [1220, 718]],
                "south lobe by the east tongue": [[1100, 820], [1130, 840]],
                "south lobe by the south-west tongue": [[780, 866], [783, 880], [790, 894]],
            },
            "excluded": {},
        },
        "IMG_2206.jpg": {
            "fit": {
                "south-west tongue": [[1551.25, 907.5], [1520, 895], [1470, 871], [1380, 887.5], [1440, 860], [1530, 918.75], [1505, 928.75], [1495, 935], [1493.75, 945]],
            },
            "held-out": {
                "south-west tongue north edge": [[1491.7, 883]],
            },
            "unchanged": {},
            "excluded": {"ladder recess": [[1512.5, 897.5]]},
        },
    }
}


def cast(record: dict, pixels, level: float) -> np.ndarray:
    pose, (w, h) = record["solved"]["pose"], record["image"]
    r = rotation(pose["yaw"], pose["pitch"], pose["roll"])
    eye = np.array([pose["x"], pose["y"], pose["z"]])
    out = []
    for u, v in pixels:
        ray = r @ np.array([(u - w / 2) / pose["f"], -(v - h / 2) / pose["f"], -1.0])
        hit = eye + ray * (level - eye[1]) / ray[1]
        out.append([hit[0], hit[2]])
    return np.array(out)


def to_ring(points: np.ndarray, ring) -> np.ndarray:
    """Distance from each point to the closed ring's outline."""
    r = np.asarray(ring, float)
    a, b = r, np.roll(r, -1, 0)
    ab = b - a
    t = np.clip((((points[:, None, :] - a[None]) * ab[None]).sum(-1)) / np.maximum((ab * ab).sum(-1), 1e-12)[None], 0, 1)
    near = a[None] + t[..., None] * ab[None]
    return np.sqrt(((points[:, None, :] - near) ** 2).sum(-1)).min(1)


def rings(pool_id: str):
    """The registry ring as drawn before the correction, and the corrected ring."""
    raw = next(r for r in registry_rings() if r[0] == pool_id)[1]
    corrected, hard = build_skeleton.correct_pool_ring(pool_id, raw)
    return build_skeleton.smooth_ring(raw), build_skeleton.smooth_ring(corrected, hard=hard)


def registry_rings():
    found = []
    for item in build_skeleton.read_features("otherconstruction.gml.gz", "OtherConstruction"):
        found.append(item["rings"][0])
    out = []
    skeleton = json.loads((ROOT / "public/map/skeleton.json").read_text())
    for pool in skeleton["pools"]:
        best = min(found, key=lambda ring: math.dist(build_skeleton.centroid(ring), pool["centre"]))
        out.append((pool["id"], [tuple(p) for p in best]))
    return out


def stats(r) -> dict:
    r = np.asarray(r, float)
    return {"n": int(len(r)), "rms": round(float(np.sqrt((r ** 2).mean())), 3) if len(r) else None, "worst": round(float(r.max()), 3) if len(r) else None}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    poses = json.loads((ROOT / "data/photo_poses.json").read_text())["photos"]
    levels = json.loads((ROOT / "data/terrain.json").read_text())["decks"]
    report = {"about": "Coping water-edge picks cast through the solved cameras onto the deck level; distances in metres to the registry ring (before) and the corrected ring (after). Written by scripts/measure_pool_ring.py.", "pools": {}}
    for pool_id, photos in PICKS.items():
        old, new = rings(pool_id)
        rows, by = [], {}
        for photo, roles in photos.items():
            for role, groups in roles.items():
                for label, pixels in groups.items():
                    pts = cast(poses[photo], pixels, levels[pool_id])
                    before, after = to_ring(pts, old), to_ring(pts, new)
                    for px, p, b, a in zip(pixels, pts, before, after):
                        rows.append({"photo": photo, "role": role, "label": label, "pixel": px, "point": [round(float(p[0]), 2), round(float(p[1]), 2)], "before": round(float(b), 3), "after": round(float(a), 3)})
                        by.setdefault((role, photo), []).append((b, a))
                        by.setdefault((role, "all"), []).append((b, a))
        summary = {}
        for (role, photo), pairs in sorted(by.items()):
            b, a = zip(*pairs)
            summary.setdefault(role, {})[photo] = {"before": stats(b), "after": stats(a)}
        report["pools"][pool_id] = {"level": levels[pool_id], "summary": summary, "picks": rows}
        print(f"{pool_id} pool water edge (deck level {levels[pool_id]} m): distance to the ring, before -> after")
        for role in ("fit", "held-out", "unchanged", "excluded"):
            for photo, s in summary.get(role, {}).items():
                print(f"  {role:9s} {photo:12s} n={s['after']['n']:2d}  rms {s['before']['rms']:.2f} -> {s['after']['rms']:.2f} m, worst {s['before']['worst']:.2f} -> {s['after']['worst']:.2f} m")
        if args.write:
            OUT.mkdir(parents=True, exist_ok=True)
            for photo in photos:
                overlay(photo, poses[photo], levels[pool_id], old, new, [r for r in rows if r["photo"] == photo])
    if args.write:
        (OUT / "ring-residuals.json").write_text(json.dumps(report, indent=1) + "\n")
        print(f"wrote {OUT.relative_to(ROOT)}/ring-residuals.json and the overlays")


COLOURS = {"fit": (255, 0, 255), "held-out": (0, 230, 255), "unchanged": (60, 255, 60), "excluded": (255, 140, 0)}


def overlay(photo: str, record: dict, level: float, old, new, rows) -> None:
    """The photo with the registry ring (red) and corrected ring (yellow) drawn at deck level, and the picks."""
    source = ROOT / "public/photos-ref" / photo
    source = source if source.is_file() else None
    if not source:
        print(f"  {photo}: full-size photo not found, overlay skipped")
        return
    image = Image.open(source).convert("RGB")
    size = record["image"]
    draw = ImageDraw.Draw(image)
    for ring, colour in ((old, (255, 40, 40)), (new, (255, 230, 0))):
        pts = np.array([[x, level, z] for x, z in list(ring) + [ring[0]]])
        px, depth = project(record["solved"]["pose"], size, pts)
        draw.line([tuple(p) for p in px], fill=colour, width=2)
    for r in rows:
        u, v = r["pixel"]
        c = COLOURS[r["role"]]
        draw.ellipse([u - 4, v - 4, u + 4, v + 4], outline=c, width=2)
    draw.text((12, 12), f"{photo}: registry ring red, corrected ring yellow (deck level {level} m); picks: fit magenta, held-out cyan, unchanged green, excluded orange", fill=(255, 255, 255))
    image.save(OUT / f"ring-{Path(photo).stem}.jpg", quality=88)


if __name__ == "__main__":
    main()
