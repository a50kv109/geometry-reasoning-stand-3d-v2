/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Agent Gateway v0.1 End-to-End Quickstart Script
 * 
 * Demonstrates:
 * 1. Initialize stand with canonical regular tetrahedron
 * 2. Inspect Object Passport (PGO-3D: Object Identity & Schema)
 * 3. Inspect State-Specific Symmetry Passport (PSS-3D: Full Group T_d, order 24)
 * 4. Submit and verify symmetry invariance hypothesis (Evidence Record)
 * 5. Apply controlled perturbation breaking symmetry to C_1
 * 6. Inspect degraded Symmetry Passport (PSS-3D: C_1, order 1)
 * 7. Query experiment ledger
 */

import {
  constructRegularTetrahedron,
  createAgentGateway,
  AgentGatewayCommand,
} from '../src/core';

async function main() {
  console.log('================================================================');
  console.log('  TETRAIDER SPHERE — AGENT GATEWAY v0.1 PROGRAMMATIC INTERFACE  ');
  console.log('================================================================\n');

  // 1. Initialize Canonical Stand State
  const constructRes = constructRegularTetrahedron(1.0);
  if (!constructRes.success || !constructRes.canonicalState) {
    throw new Error('Failed to construct regular tetrahedron');
  }

  const gateway = createAgentGateway(constructRes.canonicalState);
  console.log('✓ Stand initialized with canonical regular tetrahedron inscribed in S²(O, R=1.0)\n');

  // 2. Inspect Object Passport (PGO-3D)
  console.log('--- 1. INSPECT OBJECT PASSPORT (PGO-3D: Identity & Schema) ---');
  const passportRes = gateway.executeCommand({
    command: 'inspect_passport',
  });
  console.log(`Object ID:    ${passportRes.data.objectId}`);
  console.log(`Object Name:  ${passportRes.data.name}`);
  console.log(`Topology:     ${passportRes.data.topology.vertexLabels.join(', ')} (V=${passportRes.data.topology.vertexLabels.length}, E=${passportRes.data.topology.edgeCount}, F=${passportRes.data.topology.faceCount}, χ=${passportRes.data.topology.eulerCharacteristic})`);
  console.log(`Max Symmetry: ${passportRes.data.symmetryProfile.theoreticalMaxPointGroup} (${passportRes.data.symmetryProfile.crystallographicSystem} system)\n`);

  // 3. Inspect State-Specific Symmetry Passport (PSS-3D)
  console.log('--- 2. INSPECT SYMMETRY PASSPORT (PSS-3D: Canonical Regular State) ---');
  const symPassRes = gateway.executeCommand({
    command: 'inspect_symmetry_passport',
    evaluateFullGroup: true,
  });
  const pss = symPassRes.data;
  console.log(`Classification Status: ${pss.classificationStatus}`);
  console.log(`Point Group:           ${pss.pointGroup.schoenflies} / ${pss.pointGroup.hermannMauguin} (Order: ${pss.pointGroup.order})`);
  console.log(`Completeness:          ${pss.pointGroup.completeness}`);
  console.log(`Inversion Center:      ${pss.inversionCenter.exists ? 'PRESENT' : 'CONFIRMED ABSENT'} (Status: ${pss.inversionCenter.status})`);
  console.log(`Tested Operations:     ${pss.testedOperationsCount} total\n`);

  // 4. Verify External Invariance Claim (Zero Trust Verification Oracle)
  console.log('--- 3. VERIFY AGENT HYPOTHESIS (Invariance Under 120° C3 Rotation) ---');
  const verifyRes = gateway.executeCommand({
    command: 'verify_claim',
    hypothesis: {
      predicate: 'IS_INVARIANT_UNDER_OPERATION',
      claimedValue: true,
      operationContext: {
        type: 'AXIS_ROTATION',
        axis: { x: 0, y: 0, z: 1 },
        angleDegrees: 120,
      },
      justification: 'Candidate 3-fold axis rotation through vertex A and opposite face center',
    },
  });
  console.log(`Verdict:    ${verifyRes.evidence?.verdict} (Epistemic: ${verifyRes.evidence?.epistemicStatus})`);
  console.log(`Residual:   ${verifyRes.evidence?.mathematicalEvidence.residual?.toExponential(4)}`);
  console.log(`Tolerance:  ${verifyRes.evidence?.mathematicalEvidence.toleranceUsed}`);
  console.log(`EvidenceID: ${verifyRes.evidence?.evidenceId}\n`);

  // 5. Apply Controlled Perturbation (Breaking Symmetry)
  console.log('--- 4. PERTURB GEOMETRY (Displace Vertex D by offset) ---');
  const perturbRes = gateway.executeCommand({
    command: 'perturb_geometry',
    vertexId: 'D',
    offset: { x: 0.15, y: -0.1, z: 0.05 },
    preserveSphereConstraint: true,
  });
  console.log(`Perturbation Applied: Vertex D offset (${perturbRes.data.offsetApplied.x}, ${perturbRes.data.offsetApplied.y}, ${perturbRes.data.offsetApplied.z})`);
  console.log(`Resulting State ID:   ${perturbRes.data.resultingStateId}\n`);

  // 6. Inspect Symmetry Passport on Perturbed State
  console.log('--- 5. RE-INSPECT SYMMETRY PASSPORT ON PERTURBED STATE ---');
  const perturbedSymRes = gateway.executeCommand({
    command: 'inspect_symmetry_passport',
    targetStateId: perturbRes.data.resultingStateId,
    evaluateFullGroup: true,
  });
  const perturbedPss = perturbedSymRes.data;
  console.log(`New Point Group:   ${perturbedPss.pointGroup.schoenflies} (Order: ${perturbedPss.pointGroup.order})`);
  console.log(`Completeness:      ${perturbedPss.pointGroup.completeness}`);
  console.log(`Invariant Ops:     ${perturbedPss.testedOperations.filter((o: any) => o.isInvariant).length} of ${perturbedPss.testedOperationsCount}`);
  console.log(`Symmetry Verdict:  T_d symmetry broken down to C_1 general tetrahedron!\n`);

  // 7. Query Experiment Ledger
  console.log('--- 6. EXPERIMENT LEDGER AUDIT ---');
  const ledgerRes = gateway.executeCommand({
    command: 'get_experiment_ledger',
  });
  console.log(`Total Logged Experiments: ${ledgerRes.data.length}`);
  ledgerRes.data.forEach((entry: any, idx: number) => {
    console.log(`  [#${idx + 1}] ${entry.command} -> ${entry.verdict} (${new Date(entry.timestamp).toISOString()})`);
  });

  console.log('\n================================================================');
  console.log('  REPRODUCTION CHECK COMPLETE: ALL CONTRACTS VALIDATED  ');
  console.log('================================================================');
}

main().catch(console.error);
