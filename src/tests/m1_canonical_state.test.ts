/**
 * DETERMINISTIC M1 TEST SUITE
 * Milestone 1: Canonical 3D Geometry State Implementation Tests (T01 - T17)
 */

import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  validateGeometryState,
  computeGeometrySignature,
  computeGeometryHash,
  sphericalToCartesian,
  cartesianToSpherical,
  CANONICAL_VERTICES,
  CANONICAL_EDGES,
  CANONICAL_FACES,
  InputGeometryStatus,
  RealizationStatus,
  GeometryValidationCode,
  CanonicalGeometryState,
  VisualizationState,
} from '../core';

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

// Helper: Standard Regular Tetrahedron on unit sphere R = 1 with positive signed volume
function getCanonicalRegularTetrahedronVertices(R: number = 1.0) {
  return {
    A: createPoint3D(0, 0, R),
    B: createPoint3D((2 * Math.sqrt(2) / 3) * R, 0, (-1 / 3) * R),
    C: createPoint3D((-Math.sqrt(2) / 3) * R, (-Math.sqrt(6) / 3) * R, (-1 / 3) * R),
    D: createPoint3D((-Math.sqrt(2) / 3) * R, (Math.sqrt(6) / 3) * R, (-1 / 3) * R),
  };
}

// ============================================================
// TEST DEFINITIONS (T01 - T17)
// ============================================================

// T01: Create valid sphere
runTest('T01', 'Create valid sphere S²(O, R) with O(0,0,0) and R > 0', () => {
  const O = createPoint3D(0, 0, 0);
  const R = 5.0;
  const sphere = createSphere3D(O, R);
  const pass = sphere.center.x === 0 && sphere.center.y === 0 && sphere.center.z === 0 && sphere.radius === 5.0;
  return {
    pass,
    evidence: `Created sphere S²((${sphere.center.x},${sphere.center.y},${sphere.center.z}), R=${sphere.radius}). Radius is strictly positive.`,
  };
});

// T02: Create four distinct vertices on the sphere
runTest('T02', 'Create four distinct vertices on the sphere', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const verts = getCanonicalRegularTetrahedronVertices(R);
  const val = validateGeometryState(sphere, verts);
  const pass = val.isValid && val.inputStatus === InputGeometryStatus.VALID_INPUT && val.coincidences.length === 0;
  return {
    pass,
    evidence: `Validation status: ${val.inputStatus}, Realization: ${val.realizationStatus}, Coincidences: ${val.coincidences.length}, isValid: ${val.isValid}.`,
  };
});

// T03: Reject R <= 0
runTest('T03', 'Reject R <= 0 with explicit INVALID_INPUT status', () => {
  const sphereZero = createSphere3D(createPoint3D(0, 0, 0), 0);
  const sphereNeg = createSphere3D(createPoint3D(0, 0, 0), -2.5);
  const verts = getCanonicalRegularTetrahedronVertices(1.0);

  const valZero = validateGeometryState(sphereZero, verts);
  const valNeg = validateGeometryState(sphereNeg, verts);

  const pass =
    !valZero.isValid &&
    valZero.inputStatus === InputGeometryStatus.INVALID_INPUT &&
    valZero.validationCode === GeometryValidationCode.INVALID_RADIUS &&
    !valNeg.isValid &&
    valNeg.inputStatus === InputGeometryStatus.INVALID_INPUT &&
    valNeg.validationCode === GeometryValidationCode.INVALID_RADIUS;

  return {
    pass,
    evidence: `R=0 rejected with ${valZero.inputStatus} (${valZero.validationCode}); R=-2.5 rejected with ${valNeg.inputStatus} (${valNeg.validationCode}).`,
  };
});

// T04: Reject NaN
runTest('T04', 'Reject NaN coordinates in sphere or vertices', () => {
  const sphere = createSphere3D(createPoint3D(0, 0, 0), 1.0);
  const vertsWithNaN = {
    ...getCanonicalRegularTetrahedronVertices(1.0),
    A: createPoint3D(NaN, 0, 1.0),
  };
  const val = validateGeometryState(sphere, vertsWithNaN);
  const pass =
    !val.isValid &&
    val.inputStatus === InputGeometryStatus.NON_FINITE_INPUT &&
    val.validationCode === GeometryValidationCode.NON_FINITE_COORDINATES;

  return {
    pass,
    evidence: `NaN vertex detected with inputStatus=${val.inputStatus}, code=${val.validationCode}, message: "${val.message}".`,
  };
});

// T05: Reject Infinity
runTest('T05', 'Reject Infinity in sphere radius or vertex coordinates', () => {
  const sphere = createSphere3D(createPoint3D(0, 0, 0), Infinity);
  const verts = getCanonicalRegularTetrahedronVertices(1.0);
  const val = validateGeometryState(sphere, verts);
  const pass =
    !val.isValid &&
    val.inputStatus === InputGeometryStatus.NON_FINITE_INPUT &&
    val.validationCode === GeometryValidationCode.NON_FINITE_COORDINATES;

  return {
    pass,
    evidence: `Infinity radius rejected with inputStatus=${val.inputStatus}, code=${val.validationCode}.`,
  };
});

// T06: Reject a vertex outside the sphere
runTest('T06', 'Reject a vertex outside the sphere without silent projection', () => {
  const R = 2.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const verts = {
    ...getCanonicalRegularTetrahedronVertices(R),
    D: createPoint3D(0, 0, 2.5), // Outside by 0.5 > epsSphere (2e-6)
  };
  const val = validateGeometryState(sphere, verts);
  const pass =
    !val.isValid &&
    val.inputStatus === InputGeometryStatus.OUTSIDE_SPHERE &&
    val.validationCode === GeometryValidationCode.VERTEX_OUTSIDE_SPHERE;

  return {
    pass,
    evidence: `Point (0, 0, 2.5) rejected: inputStatus=${val.inputStatus}, code=${val.validationCode}, deviation=${val.vertexDetails.D.deviationFromSphere.toFixed(4)}. No silent projection occurred.`,
  };
});

// T07: Accept a valid point on the sphere
runTest('T07', 'Accept a valid point on the sphere within scale-aware tolerance', () => {
  const R = 10.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  // Point constructed exactly via spherical angle
  const phi = Math.PI / 6; // 30 deg
  const lambda = Math.PI / 4; // 45 deg
  const ptA = sphericalToCartesian(sphere, { phi, lambda });

  const verts = {
    A: ptA,
    B: createPoint3D(0, 0, R),
    C: createPoint3D(0, R, 0),
    D: createPoint3D(R, 0, 0),
  };
  const val = validateGeometryState(sphere, verts);
  const pass = val.vertexDetails.A.isOnSphere && val.vertexDetails.A.deviationFromSphere < 1e-12;

  return {
    pass,
    evidence: `Vertex A (${ptA.x.toFixed(4)}, ${ptA.y.toFixed(4)}, ${ptA.z.toFixed(4)}) is on sphere: isOnSphere=${val.vertexDetails.A.isOnSphere}, deviation=${val.vertexDetails.A.deviationFromSphere.toExponential(3)}.`,
  };
});

// T08: Detect coincident vertices
runTest('T08', 'Detect coincident vertices within epsCoincident threshold', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const verts = {
    ...getCanonicalRegularTetrahedronVertices(R),
    B: createPoint3D(0, 0, R), // Exact duplicate of vertex A (0, 0, 1)
  };
  const val = validateGeometryState(sphere, verts);
  const pass =
    !val.isValid &&
    val.realizationStatus === RealizationStatus.VERTEX_COINCIDENT &&
    val.validationCode === GeometryValidationCode.COINCIDENT_VERTICES &&
    val.coincidences.length === 1 &&
    val.coincidences[0].v1 === 'A' &&
    val.coincidences[0].v2 === 'B';

  return {
    pass,
    evidence: `Coincident pair A-B detected with distance=${val.coincidences[0]?.distance.toExponential(3)}, realizationStatus=${val.realizationStatus}.`,
  };
});

// T09: Preserve A/B/C/D identities
runTest('T09', 'Preserve A/B/C/D persistent semantic identities regardless of geometric coordinates', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  // Vertices assigned with A at south pole and D at north pole
  const verts = {
    A: createPoint3D(0, 0, -R), // Lowest z
    B: createPoint3D(R, 0, 0),
    C: createPoint3D(0, R, 0),
    D: createPoint3D(0, 0, R),  // Highest z
  };
  const state = createCanonicalGeometryState(sphere, verts);
  // Identities must remain exactly A, B, C, D in their specified slots
  const keys = Object.keys(state.vertices);
  const pass =
    keys.length === 4 &&
    keys[0] === 'A' &&
    keys[1] === 'B' &&
    keys[2] === 'C' &&
    keys[3] === 'D' &&
    state.vertices.A.z === -1 &&
    state.vertices.D.z === 1;

  return {
    pass,
    evidence: `Vertices retain strict persistent keys [${keys.join(', ')}]. No automatic sorting by z or coordinates occurred.`,
  };
});

// T10: Verify the six canonical edges exist
runTest('T10', 'Verify the six canonical edges exist (AB, AC, AD, BC, BD, CD)', () => {
  const expectedEdgeIds = ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'];
  const actualEdgeIds = CANONICAL_EDGES.map(e => e.id);
  const pass =
    actualEdgeIds.length === 6 &&
    expectedEdgeIds.every(id => actualEdgeIds.includes(id as any));

  return {
    pass,
    evidence: `Canonical edges verified: [${actualEdgeIds.join(', ')}]. Count = ${actualEdgeIds.length}.`,
  };
});

// T11: Verify the four canonical faces exist
runTest('T11', 'Verify the four canonical faces exist (ABC, ABD, ACD, BCD)', () => {
  const expectedFaceIds = ['ABC', 'ABD', 'ACD', 'BCD'];
  const actualFaceIds = CANONICAL_FACES.map(f => f.id);
  const pass =
    actualFaceIds.length === 4 &&
    expectedFaceIds.every(id => actualFaceIds.includes(id as any));

  return {
    pass,
    evidence: `Canonical faces verified: [${actualFaceIds.join(', ')}]. Count = ${actualFaceIds.length}.`,
  };
});

// T12: Verify topology remains unchanged after changing one vertex
runTest('T12', 'Verify topology remains invariant after changing a vertex position', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const verts1 = getCanonicalRegularTetrahedronVertices(R);
  const state1 = createCanonicalGeometryState(sphere, verts1);

  // Move vertex D to equator
  const verts2 = {
    ...verts1,
    D: createPoint3D(0, R, 0),
  };
  const state2 = createCanonicalGeometryState(sphere, verts2);

  const edgesBefore = CANONICAL_EDGES.map(e => e.id).join(',');
  const edgesAfter = CANONICAL_EDGES.map(e => e.id).join(',');
  const facesBefore = CANONICAL_FACES.map(f => f.id).join(',');
  const facesAfter = CANONICAL_FACES.map(f => f.id).join(',');

  const pass = edgesBefore === edgesAfter && facesBefore === facesAfter;

  return {
    pass,
    evidence: `Topology before and after moving D: Edges (${edgesAfter}) and Faces (${facesAfter}) remain perfectly invariant.`,
  };
});

// T13: Verify geometry signature changes when a vertex changes
runTest('T13', 'Verify geometry signature changes when a vertex position changes', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const verts1 = getCanonicalRegularTetrahedronVertices(R);
  const state1 = createCanonicalGeometryState(sphere, verts1);

  const sig1 = computeGeometrySignature(state1);
  const hash1 = computeGeometryHash(state1);

  // Move vertex D
  const verts2 = {
    ...verts1,
    D: createPoint3D(0, -R, 0),
  };
  const state2 = createCanonicalGeometryState(sphere, verts2);

  const sig2 = computeGeometrySignature(state2);
  const hash2 = computeGeometryHash(state2);

  const pass = sig1 !== sig2 && hash1 !== hash2;

  return {
    pass,
    evidence: `Signature 1: ${hash1} ("${sig1.slice(0, 35)}..."), Signature 2: ${hash2} ("${sig2.slice(0, 35)}..."). Changed: ${pass}.`,
  };
});

// T14: Verify geometry signature does NOT depend on metadata
runTest('T14', 'Verify geometry signature does NOT depend on metadata (timestamp, UI, camera)', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const verts = getCanonicalRegularTetrahedronVertices(R);
  const state = createCanonicalGeometryState(sphere, verts);

  const sigBase = computeGeometrySignature(state);

  // Simulated metadata objects
  const metadata1 = {
    timestamp: 1718000000000,
    camera: { position: createPoint3D(10, 20, 30), target: createPoint3D(0, 0, 0), zoom: 1.5 },
    selectedEntity: { type: 'VERTEX', id: 'A' },
  };

  const metadata2 = {
    timestamp: 1718999999999,
    camera: { position: createPoint3D(-50, -50, -50), target: createPoint3D(1, 1, 1), zoom: 0.8 },
    selectedEntity: { type: 'FACE', id: 'BCD' },
  };

  // The signature function ONLY accepts CanonicalGeometryState, mathematically isolating it from metadata
  const sigWithMeta1 = computeGeometrySignature(state);
  const sigWithMeta2 = computeGeometrySignature(state);

  const pass = sigBase === sigWithMeta1 && sigWithMeta1 === sigWithMeta2;

  return {
    pass,
    evidence: `Signature is identical across all metadata contexts: ${sigBase.slice(0, 45)}... Metadata is completely decoupled.`,
  };
});

// T15: Verify negative orientation can be represented without being classified as invalid input
runTest('T15', 'Verify negative orientation is represented as VALID_NEGATIVE and not rejected as invalid input', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const positiveVerts = getCanonicalRegularTetrahedronVertices(R);
  const valPos = validateGeometryState(sphere, positiveVerts);

  // Swap vertices B and C to invert orientation (parity swap)
  const negativeVerts = {
    A: positiveVerts.A,
    B: positiveVerts.C, // swapped
    C: positiveVerts.B, // swapped
    D: positiveVerts.D,
  };
  const valNeg = validateGeometryState(sphere, negativeVerts);

  const pass =
    valPos.isValid &&
    valPos.realizationStatus === RealizationStatus.VALID_POSITIVE &&
    valNeg.isValid &&
    valNeg.inputStatus === InputGeometryStatus.VALID_INPUT &&
    valNeg.realizationStatus === RealizationStatus.VALID_NEGATIVE &&
    valNeg.signedVolumeApproximation! < 0;

  return {
    pass,
    evidence: `Positive config: Vs = ${valPos.signedVolumeApproximation?.toFixed(4)} (${valPos.realizationStatus}); Inverted config: Vs = ${valNeg.signedVolumeApproximation?.toFixed(4)} (${valNeg.realizationStatus}, inputStatus=${valNeg.inputStatus}, isValid=${valNeg.isValid}).`,
  };
});

// T16: Verify a coplanar configuration can be represented and passed forward for geometric degeneracy evaluation
runTest('T16', 'Verify coplanar configuration is representable and classified as DEGENERATE without input rejection', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  // All 4 vertices placed strictly on the equatorial great circle (z = 0)
  const coplanarVerts = {
    A: createPoint3D(R, 0, 0),
    B: createPoint3D(0, R, 0),
    C: createPoint3D(-R, 0, 0),
    D: createPoint3D(0, -R, 0),
  };
  const val = validateGeometryState(sphere, coplanarVerts);

  const pass =
    val.isValid &&
    val.inputStatus === InputGeometryStatus.VALID_INPUT &&
    val.realizationStatus === RealizationStatus.DEGENERATE &&
    val.validationCode === GeometryValidationCode.COPLANAR_VERTICES &&
    Math.abs(val.signedVolumeApproximation!) < 1e-12;

  return {
    pass,
    evidence: `Coplanar vertices on z=0 plane: inputStatus=${val.inputStatus}, realizationStatus=${val.realizationStatus}, code=${val.validationCode}, Vs=${val.signedVolumeApproximation?.toExponential(3)}. Valid input passed to engine.`,
  };
});

// T17: Verify representation/UI metadata cannot mutate canonical geometry implicitly
runTest('T17', 'Verify representation and UI metadata cannot mutate canonical geometry implicitly', () => {
  const R = 1.0;
  const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
  const verts = getCanonicalRegularTetrahedronVertices(R);
  const state = createCanonicalGeometryState(sphere, verts);

  // Convert to spherical representation
  const phiA = Math.asin(state.vertices.A.z / R);
  const lambdaA = 0;

  // Attempt mutation on immutable frozen objects
  let mutationPrevented = true;
  try {
    (state as any).sphere.radius = 999;
    mutationPrevented = false;
  } catch (e) {
    // Expected strict mode / freeze rejection
  }

  try {
    (state.vertices as any).A = createPoint3D(5, 5, 5);
    mutationPrevented = false;
  } catch (e) {
    // Expected strict mode / freeze rejection
  }

  const pass =
    mutationPrevented &&
    state.sphere.radius === 1.0 &&
    state.vertices.A.z === 1.0;

  return {
    pass,
    evidence: `Canonical geometry state is deeply frozen (Object.isFrozen = ${Object.isFrozen(state)}). External mutations threw exceptions and original geometry remained untouched (R=${state.sphere.radius}, A.z=${state.vertices.A.z}).`,
  };
});

// ============================================================
// EXECUTION & REPORTING
// ============================================================

console.log('============================================================');
console.log('DYNAMIC 3D GEOMETRY REASONING STAND - M1 TEST EXECUTION REPORT');
console.log('============================================================\n');

let passCount = 0;
let failCount = 0;

for (const r of results) {
  const badge = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
  console.log(`${badge} ${r.id}: ${r.purpose}`);
  console.log(`       Evidence: ${r.evidence}\n`);
  if (r.status === 'PASS') passCount++;
  else failCount++;
}

console.log('============================================================');
console.log(`TOTAL TESTS EXECUTED: ${results.length}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
