/**
 * FEDOROV SYMMETRY STAND (FSS) — AGENT GATEWAY v0.1
 * Canonical Gateway Implementation & Deterministic Verification Oracle
 * 
 * Invariants:
 * - AI Agent → Agent Gateway → Command Validation → Canonical Geometry Core → Deterministic Verification → Evidence Record
 * - The gateway is NOT a second geometry engine.
 * - The gateway does NOT maintain an independent copy of geometric truth.
 * - The gateway does NOT bypass canonical state and manipulate UI objects.
 * - Receiver strictly owns tolerance selection: agent cannot declare arbitrary tolerance to force a pass!
 * - Isolated experiment branching: operations do not silently mutate the human scene.
 */

import {
  CanonicalGeometryState,
  Sphere3D,
  VertexId,
  EpistemicStatus,
  EdgeId,
  FaceId,
} from './types';
import {
  createPoint3D,
  validateGeometryState,
} from './geometryState';
import { CANONICAL_VERTICES, CANONICAL_EDGES, CANONICAL_FACES } from './topology';
import { computeDerivedMetrics } from './metrics';
import { generateGeometrySignature } from './signature';
import { getResolvedTolerances } from './tolerances';
import {
  createCentralInversion,
  createAxisRotation,
  createPlaneReflection,
  transformVertices,
  compareVertexSets,
  AffineIsometry3D,
  evaluateTetrahedralCandidateSymmetries,
} from './symmetry';
import {
  constructRegularTetrahedron,
  constructExplicitTetrahedron,
  constructPerturbedTetrahedron,
} from './construction';
import {
  AgentGatewayCommand,
  AgentGatewayResponse,
  ObjectPassport,
  SymmetryPassport,
  GatewayStateSnapshot,
  EvidenceRecord,
  EvidenceVerdict,
  MathematicalEvidence,
  ExperimentLedgerEntry,
  SymmetryOperationSpec,
  AgentHypothesisSpec,
} from './gatewayTypes';

export interface AgentGateway {
  readonly objectId: string;
  getActiveState(): CanonicalGeometryState;
  executeCommand(command: AgentGatewayCommand): AgentGatewayResponse;
  getLedger(): readonly ExperimentLedgerEntry[];
  clearLedger(): void;
  registerState(state: CanonicalGeometryState, description?: string): string;
  getState(stateId: string): CanonicalGeometryState | undefined;
}

/**
 * Creates an instance of the FSS Agent Gateway.
 */
export function createAgentGateway(
  initialState: CanonicalGeometryState,
  objectId: string = 'FSS-POLYHEDRON-TETRA-001'
): AgentGateway {
  // Authoritative State Storage for Gateway branches
  const stateRegistry = new Map<string, { state: CanonicalGeometryState; signature: string; timestamp: number }>();
  const experimentLedger: ExperimentLedgerEntry[] = [];

  // Register the initial canonical state as "active"
  const initialSig = generateGeometrySignature(initialState);
  stateRegistry.set('active', { state: initialState, signature: initialSig, timestamp: Date.now() });
  stateRegistry.set(initialSig, { state: initialState, signature: initialSig, timestamp: Date.now() });

  function resolveState(stateId?: string): CanonicalGeometryState | undefined {
    if (!stateId || stateId === 'active') {
      return stateRegistry.get('active')?.state;
    }
    return stateRegistry.get(stateId)?.state;
  }

  function appendLedger(
    commandName: string,
    inputSig: string,
    outputSig: string | undefined,
    verdict: EvidenceVerdict,
    evidence: EvidenceRecord
  ): void {
    experimentLedger.push({
      experimentId: evidence.experimentId,
      timestamp: evidence.timestamp,
      commandName,
      objectId,
      inputStateSignature: inputSig,
      outputStateSignature: outputSig,
      verdict,
      evidence,
    });
  }

  // ============================================================
  // COMMAND IMPLEMENTATIONS
  // ============================================================

  function handleInspectPassport(): AgentGatewayResponse<ObjectPassport> {
    const currentState = stateRegistry.get('active')!.state;
    const sig = generateGeometrySignature(currentState);
    const metrics = computeDerivedMetrics(currentState);

    const passport: ObjectPassport = {
      objectId,
      name: metrics.global.isRegular ? 'Правильный тетраэдр (Regular Tetrahedron)' : 'Общий тетраэдр (General Tetrahedron)',
      objectClass: 'POLYHEDRON',
      topology: {
        vertexLabels: CANONICAL_VERTICES,
        edgeCount: CANONICAL_EDGES.length,
        faceCount: CANONICAL_FACES.length,
        eulerCharacteristic: CANONICAL_VERTICES.length - CANONICAL_EDGES.length + CANONICAL_FACES.length, // 4 - 6 + 4 = 2
        edges: CANONICAL_EDGES.map(e => e.id),
        faces: CANONICAL_FACES.map(f => f.id),
      },
      symmetryProfile: {
        theoreticalMaxPointGroup: 'T_d (order 24)',
        crystallographicSystem: 'CUBIC',
        typicalGenerators: [
          'C_3 (120° rotation about vertex-face axis)',
          'C_2 (180° rotation about edge-bisection axis)',
          'sigma_d (reflection across edge-bisecting plane)',
        ],
      },
      activeStateSignature: sig,
      availableCapabilities: [
        'inspect_passport',
        'inspect_symmetry_passport',
        'get_canonical_snapshot',
        'construct_object',
        'apply_symmetry_operation',
        'query_metric',
        'verify_claim',
        'perturb_geometry',
        'get_experiment_ledger',
      ],
    };

    return {
      success: true,
      command: 'inspect_passport',
      data: passport,
    };
  }

  function handleInspectSymmetryPassport(
    cmd: Extract<AgentGatewayCommand, { command: 'inspect_symmetry_passport' }>
  ): AgentGatewayResponse<SymmetryPassport> {
    const state = resolveState(cmd.targetStateId);
    if (!state) {
      return {
        success: false,
        command: 'inspect_symmetry_passport',
        error: { code: 'STATE_NOT_FOUND', message: `Referenced stateId '${cmd.targetStateId}' does not exist in registry.` },
      };
    }

    const stateSig = generateGeometrySignature(state);
    const R = state.sphere.radius;
    const tol = getResolvedTolerances(R);
    const evaluateFull = cmd.evaluateFullGroup ?? false;
    const evaluateGen = cmd.evaluateGenerators ?? false;

    if (!evaluateFull && !evaluateGen) {
      // Neither full group nor generators requested: return state identity with explicit NOT_COMPUTED status
      const uncomputedPassport: SymmetryPassport = {
        passportType: 'SYMMETRY_PASSPORT',
        objectId,
        stateId: cmd.targetStateId ?? stateSig,
        stateSignature: stateSig,
        classificationStatus: 'NOT_COMPUTED',
        pointGroup: {
          schoenflies: 'NOT_COMPUTED',
          hermannMauguin: 'NOT_COMPUTED',
          system: 'NOT_COMPUTED',
          order: null,
          completeness: 'NOT_COMPUTED',
        },
        inversionCenter: {
          evaluated: false,
          exists: false,
          status: 'NOT_COMPUTED',
        },
        testedOperationsCount: 0,
        testedOperations: [],
        receiverTolerancePolicy: {
          scale: R,
          linearEpsilon: tol.epsSphere,
          angularEpsilon: tol.epsAngle,
          rule: 'Scale-aware Package 06 centralized tolerance policy',
        },
        timestamp: Date.now(),
      };

      return {
        success: true,
        command: 'inspect_symmetry_passport',
        data: uncomputedPassport,
      };
    }

    // Evaluate operations
    const evalRes = evaluateTetrahedralCandidateSymmetries(
      state.vertices,
      tol.epsSphere,
      state.sphere.center,
      evaluateFull
    );

    const testedOps = evalRes.testedOperations.map(op => ({
      operationType: (op.operation.type as any),
      description: op.operation.description,
      parameters: { translation: op.operation.translation },
      isInvariant: op.isInvariant,
      maxDisplacement: op.maxDisplacement,
      toleranceUsed: tol.epsSphere,
      verdict: op.classification,
    }));

    let schoenflies = 'INDETERMINATE';
    let hermannMauguin = 'INDETERMINATE';
    let system: any = 'INDETERMINATE';
    let order: number | null = null;
    let completeness: any = evaluateFull ? 'FULL_GROUP_VERIFIED' : 'GENERATORS_ONLY';
    let classificationStatus: any = 'PARTIALLY_VERIFIED';

    if (evaluateFull) {
      if (evalRes.invariantCount === evalRes.totalTested) {
        // All 24 operations of T_d satisfied
        schoenflies = 'T_d';
        hermannMauguin = '-43m';
        system = 'CUBIC';
        order = 24;
        classificationStatus = 'VERIFIED';
      } else if (evalRes.invariantCount === 1) {
        // Only Identity operation preserved (general tetrahedron)
        schoenflies = 'C_1';
        hermannMauguin = '1';
        system = 'TRICLINIC';
        order = 1;
        classificationStatus = 'VERIFIED';
      } else {
        // Subgroup (e.g. C_3, C_2, C_s)
        schoenflies = `Subgroup (${evalRes.invariantCount} ops preserved)`;
        hermannMauguin = 'subgroup';
        system = 'MONOCLINIC';
        order = evalRes.invariantCount;
        classificationStatus = 'PARTIALLY_VERIFIED';
      }
    } else {
      // Generators only: do not report complete group!
      schoenflies = evalRes.invariantCount >= 7 ? 'T_d (generators verified)' : 'Reduced symmetry';
      hermannMauguin = evalRes.invariantCount >= 7 ? '-43m (generators)' : 'indeterminate';
      system = evalRes.invariantCount >= 7 ? 'CUBIC' : 'INDETERMINATE';
      order = null;
      completeness = 'GENERATORS_ONLY';
      classificationStatus = 'PARTIALLY_VERIFIED';
    }

    const passport: SymmetryPassport = {
      passportType: 'SYMMETRY_PASSPORT',
      objectId,
      stateId: cmd.targetStateId ?? stateSig,
      stateSignature: stateSig,
      classificationStatus,
      pointGroup: {
        schoenflies,
        hermannMauguin,
        system,
        order,
        completeness,
      },
      inversionCenter: {
        evaluated: true,
        exists: evalRes.inversionInvariant,
        center: state.sphere.center,
        maxDisplacement: evalRes.inversionDisplacement,
        status: evalRes.inversionInvariant ? 'VERIFIED' : 'REFUTED',
      },
      testedOperationsCount: evalRes.totalTested,
      testedOperations: Object.freeze(testedOps),
      receiverTolerancePolicy: {
        scale: R,
        linearEpsilon: tol.epsSphere,
        angularEpsilon: tol.epsAngle,
        rule: 'Scale-aware Package 06 centralized tolerance policy',
      },
      timestamp: Date.now(),
    };

    return {
      success: true,
      command: 'inspect_symmetry_passport',
      data: passport,
    };
  }

  function handleGetCanonicalSnapshot(stateId?: string): AgentGatewayResponse<GatewayStateSnapshot> {
    const state = resolveState(stateId);
    if (!state) {
      return {
        success: false,
        command: 'get_canonical_snapshot',
        error: { code: 'STATE_NOT_FOUND', message: `Referenced stateId '${stateId}' does not exist in registry.` },
      };
    }

    const validation = validateGeometryState(state.sphere, state.vertices);
    const sig = generateGeometrySignature(state);
    const metrics = computeDerivedMetrics(state);

    const snapshot: GatewayStateSnapshot = {
      stateId: stateId ?? sig,
      objectId,
      signature: sig,
      timestamp: Date.now(),
      canonical: state,
      validation,
      summaryMetrics: {
        isRegular: metrics.global.isRegular,
        signedVolume: metrics.global.signedVolume,
        absoluteVolume: metrics.global.absoluteVolume,
        orientation: metrics.global.orientation,
      },
    };

    return {
      success: true,
      command: 'get_canonical_snapshot',
      data: snapshot,
    };
  }

  function handleConstructObject(cmd: Extract<AgentGatewayCommand, { command: 'construct_object' }>): AgentGatewayResponse {
    const { constructionType, params } = cmd;

    if (constructionType === 'REGULAR_TETRAHEDRON') {
      const res = constructRegularTetrahedron(params.radius ?? 1.0, params.center ?? createPoint3D(0, 0, 0));
      if (!res.success || !res.canonicalState) {
        return {
          success: false,
          command: 'construct_object',
          error: { code: res.error ?? 'CONSTRUCTION_FAILED', message: res.description },
        };
      }
      const sig = generateGeometrySignature(res.canonicalState);
      stateRegistry.set(sig, { state: res.canonicalState, signature: sig, timestamp: Date.now() });

      return {
        success: true,
        command: 'construct_object',
        data: {
          constructionType,
          resultingStateId: sig,
          signature: sig,
          createdElements: res.createdElementIds,
          validation: res.validation,
          description: res.description,
        },
      };
    }

    if (constructionType === 'EXPLICIT_TETRAHEDRON') {
      if (!params.vertices) {
        return {
          success: false,
          command: 'construct_object',
          error: { code: 'INVALID_INPUT', message: 'Missing required `params.vertices` dictionary with vertices A, B, C, D.' },
        };
      }
      const res = constructExplicitTetrahedron(params.vertices, params.sphere);
      if (!res.success || !res.canonicalState) {
        return {
          success: false,
          command: 'construct_object',
          error: { code: res.error ?? 'VALIDATION_REJECTED', message: res.description },
        };
      }
      const sig = generateGeometrySignature(res.canonicalState);
      stateRegistry.set(sig, { state: res.canonicalState, signature: sig, timestamp: Date.now() });

      return {
        success: true,
        command: 'construct_object',
        data: {
          constructionType,
          resultingStateId: sig,
          signature: sig,
          createdElements: res.createdElementIds,
          validation: res.validation,
          description: res.description,
        },
      };
    }

    return {
      success: false,
      command: 'construct_object',
      error: { code: 'UNSUPPORTED_OPERATION', message: `Unknown construction type '${constructionType}'.` },
    };
  }

  function createIsometryFromSpec(spec: SymmetryOperationSpec): AffineIsometry3D {
    switch (spec.type) {
      case 'CENTRAL_INVERSION':
        return createCentralInversion(spec.center ?? createPoint3D(0, 0, 0));
      case 'AXIS_ROTATION': {
        const rad = (spec.angleDegrees * Math.PI) / 180;
        return createAxisRotation(spec.axis, rad, spec.origin ?? createPoint3D(0, 0, 0));
      }
      case 'PLANE_REFLECTION':
        return createPlaneReflection(spec.normal, spec.pointOnPlane ?? createPoint3D(0, 0, 0));
      default:
        throw new Error(`Unsupported symmetry operation type: ${(spec as any).type}`);
    }
  }

  function handleApplySymmetryOperation(cmd: Extract<AgentGatewayCommand, { command: 'apply_symmetry_operation' }>): AgentGatewayResponse {
    const inputState = resolveState(cmd.targetStateId);
    if (!inputState) {
      return {
        success: false,
        command: 'apply_symmetry_operation',
        error: { code: 'STATE_NOT_FOUND', message: `Target state '${cmd.targetStateId}' not found.` },
      };
    }

    let isometry: AffineIsometry3D;
    try {
      isometry = createIsometryFromSpec(cmd.operation);
    } catch (err: any) {
      return {
        success: false,
        command: 'apply_symmetry_operation',
        error: { code: 'INVALID_INPUT', message: err.message },
      };
    }

    // Transform vertices
    const transformedVertices = transformVertices(inputState.vertices, isometry);
    const validation = validateGeometryState(inputState.sphere, transformedVertices);
    const resultingState: CanonicalGeometryState = Object.freeze({
      sphere: inputState.sphere,
      vertices: Object.freeze(transformedVertices),
    });

    const inputSig = generateGeometrySignature(inputState);
    const outputSig = generateGeometrySignature(resultingState);

    // Register transformed state in branch registry
    stateRegistry.set(outputSig, { state: resultingState, signature: outputSig, timestamp: Date.now() });

    // Compare with input state
    const tol = getResolvedTolerances(inputState.sphere.radius);
    const comparison = compareVertexSets(inputState.vertices, transformedVertices, tol.epsSphere);

    return {
      success: true,
      command: 'apply_symmetry_operation',
      data: {
        operationApplied: isometry.description,
        inputStateSignature: inputSig,
        resultingStateId: outputSig,
        outputStateSignature: outputSig,
        vertexDisplacements: comparison.matches,
        maxDisplacement: comparison.maxDisplacement,
        meanDisplacement: comparison.meanDisplacement,
        isInvariant: comparison.isInvariant,
        validation,
      },
    };
  }

  function handleQueryMetric(cmd: Extract<AgentGatewayCommand, { command: 'query_metric' }>): AgentGatewayResponse {
    const state = resolveState(cmd.targetStateId);
    if (!state) {
      return {
        success: false,
        command: 'query_metric',
        error: { code: 'STATE_NOT_FOUND', message: `State '${cmd.targetStateId}' not found.` },
      };
    }

    const metrics = computeDerivedMetrics(state);
    const sig = generateGeometrySignature(state);

    switch (cmd.metricName) {
      case 'signedVolume':
        return {
          success: true,
          command: 'query_metric',
          data: { metric: 'signedVolume', value: metrics.global.signedVolume, units: 'L^3', stateSignature: sig },
        };
      case 'absoluteVolume':
        return {
          success: true,
          command: 'query_metric',
          data: { metric: 'absoluteVolume', value: metrics.global.absoluteVolume, units: 'L^3', stateSignature: sig },
        };
      case 'isRegular':
        return {
          success: true,
          command: 'query_metric',
          data: {
            metric: 'isRegular',
            value: metrics.global.isRegular,
            regularityRatio: metrics.global.regularityRatio,
            stateSignature: sig,
          },
        };
      case 'orientation':
        return {
          success: true,
          command: 'query_metric',
          data: { metric: 'orientation', value: metrics.global.orientation, stateSignature: sig },
        };
      case 'edgeLength': {
        const edgeId = (cmd.target ?? 'AB') as EdgeId;
        const edge = metrics.edges[edgeId];
        if (!edge) {
          return {
            success: false,
            command: 'query_metric',
            error: { code: 'INVALID_EDGE_ID', message: `Target '${cmd.target}' is not a valid edge.` },
          };
        }
        return {
          success: true,
          command: 'query_metric',
          data: { metric: 'edgeLength', edgeId, value: edge.length, units: 'L', stateSignature: sig },
        };
      }
      case 'faceArea': {
        const faceId = (cmd.target ?? 'ABC') as FaceId;
        const face = metrics.faces[faceId];
        if (!face) {
          return {
            success: false,
            command: 'query_metric',
            error: { code: 'INVALID_FACE_ID', message: `Target '${cmd.target}' is not a valid face.` },
          };
        }
        return {
          success: true,
          command: 'query_metric',
          data: { metric: 'faceArea', faceId, value: face.area, units: 'L^2', stateSignature: sig },
        };
      }
      case 'all':
        return {
          success: true,
          command: 'query_metric',
          data: { metric: 'all', metrics, stateSignature: sig },
        };
      default:
        return {
          success: false,
          command: 'query_metric',
          error: { code: 'UNSUPPORTED_OPERATION', message: `Unknown metric '${cmd.metricName}'.` },
        };
    }
  }

  function handleVerifyClaim(cmd: Extract<AgentGatewayCommand, { command: 'verify_claim' }>): AgentGatewayResponse {
    const state = resolveState(cmd.targetStateId);
    if (!state) {
      return {
        success: false,
        command: 'verify_claim',
        error: { code: 'STATE_NOT_FOUND', message: `State '${cmd.targetStateId}' not found.` },
      };
    }

    const R = state.sphere.radius;
    const resolvedTol = getResolvedTolerances(R);
    const inputSig = generateGeometrySignature(state);
    const metrics = computeDerivedMetrics(state);
    const experimentId = `exp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const hyp = cmd.hypothesis;
    let verdict: EvidenceVerdict = 'REFUTED';
    let epistemicStatus: EpistemicStatus = EpistemicStatus.REFUTED;
    let explanation = '';
    let mathEvidence: MathematicalEvidence;
    let appliedEpsilon = resolvedTol.epsSphere;
    let ruleDescription = 'Scale-aware Package 06 centralized tolerance policy';
    let outputSig: string | undefined = undefined;

    switch (hyp.predicate) {
      case 'IS_INVARIANT_UNDER_OPERATION': {
        if (!hyp.operationContext) {
          return {
            success: false,
            command: 'verify_claim',
            error: { code: 'INVALID_INPUT', message: 'Hypothesis requires `operationContext` for symmetry invariance check.' },
          };
        }
        appliedEpsilon = resolvedTol.epsSphere;
        ruleDescription = `Linear Hausdorff tolerance: epsSphere = 1e-6 * R (${appliedEpsilon.toExponential(3)})`;

        let isometry: AffineIsometry3D;
        try {
          isometry = createIsometryFromSpec(hyp.operationContext);
        } catch (e: any) {
          return {
            success: false,
            command: 'verify_claim',
            error: { code: 'INVALID_INPUT', message: e.message },
          };
        }

        const transformedVertices = transformVertices(state.vertices, isometry);
        const transformedState: CanonicalGeometryState = Object.freeze({
          sphere: state.sphere,
          vertices: Object.freeze(transformedVertices),
        });
        outputSig = generateGeometrySignature(transformedState);

        const comparison = compareVertexSets(state.vertices, transformedVertices, appliedEpsilon);
        const actualInvariant = comparison.isInvariant;
        const matchesClaim = hyp.claimedValue === actualInvariant;

        verdict = matchesClaim ? 'VERIFIED' : 'REFUTED';
        epistemicStatus = matchesClaim ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;
        explanation = matchesClaim
          ? `Symmetry hypothesis verified! Operation '${isometry.description}' invariance=${actualInvariant} (max displacement: ${comparison.maxDisplacement.toExponential(3)} <= eps: ${appliedEpsilon.toExponential(3)}).`
          : `Symmetry hypothesis refuted! Operation '${isometry.description}' invariance=${actualInvariant} contradicts claim '${hyp.claimedValue}' (max displacement: ${comparison.maxDisplacement.toExponential(3)}).`;

        mathEvidence = {
          predicate: hyp.predicate,
          claimedValue: hyp.claimedValue,
          actualValue: actualInvariant,
          residual: comparison.maxDisplacement,
          linearResidual: comparison.maxDisplacement,
          toleranceUsed: appliedEpsilon,
          tolerancePolicy: ruleDescription,
          invariantPreserved: actualInvariant,
        };
        break;
      }

      case 'IS_REGULAR': {
        appliedEpsilon = resolvedTol.epsRegularity;
        ruleDescription = `Dimensionless regularity threshold: (L_max - L_min)/R <= 1e-4 (${appliedEpsilon})`;
        const actualRegular = metrics.global.isRegular;
        const matchesClaim = hyp.claimedValue === actualRegular;

        verdict = matchesClaim ? 'VERIFIED' : 'REFUTED';
        epistemicStatus = matchesClaim ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;
        explanation = matchesClaim
          ? `Regularity hypothesis verified! isRegular=${actualRegular} (ratio: ${metrics.global.regularityRatio.toExponential(3)}).`
          : `Regularity hypothesis refuted! Claimed isRegular=${hyp.claimedValue}, ground truth is ${actualRegular} (ratio: ${metrics.global.regularityRatio.toExponential(3)}).`;

        mathEvidence = {
          predicate: hyp.predicate,
          claimedValue: hyp.claimedValue,
          actualValue: actualRegular,
          residual: metrics.global.regularityRatio,
          toleranceUsed: appliedEpsilon,
          tolerancePolicy: ruleDescription,
          invariantPreserved: actualRegular,
        };
        break;
      }

      case 'IS_DEGENERATE': {
        appliedEpsilon = resolvedTol.epsVolume;
        ruleDescription = `Volume degeneracy tolerance: epsVolume = 1e-7 * R^3 (${appliedEpsilon.toExponential(3)})`;
        const actualDegenerate = Math.abs(metrics.global.signedVolume) <= appliedEpsilon || metrics.global.orientation === 'COPLANAR';
        const matchesClaim = hyp.claimedValue === actualDegenerate;

        verdict = matchesClaim ? 'VERIFIED' : 'REFUTED';
        epistemicStatus = matchesClaim ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;
        explanation = matchesClaim
          ? `Degeneracy hypothesis verified! isDegenerate=${actualDegenerate}.`
          : `Degeneracy hypothesis refuted! Claimed isDegenerate=${hyp.claimedValue}, ground truth is ${actualDegenerate}.`;

        mathEvidence = {
          predicate: hyp.predicate,
          claimedValue: hyp.claimedValue,
          actualValue: actualDegenerate,
          residual: Math.abs(metrics.global.signedVolume),
          toleranceUsed: appliedEpsilon,
          tolerancePolicy: ruleDescription,
          invariantPreserved: !actualDegenerate,
        };
        break;
      }

      case 'ORIENTATION': {
        appliedEpsilon = resolvedTol.epsVolume;
        ruleDescription = `Determinant orientation check with epsVolume = 1e-7 * R^3`;
        const actualOrientation = metrics.global.orientation;
        const matchesClaim = hyp.claimedValue === actualOrientation;

        verdict = matchesClaim ? 'VERIFIED' : 'REFUTED';
        epistemicStatus = matchesClaim ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;
        explanation = matchesClaim
          ? `Orientation hypothesis verified! orientation='${actualOrientation}'.`
          : `Orientation hypothesis refuted! Claimed '${hyp.claimedValue}', ground truth is '${actualOrientation}'.`;

        mathEvidence = {
          predicate: hyp.predicate,
          claimedValue: hyp.claimedValue,
          actualValue: actualOrientation,
          toleranceUsed: appliedEpsilon,
          tolerancePolicy: ruleDescription,
          invariantPreserved: actualOrientation !== 'COPLANAR',
        };
        break;
      }

      case 'SIGNED_VOLUME_EQUALS': {
        appliedEpsilon = resolvedTol.epsVolume;
        ruleDescription = `Volumetric tolerance: epsVolume = 1e-7 * R^3 (${appliedEpsilon.toExponential(3)})`;
        const actualVolume = metrics.global.signedVolume;
        const claimed = typeof hyp.claimedValue === 'number' ? hyp.claimedValue : parseFloat(String(hyp.claimedValue));
        const diff = Math.abs(claimed - actualVolume);
        const matchesClaim = diff <= appliedEpsilon;

        verdict = matchesClaim ? 'VERIFIED' : 'REFUTED';
        epistemicStatus = matchesClaim ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;
        explanation = matchesClaim
          ? `Signed volume hypothesis verified! Volume=${actualVolume.toFixed(6)} matches claimed ${claimed} within tolerance ${appliedEpsilon.toExponential(3)}.`
          : `Signed volume hypothesis refuted! Claimed ${claimed}, ground truth is ${actualVolume.toFixed(6)} (residual: ${diff.toExponential(3)} > eps: ${appliedEpsilon.toExponential(3)}).`;

        mathEvidence = {
          predicate: hyp.predicate,
          claimedValue: claimed,
          actualValue: actualVolume,
          residual: diff,
          volumetricResidual: diff,
          toleranceUsed: appliedEpsilon,
          tolerancePolicy: ruleDescription,
          invariantPreserved: matchesClaim,
        };
        break;
      }

      case 'EDGE_LENGTH_EQUALS': {
        appliedEpsilon = resolvedTol.epsSphere;
        ruleDescription = `Linear tolerance: epsSphere = 1e-6 * R (${appliedEpsilon.toExponential(3)})`;
        const edgeId = (hyp.target ?? 'AB') as EdgeId;
        const edge = metrics.edges[edgeId];
        if (!edge) {
          return {
            success: false,
            command: 'verify_claim',
            error: { code: 'INVALID_EDGE_ID', message: `Invalid edge target '${hyp.target}'.` },
          };
        }
        const claimed = typeof hyp.claimedValue === 'number' ? hyp.claimedValue : parseFloat(String(hyp.claimedValue));
        const diff = Math.abs(claimed - edge.length);
        const matchesClaim = diff <= appliedEpsilon;

        verdict = matchesClaim ? 'VERIFIED' : 'REFUTED';
        epistemicStatus = matchesClaim ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;
        explanation = matchesClaim
          ? `Edge length for ${edgeId} verified! Length=${edge.length.toFixed(6)} matches claimed ${claimed}.`
          : `Edge length for ${edgeId} refuted! Claimed ${claimed}, ground truth is ${edge.length.toFixed(6)} (residual: ${diff.toExponential(3)}).`;

        mathEvidence = {
          predicate: hyp.predicate,
          claimedValue: claimed,
          actualValue: edge.length,
          residual: diff,
          linearResidual: diff,
          toleranceUsed: appliedEpsilon,
          tolerancePolicy: ruleDescription,
          invariantPreserved: matchesClaim,
        };
        break;
      }

      case 'FACE_AREA_EQUALS': {
        appliedEpsilon = resolvedTol.epsFaceArea;
        ruleDescription = `Surface area tolerance: epsFaceArea = 1e-6 * R^2 (${appliedEpsilon.toExponential(3)})`;
        const faceId = (hyp.target ?? 'ABC') as FaceId;
        const face = metrics.faces[faceId];
        if (!face) {
          return {
            success: false,
            command: 'verify_claim',
            error: { code: 'INVALID_FACE_ID', message: `Invalid face target '${hyp.target}'.` },
          };
        }
        const claimed = typeof hyp.claimedValue === 'number' ? hyp.claimedValue : parseFloat(String(hyp.claimedValue));
        const diff = Math.abs(claimed - face.area);
        const matchesClaim = diff <= appliedEpsilon;

        verdict = matchesClaim ? 'VERIFIED' : 'REFUTED';
        epistemicStatus = matchesClaim ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;
        explanation = matchesClaim
          ? `Face area for ${faceId} verified! Area=${face.area.toFixed(6)} matches claimed ${claimed}.`
          : `Face area for ${faceId} refuted! Claimed ${claimed}, ground truth is ${face.area.toFixed(6)} (residual: ${diff.toExponential(3)}).`;

        mathEvidence = {
          predicate: hyp.predicate,
          claimedValue: claimed,
          actualValue: face.area,
          residual: diff,
          toleranceUsed: appliedEpsilon,
          tolerancePolicy: ruleDescription,
          invariantPreserved: matchesClaim,
        };
        break;
      }

      case 'POINT_ON_SPHERE': {
        appliedEpsilon = resolvedTol.epsSphere;
        ruleDescription = `Sphere membership tolerance: epsSphere = 1e-6 * R (${appliedEpsilon.toExponential(3)})`;
        const vertexId = (hyp.target ?? 'A') as VertexId;
        const v = state.vertices[vertexId];
        if (!v) {
          return {
            success: false,
            command: 'verify_claim',
            error: { code: 'INVALID_VERTEX_ID', message: `Invalid vertex target '${hyp.target}'.` },
          };
        }
        const dist = Math.sqrt((v.x - state.sphere.center.x)**2 + (v.y - state.sphere.center.y)**2 + (v.z - state.sphere.center.z)**2);
        const diff = Math.abs(dist - state.sphere.radius);
        const actualOnSphere = diff <= appliedEpsilon;
        const matchesClaim = hyp.claimedValue === actualOnSphere;

        verdict = matchesClaim ? 'VERIFIED' : 'REFUTED';
        epistemicStatus = matchesClaim ? EpistemicStatus.VERIFIED : EpistemicStatus.REFUTED;
        explanation = matchesClaim
          ? `Point on sphere verified for vertex ${vertexId}! (radial diff: ${diff.toExponential(3)} <= eps: ${appliedEpsilon.toExponential(3)}).`
          : `Point on sphere refuted for vertex ${vertexId}! (radial diff: ${diff.toExponential(3)} > eps: ${appliedEpsilon.toExponential(3)}).`;

        mathEvidence = {
          predicate: hyp.predicate,
          claimedValue: hyp.claimedValue,
          actualValue: actualOnSphere,
          residual: diff,
          linearResidual: diff,
          toleranceUsed: appliedEpsilon,
          tolerancePolicy: ruleDescription,
          invariantPreserved: actualOnSphere,
        };
        break;
      }

      default:
        return {
          success: false,
          command: 'verify_claim',
          error: { code: 'UNSUPPORTED_OPERATION', message: `Unknown predicate '${(hyp as any).predicate}'.` },
        };
    }

    const evidenceRecord: EvidenceRecord = {
      evidenceId: `evi-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      experimentId,
      objectId,
      inputStateSignature: inputSig,
      outputStateSignature: outputSig,
      command: 'verify_claim',
      parameters: cmd.hypothesis as any,
      predicate: hyp.predicate,
      verdict,
      epistemicStatus,
      explanation,
      receiverTolerancePolicy: {
        scale: R,
        linearEpsilon: resolvedTol.epsSphere,
        angularEpsilon: resolvedTol.epsAngle,
        volumeEpsilon: resolvedTol.epsVolume,
        appliedEpsilon,
        rule: ruleDescription,
      },
      mathematicalEvidence: mathEvidence,
      timestamp: Date.now(),
    };

    appendLedger('verify_claim', inputSig, outputSig, verdict, evidenceRecord);

    return {
      success: true,
      command: 'verify_claim',
      experimentId,
      evidence: evidenceRecord,
      data: {
        verdict,
        epistemicStatus,
        explanation,
        residual: mathEvidence.residual,
        toleranceUsed: appliedEpsilon,
      },
    };
  }

  function handlePerturbGeometry(cmd: Extract<AgentGatewayCommand, { command: 'perturb_geometry' }>): AgentGatewayResponse {
    const state = resolveState(cmd.targetStateId);
    if (!state) {
      return {
        success: false,
        command: 'perturb_geometry',
        error: { code: 'STATE_NOT_FOUND', message: `State '${cmd.targetStateId}' not found.` },
      };
    }

    const res = constructPerturbedTetrahedron(state, cmd.vertexId, cmd.offset, cmd.preserveSphereConstraint ?? false);
    if (!res.success || !res.canonicalState) {
      return {
        success: false,
        command: 'perturb_geometry',
        error: { code: res.error ?? 'PERTURBATION_FAILED', message: res.description },
      };
    }

    const inputSig = generateGeometrySignature(state);
    const outputSig = generateGeometrySignature(res.canonicalState);

    // Register perturbed state in branch registry (does NOT overwrite 'active' human state!)
    stateRegistry.set(outputSig, { state: res.canonicalState, signature: outputSig, timestamp: Date.now() });

    return {
      success: true,
      command: 'perturb_geometry',
      data: {
        inputStateSignature: inputSig,
        resultingStateId: outputSig,
        outputStateSignature: outputSig,
        vertexModified: cmd.vertexId,
        offsetApplied: cmd.offset,
        validation: res.validation,
        description: res.description,
      },
    };
  }

  function handleGetExperimentLedger(limit?: number): AgentGatewayResponse<readonly ExperimentLedgerEntry[]> {
    const count = limit ?? experimentLedger.length;
    const entries = experimentLedger.slice(-count);
    return {
      success: true,
      command: 'get_experiment_ledger',
      data: entries,
    };
  }

  // ============================================================
  // DISPATCHER
  // ============================================================

  function executeCommand(command: AgentGatewayCommand): AgentGatewayResponse {
    if (!command || typeof command !== 'object' || !('command' in command)) {
      return {
        success: false,
        command: 'UNKNOWN',
        error: { code: 'INVALID_INPUT', message: 'Command must be an object with a valid `command` property.' },
      };
    }

    switch (command.command) {
      case 'inspect_passport':
        return handleInspectPassport();
      case 'inspect_symmetry_passport':
        return handleInspectSymmetryPassport(command);
      case 'get_canonical_snapshot':
        return handleGetCanonicalSnapshot(command.stateId);
      case 'construct_object':
        return handleConstructObject(command);
      case 'apply_symmetry_operation':
        return handleApplySymmetryOperation(command);
      case 'query_metric':
        return handleQueryMetric(command);
      case 'verify_claim':
        return handleVerifyClaim(command);
      case 'perturb_geometry':
        return handlePerturbGeometry(command);
      case 'get_experiment_ledger':
        return handleGetExperimentLedger(command.limit);
      default:
        return {
          success: false,
          command: (command as any).command ?? 'UNKNOWN',
          error: {
            code: 'UNSUPPORTED_OPERATION',
            message: `Command '${(command as any).command}' is not supported by FSS Agent Gateway v0.1.`,
          },
        };
    }
  }

  return {
    objectId,
    getActiveState(): CanonicalGeometryState {
      return stateRegistry.get('active')!.state;
    },
    executeCommand,
    getLedger(): readonly ExperimentLedgerEntry[] {
      return [...experimentLedger];
    },
    clearLedger(): void {
      experimentLedger.length = 0;
    },
    registerState(state: CanonicalGeometryState, description?: string): string {
      const sig = generateGeometrySignature(state);
      stateRegistry.set(sig, { state, signature: sig, timestamp: Date.now() });
      if (description) {
        stateRegistry.set(description, { state, signature: sig, timestamp: Date.now() });
      }
      return sig;
    },
    getState(stateId: string): CanonicalGeometryState | undefined {
      return resolveState(stateId);
    },
  };
}
