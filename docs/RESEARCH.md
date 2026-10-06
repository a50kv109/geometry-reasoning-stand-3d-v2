# Research Laboratory & Open Questions

## 1. Separation of Core and Research

The **Dynamic 3D Geometry Reasoning Stand** maintains an intentional architectural wall between **Established Core Mathematics** and **Research Candidates**:

```text
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│       ESTABLISHED CORE (FROZEN)      │       │     RESEARCH LABORATORY (OPEN)       │
│                                      │       │                                      │
│  • S²(O, R) Sphere manifold          │       │  • Realizability of the 81 Face      │
│  • General Inscribed Tetrahedron     │  ◄─── │    Center Classification Profiles    │
│  • 4V / 6E / 4F Persistent Topology  │ Gate  │  • Automated Theorem Discovery       │
│  • Scale-Aware Tolerances (Pkg 06)   │       │  • Exact Rational Geometric Predicates│
│  • FNV-1a Deterministic Signature    │       │  • Symbolic Proof-Tree Generation    │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
```

No conjecture or experimental algorithm may enter the Engineering Core without passing formal mathematical validation and candidate promotion gates.

---

## 2. Implemented Mathematics (Established)

The following mathematical properties are fully implemented and verified in the codebase:
- **Euclidean Chord Distance:** $L_{ij} = \|V_j - V_i\|_2 \in [0, 2R]$.
- **Triangle Face Area & Normal:** $S_F = \frac{1}{2}\|(Q - P) \times (S - P)\|$, unit normal $\vec{n}_F$ with degeneracy guard.
- **Signed Volume:** $V_s = \frac{1}{6} [(B - A) \cdot ((C - A) \times (D - A))]$.
- **Regularity Invariant:** Analytical equivalence to regular tetrahedron when $(L_{\max} - L_{\min})/R \le 10^{-4}$.
- **Dual Representation Bijection:** Spherical $\leftrightarrow$ Cartesian transformation with pole singularity canonicalization.
- **Coordinate Curve Parametrization:** Latitude parallel circles and longitude meridian half-great-circles on $S^2(O, R)$.

---

## 3. Active Research Candidates

### Research Candidate R1: The 81 Face-Center Profile Realizability Problem
- **Context:** Package 03 defines four possible spatial relations between the origin $O(0,0,0)$ and a triangular face plane:
  1. `CENTER_IN_FACE`
  2. `CENTER_IN_FACE_PLANE_OUTSIDE`
  3. `CENTER_OUTSIDE_FACE_PLANE`
  4. `CENTER_TO_FACE_UNDEFINED` (degenerate face)
- **The Problem:** Across the 4 faces of an inscribed tetrahedron, there are $3^4 = 81$ non-degenerate profile combinations $(C_{ABC}, C_{ABD}, C_{ACD}, C_{BCD})$.
- **Research Question:** Which subset of these 81 combinations is physically realizable by an inscribed tetrahedron on $S^2(O, R)$?
- **Status:** **RESEARCH / OPEN MATHEMATICAL CONJECTURE**. Not implemented in the core engine.

### Research Candidate R2: Circumcenter Projection Relation
- **Identity:** For any face $F$, the orthogonal projection of sphere center $O$ onto the plane of $F$ coincides with the planar circumcenter of $\triangle F$, and circumradius $R_F = \sqrt{R^2 - d_F^2}$.
- **Status:** **MATHEMATICALLY PROVED — CORE IMPLEMENTATION DEFERRED**. Documented as a theorem; awaiting implementation in Milestone M4.

### Research Candidate R3: Exact Rational Arithmetic Engine
- **Concept:** Utilizing arbitrary-precision rational coordinates ($\mathbb{Q}$) and algebraic numbers to evaluate sign of volume without floating-point rounding errors.
- **Status:** **RESEARCH CANDIDATE**. Current implementation uses IEEE 754 double precision with Package 06 scale-aware tolerances.

---

## 4. Candidate Promotion Lifecycle

To graduate from the Research Laboratory into the Core Engine, a candidate must complete:
1. **Mathematical Proof:** Rigorous proof of the invariant or classification.
2. **Deterministic Test Suite:** Headless property-based fuzz tests across $10^6$ pseudo-random configurations.
3. **Scale-Invariance Audit:** Demonstration that the property holds across $R \in [10^{-6}, 10^6]$.
4. **Zero-Side-Effect Review:** Verification that no mutable dependencies or performance degradations are introduced to the Core.
