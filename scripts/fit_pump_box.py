#!/usr/bin/env python3
"""Fit the north pool's pump box (o4) to its visible corners in the solved IMG_2205 and IMG_2204 cameras.

A box of the model's size (1.1 by 0.9 m, 0.57 m high, on the 0.82 m deck) is fitted by its centre
and turn (degrees anticlockwise seen from above, as `turn` in data/objects.json); each picked
corner is matched to the nearest projected corner of the same level. Prints the fit and each
corner's miss in pixels, and the committed o4's misses for comparison.

  python3 scripts/fit_pump_box.py

Picks are full-size pixels (public/photos-ref, 1600 by 1200). In IMG_2205 the right base corner is
hidden behind a glass panel's edge, so only the left and front base corners are used there.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import minimize

sys.path.insert(0, str(Path(__file__).resolve().parent))
from photo_pose import project  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DECK, HEIGHT, LONG, SHORT = 0.82, 0.57, 1.1, 0.9
# (pixel, level): level 0 is a base corner on the deck, 1 a top corner.
PICKS = {
    "IMG_2205.jpg": [((591, 805), 0), ((629, 826), 0), ((593, 769), 1), ((630, 790), 1), ((686, 779), 1)],
    "IMG_2204.jpg": [((1243, 781), 1), ((1280, 816), 1), ((1342, 808), 1)],
}


def corners(cx, cz, turn):
    """The footprint's corners; three.js rotation.y = turn maps local x to (cos, -sin)."""
    c, s = math.cos(turn), math.sin(turn)
    return [(cx + u * c + v * s, cz - u * s + v * c) for u, v in [(-LONG / 2, -SHORT / 2), (LONG / 2, -SHORT / 2), (LONG / 2, SHORT / 2), (-LONG / 2, SHORT / 2)]]


def misses(poses, x):
    cx, cz, turn = x
    out = []
    for photo, picks in PICKS.items():
        record = poses[photo]
        for pixel, level in picks:
            pts = np.array([[px, DECK + HEIGHT * level, pz] for px, pz in corners(cx, cz, turn)])
            uv, _ = project(record["solved"]["pose"], record["image"], pts)
            out.append((photo, pixel, float(np.min(np.hypot(*(uv - pixel).T)))))
    return out


def main():
    poses = json.loads((ROOT / "data/photo_poses.json").read_text())["photos"]
    cost = lambda x: sum(m[2] ** 2 for m in misses(poses, x))
    best = min((minimize(cost, [-171.3, 19.6, math.radians(t0)], method="Nelder-Mead") for t0 in range(0, 90, 10)), key=lambda r: r.fun)
    cx, cz, turn = best.x
    print(f"fit: centre ({cx:.2f}, {cz:.2f}), turn {math.degrees(turn) % 90:.1f} degrees")
    for photo, pixel, d in misses(poses, best.x):
        print(f"  {photo} {pixel}: {d:.1f} px")
    o4 = next(o for o in json.loads((ROOT / "public/map/skeleton.json").read_text())["props"] if o["id"] == "o4")
    now = misses(poses, [o4["x"], o4["z"], math.radians(o4.get("turn", 0))])
    print(f"committed o4 ({o4['x']}, {o4['z']}, turn {o4.get('turn', 0)}): " + ", ".join(f"{d:.1f}" for _, _, d in now) + " px")


if __name__ == "__main__":
    main()
