import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  validateGeometryState,
  deriveRepresentationState,
  createStandOracle,
  EpistemicStatus
} from '../core';

test('Agent Readiness & Oracle Boundary Smoke Suite (10 Contracts)', async (t) => {
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
  const oracle = createStandOracle(canonical, representation, validation);

  await t.test('Contract 01: Oracle returns valid immutable state snapshot', () => {
    const snap = oracle.getStateSnapshot();
    assert.ok(snap.signature.length > 0);
    assert.equal(snap.validation.isValid, true);
    assert.equal(snap.canonical.sphere.radius, 1.0);
  });

  await t.test('Contract 02: True edge length claim passes verification', () => {
    const rep = oracle.verifyClaim({
      claimId: 'c2',
      type: 'EDGE_LENGTH',
      target: 'AB',
      claimedValue: 4 / Math.sqrt(6),
      tolerance: 1e-4
    });
    assert.equal(rep.verified, true);
    assert.equal(rep.epistemicVerdict, EpistemicStatus.VERIFIED);
  });

  await t.test('Contract 03: False edge length claim is refuted', () => {
    const rep = oracle.verifyClaim({
      claimId: 'c3',
      type: 'EDGE_LENGTH',
      target: 'AB',
      claimedValue: 9.99
    });
    assert.equal(rep.verified, false);
    assert.equal(rep.epistemicVerdict, EpistemicStatus.REFUTED);
  });

  await t.test('Contract 04: Invalid edge identifier is rejected with error', () => {
    const rep = oracle.verifyClaim({
      claimId: 'c4',
      type: 'EDGE_LENGTH',
      target: 'ZZ',
      claimedValue: 1.0
    });
    assert.equal(rep.verified, false);
    assert.equal(rep.epistemicVerdict, EpistemicStatus.REFUTED);
    assert.equal(rep.groundTruthValue, 'INVALID_EDGE_ID');
  });

  await t.test('Contract 05: True face area claim passes verification', () => {
    const expectedArea = (2 * Math.sqrt(3)) / 3;
    const rep = oracle.verifyClaim({
      claimId: 'c5',
      type: 'FACE_AREA',
      target: 'ABC',
      claimedValue: expectedArea,
      tolerance: 1e-4
    });
    assert.equal(rep.verified, true);
    assert.equal(rep.epistemicVerdict, EpistemicStatus.VERIFIED);
  });

  await t.test('Contract 06: Volume calculation is strictly checked against determinant', () => {
    const expectedV = (8 * Math.sqrt(3)) / 27;
    const rep = oracle.verifyClaim({
      claimId: 'c6',
      type: 'VOLUME',
      target: 'ABCD',
      claimedValue: expectedV,
      tolerance: 1e-4
    });
    assert.equal(rep.verified, true);
  });

  await t.test('Contract 07: Regularity claim verified for regular tetrahedron', () => {
    const rep = oracle.verifyClaim({
      claimId: 'c7',
      type: 'IS_REGULAR',
      target: 'ABCD',
      claimedValue: true
    });
    assert.equal(rep.verified, true);
  });

  await t.test('Contract 08: Orientation claim matches right-handedness', () => {
    const rep = oracle.verifyClaim({
      claimId: 'c8',
      type: 'ORIENTATION',
      target: 'ABCD',
      claimedValue: 'POSITIVE'
    });
    assert.equal(rep.verified, true);
  });

  await t.test('Contract 09: Point on sphere validation returns true for canonical vertex', () => {
    const rep = oracle.verifyClaim({
      claimId: 'c9',
      type: 'POINT_ON_SPHERE',
      target: 'A',
      claimedValue: true
    });
    assert.equal(rep.verified, true);
  });

  await t.test('Contract 10: Batch verification executes atomically over multiple hypotheses', () => {
    const batch = oracle.verifyBatch([
      { claimId: 'b1', type: 'EDGE_LENGTH', target: 'AC', claimedValue: 4 / Math.sqrt(6), tolerance: 1e-4 },
      { claimId: 'b2', type: 'VOLUME', target: 'ABCD', claimedValue: -5.0 }, // false
      { claimId: 'b3', type: 'IS_REGULAR', target: 'ABCD', claimedValue: true }
    ]);
    assert.equal(batch.length, 3);
    assert.equal(batch[0].verified, true);
    assert.equal(batch[1].verified, false);
    assert.equal(batch[2].verified, true);
  });
});
