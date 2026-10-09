# Verification Model & Experiment Evidence

**Project:** Tetraider Sphere 3D Geometry Stand  
**Component:** Deterministic Verification Oracle, Tolerance Policy, and Evidence Records  
**Status:** IMPLEMENTED & TESTED

---

## 1. The Verification Core Principle

> **"The Agent May Be Wrong. The Stand Must Not."**

In the Tetraider Sphere stand, all external clients—whether human users, LLM agents, or automated scripts—are treated as untrusted reasoners. The stand never takes assertions on faith, never mutates canonical state to accommodate false claims, and never allows an agent to define its own error bounds to force a test to pass.

---

## 2. Receiver-Owned Tolerance Policy (Package 06)

A fundamental vulnerability of naive AI verification stands is permitting the client to supply an arbitrary tolerance (e.g. `tolerance = 999.0`) to force verification of an incorrect claim.

### Strict Policy Enactment:
- An agent may submit an optional `toleranceHint` in its hypothesis specification.
- The verification oracle **strictly ignores** the agent's hint and applies the centralized, scale-aware tolerance policy defined in `src/core/tolerances.ts`.
- All tolerances scale dynamically with characteristic radius $R$:

| Dimension | Tolerance Parameter | Formula | Scale at $R=1.0$ | Description |
| :--- | :--- | :--- | :--- | :--- |
| $\mathsf{L}^1$ (Length) | `epsSphere` | $10^{-6} \cdot R$ | $1.0 \times 10^{-6}$ | Sphere boundary membership & Hausdorff matching |
| $\mathsf{L}^1$ (Distance) | `epsCoincident` | $10^{-6} \cdot R$ | $1.0 \times 10^{-6}$ | Coincident vertex separation threshold |
| $\mathsf{L}^1$ (Plane) | `epsPlane` | $10^{-6} \cdot R$ | $1.0 \times 10^{-6}$ | Coplanar point-to-plane distance threshold |
| $\mathsf{L}^2$ (Area) | `epsFaceArea` | $10^{-6} \cdot R^2$ | $1.0 \times 10^{-6}$ | Triangular face area tolerance |
| $\mathsf{L}^3$ (Volume) | `epsVolume` | $10^{-7} \cdot R^3$ | $1.0 \times 10^{-7}$ | Signed volume & degeneracy threshold |
| $\mathsf{L}^0$ (Ratio) | `epsRegularity` | $1.0 \times 10^{-4}$ | $1.0 \times 10^{-4}$ | Dimensionless edge spread ratio $(L_{\max} - L_{\min})/R$ |
| $\mathsf{L}^0$ (Angle) | `epsAngle` | $1.0 \times 10^{-6} \text{ rad}$ | $1.0 \times 10^{-6}$ | Angular direction collinearity |

---

## 3. Supported Verification Predicates

The oracle evaluates 8 explicit predicates via the `verify_claim` command:

| Predicate | Evaluated Against | Residual Metric | Applied Tolerance |
| :--- | :--- | :--- | :--- |
| **`IS_INVARIANT_UNDER_OPERATION`** | Isometry transformed vertices vs original vertices | $\max_{v'} \min_u \|v' - u\|$ | `epsSphere` ($10^{-6} R$) |
| **`IS_REGULAR`** | Dimensionless edge variation ratio | $(L_{\max} - L_{\min})/R$ | `epsRegularity` ($10^{-4}$) |
| **`IS_DEGENERATE`** | Volume collapse or coplanarity | $|V_{\text{signed}}|$ | `epsVolume` ($10^{-7} R^3$) |
| **`ORIENTATION`** | Scalar triple product determinant sign | Determinant sign | Exact enum (`POSITIVE`, `NEGATIVE`, `COPLANAR`) |
| **`SIGNED_VOLUME_EQUALS`** | Determinant signed volume $V_s$ | $|V_{\text{claimed}} - V_{\text{actual}}|$ | `epsVolume` ($10^{-7} R^3$) |
| **`EDGE_LENGTH_EQUALS`** | Chord length $L_{ij} = \|v_i - v_j\|$ | $|L_{\text{claimed}} - L_{\text{actual}}|$ | `epsSphere` ($10^{-6} R$) |
| **`FACE_AREA_EQUALS`** | Cross-product triangular area $S_F$ | $|S_{\text{claimed}} - S_{\text{actual}}|$ | `epsFaceArea` ($10^{-6} R^2$) |
| **`POINT_ON_SPHERE`** | Euclidean distance to origin $\|v - O\|$ | $|\|v - O\| - R|$ | `epsSphere` ($10^{-6} R$) |

---

## 4. Symmetry Transformation Comparison (`compareVertexSets`)

When evaluating `IS_INVARIANT_UNDER_OPERATION`:
1. The specified affine isometry $T \in O(3) \rtimes \mathbb{R}^3$ transforms each canonical vertex $v_i \in \{A, B, C, D\}$ to $v'_i = T(v_i)$.
2. For each transformed vertex $v'_i$, the engine finds the closest original vertex $u \in \{A, B, C, D\}$ and computes Euclidean distance $d_i = \|v'_i - u\|$.
3. **Bijective Matching Verification:** The engine asserts that every original vertex label is matched exactly once. If two transformed vertices map to the same target, invariance is immediately refuted.
4. **Hausdorff Metric:** Maximum displacement $\max_i d_i$ is compared against receiver tolerance $\epsilon_{\text{sphere}}$.
5. If $\max_i d_i \le \epsilon_{\text{sphere}}$ and the mapping is bijective, the transformation is verified as an invariance of the vertex set.

---

## 5. Structure of an Evidence Record (`EvidenceRecord`)

Every execution of `verify_claim` generates an immutable proof artifact:

```typescript
export interface EvidenceRecord {
  readonly evidenceId: string;
  readonly experimentId: string;
  readonly objectId: string;
  readonly inputStateSignature: string;
  readonly outputStateSignature?: string;
  readonly command: string;
  readonly parameters: Readonly<Record<string, any>>;
  readonly predicate: VerificationPredicateType | string;
  readonly verdict: 'VERIFIED' | 'REFUTED' | 'INVALID_INPUT' | 'UNSUPPORTED_OPERATION';
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
  readonly mathematicalEvidence: {
    readonly predicate: string;
    readonly claimedValue: any;
    readonly actualValue: any;
    readonly residual?: number;
    readonly toleranceUsed: number;
    readonly tolerancePolicy: string;
    readonly invariantPreserved: boolean;
  };
  readonly timestamp: number;
}
```

---

## 6. Reproducibility & Determinism

1. **State Isolation:** All calculations use pure functions without hidden state, caching side effects, or randomized approximations.
2. **Deterministic Outputs:** Calling `verify_claim` multiple times on identical states produces byte-for-byte identical `mathematicalEvidence` (residuals, actual values, tolerances). This invariant is formally verified in `src/tests/agent_gateway_v01.test.ts` (Contract 11).
3. **Experiment Ledger:** Entries in the ledger persist throughout the application session, enabling verification audits and regression comparisons.

---

## 7. What the Verification Engine Does NOT Prove

To maintain rigorous scientific standards, the documentation explicitly delineates what the implementation **does not** guarantee:

1. **Discrete Vertex Set vs Continuum Manifold:** Vertex set invariance under an isometry proves that the set $\{A, B, C, D\}$ maps onto itself. It does **not** perform an infinite continuum integral over the interior polyhedron volume.
2. **Single Operation vs Full Group Closure:** Verifying that a tetrahedron is invariant under a $120^\circ$ rotation about the Z-axis ($C_3$) proves that *that specific operation* is a symmetry. It does **not** prove group closure or the full group $T_d$ unless `inspect_symmetry_passport` is run with `evaluateFullGroup: true`.
3. **General Polyhedral Topology:** All verification algorithms are specialized for 4-vertex tetrahedral manifolds inscribed in $S^2$. They do not generalize to arbitrary meshes without extension.
4. **Signature Equality vs Mathematical Isomorphism:** Two states having identical FNV-1a hashes are quantized coordinate matches, not a formal isomorphism proof.
