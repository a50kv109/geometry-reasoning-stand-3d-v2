/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Milestone 1 & Research Extension: Canonical 3D Geometry State & Contracts
 * 
 * Strict architectural alignment with Transfer Packages 01-06 & Agent Boundary.
 */

// ============================================================
// 1. PRIMITIVE GEOMETRIC TYPES
// ============================================================

export interface Point3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Sphere3D {
  readonly center: Point3D;
  readonly radius: number;
}

// ============================================================
// 2. PERSISTENT TOPOLOGICAL IDENTIFIERS (M1.3, M1.4)
// ============================================================

export type VertexId = 'A' | 'B' | 'C' | 'D';

export type EdgeId = 'AB' | 'AC' | 'AD' | 'BC' | 'BD' | 'CD';

export type FaceId = 'ABC' | 'ABD' | 'ACD' | 'BCD';

export interface TopologicalEdge {
  readonly id: EdgeId;
  readonly v1: VertexId;
  readonly v2: VertexId;
}

export interface TopologicalFace {
  readonly id: FaceId;
  readonly vertices: readonly [VertexId, VertexId, VertexId];
  readonly edges: readonly [EdgeId, EdgeId, EdgeId];
}

// ============================================================
// 3. CANONICAL GEOMETRY STATE (M1.1)
// ============================================================

/**
 * Authoritative, immutable Canonical Geometry State.
 * This is the ONLY mathematical source of truth in the Stand.
 */
export interface CanonicalGeometryState {
  readonly sphere: Sphere3D;
  readonly vertices: Readonly<Record<VertexId, Point3D>>;
}

// ============================================================
// 4. REPRESENTATION & VISUALIZATION STATES (M1.5)
// ============================================================

/**
 * Spherical coordinates are strictly a representation layer.
 * phi: latitude in radians [-pi/2, pi/2]
 * lambda: longitude in radians [0, 2pi)
 */
export interface SphericalCoordinate {
  readonly phi: number;
  readonly lambda: number;
}

export type CoordinateSystemType = 'CARTESIAN' | 'SPHERICAL';

export interface RepresentationState {
  readonly activeSystem: CoordinateSystemType;
  readonly sphericalCoordinates: Readonly<Record<VertexId, SphericalCoordinate>>;
}

export interface CameraState {
  readonly position: Point3D;
  readonly target: Point3D;
  readonly zoom: number;
}

export interface VisualizationState {
  readonly camera: CameraState;
  readonly selectedEntity: { type: 'VERTEX' | 'EDGE' | 'FACE'; id: string } | null;
  readonly highlightedEntities: readonly string[];
  readonly renderSphereWireframe: boolean;
  readonly renderNormals: boolean;
}

// ============================================================
// 5. VALIDATION & REALIZATION TAXONOMY (M1.2, Pkg 05, Pkg 06)
// ============================================================

export enum InputGeometryStatus {
  VALID_INPUT = 'VALID_INPUT',
  INVALID_INPUT = 'INVALID_INPUT',
  OUTSIDE_SPHERE = 'OUTSIDE_SPHERE',
  NON_FINITE_INPUT = 'NON_FINITE_INPUT'
}

export enum RealizationStatus {
  VALID_POSITIVE = 'VALID_POSITIVE',
  VALID_NEGATIVE = 'VALID_NEGATIVE',
  DEGENERATE = 'DEGENERATE',
  VERTEX_COINCIDENT = 'VERTEX_COINCIDENT'
}

export enum GeometryValidationCode {
  VALID = 'VALID',
  INVALID_RADIUS = 'INVALID_RADIUS',
  NON_FINITE_COORDINATES = 'NON_FINITE_COORDINATES',
  VERTEX_OUTSIDE_SPHERE = 'VERTEX_OUTSIDE_SPHERE',
  COINCIDENT_VERTICES = 'COINCIDENT_VERTICES',
  COPLANAR_VERTICES = 'COPLANAR_VERTICES'
}

export interface VertexValidationDetail {
  readonly vertexId: VertexId;
  readonly point: Point3D;
  readonly distanceFromCenter: number;
  readonly deviationFromSphere: number;
  readonly isOnSphere: boolean;
  readonly isFinite: boolean;
}

export interface CoincidenceDetail {
  readonly v1: VertexId;
  readonly v2: VertexId;
  readonly distance: number;
}

export interface GeometryValidationResult {
  readonly isValid: boolean;
  readonly inputStatus: InputGeometryStatus;
  readonly realizationStatus: RealizationStatus;
  readonly validationCode: GeometryValidationCode;
  readonly message: string;
  readonly vertexDetails: Readonly<Record<VertexId, VertexValidationDetail>>;
  readonly coincidences: readonly CoincidenceDetail[];
  readonly signedVolumeApproximation?: number;
}

// ============================================================
// 6. EPISTEMIC & AGENT BOUNDARY PROTOCOL TYPES
// ============================================================

export enum EpistemicStatus {
  KNOWN_FACT = 'KNOWN_FACT',
  DERIVED = 'DERIVED',
  HYPOTHESIS = 'HYPOTHESIS',
  VERIFIED = 'VERIFIED',
  CONTRADICTION = 'CONTRADICTION',
  REFUTED = 'REFUTED',
  INDETERMINATE = 'INDETERMINATE'
}

export interface EpistemicWrapper<T> {
  readonly value: T;
  readonly status: EpistemicStatus;
  readonly provenance: string;
  readonly confidence: number;
  readonly timestamp: number;
}

export type AgentClaimType = 
  | 'EDGE_LENGTH'
  | 'FACE_AREA'
  | 'VOLUME'
  | 'IS_REGULAR'
  | 'IS_DEGENERATE'
  | 'ORIENTATION'
  | 'POINT_ON_SPHERE';

export interface AgentClaim {
  readonly claimId: string;
  readonly type: AgentClaimType;
  readonly target: string; // e.g. 'AB', 'ABC', 'ABCD', 'A'
  readonly claimedValue: number | boolean | string;
  readonly tolerance?: number;
  readonly epistemicStatus?: EpistemicStatus;
  readonly justification?: string;
}

export interface AgentVerificationReport {
  readonly claimId: string;
  readonly type: AgentClaimType;
  readonly target: string;
  readonly claimedValue: number | boolean | string;
  readonly groundTruthValue: number | boolean | string;
  readonly delta?: number;
  readonly toleranceUsed: number;
  readonly verified: boolean;
  readonly epistemicVerdict: EpistemicStatus;
  readonly explanation: string;
}

export interface AgentStateSnapshot {
  readonly canonical: CanonicalGeometryState;
  readonly representation: RepresentationState;
  readonly validation: GeometryValidationResult;
  readonly timestamp: number;
  readonly signature: string;
}
