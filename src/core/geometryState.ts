/**
 * CANONICAL 3D GEOMETRY STATE & DETERMINISTIC VALIDATION (M1.1, M1.2, M1.7)
 * 
 * Invariants:
 * - One authoritative representation of the geometric object.
 * - Persistent named vertices A, B, C, D in S^2(O, R).
 * - General inscribed tetrahedron (NOT constrained to be regular).
 * - No silent projection or repair.
 * - Negative signed volume is geometrically valid (VALID_NEGATIVE).
 * - Centralized tolerance scaling applied strictly via Package 06.
 */

import {
  Point3D,
  Sphere3D,
  VertexId,
  CanonicalGeometryState,
  GeometryValidationResult,
  InputGeometryStatus,
  RealizationStatus,
  GeometryValidationCode,
  VertexValidationDetail,
  CoincidenceDetail,
} from './types';
import { CANONICAL_VERTICES } from './topology';
import { getResolvedTolerances } from './tolerances';

/**
 * Creates an immutable 3D Point.
 */
export function createPoint3D(x: number, y: number, z: number): Point3D {
  return Object.freeze({ x, y, z });
}

/**
 * Creates an immutable 3D Sphere.
 */
export function createSphere3D(center: Point3D, radius: number): Sphere3D {
  return Object.freeze({
    center: Object.freeze({ ...center }),
    radius,
  });
}

/**
 * Creates an immutable CanonicalGeometryState.
 */
export function createCanonicalGeometryState(
  sphere: Sphere3D,
  vertices: Record<VertexId, Point3D>
): CanonicalGeometryState {
  return Object.freeze({
    sphere: Object.freeze({
      center: Object.freeze({ ...sphere.center }),
      radius: sphere.radius,
    }),
    vertices: Object.freeze({
      A: Object.freeze({ ...vertices.A }),
      B: Object.freeze({ ...vertices.B }),
      C: Object.freeze({ ...vertices.C }),
      D: Object.freeze({ ...vertices.D }),
    }),
  });
}

/**
 * Computes Euclidean distance between two 3D points.
 */
export function distance3D(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Checks if all coordinates of a Point3D are finite.
 */
export function isPointFinite(p: Point3D): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
}

/**
 * Computes signed volume of a tetrahedron:
 * V_s = (1/6) * (B - A) · ((C - A) × (D - A))
 */
export function computeSignedVolume(vertices: Record<VertexId, Point3D>): number {
  const A = vertices.A;
  const B = vertices.B;
  const C = vertices.C;
  const D = vertices.D;

  const abX = B.x - A.x;
  const abY = B.y - A.y;
  const abZ = B.z - A.z;

  const acX = C.x - A.x;
  const acY = C.y - A.y;
  const acZ = C.z - A.z;

  const adX = D.x - A.x;
  const adY = D.y - A.y;
  const adZ = D.z - A.z;

  // Cross product (C - A) × (D - A)
  const crossX = acY * adZ - acZ * adY;
  const crossY = acZ * adX - acX * adZ;
  const crossZ = acX * adY - acY * adX;

  // Dot product (B - A) · ((C - A) × (D - A))
  const scalarTripleProduct = abX * crossX + abY * crossY + abZ * crossZ;

  return scalarTripleProduct / 6.0;
}

/**
 * Deterministically validates an input geometry configuration according to M1.2 and Package 06.
 * Distinguishes INVALID_INPUT, OUTSIDE_SPHERE, GEOMETRIC_DEGENERACY, and VALID.
 * Does NOT silently project or modify coordinates.
 */
export function validateGeometryState(
  sphere: Sphere3D,
  vertices: Record<VertexId, Point3D>
): GeometryValidationResult {
  // 1. Check Finiteness of Sphere
  if (!isPointFinite(sphere.center) || !Number.isFinite(sphere.radius)) {
    return buildFailureResult(
      InputGeometryStatus.NON_FINITE_INPUT,
      RealizationStatus.DEGENERATE,
      GeometryValidationCode.NON_FINITE_COORDINATES,
      'Sphere center or radius contains non-finite values (NaN or Infinity).'
    );
  }

  // 2. Check Radius Positivity (R > 0)
  if (sphere.radius <= 0) {
    return buildFailureResult(
      InputGeometryStatus.INVALID_INPUT,
      RealizationStatus.DEGENERATE,
      GeometryValidationCode.INVALID_RADIUS,
      `Invalid sphere radius R = ${sphere.radius}. Sphere radius must be strictly positive (R > 0).`
    );
  }

  // Derive Scale-Aware Tolerances
  const tol = getResolvedTolerances(sphere.radius);

  // 3. Check Finiteness and Sphere Membership of All Vertices
  const vertexDetails: Record<VertexId, VertexValidationDetail> = {} as any;
  const outsideVertices: VertexId[] = [];
  const nonFiniteVertices: VertexId[] = [];

  for (const id of CANONICAL_VERTICES) {
    const pt = vertices[id];
    if (!pt || !isPointFinite(pt)) {
      nonFiniteVertices.push(id);
      vertexDetails[id] = {
        vertexId: id,
        point: pt ?? { x: NaN, y: NaN, z: NaN },
        distanceFromCenter: NaN,
        deviationFromSphere: NaN,
        isOnSphere: false,
        isFinite: false,
      };
      continue;
    }

    const dist = distance3D(pt, sphere.center);
    const deviation = Math.abs(dist - sphere.radius);
    const isOnSphere = deviation <= tol.epsSphere;

    if (!isOnSphere) {
      outsideVertices.push(id);
    }

    vertexDetails[id] = {
      vertexId: id,
      point: pt,
      distanceFromCenter: dist,
      deviationFromSphere: deviation,
      isOnSphere,
      isFinite: true,
    };
  }

  if (nonFiniteVertices.length > 0) {
    return {
      isValid: false,
      inputStatus: InputGeometryStatus.NON_FINITE_INPUT,
      realizationStatus: RealizationStatus.DEGENERATE,
      validationCode: GeometryValidationCode.NON_FINITE_COORDINATES,
      message: `Vertex ${nonFiniteVertices.join(', ')} contains non-finite coordinates.`,
      vertexDetails,
      coincidences: [],
    };
  }

  if (outsideVertices.length > 0) {
    return {
      isValid: false,
      inputStatus: InputGeometryStatus.OUTSIDE_SPHERE,
      realizationStatus: RealizationStatus.DEGENERATE,
      validationCode: GeometryValidationCode.VERTEX_OUTSIDE_SPHERE,
      message: `Vertex ${outsideVertices.join(', ')} is outside the sphere S²(O, ${sphere.radius}) beyond tolerance epsSphere = ${tol.epsSphere}.`,
      vertexDetails,
      coincidences: [],
    };
  }

  // 4. Check Vertex Coincidences
  const coincidences: CoincidenceDetail[] = [];
  for (let i = 0; i < CANONICAL_VERTICES.length; i++) {
    for (let j = i + 1; j < CANONICAL_VERTICES.length; j++) {
      const v1 = CANONICAL_VERTICES[i];
      const v2 = CANONICAL_VERTICES[j];
      const d = distance3D(vertices[v1], vertices[v2]);
      if (d <= tol.epsCoincident) {
        coincidences.push({ v1, v2, distance: d });
      }
    }
  }

  if (coincidences.length > 0) {
    const pairs = coincidences.map(c => `${c.v1}-${c.v2} (dist=${c.distance.toExponential(3)})`).join(', ');
    return {
      isValid: false,
      inputStatus: InputGeometryStatus.VALID_INPUT,
      realizationStatus: RealizationStatus.VERTEX_COINCIDENT,
      validationCode: GeometryValidationCode.COINCIDENT_VERTICES,
      message: `Coincident vertices detected: ${pairs} within epsCoincident = ${tol.epsCoincident}.`,
      vertexDetails,
      coincidences,
    };
  }

  // 5. Compute Signed Volume & Realization Status (M1.7)
  const Vs = computeSignedVolume(vertices);

  if (Math.abs(Vs) <= tol.epsVolume) {
    // Coplanar or collinear degeneracy
    return {
      isValid: true, // Structurally valid input on sphere, geometric degeneracy passed to engine
      inputStatus: InputGeometryStatus.VALID_INPUT,
      realizationStatus: RealizationStatus.DEGENERATE,
      validationCode: GeometryValidationCode.COPLANAR_VERTICES,
      message: `Vertices are coplanar/degenerate (|Vs| = ${Math.abs(Vs).toExponential(3)} <= epsVolume = ${tol.epsVolume.toExponential(3)}).`,
      vertexDetails,
      coincidences: [],
      signedVolumeApproximation: Vs,
    };
  }

  const realizationStatus = Vs > 0 ? RealizationStatus.VALID_POSITIVE : RealizationStatus.VALID_NEGATIVE;

  return {
    isValid: true,
    inputStatus: InputGeometryStatus.VALID_INPUT,
    realizationStatus,
    validationCode: GeometryValidationCode.VALID,
    message: `Valid inscribed tetrahedron with ${realizationStatus} (Vs = ${Vs.toFixed(6)}).`,
    vertexDetails,
    coincidences: [],
    signedVolumeApproximation: Vs,
  };
}

function buildFailureResult(
  inputStatus: InputGeometryStatus,
  realizationStatus: RealizationStatus,
  validationCode: GeometryValidationCode,
  message: string
): GeometryValidationResult {
  const emptyDetails: Record<VertexId, VertexValidationDetail> = {
    A: { vertexId: 'A', point: { x: NaN, y: NaN, z: NaN }, distanceFromCenter: NaN, deviationFromSphere: NaN, isOnSphere: false, isFinite: false },
    B: { vertexId: 'B', point: { x: NaN, y: NaN, z: NaN }, distanceFromCenter: NaN, deviationFromSphere: NaN, isOnSphere: false, isFinite: false },
    C: { vertexId: 'C', point: { x: NaN, y: NaN, z: NaN }, distanceFromCenter: NaN, deviationFromSphere: NaN, isOnSphere: false, isFinite: false },
    D: { vertexId: 'D', point: { x: NaN, y: NaN, z: NaN }, distanceFromCenter: NaN, deviationFromSphere: NaN, isOnSphere: false, isFinite: false },
  };

  return {
    isValid: false,
    inputStatus,
    realizationStatus,
    validationCode,
    message,
    vertexDetails: emptyDetails,
    coincidences: [],
  };
}
