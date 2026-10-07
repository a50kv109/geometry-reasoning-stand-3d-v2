# Dynamic 3D Geometry Reasoning Stand — Documentation Index

Welcome to the documentation for the **Dynamic 3D Geometry Reasoning Stand**, a deterministic mathematical instrument and human visual workbench for 3D geometric reasoning, temporal observation, and verification.

---

## 1. Documentation Map

### Getting Started & Overview
* **[Main README](../README.md)**: High-level overview, visual concept, capabilities, and quick start.
* **[Changelog](../CHANGELOG.md)**: Historical release notes and milestone deliveries.

### System Architecture & State Model
* **[System Architecture](ARCHITECTURE.md)**: Comprehensive architectural specification, three-layer state model (Geometry, Representation, Visualization), and pipeline data flow.
* **[Geometric Model](GEOMETRIC_MODEL.md)**: Mathematical formulation of sphere $S^2(O, R)$, general inscribed tetrahedron, metrics (chords, areas, signed volume, centroid), orientation, and the regularity invariant.

### Human Interaction & Reasoning
* **[User Interaction & Visual Workbench](INTERACTION.md)**: Viewport controls, visual scale factor, direct on-sphere raycasting, per-vertex coordinate guides, and the 7-section information flow.
* **[Local Spherical Manifold (LSM) & LVG Inspector](LSM_INSPECTOR.md)**: Intrinsic local vertex geometry, unit sphere $S^2(v)$ projection, Gram matrices, solid angle $\Omega(v)$ via Oosterom-Strackee, dual embedded/floating HUD presentation.
* **[Reasoning Model & Causal Dependencies](REASONING_MODEL.md)**: Causal propagation graphs, incident vs invariant topological branches, and the definition of the baseline recomputation oracle.

### Dynamic Reasoning & Research
* **[Dynamic Reasoning Architecture](research/DYNAMIC_REASONING_ARCHITECTURE.md)**: Functional pipeline flow from Canonical State through LVG, DLVM, GDS, and Temporal Engine.
* **[LVG Specification](research/LVG_001.md)**: Local Vertex Geometry, Gram matrices, planar & dihedral angles, solid angle invariants.
* **[DLVM Specification](research/DLVM_001.md)**: Directed Local Vertex Manifold, shared-edge anti-parallelism $u_{AB} = -u_{BA}$.
* **[GDS & Temporal Specification](research/GDS_AND_TEMPORAL.md)**: Geometric Diagnostic Snapshots and strictly monotonic temporal observation.

### Verification, Research & Roadmap
* **[Verification Architecture & Protocol](VERIFICATION.md)**: Verification boundary, epistemic status taxonomies, provenance tracking, anti-circular safeguards, and the 10 automated test suites (105 tests).
* **[Research Laboratory & Open Questions](RESEARCH.md)**: Separation of Core and Laboratory, active research candidates (including the 81 face-center profile realizability problem), and candidate promotion rules.
* **[Development & Contribution Guide](DEVELOPMENT.md)**: Prerequisites, build scripts, development server, testing commands, and coding guidelines.
* **[Project Milestone Roadmap](ROADMAP.md)**: Progress tracking across Milestones M0 through M10.

---

## 2. Architectural Transfer Packages

The architecture of this project was developed through a series of six sequential architectural transfer packages. 

Because of the conversational and iterative engineering methodology used during its inception, some packages originated as standalone formal specifications, while others were formulated as comprehensive architectural transfer prompts accompanied by formal protocol requirements.

All six packages have been harmonized, ingested, and archived in the repository:

| Package | Title | Primary Architectural Focus | Archive File |
| :---: | :--- | :--- | :--- |
| **Package 01** | Architecture, Boundaries & 2D Crosswalk | Foundational principle: *The Agent May Be Wrong. The Stand Must Not.* 3-layer state model, 2D $\to$ 3D crosswalk. | [PACKAGE_01](architecture-packages/PACKAGE_01_ARCHITECTURE_BOUNDARIES.md) |
| **Package 02** | Geometric Contract & Representation | Fixed global Cartesian reference frame, sphere $S^2(O,R)$, persistent 4V/6E/4F topology, dual spherical coordinates. | [PACKAGE_02](architecture-packages/PACKAGE_02_GEOMETRIC_CONTRACT_AND_REPRESENTATION.md) |
| **Package 03** | Deterministic Engine & Classification | Straight Euclidean chords, planar face areas, signed volume $V_s$, centroid, regularity predicate, face profiles. | [PACKAGE_03](architecture-packages/PACKAGE_03_DETERMINISTIC_ENGINE_AND_CLASSIFICATION.md) |
| **Package 04** | Dependency Propagation & Temporal Model | Causal neighborhoods, permutation symmetry, geometry snapshots, metadata-free FNV-1a signature, recomputation oracle. | [PACKAGE_04](architecture-packages/PACKAGE_04_DEPENDENCY_PROPAGATION_AND_TEMPORAL_MODEL.md) |
| **Package 05** | Verification, Research & Agent Interface | Untrusted agent trust model, public domain protocol (`VERIFY_RESULT`, `VERIFY_STEP`, `CONSISTENCY_CHECK`), 4 status enums, provenance. | [PACKAGE_05](architecture-packages/PACKAGE_05_VERIFICATION_RESEARCH_AND_AGENT_INTERFACE.md) |
| **Package 06** | Validity, Tolerance & Robustness | Central scale-aware tolerance policy ($L_{\text{scale}} = R$, dimensions $\mathsf{L}^1, \mathsf{L}^2, \mathsf{L}^3, \mathsf{L}^0$), anti-silent-projection. | [PACKAGE_06](architecture-packages/PACKAGE_06_VALIDITY_TOLERANCE_AND_NUMERICAL_ROBUSTNESS.md) |

For details on the cross-package dependency graph and harmonization analysis, see:
* `FINAL_PACKAGE_INVENTORY.md`
* `FINAL_INTEGRATION_MATRIX.md`
