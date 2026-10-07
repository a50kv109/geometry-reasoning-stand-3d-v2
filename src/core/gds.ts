/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Geometric Diagnostic Snapshot (GDS) Layer — 0.2.2-dynamic-reasoning-final
 * 
 * Strict architectural adherence:
 * - Pure derived snapshot combining Global Metrics, 4×DLVM, and Shared-Edge Consistency.
 * - Adheres strictly to the unidirectional flow: CanonicalGeometryState -> GDS.
 * - ZERO reverse-write capability to Canonical State.
 */

import { VertexId, CanonicalGeometryState } from './types';
import { GlobalMetrics, computeDerivedMetrics } from './metrics';
import { generateGeometrySignature } from './signature';
import { DLVM, computeAllDLVMs, verifySharedEdges, SharedEdgeVerificationResult } from './dlvm';
import { EpistemicStatus } from './epistemic';

export interface GDS {
  readonly timestamp: number;
  readonly canonicalSignature: string;
  readonly globalMetrics: GlobalMetrics;
  readonly dlvms: Readonly<Record<VertexId, DLVM>>;
  readonly sharedEdgeConsistency: SharedEdgeVerificationResult;
  readonly epistemicStatus: EpistemicStatus;
  readonly isDegenerate: boolean;
  readonly degeneracyFlags: readonly string[];
}

/**
 * Computes an immutable Global Diagnostic Snapshot from CanonicalGeometryState.
 * Completely deterministic and free of side effects.
 */
export function computeGDS(
  state: CanonicalGeometryState,
  epistemicStatus: EpistemicStatus = EpistemicStatus.DERIVED,
  timestamp: number = Date.now()
): GDS {
  const R = state.sphere.radius;
  const signature = generateGeometrySignature(state);
  const metrics = computeDerivedMetrics(state);
  const dlvms = computeAllDLVMs(state);
  const sharedEdgeConsistency = verifySharedEdges(dlvms, R);

  const degeneracyFlags: string[] = [];
  if (Math.abs(metrics.global.signedVolume) <= 1e-7 * Math.pow(R, 3)) {
    degeneracyFlags.push('VOLUME_DEGENERATE');
  }

  for (const vId of ['A', 'B', 'C', 'D'] as VertexId[]) {
    const lvg = dlvms[vId].lvg;
    if (lvg.degeneracy !== 'D0_VALID') {
      degeneracyFlags.push(`VERTEX_${vId}_${lvg.degeneracy}`);
    }
  }

  if (!sharedEdgeConsistency.valid) {
    degeneracyFlags.push('SHARED_EDGE_INCONSISTENCY');
  }

  const isDegenerate = degeneracyFlags.length > 0;

  return {
    timestamp,
    canonicalSignature: signature,
    globalMetrics: metrics.global,
    dlvms,
    sharedEdgeConsistency,
    epistemicStatus,
    isDegenerate,
    degeneracyFlags,
  };
}
