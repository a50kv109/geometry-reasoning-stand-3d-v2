/**
 * CENTRAL VALIDITY, TOLERANCE & NUMERICAL ROBUSTNESS CONTRACT (Package 06)
 * 
 * Strict architectural alignment:
 * ONE GEOMETRY | ONE DETERMINISTIC CORE | ONE TOLERANCE POLICY | MANY CLIENTS
 * 
 * Tolerances scale deterministically with the characteristic geometric scale:
 * L_scale = R
 * Epsilon_Q = c_Q * scale(Q)
 */

export interface ResolvedTolerances {
  readonly scale: number;
  /** [L] Sphere surface membership tolerance: 1e-6 * R */
  readonly epsSphere: number;
  /** [L] Coincident vertex distance threshold: 1e-6 * R */
  readonly epsCoincident: number;
  /** [L] Point-to-plane distance tolerance: 1e-6 * R */
  readonly epsPlane: number;
  /** [L^2] Degenerate face area tolerance: 1e-6 * R^2 */
  readonly epsFaceArea: number;
  /** [L^3] Degenerate tetrahedron volume tolerance: 1e-7 * R^3 */
  readonly epsVolume: number;
  /** [L^0] Regularity dimensionless ratio threshold: (L_max - L_min) / R <= 1e-4 */
  readonly epsRegularity: number;
  /** [L^0] Angular tolerance in radians: 1e-6 rad */
  readonly epsAngle: number;
  /** [L^0] Finite float comparison tolerance: 1e-12 */
  readonly epsFinite: number;
}

export const TOLERANCE_COEFFICIENTS = {
  SPHERE_MEMBERSHIP_COEFF: 1e-6,
  COINCIDENT_COEFF: 1e-6,
  PLANE_DISTANCE_COEFF: 1e-6,
  FACE_AREA_COEFF: 1e-6,
  VOLUME_COEFF: 1e-7,
  REGULARITY_DIMENSIONLESS: 1e-4,
  ANGLE_RADIANS: 1e-6,
  FINITE_EPS: 1e-12,
} as const;

export const GEOMETRY_TOLERANCES = {
  NUMERICAL_EPSILON: 1e-6,
  RADIUS_EPSILON: 1e-6,
  REGULARITY_TOLERANCE: 1e-4,
  VOLUME_DEGENERACY_TOLERANCE: 1e-7,
  COINCIDENCE_EPSILON: 1e-6,
} as const;

/**
 * Derives the centralized, scale-aware tolerances for a sphere of radius R.
 * Throws or returns fallback if R <= 0.
 */
export function getResolvedTolerances(R: number): ResolvedTolerances {
  if (!Number.isFinite(R) || R <= 0) {
    throw new Error(`Invalid characteristic scale R: ${R}. Radius must be finite and strictly positive.`);
  }

  const R2 = R * R;
  const R3 = R2 * R;

  return {
    scale: R,
    epsSphere: TOLERANCE_COEFFICIENTS.SPHERE_MEMBERSHIP_COEFF * R,
    epsCoincident: TOLERANCE_COEFFICIENTS.COINCIDENT_COEFF * R,
    epsPlane: TOLERANCE_COEFFICIENTS.PLANE_DISTANCE_COEFF * R,
    epsFaceArea: TOLERANCE_COEFFICIENTS.FACE_AREA_COEFF * R2,
    epsVolume: TOLERANCE_COEFFICIENTS.VOLUME_COEFF * R3,
    epsRegularity: TOLERANCE_COEFFICIENTS.REGULARITY_DIMENSIONLESS,
    epsAngle: TOLERANCE_COEFFICIENTS.ANGLE_RADIANS,
    epsFinite: TOLERANCE_COEFFICIENTS.FINITE_EPS,
  };
}
