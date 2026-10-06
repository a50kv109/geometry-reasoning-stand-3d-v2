/**
 * DUAL REPRESENTATION LAYER (M1.5, Package 02, Package 06)
 * 
 * Invariants:
 * - Spherical coordinates are strictly a representation layer.
 * - NEVER creates a secondary geometry model.
 * - NO silent projection: rejects points outside sphere with explicit error.
 * - Pole singularity convention: phi = +/- pi/2 implies canonical lambda = 0.
 * - Longitude normalized to [0, 2pi).
 */

import { Point3D, Sphere3D, SphericalCoordinate, VertexId, CanonicalGeometryState, RepresentationState } from './types';
import { distance3D, createPoint3D } from './geometryState';
import { getResolvedTolerances } from './tolerances';
import { CANONICAL_VERTICES } from './topology';

/**
 * Converts Spherical coordinates (phi, lambda) on sphere S^2(O, R) to Cartesian Point3D.
 * phi: latitude in radians [-pi/2, pi/2]
 * lambda: longitude in radians [0, 2pi)
 */
export function sphericalToCartesian(sphere: Sphere3D, coord: SphericalCoordinate): Point3D {
  const { phi, lambda } = coord;
  const R = sphere.radius;
  const cosPhi = Math.cos(phi);

  const x = sphere.center.x + R * cosPhi * Math.cos(lambda);
  const y = sphere.center.y + R * cosPhi * Math.sin(lambda);
  const z = sphere.center.z + R * Math.sin(phi);

  return createPoint3D(x, y, z);
}

/**
 * Converts Cartesian Point3D to Spherical coordinates.
 * REJECTS points not on the sphere surface without silent projection.
 */
export function cartesianToSpherical(sphere: Sphere3D, point: Point3D): SphericalCoordinate {
  const tol = getResolvedTolerances(sphere.radius);
  const dist = distance3D(point, sphere.center);
  const deviation = Math.abs(dist - sphere.radius);

  if (deviation > tol.epsSphere) {
    throw new Error(
      `Point (${point.x}, ${point.y}, ${point.z}) is not on sphere surface. Distance: ${dist}, Radius: ${sphere.radius}, Deviation: ${deviation} > epsSphere: ${tol.epsSphere}. Silent projection is forbidden.`
    );
  }

  const relX = point.x - sphere.center.x;
  const relY = point.y - sphere.center.y;
  const relZ = point.z - sphere.center.z;

  // Clamped ratio for arcsin stability
  const sinPhi = Math.max(-1, Math.min(1, relZ / sphere.radius));
  const phi = Math.asin(sinPhi);

  // Check pole singularity
  const isPole = Math.abs(Math.abs(phi) - Math.PI / 2) <= tol.epsAngle;

  let lambda: number;
  if (isPole) {
    // Canonical convention: at poles, lambda = 0
    lambda = 0.0;
  } else {
    lambda = Math.atan2(relY, relX);
    if (lambda < 0) {
      lambda += 2 * Math.PI;
    }
  }

  return Object.freeze({ phi, lambda });
}

/**
 * Creates a RepresentationState from CanonicalGeometryState without mutating canonical state.
 */
export function deriveRepresentationState(
  state: CanonicalGeometryState,
  activeSystem: 'CARTESIAN' | 'SPHERICAL' = 'CARTESIAN'
): RepresentationState {
  const sphericalCoordinates: Record<VertexId, SphericalCoordinate> = {} as any;

  for (const id of CANONICAL_VERTICES) {
    sphericalCoordinates[id] = cartesianToSpherical(state.sphere, state.vertices[id]);
  }

  return Object.freeze({
    activeSystem,
    sphericalCoordinates: Object.freeze(sphericalCoordinates),
  });
}
