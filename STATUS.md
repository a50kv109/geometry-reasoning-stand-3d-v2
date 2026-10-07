# 3D Geometry Reasoning Stand — Project Status

**Current Operational Status:** EXPERIMENTALLY STABLE / RESEARCH READY  
**Authoritative Object:** General Tetrahedron Inscribed in $S^2(O, R)$  
**Milestones Implemented & Verified:** M1, M1.5, M1.6, M1.7, M1.8 (Dynamic Reasoning & LSM Inspector), PAT-27 (Scale Dependency), Agent Readiness Boundary  
**Test Verification:** 10 suites, 105 tests passing, 0 failures (`npm run test:all`)

---

## Architectural Statements

1. **SSOT Principle:**
   The Cartesian coordinates of vertices $A, B, C, D \in \mathbb{R}^3$ constrained to $\|\mathbf{v}\| = R$ and sphere center $O \in \mathbb{R}^3$ constitute the sole mutable source of truth.

2. **Representation & Dynamic Layers:**
   Spherical coordinates $(\phi, \lambda)$, edge lengths, face areas, volume, orientation, signatures, LVG, DLVM, GDS, and Temporal traces are strictly derived read-only representations. Zero reverse-write to Canonical State.

3. **Agent Boundary:**
   *"Agent may be wrong. Stand must not."*
   External AI agents submit claims as hypotheses; the Stand evaluates ground truth against canonical state.

4. **PAT-27 Scale Invariance:**
   Scaling laws $L \propto R$, $A \propto R^2$, $V \propto R^3$, $\theta \propto R^0$ are mathematically enforced and verified.

---

## Verified Modules & Components

### 1. Authoritative Core (`src/core/`)
- `types.ts`: Canonical geometric types, 4V/6E/4F topology identifiers, and epistemic enums.
- `geometryState.ts`: State instantiation, Euclidean distances, surface invariants.
- `topology.ts`: Fixed combinatorial adjacency tables and label permutation symmetry.
- `metrics.ts`: Deterministic chord lengths, planar face areas, normals, and signed volume $V_s$.
- `representation.ts`: Spherical latitude/longitude $(\phi, \lambda) \leftrightarrow (x, y, z)$ bijection with pole canonicalization.
- `signature.ts`: Metadata-free 32-bit FNV-1a hash of normalized canonical geometry.
- `tolerances.ts`: Centralized scale-aware tolerance model ($L_{\text{scale}} = R$) implementing Package 06.

### 2. Dynamic Reasoning & Temporal Core (`src/core/`)
- `lvg.ts`: Local Vertex Geometry, Gram matrices, planar/dihedral angles, solid angle $\Omega(v)$ via Oosterom-Strackee, and $D_0$–$D_5$ degeneracy classification.
- `dlvm.ts`: Directed Local Vertex Manifolds and shared-edge anti-parallelism verification $\mathbf{u}_{AB}^{(A)} = -\mathbf{u}_{BA}^{(B)}$.
- `gds.ts`: Geometric Diagnostic Snapshots aggregating metrics, 4×DLVM, and epistemic state with zero mutations.
- `geometryTemporal.ts`: Strict monotonic temporal transitions ($t_1 > t_0$), differential measurements, and sequence quality tracking (`PRISTINE`, `DEGRADED`, `CORRUPTED`).

### 3. Epistemic & Agent Reasoner (`src/core/`)
- `epistemic.ts`: Epistemic status types, hypothesis tagging, and evidence provenance.
- `agentInterface.ts`: Headless claim evaluation engine (`VERIFY_RESULT`, `VERIFY_STEP`).
- `derivedSemantics.ts`: Derived semantic impact models and incident branch isolation.

### 4. Interactive Human Visual Workbench (`src/components/`, `src/visualization/`)
- `renderer3d.ts`: Canvas 3D rendering pipeline with depth sorting, coordinate guides, and vertex color badges.
- `GeometryViewport.tsx`: Two-column primary 3D canvas viewport, direct vertex dragging, orbit camera, and floating canvas HUD trigger `[ 🌐 Глобус углов {id} ]`.
- `LsmInspector.tsx`: Dual-mode «Глобус локальной угловой геометрии» (архитектурно: LSM / LVG Inspector) implementing the Physical Globe on Stand model ($220 \times 200$ px interactive canvas, rigid model rotation via pointer drag, Yaw and Pitch sliders, quick presets, solid angle $\Omega(v)$, Gram determinant $\det(G)$, planar angles, and strict separation between constant geometry state and observer view orientation).
- `VertexControlPanel.tsx`: Sidebar active vertex selection, coordinate controls, and embedded угловой глобус (open by default, collapsible via `[ 🌐 Глобус углов {id} ]`).
- `MeasurementPanel.tsx`: Live chord lengths, face areas, signed volume, and orientation classification.
- `LearningPanel.tsx`: Educational reasoning narrative explaining causal dependencies and invariant subgraphs.
- `AgentTestPanel.tsx`: Interactive agent claim verification testing tool.
- `DebugPanel.tsx`: Raw canonical state inspection, scaled tolerance breakdown, and geometry signatures.

