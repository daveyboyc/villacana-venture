#!/usr/bin/env python3
"""Check the map data for mistakes. Exits non-zero if any check fails.

  python3 scripts/check_map.py                       check data/objects.json
  python3 scripts/check_map.py proposals/x.json      also check a proposal's changes

Run scripts/build_skeleton.py first if buildings or pools may have changed.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_POOLS = {"small": 3, "main": 1, "toddler": 1}
EXPECTED_BUILDINGS = 230
POOL_EDGE = 2.5  # how far from the water a pool fitting may stand


def inside(x: float, z: float, ring: list) -> bool:
    hit = False
    for i in range(len(ring)):
        (ax, az), (bx, bz) = ring[i], ring[(i + 1) % len(ring)]
        if (az > z) != (bz > z) and x < (bx - ax) * (z - az) / (bz - az) + ax:
            hit = not hit
    return hit


def edge_distance(x: float, z: float, ring: list) -> float:
    best = math.inf
    for i in range(len(ring)):
        (ax, az), (bx, bz) = ring[i], ring[(i + 1) % len(ring)]
        dx, dz = bx - ax, bz - az
        t = max(0.0, min(1.0, ((x - ax) * dx + (z - az) * dz) / ((dx * dx + dz * dz) or 1)))
        best = min(best, math.hypot(x - ax - t * dx, z - az - t * dz))
    return best


def check_object(o: dict, kinds: dict, skeleton: dict) -> list[str]:
    problems = []
    kind = kinds.get(o.get("kind"))
    if not kind:
        return [f"unknown kind '{o.get('kind')}' (the vocabulary is data/kinds.json)"]
    if not o.get("evidence"):
        problems.append("no evidence recorded")
    x, z = o.get("x"), o.get("z")
    if not isinstance(x, (int, float)) or not isinstance(z, (int, float)):
        return problems + ["no position"]
    if not inside(x, z, skeleton["area"]):
        problems.append("outside the mapped area")
    if not kind.get("indoors"):
        for b in skeleton["buildings"]:
            if b["floors"] > 0 and inside(x, z, b["ring"]) and not any(inside(x, z, h) for h in b.get("holes", [])):
                problems.append(f"inside house {b['id']}")
                break
    in_pool = next((p for p in skeleton["pools"] if inside(x, z, p["ring"])), None)
    if kind.get("inPool"):
        if min(edge_distance(x, z, p["ring"]) for p in skeleton["pools"]) > POOL_EDGE and not in_pool:
            problems.append("a pool fitting, but not at a pool")
    elif in_pool:
        problems.append(f"in the water of the {in_pool['id']} pool")
    return problems


def main() -> None:
    kinds = json.loads((ROOT / "data" / "kinds.json").read_text())
    skeleton = json.loads((ROOT / "public" / "map" / "skeleton.json").read_text())
    objects = json.loads((ROOT / "data" / "objects.json").read_text())
    failures = []

    counts: dict[str, int] = {}
    for p in skeleton["pools"]:
        counts[p["kind"]] = counts.get(p["kind"], 0) + 1
    if counts != EXPECTED_POOLS:
        failures.append(f"pools: expected {EXPECTED_POOLS}, found {counts}")
    if len(skeleton["buildings"]) != EXPECTED_BUILDINGS:
        failures.append(f"buildings: expected {EXPECTED_BUILDINGS} from the registry, found {len(skeleton['buildings'])}")

    ids = [o.get("id") for o in objects]
    for dup in sorted({i for i in ids if ids.count(i) > 1}):
        failures.append(f"object id {dup} is used more than once")
    for o in objects:
        for problem in check_object(o, kinds, skeleton):
            failures.append(f"object {o.get('id')} ({o.get('kind')}): {problem}")

    if len(sys.argv) > 1:
        proposal = json.loads(Path(sys.argv[1]).read_text())
        known = set(ids)
        for n, c in enumerate(proposal["changes"], 1):
            where = f"proposal change {n} ({c.get('op')} {c.get('kind', c.get('id', ''))})"
            if c.get("op") not in ("add", "move", "remove"):
                failures.append(f"{where}: op must be add, move or remove")
                continue
            if not c.get("evidence"):
                failures.append(f"{where}: no evidence")
            if c["op"] in ("move", "remove") and c.get("id") not in known:
                failures.append(f"{where}: no such object")
            if c["op"] == "add":
                failures += [f"{where}: {p}" for p in check_object(c, kinds, skeleton)]
            if c["op"] == "move":
                current = next((o for o in objects if o["id"] == c.get("id")), None)
                if current:
                    failures += [f"{where}: {p}" for p in check_object({**current, "x": c.get("x"), "z": c.get("z")}, kinds, skeleton)]

    for line in failures:
        print("FAIL", line)
    print(f"{len(objects)} objects checked, {len(failures)} problem{'s' if len(failures) != 1 else ''}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
