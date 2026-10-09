# System Architecture

## 1. System Overview

The **Dynamic 3D Geometry Reasoning Stand** is a deterministic mathematical instrument designed for observing, verifying, and reasoning about geometric transformations in three-dimensional space.

The system is constructed upon a single authoritative rule:
> **The Agent May Be Wrong. The Stand Must Not.**

External artificial intelligence agents, automated theorem reasoners, or student users can interact with the geometry stand by asserting hypotheses or executing transformations. The stand observes these actions, projects causal neighborhoods, and deterministically computes mathematical truth.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           UNTRUSTED CLIENTS                             │
│      AI Agents (LLMs)   │   Human Learners   │   External Reasoners     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Actions / Claims
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      VERIFICATION BOUNDARY (Pkg 05)                     │
│        VERIFY_RESULT     │     VERIFY_STEP     │    CONSISTENCY_CHECK   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Validated Transitions
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                ONE CANONICAL GEOMETRY STATE (Pkg 01, 02)                │
│    Fixed Sphere S²(O, R)   │   Persistent Vertices A, B, C, D ∈ ℝ³      │
│    Combinatorial Topology: 4 Vertices, 6 Euclidean Edges, 4 Flat Faces  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Feeds
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                DETERMINISTIC COMPUTATIONAL ENGINE (Pkg 03)              │
│    Full Recomputation Baseline Oracle │ Scale-Aware Tolerances (Pkg 06) │
│    Chords L_ij  │ Face Areas S_F  │ Normals n_F  │ Signed Volume V_s    │
│    Regularity Predicate  │  Metadata-Free FNV-1a Geometry Signature     │
└──────────────────┬─────────────────┬─────────────────┬──────────────────┘
                   │                 │                 │
                   ▼                 ▼                 ▼
          ┌─────────────────┐ ┌──────────────┐ ┌───────────────┐
          │ REPRESENTATION  │ │ VISUALIZATION│ │   TEMPORAL    │
          │     LAYER       │ │  WORKBENCH   │ │  OBSERVATION  │
          │ (Lat/Lon (φ, λ))│ │  (React/3D)  │ │ (Snapshots)   │
          └─────────────────┘ └──────────────┘ └───────────────┘
```

---

## 2. The Multi-Layer State Model

To eliminate circular dependencies and state leakage, the system strictly separates state into three distinct layers:

| Layer | State Components | Ownership & Mutability |
| :--- | :--- | :--- |
| **Geometry State** | Canonical Cartesian coordinates: Center $O$, radius $R$, vertices $A, B, C, D \in \mathbb{R}^3$. | Immutable snapshot (`CanonicalGeometryState`). Deeply frozen. Mutated exclusively via explicit geometric transitions. |
| **Representation State** | Spherical coordinates $(\phi, \lambda)$ on $S^2$, coordinate guides (parallels, meridians), fixed reference axes. | Derived purely on-demand as a mathematical bijection. Never alters canonical Cartesian coordinates. |
| **Visualization State** | Camera orbit (azimuth $\theta$, elevation $\psi$, distance $d$), viewport dimensions, visual scale ($100\%, 75\%, 50\%$), selection highlights. | Local client state. Zero mathematical authority; modifying visual properties produces zero changes in geometry or signatures. |

---

## 3. Canonical Geometry & Topology

The geometry core operates exclusively in three-dimensional Euclidean space $\mathbb{R}^3$:

- **The World Sphere $S^2(O, R)$:**
  Defined by fixed center $O(0, 0, 0)$ and positive radius $R > 0$. Vertices are constrained to lie on this surface:
  $$\|V_i - O\|_2 = R \quad \text{for } V_i \in \{A, B, C, D\}$$
- **Persistent Combinatorial Topology (4V / 6E / 4F):**
  - Vertices retain labeled identities $A, B, C, D$ indefinitely. They are never sorted by distance or re-indexed.
  - Exactly 6 straight Euclidean edges: $AB, AC, AD, BC, BD, CD$. Edges are chords traversing the interior of the sphere.
  - Exactly 4 planar triangular faces: $ABC, ABD, ACD, BCD$. Faces are flat planes in $\mathbb{R}^3$, not spherical patches.

---

## 4. Representation Layer (Dual Coordinates)

While Cartesian coordinates form the canonical source of truth, spherical coordinates provide intuitive human and robotic control:
- **Latitude $\phi \in [-\pi/2, \pi/2]$**: Angle relative to the equatorial plane ($XY$).
- **Longitude $\lambda \in [0, 2\pi)$**: Counter-clockwise angle from $+X$ (prime meridian).

### Mathematical Conversion
$$\begin{pmatrix} x \\ y \\ z \end{pmatrix} = \begin{pmatrix} O_x + R \cos\phi \cos\lambda \\ O_y + R \cos\phi \sin\lambda \\ O_z + R \sin\phi \end{pmatrix}$$
$$\phi = \arcsin\left(\operatorname{clamp}\left(\frac{z - O_z}{R}, -1, 1\right)\right), \quad \lambda = \operatorname{atan2}(y - O_y, x - O_x) \pmod{2\pi}$$

- **Pole Singularity Invariant:** If $|\phi| = \pi/2$ (within $\text{EPS\_ANGLE}$), $\lambda$ is canonicalized to $0$.
- **Anti-Silent-Projection Guard:** If an external input specifies Cartesian coordinates where $|\|P - O\| - R| > \epsilon_{\text{sphere}}$, the engine explicitly rejects the point with `OUTSIDE_SPHERE`. No silent radial snapping or projection is permitted.

---

## 5. Dependency Graph & Semantic Impact Model

When a vertex (e.g., $D$) is moved:
- **Structurally Incident Branch:** Edges $\{AD, BD, CD\}$ and faces $\{ABD, ACD, BCD\}$ are incident and must be evaluated.
- **Invariant Disjoint Branch:** Edge $\{BC\}$ and opposite face $\{ABC\}$ are structurally disjoint from $D$. Their lengths, areas, and plane orientations are mathematically guaranteed to remain invariant.

```text
Move Vertex D
  │
  ├─► Incident Edges:  AD, BD, CD (Lengths updated)
  ├─► Incident Faces:  ABD, ACD, BCD (Areas & Normals updated)
  │
  ├─► Global State:    Signed Volume V_s, Total Surface Area, Centroid G
  │
  └─► Invariant:       Edge BC, Face ABC (Unaltered, Verified Invariant)
```

The stand maintains full label permutation symmetry across all four vertices $A, B, C, D$.

---

## 6. Deterministic Engine & Recomputation Oracle

The engine executes a feed-forward deterministic derivation:
$$\text{Input State } \to \text{Tolerance Resolution } \to \text{Metrics } \to \text{Solid Orientation } \to \text{Predicates } \to \text{Signature}$$

### Full Recomputation Baseline
Rather than relying on mutable incremental cache invalidation, the engine evaluates the full derivation graph from the ground up for every state transition. This full deterministic recomputation serves as the **authoritative baseline oracle** against which any future incremental optimizations must be validated.

---

## 7. Metadata-Free Geometry Signature

To uniquely identify geometric states, the stand computes an FNV-1a 32-bit hash strictly from normalized geometric properties:
$$\text{Signature} = \operatorname{FNV1a}\left(R \parallel A_{x,y,z} \parallel B_{x,y,z} \parallel C_{x,y,z} \parallel D_{x,y,z} \parallel L_{1..6} \parallel S_{1..4} \parallel V_s \parallel \text{Orientation} \parallel \text{Regularity}\right)$$
All numerical values are formatted to 10 fixed decimal places. Timestamps, client IDs, viewport sizes, and camera orientations are strictly excluded, ensuring bitwise identical signatures across disparate runtime environments.

---

## 8. Verification & Research Boundaries

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      VERIFICATION BOUNDARY (CORE)                        │
│                                                                          │
│  • Strictly evaluates external claims against deterministic recomputation │
│  • Orthogonal status taxonomies: Verification, Input, Solid, Consistency │
│  • Provenance tracking: DETERMINISTIC_DERIVATION vs AGENT_ASSERTION      │
│  • Anti-circular guard: Assertions cannot verify assertions             │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                        STRICT BOUNDARY / GATEWAY
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│                      RESEARCH BOUNDARY (LABORATORY)                      │
│                                                                          │
│  • Isolated exploratory sandbox for unverified mathematical hypotheses   │
│  • 81 Face-Center classification profile realizability                   │
│  • Automatic symbolic theorem discovery and proof-tree generators        │
│  • Unvalidated conjectures are quarantined from the Core Engine          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Centralized Scale-Aware Tolerance Architecture

Per Package 06, all numerical tolerances are dimensionally derived from characteristic length $L_{\text{scale}} = R$:

$$\epsilon_Q = c_Q \cdot R^{\operatorname{dim}(Q)}$$

- Lengths ($\mathsf{L}^1$): $\epsilon = 10^{-6} R$
- Areas ($\mathsf{L}^2$): $\epsilon = 10^{-6} R^2$
- Volumes ($\mathsf{L}^3$): $\epsilon = 10^{-7} R^3$
- Regularity ($\mathsf{L}^0$): Dimensionless ratio $(L_{\max} - L_{\min})/R \le 10^{-4}$
- Angles ($\mathsf{L}^0$): $\epsilon = 10^{-6} \text{ rad}$

This guarantees that the system behaves identically across any scale from micro-geometry ($R = 10^{-6}$) to astronomical scales ($R = 10^6$).

---

## 10. Dynamic Reasoning Layer

The Dynamic Reasoning Layer extends the deterministic computational core with localized manifold analysis, cross-vertex consistency verification, and causal temporal tracking. All modules are strictly functional and side-effect free:

```text
                  CanonicalGeometryState (SSOT)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  Global Metrics          LVG Engine               Dual Coords
(V_s, Area, Centroid)   (src/core/lvg.ts)       (Lat / Lon Guides)
                                │
                                ▼
                           DLVM Layer
                       (src/core/dlvm.ts)
                                │
                                ▼
                            GDS Layer
                        (src/core/gds.ts)
                                │
                                ▼
                         Temporal Engine
                  (src/core/geometryTemporal.ts)
```

### 10.1. Local Vertex Geometry (`src/core/lvg.ts`)
- **Purpose:** Derives intrinsic geometric invariants at any single vertex $v \in \{A, B, C, D\}$.
- **Core Quantities:**
  - Incident chord vectors $\mathbf{e}_{vj} = \mathbf{v}_j - \mathbf{v}$ and unit direction rays $\mathbf{u}_{vj} \in S^2(v)$.
  - $3 \times 3$ Gram matrix $G_{jk} = \mathbf{u}_{vj} \cdot \mathbf{u}_{vk}$ and determinant $\det(G)$.
  - Planar face angles $\alpha_{jk} = \arccos(\mathbf{u}_{vj} \cdot \mathbf{u}_{vk})$.
  - Dihedral face angles $\theta_{jk}$ along each incident edge.
  - Solid angle $\Omega(v)$ via the continuous Oosterom-Strackee spherical excess formula with two-argument arctangent.
  - Degeneracy classification $D_0$ through $D_5$ using centralized Package 06 tolerances (`getResolvedTolerances`).

### 10.2. Directed Local Vertex Manifold (`src/core/dlvm.ts`)
- **Purpose:** Organizes the local vertex frame into a topologically indexed Directed Local Vertex Manifold.
- **Shared-Edge Anti-Parallelism Invariant:**
  $$\mathbf{u}_{v_1 v_2}^{(v_1)} = -\mathbf{u}_{v_2 v_1}^{(v_2)}$$
  The engine verifies this identity across all 6 pairs of vertices against $\varepsilon_{\text{finite}}(R)$.

### 10.3. Geometric Diagnostic Snapshot (`src/core/gds.ts`)
- **Purpose:** Atomic diagnostic aggregation combining:
  - Canonical 32-bit FNV-1a signature.
  - Global metrics (volume, surface area, centroid).
  - 4 localized DLVMs ($A, B, C, D$).
  - Shared-edge consistency validation result.
  - Epistemic status tracking (`EpistemicStatus.DERIVED`).
  - Degeneracy flags (`VOLUME_DEGENERATE`, `VERTEX_*`, `SHARED_EDGE_INCONSISTENCY`).
- **Guarantee:** Zero reverse-write capability to Canonical State.

### 10.4. Temporal Observation & Trace Engine (`src/core/geometryTemporal.ts`)
- **Purpose:** Observes state transitions over time without mutating geometry.
- **Monotonic Time Guard:** Enforces $t_1 > t_0$; transitions where $\Delta t \le 0$ are marked `CORRUPTED`.
- **Differential Measurement:** Evaluates $\Delta V_s$, $\Delta S_{\text{total}}$, centroid displacement $\|\Delta G\|$, per-edge delta lengths $\Delta L_{ij}$, and per-vertex displacements $\|\Delta V_i\|$.
- **Temporal Quality:** Tracks sequence integrity (`PRISTINE`, `DEGRADED`, `CORRUPTED`).

---

## 11. Interactive LSM Inspector Component (`src/components/LsmInspector.tsx`)

The **Глобус локальной угловой геометрии** (архитектурно: **Local Spherical Manifold (LSM) Inspector**) provides real-time human visualization for the LVG layer:
- **Two-Tier Naming Architecture:**
  - **Человеко-ориентированный UI:** Кнопка **`[ 🌐 Глобус углов {id} ]`**, заголовок панели **«Глобус локальной угловой геометрии — вершина {id}»** (подзаголовок `LVG / LSM · {id}`). Фокус на локальной угловой структуре вершины (направления рёбер, плоские углы, ориентация, телесный угол).
  - **Математический код:** `LsmInspector.tsx`, `lvg.ts`, `computeLVG()`.
- **Physical Globe on Stand Model:**
  $$\boxed{\text{Geometry State} = \text{CONSTANT}} \quad \iff \quad \boxed{\text{Observer View Orientation} = \text{MODEL ROTATION IN HANDS}}$$
  - **Intrinsic Geometry Invariance:** Unit rays $\mathbf{u}_{vj}$, Gram determinant $\det(G)$, planar angles $\alpha_{jk}$, dihedral angles $\theta_{jk}$, and solid angle $\Omega(v)$ are immutable properties of the tetrahedron's current state.
  - **Rigid Model Rotation:** The user turns the physical globe on its stand (meridian mount, poles $N$ and $S$, equator, parallels, meridians, and pinned landmark rays rotate rigidly together) via direct canvas drag, Azimuth (Yaw) slider, Pitch slider, or presets («Спереди», «Полюс N», «Изо», «↺»).
- **Dual Presence Integration:**
  1. **Embedded:** Docked in Section 2 of `VertexControlPanel.tsx` (open by default, collapsible via `[ 🌐 Глобус углов {id} ]`).
  2. **Floating HUD:** Overlaid directly on the 3D canvas in `GeometryViewport.tsx`, toggled via the `[ 🌐 Глобус углов {id} ]` HUD button.
- **Interactive Globe Canvas:** $220 \times 200$ px high-DPI canvas projecting local sphere $S^2(v)$ with 3D depth-sorting, ambient radial shading, and axis pins.
- **Dynamic Updates:** Continuously recalculates during vertex dragging at $60\text{ fps}$.
- **Strict SSOT Pipeline & Zero Mutation:** Evaluated as a pure read-only deterministic projection from `CanonicalGeometryState`. Orientation changes affect zero geometric state.

---

## 12. Agent Gateway & Command Layer (`src/core/agentGateway.ts`)

The Agent Gateway provides an untrusted client boundary and deterministic execution oracle:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        AI AGENT / CLIENT REQUEST                       │
│      inspect_passport │ query_metric │ verify_claim │ perturb ...      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 AGENT GATEWAY DISPATCHER & VALIDATION                  │
│  - Parameter structural validation (discriminated union)               │
│  - Reference state resolution (defaults to active state)               │
│  - Rejection of malformed / unsupported commands                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 CANONICAL GEOMETRY & ORACLE EVALUATION                 │
│  - Pure function execution: metrics.ts, symmetry.ts, construction.ts  │
│  - Receiver-owned tolerances: getResolvedTolerances(R)                 │
│  - Mathematical residual & truth evaluation                           │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│       BRANCHED STATE REGISTRY        │ │      EXPERIMENT LEDGER        │
│  Stores isolated resulting states    │ │  Chronological append-only log│
│  (No silent human scene mutation)    │ │  Structured EvidenceRecords   │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

### Gateway Responsibilities:
1. **Command Dispatcher:** Routes 9 typed commands defined in `src/core/gatewayTypes.ts`.
2. **Branch State Registry:** Caches resulting geometry states from constructions, perturbations, and symmetry transforms by signature, leaving the human scene intact.
3. **Evidence Oracle:** Validates agent claims against authoritative calculations using receiver-owned tolerances.
4. **Ledger Management:** Records every experiment with inputs, outputs, tolerances, and verdicts.

---

## 13. Experiment Ledger & Evidence Records

Every claim verification executed via `verify_claim` produces an immutable proof record (`EvidenceRecord`):
- **Epistemic Classification:** Orthogonal `VERIFIED`, `REFUTED`, `INVALID_INPUT`, or `UNSUPPORTED_OPERATION`.
- **Tolerance Traceability:** Logs exact linear, angular, and volumetric epsilons applied.
- **Mathematical Evidence:** Records exact actual values, claimed values, and numerical residuals.
- **Reproducibility Guarantee:** Executing the identical verification with identical inputs reproduces identical evidence.

---

## 14. User Interface & Agent Console Component

The user workstation layout pairs the human visual interface with the autonomous agent tooling:
1. **Human Visual Workstation:**
   - **`GeometryViewport.tsx`:** Interactive 3D canvas viewport (~65% width) with orbit camera, depth-sorted faces, coordinate guides, and floating LSM HUD.
   - **Sidebar Panels (~35% width):** `VertexControlPanel.tsx` (Cartesian and spherical lat/lon controls), `MeasurementPanel.tsx` (metrics, volume, orientation), `DebugPanel.tsx` (raw coordinates, tolerances, signature).
2. **Agent Console (`src/components/AgentConsole.tsx`):**
   - **Presets:** Quick execution of standard agent commands (passport inspection, $C_3$ rotation, central inversion, symmetry breaking, regularity query).
   - **JSON Console:** Direct structured command editor supporting full JSON payloads with syntax error feedback.
   - **Passport View:** Dual inspection of Object Identity (PGO-3D) and State-Specific Symmetry Passport (PSS-3D).
   - **Ledger View:** Interactive log of past experiments with verdict filters and detailed residual inspections.
   - **Explicit Scene Injection:** Optional «Показать в 3D сцене» button to manually promote an agent experiment state to the human workstation viewport.

---

## 15. Subsystem Authority & Dependency Flow

| Subsystem | Authority Level | Primary Source | Dependencies |
| :--- | :--- | :--- | :--- |
| **Canonical State** | **AUTHORITATIVE** | `geometryState.ts` | `types.ts`, `tolerances.ts` |
| **Topology** | **AUTHORITATIVE** | `topology.ts` | `types.ts` |
| **Tolerances** | **AUTHORITATIVE** | `tolerances.ts` | None |
| **Metrics & LVG** | **DERIVED** | `metrics.ts`, `lvg.ts` | Canonical State, Tolerances |
| **DLVM & GDS** | **DERIVED** | `dlvm.ts`, `gds.ts` | Metrics, LVG, Topology |
| **Representation** | **DERIVED** | `representation.ts` | Canonical State |
| **Signatures** | **DERIVED** | `signature.ts` | Canonical State |
| **Temporal Engine** | **DERIVED** | `geometryTemporal.ts`| Canonical State, Signatures |
| **Agent Gateway** | **ORACLE BOUNDARY**| `agentGateway.ts` | Canonical State, Metrics, Symmetry, Construction |
| **Renderer & UI** | **PRESENTATION** | `renderer3d.ts`, `App.tsx`| Representation, Viewport, Gateway |


