/**
 * FEDOROV SYMMETRY STAND (FSS) — AGENT GATEWAY v0.1
 * Acceptance & Verification Test Suite (12 Core Contracts)
 * 
 * Verifies:
 * 1. Valid commands return correctly typed results.
 * 2. Malformed commands fail explicitly.
 * 3. Unsupported operations never report success.
 * 4. The gateway uses the same core operations as the human interface.
 * 5. The original canonical state remains unchanged when an experiment operates on a derived state.
 * 6. A supported symmetry operation produces expected result for a suitable test object.
 * 7. Controlled perturbation can invalidate a previously satisfied symmetry predicate.
 * 8. The verifier, not the agent, determines the verdict.
 * 9. Receiver-selected tolerances are used.
 * 10. Evidence records identify exact input state, operation, predicate, and result.
 * 11. Repeated runs with identical mathematical inputs produce identical mathematical evidence.
 * 12. Complete suite executes deterministically with zero side effects.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  createAgentGateway,
  generateGeometrySignature,
  computeDerivedMetrics,
  getResolvedTolerances,
  EpistemicStatus,
} from '../core';

test('FSS Agent Gateway v0.1 Acceptance & Verification Suite (12 Contracts)', async (t) => {
  // Setup baseline canonical regular tetrahedron inscribed in unit sphere S²(O, R=1)
  const sphere = createSphere3D(createPoint3D(0, 0, 0), 1.0);
  const vertices = {
    A: createPoint3D(0, 0, 1.0),
    B: createPoint3D((2 * Math.sqrt(2) / 3), 0, -1 / 3),
    C: createPoint3D((-Math.sqrt(2) / 3), (-Math.sqrt(6) / 3), -1 / 3),
    D: createPoint3D((-Math.sqrt(2) / 3), (Math.sqrt(6) / 3), -1 / 3),
  };
  const canonical = createCanonicalGeometryState(sphere, vertices);
  const gateway = createAgentGateway(canonical, 'FSS-POLYHEDRON-TETRA-001');

  // Contract 01: Valid commands return correctly typed results
  await t.test('Contract 01: Valid commands return correctly typed results', () => {
    // Test inspect_passport
    const passRes = gateway.executeCommand({ command: 'inspect_passport' });
    assert.equal(passRes.success, true);
    assert.equal(passRes.command, 'inspect_passport');
    assert.ok(passRes.data);
    assert.equal(passRes.data.objectId, 'FSS-POLYHEDRON-TETRA-001');
    assert.equal(passRes.data.topology.edgeCount, 6);
    assert.equal(passRes.data.topology.faceCount, 4);
    assert.equal(passRes.data.topology.eulerCharacteristic, 2);

    // Test get_canonical_snapshot
    const snapRes = gateway.executeCommand({ command: 'get_canonical_snapshot' });
    assert.equal(snapRes.success, true);
    assert.equal(snapRes.command, 'get_canonical_snapshot');
    assert.ok(snapRes.data.canonical);
    assert.equal(snapRes.data.canonical.sphere.radius, 1.0);
  });

  // Contract 02: Malformed commands fail explicitly
  await t.test('Contract 02: Malformed commands fail explicitly', () => {
    // Null/empty payload
    const nullRes = gateway.executeCommand(null as any);
    assert.equal(nullRes.success, false);
    assert.equal(nullRes.error?.code, 'INVALID_INPUT');

    // Missing vertices in explicit tetrahedron construction
    const malformedConst = gateway.executeCommand({
      command: 'construct_object',
      constructionType: 'EXPLICIT_TETRAHEDRON',
      params: {},
    });
    assert.equal(malformedConst.success, false);
    assert.equal(malformedConst.error?.code, 'INVALID_INPUT');

    // Missing operationContext in symmetry invariance hypothesis
    const malformedHyp = gateway.executeCommand({
      command: 'verify_claim',
      hypothesis: {
        predicate: 'IS_INVARIANT_UNDER_OPERATION',
        claimedValue: true,
      },
    });
    assert.equal(malformedHyp.success, false);
    assert.equal(malformedHyp.error?.code, 'INVALID_INPUT');
  });

  // Contract 03: Unsupported operations never report success
  await t.test('Contract 03: Unsupported operations never report success', () => {
    const unsuppCmd = gateway.executeCommand({
      command: 'non_existent_command' as any,
    });
    assert.equal(unsuppCmd.success, false);
    assert.equal(unsuppCmd.error?.code, 'UNSUPPORTED_OPERATION');

    const unsuppConst = gateway.executeCommand({
      command: 'construct_object',
      constructionType: 'ICOSAHEDRON_SPACE_GROUP_230' as any,
      params: {},
    });
    assert.equal(unsuppConst.success, false);
    assert.equal(unsuppConst.error?.code, 'UNSUPPORTED_OPERATION');
  });

  // Contract 04: The gateway uses the same core operations as the human interface
  await t.test('Contract 04: The gateway uses the same core operations as human interface', () => {
    const directMetrics = computeDerivedMetrics(canonical);
    const queryVol = gateway.executeCommand({ command: 'query_metric', metricName: 'signedVolume' });
    assert.equal(queryVol.success, true);
    assert.equal(queryVol.data.value, directMetrics.global.signedVolume);

    const queryReg = gateway.executeCommand({ command: 'query_metric', metricName: 'isRegular' });
    assert.equal(queryReg.success, true);
    assert.equal(queryReg.data.value, directMetrics.global.isRegular);

    const queryEdge = gateway.executeCommand({ command: 'query_metric', metricName: 'edgeLength', target: 'AB' });
    assert.equal(queryEdge.success, true);
    assert.equal(queryEdge.data.value, directMetrics.edges.AB.length);
  });

  // Contract 05: Original canonical state remains unchanged when experiment operates on derived state
  await t.test('Contract 05: Original state remains unchanged during experiments', () => {
    const initialSig = generateGeometrySignature(canonical);
    const initialVertexA = { ...canonical.vertices.A };

    // Apply perturbation to vertex A
    const perturbRes = gateway.executeCommand({
      command: 'perturb_geometry',
      vertexId: 'A',
      offset: createPoint3D(0.2, -0.1, 0.05),
    });
    assert.equal(perturbRes.success, true);
    assert.notEqual(perturbRes.data.outputStateSignature, initialSig);

    // Verify gateway's active state is untouched
    const activeState = gateway.getActiveState();
    const activeSig = generateGeometrySignature(activeState);
    assert.equal(activeSig, initialSig);
    assert.equal(activeState.vertices.A.x, initialVertexA.x);
    assert.equal(activeState.vertices.A.y, initialVertexA.y);
    assert.equal(activeState.vertices.A.z, initialVertexA.z);
  });

  // Contract 06: A supported symmetry operation produces expected result for test object
  await t.test('Contract 06: Supported symmetry operation produces expected result', () => {
    // 1. C_3 rotation of 120° around Z-axis: for regular tetrahedron with vertex A at (0, 0, 1),
    // vertices B, C, D form equilateral triangle in plane z = -1/3.
    // 120° rotation permutes B -> D -> C -> B, leaving vertex set invariant!
    const rotRes = gateway.executeCommand({
      command: 'apply_symmetry_operation',
      operation: {
        type: 'AXIS_ROTATION',
        axis: createPoint3D(0, 0, 1),
        angleDegrees: 120,
      },
    });
    assert.equal(rotRes.success, true);
    assert.equal(rotRes.data.isInvariant, true);
    assert.ok(rotRes.data.maxDisplacement < 1e-12);

    // 2. Central inversion: a regular tetrahedron is NOT centrally symmetric!
    const invRes = gateway.executeCommand({
      command: 'apply_symmetry_operation',
      operation: {
        type: 'CENTRAL_INVERSION',
        center: createPoint3D(0, 0, 0),
      },
    });
    assert.equal(invRes.success, true);
    assert.equal(invRes.data.isInvariant, false);
    // Inverted apex is at (0, 0, -1), nearest original base vertex is at distance > 0.5
    assert.ok(invRes.data.maxDisplacement > 0.5);
  });

  // Contract 07: Controlled perturbation invalidates previously satisfied symmetry predicate
  await t.test('Contract 07: Controlled perturbation invalidates symmetry predicate', () => {
    // Verify C_3 rotation invariance on regular tetrahedron: VERIFIED
    const verifyInitial = gateway.executeCommand({
      command: 'verify_claim',
      hypothesis: {
        predicate: 'IS_INVARIANT_UNDER_OPERATION',
        claimedValue: true,
        operationContext: {
          type: 'AXIS_ROTATION',
          axis: createPoint3D(0, 0, 1),
          angleDegrees: 120,
        },
      },
    });
    assert.equal(verifyInitial.success, true);
    assert.equal(verifyInitial.evidence?.verdict, 'VERIFIED');
    assert.equal(verifyInitial.evidence?.epistemicStatus, EpistemicStatus.VERIFIED);

    // Perturb vertex B by dx = 0.1
    const perturb = gateway.executeCommand({
      command: 'perturb_geometry',
      vertexId: 'B',
      offset: createPoint3D(0.1, 0, 0),
    });
    assert.equal(perturb.success, true);
    const perturbedStateId = perturb.data.resultingStateId;

    // Verify C_3 rotation on perturbed state: REFUTED
    const verifyPerturbed = gateway.executeCommand({
      command: 'verify_claim',
      targetStateId: perturbedStateId,
      hypothesis: {
        predicate: 'IS_INVARIANT_UNDER_OPERATION',
        claimedValue: true,
        operationContext: {
          type: 'AXIS_ROTATION',
          axis: createPoint3D(0, 0, 1),
          angleDegrees: 120,
        },
      },
    });
    assert.equal(verifyPerturbed.success, true);
    assert.equal(verifyPerturbed.evidence?.verdict, 'REFUTED');
    assert.equal(verifyPerturbed.evidence?.epistemicStatus, EpistemicStatus.REFUTED);
    assert.ok((verifyPerturbed.evidence?.mathematicalEvidence.residual ?? 0) > 0.05);
  });

  // Contract 08: The verifier, not the agent, determines the verdict
  await t.test('Contract 08: The verifier, not the agent, determines the verdict', () => {
    // Agent falsely claims that central inversion leaves tetrahedron invariant:
    const falseClaim = gateway.executeCommand({
      command: 'verify_claim',
      hypothesis: {
        predicate: 'IS_INVARIANT_UNDER_OPERATION',
        claimedValue: true, // False assertion
        operationContext: {
          type: 'CENTRAL_INVERSION',
          center: createPoint3D(0, 0, 0),
        },
      },
    });
    assert.equal(falseClaim.success, true);
    // Verifier refutes agent assertion
    assert.equal(falseClaim.evidence?.verdict, 'REFUTED');
    assert.equal(falseClaim.evidence?.epistemicStatus, EpistemicStatus.REFUTED);
    assert.equal(falseClaim.evidence?.mathematicalEvidence.actualValue, false);
  });

  // Contract 09: Receiver-selected tolerances are used (agent cannot override)
  await t.test('Contract 09: Receiver-selected tolerances are used strictly', () => {
    const resolvedTol = getResolvedTolerances(1.0);

    // Agent attempts to pass a false claim by providing an absurdly huge tolerance hint: 999.0
    const claimWithHugeTol = gateway.executeCommand({
      command: 'verify_claim',
      hypothesis: {
        predicate: 'EDGE_LENGTH_EQUALS',
        target: 'AB',
        claimedValue: 99.0, // Blatantly false edge length
        toleranceHint: 999.0, // Agent attempting to force pass
      },
    });
    assert.equal(claimWithHugeTol.success, true);
    // Verifier uses receiver scale tolerance (1e-6), NOT agent's 999.0 hint!
    assert.equal(claimWithHugeTol.evidence?.verdict, 'REFUTED');
    assert.equal(claimWithHugeTol.evidence?.receiverTolerancePolicy.appliedEpsilon, resolvedTol.epsSphere);
    assert.notEqual(claimWithHugeTol.evidence?.receiverTolerancePolicy.appliedEpsilon, 999.0);
  });

  // Contract 10: Evidence records identify exact input state, operation, predicate, and result
  await t.test('Contract 10: Evidence records identify exact input state, predicate, and result', () => {
    const inputSig = generateGeometrySignature(canonical);
    const report = gateway.executeCommand({
      command: 'verify_claim',
      hypothesis: {
        predicate: 'IS_REGULAR',
        claimedValue: true,
      },
    });
    assert.equal(report.success, true);
    const ev = report.evidence;
    assert.ok(ev);
    assert.equal(ev.inputStateSignature, inputSig);
    assert.equal(ev.predicate, 'IS_REGULAR');
    assert.equal(ev.verdict, 'VERIFIED');
    assert.ok(ev.experimentId.startsWith('exp-'));
    assert.ok(ev.evidenceId.startsWith('evi-'));
    assert.ok(ev.mathematicalEvidence);
    assert.equal(ev.mathematicalEvidence.invariantPreserved, true);
  });

  // Contract 11: Repeated runs with identical mathematical inputs produce identical mathematical evidence
  await t.test('Contract 11: Repeated runs produce identical mathematical evidence', () => {
    const run1 = gateway.executeCommand({
      command: 'verify_claim',
      hypothesis: {
        predicate: 'SIGNED_VOLUME_EQUALS',
        claimedValue: (8 * Math.sqrt(3)) / 27,
      },
    });

    const run2 = gateway.executeCommand({
      command: 'verify_claim',
      hypothesis: {
        predicate: 'SIGNED_VOLUME_EQUALS',
        claimedValue: (8 * Math.sqrt(3)) / 27,
      },
    });

    assert.equal(run1.success, true);
    assert.equal(run2.success, true);
    // Mathematical evidence is byte-identical
    assert.equal(run1.evidence?.verdict, run2.evidence?.verdict);
    assert.equal(run1.evidence?.mathematicalEvidence.actualValue, run2.evidence?.mathematicalEvidence.actualValue);
    assert.equal(run1.evidence?.mathematicalEvidence.residual, run2.evidence?.mathematicalEvidence.residual);
    assert.equal(run1.evidence?.receiverTolerancePolicy.appliedEpsilon, run2.evidence?.receiverTolerancePolicy.appliedEpsilon);
  });

  // Contract 12: Ledger tracking accumulates experiments accurately
  await t.test('Contract 12: Ledger tracking accumulates experiments accurately', () => {
    const ledger = gateway.getLedger();
    assert.ok(ledger.length >= 5);
    const lastEntry = ledger[ledger.length - 1];
    assert.ok(lastEntry.experimentId);
    assert.ok(lastEntry.verdict);
    assert.ok(lastEntry.evidence);

    const queryLedger = gateway.executeCommand({
      command: 'get_experiment_ledger',
      limit: 3,
    });
    assert.equal(queryLedger.success, true);
    assert.equal(queryLedger.data.length, 3);
  });

  // Contract 13: State-Specific Symmetry Passport (PSS-3D) & Ontological Separation
  await t.test('Contract 13: State-Specific Symmetry Passport & Completeness Tracking', () => {
    // 1. Without computation requested: status is NOT_COMPUTED, completeness is NOT_COMPUTED
    const uncompRes = gateway.executeCommand({
      command: 'inspect_symmetry_passport',
    });
    assert.equal(uncompRes.success, true);
    assert.equal(uncompRes.data.passportType, 'SYMMETRY_PASSPORT');
    assert.equal(uncompRes.data.classificationStatus, 'NOT_COMPUTED');
    assert.equal(uncompRes.data.pointGroup.completeness, 'NOT_COMPUTED');
    assert.equal(uncompRes.data.pointGroup.schoenflies, 'NOT_COMPUTED');
    assert.equal(uncompRes.data.inversionCenter.status, 'NOT_COMPUTED');

    // 2. Generators only: does NOT declare complete group
    const genRes = gateway.executeCommand({
      command: 'inspect_symmetry_passport',
      evaluateGenerators: true,
    });
    assert.equal(genRes.success, true);
    assert.equal(genRes.data.pointGroup.completeness, 'GENERATORS_ONLY');
    assert.equal(genRes.data.classificationStatus, 'PARTIALLY_VERIFIED');
    assert.equal(genRes.data.pointGroup.order, null); // Full order not reported without full group!

    // 3. Full group evaluation on regular tetrahedron: VERIFIED, order 24, T_d, inversion center REFUTED
    const fullRes = gateway.executeCommand({
      command: 'inspect_symmetry_passport',
      evaluateFullGroup: true,
    });
    assert.equal(fullRes.success, true);
    assert.equal(fullRes.data.classificationStatus, 'VERIFIED');
    assert.equal(fullRes.data.pointGroup.schoenflies, 'T_d');
    assert.equal(fullRes.data.pointGroup.hermannMauguin, '-43m');
    assert.equal(fullRes.data.pointGroup.system, 'CUBIC');
    assert.equal(fullRes.data.pointGroup.order, 24);
    assert.equal(fullRes.data.pointGroup.completeness, 'FULL_GROUP_VERIFIED');
    assert.equal(fullRes.data.inversionCenter.exists, false);
    assert.equal(fullRes.data.inversionCenter.status, 'REFUTED');
    assert.ok(fullRes.data.testedOperationsCount >= 24);

    // 4. Symmetry breaking on perturbed tetrahedron: classified as C_1 (trivial)
    const perturb = gateway.executeCommand({
      command: 'perturb_geometry',
      vertexId: 'A',
      offset: createPoint3D(0.25, -0.15, 0.1),
    });
    assert.equal(perturb.success, true);
    const perturbedStateId = perturb.data.resultingStateId;

    const perturbedSymRes = gateway.executeCommand({
      command: 'inspect_symmetry_passport',
      targetStateId: perturbedStateId,
      evaluateFullGroup: true,
    });
    assert.equal(perturbedSymRes.success, true);
    assert.equal(perturbedSymRes.data.classificationStatus, 'VERIFIED');
    assert.equal(perturbedSymRes.data.pointGroup.schoenflies, 'C_1');
    assert.equal(perturbedSymRes.data.pointGroup.order, 1);
    assert.equal(perturbedSymRes.data.pointGroup.completeness, 'FULL_GROUP_VERIFIED');
  });
});
