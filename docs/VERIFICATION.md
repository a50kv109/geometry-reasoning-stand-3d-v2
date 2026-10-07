# Verification Architecture & Agent Protocol

## 1. The Verification Principle

> **The Agent May Be Wrong. The Stand Must Not.**

The **Dynamic 3D Geometry Reasoning Stand** treats all external inputs—whether from human users, neural language models, or automated agents—as untrusted assertions.

The deterministic mathematical core validates every claim using first-principles geometry and scale-aware numerical tolerances.

---

## 2. Operation Taxonomy: Solving vs. Verifying

The system strictly distinguishes between four modes of mathematical operation:

| Operation | Input | Expected Output | Implementation Status |
| :--- | :--- | :--- | :---: |
| **`SOLVE`** | Geometric configuration + goal metric | Deterministic calculation of the exact value | **IMPLEMENTED** (Core Engine) |
| **`VERIFY_RESULT`** | Geometric state + untrusted claimed value | Epistemic verdict (`VALID` / `INVALID` / `UNKNOWN`) + delta | **IMPLEMENTED** (Engine checks) |
| **`VERIFY_STEP`** | State $S_0$, State $S_1$, claimed modified vertex, claimed impact map | Verification that transition is valid and incident impact map matches topology | **PARTIALLY IMPLEMENTED** (Core validation & impact graph live; public network protocol in M8) |
| **`CONSISTENCY_CHECK`** | A set of untrusted assertions | Mutual coexistence check (`CONSISTENT` / `INCONSISTENT` / `UNDERDETERMINED`) | **PLANNED** (Contract defined in Pkg 05) |

---

## 3. Four Orthogonal Epistemic Taxonomies

To eliminate ambiguous error codes, the stand enforces four distinct, uncollapsed status enums:

### 3.1. `VerificationStatus` (Outcome of an external claim)
- **`VALID`**: The claimed value matches the authoritative recomputed value within the scale-aware tolerance.
- **`INVALID`**: The claimed value deviates from the authoritative recomputed value beyond the tolerance.
- **`UNKNOWN`**: The assertion cannot be verified due to mathematical indeterminacy (e.g. normal of a degenerate face).
- **`MISSING_INPUT`**: Required parameters or initial state variables were omitted.
- **`PRECONDITION_FAILED`**: Initial state was invalid (e.g. vertex not on sphere).

### 3.2. `InputGeometryStatus` (Physical validity of input coordinates)
- **`VALID_INPUT`**: Coordinates are finite and lie strictly on $S^2(O, R)$ within $\epsilon_{\text{sphere}}$.
- **`OUTSIDE_SPHERE`**: Point distance from origin deviates from $R$ beyond $\epsilon_{\text{sphere}}$ (rejected without silent projection).
- **`NON_FINITE_INPUT`**: Point contains $\text{NaN}$ or $\pm\infty$.
- **`INVALID_INPUT`**: Sphere radius $R \le 0$ or malformed state.

### 3.3. `RealizationStatus` (Solid geometry realization)
- **`VALID_POSITIVE`**: Non-degenerate solid with positive signed volume ($V_s > +\epsilon_{\text{volume}}$).
- **`VALID_NEGATIVE`**: Non-degenerate solid with negative signed volume ($V_s < -\epsilon_{\text{volume}}$) — valid left-handed configuration.
- **`DEGENERATE`**: Four vertices are coplanar ($|V_s| \le \epsilon_{\text{volume}}$).
- **`VERTEX_COINCIDENT`**: Two or more vertices coincide ($\|V_i - V_j\| \le \epsilon_{\text{coincident}}$).

### 3.4. `ConsistencyStatus` (Mutual coexistence of untrusted claims)
- **`CONSISTENT`**: All assertions can simultaneously hold in Euclidean space.
- **`INCONSISTENT`**: At least two assertions contradict one another or geometric axioms.
- **`UNDERDETERMINED`**: Assertions do not provide sufficient constraints.

---

## 4. Provenance Tracking & Anti-Circular Guard

Every statement in the stand carries a provenance tag:
- **`DETERMINISTIC_DERIVATION`**: Directly calculated by the stand's mathematical core. (Authoritative)
- **`AGENT_ASSERTION`**: Submitted by an external AI agent. (Untrusted)
- **`VERIFICATION_EVIDENCE`**: Emitted by an automated test or verification checker.

### Anti-Circular Guard
An `AGENT_ASSERTION` can never be used as a premise to verify another `AGENT_ASSERTION`. Only `DETERMINISTIC_DERIVATION` or verified base axioms serve as valid ground truth.

---

## 5. Deterministic Test Suite

The repository contains 105 automated deterministic unit and integration tests organized across 10 suites:

1. **`src/tests/m1_canonical_state.test.ts` (17 Tests: T01 - T17)**
   - Sphere creation, non-finite rejection, outside-sphere rejection without silent projection.
   - Distinctness detection, persistent vertex identities, topology invariance across mutations.
   - Metadata independence of geometry signature, negative volume validity, coplanar degeneracy.
2. **`src/tests/m1_5_visual_client.test.ts` (10 Tests: C01 - C10)**
   - Camera mutation invariance, spherical-to-Cartesian preservation of $S^2$ constraint.
   - Causal neighborhood identification for all vertices and edges.
   - Analytical volume checks against regular tetrahedron invariants.
3. **`src/tests/m1_6_workspace_layout.test.ts` (7 Tests: W01 - W07)**
   - Desktop layout structure (~65% / ~35%), zero screen space waste, independent scrolling.
   - Strict 7-section information flow ordering and causal graph synchronization.
4. **`src/tests/m1_7_scale_and_guides.test.ts` (16 Tests: T01 - T16)**
   - Visual scale factor invariance (geometry and signature unchanged at 100%, 75%, 50%).
   - Exact latitude and longitude derivation across all four vertices.
   - Coordinate guide containment on $S^2$, pole singularity convention ($\lambda = 0$ at $\phi = \pm 90^\circ$), periodic wrap-around.
5. **`src/tests/scale_dependency_consistency.test.ts` (6 Tests)**
   - PAT-27 dimensional scaling verification across regular geometries ($L \propto R, A \propto R^2, V \propto R^3$).
6. **`src/tests/scale_dependency_irregular.test.ts` (6 Tests)**
   - PAT-27 scale invariance across arbitrary irregular tetrahedra.
7. **`src/tests/regular_tetrahedron_metric.test.ts` (5 Tests)**
   - Analytical closed-form metric checks: edge lengths ($4R/\sqrt{6}$), face area ($2\sqrt{3}R^2/3$), volume ($8\sqrt{3}R^3/27$).
8. **`src/tests/epistemic_status_orthogonal.test.ts` (7 Tests)**
   - Epistemic taxonomy orthogonality, confidence score monotonicity, hypothesis vs. fact wrappers.
9. **`src/tests/agent_readiness_smoke.test.ts` (11 Tests)**
   - Untrusted agent contract checks: oracle state immutability, truth validation, false claim refutation, batch evaluations.
10. **`src/tests/lvg_dlvm_gds_temporal.test.ts` (10 Tests: LVG-01 to Temporal-03)**
    - LVG intrinsic geometry: Gram matrix symmetry, solid angle $\Omega(v)$ via Oosterom-Strackee, translation/scale invariance.
    - DLVM 4-manifold derivation and shared-edge anti-parallelism $\mathbf{u}_{AB}^{(A)} = -\mathbf{u}_{BA}^{(B)}$.
    - GDS snapshot aggregation without state mutation.
    - Temporal transition engine: strict monotonic time ordering ($t_1 > t_0$), delta differentials, and corruption detection.

All 105 tests are 100% deterministic, execute in headless mode via `tsx`, and complete in under 60 milliseconds.

