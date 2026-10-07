# User Interaction & Visual Workbench

## 1. Workstation Layout & Visual Ergonomics

The Dynamic 3D Geometry Reasoning Stand features an asymmetric, two-column high-density layout designed for professional workstation displays:

- **Left Column (~65% width):** Persistent 3D geometry viewport. The viewport never disappears during scrolling, ensuring immediate visual feedback.
- **Right Column (~35% width):** Independently scrollable mathematical reasoning and measurement panel. Contains structured, numbered sections from active vertex controls to engineering diagnostics.

```text
┌───────────────────────────────────────────────────┬───────────────────────────────┐
│              3D GEOMETRY VIEWPORT                 │   REASONING & METRICS PANEL   │
│                   (~65% width)                    │         (~35% width)          │
│                                                   │                               │
│  [Top Controls: Camera Reset | Wireframe | Guides]│  [1. Active Vertex Selector]  │
│                                                   │  [2. Coordinate Controls]     │
│                    Sphere S²                      │  [3. Geometric Measurements]  │
│             Tetrahedron (A, B, C, D)              │  [4. Geometric State & Vol]   │
│             Per-Vertex Coordinate Guides          │  [5. Causal Dependencies]     │
│                                                   │  [6. Educational Narrative]   │
│  [Bottom: View Scale (Fit | 100% | 75% | 50%)]    │  [7. Diagnostics Accordion]   │
└───────────────────────────────────────────────────┴───────────────────────────────┘
```

---

## 2. Distinction: Camera Transform vs. Visual Scale vs. Geometry State

To preserve mathematical integrity, the system strictly separates these three operations:

| Layer | Operation | Mathematical Effect |
| :--- | :--- | :--- |
| **Camera Orbit** | Dragging outside the sphere orbits azimuth ($\theta$) and elevation ($\psi$); mouse wheel adjusts distance ($d$). | Modifies the viewing matrix only. Coordinates, lengths, signed volume, and geometry signatures remain **strictly invariant**. |
| **Visual Scale** | Selecting `Fit`, `100%`, `75%`, or `50%` in the bottom-left viewport toolbar. | Multiplies the viewport projection pixel multiplier (`scaleMultiplier = baseRadius * visualScale / R`). Relieves visual crowding; geometry coordinates, radius $R$, volume $V_s$, and signature remain **strictly invariant**. |
| **Geometry Transformation** | Dragging a vertex ($A, B, C, D$) on the sphere surface or adjusting latitude/longitude sliders. | Modifies Cartesian coordinates $V_i \in S^2(O, R)$. Recomputes derived metrics, updates incident edges/faces, and generates a new geometry signature. |

---

## 3. 3D Viewport Controls

### 3.1. Camera Navigation
- **Orbit Rotation:** Click and drag anywhere in the empty canvas space to rotate the view.
- **Camera Zoom:** Scroll the mouse wheel to smoothly adjust camera distance.
- **Reset Camera:** Click the `[Сброс камеры]` button in the top-right toolbar to return to the canonical isometric perspective.

### 3.2. Viewport Scale Control
Located at the bottom-left corner of the viewport:
- **`Fit`:** Resets camera orbit and sets visual scale to 100%.
- **`100%`:** Standard full-frame geometric projection.
- **`75%`:** Provides comfortable visual breathing room around the sphere poles.
- **`50%`:** Compact overview layout; prevents sphere edges from clipping on smaller laptop screens.

### 3.3. Direct Vertex Manipulation (On-Sphere Raycasting)
- **Direct Drag:** Click and hold any vertex ($A, B, C, D$) directly inside the 3D viewport and drag across the sphere.
- **Sphere Surface Constraint:** As the cursor moves across screen coordinates $(x_{\text{pixel}}, y_{\text{pixel}})$, the stand unprojects the 2D mouse position into a 3D ray $\vec{r}(t) = \vec{E} + t \vec{d}$ and computes the forward intersection with sphere $S^2(O, R)$:
  $$\|\vec{E} + t \vec{d} - O\|_2 = R$$
  If the cursor moves outside the sphere silhouette, the ray is projected onto the sphere's apparent limb, ensuring that vertices never leave the spherical manifold.

---

## 4. Per-Vertex Coordinate Guides (Parallels & Meridians on $S^2$)

When a vertex is active or dragged, the stand projects dynamic coordinate curves directly onto the sphere surface:

1. **Latitude Parallel ($\phi_P$):**
   - A horizontal circle with radius $r = R \cos \phi_P$ at height $z = O_z + R \sin \phi_P$.
   - Demonstrates that moving a vertex purely eastward/westward preserves its latitude and height.
2. **Longitude Meridian ($\lambda_P$):**
   - A half-great-circle connecting the South Pole $(0, 0, -R)$ through vertex $P$ to the North Pole $(0, 0, +R)$.
   - Demonstrates that moving a vertex purely northward/southward preserves its meridian plane.
3. **Depth-Aware Rendering:**
   - Curves on the front-facing hemisphere are rendered with a distinct solid glow.
   - Curves passing behind the opaque sphere are rendered with subtle dashed lines and reduced opacity.
4. **On-Screen Coordinate Badge:**
   - Real-time badge floats alongside the active vertex: `P: φ = -19.5°, λ = 0.0°`.
5. **Display Toggles:**
   - `[Compass icon]`: Toggles coordinate guides on or off.
   - `[Active / All]`: Toggles between displaying guides for the active vertex only versus all four vertices simultaneously.

---

## 5. Right Sidebar: Structured Information Flow

The sidebar organizes reasoning into seven numbered sections:

### Section 1: Active Vertex Selector
- Persistent tabs for vertices **A**, **B**, **C**, and **D**.
- Selecting a tab synchronizes focus in the 3D viewport, highlights incident elements, and updates numerical controls.

### Section 2: Position & Coordinate Controls + Local Spherical Manifold (LSM) Inspector
- **Spherical Controls:** Dual sliders for Latitude $\phi \in [-90^\circ, +90^\circ]$ and Longitude $\lambda \in [0^\circ, 360^\circ)$.
- **Cartesian Display:** Displays authoritative Cartesian coordinates $(x, y, z) \in \mathbb{R}^3$.
- **Surface Check:** Displays deviation $|\|P - O\| - R|$, verifying strict adherence to $S^2$.
- **Глобус локальной угловой геометрии (`[ 🌐 Глобус углов {id} ]`):**
  - Toggles embedded inspection of local vertex angular geometry inside Section 2 (open by default).
  - Also accessible via the floating `[ 🌐 Глобус углов {id} ]` button directly on the 3D canvas HUD.
  - Interactive physical globe on stand model: user rotates the viewing model in hands (Yaw / Pitch sliders, direct drag, presets «Спереди», «Полюс N», «Изо», «↺»), while canonical geometry state remains strictly invariant.
  - Live numerical display of incident edge directions $\mathbf{u}_{vj}$, chord lengths $|e|$, solid angle $\Omega(v)$ via Oosterom-Strackee, Gram determinant $\det(G)$, and planar face angles $\alpha_{jk}$.

### Section 3: Geometric Measurements
- **6 Edge Chords:** Lengths $L_{AB}, L_{AC}, L_{AD}, L_{BC}, L_{BD}, L_{CD}$ updated in real time.
- **4 Triangular Faces:** Areas $S_{ABC}, S_{ABD}, S_{ACD}, S_{BCD}$ and perimeters.
- **Centroid:** Cartesian coordinates of center of mass $G = (A+B+C+D)/4$.

### Section 4: Geometric State
- **Signed Volume ($V_s$):** Displays exact signed volume to 5 decimal places.
- **Orientation Badge:** Clear visual indicator:
  - `Прямая (правая)`: $V_s > +\epsilon_{\text{volume}}$
  - `Инвертированная (левая)`: $V_s < -\epsilon_{\text{volume}}$
  - `Компланарная (вырожденная)`: $|V_s| \le \epsilon_{\text{volume}}$
- **Regularity Badge:** Highlights `Правильный тетраэдр` when $(L_{\max} - L_{\min})/R \le 10^{-4}$.

### Section 5: Causal Dependencies
- Highlights the causal consequences of moving the active vertex:
  - **Affected Elements:** 3 incident edges and 3 incident faces.
  - **Invariant Elements:** 1 disjoint edge and 1 opposite face (verified invariant).

### Section 6: Educational Learning Panel
- Clear, mathematically rigorous narrative in Russian.
- Explains the geometric meaning of current metrics, sign of volume, and causal propagation.

### Section 7: Engineering Diagnostics (Collapsible Accordion)
- **Canonical Coordinates Table:** Raw Cartesian values to 4 decimal places.
- **Deterministic Hash:** Current FNV-1a 32-bit `geometrySignature`.
- **Active Tolerances:** Live scale-aware parameters derived from radius $R$.
- **Persistent Topology:** 4V / 6E / 4F combinatorial specification.
