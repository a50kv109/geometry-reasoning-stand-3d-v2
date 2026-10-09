/**
 * FEDOROV SYMMETRY STAND (FSS)
 * Geometric Construction Primitives
 * 
 * Strict architectural alignment:
 * - Deterministic, pure constructions with explicit preconditions.
 * - Non-zero volume, finite coordinates, non-coincident vertices enforced.
 * - No silent coordinate repair or arbitrary rounding.
 * - Construction ≠ Verification: constructing an element does not automatically prove a theorem.
 */

import { Point3D, Sphere3D, VertexId, CanonicalGeometryState, GeometryValidationResult } from './types';
import { createPoint3D, createSphere3D, createCanonicalGeometryState, validateGeometryState } from './geometryState';
import { CANONICAL_VERTICES } from './topology';

export interface ConstructionResult {
  readonly success: boolean;
  readonly constructionType: 'REGULAR_TETRAHEDRON' | 'EXPLICIT_TETRAHEDRON' | 'PERTURBED_VERTEX';
  readonly canonicalState?: CanonicalGeometryState;
  readonly validation?: GeometryValidationResult;
  readonly createdElementIds: readonly string[];
  readonly description: string;
  readonly error?: string;
}

/**
 * Constructs a canonical regular tetrahedron inscribed in sphere S²(center, radius).
 * Standard orientation: A at North Pole (0, 0, R), B in xz plane, C and D forming equilateral base at z = -R/3.
 */
export function constructRegularTetrahedron(
  radius: number = 1.0,
  center: Point3D = createPoint3D(0, 0, 0)
): ConstructionResult {
  if (!Number.isFinite(radius) || radius <= 0) {
    return {
      success: false,
      constructionType: 'REGULAR_TETRAHEDRON',
      createdElementIds: [],
      description: 'Failed to construct regular tetrahedron: radius must be finite and strictly positive.',
      error: `Invalid radius: ${radius}`,
    };
  }

  const R = radius;
  const vertices: Record<VertexId, Point3D> = {
    A: createPoint3D(center.x, center.y, center.z + R),
    B: createPoint3D(
      center.x + (2 * Math.sqrt(2) / 3) * R,
      center.y,
      center.z - (1 / 3) * R
    ),
    C: createPoint3D(
      center.x - (Math.sqrt(2) / 3) * R,
      center.y - (Math.sqrt(6) / 3) * R,
      center.z - (1 / 3) * R
    ),
    D: createPoint3D(
      center.x - (Math.sqrt(2) / 3) * R,
      center.y + (Math.sqrt(6) / 3) * R,
      center.z - (1 / 3) * R
    ),
  };

  const sphere = createSphere3D(center, R);
  const validation = validateGeometryState(sphere, vertices);
  const canonicalState = createCanonicalGeometryState(sphere, vertices);

  return {
    success: validation.isValid,
    constructionType: 'REGULAR_TETRAHEDRON',
    canonicalState,
    validation,
    createdElementIds: [...CANONICAL_VERTICES, 'SPHERE_S2'],
    description: `Constructed canonical regular tetrahedron inscribed in S²((${center.x}, ${center.y}, ${center.z}), R=${R}).`,
  };
}

/**
 * Constructs a tetrahedron from explicitly provided 4 vertices A, B, C, D and an optional sphere.
 * If sphere is not supplied, fits a circumscribed sphere S²(center, radius).
 * Rejects non-finite, coincident, or coplanar inputs explicitly without silent repair.
 */
export function constructExplicitTetrahedron(
  inputVertices: Partial<Record<VertexId, Point3D>>,
  explicitSphere?: Sphere3D
): ConstructionResult {
  // 1. Verify all 4 vertices are present
  for (const id of CANONICAL_VERTICES) {
    const pt = inputVertices[id];
    if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y) || !Number.isFinite(pt.z)) {
      return {
        success: false,
        constructionType: 'EXPLICIT_TETRAHEDRON',
        createdElementIds: [],
        description: `Construction rejected: vertex '${id}' is missing or contains non-finite coordinates.`,
        error: `MISSING_OR_NON_FINITE_VERTEX_${id}`,
      };
    }
  }

  const vertices: Record<VertexId, Point3D> = {
    A: createPoint3D(inputVertices.A!.x, inputVertices.A!.y, inputVertices.A!.z),
    B: createPoint3D(inputVertices.B!.x, inputVertices.B!.y, inputVertices.B!.z),
    C: createPoint3D(inputVertices.C!.x, inputVertices.C!.y, inputVertices.C!.z),
    D: createPoint3D(inputVertices.D!.x, inputVertices.D!.y, inputVertices.D!.z),
  };

  // Determine sphere
  let sphere: Sphere3D;
  if (explicitSphere) {
    sphere = createSphere3D(explicitSphere.center, explicitSphere.radius);
  } else {
    // Determine circumscribed sphere from 4 non-coplanar points or default unit sphere
    sphere = fitCircumscribedSphere(vertices) ?? createSphere3D(createPoint3D(0, 0, 0), 1.0);
  }

  const validation = validateGeometryState(sphere, vertices);

  if (!validation.isValid) {
    return {
      success: false,
      constructionType: 'EXPLICIT_TETRAHEDRON',
      createdElementIds: [],
      validation,
      description: `Construction rejected by deterministic validator: ${validation.message}`,
      error: validation.validationCode,
    };
  }

  const canonicalState = createCanonicalGeometryState(sphere, vertices);
  return {
    success: true,
    constructionType: 'EXPLICIT_TETRAHEDRON',
    canonicalState,
    validation,
    createdElementIds: [...CANONICAL_VERTICES, 'SPHERE_S2'],
    description: `Constructed explicit tetrahedron [${validation.realizationStatus}] with 4 verified vertices.`,
  };
}

/**
 * Creates a perturbed state by moving a single vertex by offset (dx, dy, dz).
 * Keeps original state immutable.
 */
export function constructPerturbedTetrahedron(
  baseState: CanonicalGeometryState,
  targetVertex: VertexId,
  offset: Point3D,
  preserveSphereConstraint: boolean = false
): ConstructionResult {
  if (!CANONICAL_VERTICES.includes(targetVertex)) {
    return {
      success: false,
      constructionType: 'PERTURBED_VERTEX',
      createdElementIds: [],
      description: `Unknown vertex '${targetVertex}'. Must be one of ${CANONICAL_VERTICES.join(', ')}.`,
      error: 'INVALID_VERTEX_ID',
    };
  }

  const currentPt = baseState.vertices[targetVertex];
  let newX = currentPt.x + offset.x;
  let newY = currentPt.y + offset.y;
  let newZ = currentPt.z + offset.z;

  if (preserveSphereConstraint) {
    // Project back to sphere surface
    const c = baseState.sphere.center;
    const R = baseState.sphere.radius;
    const dx = newX - c.x;
    const dy = newY - c.y;
    const dz = newZ - c.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 1e-12) {
      return {
        success: false,
        constructionType: 'PERTURBED_VERTEX',
        createdElementIds: [],
        description: 'Perturbed vertex coincides with sphere center; cannot project onto sphere.',
        error: 'DEGENERATE_PROJECTION',
      };
    }
    newX = c.x + (dx / len) * R;
    newY = c.y + (dy / len) * R;
    newZ = c.z + (dz / len) * R;
  }

  const updatedVertices: Record<VertexId, Point3D> = {
    ...baseState.vertices,
    [targetVertex]: createPoint3D(newX, newY, newZ),
  };

  const validation = validateGeometryState(baseState.sphere, updatedVertices);
  const canonicalState = createCanonicalGeometryState(baseState.sphere, updatedVertices);

  return {
    success: true, // We allow creating perturbed states even if degenerate so agents can study symmetry breaking!
    constructionType: 'PERTURBED_VERTEX',
    canonicalState,
    validation,
    createdElementIds: [targetVertex],
    description: `Perturbed vertex ${targetVertex} by offset (${offset.x}, ${offset.y}, ${offset.z})${preserveSphereConstraint ? ' [spherical projected]' : ''}.`,
  };
}

/**
 * Solves circumscribed sphere passing through 4 non-coplanar points.
 * Returns null if points are coplanar or collinear.
 */
function fitCircumscribedSphere(v: Record<VertexId, Point3D>): Sphere3D | null {
  // Using linear system for center (x, y, z):
  // 2 * (v_i - v_A) · c = ||v_i||^2 - ||v_A||^2  for i in {B, C, D}
  const A = v.A;
  const B = v.B;
  const C = v.C;
  const D = v.D;

  const sqA = A.x * A.x + A.y * A.y + A.z * A.z;
  const sqB = B.x * B.x + B.y * B.y + B.z * B.z;
  const sqC = C.x * C.x + C.y * C.y + C.z * C.z;
  const sqD = D.x * D.x + D.y * D.y + D.z * D.z;

  const m11 = B.x - A.x; const m12 = B.y - A.y; const m13 = B.z - A.z; const rhs1 = 0.5 * (sqB - sqA);
  const m21 = C.x - A.x; const m22 = C.y - A.y; const m23 = C.z - A.z; const rhs2 = 0.5 * (sqC - sqA);
  const m31 = D.x - A.x; const m32 = D.y - A.y; const m33 = D.z - A.z; const rhs3 = 0.5 * (sqD - sqA);

  const det = m11 * (m22 * m33 - m23 * m32) -
              m12 * (m21 * m33 - m23 * m31) +
              m13 * (m21 * m32 - m22 * m31);

  if (Math.abs(det) < 1e-10) {
    return null; // Coplanar
  }

  const cx = (rhs1 * (m22 * m33 - m23 * m32) - m12 * (rhs2 * m33 - m23 * rhs3) + m13 * (rhs2 * m32 - m22 * rhs3)) / det;
  const cy = (m11 * (rhs2 * m33 - m23 * rhs3) - rhs1 * (m21 * m33 - m23 * m31) + m13 * (m21 * rhs3 - rhs2 * m31)) / det;
  const cz = (m11 * (m22 * rhs3 - rhs2 * m32) - m12 * (m21 * rhs3 - rhs2 * m31) + rhs1 * (m21 * m32 - m22 * m31)) / det;

  const center = createPoint3D(cx, cy, cz);
  const R = Math.sqrt((A.x - cx) ** 2 + (A.y - cy) ** 2 + (A.z - cz) ** 2);

  return createSphere3D(center, R);
}
