# Package 04: Dependency Propagation & Temporal Model
**Type:** Architectural Transfer Specification & Causal Dynamics  
**Status:** Ingested & Frozen  
**Core Domain:** Semantic Impact Maps, Permutation Symmetry, Snapshots, Deltas, Traces

---

## 1. Causal Neighborhoods & Semantic Impact Maps

The combinatorial topology $4V / 6E / 4F$ induces strict incident dependency partitions.

When any single vertex is displaced:
- Exactly 3 incident edges and 3 incident faces are **structurally affected**.
- Exactly 1 opposite face and 3 disjoint edges remain **strictly invariant**.

### Complete Permutation Table:

| Moved Vertex | Incident Edges (Affected) | Incident Faces (Affected) | Invariant Edges | Invariant Face |
| :---: | :---: | :---: | :---: | :---: |
| **A** | $AB, AC, AD$ | $ABC, ABD, ACD$ | $BC, BD, CD$ | $BCD$ |
| **B** | $AB, BC, BD$ | $ABC, ABD, BCD$ | $AC, AD, CD$ | $ACD$ |
| **C** | $AC, BC, CD$ | $ABC, ACD, BCD$ | $AB, AD, BD$ | $ABD$ |
| **D** | $AD, BD, CD$ | $ABD, ACD, BCD$ | $AB, AC, BC$ | $ABC$ |

This structural symmetry is mathematically exact and independent of coordinates.

---

## 2. Epistemic Impact Categorization

Downstream geometric elements are classified under three distinct states during a mutation:
1. **`AFFECTED`**: Structurally incident to the modified vertex.
2. **`CHANGED`**: Numerically altered beyond the relevant dimensional tolerance band.
3. **`UNCHANGED`**: Either structurally disjoint or numerically preserved within tolerance.

---

## 3. Temporal Model & Conceptual Pipeline

The temporal progression of geometry obeys a deterministic chain:
$$\text{Snapshot}_0 \xrightarrow{\text{Action}} \text{Transition} \xrightarrow{\text{Diff}} \text{Delta} \xrightarrow{\text{Predicate}} \text{Invariant} \xrightarrow{\text{Append}} \text{Trace}$$

### 3.1. Geometry Snapshot
A state capture comprising:
- Canonical Cartesian State $(O, R, A, B, C, D)$.
- Derived metrics (edge lengths, face areas, volume $V_s$).
- **`geometrySignature`**: A deterministic hash computed strictly from canonical geometry and derived metrics.

### 3.2. Decoupling Rule
Metadata fields (timestamps, client frames, user cursor positions) belong strictly to temporal observation and **must never be incorporated into the `geometrySignature`**.

---

## 4. History Buffer & Baseline Oracle

- **History Buffer:** A bounded ring buffer storing historical snapshots and state deltas for auditing and playback.
- **Oracle Baseline:** Full deterministic recomputation remains the single authoritative baseline oracle against which any future incremental recomputation must be verified.
