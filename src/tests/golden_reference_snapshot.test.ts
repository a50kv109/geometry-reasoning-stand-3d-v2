import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPoint3D,
  computeDerivedMetrics,
  computeLVG,
  constructRegularTetrahedron,
  createAgentGateway,
  evaluateTetrahedralCandidateSymmetries,
} from '../core';

/**
 * GOLDEN REFERENCE BENCHMARK & REPLICATION VERIFICATION SUITE
 * 
 * Verifies exact analytical values for canonical regular and perturbed states.
 * Any independent reproduction of the Tetraider Sphere stand must pass these
 * assertions within machine epsilon tolerances.
 */

test('Golden Benchmark 01: Canonical Regular Tetrahedron Analytical Ground Truth', () => {
  const R = 1.0;
  const res = constructRegularTetrahedron(R);
  assert.equal(res.success, true);
  const state = res.canonicalState!;
  const metrics = computeDerivedMetrics(state);

  // Exact analytical values
  const theoreticalEdge = (4 / Math.sqrt(6)) * R; // ~ 1.632993161855452
  const theoreticalFaceArea = ((2 * Math.sqrt(3)) / 3) * (R * R); // ~ 1.1547005383792515
  const theoreticalVolume = ((8 * Math.sqrt(3)) / 27) * (R * R * R); // ~ 0.5132002392796673
  const theoreticalSolidAngle = 3 * Math.acos(1 / 3) - Math.PI; // ~ 0.551285598429942 sr
  const theoreticalDihedral = (Math.acos(1 / 3) * 180) / Math.PI; // ~ 70.528779°

  // 1. Edge Lengths: all 6 must match analytical value within 1e-10
  const edgeKeys = ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'] as const;
  for (const k of edgeKeys) {
    const len = metrics.edges[k].length;
    assert.ok(
      Math.abs(len - theoreticalEdge) < 1e-10,
      `Edge ${k} length ${len} must match analytical ${theoreticalEdge}`
    );
  }

  // 2. Face Areas: all 4 must match analytical value within 1e-10
  const faceKeys = ['ABC', 'ABD', 'ACD', 'BCD'] as const;
  for (const k of faceKeys) {
    const area = metrics.faces[k].area;
    assert.ok(
      Math.abs(area - theoreticalFaceArea) < 1e-10,
      `Face ${k} area ${area} must match analytical ${theoreticalFaceArea}`
    );
  }

  // 3. Signed Volume: must match analytical value within 1e-10
  assert.ok(
    Math.abs(metrics.global.signedVolume - theoreticalVolume) < 1e-10,
    `Signed volume ${metrics.global.signedVolume} must match analytical ${theoreticalVolume}`
  );

  // 4. Centroid: must coincide with sphere center (0, 0, 0) within 1e-10
  const G = metrics.global.centroid;
  assert.ok(Math.abs(G.x) < 1e-10, 'Centroid X must be 0');
  assert.ok(Math.abs(G.y) < 1e-10, 'Centroid Y must be 0');
  assert.ok(Math.abs(G.z) < 1e-10, 'Centroid Z must be 0');

  // 5. Local Vertex Geometry: Solid angle & dihedral angles at vertex A
  const lvgA = computeLVG(state, 'A');
  assert.ok(
    Math.abs(lvgA.solidAngle - theoreticalSolidAngle) < 1e-10,
    `Solid angle ${lvgA.solidAngle} must match analytical ${theoreticalSolidAngle}`
  );

  // Planar face angles at vertex A must all be 60° (PI/3)
  for (const theta of Object.values(lvgA.planarAngles)) {
    assert.ok(
      Math.abs(theta - Math.PI / 3) < 1e-10,
      `Planar face angle ${theta} must be PI/3 (60°)`
    );
  }

  // Dihedral angles must match arccos(1/3)
  for (const dih of Object.values(lvgA.dihedralAngles)) {
    assert.ok(
      Math.abs((dih * 180) / Math.PI - theoreticalDihedral) < 1e-8,
      `Dihedral angle ${(dih * 180) / Math.PI}° must match ${theoreticalDihedral}°`
    );
  }

  // Gram determinant
  assert.ok(
    Math.abs(lvgA.gramDeterminant - 0.5) < 1e-10,
    `Gram determinant ${lvgA.gramDeterminant} must be 0.5`
  );
});

test('Golden Benchmark 02: Full Fedorov Symmetry Group Classification T_d (Order 24)', () => {
  const res = constructRegularTetrahedron(1.0);
  const state = res.canonicalState!;

  // Pass fullGroup = true to evaluate all 24 operations of T_d
  const evalRes = evaluateTetrahedralCandidateSymmetries(state.vertices, 1e-5, state.sphere.center, true);

  // Full group order must be 24 (all tested operations are invariant)
  assert.equal(evalRes.totalTested, 24, 'Full candidate operations count must be 24');
  assert.equal(evalRes.invariantCount, 24, 'All 24 candidate operations of T_d must be invariant');

  // Central inversion must be FALSE for regular tetrahedron
  assert.equal(evalRes.inversionInvariant, false, 'Regular tetrahedron lacks central inversion symmetry');

  // Invariant operations must all be VERIFIED
  const verifiedOps = evalRes.testedOperations.filter((r) => r.isInvariant);
  assert.equal(verifiedOps.length, 24, 'All 24 operations must be verified invariant');
});

test('Golden Benchmark 03: Symmetry Reduction Under Controlled Perturbation (T_d -> C_1)', () => {
  const res = constructRegularTetrahedron(1.0);
  const state = res.canonicalState!;
  const gateway = createAgentGateway(state);

  // Perturb vertex D by offset (0.1, -0.1, 0.05)
  const perturbRes = gateway.executeCommand({
    command: 'perturb_geometry',
    vertexId: 'D',
    offset: { x: 0.1, y: -0.1, z: 0.05 },
    preserveSphereConstraint: true,
  });
  assert.equal(perturbRes.success, true);
  const perturbedState = perturbRes.data.newState;

  // Inspect Symmetry Passport of perturbed state with full group check
  const symPassRes = gateway.executeCommand({
    command: 'inspect_symmetry_passport',
    targetStateId: perturbRes.data.resultingStateId,
    evaluateFullGroup: true,
  });
  assert.equal(symPassRes.success, true);

  const symPass = symPassRes.data;
  assert.equal(symPass.pointGroup.completeness, 'FULL_GROUP_VERIFIED');
  assert.equal(symPass.pointGroup.order, 1, 'Perturbed tetrahedron symmetry order must degrade to 1 (identity only)');
  assert.equal(symPass.pointGroup.schoenflies, 'C_1', 'Perturbed tetrahedron point group must be C_1');
  assert.equal(symPass.inversionCenter.exists, false);
  assert.equal(symPass.inversionCenter.status, 'REFUTED');
});

test('Golden Benchmark 04: Scale Invariance of Dimensionless Ratios and Solid Angles', () => {
  const R = 1.0;
  const k = 3.5; // Scale factor

  const baseRes = constructRegularTetrahedron(R);
  const scaleRes = constructRegularTetrahedron(R * k);

  const baseMetrics = computeDerivedMetrics(baseRes.canonicalState!);
  const scaleMetrics = computeDerivedMetrics(scaleRes.canonicalState!);

  const baseLVG = computeLVG(baseRes.canonicalState!, 'A');
  const scaleLVG = computeLVG(scaleRes.canonicalState!, 'A');

  // Edge length ratio = k
  const edgeRatio = scaleMetrics.edges.AB.length / baseMetrics.edges.AB.length;
  assert.ok(Math.abs(edgeRatio - k) < 1e-10, `Edge ratio ${edgeRatio} must equal ${k}`);

  // Area ratio = k^2
  const areaRatio = scaleMetrics.faces.ABC.area / baseMetrics.faces.ABC.area;
  assert.ok(Math.abs(areaRatio - k * k) < 1e-10, `Area ratio ${areaRatio} must equal ${k * k}`);

  // Volume ratio = k^3
  const volRatio = scaleMetrics.global.signedVolume / baseMetrics.global.signedVolume;
  assert.ok(Math.abs(volRatio - k * k * k) < 1e-10, `Volume ratio ${volRatio} must equal ${k * k * k}`);

  // Solid angle must be scale-invariant
  assert.ok(
    Math.abs(scaleLVG.solidAngle - baseLVG.solidAngle) < 1e-12,
    'Solid angle must be strictly scale-invariant'
  );

  // Planar face angles must be scale-invariant
  const baseAngles = Object.values(baseLVG.planarAngles);
  const scaleAngles = Object.values(scaleLVG.planarAngles);
  assert.ok(
    Math.abs(scaleAngles[0] - baseAngles[0]) < 1e-12,
    'Planar face angle must be strictly scale-invariant'
  );
});

test('Golden Benchmark 05: Agent Gateway Programmatic Oracle Invariants', () => {
  const res = constructRegularTetrahedron(1.0);
  const gateway = createAgentGateway(res.canonicalState!);

  // 1. inspect_passport returns valid PGO-3D Object Passport
  const passRes = gateway.executeCommand({ command: 'inspect_passport' });
  assert.equal(passRes.success, true);
  assert.equal(passRes.data.topology.vertexLabels.length, 4);
  assert.equal(passRes.data.topology.edgeCount, 6);
  assert.equal(passRes.data.topology.faceCount, 4);
  assert.equal(passRes.data.topology.eulerCharacteristic, 2);

  // 2. inspect_symmetry_passport with evaluateFullGroup: true returns T_d order 24
  const symRes = gateway.executeCommand({
    command: 'inspect_symmetry_passport',
    evaluateFullGroup: true,
  });
  assert.equal(symRes.success, true);
  assert.equal(symRes.data.pointGroup.schoenflies, 'T_d');
  assert.equal(symRes.data.pointGroup.order, 24);
  assert.equal(symRes.data.classificationStatus, 'VERIFIED');
  assert.equal(symRes.data.inversionCenter.exists, false);

  // 3. verify_claim on exact signed volume succeeds with zero residual
  const volClaimRes = gateway.executeCommand({
    command: 'verify_claim',
    hypothesis: {
      predicate: 'SIGNED_VOLUME_EQUALS',
      claimedValue: (8 * Math.sqrt(3)) / 27,
      toleranceHint: 1e-6,
    },
  });
  assert.equal(volClaimRes.success, true);
  assert.equal(volClaimRes.data.verdict, 'VERIFIED');
  assert.ok(
    volClaimRes.data.residual < 1e-12,
    'Verification residual must be below 1e-12'
  );

  // 4. verify_claim on erroneous claim is refuted
  const bogusClaimRes = gateway.executeCommand({
    command: 'verify_claim',
    hypothesis: {
      predicate: 'SIGNED_VOLUME_EQUALS',
      claimedValue: 999.0,
      toleranceHint: 1e-4,
    },
  });
  assert.equal(bogusClaimRes.success, true);
  assert.equal(bogusClaimRes.data.verdict, 'REFUTED');
});
