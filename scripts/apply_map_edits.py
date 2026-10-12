#!/usr/bin/env python3
"""Apply edits made on the master map to data/objects.json.

The map's edit mode produces a small JSON document of changes:
  {"added": [{id, kind, x, z}], "moved": {id: [x, z]}, "removed": [id],
   "labels": {photo file: text}}

  python3 scripts/apply_map_edits.py edits.json     (or pipe it on stdin)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

OBJECTS = Path(__file__).resolve().parents[1] / "data" / "objects.json"
LABELS = Path(__file__).resolve().parents[1] / "public" / "photos-ref" / "labels.json"


def main() -> None:
    edits = json.loads(Path(sys.argv[1]).read_text() if len(sys.argv) > 1 else sys.stdin.read())
    objects = json.loads(OBJECTS.read_text())
    known = {o["id"] for o in objects}
    removed = set(edits.get("removed", []))
    objects = [o for o in objects if o["id"] not in removed]
    moved = 0
    for o in objects:
        if o["id"] in edits.get("moved", {}):
            o["x"], o["z"] = (round(v, 2) for v in edits["moved"][o["id"]])
            o["evidence"] = "dave:map"
            moved += 1
    added = [a for a in edits.get("added", []) if a["id"] not in known and a["id"] not in removed]
    for a in added:
        objects.append({"id": a["id"], "kind": a["kind"], "x": round(a["x"], 2), "z": round(a["z"], 2), "evidence": "dave:map"})
    OBJECTS.write_text("[\n" + ",\n".join(" " + json.dumps(o) for o in objects) + "\n]\n")
    labels = json.loads(LABELS.read_text())
    for name, text in edits.get("labels", {}).items():
        if text:
            labels[name] = text
        else:
            labels.pop(name, None)
    LABELS.write_text(json.dumps(labels, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    print(f"{len(edits.get('labels', {}))} photo labels changed; {len(labels)} labelled now")
    print(f"added {len(added)}, moved {moved}, removed {len(removed & known)}; {len(objects)} objects now")


if __name__ == "__main__":
    main()
