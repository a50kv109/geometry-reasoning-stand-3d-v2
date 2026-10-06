/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Agent Interface & Boundary Protocol
 * 
 * "Agent may be wrong. Stand must not."
 * 
 * Pure mathematical verification oracle boundary.
 * Agents submit claims as hypotheses; the Stand evaluates ground truth against canonical state.
 */

import {
  CanonicalGeometryState,
  RepresentationState,
  GeometryValidationResult,
  AgentClaim,
  AgentVerificationReport,
  AgentStateSnapshot,
  EpistemicStatus,
  EdgeId,
  FaceId,
  VertexId
} from './types';
import { computeDerivedMetrics } from './metrics';
import { generateGeometrySignature } from './signature';
import { GEOMETRY_TOLERANCES } from './tolerances';
import { distance3D } from './geometryState';

export interface StandOracle {
  getStateSnapshot(): AgentStateSnapshot;
  verifyClaim(claim: AgentClaim): AgentVerificationReport;
  verifyBatch(claims: readonly AgentClaim[]): readonly AgentVerificationReport[];
}

export function createStandOracle(
  canonical: CanonicalGeometryState,
  representation: RepresentationState,
  validation: GeometryValidationResult
): StandOracle {
  return {
    getStateSnapshot(): AgentStateSnapshot {
      return {
        canonical,
        representation,
        validation,
        timestamp: Date.now(),
        signature: generateGeometrySignature(canonical)
      };
    },

    verifyClaim(claim: AgentClaim): AgentVerificationReport {
      return verifyAgentClaim(canonical, claim);
    },

    verifyBatch(claims: readonly AgentClaim[]): readonly AgentVerificationReport[] {
      return claims.map(c => verifyAgentClaim(canonical, c));
    }
  };
}

export function verifyAgentClaim(
  canonical: CanonicalGeometryState,
  claim: AgentClaim
): AgentVerificationReport {
  const metrics = computeDerivedMetrics(canonical);
  const defaultTol = claim.tolerance ?? GEOMETRY_TOLERANCES.NUMERICAL_EPSILON;

  let groundTruth: number | boolean | string = 0;
  let verified = false;
  let delta: number | undefined = undefined;
  let explanation = '';

  switch (claim.type) {
    case 'EDGE_LENGTH': {
      const edge = metrics.edges[claim.target as EdgeId];
      if (!edge) {
        return {
          claimId: claim.claimId,
          type: claim.type,
          target: claim.target,
          claimedValue: claim.claimedValue,
          groundTruthValue: 'INVALID_EDGE_ID',
          toleranceUsed: defaultTol,
          verified: false,
          epistemicVerdict: EpistemicStatus.REFUTED,
          explanation: `Edge target '${claim.target}' is not a valid canonical edge identifier.`
        };
      }
      groundTruth = edge.length;
      if (typeof claim.claimedValue === 'number') {
        delta = Math.abs(claim.claimedValue - edge.length);
        verified = delta <= defaultTol;
        explanation = verified
          ? `Claimed edge length ${claim.claimedValue} matches ground truth ${edge.length.toFixed(6)} within tolerance ${defaultTol}.`
          : `Claimed edge length ${claim.claimedValue} contradicts ground truth ${edge.length.toFixed(6)} (delta: ${delta.toExponential(4)}).`;
      }
      break;
    }

    case 'FACE_AREA': {
      const face = metrics.faces[claim.target as FaceId];
      if (!face) {
        return {
          claimId: claim.claimId,
          type: claim.type,
          target: claim.target,
          claimedValue: claim.claimedValue,
          groundTruthValue: 'INVALID_FACE_ID',
          toleranceUsed: defaultTol,
          verified: false,
          epistemicVerdict: EpistemicStatus.REFUTED,
          explanation: `Face target '${claim.target}' is not a valid canonical face identifier.`
        };
      }
      groundTruth = face.area;
      if (typeof claim.claimedValue === 'number') {
        delta = Math.abs(claim.claimedValue - face.area);
        verified = delta <= defaultTol;
        explanation = verified
          ? `Claimed face area ${claim.claimedValue} matches ground truth ${face.area.toFixed(6)} within tolerance.`
          : `Claimed face area ${claim.claimedValue} contradicts ground truth ${face.area.toFixed(6)} (delta: ${delta.toExponential(4)}).`;
      }
      break;
    }

    case 'VOLUME': {
      groundTruth = metrics.global.signedVolume;
      if (typeof claim.claimedValue === 'number') {
        delta = Math.abs(claim.claimedValue - metrics.global.signedVolume);
        verified = delta <= defaultTol;
        explanation = verified
          ? `Claimed signed volume matches ground truth ${metrics.global.signedVolume.toFixed(6)}.`
          : `Claimed volume contradicts ground truth ${metrics.global.signedVolume.toFixed(6)} (delta: ${delta.toExponential(4)}).`;
      }
      break;
    }

    case 'IS_REGULAR': {
      groundTruth = metrics.global.isRegular;
      verified = claim.claimedValue === metrics.global.isRegular;
      explanation = verified
        ? `Claim regularity ${claim.claimedValue} confirmed by Stand regularity predicate.`
        : `Claim regularity ${claim.claimedValue} contradicts Stand predicate (isRegular: ${metrics.global.isRegular}).`;
      break;
    }

    case 'IS_DEGENERATE': {
      const isDegen = metrics.global.orientation === 'COPLANAR';
      groundTruth = isDegen;
      verified = claim.claimedValue === isDegen;
      explanation = verified
        ? `Degeneracy claim ${claim.claimedValue} confirmed.`
        : `Degeneracy claim contradicts ground truth (isDegenerate: ${isDegen}).`;
      break;
    }

    case 'ORIENTATION': {
      groundTruth = metrics.global.orientation;
      verified = claim.claimedValue === metrics.global.orientation;
      explanation = verified
        ? `Orientation claim ${claim.claimedValue} matches ground truth.`
        : `Orientation claim '${claim.claimedValue}' contradicts ground truth '${metrics.global.orientation}'.`;
      break;
    }

    case 'POINT_ON_SPHERE': {
      const v = canonical.vertices[claim.target as VertexId];
      if (!v) {
        return {
          claimId: claim.claimId,
          type: claim.type,
          target: claim.target,
          claimedValue: claim.claimedValue,
          groundTruthValue: 'INVALID_VERTEX_ID',
          toleranceUsed: defaultTol,
          verified: false,
          epistemicVerdict: EpistemicStatus.REFUTED,
          explanation: `Target '${claim.target}' is not a valid vertex.`
        };
      }
      const dist = distance3D(v, canonical.sphere.center);
      const radDiff = Math.abs(dist - canonical.sphere.radius);
      groundTruth = radDiff <= (claim.tolerance ?? GEOMETRY_TOLERANCES.RADIUS_EPSILON);
      verified = claim.claimedValue === groundTruth;
      explanation = verified
        ? `Point on sphere claim verified for vertex ${claim.target}.`
        : `Point on sphere claim failed for vertex ${claim.target} (diff: ${radDiff.toExponential(4)}).`;
      break;
    }
  }

  const epistemicVerdict = verified ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;

  return {
    claimId: claim.claimId,
    type: claim.type,
    target: claim.target,
    claimedValue: claim.claimedValue,
    groundTruthValue: groundTruth,
    delta,
    toleranceUsed: defaultTol,
    verified,
    epistemicVerdict,
    explanation
  };
}
