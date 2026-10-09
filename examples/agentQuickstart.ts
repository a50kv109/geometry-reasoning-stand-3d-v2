/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Agent Quickstart Integration Example
 * 
 * Demonstrates the canonical workflow:
 * 1. Initialize Stand Geometry
 * 2. Agent receives state snapshot
 * 3. Agent performs geometric reasoning / forms hypothesis
 * 4. Stand independently validates or refutes
 */

import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  validateGeometryState,
  deriveRepresentationState,
  createStandOracle,
  AgentClaim
} from '../src/core';

async function main() {
  console.log('--- 3D Geometry Reasoning Stand: Agent Quickstart ---');

  // 1. Stand initializes canonical state (Unit Sphere R=1.0, Regular Tetrahedron)
  const sphere = createSphere3D(createPoint3D(0, 0, 0), 1.0);
  const vertices = {
    A: createPoint3D(0, 0, 1.0),
    B: createPoint3D((2 * Math.sqrt(2) / 3), 0, -1 / 3),
    C: createPoint3D((-Math.sqrt(2) / 3), (-Math.sqrt(6) / 3), -1 / 3),
    D: createPoint3D((-Math.sqrt(2) / 3), (Math.sqrt(6) / 3), -1 / 3),
  };

  const canonical = createCanonicalGeometryState(sphere, vertices);
  const validation = validateGeometryState(sphere, vertices);
  const representation = deriveRepresentationState(canonical, 'CARTESIAN');

  // 2. Instantiate the Stand Verification Oracle
  const oracle = createStandOracle(canonical, representation, validation);
  const snapshot = oracle.getStateSnapshot();

  console.log(`Snapshot Signature: ${snapshot.signature}`);
  console.log(`Stand Validation: ${snapshot.validation.isValid ? 'VALID' : 'INVALID'}`);

  // 3. Agent submits hypotheses
  const claims: AgentClaim[] = [
    {
      claimId: 'claim-1',
      type: 'EDGE_LENGTH',
      target: 'AB',
      claimedValue: 1.632993, // ~ 4/sqrt(6)
      tolerance: 1e-4,
      justification: 'Inscribed regular tetrahedron theoretical edge length'
    },
    {
      claimId: 'claim-2',
      type: 'IS_REGULAR',
      target: 'ABCD',
      claimedValue: true,
      justification: 'Predicted regular shape'
    },
    {
      claimId: 'claim-3',
      type: 'VOLUME',
      target: 'ABCD',
      claimedValue: 0.999, // Intentional hallucination
      justification: 'Faulty agent volume formula'
    }
  ];

  // 4. Stand Oracle verifies claims
  console.log('\n--- Oracle Verification Results ---');
  const reports = oracle.verifyBatch(claims);

  for (const rep of reports) {
    console.log(`[${rep.verified ? 'PASS' : 'REJECT'}] Claim ${rep.claimId} (${rep.type} on ${rep.target}):`);
    console.log(`  Claimed: ${rep.claimedValue} | Ground Truth: ${rep.groundTruthValue}`);
    console.log(`  Epistemic Verdict: ${rep.epistemicVerdict}`);
    console.log(`  Explanation: ${rep.explanation}\n`);
  }
}

// Run main directly in ESM
main().catch(console.error);
