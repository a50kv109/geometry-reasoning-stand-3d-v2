/**
 * FEDOROV SYMMETRY STAND (FSS) — AGENT GATEWAY v0.1
 * Formal Typed Command & Evidence Contracts
 * 
 * Strict architectural alignment:
 * OBJECT ≠ STATE SNAPSHOT ≠ REPRESENTATION ≠ CLAIM ≠ EVIDENCE
 * Receiver owns verification tolerance policy.
 */

import { Point3D, Sphere3D, VertexId, CanonicalGeometryState, GeometryValidationResult, EpistemicStatus } from './types';
import { AffineIsometry3D } from './symmetry';

// ============================================================
// 1. OBJECT PASSPORT (PGO-3D: Object Identity & Schema)
// ============================================================

export interface ObjectPassport {
  readonly objectId: string;
  readonly name: string;
  readonly objectClass: 'POLYHEDRON' | 'CRYSTAL_CELL' | 'CLUSTER';
  readonly topology: {
    readonly vertexLabels: readonly string[];
    readonly edgeCount: number;
    readonly faceCount: number;
    readonly eulerCharacteristic: number;
    readonly edges: readonly string[];
    readonly faces: readonly string[];
  };
  readonly symmetryProfile: {
    readonly theoreticalMaxPointGroup: string;
    readonly crystallographicSystem: FedorovCrystallographicSystem;
    readonly typicalGenerators: readonly string[];
  };
  readonly activeStateSignature: string;
  readonly availableCapabilities: readonly string[];
}

// ============================================================
// 1b. STATE-SPECIFIC SYMMETRY PASSPORT (PSS-3D)
// Distinct from Object Identity, State Snapshot, Claim & Evidence
// ============================================================

export type SymmetryClassificationStatus =
  | 'VERIFIED'
  | 'REFUTED'
  | 'PARTIALLY_VERIFIED'
  | 'INDETERMINATE'
  | 'NOT_COMPUTED';

export type SymmetryGroupCompleteness =
  | 'FULL_GROUP_VERIFIED'
  | 'GENERATORS_ONLY'
  | 'SAMPLE_OPERATIONS'
  | 'NOT_COMPUTED';

export type FedorovCrystallographicSystem =
  | 'CUBIC'
  | 'TETRAGONAL'
  | 'ORTHORHOMBIC'
  | 'HEXAGONAL'
  | 'TRIGONAL'
  | 'MONOCLINIC'
  | 'TRICLINIC'
  | 'INDETERMINATE'
  | 'NOT_COMPUTED';

export interface TestedSymmetryOperation {
  readonly operationType: SymmetryOpType;
  readonly description: string;
  readonly parameters: Readonly<Record<string, any>>;
  readonly isInvariant: boolean;
  readonly maxDisplacement: number;
  readonly toleranceUsed: number;
  readonly verdict: 'VERIFIED' | 'REFUTED' | 'INDETERMINATE';
}

export interface SymmetryPassport {
  readonly passportType: 'SYMMETRY_PASSPORT';
  readonly objectId: string;
  readonly stateId: string;
  readonly stateSignature: string;
  readonly classificationStatus: SymmetryClassificationStatus;
  readonly pointGroup: {
    readonly schoenflies: string;
    readonly hermannMauguin: string;
    readonly system: FedorovCrystallographicSystem;
    readonly order: number | null;
    readonly completeness: SymmetryGroupCompleteness;
  };
  readonly inversionCenter: {
    readonly evaluated: boolean;
    readonly exists: boolean;
    readonly center?: Point3D;
    readonly maxDisplacement?: number;
    readonly status: 'VERIFIED' | 'REFUTED' | 'NOT_COMPUTED';
  };
  readonly testedOperationsCount: number;
  readonly testedOperations: readonly TestedSymmetryOperation[];
  readonly receiverTolerancePolicy: {
    readonly scale: number;
    readonly linearEpsilon: number;
    readonly angularEpsilon: number;
    readonly rule: string;
  };
  readonly timestamp: number;
}

// ============================================================
// 2. STATE SNAPSHOT
// ============================================================

export interface GatewayStateSnapshot {
  readonly stateId: string;
  readonly objectId: string;
  readonly signature: string;
  readonly timestamp: number;
  readonly canonical: CanonicalGeometryState;
  readonly validation: GeometryValidationResult;
  readonly summaryMetrics: {
    readonly isRegular: boolean;
    readonly signedVolume: number;
    readonly absoluteVolume: number;
    readonly orientation: 'POSITIVE' | 'NEGATIVE' | 'COPLANAR';
  };
}

// ============================================================
// 3. SYMMETRY OPERATION SPECIFICATIONS
// ============================================================

export type SymmetryOpType = 
  | 'CENTRAL_INVERSION' 
  | 'AXIS_ROTATION' 
  | 'PLANE_REFLECTION';

export interface CentralInversionSpec {
  readonly type: 'CENTRAL_INVERSION';
  readonly center?: Point3D; // defaults to origin or sphere center
}

export interface AxisRotationSpec {
  readonly type: 'AXIS_ROTATION';
  readonly axis: Point3D;
  readonly angleDegrees: number;
  readonly origin?: Point3D;
}

export interface PlaneReflectionSpec {
  readonly type: 'PLANE_REFLECTION';
  readonly normal: Point3D;
  readonly pointOnPlane?: Point3D;
}

export type SymmetryOperationSpec = 
  | CentralInversionSpec 
  | AxisRotationSpec 
  | PlaneReflectionSpec;

// ============================================================
// 4. AGENT HYPOTHESIS SPECIFICATIONS
// ============================================================

export type VerificationPredicateType =
  | 'IS_INVARIANT_UNDER_OPERATION'
  | 'IS_REGULAR'
  | 'IS_DEGENERATE'
  | 'ORIENTATION'
  | 'SIGNED_VOLUME_EQUALS'
  | 'EDGE_LENGTH_EQUALS'
  | 'FACE_AREA_EQUALS'
  | 'POINT_ON_SPHERE';

export interface AgentHypothesisSpec {
  readonly predicate: VerificationPredicateType;
  readonly target?: string; // e.g. 'AB', 'ABC', 'A', 'ABCD'
  readonly claimedValue: number | boolean | string;
  readonly operationContext?: SymmetryOperationSpec; // For invariance claims
  readonly justification?: string;
  /**
   * Note: Agent tolerance suggestions are purely advisory.
   * Receiver strictly owns tolerance selection!
   */
  readonly toleranceHint?: number;
}

// ============================================================
// 5. EVIDENCE RECORD (DETERMINISTIC PROOF ARTIFACT)
// ============================================================

export type EvidenceVerdict = 
  | 'VERIFIED' 
  | 'REFUTED' 
  | 'INVALID_INPUT' 
  | 'UNSUPPORTED_OPERATION';

export interface MathematicalEvidence {
  readonly predicate: string;
  readonly claimedValue: number | boolean | string;
  readonly actualValue: number | boolean | string;
  readonly residual?: number;
  readonly linearResidual?: number;
  readonly angularResidual?: number;
  readonly volumetricResidual?: number;
  readonly toleranceUsed: number;
  readonly tolerancePolicy: string;
  readonly invariantPreserved: boolean;
}

export interface EvidenceRecord {
  readonly evidenceId: string;
  readonly experimentId: string;
  readonly objectId: string;
  readonly inputStateSignature: string;
  readonly outputStateSignature?: string;
  readonly command: string;
  readonly parameters: Readonly<Record<string, any>>;
  readonly predicate: VerificationPredicateType | string;
  readonly verdict: EvidenceVerdict;
  readonly epistemicStatus: EpistemicStatus;
  readonly explanation: string;
  readonly receiverTolerancePolicy: {
    readonly scale: number;
    readonly linearEpsilon: number;
    readonly angularEpsilon: number;
    readonly volumeEpsilon: number;
    readonly appliedEpsilon: number;
    readonly rule: string;
  };
  readonly mathematicalEvidence: MathematicalEvidence;
  readonly timestamp: number;
}

// ============================================================
// 6. EXPERIMENT LEDGER RECORD
// ============================================================

export interface ExperimentLedgerEntry {
  readonly experimentId: string;
  readonly timestamp: number;
  readonly commandName: string;
  readonly objectId: string;
  readonly inputStateSignature: string;
  readonly outputStateSignature?: string;
  readonly verdict: EvidenceVerdict;
  readonly evidence: EvidenceRecord;
}

// ============================================================
// 7. MINIMAL WORKING 8 COMMAND SET (DISCRIMINATED UNION)
// ============================================================

export interface InspectPassportCommand {
  readonly command: 'inspect_passport';
  readonly objectId?: string;
}

export interface InspectSymmetryPassportCommand {
  readonly command: 'inspect_symmetry_passport';
  readonly targetStateId?: string;
  readonly evaluateGenerators?: boolean;
  readonly evaluateFullGroup?: boolean;
}

export interface GetCanonicalSnapshotCommand {
  readonly command: 'get_canonical_snapshot';
  readonly objectId?: string;
  readonly stateId?: string;
}

export interface ConstructObjectCommand {
  readonly command: 'construct_object';
  readonly constructionType: 'REGULAR_TETRAHEDRON' | 'EXPLICIT_TETRAHEDRON';
  readonly params: {
    readonly radius?: number;
    readonly center?: Point3D;
    readonly vertices?: Partial<Record<VertexId, Point3D>>;
    readonly sphere?: Sphere3D;
  };
}

export interface ApplySymmetryOperationCommand {
  readonly command: 'apply_symmetry_operation';
  readonly targetStateId?: string;
  readonly operation: SymmetryOperationSpec;
}

export interface QueryMetricCommand {
  readonly command: 'query_metric';
  readonly targetStateId?: string;
  readonly metricName: 'signedVolume' | 'absoluteVolume' | 'isRegular' | 'edgeLength' | 'faceArea' | 'orientation' | 'all';
  readonly target?: string; // 'AB', 'ABC', etc.
}

export interface VerifyClaimCommand {
  readonly command: 'verify_claim';
  readonly targetStateId?: string;
  readonly hypothesis: AgentHypothesisSpec;
}

export interface PerturbGeometryCommand {
  readonly command: 'perturb_geometry';
  readonly targetStateId?: string;
  readonly vertexId: VertexId;
  readonly offset: Point3D;
  readonly preserveSphereConstraint?: boolean;
}

export interface GetExperimentLedgerCommand {
  readonly command: 'get_experiment_ledger';
  readonly limit?: number;
}

export type AgentGatewayCommand =
  | InspectPassportCommand
  | InspectSymmetryPassportCommand
  | GetCanonicalSnapshotCommand
  | ConstructObjectCommand
  | ApplySymmetryOperationCommand
  | QueryMetricCommand
  | VerifyClaimCommand
  | PerturbGeometryCommand
  | GetExperimentLedgerCommand;

// ============================================================
// 8. GATEWAY RESPONSE CONTRACT
// ============================================================

export interface AgentGatewayResponse<T = any> {
  readonly success: boolean;
  readonly command: string;
  readonly experimentId?: string;
  readonly data?: T;
  readonly evidence?: EvidenceRecord;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: any;
  };
}
