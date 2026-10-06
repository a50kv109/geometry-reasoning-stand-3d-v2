# Dynamic 3D Geometry Reasoning Stand

A human visual workbench and deterministic geometric reasoning stand for exploring, observing, and verifying a dynamic general tetrahedron inscribed in a sphere.

---

## 1. Project Overview

The **Dynamic 3D Geometry Reasoning Stand** is a mathematical instrument and interactive workstation built to explore the behavior of three-dimensional geometric structures under continuous deformation. It anchors four persistent labeled vertices ($A, B, C, D$) to the surface of a fixed Euclidean sphere $S^2(O, R)$, forming a dynamic inscribed tetrahedron. As any vertex moves across the spherical manifold, the stand deterministically derives all incident Euclidean chords, triangular face metrics, signed volume, and orientation in real time, while visually exposing the causal dependency tree and invariant subgraphs.

---

## 2. Visual Concept & Causal Chain

The core geometry is modeled as a deterministic feed-forward pipeline:

```text
               Fixed Sphere S²(O, R)
                         │
                         ▼
             Persistent Vertices (A, B, C, D)
                         │
                         ▼
               6 Euclidean Edges (Chords)
                         │
                         ▼
              4 Planar Triangular Faces
                         │
                         ▼
        Signed Volume V_s / Surface Area / Centroid G
                         │
                         ▼
        Causal Dependencies / Diagnostics / Verification
```

### Causal Neighborhood Propagation
When a user or agent modifies a single vertex, the stand isolates the affected incident geometry from the invariant subgraph:

```text
                  Move Vertex D
                        │
                        ▼
            Incident Edges: AD, BD, CD
                        │
                        ▼
           Incident Faces: ABD, ACD, BCD
                        │
                        ▼
         Derived Geometry: V_s, S_total, Centroid G
                        │
                        ▼
       Global Measurements & Causal Narrative

       [ Invariant Baseline: Edge BC, Face ABC ]
```

---

## 3. Core Architectural Principles

```text
   ONE GEOMETRY  │  ONE CANONICAL GEOMETRY STATE  │  MANY CLIENTS
```

The system strictly decouples its conceptual layers:

- **Geometry Layer (Authoritative Core):** Immutable Cartesian coordinates $O, R, A, B, C, D \in \mathbb{R}^3$, 4V/6E/4F combinatorial topology, and full deterministic recomputation.
- **Representation Layer:** Isomorphic spherical coordinates $(\phi, \lambda)$, latitude parallels, and longitude meridians, derived on-demand without mutating Cartesian truth.
- **Visualization Layer (Human Visual Workbench):** Perspective 3D canvas viewport, orbit camera, depth-sorted polygon shading, and visual scale controls.
- **Temporal Observation Layer:** Discrete snapshots, transition deltas, and metadata-free deterministic geometry signatures.
- **Verification Layer:** First-principles validation evaluating untrusted assertions against the baseline engine oracle.
- **Research Layer:** Quarantined laboratory for open mathematical questions and unvalidated conjectures.

---

## 4. Key Capabilities

- **Interactive 3D Manifold Manipulation:** Directly click and drag any vertex ($A, B, C, D$) across the sphere surface with real-time 3D raycasting.
- **Dual Representation System:** Seamless synchronization between Cartesian coordinates $(x, y, z)$ and spherical latitude/longitude $(\phi, \lambda)$.
- **Per-Vertex Coordinate Guides:** Interactive latitude parallel circles and longitude meridian half-great-circles rendered on $S^2(O, R)$ with depth-aware occlusion.
- **Visual Scale Control:** Quick switching between `Fit`, `100%`, `75%`, and `50%` viewport scale to relieve visual crowding without modifying geometry coordinates.
- **Orientation & Degeneracy Detection:** Real-time classification of positive right-handed volume (`VALID_POSITIVE`), valid negative left-handed volume (`VALID_NEGATIVE`), and coplanar degeneracy (`DEGENERATE`).
- **Scale-Normalized Regularity Detection:** Dimensionless regularity invariant $\frac{L_{\max} - L_{\min}}{R} \le 10^{-4}$ guaranteeing scale invariance across all radii $R$.
- **Two-Column Workstation Ergonomics:** Edge-to-edge desktop workspace pairing a persistent 3D viewport (~65%) with an independently scrollable 7-section reasoning sidebar (~35%).
- **Engineering Diagnostics Accordion:** Inspection of raw canonical coordinates, live dimension-scaled tolerances, and the deterministic 32-bit FNV-1a `geometrySignature`.

---

## 5. Mathematical Model Summary

- **World Sphere:** $S^2(O, R) = \{ P \in \mathbb{R}^3 \mid \|P - O\|_2 = R \}$, centered at $O(0, 0, 0)$ with radius $R > 0$.
- **Base Object:** General Inscribed Tetrahedron. The regular tetrahedron is strictly a derived special state where all 6 edges are equal within tolerance ($L \approx R\sqrt{8/3}$).
- **Edges:** Straight line chords cutting through the interior of the sphere ($L_{ij} \in [0, 2R]$).
- **Faces:** Planar Euclidean triangles in $\mathbb{R}^3$ ($S_F = \frac{1}{2}\|(Q-P)\times(S-P)\|$).
- **Signed Volume:**
  $$V_s = \frac{1}{6} \left[ (B - A) \cdot ((C - A) \times (D - A)) \right]$$
- **Scale-Aware Tolerances:** All tolerances scale with characteristic length $L_{\text{scale}} = R$:
  - Lengths ($\mathsf{L}^1$): $\epsilon_{\text{sphere}} = 10^{-6} R$, $\epsilon_{\text{coincident}} = 10^{-6} R$, $\epsilon_{\text{plane}} = 10^{-6} R$
  - Areas ($\mathsf{L}^2$): $\epsilon_{\text{face}} = 10^{-6} R^2$
  - Volumes ($\mathsf{L}^3$): $\epsilon_{\text{volume}} = 10^{-7} R^3$
  - Dimensionless ($\mathsf{L}^0$): $\text{EPS\_REGULARITY} = 10^{-4}$, $\text{EPS\_ANGLE} = 10^{-6} \text{ rad}$

---

## 6. Verification Philosophy

> **The Agent May Be Wrong. The Stand Must Not.**

External AI agents, theorem provers, or user interfaces are treated as untrusted reasoners. The stand never accepts claims at face value, never mutates canonical state to satisfy external expectations, and never performs silent projections to snap invalid input to the sphere.

### Epistemic Status Taxonomies
The stand strictly separates four orthogonal status domains:
1. **`VerificationStatus`**: `VALID`, `INVALID`, `UNKNOWN`, `MISSING_INPUT`, `PRECONDITION_FAILED`
2. **`InputGeometryStatus`**: `VALID_INPUT`, `INVALID_INPUT`, `OUTSIDE_SPHERE`, `NON_FINITE_INPUT`
3. **`RealizationStatus`**: `VALID_POSITIVE`, `VALID_NEGATIVE`, `DEGENERATE`, `VERTEX_COINCIDENT`
4. **`ConsistencyStatus`**: `CONSISTENT`, `INCONSISTENT`, `UNDERDETERMINED`

---

## 7. Current Implementation Status

| Functional Area | Milestone | Implementation Status | Verification Evidence |
| :--- | :---: | :---: | :--- |
| **Canonical 3D Geometry Core** | M1 | **IMPLEMENTED** | 17 automated tests (`m1_canonical_state.test.ts`) |
| **Sphere Membership & Anti-Silent-Projection** | M1 | **IMPLEMENTED** | Explicit `OUTSIDE_SPHERE` rejection verified (T06) |
| **Persistent 4V / 6E / 4F Topology** | M1 | **IMPLEMENTED** | Fixed identities verified across mutations (T09–T12) |
| **Scale-Aware Tolerance Policy (Pkg 06)** | M1 | **IMPLEMENTED** | Centralized table scaling with $R, R^2, R^3$ (T07) |
| **Dual Coordinate Representation** | M1, M1.5 | **IMPLEMENTED** | Full $(\phi, \lambda) \leftrightarrow (x, y, z)$ bijection |
| **Interactive 3D Viewport & Orbit Camera** | M1.5 | **IMPLEMENTED** | Depth-sorted canvas projection, direct dragging |
| **Two-Column Workstation Layout** | M1.6 | **IMPLEMENTED** | 7 automated tests (`m1_6_workspace_layout.test.ts`) |
| **Visual Scale Control (Fit, 100%, 75%, 50%)** | M1.7 | **IMPLEMENTED** | Viewport scale decoupled from geometry (T01–T03) |
| **Per-Vertex Coordinate Guides** | M1.7 | **IMPLEMENTED** | 16 automated tests (`m1_7_scale_and_guides.test.ts`) |
| **Incident Dependency Highlighting** | M1.5, M1.6 | **IMPLEMENTED** | Active, affected, and invariant subgraph split |
| **Full Recomputation Baseline Oracle** | M1, M3 | **IMPLEMENTED** | Ground-truth mathematical evaluator |
| **Face Center Classification (4-State)** | M4 | **PLANNED** | Defined in Package 03; basic normals live |
| **Temporal Model & Scrubber** | M6 | **PLANNED** | Signatures implemented; timeline scrubber in M6 |
| **Public Agent API (`VERIFY_RESULT`)** | M7, M8 | **PARTIAL** | Engine validation live; network API in M8 |
| **Research Laboratory (81 Face Profiles)** | M9 | **RESEARCH** | Formulated in `docs/RESEARCH.md` |

---

## 8. Known Limitations

1. **Local Face-Center Classifications (M4):** The local 4-state classification of the origin $O$ relative to the 4 triangular face planes is mathematically specified but not yet integrated into the live sidebar UI.
2. **Temporal History Timeline (M6):** Snapshots and signatures are calculated on every transition, but the interactive multi-step scrubber UI is scheduled for Milestone M6.
3. **External Network API (M8):** The verification operations (`VERIFY_RESULT`, `VERIFY_STEP`) are executed internally by the engine, but a public REST/JSON-RPC server endpoint for headless external agents is not yet bound to an external port.

---

## 9. Quick Start & Development

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### Installation & Execution
```bash
# Clone the repository
git clone https://github.com/your-org/dynamic-3d-geometry-reasoning-stand.git
cd dynamic-3d-geometry-reasoning-stand

# Install dependencies
npm install

# Start the local development server (port 3000)
npm run dev

# Build production bundle
npm run build

# Run type check and linter
npm run lint
```

### Running Automated Tests
```bash
# Run all deterministic test suites (50 tests)
npm run test:all

# Or run individual milestone suites:
npm run test:m1       # M1 Canonical Core suite (17 tests)
npm run test:client   # M1.5 Visual Client suite (10 tests)
npm run test:layout   # M1.6 Layout & Ergonomics suite (7 tests)
npx tsx src/tests/m1_7_scale_and_guides.test.ts # M1.7 Scale & Guides suite (16 tests)
```

---

## 10. Repository & Documentation Map

```text
├── docs/
│   ├── architecture-packages/           # Archival records of Transfer Packages 01–06
│   ├── README.md                        # Complete Documentation Index
│   ├── ARCHITECTURE.md                  # System overview, 3-layer state, data flow
│   ├── GEOMETRIC_MODEL.md               # S², tetrahedron, signed volume, regularity
│   ├── INTERACTION.md                   # 3D viewport, guides, scale, controls
│   ├── REASONING_MODEL.md               # Causal dependencies & baseline oracle
│   ├── VERIFICATION.md                  # Epistemic enums, provenance, tests
│   ├── RESEARCH.md                      # Open research candidates & promotion rules
│   ├── DEVELOPMENT.md                   # Development guide and coding standards
│   └── ROADMAP.md                       # Milestone progress (M0–M10)
├── src/
│   ├── core/                            # Authoritative Mathematical Core (Frozen)
│   ├── visualization/                   # 3D Canvas Rendering & Causal Projection
│   ├── components/                      # React Workstation Components
│   └── tests/                           # Deterministic Automated Test Suites
├── CHANGELOG.md                         # Version history & milestone logs
├── index.html                           # Synchronized HTML entry point
├── metadata.json                        # Application metadata
└── package.json                         # Build & test scripts
```

---

## 11. Research Boundary

The repository enforces a strict boundary between established mathematics and open research candidates:
- **Core Engine (Frozen):** Only fully verified, scale-invariant theorems and algorithms are permitted in `src/core/`.
- **Research Laboratory (Open):** Mathematical conjectures (such as the realizability of the 81 face-center profile combinations or automated theorem discovery) reside in `docs/RESEARCH.md` and cannot alter the core engine without passing rigorous formal gates.

---

## 12. License Information

> **Notice Regarding Project License:**  
> A formal open-source software license (e.g., MIT, Apache 2.0, or BSD-3-Clause) has **not yet been assigned** to this repository.  
> An appropriate open-source license must be selected and added to a `LICENSE` file prior to final public distribution.
