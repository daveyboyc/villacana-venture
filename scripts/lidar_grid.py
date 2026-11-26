#!/usr/bin/env python3
"""Print the laser survey as a grid of numbers over a box, for reading heights by eye.

  python3 scripts/lidar_grid.py X0 X1 Z0 Z1 [STEP] [--surface] [--frame=ox,oz,ax,az]

Rows are z, columns x (model metres, +x east, +z south). By default it prints the 2020-21 1 m ground model relative to
the datum (the middle pool deck, 5.00 m in the survey). --surface also prints the 2014-15 2 m surface model (roofs,
walls, trees) over the datum. With --frame the box is read in a wall-aligned frame instead: s along (ax, az) from
(ox, oz), e to its right; X0..X1 is then s and Z0..Z1 is e.

Needs the tiles from `python3 scripts/lidar_check.py fetch` and numpy, rasterio, pyproj, matplotlib.
A surface-model spike is not always a building: check the aerial (trees and palms read as spikes too).
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lidar_check as L  # noqa: E402

DATUM = 5.0


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = [a for a in sys.argv[1:] if a.startswith('--')]
    if len(args) < 4:
        raise SystemExit(__doc__)
    x0, x1, z0, z1 = map(float, args[:4])
    step = float(args[4]) if len(args) > 4 else 1.0
    frame = next((f.split('=', 1)[1] for f in flags if f.startswith('--frame=')), None)
    convert = L.to_utm()
    ground = L.Survey('mdt2021', convert)
    surface = L.Survey('mds2015', convert) if '--surface' in flags else None
    if frame:
        ox, oz, ax, az = map(float, frame.split(','))
        n = (ax * ax + az * az) ** 0.5
        ax, az = ax / n, az / n
        to_world = lambda s, e: (ox + ax * s + az * e, oz + az * s - ax * e)
    else:
        to_world = lambda x, z: (x, z)
    xs, zs = np.arange(x0, x1 + 1e-9, step), np.arange(z0, z1 + 1e-9, step)
    for name, survey in (('ground 2021', ground), ('surface 2015', surface)):
        if survey is None:
            continue
        print(f'{name}, metres over the datum ({"s across, e down" if frame else "x across, z down"})')
        print('       ' + ''.join(f'{x:7.1f}' for x in xs))
        for z in zs:
            print(f'{z:7.1f}' + ''.join(f'{float(survey.at(*to_world(x, z))) - DATUM:7.2f}' for x in xs))
        print()


if __name__ == '__main__':
    main()
