# Local Spherical Manifold (LSM) & Глобус локальной угловой геометрии (LVG Inspector)

## 1. Overview & Architectural Role

The **Глобус локальной угловой геометрии** (архитектурно: **Local Spherical Manifold (LSM) / LVG Inspector**) is an interactive visual and diagnostic instrument integrated into the **Dynamic 3D Geometry Reasoning Stand**.

### Two-Tier Naming Architecture:
1. **Пользовательский уровень (UI / Человеко-ориентированный интерфейс):**
   - Кнопка вызова: **`[ 🌐 Глобус углов D ]`** (компактный доступ к локальной угловой геометрии активной вершины).
   - Заголовок инспектора: **«Глобус локальной угловой геометрии — вершина D»** (подзаголовок `LVG / LSM · D`).
   - Назначение для пользователя: инспектор отображает **всю локальную угловую структуру вершины**:
     - три пространственных направления инцидентных рёбер $\mathbf{u}_{DA}, \mathbf{u}_{DB}, \mathbf{u}_{DC}$;
     - три плоских угла $\angle ADB, \angle BDC, \angle CDA$;
     - взаимную ориентацию и геодезический треугольник;
     - телесный угол $\Omega(D)$ и определитель Грама $\det(G)$;
     - динамическое поведение в реальном времени при перемещении вершин.
2. **Математический и инженерный уровень (Codebase & Architecture):**
   - **LSM** (*Local Spherical Model / Local Spherical Manifold*): локальная единичная сфера $S^2(v)$ со сферической системой координат.
   - **LVG** (*Local Vertex Geometry*): математическая структура данных, содержащая инцидентные векторы, углы, матрицу Грама, телесный угол и статус вырожденности.

While the primary 3D viewport visualizes the global tetrahedron inscribed in the world sphere $S^2(O, R)$, the LSM Inspector visualizes the intrinsic angular structure around a single selected vertex $v \in \{A, B, C, D\}$ by projecting its three incident edges onto a local unit sphere:
$$S^2(v) = \{ \mathbf{p} \in \mathbb{R}^3 \mid \|\mathbf{p} - \mathbf{v}\| = 1 \}$$

### Core Architectural Principle: Physical Globe Model Separation

$$\boxed{\text{Geometry State} = \text{CONSTANT}} \quad \iff \quad \boxed{\text{Observer View Orientation} = \text{MODEL ROTATION IN HANDS}}$$

1. **Geometry State Invariance:**
   - The canonical vertex coordinates, incident unit directions $\mathbf{u}_{vj}$, planar angles $\alpha_{jk}$, dihedral angles $\theta_{jk}$, and solid angle $\Omega(v)$ are fixed, intrinsic, and immutable for any given state of the tetrahedron.
   - The local coordinate system of the sphere $S^2(v)$ has fixed poles $N = (0, 1, 0)$, $S = (0, -1, 0)$, fixed equator, fixed parallels, and fixed meridians.
   - The incident unit directions $\mathbf{u}_{vj}$ are pinned landmarks on the surface of this local sphere.

2. **Observer View Orientation (Rotating the Physical Globe):**
   - The user holds the miniature **physical globe on a stand** and rotates it in hands:
     $$\mathbf{p}_{\text{screen}} = \mathbf{P}_{\text{proj}} \cdot R_x(\theta_{\text{pitch}}) \cdot R_y(\psi_{\text{yaw}}) \cdot \mathbf{p}_{\text{intrinsic}}$$
   - **Nothing in the geometry is recalculated or altered during this rotation.**
   - The coordinate grid (poles $N$ and $S$, equator, parallels, meridians) and the pinned vectors $\mathbf{u}_{vj}$ rotate **rigidly together** with the globe body as the observer changes their viewing orientation.
   - **Strict SSOT Pipeline:** It is evaluated as a pure deterministic mapping:
     $$\text{CanonicalGeometryState} \xrightarrow{\text{computeLVG}} \text{LVG}(v) \xrightarrow[\text{Observer Orientation}]{} \text{LsmInspector (Physical Globe)}$$
   - **Zero Reverse-Write:** All slider, touch-drag, and preset interactions manipulate only visualization view orientation $(\psi, \theta)$, leaving canonical geometry state strictly untouched.

---

## 2. Mathematical Foundations

### 2.1. Incident Chords & Direction Rays
For any vertex $v \in \{A, B, C, D\}$, let its three incident neighbor vertices be $\{j_1, j_2, j_3\} \subset \{A, B, C, D\} \setminus \{v\}$.
The incident Euclidean chords are:
$$\mathbf{e}_{vj} = \mathbf{v}_j - \mathbf{v}$$

Their Euclidean lengths are:
$$L_{vj} = \|\mathbf{e}_{vj}\|_2$$

The unit direction vectors intersecting the local sphere $S^2(v)$ are:
$$\mathbf{u}_{vj} = \frac{\mathbf{e}_{vj}}{L_{vj}} \in S^2(v)$$

### 2.2. The Gram Matrix
The spatial relationship among the three incident rays is captured by the symmetric $3 \times 3$ Gram matrix $G$:
$$G_{jk} = \mathbf{u}_{vj} \cdot \mathbf{u}_{vk} = \cos \alpha_{jk}$$

The Gram determinant:
$$\det(G) = \det \begin{pmatrix} 1 & \mathbf{u}_1 \cdot \mathbf{u}_2 & \mathbf{u}_1 \cdot \mathbf{u}_3 \\ \mathbf{u}_2 \cdot \mathbf{u}_1 & 1 & \mathbf{u}_2 \cdot \mathbf{u}_3 \\ \mathbf{u}_3 \cdot \mathbf{u}_1 & \mathbf{u}_3 \cdot \mathbf{u}_2 & 1 \end{pmatrix}$$
measures the square of the scalar triple product:
$$\det(G) = \left( \mathbf{u}_1 \cdot (\mathbf{u}_2 \times \mathbf{u}_3) \right)^2$$
- When $\det(G) > 0$, the three incident vectors form a non-degenerate trihedral cone.
- When $\det(G) \le \epsilon^2$, the incident edges are coplanar (`D2_COPLANAR_EDGES`).

### 2.3. Planar Angles
The face angles between incident edges meeting at vertex $v$ are:
$$\alpha_{jk} = \arccos(\operatorname{clamp}(\mathbf{u}_{vj} \cdot \mathbf{u}_{vk}, -1, 1))$$
For a regular inscribed tetrahedron, all planar angles equal exactly:
$$\alpha_{\text{reg}} = \arccos(1/3) \approx 70.5288^\circ \approx 1.23096 \text{ rad}$$

### 2.4. Dihedral Angles
The dihedral angle $\theta_{jk}$ between the two faces meeting along edge $\mathbf{u}_{vj}$ is derived from the face normals $\mathbf{n}_F$:
$$\mathbf{n}_1 = \frac{\mathbf{u}_1 \times \mathbf{u}_2}{\|\mathbf{u}_1 \times \mathbf{u}_2\|}, \quad \mathbf{n}_2 = \frac{\mathbf{u}_1 \times \mathbf{u}_3}{\|\mathbf{u}_1 \times \mathbf{u}_3\|}$$
$$\theta = \pi - \arccos(\operatorname{clamp}(\mathbf{n}_1 \cdot \mathbf{n}_2, -1, 1))$$
For a regular tetrahedron, each dihedral angle is $\arccos(1/3) \approx 70.5288^\circ$.

### 2.5. Solid Angle $\Omega(v)$ & Spherical Excess
The solid angle $\Omega(v)$ subtended by the trihedral cone at vertex $v$ is computed via the continuous **Oosterom-Strackee formula** using two-argument arctangent:
$$\tan\left(\frac{\Omega}{2}\right) = \frac{|\mathbf{u}_1 \cdot (\mathbf{u}_2 \times \mathbf{u}_3)|}{1 + \mathbf{u}_1 \cdot \mathbf{u}_2 + \mathbf{u}_2 \cdot \mathbf{u}_3 + \mathbf{u}_3 \cdot \mathbf{u}_1}$$
$$\Omega = 2 \operatorname{atan2}\left( |\mathbf{u}_1 \cdot (\mathbf{u}_2 \times \mathbf{u}_3)|, \, 1 + \mathbf{u}_1 \cdot \mathbf{u}_2 + \mathbf{u}_2 \cdot \mathbf{u}_3 + \mathbf{u}_3 \cdot \mathbf{u}_1 \right)$$
- Expressed in steradians ($\text{sr}$), where the full sphere is $4\pi \approx 12.5664\text{ sr}$.
- For a regular tetrahedron:
  $$\Omega_{\text{reg}} = 3 \arccos(1/3) - \pi \approx 0.55129 \text{ sr} \quad (\approx 4.387\% \text{ of } 4\pi)$$

### 2.6. Local Angular Defect
The angular defect (local discrete curvature) at vertex $v$:
$$\delta(v) = 2\pi - \sum_{i<j} \alpha_{ij}$$
By Descartes' theorem on total angular defect:
$$\sum_{v \in \{A,B,C,D\}} \delta(v) = 4\pi \chi = 4\pi$$

### 2.7. DLVM Shared-Edge Anti-Parallelism Invariant
In the Directed Local Vertex Manifold (DLVM) layer, each shared edge between vertex $v_1$ and vertex $v_2$ satisfies:
$$\mathbf{u}_{v_1 v_2}^{(v_1)} = -\mathbf{u}_{v_2 v_1}^{(v_2)}$$
The standalone GDS engine verifies this identity across all 6 chord pairs:
$$\|\mathbf{u}_{v_1 v_2}^{(v_1)} + \mathbf{u}_{v_2 v_1}^{(v_2)}\|_2 \le \varepsilon_{\text{finite}}(R)$$
ensuring mutual mathematical consistency across local coordinate frames.

### 2.8. Degeneracy Taxonomies ($D_0$ through $D_5$)
The engine classifies vertex realizations without arbitrary magic thresholds:
- **`D0_VALID`**: Normal non-degenerate cone with positive solid angle.
- **`D1_COLLINEAR_EDGE`**: Two incident edges are parallel or anti-parallel.
- **`D2_COPLANAR_EDGES`**: All three incident edges lie in a common plane ($\det(G) \le \epsilon^2$).
- **`D3_NEAR_DEGENERATE`**: Gram determinant near threshold ($\det(G) < 10^{-4}$).
- **`D4_INVERTED_ORIENTATION`**: Inverted orientation relative to canonical right-handed standard.
- **`D5_NUMERICAL_FAULT`**: Non-finite coordinates ($\text{NaN}$ or $\pm\infty$).

---

## 3. Interaction Model & Ergonomics

The LSM Inspector is integrated into the user interface through a **dual presence** model:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        STAND WORKSPACE LAYOUT                          │
│                                                                        │
│  ┌───────────────────────────────────┐ ┌─────────────────────────────┐ │
│  │      3D VIEWPORT CANVAS (~65%)    │ │    REASONING SIDEBAR (~35%) │ │
│  │                                   │ │                             │ │
│  │   [Активная вершина A] [🌐 Глобус]│ │ ┌─────────────────────────┐ │ │
│  │                 │                 │ │ │ 1. Выбор вершины        │ │ │
│  │                 ▼                 │ │ └─────────────────────────┘ │ │
│  │   ┌───────────────────────────┐   │ │ ┌─────────────────────────┐ │ │
│  │   │ FLOATING ГЛОБУС УГЛОВ HUD │   │ │ │ 2. Положение вершины A  │ │ │
│  │   │                           │   │ │ │    [🌐 Глобус углов A]  │ │ │
│  │   │ • Глобус угловой геом-рии │   │ │ │    (Раскрыт по умолч.)  │ │ │
│  │   │ • Вращение глобуса в руках│   │ │ │                         │ │ │
│  │   │ • Векторы u_AB, AC, AD    │   │ │ │ • EMBEDDED ГЛОБУС УГЛОВ │ │ │
│  │   │ • Плоские углы, Ω(A), det │   │ │ │   • Глобус 220x200 px   │ │ │
│  │   │ • Кнопка закрытия [X]     │   │ │ │   • Направляющие и углы │ │ │
│  │   └───────────────────────────┘   │ │ │   • det(G), Ω, метрики  │ │ │
│  │                                   │ │ └─────────────────────────┘ │ │
│  │                                   │ │ ┌─────────────────────────┐ │ │
│  │                                   │ │ │ 3. Измерения и объём    │ │ │
│  │                                   │ │ └─────────────────────────┘ │ │
│  └───────────────────────────────────┘ └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1. Mode 1: Embedded Sidebar Inspector
- Located in Section 2 of `VertexControlPanel.tsx`.
- **Default State:** `isLsmOpen = true` (open by default so the угловой глобус is immediately accessible without searching).
- **Toggle Button:** Prominent toggle button `[ 🌐 Глобус углов {id} ]` allowing collapse/expansion.
- **Header:** «Глобус локальной угловой геометрии — вершина {id}» с подзаголовком `LVG / LSM · {id}`.
- **Synchronized Active Vertex:** Automatically switches its inspected point $v$ whenever vertex $A, B, C,$ or $D$ is selected.

### 3.2. Mode 2: Floating Canvas HUD Overlay
- Located directly in `GeometryViewport.tsx`.
- Triggered by clicking the button `[ 🌐 Глобус углов {id} ]` alongside the active vertex indicator at the top-left of the 3D viewport canvas.
- Renders as a floating, semi-transparent frosted HUD panel (`backdrop-blur-xl bg-slate-900/95 border-sky-500/50`) with an explicit close button `[X]`.
- Provides quick inspection on mobile, tablet, or zoomed-in viewports without looking away from the 3D canvas.

### 3.3. Interactive Physical Globe on Stand Model
- **Resolution:** $220 \times 200$ pixel high-DPI canvas.
- **Physical Globe Metaphor:**
  - **Globe Stand & Mount:** Oval base pedestal, vertical support column, and semi-circular meridian mounting arc holding the axis pins.
  - **Poles:** North Pole **N** and South Pole **S** rigidly anchored on the globe's axis.
  - **Coordinate Grid:** Equator ($\phi = 0^\circ$), latitude parallels ($\pm 30^\circ$, $\pm 60^\circ$), and longitudinal meridians rigidly printed on the sphere and rotating with it.
  - **Landmark Vectors:** Three incident unit vectors $\mathbf{u}_{vj}$ pinned at fixed intrinsic coordinates on the rotating globe.
  - **Geodesic Great Circle Arcs:** Spherical triangle boundary connecting the incident directions.
- **Observer Orientation Controls (Вращение модели глобуса):**
  - **Direct Grab & Drag:** Touch or mouse drag directly on the globe body (`↻ ГЛОБУС ↺`).
  - **Azimuth Slider (Горизонтальный поворот / Yaw):** Range $-180^\circ \dots +180^\circ$ with live numerical degree readout.
  - **Pitch Slider (Наклон оси / Pitch):** Range $-85^\circ \dots +85^\circ$ with live numerical degree readout.
  - **Quick Presets:** «Спереди» ($0^\circ, 0^\circ$), «Полюс N» ($0^\circ, 85^\circ$), «Изо» ($35^\circ, 20^\circ$).
  - **Reset Button:** Quick button `↺` returning orientation to isometric default.
- **Depth Shading:** 3D ambient radial lighting, front hemisphere highlight, translucent back hemisphere paths.

### 3.4. Real-Time Dynamic Updates
When a user drags any vertex on the primary 3D canvas, the LSM Inspector updates in real time on every frame (at $60\text{ fps}$):
- Unit direction coordinates $(u_x, u_y, u_z)$ continuously recalculate.
- Incident chord lengths $|e|$ update synchronously.
- Solid angle $\Omega(v)$ and Gram determinant $\det(G)$ dynamically reflect trihedral dilation or compression.
- Planar angles adjust with degree and radian readouts.

---

## 4. Verification Evidence

The mathematical accuracy and operational stability of the LVG/LSM layer are rigorously verified by automated tests in `src/tests/lvg_dlvm_gds_temporal.test.ts`:

| Test ID | Test Contract | Expected Invariant | Status |
| :--- | :--- | :--- | :---: |
| **LVG-01** | Regular tetrahedron symmetry | $\alpha = 70.5288^\circ$, $\Omega \approx 0.5513\text{ sr}$, det(G) $> 0$ | **VERIFIED PASS** |
| **LVG-02** | Uniform scale invariance | $\Omega(\lambda R) = \Omega(R)$, $\alpha(\lambda R) = \alpha(R)$ | **VERIFIED PASS** |
| **LVG-03** | Rigid translation invariance | $\Omega(S + \mathbf{t}) = \Omega(S)$ | **VERIFIED PASS** |
| **LVG-04** | Coplanar edge degeneracy | Detects coplanar input and asserts `D2_COPLANAR_EDGES` | **VERIFIED PASS** |
| **DLVM-01** | Deterministic 4-manifold generation | Exactly 4 DLVMs generated without side effects | **VERIFIED PASS** |
| **DLVM-02** | Shared-edge anti-parallelism | $\|\mathbf{u}_{ij}^{(i)} + \mathbf{u}_{ji}^{(j)}\| \le \varepsilon_{\text{finite}}(R)$ for all 6 edges | **VERIFIED PASS** |
| **GDS-01** | State isolation | GDS snapshot generated with zero mutations to Canonical State | **VERIFIED PASS** |
