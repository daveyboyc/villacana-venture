#!/usr/bin/env python3
"""Index reference photos so they can be pinned on the master map.

Reads every photo in a folder, takes where it was shot and which way the
camera pointed from the photo's own location data, and writes:

  <out>/manifest.json   one entry per photo: position in map metres, heading, date
  <out>/<name>.jpg      a web-sized copy with all embedded data removed

Photos without location data (screenshots, pictures sent through a chat app)
are listed too, with no position, unless data/photo_positions.json gives one.

  .venv/bin/python scripts/index_photos.py ../villacana-reference/photos public/photos-ref
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageOps

try:  # iPhone originals are HEIC.
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:
    pass

ROOT = Path(__file__).resolve().parents[1]
MANUAL = ROOT / "data" / "photo_positions.json"

LAT0 = 36.4552
LON0 = -5.0500
R_EARTH = 6_378_137.0
WEB_EDGE = 1600


def project(lat: float, lon: float) -> tuple[float, float]:
    x = math.radians(lon - LON0) * R_EARTH * math.cos(math.radians(LAT0))
    z = -math.radians(lat - LAT0) * R_EARTH
    return (x, z)


def degrees(value, ref: str) -> float:
    d, m, s = (float(v) for v in value)
    out = d + m / 60 + s / 3600
    return -out if ref in ("S", "W") else out


def main() -> None:
    source = Path(sys.argv[1])
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    manual = json.loads(MANUAL.read_text()) if MANUAL.exists() else {}
    entries = []
    for path in sorted(source.iterdir()):
        if path.suffix.lower() not in (".jpg", ".jpeg", ".png", ".heic"):
            continue
        image = Image.open(path)
        exif = image.getexif()
        gps = exif.get_ifd(0x8825) if exif else {}
        entry: dict = {"file": f"{path.stem}.jpg", "title": path.stem.replace("-", " "), "trust": "unplaced"}
        if 2 in gps and 4 in gps:
            x, z = project(degrees(gps[2], gps.get(1, "N")), degrees(gps[4], gps.get(3, "E")))
            entry.update(x=round(x, 1), z=round(z, 1), trust="phone location")
            if 17 in gps:
                entry["heading"] = round(float(gps[17]))
        if path.name in manual:
            entry.update(manual[path.name])
        taken = exif.get_ifd(0x8769).get(0x9003) if exif else None
        if taken:
            entry["taken"] = str(taken)[:10].replace(":", "-")
        web = ImageOps.exif_transpose(image).convert("RGB")
        web.thumbnail((WEB_EDGE, WEB_EDGE))
        web.save(out / entry["file"], quality=82)
        entries.append(entry)
    (out / "manifest.json").write_text(json.dumps(entries, indent=1))
    placed = sum(1 for e in entries if "x" in e)
    print(f"{len(entries)} photos, {placed} placed, {len(entries) - placed} without a position")


if __name__ == "__main__":
    main()
