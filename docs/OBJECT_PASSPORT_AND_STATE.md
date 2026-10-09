# Object Passport, State, and Geometric Identity

**Project:** Tetraider Sphere 3D Geometry Stand  
**Component:** Object Identity, Canonical State, and Symmetry Passport Specification  
**Status:** IMPLEMENTED & TESTED (In-memory data contracts)

---

## 1. Overview & Ontological Boundary

The Tetraider Sphere stand enforces a strict ontological separation between the mathematical object, its instantaneous geometric state, its derived representations, its hypotheses, and its verification artifacts:

$$\boxed{\mathbf{OBJECT\ IDENTITY} \neq \mathbf{CANONICAL\ STATE} \neq \mathbf{REPRESENTATION} \neq \mathbf{SYMMETRY\ PASSPORT} \neq \mathbf{CLAIM} \neq \mathbf{EVIDENCE}}$$

| Entity | Role | Mutability | Authoritative Source |
| :--- | :--- | :--- | :--- |
| **Object Identity (PGO-3D)** | Combinatorial and topological definition of the 3D entity | Invariant across deformations | `topology.ts`, `ObjectPassport` |
| **Canonical State** | Frozen Cartesian coordinates in $\mathbb{R}^3$ on sphere $S^2$ | Immutable snapshot | `geometryState.ts` (`CanonicalGeometryState`) |
| **Representation** | Spherical coordinates $(\phi, \lambda)$, coordinate guides | Derived on demand | `representation.ts` (`RepresentationState`) |
| **Symmetry Passport (PSS-3D)** | State-specific symmetry evaluation and group classification | Tied to single state signature | `gatewayTypes.ts`, `agentGateway.ts` |
| **Agent Claim / Hypothesis** | External untrusted assertion about metric or invariance | Ephemeral input | `AgentHypothesisSpec` |
| **Evidence Record** | Deterministic proof artifact produced by verifier | Immutable ledger artifact | `EvidenceRecord` |

---

## 2. Object Identity & Topological Schema

In Tetraider Sphere, an object's identity does **not** change when its vertices move. A deformed tetrahedron remains the exact same topological object as a regular tetrahedron.

### Combinatorial Topology Invariants
- **Object ID:** `FSS-POLYHEDRON-TETRA-001` (default active object identifier).
- **Object Class:** `POLYHEDRON`.
- **Vertices (4):** Persistent labels $\{A, B, C, D\}$. Vertices are never re-indexed or sorted by spatial position.
- **Edges (6):** Straight Euclidean chords traversing the sphere interior:
  $$\{AB, AC, AD, BC, BD, CD\}$$
- **Faces (4):** Planar Euclidean triangles:
  $$\{ABC, ABD, ACD, BCD\}$$
- **Euler Characteristic:**
  $$\chi = V - E + F = 4 - 6 + 4 = 2$$
  (Topologically equivalent to the 2-sphere $S^2$).

### Object Passport (`ObjectPassport`)
The Object Passport represents the schema and theoretical capabilities of the object. It is exposed via the `inspect_passport` command:

```typescript
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
    readonly theoreticalMaxPointGroup: string; // e.g. "T_d (order 24)"
    readonly crystallographicSystem: FedorovCrystallographicSystem; // e.g. "CUBIC"
    readonly typicalGenerators: readonly string[];
  };
  readonly activeStateSignature: string;
  readonly availableCapabilities: readonly string[];
}
```

> **Implementation Note:** A dedicated database class or ORM model for "Object Passport" does **not** exist in the codebase. The `ObjectPassport` is an immutable TypeScript data structure assembled on-demand by `handleInspectPassport` in `src/core/agentGateway.ts`.

---

## 3. Canonical Geometry State

The authoritative ground truth for geometry resides exclusively in Cartesian space $\mathbb{R}^3$.

### State Definition (`CanonicalGeometryState`)
Defined in `src/core/types.ts`:
```typescript
export interface CanonicalGeometryState {
  readonly sphere: Sphere3D;
  readonly vertices: Readonly<Record<VertexId, Point3D>>;
}
```

### Invariants:
1. **Sphere Anchor:** $S^2(O, R) = \{ P \in \mathbb{R}^3 \mid \|P - O\|_2 = R \}$ with center $O(0, 0, 0)$ and radius $R > 0$.
2. **Surface Constraint:** For all $v \in \{A, B, C, D\}$, $|\|v - O\|_2 - R| \le \epsilon_{\text{sphere}}$.
3. **Deep Freeze:** The state object and vertex records are deeply frozen via `Object.freeze`. Mutations can only occur by constructing a new canonical state.
4. **Anti-Silent-Projection:** The engine **never** silently projects off-sphere points onto the sphere surface. Invalid coordinates produce explicit rejection errors (`OUTSIDE_SPHERE`).

---

## 4. Geometric Signatures & Their Limitations

To track state changes across discrete operations without tracking heavy object trees, the stand computes a metadata-free 32-bit FNV-1a hash signature.

### Signature Algorithm (`src/core/signature.ts`)
- Quantizes radius $R$, center $O$, and vertices $A, B, C, D$ to fixed string representations with 6 decimal places of precision.
- Hashes the normalized canonical string using the 32-bit FNV-1a algorithm.
- Produces an 8-character hexadecimal string, e.g., `"f8a1b2c4"`.

### Crucial Limitations of the Signature:
1. **Not a Mathematical Isomorphism Proof:** A matching signature indicates identical quantized coordinates under the canonical labeling. It does **not** prove geometric congruence under arbitrary coordinate rotations or vertex relabelings.
2. **Finite Resolution:** Coordinates differing by less than $10^{-6}$ may produce identical hashes due to quantization.
3. **Label Dependency:** Permuting vertex coordinates (e.g. swapping $A$ and $B$) changes the signature even if the underlying geometric shape is congruent.

---

## 5. State Snapshots (`GatewayStateSnapshot`)

When an agent requests `get_canonical_snapshot`, the gateway packages the canonical geometry with validation results and key scalar metrics into a `GatewayStateSnapshot`:

```typescript
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
```

---

## 6. State-Specific Symmetry Passport (PSS-3D)

Unlike the static `ObjectPassport`, symmetry is a **property of a specific geometric state**. Deforming a single vertex breaks symmetry while leaving object identity intact.

### The Symmetry Passport (`src/core/gatewayTypes.ts`)
```typescript
export interface SymmetryPassport {
  readonly passportType: 'SYMMETRY_PASSPORT';
  readonly objectId: string;
  readonly stateId: string;
  readonly stateSignature: string;
  readonly classificationStatus: 'VERIFIED' | 'REFUTED' | 'PARTIALLY_VERIFIED' | 'INDETERMINATE' | 'NOT_COMPUTED';
  readonly pointGroup: {
    readonly schoenflies: string;
    readonly hermannMauguin: string;
    readonly system: FedorovCrystallographicSystem;
    readonly order: number | null;
    readonly completeness: 'FULL_GROUP_VERIFIED' | 'GENERATORS_ONLY' | 'SAMPLE_OPERATIONS' | 'NOT_COMPUTED';
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
```

### Strict Completeness Rules:
1. **`NOT_COMPUTED`**: If `inspect_symmetry_passport` is called without evaluation flags, `classificationStatus` is `'NOT_COMPUTED'` and `pointGroup.completeness` is `'NOT_COMPUTED'`. The stand never guesses a group without computation.
2. **`GENERATORS_ONLY`**: If `evaluateGenerators = true` is passed, candidate generators (4 $C_3$ axes, 3 $C_2$ axes, inversion $i$) are tested. If satisfied, `completeness` is strictly `'GENERATORS_ONLY'`, `order = null`, and the stand does **not** declare complete group $T_d$.
3. **`FULL_GROUP_VERIFIED`**: If `evaluateFullGroup = true` is passed, all **24 operations** of $T_d$ (Identity $E$, 8 rotations $C_3$, 3 rotations $C_2$, 6 reflections $\sigma_d$, 6 improper rotations $S_4$) are tested against the state's vertices using `compareVertexSets`:
   - If all 24 preserve the vertex set: $T_d$ (order 24, Cubic system, Hermann-Mauguin $-43m$) is classified as `VERIFIED`.
   - Inversion center $i$ is tested explicitly and confirmed as absent (`status: 'REFUTED'`).
   - If a perturbed state preserves only Identity $E$: classified as $C_1$ (order 1, Triclinic system, Hermann-Mauguin $1$) with `FULL_GROUP_VERIFIED`.

---

## 7. State Transitions & Experiment Provenance

The stand maintains provenance through two mechanisms:
1. **Temporal Measurement Engine (`geometryTemporal.ts`):** Measures state transition deltas ($\Delta V$, $\Delta S$, $\|\Delta v\|$) between state $S_0$ at $t_0$ and state $S_1$ at $t_1$.
2. **Experiment Ledger (`agentGateway.ts`):** Records every agent experiment with `inputStateSignature`, `outputStateSignature`, `command`, `parameters`, and `evidence`.

These mechanisms allow any experiment to be replayed or compared without mutating the primary human workstation scene.
