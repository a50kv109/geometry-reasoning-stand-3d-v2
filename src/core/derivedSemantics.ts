/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Derived Semantics & Structural Classifications
 * 
 * Separates geometric classification (regularity, orientation, degeneracy)
 * from core coordinate mutations.
 */

import { Point3D, RealizationStatus } from './types';
import { calculateEdgeLength } from './metrics';
import { GEOMETRY_TOLERANCES } from './tolerances';

export interface RegularityReport {
  readonly isRegular: boolean;
  readonly meanEdgeLength: number;
  readonly maxEdgeDelta: number;
  readonly edgeToleranceUsed: number;
}

export function classifyRegularity(
  edges: Record<string, number>,
  tolerance: number = GEOMETRY_TOLERANCES.REGULARITY_TOLERANCE
): RegularityReport {
  const edgeLengths = Object.values(edges);
  if (edgeLengths.length === 0) {
    return {
      isRegular: false,
      meanEdgeLength: 0,
      maxEdgeDelta: 0,
      edgeToleranceUsed: tolerance
    };
  }

  const sum = edgeLengths.reduce((acc, len) => acc + len, 0);
  const mean = sum / edgeLengths.length;
  let maxDelta = 0;

  for (const len of edgeLengths) {
    const delta = Math.abs(len - mean);
    if (delta > maxDelta) {
      maxDelta = delta;
    }
  }

  return {
    isRegular: maxDelta <= tolerance,
    meanEdgeLength: mean,
    maxEdgeDelta: maxDelta,
    edgeToleranceUsed: tolerance
  };
}

export function classifyOrientation(signedVolume: number, tolerance: number = GEOMETRY_TOLERANCES.VOLUME_DEGENERACY_TOLERANCE): RealizationStatus {
  if (Math.abs(signedVolume) <= tolerance) {
    return RealizationStatus.DEGENERATE;
  }
  return signedVolume > 0 ? RealizationStatus.VALID_POSITIVE : RealizationStatus.VALID_NEGATIVE;
}
