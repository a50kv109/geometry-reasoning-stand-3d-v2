/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Directed Local Vertex Manifold (DLVM) Layer — 0.2.2-dynamic-reasoning-final
 * 
 * Strict architectural adherence:
 * - Pure deterministic representation derived from CanonicalGeometryState.
 * - LSM representation for local geometric reasoning.
 * - Shared edge anti-parallelism verification: u_AB^(A) = -u_BA^(B).
 * - Tolerance comparison strictly through Package 06 epsFinite (no hardcoded eps).
 */

import { VertexId, EdgeId, FaceId, CanonicalGeometryState, Point3D } from './types';
import { LVG, computeLVG } from './lvg';
import { getResolvedTolerances } from './tolerances';
import { vectorNorm3D } from './metrics';

export interface DLVMSharedEdge {
  readonly edgeId: EdgeId;
  readonly targetVertex: VertexId;
  readonly unitDirection: Point3D;
}

export interface DLVM {
  readonly vertexId: VertexId;
  readonly lvg: LVG;
  readonly incidentEdges: readonly EdgeId[];
  readonly incidentFaces: readonly FaceId[];
  readonly representation: 'LSM_DIRECTED';
  readonly sharedEdges: Readonly<Record<VertexId, DLVMSharedEdge>>;
}

const VERTEX_EDGES: Record<VertexId, readonly EdgeId[]> = {
  A: ['AB', 'AC', 'AD'],
  B: ['AB', 'BC', 'BD'],
  C: ['AC', 'BC', 'CD'],
  D: ['AD', 'BD', 'CD'],
};

const VERTEX_FACES: Record<VertexId, readonly FaceId[]> = {
  A: ['ABC', 'ABD', 'ACD'],
  B: ['ABC', 'ABD', 'BCD'],
  C: ['ABC', 'ACD', 'BCD'],
  D: ['ABD', 'ACD', 'BCD'],
};

function getCanonicalEdgeId(v1: VertexId, v2: VertexId): EdgeId {
  const sorted = [v1, v2].sort();
  return `${sorted[0]}${sorted[1]}` as EdgeId;
}

/**
 * Computes a Directed Local Vertex Manifold (DLVM) for a given vertex.
 */
export function computeDLVM(state: CanonicalGeometryState, vertexId: VertexId): DLVM {
  const lvg = computeLVG(state, vertexId);
  const incidentEdges = VERTEX_EDGES[vertexId];
  const incidentFaces = VERTEX_FACES[vertexId];

  const sharedEdges: Partial<Record<VertexId, DLVMSharedEdge>> = {};
  for (const targetId of lvg.incidentTargets) {
    const edgeData = lvg.incidentEdges[targetId];
    if (edgeData) {
      sharedEdges[targetId] = {
        edgeId: getCanonicalEdgeId(vertexId, targetId),
        targetVertex: targetId,
        unitDirection: edgeData.unitDirection,
      };
    }
  }

  return {
    vertexId,
    lvg,
    incidentEdges,
    incidentFaces,
    representation: 'LSM_DIRECTED',
    sharedEdges: sharedEdges as Readonly<Record<VertexId, DLVMSharedEdge>>,
  };
}

/**
 * Computes all four DLVMs atomically from the canonical state.
 */
export function computeAllDLVMs(state: CanonicalGeometryState): Record<VertexId, DLVM> {
  return {
    A: computeDLVM(state, 'A'),
    B: computeDLVM(state, 'B'),
    C: computeDLVM(state, 'C'),
    D: computeDLVM(state, 'D'),
  };
}

export interface SharedEdgeVerificationResult {
  readonly valid: boolean;
  readonly maxResidual: number;
  readonly pairs: readonly {
    readonly edge: EdgeId;
    readonly residual: number;
    readonly u1: Point3D;
    readonly u2: Point3D;
  }[];
}

/**
 * Verifies that shared edges across DLVMs are strictly anti-parallel:
 * u_AB^(A) + u_BA^(B) = 0
 * Uses scale-resolved epsFinite from Package 06.
 */
export function verifySharedEdges(
  dlvms: Record<VertexId, DLVM>,
  R: number
): SharedEdgeVerificationResult {
  const tol = getResolvedTolerances(R);
  const edgesToCheck: [VertexId, VertexId][] = [
    ['A', 'B'],
    ['A', 'C'],
    ['A', 'D'],
    ['B', 'C'],
    ['B', 'D'],
    ['C', 'D'],
  ];

  let maxResidual = 0;
  const pairs: { edge: EdgeId; residual: number; u1: Point3D; u2: Point3D }[] = [];

  for (const [v1, v2] of edgesToCheck) {
    const d1 = dlvms[v1];
    const d2 = dlvms[v2];
    const u1 = d1.sharedEdges[v2]?.unitDirection ?? { x: 0, y: 0, z: 0 };
    const u2 = d2.sharedEdges[v1]?.unitDirection ?? { x: 0, y: 0, z: 0 };

    const sum: Point3D = {
      x: u1.x + u2.x,
      y: u1.y + u2.y,
      z: u1.z + u2.z,
    };
    const residual = vectorNorm3D(sum);
    maxResidual = Math.max(maxResidual, residual);

    pairs.push({
      edge: getCanonicalEdgeId(v1, v2),
      residual,
      u1,
      u2,
    });
  }

  // Pure scale-aware check: residual must be smaller than epsFinite
  const valid = maxResidual <= tol.epsFinite;

  return {
    valid,
    maxResidual,
    pairs,
  };
}
