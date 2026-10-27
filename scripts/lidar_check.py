#!/usr/bin/env python3
"""Measure the model's levels and roof heights against the national laser survey (PNOA-LiDAR).

The Junta de Andalucía's environmental network (REDIAM) republishes PNOA-LiDAR as 2 x 2 km
ground (MDT) and surface (MDS) elevation tiles. This compares them with the running model:

  python3 scripts/lidar_check.py fetch          download the tiles to layout-checks.local/lidar
  node scripts/shoot_views.cjs --model          export the model (layout-checks.local/model.json)
  python3 scripts/lidar_check.py report         write docs/reviews/lidar-levels/

Heights are relative to the middle pool deck, which is the model's zero. The report covers
pool decks, every mapped street, the photo-read level changes in data/levels_survey.json, roof
heights above each building's own ground, a map of model-minus-survey ground and how well the
registry footprints sit on the surveyed roofs. Sources:
  2020-21 survey: 1 m ground model. Its surface model leaves buildings out, so it is not used.
  2014-15 survey: 2 m ground and surface models with buildings, for roof heights.
The tiles stay out of the repository. Needs numpy, Pillow, rasterio, pyproj and matplotlib.
"""
import argparse
import json
import math
import urllib.request
from pathlib import Path

import numpy as np
from matplotlib.path import Path as RingPath


def contains(ring, points, margin=0.0):
    """Which points lie inside a ring grown (margin > 0) or shrunk (margin < 0) by that many metres.
    matplotlib only applies a positive radius, outward on a counter-clockwise ring and inward on a
    clockwise one, so the ring is wound to suit the sign."""
    ring = np.asarray(ring, float)
    area = np.sum(ring[:, 0] * np.roll(ring[:, 1], -1) - np.roll(ring[:, 0], -1) * ring[:, 1])
    if (area > 0) != (margin >= 0):
        ring = ring[::-1]
    return RingPath(ring).contains_points(points, radius=abs(margin))
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'layout-checks.local/lidar'
MODEL = ROOT / 'layout-checks.local/model.json'
OUT = ROOT / 'docs/reviews/lidar-levels'
SHARE = 'https://portalrediam.cica.es/descargas/public.php/dav/files/mxHMWXyHfrCxyNK/01_CARACTERIZACION_TERRITORIO/07_BASES_REF_ELEV/01_ELEVACIONES/01_PROYECTOS_REGIONALES/'
TILES = ('314-4036', '314-4038', '316-4038')  # ETRS89 UTM 30N, named by west and north edge in km
SOURCES = {
    'mdt2021': '2020_AND_PNOA_LIDAR_V226_el/InfGeografica/InfRaster/MDT/ETRS89_h30_Horto/COG/2x2km_1m/{t}_mdt_cog.tif',
    'mds2015': '2014_15_AND_PNOA_LIDAR_V208_el/InfGeografica/InfRaster/MDS/ETRS89_h30_Horto/{t}-tile.tif',
    'mdt2015': '2014_15_AND_PNOA_LIDAR_V208_el/InfGeografica/InfRaster/MDT/ETRS89_h30_Horto/{t}-tile.tif',
}
# The model's metre frame: the local projection used by scripts/build_skeleton.py.
LAT0, LON0, R_EARTH = 36.4552, -5.05, 6378137.0


def fetch():
    CACHE.mkdir(parents=True, exist_ok=True)
    for name, path in SOURCES.items():
        for tile in TILES:
            target = CACHE / f'{name}_{tile}.tif'
            if target.exists():
                continue
            # Nextcloud's public share API; the header is the one its own web page sends.
            request = urllib.request.Request(SHARE + path.format(t=tile), headers={'X-Requested-With': 'XMLHttpRequest'})
            target.write_bytes(urllib.request.urlopen(request, timeout=300).read())
            print(target.relative_to(ROOT), target.stat().st_size // 1024, 'kB')


def to_utm():
    from pyproj import Transformer
    utm = Transformer.from_crs(4326, 25830, always_xy=True)

    def convert(x, z):
        lon = LON0 + np.degrees(np.asarray(x, float) / (R_EARTH * math.cos(math.radians(LAT0))))
        lat = LAT0 - np.degrees(np.asarray(z, float) / R_EARTH)
        return utm.transform(lon, lat)
    return convert


class Survey:
    """One elevation model, sampled in model metres."""

    def __init__(self, name, convert):
        import rasterio
        from rasterio.merge import merge
        sources = [rasterio.open(CACHE / f'{name}_{t}.tif') for t in TILES]
        data, self.transform = merge(sources, bounds=(314000, 4034000, 318000, 4038000), res=1.0)
        self.data = data[0].astype(float)
        self.data[(self.data <= -9000) | (self.data >= 9000)] = np.nan
        self.convert = convert

    def at(self, x, z):
        east, north = self.convert(x, z)
        col, row = ~self.transform * (east, north)
        return self.data[np.asarray(row, int), np.asarray(col, int)]

    def inside(self, ring, margin):
        """Values at 0.5 m spacing inside a model ring (margin > 0 grows it, < 0 shrinks it)."""
        ring = np.asarray(ring, float)
        (x0, z0), (x1, z1) = ring.min(0) - abs(margin) - 1, ring.max(0) + abs(margin) + 1
        x, z = np.meshgrid(np.arange(x0, x1, 0.5), np.arange(z0, z1, 0.5))
        keep = contains(ring, np.c_[x.ravel(), z.ravel()], margin)
        values = self.at(x.ravel()[keep], z.ravel()[keep])
        return values[np.isfinite(values)]


def report():
    if not MODEL.exists():
        raise SystemExit('run node scripts/shoot_views.cjs --model first')
    model = json.loads(MODEL.read_text())
    convert = to_utm()
    ground, surface, ground15 = (Survey(name, convert) for name in ('mdt2021', 'mds2015', 'mdt2015'))
    pools = {p['id']: p for p in model['pools']}
    deck = lambda pool: float(np.median(ground.inside([(x, z) for x, _, z in pools[pool]['ring']], 4.0)))
    datum = deck('middle')
    deck15 = float(np.median(ground15.inside([(x, z) for x, _, z in pools['middle']['ring']], 4.0)))
    result = {'datum': {'surveyHeight': round(datum, 2), 'meaning': 'survey ground at the middle pool deck, the model zero (orthometric metres)',
                        'surveyHeight2015': round(deck15, 2)}}

    result['pools'] = [{'pool': p, 'survey': round(deck(p) - datum, 2), 'model': round(float(np.median([y for _, y, _ in pools[p]['ring']])), 2)}
                       for p in ('north', 'middle', 'south', 'main')]

    grid = model['ground']
    gx, gz = np.meshgrid(grid['x0'] + np.arange(grid['nx']) * grid['step'], grid['z0'] + np.arange(grid['nz']) * grid['step'])
    modelled = np.array(grid['heights'], float).reshape(gz.shape)
    surveyed = ground.at(gx, gz) - datum
    covered = np.zeros(gx.size, bool)
    points = np.c_[gx.ravel(), gz.ravel()]
    for shape in [b['ring'] for b in model['buildings']] + [[(x, z) for x, _, z in p['ring']] for p in model['pools']]:
        covered |= contains(shape, points, 0.5)
    difference = np.where(covered.reshape(gx.shape) | ~np.isfinite(surveyed), np.nan, modelled - surveyed)
    sample = lambda array, x, z: array[int(round((z - grid['z0']) / grid['step'])), int(round((x - grid['x0']) / grid['step']))]

    skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
    streets = []
    for road in skeleton['boundaryReference']['roads']:
        line = np.array(road['points'], float)
        along = np.concatenate([a + (b - a) * np.linspace(0, 1, max(2, int(np.hypot(*(b - a)) / 2)), endpoint=False)[:, None]
                                for a, b in zip(line[:-1], line[1:])] + [line[-1:]])
        survey_line = np.array([sample(surveyed, x, z) for x, z in along])
        model_line = np.array([sample(modelled, x, z) for x, z in along])
        ok = np.isfinite(survey_line)
        if ok.sum() < 3:
            continue
        miss = model_line[ok] - survey_line[ok]
        streets.append({'street': road.get('name') or road['id'], 'from': [round(v, 1) for v in line[0]], 'to': [round(v, 1) for v in line[-1]],
                        'survey': [round(float(survey_line[ok][0]), 2), round(float(survey_line[ok][-1]), 2)],
                        'surveyRange': [round(float(survey_line[ok].min()), 2), round(float(survey_line[ok].max()), 2)],
                        'model': [round(float(model_line[ok][0]), 2), round(float(model_line[ok][-1]), 2)],
                        'medianMiss': round(float(np.median(miss)), 2), 'worstMiss': round(float(np.abs(miss).max()), 2)})
    result['streets'] = streets

    levels = json.loads((ROOT / 'data/levels_survey.json').read_text())['items']
    result['levelsSurvey'] = []
    for item in levels:
        pair = item.get('compare')
        if not pair:
            continue
        rise = float(ground.at(*pair['high']) - ground.at(*pair['low']))
        low, high = min(item['rise']), max(item['rise'])
        # How far the surveyed rise falls outside the range read from the photos (0 inside it).
        result['levelsSurvey'].append({'id': item['id'], 'photoRise': item['rise'], 'surveyRise': round(rise, 2),
                                       'outsideBy': round(max(low - rise, rise - high, 0.0), 2)})

    roofs = []
    for b in model['buildings']:
        if b['floors'] <= 0 or b['passage']:
            continue
        tops, bases = surface.inside(b['ring'], -1.0), ground15.inside(b['ring'], -1.0)
        if len(tops) < 8 or len(bases) < 8:
            continue
        height = tops - np.median(bases)
        roofs.append({'id': b['id'], 'floors': b['floors'], 'model': round(b['top'] - b['base'], 2),
                      'roofMedian': round(float(np.median(height)), 2), 'roofHigh': round(float(np.percentile(height, 90)), 2),
                      'groundAboveDatum': round(float(np.median(ground.inside(b['ring'], -1.0))) - datum, 2)})
    result['roofs'] = {'byFloors': [{'floors': f, 'buildings': len(rs), 'model': f * 3.0,
                                     'roofMedian': round(float(np.median([r['roofMedian'] for r in rs])), 2),
                                     'roofHigh': round(float(np.median([r['roofHigh'] for r in rs])), 2)}
                                    for f in sorted({r['floors'] for r in roofs}) if len(rs := [r for r in roofs if r['floors'] == f]) >= 3],
                       'buildings': roofs}

    # Only open ground within 15 m of a house counts: the export also covers beach, sea and outside roads.
    near = np.zeros(gx.size, bool)
    for b in model['buildings']:
        near |= contains(b['ring'], points, 15.0)
    miss = difference[np.isfinite(difference) & near.reshape(gx.shape)]
    result['ground'] = {'cells': int(miss.size), 'medianMiss': round(float(np.median(miss)), 2),
                        'within25cm': round(float((np.abs(miss) < 0.25).mean()), 2), 'over50cm': round(float((np.abs(miss) > 0.5).mean()), 2),
                        'note': 'model minus survey on a 2 m grid of open ground within 15 m of a house (buildings and pools left out)'}
    result['registration'] = register(model, surface, ground15)
    result['sources'] = ('PNOA-LiDAR (c) Instituto Geografico Nacional de Espana, CC BY 4.0, via REDIAM, Junta de Andalucia '
                         '(2020-21 V226 MDT 1 m; 2014-15 V208 MDS/MDT 2 m).')
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'measurements.json').write_text(json.dumps(result, indent=1, ensure_ascii=False) + '\n')
    draw_difference(model, grid, difference, OUT / 'ground-difference.png')
    draw_relief(model, skeleton, ground, datum, OUT / 'survey-ground.png')
    summary(result)


def register(model, surface, ground15):
    """Shift of the registry footprints that best fits the surveyed roofs, by correlation."""
    houses = [b for b in model['buildings'] if b['floors'] > 0 and not b['passage']]
    rings = np.concatenate([np.array(b['ring']) for b in houses])
    x, z = np.meshgrid(np.arange(rings[:, 0].min() - 6, rings[:, 0].max() + 6, 0.5), np.arange(rings[:, 1].min() - 6, rings[:, 1].max() + 6, 0.5))
    points = np.c_[x.ravel(), z.ravel()]
    mask = np.zeros(x.size, bool)
    for b in houses:
        mask |= contains(b['ring'], points)
    mask = mask.astype(float) - mask.mean()

    def fit(dx, dz):
        height = np.clip(np.nan_to_num(surface.at(points[:, 0] + dx, points[:, 1] + dz) - ground15.at(points[:, 0] + dx, points[:, 1] + dz)), 0, 8)
        height -= height.mean()
        return float(mask @ height / math.sqrt((mask @ mask) * (height @ height)))
    coarse = max((fit(dx, dz), dx, dz) for dx in np.arange(-3, 3.01, 0.5) for dz in np.arange(-3, 3.01, 0.5))
    best = max((fit(dx, dz), dx, dz) for dx in np.arange(coarse[1] - 0.5, coarse[1] + 0.51, 0.25) for dz in np.arange(coarse[2] - 0.5, coarse[2] + 0.51, 0.25))
    return {'east': round(best[1], 2), 'south': round(best[2], 2), 'fit': round(best[0], 3), 'fitUnshifted': round(fit(0, 0), 3),
            'note': 'best footprint shift against the 2014-15 2 m surface model; its grid is pixel-is-point, so about 1 m is within its own uncertainty'}


def font(size):
    try:
        return ImageFont.truetype('DejaVuSans.ttf', size)
    except OSError:
        return ImageFont.load_default()


def draw_difference(model, grid, difference, path, scale=4):
    """Blue where the model ground is too low, red where too high, white within 0.1 m; +-1.5 m saturates."""
    d = np.clip(np.nan_to_num(difference), -1.5, 1.5) / 1.5
    known = np.isfinite(difference)
    rgb = np.full(difference.shape + (3,), 235.0)
    rgb[..., 0] = np.where(known, np.where(d > 0, 255, 255 * (1 + d)), 235)
    rgb[..., 1] = np.where(known, 255 * (1 - np.abs(d)), 235)
    rgb[..., 2] = np.where(known, np.where(d < 0, 255, 255 * (1 - d)), 235)
    image = Image.fromarray(rgb.astype(np.uint8)).resize((difference.shape[1] * scale, difference.shape[0] * scale), Image.NEAREST)
    draw = ImageDraw.Draw(image)
    at = lambda x, z: ((x - grid['x0']) / grid['step'] * scale + scale / 2, (z - grid['z0']) / grid['step'] * scale + scale / 2)
    for b in model['buildings']:
        draw.line([at(*p) for p in b['ring'] + b['ring'][:1]], fill=(90, 90, 90), width=1)
    for p in model['pools']:
        draw.line([at(x, z) for x, _, z in p['ring'] + p['ring'][:1]], fill=(0, 140, 0), width=2)
    draw.rectangle([0, 0, image.size[0], 22], fill=(255, 255, 255))
    draw.text((6, 4), 'Model ground minus surveyed ground: blue = model too low, red = too high (to 1.5 m). North up.', fill=(0, 0, 0), font=font(13))
    image.save(path)


def draw_relief(model, skeleton, ground, datum, path, scale=3):
    """Surveyed ground relative to the middle pool deck, with 0.5 m contours, streets and footprints."""
    rings = np.concatenate([np.array(b['ring']) for b in model['buildings']])
    x0, z0 = rings.min(0) - 10
    x1, z1 = rings.max(0) + 10
    x, z = np.meshgrid(np.arange(x0, x1, 0.5), np.arange(z0, z1, 0.5))
    h = ground.at(x, z) - datum
    t = np.clip((np.nan_to_num(h) + 3.5) / 5.5, 0, 1)
    rgb = np.stack([255 * t, 255 * (1 - np.abs(t - 0.5) * 2) * 0.8 + 40, 255 * (1 - t)], -1).astype(np.uint8)
    step = np.floor(np.nan_to_num(h) / 0.5)
    contour = (step != np.roll(step, 1, 0)) | (step != np.roll(step, 1, 1))
    rgb[contour] = 0
    image = Image.fromarray(rgb).resize((h.shape[1] * scale // 2 * 2, h.shape[0] * scale // 2 * 2), Image.NEAREST)
    draw, small = ImageDraw.Draw(image), font(12)
    k = image.size[0] / (x1 - x0)
    at = lambda px, pz: ((px - x0) * k, (pz - z0) * k)
    for b in model['buildings']:
        draw.line([at(*p) for p in b['ring'] + b['ring'][:1]], fill=(255, 255, 255), width=1)
    for p in model['pools']:
        draw.line([at(px, pz) for px, _, pz in p['ring'] + p['ring'][:1]], fill=(0, 90, 0), width=2)
    for road in skeleton['boundaryReference']['roads']:
        draw.line([at(*p) for p in road['points']], fill=(255, 255, 0), width=2)
        draw.text(at(*road['points'][len(road['points']) // 2]), road.get('name', ''), fill=(0, 0, 0), font=small)
    for gz in np.arange(math.ceil(z0 / 40) * 40, z1, 40):
        for gx in np.arange(math.ceil(x0 / 40) * 40, x1, 40):
            value = float(ground.at(gx, gz) - datum)
            if math.isfinite(value):
                draw.text(at(gx, gz), f'{value:+.1f}', fill=(0, 0, 0), font=small)
    draw.rectangle([0, 0, image.size[0], 22], fill=(255, 255, 255))
    draw.text((6, 4), 'Surveyed ground above the middle pool deck, -3.5 (blue) to +2 m (red); 0.5 m contours; north up', fill=(0, 0, 0), font=small)
    image.save(path)


def summary(r):
    print(f"datum: middle pool deck at {r['datum']['surveyHeight']} m")
    for p in r['pools']:
        print(f"pool {p['pool']:6} survey {p['survey']:+.2f} model {p['model']:+.2f}")
    print('streets (survey start -> end, model start -> end, median and worst miss):')
    for s in r['streets']:
        print(f"  {s['street'][:30]:30} {s['survey'][0]:+.2f} -> {s['survey'][1]:+.2f}   {s['model'][0]:+.2f} -> {s['model'][1]:+.2f}   {s['medianMiss']:+.2f} / {s['worstMiss']:.2f}")
    print('levels survey (photo-read rise, surveyed rise, outside the photo range by):')
    for i in r['levelsSurvey']:
        print(f"  {i['id']:26} {i['photoRise']}  {i['surveyRise']:+.2f}  {i['outsideBy']:.2f}")
    for f in r['roofs']['byFloors']:
        print(f"roofs, {f['floors']} floors: {f['buildings']} buildings, model {f['model']:.1f} m, surveyed median {f['roofMedian']:.2f} m, high {f['roofHigh']:.2f} m")
    g = r['ground']
    print(f"open ground: median miss {g['medianMiss']:+.2f} m, {g['within25cm']:.0%} within 0.25 m, {g['over50cm']:.0%} off by over 0.5 m")
    reg = r['registration']
    print(f"footprints fit the surveyed roofs best moved {reg['east']:+.2f} m east, {reg['south']:+.2f} m south (fit {reg['fit']} vs {reg['fitUnshifted']})")


def grid(step=2.0, extent=(-270.0, -160.0, 130.0, 270.0)):
    """Write data/terrain.json: the surveyed ground as a height grid that src/terrain.ts samples.

    Open ground comes straight from the 1 m survey ground model. Under houses and pools the
    survey only interpolates, so those cells are filled again from the open ground around them.
    Inside the lowered main-pool area the model draws its lawn LOWER_POOL_Y below the street and
    adds this grid on top, so there the grid holds the survey plus that drop. Pool decks are
    flattened to their surveyed level; the rest is smoothed lightly. Needs scipy as well.
    """
    from scipy.interpolate import griddata
    from scipy.ndimage import gaussian_filter
    if not MODEL.exists():
        raise SystemExit('run node scripts/shoot_views.cjs --model first')
    model = json.loads(MODEL.read_text())
    ground = Survey('mdt2021', to_utm())
    pools = {p['id']: [(x, z) for x, _, z in p['ring']] for p in model['pools']}
    datum = float(np.median(ground.inside(pools['middle'], 4.0)))
    x0, z0, x1, z1 = extent
    from scipy.ndimage import distance_transform_edt
    xs, zs = np.arange(x0, x1 + 0.5, 1.0), np.arange(z0, z1 + 0.5, 1.0)
    gx, gz = np.meshgrid(xs, zs)
    points = np.c_[gx.ravel(), gz.ravel()]
    height = ground.at(gx, gz) - datum

    def within(ring, margin=0.0):
        ring = np.asarray(ring, float)
        (a, b), (c, d) = ring.min(0) - abs(margin) - 1, ring.max(0) + abs(margin) + 1
        near = (points[:, 0] >= a) & (points[:, 0] <= c) & (points[:, 1] >= b) & (points[:, 1] <= d)
        hit = np.zeros(len(points), bool)
        hit[near] = contains(ring, points[near])
        hit = hit.reshape(gx.shape)
        # Grow or shrink by distance on the 1 m grid (matplotlib's radius is not a true offset).
        if margin > 0:
            return hit | (distance_transform_edt(~hit) <= margin)
        if margin < 0:
            return hit & (distance_transform_edt(hit) > -margin)
        return hit

    def along(line, half):
        line, hit = np.asarray(line, float), np.zeros(gx.shape, bool)
        for a, b in zip(line[:-1], line[1:]):
            d = b - a
            t = np.clip(((gx - a[0]) * d[0] + (gz - a[1]) * d[1]) / (d @ d), 0, 1)
            hit |= np.hypot(gx - a[0] - d[0] * t, gz - a[1] - d[1] * t) <= half
        return hit

    levels = json.loads((ROOT / 'data/main_pool.json').read_text())['levels']
    turn = math.radians(26)
    scene = lambda ring: [(x * math.cos(turn) + z * math.sin(turn), -x * math.sin(turn) + z * math.cos(turn)) for x, z in ring]
    lowered = within(scene(levels['lowerArea']))
    for hole in levels['lowerHoles']:
        lowered &= ~within(scene(hole))
    sunk = lowered.copy()
    unknown = within(scene(levels['gardenFall']['ring']), 1.0) | within(scene(levels['lowerArea']), 1.5) & ~within(scene(levels['lowerArea']), -1.5)
    for flight in (levels['steps'], levels['enriqueSteps']):
        unknown |= along(scene(flight['points']), flight['width'] / 2 + 1.0)
    lowered &= ~unknown
    # Keep the lawn level: inside the lowered area only survey cells near the lawn's own level set the
    # grid (the sloping corner by the foot of Calle Guillermo was taken out of the area on 2026-10-27).
    lawn = float(np.median(ground.inside(pools['main'], 4.0)) - datum)
    unknown |= lowered & (height > lawn + 0.6)
    height = np.where(lowered, height + levels['drop'], height)
    for b in model['buildings']:
        unknown |= within(b['ring'], 0.75)
    for ring in pools.values():
        unknown |= within(ring, 0.5)
    # The survey reads raised patios and terraces as ground; the model raises them by their
    # photo-read rise above the ground at their foot, so under them the grid is lawn and path level.
    raised = [(t['outline'], bool(t.get('walkable'))) for t in json.loads((ROOT / 'data/raised_terraces.json').read_text())['terraces']]
    raised += [(json.loads((ROOT / 'data/cervantes_garden_door.json').read_text())['patio']['ring'], False),
               (json.loads((ROOT / 'data/picasso_service_road.json').read_text())['ramp']['ring'], False)]
    # The south Dalí flagstone approach rises a photo-read amount from the asphalt at its foot.
    ap = json.loads((ROOT / 'data/door_sills.json').read_text())['approach']
    out, right = np.array(ap['outward']), np.array([ap['outward'][1], -ap['outward'][0]])
    side = ap['halfWidth'] + ap['kerbWidth']
    corner = lambda t, q: (np.array(ap['arch']) + out * t + right * q).tolist()
    approach = [corner(0, -side), corner(ap['foot'], -side), corner(ap['foot'], side + ap['flare']['extra']), corner(0, side + ap['flare']['extra'])]
    for ring in [r for r, _ in raised] + [approach]:
        unknown |= within(ring, 1.0)
    # Narrow lanes run between houses: the survey reads their surface directly, so keep it there.
    skeleton = json.loads((ROOT / 'public/map/skeleton.json').read_text())
    for road in skeleton['boundaryReference']['roads']:
        if not road.get('heights'):
            unknown &= ~along(road['points'], max(0.5, road['width'] / 2 - 0.2))
    known = ~unknown & np.isfinite(height)
    # The lowered area and the ground round it are filled and smoothed apart: their grid values sit on
    # different datums, and where the step between them is small (the slope by the foot of Calle
    # Guillermo) mixing them would pull the lawn edge down.
    filled, smooth = np.full(gx.shape, np.nan), np.zeros(gx.shape)
    for part in (sunk, ~sunk):
        use = known & part
        filled[part] = griddata(points[use.ravel()], height[use], points[part.ravel()], method='linear')
        gaps = part & ~np.isfinite(filled)
        filled[gaps] = griddata(points[use.ravel()], height[use], points[gaps.ravel()], method='nearest')
        weight = gaussian_filter(part.astype(float), 1.0)
        smooth = np.where(part, gaussian_filter(np.where(part, filled, 0.0), 1.0) / np.maximum(weight, 1e-6), smooth)

    def hold(ring, value, core, blend, inside=None):
        """Hold the ground level within `core` metres of a ring (or a given mask), blending back over `blend` more."""
        nonlocal smooth
        inside = within(ring, core) if inside is None else inside
        weight = np.clip(distance_transform_edt(~inside) / blend, 0, 1)
        smooth = value + (smooth - value) * weight

    # Pool decks lie level: hold each at its surveyed height out to 3 m, blending over 3 m more.
    decks, deck_level = {}, {}
    # The main and toddler pools share one deck in the lowered area.
    shared = lambda pid: [q for q in ('main', 'toddler') if q in pools] if pid in ('main', 'toddler') else [pid]
    for pid, ring in pools.items():
        band = np.logical_or.reduce([within(pools[q], 4.0) & ~within(pools[q], 1.0) for q in shared(pid)]) & np.isfinite(height)
        # Whole centimetres, as the grid stores them, so a held deck is exactly level.
        deck_level[pid] = round(float(np.median(height[band])), 2)
        decks[pid] = round(deck_level[pid] - (levels['drop'] if pid in ('main', 'toddler') else 0), 2)
        hold(ring, deck_level[pid], 3.0, 3.0)
    # Raised patios and terraces start from the low side (lawn, path or a pool deck within 6 m),
    # which their photo-read rise is measured from; a walkable one keeps level ground 3 m round it,
    # where its stairs land, as the photos show.
    for ring, walkable in raised:
        near = [deck_level[pid] for pid, pool in pools.items() if (within(pool, 6.0) & within(ring, 0.0)).any() or (within(ring, 6.0) & within(pool, 0.0)).any()]
        band = within(ring, 6.0) & ~within(ring, 4.0) & known
        if near or band.any():
            hold(ring, near[0] if near else float(np.percentile(height[band], 20)), 3.0 if walkable else 0.5, 2.0)
    foot = corner(ap['foot'], 0)
    hold(approach, float(ground.at(*foot)) - datum, 0.5, 2.0)
    # The paseo and its retaining wall keep the seafront's own heights (src/seaside.ts, main_pool.json
    # seafront) on the old street datum; the survey puts the gardens behind the wall 0.1-0.6 m higher.
    # Until the seafront is rebuilt from the survey, the strip behind the wall stays at that datum,
    # so the photographed 1 m wall keeps its height.
    face = json.loads((ROOT / 'data/paseo_wall.json').read_text())['wall']['face']
    hold(None, 0.0, 0, 4.0, inside=along([q[:2] for q in face], 4.0))
    for pid, ring in pools.items():
        smooth = np.where(within(ring, 3.0), deck_level[pid], smooth)
    k = int(round(step))
    coarse = smooth[::k, ::k]
    # Photographed flights of steps stay exact: siteY lays each as level ground, a straight rise over
    # the flight and level ground above, blending into the grid within 3 m. Their rise is the survey's
    # where that agrees with the photos; otherwise the photo-read rise as built (Cervantes: survey 0.22 m).
    surveyed = {i['id']: i for i in json.loads((ROOT / 'data/levels_survey.json').read_text())['items']}
    ramps = []
    for name, item in (('cervantes_elena_steps.json', 'cervantes-elena-steps'), ('middle_pool_steps.json', 'middle-pool-sw-rise'),
                       ('middle_pool_north.json', 'middle-pool-nw-rise')):
        flight = json.loads((ROOT / 'data' / name).read_text())
        flight = flight.get('steps', flight)
        compare = surveyed[item].get('compare') or surveyed['middle-pool-sw-rise']['compare']
        survey_rise = float(ground.at(*compare['high']) - ground.at(*compare['low']))
        low, high = surveyed[item]['rise']
        rise = survey_rise if low <= survey_rise <= high else high
        foot = flight['foot']
        # Level below the foot at the surveyed ground where the photographed rise begins.
        # A flight with a level landing before its first riser starts climbing there.
        start = flight['risers'][0] if flight['risers'][0] >= 1.0 else 0.0
        # Below the foot the flight's level gives way to the grid within 3 m, or sooner where a pool
        # edge lies closer (the middle pool, 3 m below the north white steps), so the pool stays level.
        up = np.subtract(flight['toward'], foot) / math.dist(flight['toward'], foot)
        behind = 3.0
        for ring in pools.values():
            rel = np.asarray(ring)[:, :2] - foot
            ahead, across = rel @ up, np.abs(rel @ [-up[1], up[0]])
            near = (ahead < 0) & (across < 6.0)
            if near.any():
                behind = min(behind, max(0.5, float(-ahead[near].max()) - 1.25))
        # The Cervantes flight shares the lane with a ramp as wide as the lane; the courtyard flights are
        # narrow (the south-west one with a 1.5-2 m terracotta ramp beside it), so the ground beside them stays the survey's.
        half = 3.0 if flight['id'] == 'cervantes-elena-steps' else 2.0
        ramps.append({'id': flight['id'], 'foot': foot, 'toward': flight['toward'], 'start': start, 'run': round(flight['end'], 3), 'halfWidth': half, 'behind': round(behind, 2),
                      'base': round(float(ground.at(*compare['low'])) - datum, 3), 'rise': round(rise, 2), 'photoRise': [low, high], 'surveyRise': round(survey_rise, 2),
                      'from': 'survey' if rise == survey_rise else 'photos (the survey reads less; open in data/levels_survey.json)'})
    out = {'note': ('Ground heights across the resort in metres above the middle pool deck, sampled by src/terrain.ts (each 2 m cell as two flat triangles split along its diagonal from the low-x, low-z corner). '
                    'Generated by scripts/lidar_check.py grid from the PNOA-LiDAR 2020-21 ground model; do not edit by hand. '
                    'Under houses and pools the cells are filled from the open ground around them; pool decks are held level. '
                    'Inside the lowered main-pool area the grid holds the survey plus the drop, since the model draws that lawn '
                    'LOWER_POOL_Y below the street and adds this grid. Seaward of the fade line (turned-frame z) the seafront '
                    'heights take over and the grid fades to zero, as before.'),
           'source': 'PNOA-LiDAR (c) Instituto Geografico Nacional de Espana, CC BY 4.0, via REDIAM, Junta de Andalucia (2020-21 V226 MDT 1 m).',
           'datum': {'surveyHeight': round(datum, 2), 'meaning': 'survey ground at the middle pool deck, the model zero (orthometric metres)'},
           'decks': decks, 'ramps': ramps, 'loweredDrop': levels['drop'], 'fade': [150, 158],
           'x0': x0, 'z0': z0, 'step': float(k), 'nx': coarse.shape[1], 'nz': coarse.shape[0]}
    rows = ['[' + ','.join(str(int(round(v * 100))) for v in row) + ']' for row in coarse]
    text = json.dumps(out, indent=1, ensure_ascii=False)[:-2] + ',\n "cm": [\n  ' + ',\n  '.join(rows) + '\n ]\n}\n'
    json.loads(text)
    (ROOT / 'data/terrain.json').write_text(text)
    print('data/terrain.json', coarse.shape, 'decks', decks, f'{len(text) // 1024} kB')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('command', choices=['fetch', 'report', 'grid'])
    args = parser.parse_args()
    {'fetch': fetch, 'report': report, 'grid': grid}[args.command]()


if __name__ == '__main__':
    main()
