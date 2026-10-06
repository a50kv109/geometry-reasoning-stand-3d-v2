import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  computeDerivedMetrics,
  computeRegularTetrahedronMetric
} from '../core';

test('Regular Tetrahedron Inscribed Metric Verification Suite', async (t) => {
  const R = 2.0;
  const theoretical = computeRegularTetrahedronMetric(R);

  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const vertices = {
    A: createPoint3D(0, 0, R),
    B: createPoint3D((2 * Math.sqrt(2) / 3) * R, 0, (-1 / 3) * R),
    C: createPoint3D((-Math.sqrt(2) / 3) * R, (-Math.sqrt(6) / 3) * R, (-1 / 3) * R),
    D: createPoint3D((-Math.sqrt(2) / 3) * R, (Math.sqrt(6) / 3) * R, (-1 / 3) * R),
  };

  const state = createCanonicalGeometryState(sphere, vertices);
  const computed = computeDerivedMetrics(state);

  await t.test('Edge length matches inscribed formula: L = 4/sqrt(6) * R', () => {
    const expectedL = (4 / Math.sqrt(6)) * R;
    assert.ok(Math.abs(theoretical.edgeLength - expectedL) < 1e-9);
    assert.ok(Math.abs(computed.edges.AB.length - expectedL) < 1e-6);
  });

  await t.test('Face area matches inscribed formula: Area = 2*sqrt(3)/3 * R^2', () => {
    const expectedArea = ((2 * Math.sqrt(3)) / 3) * Math.pow(R, 2);
    assert.ok(Math.abs(theoretical.faceArea - expectedArea) < 1e-9);
    assert.ok(Math.abs(computed.faces.ABC.area - expectedArea) < 1e-6);
  });

  await t.test('Total surface area matches 4 * Face Area', () => {
    const expectedTotal = ((8 * Math.sqrt(3)) / 3) * Math.pow(R, 2);
    assert.ok(Math.abs(theoretical.totalSurfaceArea - expectedTotal) < 1e-9);
    assert.ok(Math.abs(computed.global.totalSurfaceArea - expectedTotal) < 1e-6);
  });

  await t.test('Volume matches inscribed formula: V = 8*sqrt(3)/27 * R^3', () => {
    const expectedV = ((8 * Math.sqrt(3)) / 27) * Math.pow(R, 3);
    assert.ok(Math.abs(theoretical.volume - expectedV) < 1e-9);
    assert.ok(Math.abs(computed.global.signedVolume - expectedV) < 1e-6);
  });
});
