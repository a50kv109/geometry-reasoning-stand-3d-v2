import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  computeLVG,
  computeDLVM,
  computeAllDLVMs,
  verifySharedEdges,
  computeGDS,
  createObservation,
  computeStateTransition,
  createTemporalTrace,
  CanonicalGeometryState,
  EpistemicStatus,
} from '../core';

function getRegularTetrahedron(R: number = 100): CanonicalGeometryState {
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const a = R / Math.sqrt(3);
  const vertices = {
    A: createPoint3D(a, a, a),
    B: createPoint3D(a, -a, -a),
    C: createPoint3D(-a, a, -a),
    D: createPoint3D(-a, -a, a),
  };
  return createCanonicalGeometryState(sphere, vertices);
}

function getIrregularTetrahedron(R: number = 100): CanonicalGeometryState {
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const vertices = {
    A: createPoint3D(0, 0, R),
    B: createPoint3D(R * Math.cos(0), R * Math.sin(0), 0),
    C: createPoint3D(R * Math.cos(2), R * Math.sin(2), 0),
    D: createPoint3D(R * Math.cos(4), R * Math.sin(4), -R * 0.5),
  };
  // Normalize D onto sphere
  const dLen = Math.sqrt(vertices.D.x ** 2 + vertices.D.y ** 2 + vertices.D.z ** 2);
  const normD = createPoint3D((vertices.D.x / dLen) * R, (vertices.D.y / dLen) * R, (vertices.D.z / dLen) * R);

  return createCanonicalGeometryState(sphere, {
    A: vertices.A,
    B: vertices.B,
    C: vertices.C,
    D: normD,
  });
}

test('LVG-01: Regular tetrahedron has symmetric planar angles and positive solid angle', () => {
  const state = getRegularTetrahedron(100);
  const lvgA = computeLVG(state, 'A');

  assert.equal(lvgA.vertexId, 'A');
  assert.equal(lvgA.degeneracy, 'D0_VALID');
  assert.equal(lvgA.isValid, true);
  assert.ok(lvgA.solidAngle > 0, 'Solid angle must be strictly positive');

  // For regular tetrahedron, all planar angles at any vertex are 60 degrees (pi/3 radians)
  const expectedAngle = Math.PI / 3;
  for (const angle of Object.values(lvgA.planarAngles)) {
    assert.ok(Math.abs(angle - expectedAngle) < 1e-5, `Planar angle ${angle} should be close to pi/3`);
  }
});

test('LVG-02: Uniform scaling preserves angular relationships and solid angle', () => {
  const state1 = getRegularTetrahedron(50);
  const state2 = getRegularTetrahedron(150);

  const lvg1 = computeLVG(state1, 'A');
  const lvg2 = computeLVG(state2, 'A');

  // Solid angles must match invariant of scale
  assert.ok(
    Math.abs(lvg1.solidAngle - lvg2.solidAngle) < 1e-10,
    `Solid angle should be scale invariant: ${lvg1.solidAngle} vs ${lvg2.solidAngle}`
  );

  // Planar angles must match
  for (const key of Object.keys(lvg1.planarAngles)) {
    assert.ok(
      Math.abs(lvg1.planarAngles[key] - lvg2.planarAngles[key]) < 1e-10,
      `Planar angle ${key} must be invariant`
    );
  }
});

test('LVG-03: Rigid translation preserves LVG intrinsic angular geometry', () => {
  const state1 = getRegularTetrahedron(100);
  // Translate sphere and vertices by (10, 20, 30)
  const sphere2 = createSphere3D(createPoint3D(10, 20, 30), 100);
  const vertices2 = {
    A: createPoint3D(state1.vertices.A.x + 10, state1.vertices.A.y + 20, state1.vertices.A.z + 30),
    B: createPoint3D(state1.vertices.B.x + 10, state1.vertices.B.y + 20, state1.vertices.B.z + 30),
    C: createPoint3D(state1.vertices.C.x + 10, state1.vertices.C.y + 20, state1.vertices.C.z + 30),
    D: createPoint3D(state1.vertices.D.x + 10, state1.vertices.D.y + 20, state1.vertices.D.z + 30),
  };
  const state2 = createCanonicalGeometryState(sphere2, vertices2);

  const lvg1 = computeLVG(state1, 'A');
  const lvg2 = computeLVG(state2, 'A');

  assert.ok(Math.abs(lvg1.solidAngle - lvg2.solidAngle) < 1e-10, 'Solid angle invariant under translation');
  assert.ok(Math.abs(lvg1.gramDeterminant - lvg2.gramDeterminant) < 1e-10, 'Gram det invariant under translation');
});

test('LVG-04: Coplanar incident edges trigger D2_COPLANAR_EDGES degeneracy', () => {
  const sphere = createSphere3D(createPoint3D(0, 0, 0), 100);
  // Make B, C, D coplanar with A on z=0 plane
  const state = createCanonicalGeometryState(sphere, {
    A: createPoint3D(100, 0, 0),
    B: createPoint3D(0, 100, 0),
    C: createPoint3D(-100, 0, 0),
    D: createPoint3D(0, -100, 0),
  });

  const lvgA = computeLVG(state, 'A');
  assert.equal(lvgA.degeneracy, 'D2_COPLANAR_EDGES');
  assert.equal(lvgA.orientation, 'COPLANAR');
});

test('DLVM-01: Four DLVMs are computed deterministically', () => {
  const state = getRegularTetrahedron(100);
  const all = computeAllDLVMs(state);

  // Micro-fix verified: Boolean coercion for TypeScript assertion correctness
  assert.ok(Boolean(all.A && all.B && all.C && all.D), 'four DLVM');

  assert.equal(all.A.vertexId, 'A');
  assert.equal(all.B.vertexId, 'B');
  assert.equal(all.C.vertexId, 'C');
  assert.equal(all.D.vertexId, 'D');
});

test('DLVM-02: Shared-edge anti-parallelism u_AB = -u_BA holds across all pairs', () => {
  const state = getRegularTetrahedron(100);
  const dlvms = computeAllDLVMs(state);
  const verification = verifySharedEdges(dlvms, 100);

  assert.equal(verification.valid, true);
  assert.ok(verification.maxResidual < 1e-12, `Residual should be negligible: ${verification.maxResidual}`);
});

test('GDS-01: GDS aggregates 4xDLVM, global metrics, and epistemic state without mutation', () => {
  const state = getRegularTetrahedron(100);
  const gds = computeGDS(state, EpistemicStatus.VERIFIED, 1000);

  assert.equal(gds.timestamp, 1000);
  assert.equal(gds.epistemicStatus, EpistemicStatus.VERIFIED);
  assert.equal(gds.isDegenerate, false);
  assert.equal(gds.sharedEdgeConsistency.valid, true);
  assert.ok(gds.globalMetrics.isRegular, 'Regular tetrahedron should be marked regular in GDS');
});

test('Temporal-01: Valid state transition computes correct delta measurements', () => {
  const state0 = getRegularTetrahedron(100);
  // Perturb vertex A slightly on the sphere
  const sphere = state0.sphere;
  const pA = state0.vertices.A;
  const state1 = createCanonicalGeometryState(sphere, {
    ...state0.vertices,
    A: createPoint3D(pA.x, pA.y + 2, Math.sqrt(100 ** 2 - pA.x ** 2 - (pA.y + 2) ** 2)),
  });

  const gds0 = computeGDS(state0, EpistemicStatus.VERIFIED, 100);
  const gds1 = computeGDS(state1, EpistemicStatus.VERIFIED, 200);

  const obs0 = createObservation(gds0);
  const obs1 = createObservation(gds1);

  const transition = computeStateTransition(obs0, obs1, state0, state1);

  assert.equal(transition.isValidOrdering, true);
  assert.equal(transition.status, 'VALID');
  assert.equal(transition.dt, 100);
  assert.ok(transition.measurements !== null);
  assert.ok(transition.measurements!.vertexDisplacements.A > 0, 'Vertex A displacement should be recorded');
  assert.equal(transition.measurements!.vertexDisplacements.B, 0, 'Vertex B displacement should be 0');
});

test('Temporal-02: Non-monotonic or negative time transition flags CORRUPTED status', () => {
  const state0 = getRegularTetrahedron(100);
  const gds0 = computeGDS(state0, EpistemicStatus.VERIFIED, 500);
  const gds1 = computeGDS(state0, EpistemicStatus.VERIFIED, 400); // Reverse time!

  const obs0 = createObservation(gds0, 500);
  const obs1 = createObservation(gds1, 400);

  const transition = computeStateTransition(obs0, obs1, state0, state0);

  assert.equal(transition.isValidOrdering, false);
  assert.equal(transition.status, 'CORRUPTED');
  assert.equal(transition.measurements, null);
});

test('Temporal-03: TemporalTrace aggregates sequence with PRISTINE quality', () => {
  const state0 = getRegularTetrahedron(100);
  const state1 = getRegularTetrahedron(100);

  const obs0 = createObservation(computeGDS(state0, EpistemicStatus.VERIFIED, 100));
  const obs1 = createObservation(computeGDS(state1, EpistemicStatus.VERIFIED, 200));

  const trace = createTemporalTrace([obs0, obs1], [state0, state1]);

  assert.equal(trace.quality, 'PRISTINE');
  assert.equal(trace.transitions.length, 1);
  assert.equal(trace.transitions[0].status, 'VALID');
});
