/**
 * DERIVED GEOMETRIC METRICS (For Visual Client & Measurement Panel)
 * 
 * Strict architectural adherence:
 * - All calculations are derived deterministically from CanonicalGeometryState.
 * - Adheres strictly to the centralized tolerance model of Package 06.
 * - Base object is General Inscribed Tetrahedron; regularity is a derived predicate.
 */

import { Point3D, VertexId, EdgeId, FaceId, CanonicalGeometryState } from './types';
import { distance3D, computeSignedVolume } from './geometryState';
import { CANONICAL_EDGES, CANONICAL_FACES } from './topology';
import { getResolvedTolerances } from './tolerances';

export interface EdgeMetric {
  readonly id: EdgeId;
  readonly v1: VertexId;
  readonly v2: VertexId;
  readonly length: number;
}

export interface FaceMetric {
  readonly id: FaceId;
  readonly vertices: readonly [VertexId, VertexId, VertexId];
  readonly area: number;
  readonly perimeter: number;
  readonly isDegenerate: boolean;
  readonly normal: Point3D | null; // null if degenerate
}

export interface GlobalMetrics {
  readonly signedVolume: number;
  readonly absoluteVolume: number;
  readonly totalSurfaceArea: number;
  readonly centroid: Point3D;
  readonly isRegular: boolean;
  readonly regularityRatio: number;
  readonly minEdgeLength: number;
  readonly maxEdgeLength: number;
  readonly orientation: 'POSITIVE' | 'NEGATIVE' | 'COPLANAR';
  readonly sphereRadius: number;
  readonly sphereCenter: Point3D;
}

export interface ComprehensiveGeometryMetrics {
  readonly edges: Readonly<Record<EdgeId, EdgeMetric>>;
  readonly faces: Readonly<Record<FaceId, FaceMetric>>;
  readonly global: GlobalMetrics;
}

/**
 * Computes Euclidean distance between two 3D points
 */
export function calculateEdgeLength(p1: Point3D, p2: Point3D): number {
  return distance3D(p1, p2);
}

/**
 * Computes cross product of two 3D vectors: u x v
 */
export function crossProduct3D(u: Point3D, v: Point3D): Point3D {
  return {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x,
  };
}

/**
 * Computes vector difference: p2 - p1
 */
export function dotProduct3D(u: Point3D, v: Point3D): number {
  return u.x * v.x + u.y * v.y + u.z * v.z;
}

export function vectorSubtract(p2: Point3D, p1: Point3D): Point3D {
  return {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
    z: p2.z - p1.z,
  };
}

export const vectorSubtract3D = vectorSubtract;

export function vectorNorm(v: Point3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export const vectorNorm3D = vectorNorm;

/**
 * Computes triangle area given 3 points
 */
export function calculateFaceArea(pA: Point3D, pB: Point3D, pC: Point3D): number {
  const AB = vectorSubtract(pB, pA);
  const AC = vectorSubtract(pC, pA);
  const cross = crossProduct3D(AB, AC);
  return 0.5 * vectorNorm(cross);
}

/**
 * Theoretical metrics for a regular tetrahedron inscribed in S^2(O, R).
 * CAVEAT (F7): This calculates metrics for a regular tetrahedron with circumradius R.
 * Edge L = 4/sqrt(6) * R ~ 1.63299316 * R
 * Face Area = sqrt(3)/4 * L^2 = (2*sqrt(3)/3) * R^2 ~ 1.15470054 * R^2
 * Total Area = 4 * Face Area = (8*sqrt(3)/3) * R^2 ~ 4.61880215 * R^2
 * Volume = (8*sqrt(3)/27) * R^3 ~ 0.51320024 * R^3
 */
export function computeRegularTetrahedronMetric(radius: number) {
  const edgeLength = (4 / Math.sqrt(6)) * radius;
  const faceArea = ((2 * Math.sqrt(3)) / 3) * radius * radius;
  const totalSurfaceArea = ((8 * Math.sqrt(3)) / 3) * radius * radius;
  const volume = ((8 * Math.sqrt(3)) / 27) * Math.pow(radius, 3);

  return {
    edgeLength,
    faceArea,
    totalSurfaceArea,
    volume,
    circumradius: radius
  };
}

/**
 * Computes all derived metrics deterministically from canonical state.
 */
export function computeDerivedMetrics(state: CanonicalGeometryState): ComprehensiveGeometryMetrics {
  const { sphere, vertices } = state;
  const tol = getResolvedTolerances(sphere.radius);

  // 1. Edge Metrics (6 straight Euclidean chords)
  const edgeMetrics: Record<EdgeId, EdgeMetric> = {} as any;
  let minEdge = Infinity;
  let maxEdge = -Infinity;

  for (const edge of CANONICAL_EDGES) {
    const p1 = vertices[edge.v1];
    const p2 = vertices[edge.v2];
    const length = calculateEdgeLength(p1, p2);

    if (length < minEdge) minEdge = length;
    if (length > maxEdge) maxEdge = length;

    edgeMetrics[edge.id] = {
      id: edge.id,
      v1: edge.v1,
      v2: edge.v2,
      length,
    };
  }

  // 2. Face Metrics (4 planar triangles)
  const faceMetrics: Record<FaceId, FaceMetric> = {} as any;
  let totalSurfaceArea = 0;

  for (const face of CANONICAL_FACES) {
    const [idA, idB, idC] = face.vertices;
    const pA = vertices[idA];
    const pB = vertices[idB];
    const pC = vertices[idC];

    const AB = vectorSubtract(pB, pA);
    const AC = vectorSubtract(pC, pA);
    const cross = crossProduct3D(AB, AC);
    const crossLen = vectorNorm(cross);
    const area = 0.5 * crossLen;

    const lenAB = calculateEdgeLength(pA, pB);
    const lenBC = calculateEdgeLength(pB, pC);
    const lenCA = calculateEdgeLength(pC, pA);
    const perimeter = lenAB + lenBC + lenCA;

    totalSurfaceArea += area;
    const isDegenerate = area <= tol.epsFaceArea;

    let normal: Point3D | null = null;
    if (!isDegenerate && crossLen > 0) {
      normal = {
        x: cross.x / crossLen,
        y: cross.y / crossLen,
        z: cross.z / crossLen,
      };
    }

    faceMetrics[face.id] = {
      id: face.id,
      vertices: face.vertices,
      area,
      perimeter,
      isDegenerate,
      normal,
    };
  }

  // 3. Global Metrics
  const Vs = computeSignedVolume(vertices);
  const absVs = Math.abs(Vs);

  let orientation: 'POSITIVE' | 'NEGATIVE' | 'COPLANAR';
  if (absVs <= tol.epsVolume) {
    orientation = 'COPLANAR';
  } else if (Vs > 0) {
    orientation = 'POSITIVE';
  } else {
    orientation = 'NEGATIVE';
  }

  // Regularity predicate per Package 06: (L_max - L_min) / R <= epsRegularity
  const regularityRatio = sphere.radius > 0 ? (maxEdge - minEdge) / sphere.radius : 0;
  const isRegular = regularityRatio <= tol.epsRegularity && orientation !== 'COPLANAR';

  // Centroid G = (A + B + C + D) / 4
  const centroid: Point3D = {
    x: (vertices.A.x + vertices.B.x + vertices.C.x + vertices.D.x) / 4,
    y: (vertices.A.y + vertices.B.y + vertices.C.y + vertices.D.y) / 4,
    z: (vertices.A.z + vertices.B.z + vertices.C.z + vertices.D.z) / 4,
  };

  return {
    edges: Object.freeze(edgeMetrics),
    faces: Object.freeze(faceMetrics),
    global: Object.freeze({
      signedVolume: Vs,
      absoluteVolume: absVs,
      totalSurfaceArea,
      centroid,
      isRegular,
      regularityRatio,
      minEdgeLength: minEdge,
      maxEdgeLength: maxEdge,
      orientation,
      sphereRadius: sphere.radius,
      sphereCenter: sphere.center,
    }),
  };
}
