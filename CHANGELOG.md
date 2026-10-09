# Changelog

All notable changes to the **Dynamic 3D Geometry Reasoning Stand** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.2] - 2026-10-09 — Replication Manifest, Golden Benchmarks & Agent Gateway v0.1

### Summary
Comprehensive consolidation of the **Replication Manifest & Runbook** (`REPLICATION_MANIFEST.md`), **Golden Reference Benchmark Suite** (`src/tests/golden_reference_snapshot.test.ts`), and full Fedorov symmetry classification integration in **Agent Gateway v0.1** (State-Specific Symmetry Passport PSS-3D with full $T_d$ group evaluation, order 24, and explicit inversion non-invariance).

### Added
- **Authoritative Replication Manifest (`REPLICATION_MANIFEST.md`):**
  - Complete 6-point replication matrix (Source code, dependencies lockfiles `package-lock.json` and `bun.lock`, Vite/TypeScript/Tailwind build configs, 12 test suites, runbook, golden benchmarks).
  - Step-by-step verified execution runbook (`clone -> install -> test -> dev -> verify`).
  - Closed-form analytical ground truth constants for regular tetrahedron ($a = \frac{4}{\sqrt{6}}$, $S_F = \frac{2\sqrt{3}}{3}$, $V_s = \frac{8\sqrt{3}}{27}$, $\Omega = 3\arccos(1/3)-\pi$, $\det(G) = 0.5$, full group $T_d$ order 24, proper rotation subgroup $T$ order 12, zero central inversion).
- **Golden Reference Benchmark Suite (`src/tests/golden_reference_snapshot.test.ts`):**
  - 5 exhaustive analytical benchmarks verifying machine-epsilon accuracy across ground truth Euclidean invariants, Fedorov group classification, perturbation-induced symmetry breaking to $C_1$, scale invariance, and Agent Gateway programmatic oracle assertions.
- **Runnable Example Scripts:**
  - `examples/gatewayQuickstart.ts`: End-to-end headless demonstration of Agent Gateway v0.1 (`inspect_passport`, `inspect_symmetry_passport`, `verify_claim`, `perturb_geometry`, and ledger audit).
  - `examples/agentQuickstart.ts`: Stand Oracle claim verification demo.
  - `examples/dynamicSimulationExperiment.ts`: Numerical simulation, transition states, and scale experiments.
- **Agent Gateway v0.1 & Symmetry Passport (PSS-3D):**
  - State-specific `SymmetryPassport` strictly decoupled from `ObjectPassport` (PGO-3D), canonical state, claims, and evidence records.
  - Support for `inspect_symmetry_passport` command with `evaluateFullGroup: true` generating complete $T_d$ / $C_1$ point group classifications and inversion testing.
  - Preset 9 added to the interactive Agent Console in the human visual workbench.
- **Lockfile Synchronization:**
  - Added `package-lock.json` alongside `bun.lock` for 100% deterministic dependency trees in both npm and Bun environments.
  - Total automated verification expanded to 12 test suites and 124+ assertions (0 failures).

---

## [0.2.0] - 2026-10-07 — Dynamic Reasoning & LSM Inspector

### Summary
Major release introducing the **Dynamic Reasoning Layer** (Local Vertex Geometry, Directed Local Vertex Manifolds, Geometric Diagnostic Snapshots, and strictly monotonic Temporal Transition observation) alongside the interactive **Local Spherical Manifold (LSM) Inspector** supporting dual presence (docked in sidebar and floating on-canvas HUD).

### Added
- **Local Vertex Geometry (LVG — `src/core/lvg.ts`):**
  - Incident chord and unit direction rays $\mathbf{u}_{vj} \in S^2(v)$ projected onto the local unit sphere.
  - $3 \times 3$ Gram matrix and determinant $\det(G)$ quantifying trihedral cone volume.
  - Planar face angles $\alpha_{jk}$ and dihedral face angles $\theta_{jk}$.
  - Solid angle $\Omega(v)$ computed via the continuous Oosterom-Strackee spherical excess formula with two-argument arctangent.
  - Degeneracy classification $D_0$ through $D_5$ using centralized scale-aware tolerances.
- **Directed Local Vertex Manifolds (DLVM — `src/core/dlvm.ts`):**
  - Topologically indexed local vertex manifolds for vertices $A, B, C, D$.
  - Shared-edge anti-parallelism verification $\mathbf{u}_{v_1 v_2}^{(v_1)} = -\mathbf{u}_{v_2 v_1}^{(v_2)}$ across all 6 edge pairs within Package 06 tolerance $\varepsilon_{\text{finite}}(R)$.
- **Geometric Diagnostic Snapshots (GDS — `src/core/gds.ts`):**
  - Atomic, read-only diagnostic snapshots combining canonical signatures, global metrics, 4×DLVM, and epistemic statuses with zero reverse-write capability to Canonical State.
- **Geometry Temporal Observation & Trace Engine (`src/core/geometryTemporal.ts`):**
  - Strict monotonic temporal transition guard ($t_1 > t_0$); reverse or non-monotonic transitions flagged as `CORRUPTED`.
  - Differential measurement engine computing $\Delta V_s$, $\Delta S_{\text{total}}$, centroid displacement $\|\Delta G\|$, $\Delta L_{ij}$, and vertex displacements.
  - Sequence quality tracking (`PRISTINE`, `DEGRADED`, `CORRUPTED`).
- **Local Spherical Manifold (LSM) Inspector Component (`src/components/LsmInspector.tsx`):**
  - **Physical Globe on Stand Interaction Model:** Implemented authoritative invariant separation:
    $$\boxed{\text{Geometry State} = \text{CONSTANT}} \quad \iff \quad \boxed{\text{Observer View Orientation} = \text{MODEL ROTATION IN HANDS}}$$
  - Miniature globe rendered on a stand with base pedestal, vertical support column, semi-circular meridian mount, axis pins, and North (N) / South (S) poles.
  - Rigid coordinate grid rotating with the globe body: equator ($\phi = 0^\circ$), latitude parallels ($\pm 30^\circ$, $\pm 60^\circ$), and longitudinal meridians.
  - Three incident unit vectors $\mathbf{u}_{vj}$ pinned to the rotating globe surface with connecting geodesic spherical triangle arcs.
  - Multi-modal view orientation controls: direct pointer grab & drag on globe (`↻ ГЛОБУС ↺`), Azimuth (Yaw) slider ($-180^\circ \dots +180^\circ$), Pitch slider ($-85^\circ \dots +85^\circ$), quick presets («Спереди», «Полюс N», «Изо»), and orientation reset `↺`.
  - Dual presence architecture: embedded in Section 2 of `VertexControlPanel.tsx` (open by default, collapsible via `[ 🌐 Глобус углов {id} ]`) with header «Глобус локальной угловой геометрии — вершина {id}» and floating collapsible HUD directly on the 3D canvas in `GeometryViewport.tsx` via `[ 🌐 Глобус углов {id} ]`.
  - High-DPI $220 \times 200$ pixel canvas with 3D ambient radial lighting, front-hemisphere highlight, and translucent rear paths.
  - Unit vector rays with color-coded badges, labels, chord lengths $|e|$, solid angle $\Omega(v)$ via Oosterom-Strackee, and Gram determinant $\det(G)$.
  - Real-time $60\text{ fps}$ updates synchronized with active vertex drag on the primary 3D viewport.
- **Automated Verification:**
  - Added `src/tests/lvg_dlvm_gds_temporal.test.ts` with 10 comprehensive contracts.
  - Automated test suite expanded to 10 test suites and 105 tests, 100% passing.

---

## [0.1.0] - 2026-09-13 — First Public Version

### Summary
Initial public release of the **Dynamic 3D Geometry Reasoning Stand**, a deterministic mathematical instrument and human visual workbench for 3D geometric reasoning, temporal observation, and verification.

### Added
- **Canonical Mathematical Core (Milestone M1):**
  - Immutable `CanonicalGeometryState` defining sphere $S^2(O, R)$ and persistent vertices $A, B, C, D \in \mathbb{R}^3$.
  - Fixed 4V / 6E / 4F persistent combinatorial topology.
  - Scale-aware numerical tolerance engine resolving parameters dimensionally from $L_{\text{scale}} = R$ (Package 06).
  - Signed volume computation $V_s = \frac{1}{6} [(B - A) \cdot ((C - A) \times (D - A))]$.
  - Epistemic taxonomy: `InputGeometryStatus` and `RealizationStatus` (`VALID_POSITIVE`, `VALID_NEGATIVE`, `DEGENERATE`, `VERTEX_COINCIDENT`).
  - Strict anti-silent-projection guard rejecting coordinates off the sphere.
  - Metadata-free FNV-1a 32-bit `geometrySignature`.
  - Dual representation converter (Spherical $\leftrightarrow$ Cartesian) with pole singularity canonicalization ($\lambda = 0$ at $\phi = \pm 90^\circ$).
- **Human Visual Workbench (Milestone M1.5):**
  - Interactive 3D Canvas perspective viewport with depth sorting.
  - Rendered $S^2$ sphere with rim curvature, straight chord edges, and planar shaded faces.
  - Persistent, color-coded vertex badges attached to vertices $A, B, C, D$.
  - Equal manipulation semantics for all vertices via direct mouse drag and spherical sliders.
  - Orbit camera (azimuth, elevation, distance) decoupled from geometry state.
  - Real-time causal dependency highlighting (incident vs invariant branches).
  - Full Russian mathematical terminology in the educational interface.
- **Workspace Layout Reconstruction (Milestone M1.6):**
  - Ergonomic two-column workstation layout: persistent ~65% 3D viewport and independently scrollable ~35% reasoning sidebar.
  - Full utilization of desktop screen width; eliminated document-level window scrolling.
  - 7-section structured information flow:
    1. Active Vertex Selection
    2. Coordinate Controls (Lat/Lon & Cartesian)
    3. Geometric Measurements
    4. Geometric State & Orientation
    5. Causal Dependencies
    6. Educational Learning Narrative
    7. Engineering Diagnostics Accordion
  - Bi-directional selection synchronization between canvas and controls.
- **Scale Control & Coordinate Guides (Milestone M1.7):**
  - Geometric visual scale controls (`Fit`, `100%`, `75%`, `50%`) to relieve viewport crowding without altering canonical coordinates.
  - Per-vertex latitude parallel circles and longitude meridian half-great-circles rendered directly on $S^2(O, R)$.
  - Depth-aware curve rendering (solid glow for front hemisphere, dashed for occluded hemisphere).
  - Floating on-canvas coordinate badge (`P: φ = -19.5°, λ = 0.0°`).
  - Active-only vs. all-vertex coordinate guide display toggles.
- **Automated Verification Suite:**
  - 50 automated deterministic unit tests across four test suites (`m1_canonical_state.test.ts`, `m1_5_visual_client.test.ts`, `m1_6_workspace_layout.test.ts`, `m1_7_scale_and_guides.test.ts`).
  - 100% pass rate.
- **Architectural Documentation:**
  - Comprehensive documentation suite in `docs/` and archival packages in `docs/architecture-packages/`.
