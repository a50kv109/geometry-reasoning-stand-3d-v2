/**
 * PERSISTENT TETRAHEDRAL TOPOLOGY (M1.3, M1.4)
 * 
 * Invariants:
 * - 4 Vertices: A, B, C, D
 * - 6 Edges: AB, AC, AD, BC, BD, CD
 * - 4 Faces: ABC, ABD, ACD, BCD
 * 
 * Topology NEVER changes when vertices move.
 * Labeled identities are persistent and MUST NOT be sorted or re-indexed.
 */

import { VertexId, EdgeId, FaceId, TopologicalEdge, TopologicalFace } from './types';

export const CANONICAL_VERTICES: readonly VertexId[] = Object.freeze(['A', 'B', 'C', 'D']);

export const CANONICAL_EDGES: readonly TopologicalEdge[] = Object.freeze([
  Object.freeze({ id: 'AB', v1: 'A', v2: 'B' }),
  Object.freeze({ id: 'AC', v1: 'A', v2: 'C' }),
  Object.freeze({ id: 'AD', v1: 'A', v2: 'D' }),
  Object.freeze({ id: 'BC', v1: 'B', v2: 'C' }),
  Object.freeze({ id: 'BD', v1: 'B', v2: 'D' }),
  Object.freeze({ id: 'CD', v1: 'C', v2: 'D' }),
]);

export const CANONICAL_FACES: readonly TopologicalFace[] = Object.freeze([
  Object.freeze({
    id: 'ABC',
    vertices: Object.freeze(['A', 'B', 'C'] as const),
    edges: Object.freeze(['AB', 'BC', 'AC'] as const),
  }),
  Object.freeze({
    id: 'ABD',
    vertices: Object.freeze(['A', 'B', 'D'] as const),
    edges: Object.freeze(['AB', 'BD', 'AD'] as const),
  }),
  Object.freeze({
    id: 'ACD',
    vertices: Object.freeze(['A', 'C', 'D'] as const),
    edges: Object.freeze(['AC', 'CD', 'AD'] as const),
  }),
  Object.freeze({
    id: 'BCD',
    vertices: Object.freeze(['B', 'C', 'D'] as const),
    edges: Object.freeze(['BC', 'CD', 'BD'] as const),
  }),
]);

export const EDGE_MAP: Readonly<Record<EdgeId, TopologicalEdge>> = Object.freeze(
  CANONICAL_EDGES.reduce((acc, edge) => {
    acc[edge.id] = edge;
    return acc;
  }, {} as Record<EdgeId, TopologicalEdge>)
);

export const FACE_MAP: Readonly<Record<FaceId, TopologicalFace>> = Object.freeze(
  CANONICAL_FACES.reduce((acc, face) => {
    acc[face.id] = face;
    return acc;
  }, {} as Record<FaceId, TopologicalFace>)
);

/**
 * Returns edges incident to a given vertex.
 */
export function getIncidentEdges(vertexId: VertexId): readonly EdgeId[] {
  return CANONICAL_EDGES.filter(e => e.v1 === vertexId || e.v2 === vertexId).map(e => e.id);
}

/**
 * Returns faces incident to a given vertex.
 */
export function getIncidentFaces(vertexId: VertexId): readonly FaceId[] {
  return CANONICAL_FACES.filter(f => f.vertices.includes(vertexId)).map(f => f.id);
}

/**
 * Returns the face opposite to a vertex.
 */
export function getOppositeFace(vertexId: VertexId): FaceId {
  switch (vertexId) {
    case 'A': return 'BCD';
    case 'B': return 'ACD';
    case 'C': return 'ABD';
    case 'D': return 'ABC';
  }
}

/**
 * Returns the edge opposite to a given edge.
 */
export function getOppositeEdge(edgeId: EdgeId): EdgeId {
  switch (edgeId) {
    case 'AB': return 'CD';
    case 'CD': return 'AB';
    case 'AC': return 'BD';
    case 'BD': return 'AC';
    case 'AD': return 'BC';
    case 'BC': return 'AD';
  }
}
