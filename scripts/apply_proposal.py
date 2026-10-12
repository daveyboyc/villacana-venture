#!/usr/bin/env python3
"""Apply the accepted changes of a reviewed proposal to data/objects.json.

A proposal is written by one agent and reviewed by another, which sets a
"verdict" of "accept" or "reject" (with a "reason") on every change. Only
accepted changes are applied; a change with no verdict stops the run.

  python3 scripts/apply_proposal.py proposals/calle-elena.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

OBJECTS = Path(__file__).resolve().parents[1] / "data" / "objects.json"


def main() -> None:
    path = Path(sys.argv[1])
    proposal = json.loads(path.read_text())
    unreviewed = [n for n, c in enumerate(proposal["changes"], 1) if c.get("verdict") not in ("accept", "reject")]
    if unreviewed:
        sys.exit(f"Changes {unreviewed} have no verdict. A proposal must be reviewed before it is applied.")
    objects = json.loads(OBJECTS.read_text())
    taken = {o["id"] for o in objects}
    applied = 0
    for n, c in enumerate(proposal["changes"], 1):
        if c["verdict"] != "accept":
            continue
        if c["op"] == "add":
            ident = f"{proposal['patch']}-{n}"
            if ident in taken:
                continue
            entry = {"id": ident, "kind": c["kind"], "x": round(c["x"], 2), "z": round(c["z"], 2), "evidence": c["evidence"]}
            if c.get("note"):
                entry["note"] = c["note"]
            objects.append(entry)
        elif c["op"] == "move":
            for o in objects:
                if o["id"] == c["id"]:
                    o.update(x=round(c["x"], 2), z=round(c["z"], 2), evidence=c["evidence"])
        elif c["op"] == "remove":
            objects = [o for o in objects if o["id"] != c["id"]]
        applied += 1
    OBJECTS.write_text("[\n" + ",\n".join(" " + json.dumps(o, ensure_ascii=False) for o in objects) + "\n]\n")
    rejected = sum(1 for c in proposal["changes"] if c["verdict"] == "reject")
    print(f"applied {applied}, rejected {rejected}; {len(objects)} objects now")


if __name__ == "__main__":
    main()
