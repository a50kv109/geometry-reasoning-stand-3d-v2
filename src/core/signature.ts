/**
 * DETERMINISTIC GEOMETRIC SIGNATURE (M1.6, Package 04)
 * 
 * Rules:
 * - Depends ONLY on Canonical Geometry State (O, R, A, B, C, D).
 * - Metadata (timestamp, selection, camera, zoom, frame rate, UI state) MUST NOT alter geometric identity.
 * - Normalized number formatting (handles +0 vs -0, fixed scientific precision).
 */

import { CanonicalGeometryState, Point3D, VertexId } from './types';
import { CANONICAL_VERTICES } from './topology';

/**
 * Normalizes a number to deterministic precision representation.
 */
function normalizeNumber(n: number): string {
  if (!Number.isFinite(n)) {
    return String(n);
  }
  // Convert -0 to +0
  const normalized = Object.is(n, -0) ? 0 : n;
  // Use 10 decimal digits fixed notation for stable hashing/comparison
  return normalized.toFixed(10);
}

function normalizePoint(p: Point3D): string {
  return `(${normalizeNumber(p.x)},${normalizeNumber(p.y)},${normalizeNumber(p.z)})`;
}

/**
 * Computes the deterministic canonical geometry signature.
 */
export function computeGeometrySignature(state: CanonicalGeometryState): string {
  const oStr = normalizePoint(state.sphere.center);
  const rStr = normalizeNumber(state.sphere.radius);

  const vertexParts = CANONICAL_VERTICES.map((id: VertexId) => {
    const pt = state.vertices[id];
    return `${id}:${normalizePoint(pt)}`;
  }).join(';');

  return `GEOM_V1|O:${oStr}|R:${rStr}|VERTICES:[${vertexParts}]`;
}

export const generateGeometrySignature = computeGeometrySignature;

/**
 * Generates a simple 32-bit FNV-1a hash of the canonical signature string.
 */
export function computeGeometryHash(state: CanonicalGeometryState): string {
  const sig = computeGeometrySignature(state);
  let hash = 0x811c9dc5;
  for (let i = 0; i < sig.length; i++) {
    hash ^= sig.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
