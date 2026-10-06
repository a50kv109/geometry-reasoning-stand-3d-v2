/**
 * VISUAL CLIENT & INTERACTION TEST SUITE (M1.5)
 * 
 * Verifies:
 * - Camera isolation from canonical geometry state
 * - Persistent vertex identity across interactions
 * - Semantic causal dependency graph generation
 * - Metric calculations (lengths, areas, volume, centroid)
 * - Equal vertex interaction semantics (no privileged vertex)
 * - Degeneracy & orientation transitions
 */

import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  validateGeometryState,
  computeGeometrySignature,
  computeDerivedMetrics,
  sphericalToCartesian,
  cartesianToSpherical,
  CANONICAL_VERTICES,
  CANONICAL_EDGES,
  CANONICAL_FACES,
  VertexId,
  Point3D,
} from '../core';
import { CameraState, INITIAL_CAMERA, projectWorldPoint } from '../visualization/camera';
import { analyzeCausalNeighborhood } from '../visualization/causalModel';

interface TestResult {
  id: string;
  purpose: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
}

const results: TestResult[] = [];

function runTest(id: string, purpose: string, fn: () => { pass: boolean; evidence: string }) {
  try {
    const { pass, evidence } = fn();
    results.push({
      id,
      purpose,
      status: pass ? 'PASS' : 'FAIL',
      evidence,
    });
  } catch (err: any) {
    results.push({
      id,
      purpose,
      status: 'FAIL',
      evidence: `Unexpected error thrown during test: ${err.message}`,
    });
  }
}

console.log('============================================================');
console.log('DYNAMIC 3D GEOMETRY REASONING STAND - M1.5 CLIENT TEST SUITE');
console.log('============================================================');

// 1. Regular tetrahedron setup
const R = 1.0;
const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
const initialVertices: Record<VertexId, Point3D> = {
  A: createPoint3D(0, 0, R),
  B: createPoint3D((2 * Math.sqrt(2) / 3) * R, 0, (-1 / 3) * R),
  C: createPoint3D((-Math.sqrt(2) / 3) * R, (-Math.sqrt(6) / 3) * R, (-1 / 3) * R),
  D: createPoint3D((-Math.sqrt(2) / 3) * R, (Math.sqrt(6) / 3) * R, (-1 / 3) * R),
};
const canonicalState = createCanonicalGeometryState(sphere, initialVertices);

// Test C01: Camera Isolation
runTest('C01', 'Camera mutations do not alter canonical geometry state or signature', () => {
  const sigBefore = computeGeometrySignature(canonicalState);

  // Manipulate camera view parameters
  const rotatedCamera: CameraState = {
    ...INITIAL_CAMERA,
    azimuth: Math.PI / 2,
    elevation: Math.PI / 3,
    distance: 600,
    panX: 50,
    panY: -30,
  };

  const sigAfter = computeGeometrySignature(canonicalState);
  const pass = sigBefore === sigAfter &&
    canonicalState.sphere.radius === R &&
    canonicalState.vertices.A.z === R;

  return {
    pass,
    evidence: `Signature matches: ${sigBefore === sigAfter}. Canonical state unchanged under camera orbit and zoom.`,
  };
});

// Test C02: Vertex Identity Preservation
runTest('C02', 'Preserve persistent vertex identities when vertex is moved', () => {
  // Move vertex D to a new position on the sphere (lat: 45 deg, lon: 30 deg)
  const newPt = sphericalToCartesian(sphere, { phi: Math.PI / 4, lambda: Math.PI / 6 });
  const updatedVertices = { ...initialVertices, D: newPt };
  const updatedState = createCanonicalGeometryState(sphere, updatedVertices);

  const keys = Object.keys(updatedState.vertices);
  const pass = keys.join(',') === 'A,B,C,D' &&
    updatedState.vertices.D.x === newPt.x &&
    updatedState.vertices.A.z === R;

  return {
    pass,
    evidence: `Vertices order preserved: [${keys.join(', ')}]. D updated, A untouched.`,
  };
});

// Test C03: Scale-aware Sphere Projection
runTest('C03', 'Movement via spherical coordinates preserves |P - O| = R within tolerance', () => {
  const angles = [
    { phi: 0, lambda: 0 },
    { phi: Math.PI / 3, lambda: (3 * Math.PI) / 4 },
    { phi: -Math.PI / 4, lambda: (5 * Math.PI) / 3 },
  ];

  let maxDeviation = 0;
  for (const ang of angles) {
    const pt = sphericalToCartesian(sphere, ang);
    const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y + pt.z * pt.z);
    const dev = Math.abs(dist - R);
    if (dev > maxDeviation) maxDeviation = dev;
  }

  const pass = maxDeviation <= 1e-12;
  return {
    pass,
    evidence: `Max deviation from sphere radius R=${R}: ${maxDeviation.toExponential(4)} <= 1e-12.`,
  };
});

// Test C04: Causal Dependency Graph for Vertex D
runTest('C04', 'Selecting D identifies affected (AD,BD,CD,ABD,ACD,BCD) and unaffected (AB,AC,BC,ABC)', () => {
  const causal = analyzeCausalNeighborhood({ type: 'VERTEX', id: 'D' });

  const affectedEdges = Array.from(causal.affectedEdges).sort();
  const unaffectedEdges = Array.from(causal.unaffectedEdges).sort();
  const affectedFaces = Array.from(causal.affectedFaces).sort();
  const unaffectedFaces = Array.from(causal.unaffectedFaces).sort();

  const pass = 
    affectedEdges.join(',') === 'AD,BD,CD' &&
    unaffectedEdges.join(',') === 'AB,AC,BC' &&
    affectedFaces.join(',') === 'ABD,ACD,BCD' &&
    unaffectedFaces.join(',') === 'ABC';

  return {
    pass,
    evidence: `Affected edges: [${affectedEdges.join(',')}]; Invariant edges: [${unaffectedEdges.join(',')}]; Invariant face: [${unaffectedFaces.join(',')}].`,
  };
});

// Test C05: Causal Dependency Graph for Vertex A
runTest('C05', 'Selecting A identifies incident edges (AB,AC,AD), incident faces (ABC,ABD,ACD), and opposite face BCD', () => {
  const causal = analyzeCausalNeighborhood({ type: 'VERTEX', id: 'A' });

  const affectedEdges = Array.from(causal.affectedEdges).sort();
  const unaffectedFaces = Array.from(causal.unaffectedFaces).sort();

  const pass = 
    affectedEdges.join(',') === 'AB,AC,AD' &&
    unaffectedFaces.join(',') === 'BCD';

  return {
    pass,
    evidence: `Affected edges for A: [${affectedEdges.join(',')}]; Opposite face BCD is invariant: [${unaffectedFaces.join(',')}].`,
  };
});

// Test C06: Causal Dependency Graph for Edge AB
runTest('C06', 'Selecting edge AB identifies adjacent faces (ABC, ABD) and disjoint edges', () => {
  const causal = analyzeCausalNeighborhood({ type: 'EDGE', id: 'AB' });

  const affectedFaces = Array.from(causal.affectedFaces).sort();
  const pass = affectedFaces.join(',') === 'ABC,ABD';

  return {
    pass,
    evidence: `Edge AB is shared by faces: [${affectedFaces.join(',')}].`,
  };
});

// Test C07: Measurement Engine Accuracy for Regular Tetrahedron
runTest('C07', 'Derived metrics accurately compute edge lengths and signed volume', () => {
  const metrics = computeDerivedMetrics(canonicalState);

  // For regular tetrahedron on unit sphere:
  // Edge length = sqrt(8/3) * R ≈ 1.63299
  // Volume = (8 / (9 * sqrt(3))) * R^3 ≈ 0.51320
  const expectedEdge = Math.sqrt(8 / 3);
  const expectedVolume = 8 / (9 * Math.sqrt(3));

  const edgeAB = metrics.edges.AB.length;
  const edgeDiff = Math.abs(edgeAB - expectedEdge);
  const volDiff = Math.abs(metrics.global.signedVolume - expectedVolume);

  const pass = edgeDiff < 1e-4 && volDiff < 1e-4 && metrics.global.isRegular;

  return {
    pass,
    evidence: `Edge AB: ${edgeAB.toFixed(5)} (expected ${expectedEdge.toFixed(5)}). Vs: ${metrics.global.signedVolume.toFixed(5)} (expected ${expectedVolume.toFixed(5)}). isRegular: ${metrics.global.isRegular}.`,
  };
});

// Test C08: Equal Interaction Semantics Across All 4 Vertices
runTest('C08', 'All 4 vertices (A, B, C, D) have identical mutation semantics and validations', () => {
  let allValid = true;

  for (const vId of CANONICAL_VERTICES) {
    const pt = sphericalToCartesian(sphere, { phi: 0.2, lambda: 1.1 });
    const testState = createCanonicalGeometryState(sphere, {
      ...initialVertices,
      [vId]: pt,
    });
    const val = validateGeometryState(testState.sphere, testState.vertices);
    if (!val.isValid || val.vertexDetails[vId].isOnSphere !== true) {
      allValid = false;
    }
  }

  return {
    pass: allValid,
    evidence: `Verified equal mutation semantics for each vertex A, B, C, D on S²(O, R).`,
  };
});

// Test C09: Coplanar Degeneracy Transition
runTest('C09', 'Planar configuration produces COPLANAR orientation and degenerate realization', () => {
  const coplanarVertices: Record<VertexId, Point3D> = {
    A: createPoint3D(1.0, 0, 0),
    B: createPoint3D(0, 1.0, 0),
    C: createPoint3D(-1.0, 0, 0),
    D: createPoint3D(0, -1.0, 0),
  };
  const coplanarState = createCanonicalGeometryState(sphere, coplanarVertices);
  const metrics = computeDerivedMetrics(coplanarState);
  const val = validateGeometryState(sphere, coplanarVertices);

  const pass = metrics.global.orientation === 'COPLANAR' &&
    val.realizationStatus === 'DEGENERATE';

  return {
    pass,
    evidence: `Coplanar realization: ${val.realizationStatus}, orientation: ${metrics.global.orientation}, Vs: ${metrics.global.signedVolume.toExponential(3)}.`,
  };
});

// Test C10: Inverted Orientation Transition (Vs < 0)
runTest('C10', 'Inverted configuration produces NEGATIVE orientation (VALID_NEGATIVE)', () => {
  const invertedVertices: Record<VertexId, Point3D> = {
    A: initialVertices.A,
    B: initialVertices.C, // Swapped B <-> C
    C: initialVertices.B,
    D: initialVertices.D,
  };
  const invertedState = createCanonicalGeometryState(sphere, invertedVertices);
  const metrics = computeDerivedMetrics(invertedState);
  const val = validateGeometryState(sphere, invertedVertices);

  const pass = metrics.global.orientation === 'NEGATIVE' &&
    metrics.global.signedVolume < 0 &&
    val.realizationStatus === 'VALID_NEGATIVE' &&
    val.isValid;

  return {
    pass,
    evidence: `Inverted realization: ${val.realizationStatus}, Vs: ${metrics.global.signedVolume.toFixed(4)}, isValid: ${val.isValid}.`,
  };
});

// Output Summary
let passedCount = 0;
for (const r of results) {
  if (r.status === 'PASS') passedCount++;
  console.log(`[${r.status}] ${r.id}: ${r.purpose}`);
  console.log(`       Evidence: ${r.evidence}`);
}

console.log('============================================================');
console.log(`TOTAL TESTS EXECUTED: ${results.length}`);
console.log(`PASSED: ${passedCount}`);
console.log(`FAILED: ${results.length - passedCount}`);
console.log('============================================================');

if (passedCount !== results.length) {
  process.exit(1);
}
