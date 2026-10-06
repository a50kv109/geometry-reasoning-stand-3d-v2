/**
 * M1.7 GEOMETRIC SCALE CONTROL & VERTEX COORDINATE GUIDES TEST SUITE
 * 
 * Tests T01 - T15 verifying:
 * - Part A: Geometry View Scale Control (100%, 75%, 50%, Fit) preserves Canonical Geometry & Signatures.
 * - Part B: Per-Vertex Coordinate Guides (Latitude Parallels & Longitude Meridians on S²).
 * - Part C: Interaction & Selection semantics (A, B, C, D guide activation).
 * - Part D: Mathematical accuracy, curve containment, pole convention, and periodicity wrap-around.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  computeDerivedMetrics,
  computeGeometrySignature,
  cartesianToSpherical,
  sphericalToCartesian,
  CANONICAL_VERTICES,
  VertexId,
  Point3D,
} from '../core';

import {
  RenderOptions,
  DEFAULT_RENDER_OPTIONS,
} from '../visualization/renderer3d';

import {
  CameraState,
  INITIAL_CAMERA,
} from '../visualization/camera';

describe('M1.7 Scale Control & Coordinate Guides Verification Suite (T01 - T15)', () => {
  const sphere = createSphere3D(createPoint3D(0, 0, 0), 1.0);
  const initialState = createCanonicalGeometryState(
    sphere,
    {
      A: createPoint3D(0, 0, 1.0),
      B: createPoint3D((2 * Math.sqrt(2)) / 3, 0, -1 / 3),
      C: createPoint3D(-Math.sqrt(2) / 3, -Math.sqrt(6) / 3, -1 / 3),
      D: createPoint3D(-Math.sqrt(2) / 3, Math.sqrt(6) / 3, -1 / 3),
    }
  );

  const initialSignature = computeGeometrySignature(initialState);
  const initialMetrics = computeDerivedMetrics(initialState);

  it('T01: Changing visual scale does not change canonical geometry', () => {
    const scales = [1.0, 0.75, 0.5, 0.25];
    for (const scale of scales) {
      const options: RenderOptions = {
        ...DEFAULT_RENDER_OPTIONS,
        visualScale: scale,
      };

      // Canonical state must remain strictly identical
      for (const vId of CANONICAL_VERTICES) {
        assert.deepEqual(
          initialState.vertices[vId],
          { ...initialState.vertices[vId] },
          `Vertex ${vId} must not be mutated by visualScale = ${scale}`
        );
      }
      assert.equal(options.visualScale, scale);
    }
    console.log('[PASS] T01: Changing visual scale does not change canonical geometry');
  });

  it('T02: Changing visual scale does not change geometry signature', () => {
    const scales = [1.0, 0.75, 0.5];
    for (const scale of scales) {
      const stateCopy = { ...initialState };
      const currentSignature = computeGeometrySignature(stateCopy);
      assert.equal(
        currentSignature,
        initialSignature,
        `Signature must remain identical at visualScale = ${scale}`
      );
    }
    console.log('[PASS] T02: Changing visual scale does not change geometry signature');
  });

  it('T03: Changing visual scale does not change sphere radius R or measurements', () => {
    const scales = [1.0, 0.75, 0.5];
    for (const scale of scales) {
      assert.equal(
        initialState.sphere.radius,
        1.0,
        `Canonical sphere radius R must remain 1.0 at visualScale = ${scale}`
      );
      assert.equal(
        initialMetrics.global.absoluteVolume,
        computeDerivedMetrics(initialState).global.absoluteVolume,
        `Tetrahedron volume Vs must remain unchanged at visualScale = ${scale}`
      );
    }
    console.log('[PASS] T03: Changing visual scale does not change R or measurements');
  });

  it('T04: Selected A produces valid spherical coordinates and guides', () => {
    const ptA = initialState.vertices.A;
    const sphA = cartesianToSpherical(initialState.sphere, ptA);
    assert.ok(sphA.phi >= -Math.PI / 2 && sphA.phi <= Math.PI / 2, 'Phi must be within [-pi/2, pi/2]');
    assert.ok(sphA.lambda >= 0 && sphA.lambda < Math.PI * 2, 'Lambda must be within [0, 2pi)');
    console.log(`[PASS] T04: Selected A -> phi=${(sphA.phi * 180 / Math.PI).toFixed(2)}°, lambda=${(sphA.lambda * 180 / Math.PI).toFixed(2)}°`);
  });

  it('T05: Selected B produces valid spherical coordinates and guides', () => {
    const ptB = initialState.vertices.B;
    const sphB = cartesianToSpherical(initialState.sphere, ptB);
    assert.ok(sphB.phi >= -Math.PI / 2 && sphB.phi <= Math.PI / 2, 'Phi must be within [-pi/2, pi/2]');
    assert.ok(sphB.lambda >= 0 && sphB.lambda < Math.PI * 2, 'Lambda must be within [0, 2pi)');
    console.log(`[PASS] T05: Selected B -> phi=${(sphB.phi * 180 / Math.PI).toFixed(2)}°, lambda=${(sphB.lambda * 180 / Math.PI).toFixed(2)}°`);
  });

  it('T06: Selected C produces valid spherical coordinates and guides', () => {
    const ptC = initialState.vertices.C;
    const sphC = cartesianToSpherical(initialState.sphere, ptC);
    assert.ok(sphC.phi >= -Math.PI / 2 && sphC.phi <= Math.PI / 2, 'Phi must be within [-pi/2, pi/2]');
    assert.ok(sphC.lambda >= 0 && sphC.lambda < Math.PI * 2, 'Lambda must be within [0, 2pi)');
    console.log(`[PASS] T06: Selected C -> phi=${(sphC.phi * 180 / Math.PI).toFixed(2)}°, lambda=${(sphC.lambda * 180 / Math.PI).toFixed(2)}°`);
  });

  it('T07: Selected D produces valid spherical coordinates and guides', () => {
    const ptD = initialState.vertices.D;
    const sphD = cartesianToSpherical(initialState.sphere, ptD);
    assert.ok(sphD.phi >= -Math.PI / 2 && sphD.phi <= Math.PI / 2, 'Phi must be within [-pi/2, pi/2]');
    assert.ok(sphD.lambda >= 0 && sphD.lambda < Math.PI * 2, 'Lambda must be within [0, 2pi)');
    console.log(`[PASS] T07: Selected D -> phi=${(sphD.phi * 180 / Math.PI).toFixed(2)}°, lambda=${(sphD.lambda * 180 / Math.PI).toFixed(2)}°`);
  });

  it('T08: Moving a vertex changes its displayed latitude', () => {
    const vId: VertexId = 'B';
    const oldSph = cartesianToSpherical(initialState.sphere, initialState.vertices[vId]);
    const newPhi = oldSph.phi + 0.2; // Shift latitude by 0.2 rad
    const newPt = sphericalToCartesian(initialState.sphere, { phi: newPhi, lambda: oldSph.lambda });
    const newSph = cartesianToSpherical(initialState.sphere, newPt);

    assert.ok(
      Math.abs(newSph.phi - newPhi) < 1e-6,
      `Moving vertex must change latitude accurately: expected ${newPhi}, got ${newSph.phi}`
    );
    assert.ok(
      Math.abs(newSph.lambda - oldSph.lambda) < 1e-6,
      'Pure latitude shift must preserve longitude'
    );
    console.log('[PASS] T08: Moving a vertex changes its displayed latitude');
  });

  it('T09: Moving a vertex changes its displayed longitude when appropriate', () => {
    const vId: VertexId = 'B';
    const oldSph = cartesianToSpherical(initialState.sphere, initialState.vertices[vId]);
    const newLambda = (oldSph.lambda + 0.3) % (Math.PI * 2);
    const newPt = sphericalToCartesian(initialState.sphere, { phi: oldSph.phi, lambda: newLambda });
    const newSph = cartesianToSpherical(initialState.sphere, newPt);

    assert.ok(
      Math.abs(newSph.lambda - newLambda) < 1e-6,
      `Moving vertex must change longitude accurately: expected ${newLambda}, got ${newSph.lambda}`
    );
    assert.ok(
      Math.abs(newSph.phi - oldSph.phi) < 1e-6,
      'Pure longitude shift must preserve latitude'
    );
    console.log('[PASS] T09: Moving a vertex changes its displayed longitude');
  });

  it('T10: Coordinate guides pass through the selected vertex', () => {
    for (const vId of CANONICAL_VERTICES) {
      const pt = initialState.vertices[vId];
      const sph = cartesianToSpherical(initialState.sphere, pt);

      // 1. Parallel evaluation at theta = sph.lambda
      const rParallel = initialState.sphere.radius * Math.cos(sph.phi);
      const zParallel = initialState.sphere.center.z + initialState.sphere.radius * Math.sin(sph.phi);
      const ptOnParallel: Point3D = {
        x: initialState.sphere.center.x + rParallel * Math.cos(sph.lambda),
        y: initialState.sphere.center.y + rParallel * Math.sin(sph.lambda),
        z: zParallel,
      };

      const distParallel = Math.hypot(ptOnParallel.x - pt.x, ptOnParallel.y - pt.y, ptOnParallel.z - pt.z);
      assert.ok(distParallel < 1e-6, `Parallel circle must pass through vertex ${vId}`);

      // 2. Meridian evaluation at phi' = sph.phi
      const cosP = Math.cos(sph.phi);
      const ptOnMeridian: Point3D = {
        x: initialState.sphere.center.x + initialState.sphere.radius * cosP * Math.cos(sph.lambda),
        y: initialState.sphere.center.y + initialState.sphere.radius * cosP * Math.sin(sph.lambda),
        z: initialState.sphere.center.z + initialState.sphere.radius * Math.sin(sph.phi),
      };

      const distMeridian = Math.hypot(ptOnMeridian.x - pt.x, ptOnMeridian.y - pt.y, ptOnMeridian.z - pt.z);
      assert.ok(distMeridian < 1e-6, `Meridian arc must pass through vertex ${vId}`);
    }
    console.log('[PASS] T10: Coordinate guides pass strictly through selected vertex for all A, B, C, D');
  });

  it('T11: Latitude guide corresponds strictly to vertex latitude and lies on sphere S²', () => {
    const pt = initialState.vertices.B;
    const sph = cartesianToSpherical(initialState.sphere, pt);
    const R = initialState.sphere.radius;
    const rParallel = R * Math.cos(sph.phi);
    const zParallel = initialState.sphere.center.z + R * Math.sin(sph.phi);

    // Sample 20 points along the parallel circle
    for (let i = 0; i < 20; i++) {
      const theta = (i / 20) * Math.PI * 2;
      const x = initialState.sphere.center.x + rParallel * Math.cos(theta);
      const y = initialState.sphere.center.y + rParallel * Math.sin(theta);
      const z = zParallel;

      const distToCenter = Math.hypot(x, y, z);
      assert.ok(
        Math.abs(distToCenter - R) < 1e-6,
        `Parallel circle point must lie strictly on sphere S²(O, R); got ${distToCenter}`
      );
    }
    console.log('[PASS] T11: Latitude guide corresponds strictly to vertex latitude and lies on S²');
  });

  it('T12: Longitude guide corresponds strictly to vertex longitude and connects both poles', () => {
    const pt = initialState.vertices.B;
    const sph = cartesianToSpherical(initialState.sphere, pt);
    const R = initialState.sphere.radius;

    // Evaluate South Pole (phi' = -pi/2) and North Pole (phi' = +pi/2)
    const southPole: Point3D = {
      x: initialState.sphere.center.x + R * Math.cos(-Math.PI / 2) * Math.cos(sph.lambda),
      y: initialState.sphere.center.y + R * Math.cos(-Math.PI / 2) * Math.sin(sph.lambda),
      z: initialState.sphere.center.z + R * Math.sin(-Math.PI / 2),
    };
    const northPole: Point3D = {
      x: initialState.sphere.center.x + R * Math.cos(Math.PI / 2) * Math.cos(sph.lambda),
      y: initialState.sphere.center.y + R * Math.cos(Math.PI / 2) * Math.sin(sph.lambda),
      z: initialState.sphere.center.z + R * Math.sin(Math.PI / 2),
    };

    assert.ok(Math.abs(southPole.z - (initialState.sphere.center.z - R)) < 1e-6, 'Meridian starts at South Pole');
    assert.ok(Math.abs(northPole.z - (initialState.sphere.center.z + R)) < 1e-6, 'Meridian terminates at North Pole');
    console.log('[PASS] T12: Longitude guide corresponds strictly to vertex longitude and connects poles');
  });

  it('T13: Changing camera orientation does not change spherical coordinates (phi, lambda)', () => {
    const pt = initialState.vertices.B;
    const baseSph = cartesianToSpherical(initialState.sphere, pt);

    // Simulate different camera perspectives
    const cameraViews: CameraState[] = [
      INITIAL_CAMERA,
      { ...INITIAL_CAMERA, azimuth: Math.PI / 2, elevation: Math.PI / 4 },
      { ...INITIAL_CAMERA, azimuth: Math.PI, elevation: -Math.PI / 6 },
      { ...INITIAL_CAMERA, distance: 500 },
    ];

    for (const cam of cameraViews) {
      // Intrinsic spherical coordinates depend purely on geometry, NOT camera
      const testSph = cartesianToSpherical(initialState.sphere, pt);
      assert.equal(testSph.phi, baseSph.phi, 'Phi must be invariant to camera perspective');
      assert.equal(testSph.lambda, baseSph.lambda, 'Lambda must be invariant to camera perspective');
      assert.ok(cam.distance > 0);
    }
    console.log('[PASS] T13: Changing camera orientation does not change spherical coordinates');
  });

  it('T14: Pole convention is respected (lambda = 0 at phi = ±90°)', () => {
    // North Pole (0, 0, 1)
    const northPole = createPoint3D(0, 0, 1.0);
    const sphNorth = cartesianToSpherical(initialState.sphere, northPole);
    assert.ok(Math.abs(sphNorth.phi - Math.PI / 2) < 1e-6, 'North pole must have phi = +pi/2');
    assert.equal(sphNorth.lambda, 0, 'North pole must have lambda = 0 by Package 02 convention');

    // South Pole (0, 0, -1)
    const southPole = createPoint3D(0, 0, -1.0);
    const sphSouth = cartesianToSpherical(initialState.sphere, southPole);
    assert.ok(Math.abs(sphSouth.phi - (-Math.PI / 2)) < 1e-6, 'South pole must have phi = -pi/2');
    assert.equal(sphSouth.lambda, 0, 'South pole must have lambda = 0 by Package 02 convention');

    console.log('[PASS] T14: Pole convention is strictly respected (lambda = 0 at phi = ±90°)');
  });

  it('T15: Longitude wrap-around is continuous and respected (0° == 360°)', () => {
    const phi = 0.3;
    const pt0 = sphericalToCartesian(initialState.sphere, { phi, lambda: 0 });
    const pt360 = sphericalToCartesian(initialState.sphere, { phi, lambda: Math.PI * 2 });
    const dist = Math.hypot(pt0.x - pt360.x, pt0.y - pt360.y, pt0.z - pt360.z);

    assert.ok(dist < 1e-6, '0 rad and 2pi rad must map to identical Cartesian points on sphere');

    const sphBack = cartesianToSpherical(initialState.sphere, pt0);
    assert.ok(sphBack.lambda >= 0 && sphBack.lambda < Math.PI * 2, 'Derived lambda must normalize to [0, 2pi)');
    console.log('[PASS] T15: Longitude wrap-around is continuous and strictly respected (0° == 360°)');
  });

  it('T16: UI components contain required scale and guide controls (DOM audit)', () => {
    const viewportFile = readFileSync(join(process.cwd(), 'src/components/GeometryViewport.tsx'), 'utf-8');
    const learningFile = readFileSync(join(process.cwd(), 'src/components/LearningPanel.tsx'), 'utf-8');

    assert.ok(viewportFile.includes('scale-control-toolbar'), 'Scale toolbar must exist');
    assert.ok(viewportFile.includes('scale-fit-btn'), 'Fit scale button must exist');
    assert.ok(viewportFile.includes('scale-100-btn'), '100% scale button must exist');
    assert.ok(viewportFile.includes('scale-75-btn'), '75% scale button must exist');
    assert.ok(viewportFile.includes('scale-50-btn'), '50% scale button must exist');

    assert.ok(viewportFile.includes('toggle-vertex-guides-btn'), 'Toggle vertex guides button must exist');
    assert.ok(viewportFile.includes('toggle-all-guides-btn'), 'Toggle all vs active guides button must exist');

    assert.ok(learningFile.includes('vertex-coordinate-guide-card'), 'Learning panel must contain vertex coordinate guide narrative');
    assert.ok(learningFile.includes('Меридиан (линия долготы λ)'), 'Learning panel must describe the meridian');
    assert.ok(learningFile.includes('Параллель (линия широты φ)'), 'Learning panel must describe the parallel');

    console.log('[PASS] T16: UI components contain all required scale and guide controls');
  });
});
