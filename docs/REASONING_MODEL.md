# Reasoning Model & Causal Dependencies

## 1. The Core Reasoning Concept

The **Dynamic 3D Geometry Reasoning Stand** is constructed around causal observability:
When a geometric object changes, the system exposes **what changed**, **what remained invariant**, and **why**.

Consider moving vertex $D$ on the sphere surface:
```text
                  [ Action: Move Vertex D ]
                             │
                             ▼
                ┌─────────────────────────┐
                │   Incident Edges (3)    │
                │       AD, BD, CD        │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │   Incident Faces (3)    │
                │      ABD, ACD, BCD      │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │   Global Solid State    │
                │  Signed Volume V_s      │
                │  Total Surface Area S   │
                │  Centroid G             │
                │  Orientation & Validity │
                └─────────────────────────┘
```

Simultaneously, the combinatorial topology guarantees that the disjoint subgraph:
- **Disjoint Edges:** $\{AB, AC, BC\}$
- **Opposite Face:** $\{ABC\}$

remains **completely unaltered**. The length of $BC$ and the area of $\triangle ABC$ do not change by even a single epsilon.

---

## 2. Dependency Graph vs. Computation Strategy

A crucial architectural principle established in Package 01 and Package 04:

> **The Dependency Graph is an epistemic causal model, NOT a mandate for incremental computation.**

### Why the Dependency Graph Exists
1. **Human & Agent Explanation:** It allows the stand to visually explain causal neighborhoods: *"Moving vertex D modified faces ABD, ACD, and BCD, but face ABC is independent."*
2. **Verification of Invariants:** It specifies which mathematical quantities must remain constant across transitions (`VERIFY_STEP`).
3. **Formal Semantic Impact Maps:** It structures proofs and reasoning steps for automated agents.

### Why Full Recomputation is the Execution Engine
Incremental caching algorithms (dirty flags, partial graph evaluation, selective cache invalidation) introduce complex hidden state and risk caching bugs or numerical drift.

Therefore, the stand executes **full deterministic recomputation** on every frame:
$$\text{State } S \implies \text{Evaluate all 6 edges} \implies \text{Evaluate all 4 faces} \implies \text{Compute Volume & State}$$

---

## 3. Epistemic Definition of the "Oracle"

In the engineering architecture of this project, the deterministic recomputation engine is referred to as the **baseline oracle**.

### Precise Epistemic Definition
- **What "Oracle" Means in this System:**  
  A deterministic, reference implementation that computes results directly from first principles without caching or heuristics. It serves as an authoritative test baseline against which any optimized, incremental, or agent-generated algorithms are checked.
- **What "Oracle" Does NOT Mean:**  
  It is **not** a philosophical claim of infallible cosmic mathematical truth, nor an omniscient solver of uncomputable problems. It is a standard computer-science reference standard (an automated test oracle) operating under standard IEEE 754 double-precision arithmetic.

---

## 4. Causal Neighborhood Permutation Table

The 4V / 6E / 4F simplicial structure exhibits exact permutation symmetry across all four vertices:

| Vertex Action | Structurally Incident Edges | Structurally Incident Faces | Structurally Invariant Edges | Structurally Invariant Faces |
| :---: | :---: | :---: | :---: | :---: |
| **Move A** | $AB, AC, AD$ | $ABC, ABD, ACD$ | $BC, BD, CD$ | $BCD$ |
| **Move B** | $AB, BC, BD$ | $ABC, ABD, BCD$ | $AC, AD, CD$ | $ACD$ |
| **Move C** | $AC, BC, CD$ | $ABC, ACD, BCD$ | $AB, AD, BD$ | $ABD$ |
| **Move D** | $AD, BD, CD$ | $ABD, ACD, BCD$ | $AB, AC, BC$ | $ABC$ |

Each vertex transformation directly affects 75% of edges (3 of 4) and 75% of faces (3 of 4), while isolating 25% of edges and 25% of faces as invariant baselines.
