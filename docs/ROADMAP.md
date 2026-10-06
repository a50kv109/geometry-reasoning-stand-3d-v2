# Project Milestone Roadmap (M0 – M10)

The **Dynamic 3D Geometry Reasoning Stand** follows an incremental, verified milestone architecture.

---

## Roadmap Status Overview

| Milestone | Title | Architectural Scope | Status | Verification Evidence |
| :---: | :--- | :--- | :---: | :--- |
| **M0** | System Initialization & Ingestion | Ingestion of Packages 01–06, inventory, contract alignment | **COMPLETED** | `FINAL_PACKAGE_INVENTORY.md`, `FINAL_INTEGRATION_MATRIX.md` |
| **M1** | Canonical 3D Geometry State | Sphere $S^2(O, R)$, 4V/6E/4F topology, Cartesian core, Package 06 tolerances, FNV-1a signature | **COMPLETED** | 17 Tests passing (`m1_canonical_state.test.ts`) |
| **M1.5** | Human Visual Workbench | Interactive 3D canvas viewport, direct vertex dragging, orbit camera, causal highlighting | **COMPLETED** | 10 Tests passing (`m1_5_visual_client.test.ts`) |
| **M1.6** | Workspace Layout Reconstruction | Two-column workstation layout (~65% / ~35%), 7-section structured information flow | **COMPLETED** | 7 Tests passing (`m1_6_workspace_layout.test.ts`) |
| **M1.7** | Geometric Scale & Coordinate Guides | Visual scale controls (Fit, 100%, 75%, 50%), per-vertex latitude parallels & longitude meridians on $S^2$ | **COMPLETED** | 16 Tests passing (`m1_7_scale_and_guides.test.ts`) |
| **M2** | Combinatorial Topology Deepening | Generalized simplicial complex structures, multi-tetrahedra graphs | **PLANNED** | Scheduled post-first-release |
| **M3** | Deterministic Engine Refinement | Comprehensive face normal classifications, extended metric tensors | **CURRENT** | Core chord & area formulas live in `src/core/metrics.ts` |
| **M4** | Face Geometry & Center Classification | 4-state local face-center classification (`CENTER_IN_FACE`, etc.), 4-face profile vector | **PLANNED** | Mathematical contracts defined in Package 03 |
| **M5** | Dependency Graph & Semantic Impact Engine | Extended graph queries, formal impact diff trees, dependency export | **PARTIAL** | Incident topology graph live in `causalModel.ts` |
| **M6** | Temporal Trace & History Engine | Multi-step state scrubber, undo/redo history ring buffer, transition delta logs | **PLANNED** | State signature and snapshot schema defined |
| **M7** | Verification Engine & Epistemic Reasoner | Automated claim evaluator (`VERIFY_RESULT`, `VERIFY_STEP`, `CONSISTENCY_CHECK`) | **PARTIAL** | Validation and epistemic enums live in `src/core/types.ts` |
| **M8** | Public Agent Protocol Interface | Domain-pure JSON-RPC / REST API for external AI agent interaction | **PLANNED** | Protocol schemas specified in Package 05 |
| **M9** | Research Laboratory & Candidate Life-Cycle | Realizability explorer for the 81 face-center profile combinations | **RESEARCH** | Formulated in `docs/RESEARCH.md` |
| **M10** | Multi-Client Educational & Lab Workstation | Split Core / Lab / Edu views, interactive trace scrubber | **PLANNED** | Foundation laid by M1.5–M1.7 workbench |

---

## Detailed Status of Current Implementation

### Completed Capabilities (M1 – M1.7)
- **Immutable Canonical State:** Cartesian coordinates $O, R, A, B, C, D$ frozen against external side effects.
- **Surface Membership:** Strict verification $\|V_i - O\| = R$ with explicit rejection of out-of-bounds points (no silent projection).
- **Simplicial Topology:** Persistent labeled vertices $A, B, C, D$, 6 straight chords, 4 planar triangular faces.
- **Scale-Aware Tolerance Policy:** All tolerances derived from dimension scaling with characteristic length $L_{\text{scale}} = R$.
- **Realization Classification:** `VALID_POSITIVE` ($V_s > 0$), `VALID_NEGATIVE` ($V_s < 0$), `DEGENERATE` ($|V_s| \le \epsilon$).
- **Regularity Predicate:** Dimensionless invariant $(L_{\max} - L_{\min})/R \le 10^{-4}$.
- **Dual Representation:** Latitude/longitude controls $(\phi, \lambda)$ with pole singularity canonicalization.
- **Interactive 3D Viewport:** Perspective projection with depth sorting, direct vertex surface dragging, and orbit camera.
- **Ergonomic Two-Column Layout:** Edge-to-edge desktop utilization with independent sidebar scrolling.
- **Visual Scale Factor:** Fit, 100%, 75%, and 50% view scaling without mutating geometry.
- **Per-Vertex Coordinate Guides:** Real-time latitude parallels and longitude meridians rendered on $S^2$.
- **Automated Test Suite:** 50 deterministic headless tests passing in $< 50\text{ ms}$.

### Next Planned Milestones
- **M4 (Face Geometry & Center Classification):** Implementing the 4-state local face classification relative to origin $O(0,0,0)$.
- **M6 (Temporal Trace Scrubber):** Adding an interactive timeline to scrub backwards and forwards through user and agent transitions.
- **M8 (Public Network Protocol):** Exposing JSON-RPC endpoints for autonomous LLM agent benchmarking.
