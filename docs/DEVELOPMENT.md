# Development & Contribution Guide

## 1. Prerequisites

- **Node.js**: Version 18.0.0 or higher.
- **Package Manager**: `npm` (version 9+).

---

## 2. Quick Start

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/dynamic-3d-geometry-reasoning-stand.git
cd dynamic-3d-geometry-reasoning-stand
npm install
```

Start the local development server:

```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## 3. Build & Lint Commands

The project uses TypeScript for type safety and Vite for bundle generation:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Starts the local dev server on port 3000. |
| `npm run build` | `vite build` | Compiles production assets into `dist/`. |
| `npm run preview` | `vite preview` | Previews the production build locally. |
| `npm run lint` | `tsc --noEmit` | Runs the TypeScript compiler in dry-run mode to verify all types. |

---

## 4. Deterministic Test Suite Commands

All tests are implemented in TypeScript and run headlessly using `tsx`:

```bash
# Run all automated test suites (10 suites, 105 tests)
npm run test:all

# Run individual test suites:
npm run test:m1        # M1 Canonical Geometry State suite (17 tests)
npm run test:client    # M1.5 Visual Client synchronization suite (10 tests)
npm run test:layout    # M1.6 Workspace Layout & Ergonomics suite (7 tests)
npm run test:guides    # M1.7 Scale & Guides suite (16 tests)
npm run test:lvg       # M1.8 Dynamic Reasoning LVG/DLVM/GDS suite (10 tests)
npm run test:scale     # PAT-27 Scale Invariance suites (12 tests)
npm run test:metrics   # Regular tetrahedron metric suite (5 tests)
npm run test:epistemic # Epistemic orthogonality suite (7 tests)
npm run test:agent     # Agent readiness smoke contracts (11 tests)
```

---

## 5. Project Directory Structure

```text
├── docs/                                # Architecture & public documentation
│   ├── architecture-packages/           # Archival records of Transfer Packages 01–06
│   ├── research/                        # Dynamic reasoning specifications
│   │   ├── DYNAMIC_REASONING_ARCHITECTURE.md
│   │   ├── LVG_001.md
│   │   ├── DLVM_001.md
│   │   └── GDS_AND_TEMPORAL.md
│   ├── ARCHITECTURE.md                  # System overview, state model, dynamic reasoning
│   ├── LSM_INSPECTOR.md                 # Local Spherical Manifold Inspector specification
│   ├── GEOMETRIC_MODEL.md               # S², tetrahedron, signed volume, regularity
│   ├── INTERACTION.md                   # 3D viewport, guides, scale, and controls
│   ├── REASONING_MODEL.md               # Causal dependencies and recomputation oracle
│   ├── VERIFICATION.md                  # Epistemic enums, provenance, and tests
│   ├── RESEARCH.md                      # Open mathematical questions and research candidates
│   ├── DEVELOPMENT.md                   # Build, test, and development instructions
│   └── ROADMAP.md                       # M0 through M10 milestone status
├── src/
│   ├── core/                            # Authoritative Mathematical Core
│   │   ├── geometryState.ts             # Canonical state creation, validation, volume
│   │   ├── metrics.ts                   # Chords, areas, normals, centroid, regularity
│   │   ├── representation.ts            # Dual spherical ↔ Cartesian coordinate converter
│   │   ├── signature.ts                 # FNV-1a metadata-free geometry signature
│   │   ├── tolerances.ts                # Package 06 centralized scale-aware tolerances
│   │   ├── topology.ts                  # Persistent 4V / 6E / 4F combinatorial topology
│   │   ├── types.ts                     # Core TypeScript geometric interfaces and enums
│   │   ├── lvg.ts                       # Local Vertex Geometry (Gram, Ω, planar/dihedral angles)
│   │   ├── dlvm.ts                      # Directed Local Vertex Manifold (shared-edge anti-parallelism)
│   │   ├── gds.ts                       # Geometric Diagnostic Snapshot (SSOT isolated)
│   │   ├── geometryTemporal.ts          # Strictly monotonic temporal transitions
│   │   ├── epistemic.ts                 # Fact, hypothesis, and provenance wrappers
│   │   └── agentInterface.ts            # Headless claim evaluation oracle boundary
│   ├── visualization/                   # 3D Canvas Rendering & Causal Projection
│   │   └── renderer3d.ts                # Perspective canvas projection, depth sorting, guides
│   ├── components/                      # React Workstation Components
│   │   ├── GeometryViewport.tsx         # 3D viewport with camera orbit & floating LSM HUD trigger
│   │   ├── LsmInspector.tsx             # Dual-mode Local Spherical Manifold inspector
│   │   ├── VertexControlPanel.tsx       # Coordinate controls & embedded LSM inspector
│   │   ├── MeasurementPanel.tsx         # Metric display & orientation indicators
│   │   ├── LearningPanel.tsx            # Pedagogical causal reasoning narrative
│   │   ├── AgentTestPanel.tsx           # Untrusted agent claim test harness
│   │   └── DebugPanel.tsx               # Canonical coordinate and tolerance inspector
│   └── tests/                           # 10 Deterministic Automated Test Suites
│   ├── visualization/                   # 3D Canvas Rendering & Causal Projection
│   │   ├── camera.ts                    # Orbit camera state and view transforms
│   │   ├── causalModel.ts               # Incident vs invariant neighborhood calculations
│   │   └── renderer3d.ts                # Canvas 3D projection, depth sorting, guides
│   ├── components/                      # React High-Density Workstation Components
│   │   ├── GeometryViewport.tsx         # 3D canvas viewport, scale bar, guide toggles
│   │   ├── VertexControlPanel.tsx       # Active vertex selector, lat/lon sliders
│   │   ├── MeasurementPanel.tsx         # Edges, faces, signed volume, regularity
│   │   ├── LearningPanel.tsx            # Mathematical explanation narrative (Russian)
│   │   └── DebugPanel.tsx               # Collapsible diagnostics accordion
│   ├── tests/                           # Deterministic automated test suites
│   │   ├── m1_canonical_state.test.ts   # T01 - T17 (17 tests)
│   │   ├── m1_5_visual_client.test.ts   # C01 - C10 (10 tests)
│   │   ├── m1_6_workspace_layout.test.ts# W01 - W07 (7 tests)
│   │   └── m1_7_scale_and_guides.test.ts# T01 - T16 (16 tests)
│   ├── App.tsx                          # Root workstation layout and state coordination
│   ├── main.tsx                         # React application entry point
│   └── index.css                        # Tailwind CSS imports
├── index.html                           # HTML entry point with synchronized metadata
├── metadata.json                        # Application metadata
├── package.json                         # Project dependencies and scripts
└── vite.config.ts                       # Vite configuration with Tailwind plugin
```

---

## 6. Coding & Architectural Discipline

When contributing to this project:
1. **Preserve the Core:** The mathematical core in `src/core/` must never import from `src/visualization/` or `src/components/`.
2. **Scale Invariance:** Never introduce hardcoded tolerance constants. All tolerances must derive from `resolveTolerances(R)` in `src/core/tolerances.ts`.
3. **No Silent Repair:** If coordinates fail sphere membership, reject them with an explicit status (`OUTSIDE_SPHERE`). Never silently project or snap coordinates.
4. **Deterministic Tests:** Any new geometric derivation must be accompanied by headless, deterministic unit tests.
