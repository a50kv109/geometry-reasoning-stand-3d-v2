/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Local Vertex Geometry (LVG) Layer — 0.2.2-dynamic-reasoning-final
 * 
 * Strict architectural adherence:
 * - Pure deterministic representation derived from CanonicalGeometryState.
 * - Adheres strictly to the centralized tolerance model of Package 06.
 * - Solid angle computed via spherical excess (Oosterom-Strackee / atan2).
 * - Gram matrix, planar angles, dihedral angles, unit edge directions.
 * - Degeneracy classification D0-D5 without hardcoded epsilon.
 */

import { Point3D, VertexId, CanonicalGeometryState } from './types';
import { getResolvedTolerances } from './tolerances';
import { dotProduct3D, crossProduct3D, vectorSubtract3D, vectorNorm3D } from './metrics';

export type LVGDegeneracy = 
  | 'D0_VALID'
  | 'D1_COLLINEAR_EDGE'
  | 'D2_COPLANAR_EDGES'
  | 'D3_NEAR_DEGENERATE'
  | 'D4_INVERTED_ORIENTATION'
  | 'D5_NUMERICAL_FAULT';

export interface LVGIncidentEdge {
  readonly targetId: VertexId;
  readonly vector: Point3D;
  readonly length: number;
  readonly unitDirection: Point3D;
}

export interface LVG {
  readonly vertexId: VertexId;
  readonly parentId?: string;
  readonly position: Point3D;
  readonly incidentTargets: readonly [VertexId, VertexId, VertexId];
  readonly incidentEdges: Readonly<Record<VertexId, LVGIncidentEdge>>;
  readonly gramMatrix: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number]
  ];
  readonly gramDeterminant: number;
  readonly planarAngles: Readonly<Record<string, number>>;
  readonly dihedralAngles: Readonly<Record<string, number>>;
  readonly solidAngle: number;
  readonly orientation: 'POSITIVE' | 'NEGATIVE' | 'COPLANAR';
  readonly degeneracy: LVGDegeneracy;
  readonly isValid: boolean;
}

const VERTEX_NEIGHBORS: Record<VertexId, readonly [VertexId, VertexId, VertexId]> = {
  A: ['B', 'D', 'C'],
  B: ['A', 'C', 'D'],
  C: ['A', 'D', 'B'],
  D: ['A', 'B', 'C'],
};

/**
 * Computes the Local Vertex Geometry for a specific vertex in the canonical tetrahedron.
 * Signature takes exactly 3 arguments: (state, vertexId, parentId?)
 */
export function computeLVG(
  state: CanonicalGeometryState,
  vertexId: VertexId,
  parentId?: string
): LVG {
  const R = state.sphere.radius;
  const tol = getResolvedTolerances(R);
  const vPos = state.vertices[vertexId];
  const neighbors = VERTEX_NEIGHBORS[vertexId];

  // 1. Calculate incident edge vectors and unit directions
  const incidentEdgesMap: Partial<Record<VertexId, LVGIncidentEdge>> = {};
  const unitDirs: Point3D[] = [];
  let hasCollinear = false;
  let hasNumericalFault = false;

  for (const nId of neighbors) {
    const nPos = state.vertices[nId];
    const vec = vectorSubtract3D(nPos, vPos);
    const len = vectorNorm3D(vec);

    if (!Number.isFinite(len) || !Number.isFinite(vec.x) || !Number.isFinite(vec.y) || !Number.isFinite(vec.z)) {
      hasNumericalFault = true;
    }

    if (len < tol.epsCoincident) {
      hasCollinear = true;
    }

    const uDir: Point3D = len > tol.epsCoincident
      ? { x: vec.x / len, y: vec.y / len, z: vec.z / len }
      : { x: 0, y: 0, z: 0 };

    unitDirs.push(uDir);
    incidentEdgesMap[nId] = {
      targetId: nId,
      vector: vec,
      length: len,
      unitDirection: uDir,
    };
  }

  // 2. Gram matrix: G_ij = u_i · u_j
  const G: [
    [number, number, number],
    [number, number, number],
    [number, number, number]
  ] = [
    [dotProduct3D(unitDirs[0], unitDirs[0]), dotProduct3D(unitDirs[0], unitDirs[1]), dotProduct3D(unitDirs[0], unitDirs[2])],
    [dotProduct3D(unitDirs[1], unitDirs[0]), dotProduct3D(unitDirs[1], unitDirs[1]), dotProduct3D(unitDirs[1], unitDirs[2])],
    [dotProduct3D(unitDirs[2], unitDirs[0]), dotProduct3D(unitDirs[2], unitDirs[1]), dotProduct3D(unitDirs[2], unitDirs[2])],
  ];

  // 3. Scalar triple product / determinant
  const cross12 = crossProduct3D(unitDirs[1], unitDirs[2]);
  const tripleProduct = dotProduct3D(unitDirs[0], cross12);
  const gramDet = tripleProduct * tripleProduct;

  // 4. Orientation
  let orientation: 'POSITIVE' | 'NEGATIVE' | 'COPLANAR' = 'COPLANAR';
  if (Math.abs(tripleProduct) > tol.epsFinite) {
    orientation = tripleProduct > 0 ? 'POSITIVE' : 'NEGATIVE';
  }

  // 5. Planar angles (radians)
  const planarAngles: Record<string, number> = {};
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const dot = Math.max(-1, Math.min(1, dotProduct3D(unitDirs[i], unitDirs[j])));
      const key = `${neighbors[i]}-${neighbors[j]}`;
      planarAngles[key] = Math.acos(dot);
    }
  }

  // 6. Face normals and dihedral angles
  const faceNormals: Point3D[] = [];
  const faceNormal1 = crossProduct3D(unitDirs[0], unitDirs[1]);
  const faceNormal2 = crossProduct3D(unitDirs[1], unitDirs[2]);
  const faceNormal3 = crossProduct3D(unitDirs[2], unitDirs[0]);

  const fnLens = [
    vectorNorm3D(faceNormal1),
    vectorNorm3D(faceNormal2),
    vectorNorm3D(faceNormal3),
  ];

  const dihedralAngles: Record<string, number> = {};
  if (fnLens[0] > tol.epsFinite && fnLens[1] > tol.epsFinite) {
    const fn1Norm: Point3D = { x: faceNormal1.x / fnLens[0], y: faceNormal1.y / fnLens[0], z: faceNormal1.z / fnLens[0] };
    const fn2Norm: Point3D = { x: faceNormal2.x / fnLens[1], y: faceNormal2.y / fnLens[1], z: faceNormal2.z / fnLens[1] };
    const cosDihedral = Math.max(-1, Math.min(1, dotProduct3D(fn1Norm, fn2Norm)));
    dihedralAngles[`${neighbors[0]}-${neighbors[1]}_${neighbors[1]}-${neighbors[2]}`] = Math.PI - Math.acos(cosDihedral);
  }

  // 7. Solid angle via Oosterom & Strackee formula
  // tan(Omega/2) = |u1 · (u2 x u3)| / (1 + u1·u2 + u2·u3 + u3·u1)
  const num = Math.abs(tripleProduct);
  const denom = 1 + dotProduct3D(unitDirs[0], unitDirs[1]) + dotProduct3D(unitDirs[1], unitDirs[2]) + dotProduct3D(unitDirs[2], unitDirs[0]);
  let solidAngle = 0;
  if (!hasCollinear && !hasNumericalFault) {
    solidAngle = 2 * Math.atan2(num, denom);
    if (solidAngle < 0) {
      solidAngle += 2 * Math.PI;
    }
  }

  // 8. Degeneracy classification
  let degeneracy: LVGDegeneracy = 'D0_VALID';
  if (hasNumericalFault) {
    degeneracy = 'D5_NUMERICAL_FAULT';
  } else if (hasCollinear) {
    degeneracy = 'D1_COLLINEAR_EDGE';
  } else if (Math.abs(tripleProduct) < tol.epsFinite) {
    degeneracy = 'D2_COPLANAR_EDGES';
  } else if (Math.abs(tripleProduct) < tol.epsRegularity * 1e-2) {
    degeneracy = 'D3_NEAR_DEGENERATE';
  } else if (tripleProduct < 0) {
    degeneracy = 'D4_INVERTED_ORIENTATION';
  }

  const isValid = degeneracy === 'D0_VALID' || degeneracy === 'D3_NEAR_DEGENERATE';

  return {
    vertexId,
    parentId,
    position: vPos,
    incidentTargets: neighbors,
    incidentEdges: incidentEdgesMap as Readonly<Record<VertexId, LVGIncidentEdge>>,
    gramMatrix: G,
    gramDeterminant: gramDet,
    planarAngles,
    dihedralAngles,
    solidAngle,
    orientation,
    degeneracy,
    isValid,
  };
}
