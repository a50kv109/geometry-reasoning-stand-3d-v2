import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  computeDerivedMetrics
} from '../core';

test('PAT-27: Scale-Dependency Consistency on Regular Tetrahedron', async (t) => {
  const radii = [0.5, 1.0, 2.0, 5.0, 10.0];
  const results = [];

  for (const R of radii) {
    const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
    const vertices = {
      A: createPoint3D(0, 0, R),
      B: createPoint3D((2 * Math.sqrt(2) / 3) * R, 0, (-1 / 3) * R),
      C: createPoint3D((-Math.sqrt(2) / 3) * R, (-Math.sqrt(6) / 3) * R, (-1 / 3) * R),
      D: createPoint3D((-Math.sqrt(2) / 3) * R, (Math.sqrt(6) / 3) * R, (-1 / 3) * R),
    };

    const state = createCanonicalGeometryState(sphere, vertices);
    const metrics = computeDerivedMetrics(state);
    results.push({ R, metrics });
  }

  const base = results.find(r => r.R === 1.0)!;

  await t.test('Edge length scales linearly with R (L ~ R^1)', () => {
    for (const item of results) {
      const scale = item.R / base.R;
      const expectedEdge = base.metrics.edges.AB.length * scale;
      assert.ok(
        Math.abs(item.metrics.edges.AB.length - expectedEdge) < 1e-6 * item.R,
        `Edge length at R=${item.R} expected ${expectedEdge}, got ${item.metrics.edges.AB.length}`
      );
    }
  });

  await t.test('Face area scales quadratically with R (Area ~ R^2)', () => {
    for (const item of results) {
      const scale2 = Math.pow(item.R / base.R, 2);
      const expectedArea = base.metrics.faces.ABC.area * scale2;
      assert.ok(
        Math.abs(item.metrics.faces.ABC.area - expectedArea) < 1e-6 * Math.pow(item.R, 2),
        `Face area at R=${item.R} expected ${expectedArea}, got ${item.metrics.faces.ABC.area}`
      );
    }
  });

  await t.test('Total surface area scales quadratically with R (Total Area ~ R^2)', () => {
    for (const item of results) {
      const scale2 = Math.pow(item.R / base.R, 2);
      const expectedTotalArea = base.metrics.global.totalSurfaceArea * scale2;
      assert.ok(
        Math.abs(item.metrics.global.totalSurfaceArea - expectedTotalArea) < 1e-5 * Math.pow(item.R, 2),
        `Total area at R=${item.R} expected ${expectedTotalArea}, got ${item.metrics.global.totalSurfaceArea}`
      );
    }
  });

  await t.test('Signed volume scales cubically with R (Volume ~ R^3)', () => {
    for (const item of results) {
      const scale3 = Math.pow(item.R / base.R, 3);
      const expectedVolume = base.metrics.global.signedVolume * scale3;
      assert.ok(
        Math.abs(item.metrics.global.signedVolume - expectedVolume) < 1e-5 * Math.pow(item.R, 3),
        `Volume at R=${item.R} expected ${expectedVolume}, got ${item.metrics.global.signedVolume}`
      );
    }
  });

  await t.test('Regularity and dimensionless orientation remain invariant under scaling', () => {
    for (const item of results) {
      assert.equal(item.metrics.global.isRegular, true);
      assert.equal(item.metrics.global.orientation, 'POSITIVE');
    }
  });
});
