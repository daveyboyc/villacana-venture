"""The stone deck round a small pool as a band from its water ring (data/pool_decks.json).

The band is the ground within a measured width of the ring, the width varying with compass
bearing from the ring's centre (linear between control bearings), then softened with a Gaussian
of `smoothing` metres and cut at half strength. That fills the tight bays between lobes and
gives the clean, curved outer edge the photos show, where the glass fence stands. Heavy arrays
on a 5 cm grid; numpy only, deterministic.

Used by build_skeleton.py (cover classes and the deck outline in skeleton.json) and by
measure_pool_decks.py (fitting the widths to measured edge points).
"""
from __future__ import annotations

import math

import numpy as np

STEP = 0.05


def inside(px: np.ndarray, pz: np.ndarray, ring) -> np.ndarray:
    """Even-odd point-in-polygon for arrays of points."""
    r = np.asarray(ring, float)
    out = np.zeros(np.shape(px), bool)
    for (ax, az), (bx, bz) in zip(r, np.roll(r, -1, 0)):
        out ^= ((az > pz) != (bz > pz)) & (px < (bx - ax) * (pz - az) / (bz - az + 1e-12) + ax)
    return out


def ring_distance(px: np.ndarray, pz: np.ndarray, ring) -> np.ndarray:
    """Distance from each point to the ring's outline."""
    r = np.asarray(ring, float)
    best = np.full(np.shape(px), np.inf)
    for (ax, az), (bx, bz) in zip(r, np.roll(r, -1, 0)):
        dx, dz = bx - ax, bz - az
        t = np.clip(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz + 1e-12), 0, 1)
        best = np.minimum(best, np.hypot(px - ax - t * dx, pz - az - t * dz))
    return best


def _blur(field: np.ndarray, sigma: float) -> np.ndarray:
    if sigma <= 0:
        return field
    k = np.arange(-math.ceil(3 * sigma / STEP), math.ceil(3 * sigma / STEP) + 1) * STEP
    k = np.exp(-k * k / (2 * sigma * sigma))
    k /= k.sum()
    field = np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 0, field)
    return np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 1, field)


def compass(dx, dz):
    """Compass bearing in degrees (0 north, 90 east) of a direction in the east-south frame."""
    return (np.degrees(np.arctan2(dz, dx)) + 90) % 360


class DeckGrid:
    """Signed distance to one water ring on a fine grid round it (negative inside the water)."""

    def __init__(self, ring, margin: float = 6.0):
        self.ring = np.asarray(ring, float)
        self.centre = self.ring.mean(0)
        self.x0, self.z0 = self.ring.min(0) - margin
        x1, z1 = self.ring.max(0) + margin
        self.nx, self.nz = int((x1 - self.x0) / STEP), int((z1 - self.z0) / STEP)
        xs = self.x0 + (np.arange(self.nx) + 0.5) * STEP
        zs = self.z0 + (np.arange(self.nz) + 0.5) * STEP
        self.X, self.Z = np.meshgrid(xs, zs)
        d = ring_distance(self.X, self.Z, self.ring)
        self.signed = np.where(inside(self.X, self.Z, self.ring), -d, d)
        self.bearing = compass(self.X - self.centre[0], self.Z - self.centre[1])

    def width_at(self, bearings: np.ndarray, widths) -> np.ndarray:
        """Width at each bearing, linear between the control bearings (equally spaced from 0)."""
        w = np.asarray(widths, float)
        pos = np.asarray(bearings) / (360 / len(w))
        k = np.floor(pos).astype(int) % len(w)
        t = pos - np.floor(pos)
        return w[k] * (1 - t) + w[(k + 1) % len(w)] * t

    def field(self, widths, smoothing: float) -> np.ndarray:
        return _blur((self.signed < self.width_at(self.bearing, widths)).astype(float), smoothing)

    def edge_along(self, field: np.ndarray, bearing: float) -> float:
        """Distance from the centre to the band's outer edge along one compass bearing."""
        a = math.radians(bearing - 90)
        d = np.array([math.cos(a), math.sin(a)])
        ts = np.arange(0, max(self.nx, self.nz) * STEP, STEP / 2)
        p = self.centre + ts[:, None] * d
        fi, fj = (p[:, 0] - self.x0) / STEP - 0.5, (p[:, 1] - self.z0) / STEP - 0.5
        ok = (fi >= 0) & (fi < self.nx - 1) & (fj >= 0) & (fj < self.nz - 1)
        ts, fi, fj = ts[ok], fi[ok], fj[ok]
        i, j = fi.astype(int), fj.astype(int)
        u, v = fi - i, fj - j
        val = (field[j, i] * (1 - u) * (1 - v) + field[j, i + 1] * u * (1 - v)
               + field[j + 1, i] * (1 - u) * v + field[j + 1, i + 1] * u * v)
        above = val >= 0.5
        if np.count_nonzero(above[1:] != above[:-1]) != 1:
            raise ValueError(f"deck band is not star-shaped from the ring centre at bearing {bearing:.1f}")
        q = int(np.nonzero(above)[0].max())
        return float(ts[q] + (val[q] - 0.5) / (val[q] - val[q + 1]) * (ts[q + 1] - ts[q]))

    def outline(self, widths, smoothing: float, points: int = 240) -> list[list[float]]:
        """The band's outer edge as a closed ring, one point per 360/points degrees, rounded to cm."""
        f = self.field(widths, smoothing)
        out = []
        for k in range(points):
            b = k * 360 / points
            t = self.edge_along(f, b)
            a = math.radians(b - 90)
            out.append([round(float(self.centre[0] + t * math.cos(a)), 2), round(float(self.centre[1] + t * math.sin(a)), 2)])
        return out


def deck_outline(ring, deck: dict) -> list[list[float]]:
    """Outer edge of a pool's deck from its data/pool_decks.json entry."""
    return DeckGrid(ring).outline([w["width"] for w in deck["widths"]], deck["smoothing"])
