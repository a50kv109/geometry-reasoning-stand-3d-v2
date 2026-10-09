/**
 * FEDOROV SYMMETRY STAND (FSS)
 * Symmetry Operations, Transformations & Invariance Predicates
 * 
 * Pure deterministic mathematics for isometries in O(3) ⋊ ℝ³:
 * - Central Inversion: x' = 2c - x (or -x about origin)
 * - Axis Rotation: Rodrigues' formula around arbitrary unit axis
 * - Plane Reflection: x' = x - 2((x - p0) · n)n
 * - Translation: x' = x + t
 * - Vertex set coincidence & Hausdorff distance calculation
 */

import { Point3D, CanonicalGeometryState, VertexId } from './types';
import { createPoint3D, distance3D } from './geometryState';
import { CANONICAL_VERTICES } from './topology';

export interface Matrix3x3 {
  readonly m00: number; readonly m01: number; readonly m02: number;
  readonly m10: number; readonly m11: number; readonly m12: number;
  readonly m20: number; readonly m21: number; readonly m22: number;
}

export interface AffineIsometry3D {
  readonly type: 'CENTRAL_INVERSION' | 'AXIS_ROTATION' | 'PLANE_REFLECTION' | 'TRANSLATION' | 'IDENTITY';
  readonly description: string;
  readonly rotationMatrix: Matrix3x3;
  readonly translation: Point3D;
}

export const IDENTITY_MATRIX: Matrix3x3 = Object.freeze({
  m00: 1, m01: 0, m02: 0,
  m10: 0, m11: 1, m12: 0,
  m20: 0, m21: 0, m22: 1,
});

export const ZERO_VECTOR: Point3D = Object.freeze({ x: 0, y: 0, z: 0 });

/**
 * Multiplies a 3x3 matrix with a 3D point and adds translation:
 * p' = M * p + t
 */
export function applyAffineIsometry(isometry: AffineIsometry3D, p: Point3D): Point3D {
  const m = isometry.rotationMatrix;
  const t = isometry.translation;
  const x = m.m00 * p.x + m.m01 * p.y + m.m02 * p.z + t.x;
  const y = m.m10 * p.x + m.m11 * p.y + m.m12 * p.z + t.y;
  const z = m.m20 * p.x + m.m21 * p.y + m.m22 * p.z + t.z;
  return createPoint3D(x, y, z);
}

/**
 * Creates Central Inversion isometry about center c:
 * x' = 2*c - x
 * Matrix is -I, translation is 2*c.
 */
export function createCentralInversion(center: Point3D = ZERO_VECTOR): AffineIsometry3D {
  return Object.freeze({
    type: 'CENTRAL_INVERSION',
    description: `Central inversion about point (${center.x.toFixed(4)}, ${center.y.toFixed(4)}, ${center.z.toFixed(4)})`,
    rotationMatrix: Object.freeze({
      m00: -1, m01: 0,  m02: 0,
      m10: 0,  m11: -1, m12: 0,
      m20: 0,  m21: 0,  m22: -1,
    }),
    translation: Object.freeze({
      x: 2 * center.x,
      y: 2 * center.y,
      z: 2 * center.z,
    }),
  });
}

/**
 * Creates Rotation isometry around an arbitrary axis passing through origin/center:
 * Uses Rodrigues' rotation formula.
 */
export function createAxisRotation(
  axis: Point3D,
  angleRad: number,
  origin: Point3D = ZERO_VECTOR
): AffineIsometry3D {
  // Normalize axis
  const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
  if (len < 1e-12) {
    throw new Error('Rotation axis length must be non-zero.');
  }
  const u = { x: axis.x / len, y: axis.y / len, z: axis.z / len };
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const oneMinusCos = 1 - cos;

  const m00 = cos + u.x * u.x * oneMinusCos;
  const m01 = u.x * u.y * oneMinusCos - u.z * sin;
  const m02 = u.x * u.z * oneMinusCos + u.y * sin;

  const m10 = u.y * u.x * oneMinusCos + u.z * sin;
  const m11 = cos + u.y * u.y * oneMinusCos;
  const m12 = u.y * u.z * oneMinusCos - u.x * sin;

  const m20 = u.z * u.x * oneMinusCos - u.y * sin;
  const m21 = u.z * u.y * oneMinusCos + u.x * sin;
  const m22 = cos + u.z * u.z * oneMinusCos;

  // Account for non-origin center: R * (p - origin) + origin = R*p + (origin - R*origin)
  const tx = origin.x - (m00 * origin.x + m01 * origin.y + m02 * origin.z);
  const ty = origin.y - (m10 * origin.x + m11 * origin.y + m12 * origin.z);
  const tz = origin.z - (m20 * origin.x + m21 * origin.y + m22 * origin.z);

  const deg = (angleRad * 180 / Math.PI).toFixed(1);
  return Object.freeze({
    type: 'AXIS_ROTATION',
    description: `Rotation by ${deg}° around axis (${u.x.toFixed(3)}, ${u.y.toFixed(3)}, ${u.z.toFixed(3)})`,
    rotationMatrix: Object.freeze({ m00, m01, m02, m10, m11, m12, m20, m21, m22 }),
    translation: Object.freeze({ x: tx, y: ty, z: tz }),
  });
}

/**
 * Creates Plane Reflection across a plane with unit normal n passing through p0:
 * x' = x - 2 * ((x - p0) · n) * n
 */
export function createPlaneReflection(
  planeNormal: Point3D,
  planePoint: Point3D = ZERO_VECTOR
): AffineIsometry3D {
  const len = Math.sqrt(planeNormal.x * planeNormal.x + planeNormal.y * planeNormal.y + planeNormal.z * planeNormal.z);
  if (len < 1e-12) {
    throw new Error('Plane normal vector must be non-zero.');
  }
  const n = { x: planeNormal.x / len, y: planeNormal.y / len, z: planeNormal.z / len };

  // Reflection matrix: I - 2 * n * n^T
  const m00 = 1 - 2 * n.x * n.x;
  const m01 = -2 * n.x * n.y;
  const m02 = -2 * n.x * n.z;

  const m10 = -2 * n.y * n.x;
  const m11 = 1 - 2 * n.y * n.y;
  const m12 = -2 * n.y * n.z;

  const m20 = -2 * n.z * n.x;
  const m21 = -2 * n.z * n.y;
  const m22 = 1 - 2 * n.z * n.z;

  const dot = planePoint.x * n.x + planePoint.y * n.y + planePoint.z * n.z;
  const tx = 2 * dot * n.x;
  const ty = 2 * dot * n.y;
  const tz = 2 * dot * n.z;

  return Object.freeze({
    type: 'PLANE_REFLECTION',
    description: `Plane reflection across plane normal (${n.x.toFixed(3)}, ${n.y.toFixed(3)}, ${n.z.toFixed(3)})`,
    rotationMatrix: Object.freeze({ m00, m01, m02, m10, m11, m12, m20, m21, m22 }),
    translation: Object.freeze({ x: tx, y: ty, z: tz }),
  });
}

/**
 * Applies isometry to all vertices of a CanonicalGeometryState.
 * Returns a new record of vertices.
 */
export function transformVertices(
  vertices: Readonly<Record<VertexId, Point3D>>,
  isometry: AffineIsometry3D
): Record<VertexId, Point3D> {
  const result: Record<VertexId, Point3D> = {} as any;
  for (const id of CANONICAL_VERTICES) {
    result[id] = applyAffineIsometry(isometry, vertices[id]);
  }
  return result;
}

export interface VertexSetComparison {
  /** Maximum distance from any transformed vertex to its closest original vertex (Hausdorff-like forward) */
  readonly maxDisplacement: number;
  /** Mean displacement over all vertices */
  readonly meanDisplacement: number;
  /** Pairwise matching between original and transformed points */
  readonly matches: readonly {
    readonly originalId: VertexId;
    readonly mappedPoint: Point3D;
    readonly closestOriginalId: VertexId;
    readonly distance: number;
  }[];
  /** Whether the set of vertices coincides within tolerance */
  readonly isInvariant: boolean;
}

/**
 * Checks if the set of transformed vertices coincides with the original set of vertices.
 * Tests if for each vertex v' in V', min_{u in V} ||v' - u|| <= tolerance,
 * and bijective matching holds.
 */
export function compareVertexSets(
  original: Readonly<Record<VertexId, Point3D>>,
  transformed: Readonly<Record<VertexId, Point3D>>,
  tolerance: number
): VertexSetComparison {
  const ids = CANONICAL_VERTICES;
  const matches = [];
  let maxDisplacement = 0;
  let totalDisplacement = 0;
  const usedTargets = new Set<VertexId>();

  for (const id of ids) {
    const pt = transformed[id];
    let minD = Infinity;
    let closestId: VertexId = 'A';

    for (const origId of ids) {
      const d = distance3D(pt, original[origId]);
      if (d < minD) {
        minD = d;
        closestId = origId;
      }
    }

    if (minD > maxDisplacement) {
      maxDisplacement = minD;
    }
    totalDisplacement += minD;
    usedTargets.add(closestId);

    matches.push({
      originalId: id,
      mappedPoint: pt,
      closestOriginalId: closestId,
      distance: minD,
    });
  }

  // Bijective check: all vertices in original set must be matched
  const isBijective = usedTargets.size === ids.length;
  const isInvariant = maxDisplacement <= tolerance && isBijective;

  return Object.freeze({
    maxDisplacement,
    meanDisplacement: totalDisplacement / ids.length,
    matches: Object.freeze(matches),
    isInvariant,
  });
}

/**
 * Multiplies two 3x3 matrices: C = A * B
 */
export function multiplyMatrices(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  return Object.freeze({
    m00: a.m00 * b.m00 + a.m01 * b.m10 + a.m02 * b.m20,
    m01: a.m00 * b.m01 + a.m01 * b.m11 + a.m02 * b.m21,
    m02: a.m00 * b.m02 + a.m01 * b.m12 + a.m02 * b.m22,

    m10: a.m10 * b.m00 + a.m11 * b.m10 + a.m12 * b.m20,
    m11: a.m10 * b.m01 + a.m11 * b.m11 + a.m12 * b.m21,
    m12: a.m10 * b.m02 + a.m11 * b.m12 + a.m12 * b.m22,

    m20: a.m20 * b.m00 + a.m21 * b.m10 + a.m22 * b.m20,
    m21: a.m20 * b.m01 + a.m21 * b.m11 + a.m22 * b.m21,
    m22: a.m20 * b.m02 + a.m21 * b.m12 + a.m22 * b.m22,
  });
}

/**
 * Combines two affine isometries: (T2 ∘ T1)(p) = T2(T1(p))
 */
export function combineIsometries(
  t2: AffineIsometry3D,
  t1: AffineIsometry3D,
  description?: string
): AffineIsometry3D {
  const rot = multiplyMatrices(t2.rotationMatrix, t1.rotationMatrix);
  // translation = R2 * t1 + t2
  const r2 = t2.rotationMatrix;
  const p1 = t1.translation;
  const tx = r2.m00 * p1.x + r2.m01 * p1.y + r2.m02 * p1.z + t2.translation.x;
  const ty = r2.m10 * p1.x + r2.m11 * p1.y + r2.m12 * p1.z + t2.translation.y;
  const tz = r2.m20 * p1.x + r2.m21 * p1.y + r2.m22 * p1.z + t2.translation.z;

  return Object.freeze({
    type: t2.type,
    description: description ?? `${t2.description} after ${t1.description}`,
    rotationMatrix: rot,
    translation: Object.freeze({ x: tx, y: ty, z: tz }),
  });
}

/**
 * Creates an improper rotation S_n: rotation about axis by angle,
 * followed by plane reflection across plane perpendicular to axis through origin/center.
 */
export function createImproperRotation(
  axis: Point3D,
  angleRad: number,
  origin: Point3D = ZERO_VECTOR
): AffineIsometry3D {
  const rot = createAxisRotation(axis, angleRad, origin);
  const refl = createPlaneReflection(axis, origin);
  const deg = (angleRad * 180 / Math.PI).toFixed(1);
  return combineIsometries(refl, rot, `Improper rotation S: ${deg}° rot followed by normal reflection`);
}

/**
 * Evaluates candidate symmetry operations on a tetrahedral canonical geometry state.
 * Returns evaluated operations and completeness classification.
 */
export interface SymmetryEvaluationResult {
  readonly testedOperations: readonly {
    readonly operation: AffineIsometry3D;
    readonly isInvariant: boolean;
    readonly maxDisplacement: number;
    readonly classification: 'VERIFIED' | 'REFUTED';
  }[];
  readonly inversionInvariant: boolean;
  readonly inversionDisplacement: number;
  readonly invariantCount: number;
  readonly totalTested: number;
}

export function evaluateTetrahedralCandidateSymmetries(
  vertices: Readonly<Record<VertexId, Point3D>>,
  tolerance: number,
  center: Point3D = ZERO_VECTOR,
  fullGroup: boolean = false
): SymmetryEvaluationResult {
  const ops: AffineIsometry3D[] = [];

  // Helper vectors
  const A = vertices.A;
  const B = vertices.B;
  const C = vertices.C;
  const D = vertices.D;

  const mid = (p1: Point3D, p2: Point3D): Point3D => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: (p1.z + p2.z) / 2,
  });

  const sub = (p1: Point3D, p2: Point3D): Point3D => ({
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  });

  const cross = (a: Point3D, b: Point3D): Point3D => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  });

  // 1. Identity
  ops.push(Object.freeze({
    type: 'IDENTITY' as any,
    description: 'Identity operation E',
    rotationMatrix: IDENTITY_MATRIX,
    translation: ZERO_VECTOR,
  }));

  // 2. Central inversion (to verify/refute center of symmetry)
  const inversionOp = createCentralInversion(center);

  // 3. Four 3-fold C3 axes (through vertex and opposite face centroid)
  const c3Axes = [
    { label: 'A-(BCD)', axis: sub(A, center) },
    { label: 'B-(ACD)', axis: sub(B, center) },
    { label: 'C-(ABD)', axis: sub(C, center) },
    { label: 'D-(ABC)', axis: sub(D, center) },
  ];

  for (const { label, axis } of c3Axes) {
    ops.push(createAxisRotation(axis, (2 * Math.PI) / 3, center)); // +120°
    if (fullGroup) {
      ops.push(createAxisRotation(axis, (4 * Math.PI) / 3, center)); // -120° / 240°
    }
  }

  // 4. Three 2-fold C2 axes (joining midpoints of opposite edges)
  const c2Axes = [
    { label: 'AB-CD', axis: sub(mid(A, B), center) },
    { label: 'AC-BD', axis: sub(mid(A, C), center) },
    { label: 'AD-BC', axis: sub(mid(A, D), center) },
  ];

  for (const { label, axis } of c2Axes) {
    ops.push(createAxisRotation(axis, Math.PI, center)); // 180°
  }

  // 5. Six mirror planes sigma_d (containing edge and bisecting opposite edge)
  if (fullGroup) {
    const planes = [
      { p1: A, p2: B, p3: mid(C, D) },
      { p1: A, p2: C, p3: mid(B, D) },
      { p1: A, p2: D, p3: mid(B, C) },
      { p1: B, p2: C, p3: mid(A, D) },
      { p1: B, p2: D, p3: mid(A, C) },
      { p1: C, p2: D, p3: mid(A, B) },
    ];

    for (const { p1, p2, p3 } of planes) {
      const v1 = sub(p2, p1);
      const v2 = sub(p3, p1);
      const normal = cross(v1, v2);
      try {
        ops.push(createPlaneReflection(normal, center));
      } catch {
        // degenerate normal skipped
      }
    }

    // 6. Six improper rotations S4 (+/- 90° about the three C2 axes)
    for (const { label, axis } of c2Axes) {
      ops.push(createImproperRotation(axis, Math.PI / 2, center));
      ops.push(createImproperRotation(axis, -Math.PI / 2, center));
    }
  }

  // Test all operations
  const evaluated = [];
  let invariantCount = 0;

  for (const op of ops) {
    const transformed = transformVertices(vertices, op);
    const cmp = compareVertexSets(vertices, transformed, tolerance);
    if (cmp.isInvariant) {
      invariantCount++;
    }
    evaluated.push({
      operation: op,
      isInvariant: cmp.isInvariant,
      maxDisplacement: cmp.maxDisplacement,
      classification: cmp.isInvariant ? ('VERIFIED' as const) : ('REFUTED' as const),
    });
  }

  // Inversion test
  const invTrans = transformVertices(vertices, inversionOp);
  const invCmp = compareVertexSets(vertices, invTrans, tolerance);

  return {
    testedOperations: Object.freeze(evaluated),
    inversionInvariant: invCmp.isInvariant,
    inversionDisplacement: invCmp.maxDisplacement,
    invariantCount,
    totalTested: ops.length,
  };
}
