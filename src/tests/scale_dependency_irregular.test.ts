import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  computeDerivedMetrics
} from '../core';

test('PAT-27: Scale-Dependency Consistency on Arbitrary Irregular Valid Tetrahedron', async (t) => {
  // Base irregular tetrahedron on unit sphere (normalized points)
  const normA = { x: 0.2, y: 0.4, z: Math.sqrt(1 - 0.2*0.2 - 0.4*0.4) };
  const normB = { x: -0.5, y: -0.5, z: Math.sqrt(1 - 0.5*0.5 - 0.5*0.5) };
  const normC = { x: 0.6, y: -0.3, z: -Math.sqrt(1 - 0.6*0.6 - 0.3*0.3) };
  const normD = { x: -0.4, y: 0.7, z: -Math.sqrt(1 - 0.4*0.4 - 0.7*0.7) };

  const radii = [0.3, 1.0, 2.5, 7.0];
  const results = [];

  for (const R of radii) {
    const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
    const vertices = {
      A: createPoint3D(normA.x * R, normA.y * R, normA.z * R),
      B: createPoint3D(normB.x * R, normB.y * R, normB.z * R),
      C: createPoint3D(normC.x * R, normC.y * R, normC.z * R),
      D: createPoint3D(normD.x * R, normD.y * R, normD.z * R),
    };

    const state = createCanonicalGeometryState(sphere, vertices);
    const metrics = computeDerivedMetrics(state);
    results.push({ R, metrics });
  }

  const base = results.find(r => r.R === 1.0)!;

  await t.test('Irregular edge lengths scale strictly ~ R^1', () => {
    for (const item of results) {
      const scale = item.R / base.R;
      for (const edgeId of ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'] as const) {
        const expected = base.metrics.edges[edgeId].length * scale;
        assert.ok(
          Math.abs(item.metrics.edges[edgeId].length - expected) < 1e-6 * item.R,
          `Irregular edge ${edgeId} scaling mismatch at R=${item.R}`
        );
      }
    }
  });

  await t.test('Irregular face areas scale strictly ~ R^2', () => {
    for (const item of results) {
      const scale2 = Math.pow(item.R / base.R, 2);
      for (const faceId of ['ABC', 'ABD', 'ACD', 'BCD'] as const) {
        const expected = base.metrics.faces[faceId].area * scale2;
        assert.ok(
          Math.abs(item.metrics.faces[faceId].area - expected) < 1e-6 * scale2,
          `Irregular face ${faceId} area scaling mismatch at R=${item.R}`
        );
      }
    }
  });

  await t.test('Irregular signed volume scales strictly ~ R^3', () => {
    for (const item of results) {
      const scale3 = Math.pow(item.R / base.R, 3);
      const expected = base.metrics.global.signedVolume * scale3;
      assert.ok(
        Math.abs(item.metrics.global.signedVolume - expected) < 1e-5 * scale3,
        `Irregular volume scaling mismatch at R=${item.R}`
      );
    }
  });

  await t.test('Irregular non-regularity remains invariant under scaling', () => {
    for (const item of results) {
      assert.equal(item.metrics.global.isRegular, false);
      assert.equal(item.metrics.global.orientation, base.metrics.global.orientation);
    }
  });

  await t.test('Centroid coordinates scale strictly ~ R^1', () => {
    for (const item of results) {
      const scale = item.R / base.R;
      assert.ok(
        Math.abs(item.metrics.global.centroid.x - base.metrics.global.centroid.x * scale) < 1e-6 * item.R &&
        Math.abs(item.metrics.global.centroid.y - base.metrics.global.centroid.y * scale) < 1e-6 * item.R &&
        Math.abs(item.metrics.global.centroid.z - base.metrics.global.centroid.z * scale) < 1e-6 * item.R
      );
    }
  });
});
