/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Geometry Temporal Observation & Measurement Layer — 0.2.2-dynamic-reasoning-final
 * 
 * Strict architectural adherence:
 * - Observes and measures temporal evolution of geometry without mutating Canonical State.
 * - Enforces strict temporal ordering: t0 < t1.
 * - Flags non-monotonic or reverse time transitions as CORRUPTED.
 * - Zero prediction, zero engineering control, zero optimization: purely empirical measurement.
 */

import { VertexId, EdgeId, CanonicalGeometryState, Point3D } from './types';
import { GDS, computeGDS } from './gds';
import { distance3D } from './geometryState';

export type TemporalQuality = 'PRISTINE' | 'DEGRADED' | 'CORRUPTED';

export interface Observation<T> {
  readonly timestamp: number;
  readonly data: T;
  readonly status: 'VALID' | 'CORRUPTED' | 'DEGENERATE';
}

export interface GeometryMeasurement {
  readonly deltaVolume: number;
  readonly deltaSurfaceArea: number;
  readonly deltaCentroidDisplacement: number;
  readonly deltaEdgeLengths: Readonly<Record<EdgeId, number>>;
  readonly vertexDisplacements: Readonly<Record<VertexId, number>>;
  readonly deltaSolidAngles: Readonly<Record<VertexId, number>>;
  readonly maxVertexDisplacement: number;
}

export interface StateTransition {
  readonly t0: number;
  readonly t1: number;
  readonly dt: number;
  readonly fromSignature: string;
  readonly toSignature: string;
  readonly isValidOrdering: boolean;
  readonly measurements: GeometryMeasurement | null;
  readonly status: 'VALID' | 'CORRUPTED' | 'DEGENERATE';
}

export interface TemporalTrace {
  readonly observations: readonly Observation<GDS>[];
  readonly transitions: readonly StateTransition[];
  readonly quality: TemporalQuality;
}

/**
 * Creates an observation wrapper around a GDS snapshot.
 */
export function createObservation(gds: GDS, timestamp: number = gds.timestamp): Observation<GDS> {
  return {
    timestamp,
    data: gds,
    status: gds.isDegenerate ? 'DEGENERATE' : 'VALID',
  };
}

/**
 * Computes the state transition and empirical measurements between two observations.
 * Strictly verifies monotonic temporal ordering (t0 < t1).
 */
export function computeStateTransition(
  obs0: Observation<GDS>,
  obs1: Observation<GDS>,
  state0: CanonicalGeometryState,
  state1: CanonicalGeometryState
): StateTransition {
  const t0 = obs0.timestamp;
  const t1 = obs1.timestamp;
  const dt = t1 - t0;

  // Strict temporal ordering check
  if (dt <= 0) {
    return {
      t0,
      t1,
      dt,
      fromSignature: obs0.data.canonicalSignature,
      toSignature: obs1.data.canonicalSignature,
      isValidOrdering: false,
      measurements: null,
      status: 'CORRUPTED',
    };
  }

  // Calculate geometric delta measurements
  const gds0 = obs0.data;
  const gds1 = obs1.data;

  const deltaVolume = gds1.globalMetrics.signedVolume - gds0.globalMetrics.signedVolume;
  const deltaSurfaceArea = gds1.globalMetrics.totalSurfaceArea - gds0.globalMetrics.totalSurfaceArea;
  const deltaCentroidDisplacement = distance3D(gds0.globalMetrics.centroid, gds1.globalMetrics.centroid);

  const vertexDisplacements: Record<VertexId, number> = {
    A: distance3D(state0.vertices.A, state1.vertices.A),
    B: distance3D(state0.vertices.B, state1.vertices.B),
    C: distance3D(state0.vertices.C, state1.vertices.C),
    D: distance3D(state0.vertices.D, state1.vertices.D),
  };

  const maxVertexDisplacement = Math.max(
    vertexDisplacements.A,
    vertexDisplacements.B,
    vertexDisplacements.C,
    vertexDisplacements.D
  );

  const edges: EdgeId[] = ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'];
  const deltaEdgeLengths: Partial<Record<EdgeId, number>> = {};
  for (const edge of edges) {
    const v1 = edge[0] as VertexId;
    const v2 = edge[1] as VertexId;
    const l0 = distance3D(state0.vertices[v1], state0.vertices[v2]);
    const l1 = distance3D(state1.vertices[v1], state1.vertices[v2]);
    deltaEdgeLengths[edge] = l1 - l0;
  }

  const deltaSolidAngles: Record<VertexId, number> = {
    A: gds1.dlvms.A.lvg.solidAngle - gds0.dlvms.A.lvg.solidAngle,
    B: gds1.dlvms.B.lvg.solidAngle - gds0.dlvms.B.lvg.solidAngle,
    C: gds1.dlvms.C.lvg.solidAngle - gds0.dlvms.C.lvg.solidAngle,
    D: gds1.dlvms.D.lvg.solidAngle - gds0.dlvms.D.lvg.solidAngle,
  };

  const isDegenerate = gds0.isDegenerate || gds1.isDegenerate;

  return {
    t0,
    t1,
    dt,
    fromSignature: gds0.canonicalSignature,
    toSignature: gds1.canonicalSignature,
    isValidOrdering: true,
    measurements: {
      deltaVolume,
      deltaSurfaceArea,
      deltaCentroidDisplacement,
      deltaEdgeLengths: deltaEdgeLengths as Readonly<Record<EdgeId, number>>,
      vertexDisplacements,
      deltaSolidAngles,
      maxVertexDisplacement,
    },
    status: isDegenerate ? 'DEGENERATE' : 'VALID',
  };
}

/**
 * Builds a temporal trace from a sequence of observations and states.
 */
export function createTemporalTrace(
  observations: readonly Observation<GDS>[],
  states: readonly CanonicalGeometryState[]
): TemporalTrace {
  if (observations.length !== states.length || observations.length === 0) {
    return {
      observations,
      transitions: [],
      quality: 'CORRUPTED',
    };
  }

  const transitions: StateTransition[] = [];
  let quality: TemporalQuality = 'PRISTINE';

  for (let i = 0; i < observations.length - 1; i++) {
    const transition = computeStateTransition(
      observations[i],
      observations[i + 1],
      states[i],
      states[i + 1]
    );
    transitions.push(transition);

    if (transition.status === 'CORRUPTED') {
      quality = 'CORRUPTED';
    } else if (transition.status === 'DEGENERATE' && quality !== 'CORRUPTED') {
      quality = 'DEGRADED';
    }
  }

  return {
    observations,
    transitions,
    quality,
  };
}
