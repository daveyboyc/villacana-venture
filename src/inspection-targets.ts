import type { Skeleton, Vec2 } from './types';

export type InspectionTarget = { id: string; name: string; group: string; points: Vec2[] };

/** Camera bookmarks use the existing map outlines; they never place model features. */
export function inspectionTargets(skeleton: Skeleton): InspectionTarget[] {
  const targets: InspectionTarget[] = [{ id: 'whole-resort', name: 'Whole resort', group: 'Resort', points: skeleton.area }];
  for (const pool of skeleton.pools.filter(p => p.id !== 'toddler')) {
    targets.push({ id: `${pool.id}-pool`, name: `${pool.id[0].toUpperCase()}${pool.id.slice(1)} pool`, group: 'Pools', points: pool.ring });
  }
  const seafront = skeleton.seafront;
  if (seafront) targets.push(
    { id: 'seafront', name: 'Seafront · whole coast', group: 'Coast', points: [...seafront.paseo.points, ...seafront.restaurant.ring] },
    { id: 'paseo-west', name: 'West paseo · stamped paving', group: 'Coast', points: seafront.paseo.points.filter(([x]) => x < -60) },
    { id: 'paseo', name: 'Paseo · seafront promenade', group: 'Coast', points: seafront.paseo.points },
    { id: 'barraka-beach', name: 'Barraka & beach', group: 'Coast', points: [...seafront.restaurant.ring, ...seafront.restaurant.terrace] },
  );
  for (const road of skeleton.boundaryReference?.roads ?? []) {
    if (!road.id || !road.points.length) continue;
    const section = road.id === 'elena-north' || road.id === 'silvia-north' ? ' · north' : road.id === 'elena-south' || road.id === 'silvia-south' ? ' · south' : road.id === 'eva-west-footpath' ? ' · west footpath' : '';
    targets.push({ id: road.id, name: road.name + section, group: 'Lanes & roads', points: road.points });
  }
  // The full Calle Jorge line is too long for the fittings to read. This frames the photographed east end.
  const jorge = skeleton.streets.find((s) => s.id === 'jorge');
  if (jorge?.points && jorge.points.length >= 2) {
    const [a, b] = jorge.points;
    const at = (t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    targets.push({ id: 'jorge-detail', name: 'Calle Jorge · east detail', group: 'Lanes & roads', points: [at(0.72), at(0.98)] });
    // The flagged entrance from the Pintor Dalí car park (IMG_2696-2698).
    targets.push({ id: 'jorge-west', name: 'Calle Jorge · west entrance', group: 'Lanes & roads', points: [at(0.0), at(0.22)] });
  }
  return targets;
}
