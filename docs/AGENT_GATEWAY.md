# Agent Gateway v0.1 Specification

**Project:** Tetraider Sphere 3D Geometry Stand  
**Component:** Programmatic Agent Interface & Verification Oracle  
**Status:** IMPLEMENTED & TESTED (Local TypeScript & Browser Console)  
**External Transport:** NOT_IMPLEMENTED (HTTP, JSON-RPC server, MCP daemon are not present)

---

## 1. Architectural Boundary & Intent

The **Agent Gateway v0.1** provides an programmatic access interface for external AI agents, automated reasoning routines, and developer scripts to interact with the Tetraider Sphere geometric core.

### Architectural Invariant:
```text
AI Agent ──► Agent Gateway ──► Command Validation ──► Canonical Geometry Core ──► Verification Oracle ──► Evidence Record
```

### Core Constraints:
1. **Single Mathematical Core:** The gateway is not an independent geometry engine; it delegates all geometric operations directly to the canonical core (`geometryState.ts`, `metrics.ts`, `symmetry.ts`, `construction.ts`).
2. **Receiver-Owned Tolerances:** Agents cannot dictate arbitrary tolerances to force verification to pass. The oracle strictly uses the scale-aware centralized tolerance policy (`getResolvedTolerances(R)`).
3. **Workspace Isolation:** Operations that produce new geometric states store them as branches in gateway registry memory. The active human viewport is never silently mutated.
4. **Local Access vs Network API:** The gateway currently operates in-process via TypeScript API or in-browser via the `window.__fssAgentGateway` global object. An external HTTP REST, JSON-RPC, or Model Context Protocol (MCP) server is **`NOT_IMPLEMENTED`**.

---

## 2. Gateway Command Catalog (9 Implemented Commands)

All commands are structured as a discriminated union: `AgentGatewayCommand` in `src/core/gatewayTypes.ts`. Every command execution returns an `AgentGatewayResponse<T>`:

```typescript
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
```

---

### Command 1: `inspect_passport`

- **Purpose:** Inspect the general 3D object definition, combinatorial topology, and theoretical symmetry capabilities.
- **Input Parameters:**
  ```typescript
  { readonly command: 'inspect_passport'; readonly objectId?: string; }
  ```
- **Preconditions:** Active canonical state exists in registry.
- **Core Function Called:** `computeDerivedMetrics(state)` in `metrics.ts`.
- **Output Data Type:** `ObjectPassport` (objectId, name, topology, symmetryProfile, activeStateSignature).
- **Creates Derived State:** No.
- **Generates Experiment Record:** No.
- **Possible Errors:** None under normal operation.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 01).
- **Example:**
  ```json
  { "command": "inspect_passport" }
  ```

---

### Command 2: `inspect_symmetry_passport`

- **Purpose:** Evaluate and inspect the state-specific symmetry properties of a given geometric state.
- **Input Parameters:**
  ```typescript
  {
    readonly command: 'inspect_symmetry_passport';
    readonly targetStateId?: string;
    readonly evaluateGenerators?: boolean;
    readonly evaluateFullGroup?: boolean;
  }
  ```
- **Preconditions:** Referenced state exists in registry (defaults to active state).
- **Core Function Called:** `evaluateTetrahedralCandidateSymmetries` in `symmetry.ts`.
- **Output Data Type:** `SymmetryPassport` (classificationStatus, pointGroup, inversionCenter, testedOperations).
- **Creates Derived State:** No.
- **Generates Experiment Record:** No.
- **Possible Errors:** `STATE_NOT_FOUND`.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 13).
- **Example:**
  ```json
  {
    "command": "inspect_symmetry_passport",
    "evaluateFullGroup": true
  }
  ```

---

### Command 3: `get_canonical_snapshot`

- **Purpose:** Retrieve the frozen Cartesian coordinates in $\mathbb{R}^3$, bounding sphere, validation status, and summary metrics.
- **Input Parameters:**
  ```typescript
  {
    readonly command: 'get_canonical_snapshot';
    readonly objectId?: string;
    readonly stateId?: string;
  }
  ```
- **Preconditions:** Target state exists in registry.
- **Core Function Called:** `validateGeometryState` in `geometryState.ts`, `computeDerivedMetrics` in `metrics.ts`.
- **Output Data Type:** `GatewayStateSnapshot` (canonical state, validation, summaryMetrics).
- **Creates Derived State:** No.
- **Generates Experiment Record:** No.
- **Possible Errors:** `STATE_NOT_FOUND`.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 01).
- **Example:**
  ```json
  { "command": "get_canonical_snapshot", "stateId": "active" }
  ```

---

### Command 4: `construct_object`

- **Purpose:** Construct a new canonical geometry state through verified primitives.
- **Input Parameters:**
  ```typescript
  {
    readonly command: 'construct_object';
    readonly constructionType: 'REGULAR_TETRAHEDRON' | 'EXPLICIT_TETRAHEDRON';
    readonly params: {
      readonly radius?: number;
      readonly center?: Point3D;
      readonly vertices?: Partial<Record<VertexId, Point3D>>;
      readonly sphere?: Sphere3D;
    };
  }
  ```
- **Preconditions:** Non-zero radius for regular tetrahedron; 4 valid, non-coincident, non-coplanar vertices on sphere for explicit tetrahedron.
- **Core Function Called:** `constructRegularTetrahedron` or `constructExplicitTetrahedron` in `construction.ts`.
- **Output Data Type:** `{ constructionType, resultingStateId, signature, createdElements, validation, description }`.
- **Creates Derived State:** Yes (registers new state in gateway registry).
- **Generates Experiment Record:** No.
- **Possible Errors:** `INVALID_INPUT`, `COINCIDENT_VERTICES`, `COPLANAR_VERTICES`, `OUTSIDE_SPHERE`, `NON_FINITE_INPUT`, `UNSUPPORTED_OPERATION`.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 02, Contract 03).
- **Example:**
  ```json
  {
    "command": "construct_object",
    "constructionType": "REGULAR_TETRAHEDRON",
    "params": { "radius": 1.0, "center": { "x": 0, "y": 0, "z": 0 } }
  }
  ```

---

### Command 5: `apply_symmetry_operation`

- **Purpose:** Apply an affine isometry ($O(3) \rtimes \mathbb{R}^3$) to a target state and register the transformed state.
- **Input Parameters:**
  ```typescript
  {
    readonly command: 'apply_symmetry_operation';
    readonly targetStateId?: string;
    readonly operation: SymmetryOperationSpec; // CENTRAL_INVERSION, AXIS_ROTATION, PLANE_REFLECTION
  }
  ```
- **Preconditions:** Target state exists; rotation axis or plane normal is non-zero.
- **Core Function Called:** `createCentralInversion`, `createAxisRotation`, `createPlaneReflection`, `transformVertices`, `compareVertexSets` in `symmetry.ts`.
- **Output Data Type:** `{ operationApplied, inputStateSignature, resultingStateId, outputStateSignature, vertexDisplacements, maxDisplacement, isInvariant, validation }`.
- **Creates Derived State:** Yes (registers resulting transformed state in gateway registry).
- **Generates Experiment Record:** No.
- **Possible Errors:** `STATE_NOT_FOUND`, `INVALID_INPUT`.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 06).
- **Example:**
  ```json
  {
    "command": "apply_symmetry_operation",
    "operation": {
      "type": "AXIS_ROTATION",
      "axis": { "x": 0, "y": 0, "z": 1 },
      "angleDegrees": 120
    }
  }
  ```

---

### Command 6: `query_metric`

- **Purpose:** Query a specific scalar or global metric from the authoritative oracle.
- **Input Parameters:**
  ```typescript
  {
    readonly command: 'query_metric';
    readonly targetStateId?: string;
    readonly metricName: 'signedVolume' | 'absoluteVolume' | 'isRegular' | 'edgeLength' | 'faceArea' | 'orientation' | 'all';
    readonly target?: string; // 'AB', 'ABC', etc.
  }
  ```
- **Preconditions:** Target state exists; target edge/face label is valid.
- **Core Function Called:** `computeDerivedMetrics` in `metrics.ts`.
- **Output Data Type:** `{ metric, value, units?, stateSignature }`.
- **Creates Derived State:** No.
- **Generates Experiment Record:** No.
- **Possible Errors:** `STATE_NOT_FOUND`, `INVALID_EDGE_ID`, `INVALID_FACE_ID`, `UNSUPPORTED_OPERATION`.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 04).
- **Example:**
  ```json
  {
    "command": "query_metric",
    "metricName": "signedVolume"
  }
  ```

---

### Command 7: `verify_claim`

- **Purpose:** Submit an untrusted hypothesis to the deterministic verification oracle and generate an immutable proof artifact.
- **Input Parameters:**
  ```typescript
  {
    readonly command: 'verify_claim';
    readonly targetStateId?: string;
    readonly hypothesis: AgentHypothesisSpec;
  }
  ```
- **Preconditions:** Target state exists; predicate type and parameters are valid.
- **Core Function Called:** `computeDerivedMetrics`, `compareVertexSets`, `getResolvedTolerances`.
- **Output Data Type:** `{ verdict, epistemicStatus, explanation, residual, toleranceUsed }` and attaches `EvidenceRecord`.
- **Creates Derived State:** No (stores transformed state during invariance check if applicable).
- **Generates Experiment Record:** **Yes** (appends entry to `ExperimentLedger`).
- **Possible Errors:** `STATE_NOT_FOUND`, `INVALID_INPUT`, `INVALID_EDGE_ID`, `INVALID_FACE_ID`, `INVALID_VERTEX_ID`, `UNSUPPORTED_OPERATION`.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 07, 08, 09, 10, 11).
- **Example:**
  ```json
  {
    "command": "verify_claim",
    "hypothesis": {
      "predicate": "IS_INVARIANT_UNDER_OPERATION",
      "claimedValue": true,
      "operationContext": {
        "type": "AXIS_ROTATION",
        "axis": { "x": 0, "y": 0, "z": 1 },
        "angleDegrees": 120
      }
    }
  }
  ```

---

### Command 8: `perturb_geometry`

- **Purpose:** Apply a deterministic displacement offset to a single vertex to study symmetry breaking and causal propagation.
- **Input Parameters:**
  ```typescript
  {
    readonly command: 'perturb_geometry';
    readonly targetStateId?: string;
    readonly vertexId: VertexId; // 'A', 'B', 'C', 'D'
    readonly offset: Point3D;
    readonly preserveSphereConstraint?: boolean;
  }
  ```
- **Preconditions:** Target state exists; resulting geometry remains non-degenerate and finite.
- **Core Function Called:** `constructPerturbedTetrahedron` in `construction.ts`.
- **Output Data Type:** `{ inputStateSignature, resultingStateId, outputStateSignature, vertexModified, offsetApplied, validation, description }`.
- **Creates Derived State:** **Yes** (registers branched perturbed state in gateway registry).
- **Generates Experiment Record:** No.
- **Possible Errors:** `STATE_NOT_FOUND`, `PERTURBATION_FAILED`.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 05, Contract 07).
- **Example:**
  ```json
  {
    "command": "perturb_geometry",
    "vertexId": "A",
    "offset": { "x": 0.15, "y": 0.0, "z": 0.0 }
  }
  ```

---

### Command 9: `get_experiment_ledger`

- **Purpose:** Retrieve the chronological log of verification experiments and evidence records.
- **Input Parameters:**
  ```typescript
  {
    readonly command: 'get_experiment_ledger';
    readonly limit?: number;
  }
  ```
- **Preconditions:** None.
- **Core Function Called:** Internal gateway ledger buffer slice.
- **Output Data Type:** `readonly ExperimentLedgerEntry[]`.
- **Creates Derived State:** No.
- **Generates Experiment Record:** No.
- **Possible Errors:** None.
- **Relevant Tests:** `agent_gateway_v01.test.ts` (Contract 12).
- **Example:**
  ```json
  { "command": "get_experiment_ledger", "limit": 10 }
  ```

---

## 3. How to Access the Gateway

### In-Browser Runtime Access
When the Tetraider Sphere application is running in the browser, the active gateway instance is mounted to `window.__fssAgentGateway`:

```javascript
// Open browser DevTools console (F12)
const gateway = window.__fssAgentGateway;

// Execute any command:
const response = gateway.executeCommand({
  command: 'verify_claim',
  hypothesis: {
    predicate: 'IS_REGULAR',
    claimedValue: true
  }
});

console.log('Verdict:', response.evidence.verdict);
console.log('Residual:', response.evidence.mathematicalEvidence.residual);
```

### TypeScript / Node.js Runtime Access
In test scripts or headless evaluation environments:

```typescript
import {
  createAgentGateway,
  constructRegularTetrahedron,
  createPoint3D
} from './src/core';

// 1. Initialize canonical state
const constructRes = constructRegularTetrahedron(1.0);
const initialState = constructRes.canonicalState!;

// 2. Create gateway instance
const gateway = createAgentGateway(initialState, 'TETRA-STAND-01');

// 3. Dispatch command
const res = gateway.executeCommand({
  command: 'query_metric',
  metricName: 'signedVolume'
});

console.log('Signed Volume:', res.data.value);
```

---

## 4. External Connectivity Status

| Transport Type | Status | Notes |
| :--- | :---: | :--- |
| **In-Memory TypeScript API** | `IMPLEMENTED` & `TESTED` | Primary API used by unit tests and internal engine. |
| **Browser Window Global** | `IMPLEMENTED` & `TESTED` | Bound to `window.__fssAgentGateway` for local automation. |
| **Agent Console UI** | `IMPLEMENTED` & `TESTED` | React component in workstation sidebar with JSON editor. |
| **HTTP REST Endpoint** | `NOT_IMPLEMENTED` | No HTTP server routes exist on port 3000. |
| **JSON-RPC 2.0 Endpoint** | `NOT_IMPLEMENTED` | No socket or RPC listener is bound. |
| **Model Context Protocol (MCP)** | `NOT_IMPLEMENTED` | No MCP server daemon is present. |
