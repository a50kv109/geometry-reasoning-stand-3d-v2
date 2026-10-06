# Future Research & Evolution Candidates (CANDIDATES ONLY)

*Important: The items listed below are theoretical research candidates and future development tracks. None of these are implemented in the M1 Core.*

---

### F1: Epistemic Layer Extensions
- Granular belief tagging and justification graphs for complex agent deduction steps.
- Proof tree serialization.

### F2: Temporal Snapshot & Delta History Replay
- Time-travel debugging for vertex trajectory logs.
- Continuous delta compression.

### F3: Reflex Layer & Direct Heuristics
- Fast-path cached heuristics for frequent agent spatial queries.

### F4: PGS-3D (Positional Geometric Solvers in 3D)
- Multi-constraint relaxation solver for spherical polylines and nets.

### F5: PAT-28 (Higher Order Multi-Object Geometric Relations)
- Multi-tetrahedron intersection testing.
- Dual polyhedra inscribed in concentric spheres.

### F6: Dihedral Angles & Solid Angle Contracts
- Explicit canonical contracts for dihedral angles between faces.
- Spherical excess calculation on $S^2$.

### F7: Separation of Intrinsic Regularity vs Inscription Relation
- **Architectural Caveat:** Currently, `computeRegularTetrahedronMetric` evaluates a regular tetrahedron specifically inscribed with circumradius $R$.
- Future enhancement: Formally separate intrinsic regularity predicate ($L_1 = L_2 = \dots = L_6$) from the circumscribed sphere relation ($L = \frac{4}{\sqrt{6}} R$).
