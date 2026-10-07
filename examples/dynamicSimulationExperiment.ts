import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  computeLVG,
  computeGDS,
  computeDerivedMetrics,
  createObservation,
  computeStateTransition,
  EpistemicStatus,
  VertexId
} from '../src/core';

function formatNum(n: number): string {
  return n.toFixed(6);
}

console.log('=== EXPERIMENTAL SIMULATION & MATHEMATICAL VERIFICATION ===');

// 1. PHASE 9: DYNAMIC SIMULATION
console.log('\n--- PHASE 9: DYNAMIC SIMULATION SEQUENCE ---');
const R = 100;
const a = R / Math.sqrt(3);
let currentVertices = {
  A: createPoint3D(a, a, a),
  B: createPoint3D(a, -a, -a),
  C: createPoint3D(-a, a, -a),
  D: createPoint3D(-a, -a, a),
};

const sphere = createSphere3D(createPoint3D(0, 0, 0), R);
let prevState = createCanonicalGeometryState(sphere, currentVertices);
let prevObs = createObservation(computeGDS(prevState, EpistemicStatus.VERIFIED, 1000));

const steps: VertexId[] = ['A', 'B', 'C', 'D'];
steps.forEach((vId, idx) => {
  const t = 1000 + (idx + 1) * 100;
  // Perturb vertex slightly on sphere
  const orig = currentVertices[vId];
  const newX = orig.x + (vId === 'A' || vId === 'C' ? 1.5 : -1.5);
  const newY = orig.y + (vId === 'B' || vId === 'D' ? 1.5 : -1.5);
  const rem = Math.max(0, R * R - newX * newX - newY * newY);
  const newZ = Math.sign(orig.z || 1) * Math.sqrt(rem);

  currentVertices = {
    ...currentVertices,
    [vId]: createPoint3D(newX, newY, newZ),
  };

  const newState = createCanonicalGeometryState(sphere, currentVertices);
  const newGds = computeGDS(newState, EpistemicStatus.VERIFIED, t);
  const newObs = createObservation(newGds, t);
  const trans = computeStateTransition(prevObs, newObs, prevState, newState);

  console.log(`Step ${idx + 1}: Move ${vId} (t=${t})`);
  console.log(`  Volume: ${formatNum(newGds.globalMetrics.signedVolume)} (ΔV: ${formatNum(trans.measurements!.deltaVolume)})`);
  console.log(`  Regularity Ratio: ${formatNum(newGds.globalMetrics.regularityRatio)}`);
  console.log(`  LVG Solid Angles: A=${formatNum(newGds.dlvms.A.lvg.solidAngle)}, B=${formatNum(newGds.dlvms.B.lvg.solidAngle)}, C=${formatNum(newGds.dlvms.C.lvg.solidAngle)}, D=${formatNum(newGds.dlvms.D.lvg.solidAngle)}`);
  console.log(`  Shared Edge Max Residual: ${newGds.sharedEdgeConsistency.maxResidual.toExponential(4)}`);
  console.log(`  Transition Status: ${trans.status}`);

  prevState = newState;
  prevObs = newObs;
});

// 2. PHASE 10: SCALE / RIGID TRANSFORMATION
console.log('\n--- PHASE 10: RIGID TRANSFORMATION & SCALE EXPERIMENT ---');
const baseState = createCanonicalGeometryState(sphere, {
  A: createPoint3D(a, a, a),
  B: createPoint3D(a, -a, -a),
  C: createPoint3D(-a, a, -a),
  D: createPoint3D(-a, -a, a),
});

const baseMetrics = computeDerivedMetrics(baseState);
const baseLVGA = computeLVG(baseState, 'A');

// Scaling by k = 2.5
const k = 2.5;
const scaleSphere = createSphere3D(createPoint3D(0, 0, 0), R * k);
const scaleVertices = {
  A: createPoint3D(a * k, a * k, a * k),
  B: createPoint3D(a * k, -a * k, -a * k),
  C: createPoint3D(-a * k, a * k, -a * k),
  D: createPoint3D(-a * k, -a * k, a * k),
};
const scaleState = createCanonicalGeometryState(scaleSphere, scaleVertices);
const scaleMetrics = computeDerivedMetrics(scaleState);
const scaleLVGA = computeLVG(scaleState, 'A');

console.log(`Scale Factor k = ${k}:`);
console.log(`  Length ratio: ${formatNum(scaleMetrics.edges.AB.length / baseMetrics.edges.AB.length)} (Expected: ${k})`);
console.log(`  Area ratio:   ${formatNum(scaleMetrics.faces.ABC.area / baseMetrics.faces.ABC.area)} (Expected: ${k * k})`);
console.log(`  Volume ratio: ${formatNum(scaleMetrics.global.signedVolume / baseMetrics.global.signedVolume)} (Expected: ${k * k * k})`);
console.log(`  Solid angle:  ${formatNum(scaleLVGA.solidAngle)} vs base: ${formatNum(baseLVGA.solidAngle)} (Diff: ${Math.abs(scaleLVGA.solidAngle - baseLVGA.solidAngle).toExponential(4)})`);

// Translation by T = (50, -30, 20)
const transSphere = createSphere3D(createPoint3D(50, -30, 20), R);
const transVertices = {
  A: createPoint3D(a + 50, a - 30, a + 20),
  B: createPoint3D(a + 50, -a - 30, -a + 20),
  C: createPoint3D(-a + 50, a - 30, -a + 20),
  D: createPoint3D(-a + 50, -a - 30, a + 20),
};
const transState = createCanonicalGeometryState(transSphere, transVertices);
const transLVGA = computeLVG(transState, 'A');
console.log(`Translation T=(50, -30, 20):`);
console.log(`  Solid angle:  ${formatNum(transLVGA.solidAngle)} vs base: ${formatNum(baseLVGA.solidAngle)} (Diff: ${Math.abs(transLVGA.solidAngle - baseLVGA.solidAngle).toExponential(4)})`);
console.log(`  Gram Det:     ${formatNum(transLVGA.gramDeterminant)} vs base: ${formatNum(baseLVGA.gramDeterminant)} (Diff: ${Math.abs(transLVGA.gramDeterminant - baseLVGA.gramDeterminant).toExponential(4)})`);

// 3. PHASE 11: DEGENERACY / RECOVERY EXPERIMENT
console.log('\n--- PHASE 11: CONTROLLED DEGENERACY & RECOVERY ---');
// Near-degenerate: D close to plane ABC
const planeVertices = {
  A: createPoint3D(R, 0, 0),
  B: createPoint3D(0, R, 0),
  C: createPoint3D(-R, 0, 0),
  D: createPoint3D(0, -R, 0.0001), // Near coplanar
};
const nearDegenSphere = createSphere3D(createPoint3D(0, 0, 0), R);
const nearDegenState = createCanonicalGeometryState(nearDegenSphere, planeVertices);
const nearGds = computeGDS(nearDegenState);
console.log(`Near-Degenerate State:`);
console.log(`  Signed Volume: ${nearGds.globalMetrics.signedVolume.toExponential(4)}`);
console.log(`  Degeneracy Flags: ${nearGds.degeneracyFlags.join(', ')}`);
console.log(`  Is Degenerate: ${nearGds.isDegenerate}`);

// Recovered: restore regular tetrahedron
const recoveredState = baseState;
const recoveredGds = computeGDS(recoveredState);
console.log(`Recovered State:`);
console.log(`  Signed Volume: ${formatNum(recoveredGds.globalMetrics.signedVolume)}`);
console.log(`  Is Degenerate: ${recoveredGds.isDegenerate}`);
console.log(`  Epistemic Status: ${recoveredGds.epistemicStatus}`);
