# 3D Geometry Reasoning Stand — Project Status

**Current Operational Status:** EXPERIMENTALLY STABLE / RESEARCH READY  
**Authoritative Object:** General Tetrahedron Inscribed in $S^2(O, R)$  
**Milestones Implemented & Verified:** M1, M1.5, M1.6, M1.7, PAT-27 (Scale Dependency), Agent Readiness Boundary  

---

## Architectural Statements

1. **SSOT Principle:**
   The Cartesian coordinates of vertices $A, B, C, D \in \mathbb{R}^3$ constrained to $\|\mathbf{v}\| = R$ and sphere center $O \in \mathbb{R}^3$ constitute the sole mutable source of truth.

2. **Representation Layer:**
   Spherical coordinates $(\phi, \lambda)$, edge lengths, face areas, volume, orientation, and signatures are strictly derived representations.

3. **Agent Boundary:**
   *"Agent may be wrong. Stand must not."*
   External AI agents submit claims as hypotheses; the Stand evaluates ground truth against canonical state.

4. **PAT-27 Scale Invariance:**
   Scaling laws $L \propto R$, $A \propto R^2$, $V \propto R^3$, $\theta \propto R^0$ are mathematically enforced and verified.
