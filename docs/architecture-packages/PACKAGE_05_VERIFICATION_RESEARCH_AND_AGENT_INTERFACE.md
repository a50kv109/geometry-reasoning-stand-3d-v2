# Package 05: Verification, Research & Agent Interface
**Type:** Architectural Transfer Specification & Verification Protocol  
**Status:** Ingested & Frozen  
**Core Domain:** Agent/Stand Trust Model, Public Protocol, Epistemic Enums, Provenance

---

## 1. Agent / Stand Trust Model

The stand models external AI agents as untrusted cognitive reasoners:
- An AI agent can formulate conjectures, hypothesis proofs, and geometric claims.
- The deterministic Stand accepts claims via a public, domain-pure protocol.
- The Stand evaluates claims strictly through deterministic recomputation and scale-aware validation.
- Epistemic directive: **The Agent May Be Wrong. The Stand Must Not.**

---

## 2. Public Protocol Operations

The verification engine defines three core operations:

1. **`VERIFY_RESULT` (Result Verification)**
   - Inputs: Canonical base state + claimed result (scalar, vector, predicate).
   - Operation: Recomputes the value using the authoritative engine and compares within scale-aware tolerance.
   - Outputs: Verification verdict (`VALID`, `INVALID`, `UNKNOWN`) + deterministic numeric difference.

2. **`VERIFY_STEP` (Transition & Impact Verification)**
   - Inputs: Initial state $S_0$, modified state $S_1$, claimed modified vertex, claimed affected elements.
   - Operation: Validates that exactly one vertex moved on $S^2$, verifies the incident edge/face impact map, and confirms that disjoint topology remained invariant.
   - Outputs: Step validity verdict + semantic impact verification.

3. **`CONSISTENCY_CHECK` (Hypothesis Consistency)**
   - Inputs: Set of untrusted claims or assertions.
   - Operation: Checks whether the assertions are mutually satisfiable without promoting them to geometric truth.
   - Outputs: `CONSISTENT`, `INCONSISTENT`, or `UNDERDETERMINED`.

---

## 3. Four Orthogonal Epistemic Taxonomies

To prevent status conflation, four distinct status enums are enforced:

| Taxonomy | Status Values | Domain |
| :--- | :--- | :--- |
| **Verification Status** | `VALID`, `INVALID`, `UNKNOWN`, `MISSING_INPUT`, `PRECONDITION_FAILED` | Outcome of evaluating an external claim. |
| **Input Geometry Status** | `VALID_INPUT`, `INVALID_INPUT`, `OUTSIDE_SPHERE`, `NON_FINITE_INPUT` | Conformance of input coordinates to sphere $S^2$. |
| **Realization Status** | `VALID_POSITIVE`, `VALID_NEGATIVE`, `DEGENERATE`, `VERTEX_COINCIDENT` | Geometric quality and orientation of the tetrahedron solid. |
| **Consistency Status** | `CONSISTENT`, `INCONSISTENT`, `UNDERDETERMINED` | Mutual compatibility of a collection of assertions. |

---

## 4. Provenance & Anti-Circular Guard

- **Provenance Tracking:** Every piece of geometric information carries an explicit provenance tag:
  - `DETERMINISTIC_DERIVATION`: Produced by the stand's mathematical core.
  - `AGENT_ASSERTION`: Untrusted statement submitted by an external agent.
  - `VERIFICATION_EVIDENCE`: Result produced by a verification check.
- **Anti-Circular Guard:** An `AGENT_ASSERTION` cannot be used as a premise to verify another `AGENT_ASSERTION`. Only `DETERMINISTIC_DERIVATION` constitutes authoritative ground truth.
