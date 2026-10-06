# M1.6 WORKSPACE LAYOUT ARCHITECTURE & SPECIFICATION
## Dynamic 3D Geometry Reasoning Stand

### 1. Architectural Philosophy: Geometry-First Workstation

The **Dynamic 3D Geometry Reasoning Stand** is a mathematical instrument, not an article or marketing brochure. In milestone M1.6, the client was transformed from a vertical scrolling page into an interactive, high-density **two-column desktop workstation**:

- **Primary Geometry Workbench (Left Column, ~65% width)**:
  - Persistent, fixed-in-place 3D interactive viewport filling available vertical screen space.
  - Houses the 3D canvas, interactive orbiting, camera pan, zoom, surface dragging, render toggles (Sphere, Solid Faces, Wireframe, Grid, Invariant Ghost), viewpoint presets, and XYZ axes.
  - Does NOT scroll away when the user inspects details or reads explanations.
- **Reasoning & Information Workbench (Right Column, ~35% width)**:
  - Independently scrollable container (`overflow-y-auto`, custom dark workstation scrollbar).
  - Strictly organized into seven logical, clear sections matching the educational and causal flow.
- **Zero Wasted Canvas Margins**:
  - Eliminated arbitrary `max-w-7xl mx-auto` centering that caused large empty margins on desktop displays.
  - The application shell expands gracefully across the entire browser window (`w-screen h-screen overflow-hidden` on desktop).

---

### 2. Layout Grid & Structural Hierarchy

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Title | M1.6 Status | Active Vertex Pill | Geometry Status Pill     │
├──────────────────────────────────────┬─────────────────────────────────────┤
│                                      │ INFORMATION PANEL (~35% width)      │
│  3D GEOMETRY VIEWPORT (~65% width)   │ (independently scrollable)          │
│                                      ├─────────────────────────────────────┤
│  - Persistent 3D canvas (Three/WebGL)│ 1. Active Vertex (Tabs A, B, C, D)  │
│  - Orbit, Pan, Zoom, Vertex Drag     │ 2. Position (Lat/Lon sliders, R³)   │
│  - Render layer toggles              │ 3. Geometric Measurements           │
│  - Viewpoint presets (Top/Front/Iso) │    (6 edges, 4 faces, centroid G)   │
│  - Real-time orientation & status    │ 4. Geometric State                  │
│                                      │    (Volume Vs, surface S, validity) │
│                                      │ 5. Dependencies (Causal Neighborhood│
│                                      │    Incident vs Invariant branches)  │
│                                      │ 6. Learning / Explanation (Russian) │
│                                      │ 7. Engineering Diagnostics (M1)     │
└──────────────────────────────────────┴─────────────────────────────────────┘
```

---

### 3. Seven-Section Information Organization

The right panel organizes all parameters, derived metrics, and causal analysis into seven strictly ordered sections:

1. **Active Vertex Selection (Tabs A, B, C, D)**:
   - Equal interaction semantics across all 4 vertices (no privileged vertex).
   - Instant bi-directional synchronization with 3D canvas selection.
2. **Position Controls**:
   - Latitude $\phi$ ($-90^\circ \dots +90^\circ$) and Longitude $\lambda$ ($0^\circ \dots 360^\circ$) sliders with precise angular readout in degrees and radians.
   - Real-time Cartesian coordinates $(x, y, z)$ in $\mathbb{R}^3$.
   - Rigorous sphere distance verification ($|P - O| = R$).
   - Quick geometric configuration presets (Правильный, Левая, Вырожденный, Околовырожденный).
3. **Geometric Measurements**:
   - 6 straight Euclidean chord lengths ($AB, AC, AD, BC, BD, CD$).
   - 4 planar triangular face areas & perimeters ($ABC, ABD, ACD, BCD$).
   - Centroid coordinates $G = \frac{1}{4}(A + B + C + D)$.
4. **Geometric State**:
   - Signed volume $V_s = \frac{1}{6} \det[\vec{AB}, \vec{AC}, \vec{AD}]$.
   - Total surface area $S_{total} = \sum_{i=1}^4 S_i$.
   - Strict orientation indicator (Правая $>0$, Левая $<0$, Компланарная $\approx 0$).
   - Regularity predicate (Special symmetric state indicator).
5. **Causal Neighborhood & Dependencies**:
   - Direct changes: incident edges and incident faces.
   - Invariant branch: opposite face and unaffected edges.
6. **Educational Learning & Reasoning**:
   - Real-time semantic narrative explaining the geometric consequences of movements in clear Russian.
7. **Engineering Diagnostics (Collapsible Accordion)**:
   - Authoritative M1 canonical state JSON.
   - Scale-aware numerical tolerances ($\varepsilon_{sphere}, \varepsilon_{coincident}, \varepsilon_{volume}$).
   - Persistent topology and FNV-1a deterministic hash.
   - Automated 34/34 test suite execution status.

---

### 4. Responsiveness & Display Modes

- **Desktop ($\ge 1024\text{px}$)**:
  - Fixed-height application shell (`h-screen overflow-hidden`).
  - Two-column split: left column $65\%$, right column $35\%$.
  - Viewport stays fixed while right panel scrolls independently.
- **Mobile & Tablet ($< 1024\text{px}$)**:
  - Clean vertical stacking (`flex-col`).
  - Viewport retains dedicated minimum height (`h-[440px]`) for comfortable 3D touch interaction.
  - Information panel flows naturally underneath.
