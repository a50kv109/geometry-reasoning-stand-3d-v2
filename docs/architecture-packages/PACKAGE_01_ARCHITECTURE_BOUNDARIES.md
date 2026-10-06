# Package 01: Architecture, Boundaries & 2D Crosswalk
**Type:** Architectural Transfer Specification & Protocol Contract  
**Status:** Ingested & Frozen  
**Core Principle:** ONE GEOMETRY, ONE DETERMINISTIC MATHEMATICAL CORE, MANY CLIENTS

---

## 1. System Mission & Core Principle

The **Dynamic 3D Geometry Reasoning Stand** is a deterministic mathematical instrument designed to observe, verify, and reason about geometric transformations in three dimensions.

The system enforces one strict foundational rule:
> **The Agent May Be Wrong. The Stand Must Not.**

Any AI agent interacting with this stand is treated as an untrusted external reasoner. The deterministic geometry stand is the authoritative source of truth.

---

## 2. Three Architectural Operating Modes

1. **Engineering / Verification Core (Authoritative)**
   - Single source of mathematical truth.
   - Deterministic recomputation and strict numerical validation.
   - Zero UI, zero rendering code, zero physics simulation.
2. **Research / Laboratory (Isolated)**
   - Isolated exploratory environment for unproven hypotheses.
   - Candidate promotion lifecycle; unvalidated conjectures are strictly barred from the Core.
3. **Minimal Educational View (Human Visual Workbench)**
   - Interactive, reactive client displaying geometry, causality, and mathematical explanation.
   - Passive consumer of canonical state; cannot mutate mathematical truth directly.

---

## 3. Three-Layer State Separation

| State Layer | Content & Ownership | Mutation Rules |
| :--- | :--- | :--- |
| **Geometry State** | Canonical Cartesian coordinates: Center $O$, radius $R$, vertices $A, B, C, D \in \mathbb{R}^3$. | Mutable strictly through valid geometric transformations. |
| **Representation State** | Dual spherical coordinates $(\phi, \lambda)$, coordinate curves, reference axes. | Derived on-demand. Never mutates geometry. |
| **Visualization State** | Camera orbit (azimuth, elevation, distance), viewport size, visual scale factor, highlight selections. | Local to client viewport. Zero mathematical side effects. |

---

## 4. 2D $\to$ 3D Architectural Crosswalk

- **REUSE:** Snapshot contracts, Temporal Trace log structures, Verification boundary logic, Epistemic status labeling rules.
- **ADAPT:** Deterministic engine pattern, Dependency graph isolation, Consistency engine.
- **REDESIGN:** State coordinates ($S^1 \to S^2$), Metrics (Triangle area $\to$ Signed volume $V_s$ + 4 Face planar areas).
- **NO ANALOGUE:** 2D arc lengths, 2D inscribed angle theorem rules, 2D circle-center placement rules.

---

## 5. Frozen Architectural Contracts

- Camera transformations and viewport UI selections must never mutate Geometry State or Representation State.
- Reference repositories are design references, not runtime dependencies.
- Dependency Graph $\neq$ Mandatory Incremental Computation. Full deterministic recomputation is the primary baseline oracle.
- No physics, mass, velocity, springs, or elasticity.
