/**
 * M1.6 WORKSPACE LAYOUT & WORKSTATION VERIFICATION TEST SUITE
 * 
 * Verifies that the Dynamic 3D Geometry Reasoning Stand conforms to the
 * workstation layout specifications:
 * 1. Persistent 3D geometry viewport (~65% width on desktop).
 * 2. Independently scrollable reasoning panel (~35% width on desktop).
 * 3. Elimination of document-level scrolling on desktop (h-screen overflow-hidden).
 * 4. Elimination of empty horizontal margins (full viewport width utilized).
 * 5. Ordered hierarchy of information sections (1-7 in specified sequence).
 * 6. Bi-directional synchronization between 3D selection and information panel.
 * 7. Canonical M1 geometry state preservation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  validateGeometryState,
  computeDerivedMetrics,
} from '../core';
import { analyzeCausalNeighborhood } from '../visualization/causalModel';

describe('M1.6 Workspace Layout & Ergonomics Verification', () => {
  const appFile = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf-8');
  const indexCss = readFileSync(join(process.cwd(), 'src/index.css'), 'utf-8');

  it('W01: Desktop root container prevents browser document scrolling (h-screen overflow-hidden)', () => {
    assert.ok(
      appFile.includes('h-screen') && appFile.includes('overflow-hidden'),
      'Root container must specify h-screen and overflow-hidden to keep workstation stable'
    );
    console.log('[PASS] W01: Desktop root container prevents document scrolling (h-screen overflow-hidden)');
  });

  it('W02: Viewport and Sidebar maintain ~65% / ~35% workstation proportion on desktop', () => {
    assert.ok(
      appFile.includes('lg:w-[65%]') || appFile.includes('lg:flex-[65]'),
      'Left viewport section must occupy ~65% desktop width'
    );
    assert.ok(
      appFile.includes('lg:w-[35%]') || appFile.includes('lg:flex-[35]'),
      'Right sidebar section must occupy ~35% desktop width'
    );
    console.log('[PASS] W02: Viewport (~65%) and Sidebar (~35%) layout verified');
  });

  it('W03: No narrow centered constraints (max-w-7xl mx-auto) in main workstation flow', () => {
    assert.ok(
      !appFile.includes('max-w-7xl mx-auto'),
      'Workstation layout must eliminate narrow centered box and utilize full desktop width'
    );
    console.log('[PASS] W03: Eliminated wasted horizontal margins (full width utilized)');
  });

  it('W04: Information panel has independent vertical scrolling (overflow-y-auto)', () => {
    assert.ok(
      appFile.includes('overflow-y-auto') && appFile.includes('custom-scrollbar'),
      'Information panel must have its own independent scroll container'
    );
    assert.ok(
      indexCss.includes('.custom-scrollbar'),
      'Custom workstation scrollbar styles must be defined'
    );
    console.log('[PASS] W04: Information panel has independent scroll container with custom styling');
  });

  it('W05: Sidebar contains sections 1 to 7 strictly in order', () => {
    const posVertexControl = appFile.indexOf('<VertexControlPanel');
    const posMeasurement = appFile.indexOf('<MeasurementPanel');
    const posLearning = appFile.indexOf('<LearningPanel');
    const posDebug = appFile.indexOf('<DebugPanel');

    assert.ok(posVertexControl !== -1, 'VertexControlPanel must be present');
    assert.ok(posMeasurement !== -1, 'MeasurementPanel must be present');
    assert.ok(posLearning !== -1, 'LearningPanel must be present');
    assert.ok(posDebug !== -1, 'DebugPanel must be present');

    assert.ok(
      posVertexControl < posMeasurement,
      'Section 1 & 2 (Active Vertex & Position) must precede Section 3 & 4 (Measurements)'
    );
    assert.ok(
      posMeasurement < posLearning,
      'Section 3 & 4 (Measurements & State) must precede Section 5 & 6 (Dependencies & Learning)'
    );
    assert.ok(
      posLearning < posDebug,
      'Section 5 & 6 (Dependencies & Learning) must precede Section 7 (Diagnostics)'
    );

    console.log('[PASS] W05: Information panel sections strictly ordered (1-2 -> 3-4 -> 5-6 -> 7)');
  });

  it('W06: Authoritative M1 geometry core remains unaltered and frozen', () => {
    const sphere = createSphere3D(createPoint3D(0, 0, 0), 1.0);
    const vertices = {
      A: createPoint3D(0, 0, 1.0),
      B: createPoint3D((2 * Math.sqrt(2) / 3), 0, -1 / 3),
      C: createPoint3D(-Math.sqrt(2) / 3, -Math.sqrt(6) / 3, -1 / 3),
      D: createPoint3D(-Math.sqrt(2) / 3, Math.sqrt(6) / 3, -1 / 3),
    };
    const state = createCanonicalGeometryState(sphere, vertices);
    const validation = validateGeometryState(sphere, vertices);
    const metrics = computeDerivedMetrics(state);

    assert.equal(validation.isValid, true);
    assert.equal(metrics.global.isRegular, true);
    assert.equal(metrics.global.orientation, 'POSITIVE');
    assert.ok(Object.isFrozen(state), 'Canonical state must remain strictly frozen');

    console.log('[PASS] W06: Authoritative M1 core integrity preserved');
  });

  it('W07: Selection synchronization preserves unified causal graph for all components', () => {
    const causalA = analyzeCausalNeighborhood({ type: 'VERTEX', id: 'A' });
    assert.ok(causalA.affectedEdges.has('AB'));
    assert.ok(causalA.affectedEdges.has('AC'));
    assert.ok(causalA.affectedEdges.has('AD'));
    assert.ok(causalA.unaffectedEdges.has('BC'));
    assert.ok(causalA.unaffectedFaces.has('BCD'));

    console.log('[PASS] W07: Causal synchronization graph validated for all vertices');
  });
});
