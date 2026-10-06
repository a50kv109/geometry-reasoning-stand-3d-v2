# Changelog

All notable changes to the **Dynamic 3D Geometry Reasoning Stand** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
