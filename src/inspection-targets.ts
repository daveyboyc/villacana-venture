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
  return targets;
}
