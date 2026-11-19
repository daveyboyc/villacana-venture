#!/usr/bin/env python3
"""Build the garden plants photographed round the Cervantes apron on Pintor Dalí (19 November 2026).

  pip install bpy==5.2.3
  python3 scripts/build_garden_plants.py   writes public/models/plants/fan-palm-clump.glb and cycad.glb

- fan-palm-clump: Mediterranean fan palm (Chamaerops humilis) grown as a clump of leaning fibrous
  trunks, each with a head of stiff palmate fans, in the raised planter on the north side of the
  apron (IMG_3087, IMG_3088) and at the north end of the Dalí lawn strip (IMG_3089).
- cycad: sago cycad (Cycas revoluta), a short shaggy trunk under a flat rosette of stiff, dark glossy
  feather fronds, in a front garden beside the Dalí footpath (IMG_3086).

Same conventions as scripts/build_plants.py, whose Plant helper this reuses: metres, standing on the
origin, x and y across the ground and z up, seeded so a rebuild is byte-identical, sized to the card
each replaces (SPRITE_SIZE in src/sprites.ts). Original models, not scans of the actual plants.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_plants  # noqa: E402
from build_plants import Plant, add, unit  # noqa: E402

build_plants.COLOURS.update({
    'fan-frond': ('#56703f', 0.7),        # grey-green stiff fans, IMG_3088
    'fan-frond-old': ('#8c8a52', 0.85),   # the yellowing lowest fans
    'fan-trunk': ('#5a4634', 0.97),       # trunks wrapped in brown fibre and old leaf bases
    'cycad-frond': ('#2e4a25', 0.45),     # dark, glossy, IMG_3086
    'cycad-trunk': ('#6b4c36', 0.95),
})


def fan(p, kind, head, direction, petiole, radius, segments=17):
    """One palmate fan: a stalk from `head` along `direction`, then `segments` narrow leaflets radiating
    over about 220 degrees in the plane across the stalk, their tips drooping a little."""
    d = unit(direction)
    end = add(head, d, petiole)
    p.tube(kind, head, end, 0.018, 0.012, sides=4)
    side = unit((-d[1], d[0], 0)) if abs(d[2]) < 0.98 else (1, 0, 0)
    face = unit((d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0]))
    for j in range(segments):
        t = math.radians(-110 + 220 * j / (segments - 1) + p.rng.uniform(-4, 4))
        out = unit(add(add(add((0, 0, 0), d, math.cos(t)), side, math.sin(t)), face, 0.12))
        length = radius * p.rng.uniform(0.8, 1.05)
        across = unit(build_plants.cross(face, out))  # leaflet width lies in the plane of the fan
        p.blade(kind, end, out, across, length, 0.028,
                droop=0.18 + 0.12 * abs(math.sin(t)), fold=0.35, segments=3, shape='strap')


def fan_palm_clump(p, height=5.2, spread=1.8):
    """Chamaerops humilis: five to seven trunks leaning out from one base, the tallest in the middle,
    each under a rounded head of fans; the lowest fans on each head yellowing."""
    rng = p.rng
    trunks = 6
    for i in range(trunks):
        a = 2 * math.pi * i / trunks + rng.uniform(-0.3, 0.3)
        tall = (0.75 if i == 0 else rng.uniform(0.35, 0.68)) * (height - 1.0)
        out = 0.15 if i == 0 else rng.uniform(0.45, spread - 0.75)  # the trunks splay apart (IMG_3088)
        foot = (math.cos(a) * 0.18, math.sin(a) * 0.18, 0)
        top = (math.cos(a) * out, math.sin(a) * out, tall)
        p.tube('fan-trunk', foot, top, 0.095, 0.075, sides=7, ripple=0.1, ring_step=0.14)
        fans = rng.randint(10, 13)
        for k in range(fans):
            b = 2 * math.pi * k / fans * 2.618 + rng.uniform(-0.2, 0.2)
            up = 1.3 - 1.25 * (k / fans) + rng.uniform(-0.1, 0.1)  # upper fans steep, lower ones out flat
            d = (math.cos(b) * math.cos(up), math.sin(b) * math.cos(up), math.sin(up))
            fan(p, 'fan-frond-old' if k >= fans - 2 else 'fan-frond', top, d, rng.uniform(0.45, 0.75), rng.uniform(0.42, 0.55))


def cycad(p, height=2.3, spread=1.1):
    """Cycas revoluta: a stout shaggy trunk and a flat-topped rosette of arching pinnate fronds with
    stiff needle leaflets in a V, the lower fronds out level."""
    rng = p.rng
    trunk = height * 0.38
    p.tube('cycad-trunk', (0, 0, 0), (0.03, 0.02, trunk), 0.17, 0.15, sides=10, ripple=0.1, ring_step=0.07)
    head = (0.03, 0.02, trunk)
    fronds = 32
    for i in range(fronds):
        a = 2 * math.pi * i / fronds * 2.618
        up = 1.0 - 0.85 * (i / fronds) ** 0.9 + rng.uniform(-0.08, 0.08)
        d = unit((math.cos(a) * math.cos(up), math.sin(a) * math.cos(up), math.sin(up)))
        side = (-math.sin(a), math.cos(a), 0)
        length = min(spread * 1.05, rng.uniform(1.0, 1.25))
        droop = 0.25 + 0.2 * (i / fronds)
        steps = 22
        prev = head
        for k in range(1, steps + 1):
            t = k / steps
            point = add(add(head, d, length * t), (0, 0, -1), droop * length * t * t)
            if t > 0.12:
                span = 0.16 * math.sin(math.pi * min(1.0, (t - 0.08) * 1.05)) + 0.04
                along = unit((point[0] - prev[0], point[1] - prev[1], point[2] - prev[2]))
                for sign in (1, -1):
                    out = unit(add(add((side[0] * sign, side[1] * sign, 0), along, 0.5), (0, 0, 1), 0.3))
                    p.blade('cycad-frond', point, out, along, span, 0.008, droop=0.05, fold=0, segments=1, shape='strap')
            prev = point
        p.tube('cycad-frond', head, add(add(head, d, length * 0.6), (0, 0, -1), droop * length * 0.36), 0.014, 0.006, sides=4)


def main():
    for name, seed, build in (('fan-palm-clump', 61, fan_palm_clump), ('cycad', 67, cycad)):
        plant = Plant(name, seed)
        build(plant)
        plant.build()


if __name__ == '__main__':
    main()
