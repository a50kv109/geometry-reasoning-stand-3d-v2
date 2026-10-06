/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Agent Simulation & Diagnostic Smoke Scenarios
 * 
 * Demonstrates agentic reasoning interaction:
 * 1. Agent queries state snapshot
 * 2. Agent proposes geometric hypothesis
 * 3. Stand Oracle independently validates or refutes
 */

import { CanonicalGeometryState, AgentClaim } from './types';
import { verifyAgentClaim } from './agentInterface';
import { computeDerivedMetrics } from './metrics';

export function runSampleAgentSession(canonical: CanonicalGeometryState) {
  const metrics = computeDerivedMetrics(canonical);

  const sampleClaims: AgentClaim[] = [
    {
      claimId: 'claim-01',
      type: 'EDGE_LENGTH',
      target: 'AB',
      claimedValue: metrics.edges.AB.length,
      justification: 'Agent calculated Euclidean distance AB'
    },
    {
      claimId: 'claim-02',
      type: 'EDGE_LENGTH',
      target: 'AB',
      claimedValue: metrics.edges.AB.length + 0.5, // False claim
      justification: 'Agent hallucinated incorrect edge length'
    },
    {
      claimId: 'claim-03',
      type: 'IS_REGULAR',
      target: 'ABCD',
      claimedValue: metrics.global.isRegular,
      justification: 'Agent regularity hypothesis'
    },
    {
      claimId: 'claim-04',
      type: 'VOLUME',
      target: 'ABCD',
      claimedValue: metrics.global.signedVolume,
      justification: 'Agent determinant volume formulation'
    },
    {
      claimId: 'claim-05',
      type: 'ORIENTATION',
      target: 'ABCD',
      claimedValue: metrics.global.orientation,
      justification: 'Agent triple product orientation check'
    }
  ];

  const results = sampleClaims.map(claim => verifyAgentClaim(canonical, claim));

  return {
    sampleClaims,
    results
  };
}
