# M1.5 — Visual Client & Human Visual Workbench Specification
## 3D Dynamic Geometry Reasoning Stand

**Status**: Verified & Implemented  
**Milestone**: M1.5 Visual Client Rebuild  
**Core Authority**: Milestone 1 Canonical Geometry State (`CanonicalGeometryState`)  
**Interface Language**: Russian Educational Terminology (Русский обучающий интерфейс)

---

### 1. Visual Architecture Overview

The M1.5 Visual Client transforms the Dynamic 3D Geometry Reasoning Stand from a pure engineering diagnostics screen into a **Human Visual Workbench** where the 3D geometric construction is the primary focus.

The architecture strictly maintains a three-tier separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEVEL 1: GEOMETRY VIEW                       │
│      Dominant Interactive 3D Viewport (Sphere + Tetrahedron)    │
│      Canvas 2D Subpixel Depth-Sorted Perspective Engine         │
│      Parallels, Meridians, Equator, Poles, Fixed XYZ Triad      │
│      Direct on-sphere vertex manipulation + Camera Orbit/Zoom   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│                    LEVEL 2: LEARNING VIEW                       │
│   ┌───────────────────────────┐   ┌───────────────────────────┐ │
│   │     MEASUREMENT PANEL     │   │      LEARNING PANEL       │ │
│   │ Russian Educational Terms │   │ Dynamic Causal Narrative  │ │
│   │ A/B/C/D, Edges, Faces,    │   │ Incident vs Invariant     │ │
│   │ Vs, Surface, Centroid     │   │ Mathematical Principles   │ │
│   └───────────────────────────┘   └───────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│               LEVEL 3: ENGINEERING / DEBUG VIEW                 │
│         Collapsible M1 Diagnostic Accordion (Secondary)         │
│         Canonical State JSON, FNV-1a Hash, Pkg 06 Tolerances    │
│         Topology Invariance Proofs & 17/17 M1 Verification      │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Scene Model

The main 3D visual scene consists of:
1. **Sphere Container $S^2(O, R)$**:
   - Fixed geometric container centered at $O(0,0,0)$ with radius $R$.
   - Radial depth gradient and translucent rim lighting to make spherical curvature immediately obvious.
2. **Spherical Coordinate Grid**:
   - Parallels (latitude lines at $-60^\circ, -30^\circ, 0^\circ, 30^\circ, 60^\circ$).
   - Equator highlighted in cyan (`rgba(6, 182, 212, 0.85)`) with an on-screen label.
   - Meridians (longitude lines every $30^\circ$, with Prime Meridian subtly emphasized).
   - North Pole ($+Z$) and South Pole ($-Z$) with labeled markers.
3. **General Inscribed Tetrahedron $ABCD$**:
   - Four persistent vertices $A, B, C, D$ constrained to $|P - O| = R$.
   - Six straight Euclidean edges ($AB, AC, AD, BC, BD, CD$) rendered as chords.
   - Four planar triangular faces ($ABC, ABD, ACD, BCD$) with depth-sorted painter's occlusion and normal shading.
   - Centroid $G = (A+B+C+D)/4$ rendered within the tetrahedral volume.
4. **Global XYZ Reference Frame**:
   - Located in the bottom-left corner of the viewport.
   - Fixed in world coordinate space: Red for $+X$, Green for $+Y$, Blue for $+Z$.
   - Projects according to the current camera azimuth and elevation, remaining strictly decoupled from vertex motions.

---

### 3. Interaction Model

1. **Equal Vertex Semantics**:
   - Every vertex ($A, B, C, D$) can be selected and manipulated via identical interaction semantics.
   - No privileged vertex exists in the state model.
2. **Direct Sphere Manipulation**:
   - Grabbing any vertex on the canvas casts a ray from the camera through the cursor onto $S^2(O, R)$.
   - The intersection point is converted to canonical Cartesian coordinates and normalized to $|P - O| = R$.
   - If the ray misses the silhouette, a horizon fallback ensures continuous, glitch-free dragging.
3. **Precision Degree Controls**:
   - Latitude $\phi \in [-90^\circ, 90^\circ]$ and longitude $\lambda \in [0^\circ, 360^\circ)$ sliders and degree inputs for precise numerical experimentation.
4. **Preset State Explorations**:
   - *Правильный тетраэдр*: Special symmetric state ($V_s > 0, \Delta L/R \le \epsilon_{\text{reg}}$).
   - *Левая ориентация*: Inverted configuration ($V_s < 0$).
   - *Вырожденный*: Coplanar configuration on the equator ($V_s = 0$).
   - *Околовырожденный*: Near-degenerate state demonstrating tolerance boundary behavior.

---

### 4. Camera Model

The mathematical camera model is strictly isolated in `VisualizationState`:
- **Parameters**: `azimuth` ($\theta \in [0, 2\pi)$), `elevation` ($\psi \in [-\pi/2+\epsilon, \pi/2-\epsilon]$), `distance` ($d \in [180, 800]$), `target` ($O$).
- **Perspective Projection**: Converts world points to eye space, applies perspective division, and generates screen coordinates with depth.
- **Strict Invariance**: Camera operations (orbit, zoom, pan, preset changes) NEVER mutate `CanonicalGeometryState`, the geometry hash, or topological invariants.

---

### 5. Semantic Causal Dependency Visualization

When an element (e.g., vertex $D$) is selected, the application visually and textually communicates the causal neighborhood:
- **Selected Vertex**: Emphasized with pulsating amber halo and selection badge.
- **Affected Edges**: The 3 incident edges ($AD, BD, CD$) glow in vibrant amber.
- **Affected Faces**: The 3 incident faces ($ABD, ACD, BCD$) are shaded with amber highlights.
- **Invariant Branch**: The opposite face ($ABC$) and non-incident edges ($AB, AC, BC$) remain visually identifiable in neutral/cool muted styling.
- **Dynamic Educational Text**: Automatically generates explanation in Russian:
  - *"Вершина D находится на поверхности сферы S²(O, R)."*
  - *"При перемещении D изменяются рёбра AD, BD и CD, а также грани ABD, ACD и BCD."*
  - *"Противолежащая грань ABC и рёбра AB, AC, BC остаются абсолютно инвариантными."*

---

### 6. Measurement Panel (Russian Educational Language)

Provides real-time mathematical measurements derived deterministically from the canonical state:
- **Вершины**: $A, B, C, D$ with latitude $\phi$, longitude $\lambda$, and Cartesian $(x,y,z)$.
- **Рёбра**: Chords $AB, AC, AD, BC, BD, CD$ with exact Euclidean lengths.
- **Грани**: Triangles $ABC, ABD, ACD, BCD$ with planar areas and perimeters.
- **Глобальные величины**:
  - Объём со знаком $V_s$
  - Суммарная площадь поверхности
  - Координаты центроида $G$
  - Радиус сферы $R$
  - Допустимость: Допустимый / Вырожденный
  - Ориентация: Правая ($V_s > 0$) / Левая ($V_s < 0$) / Компланарная ($V_s = 0$)
  - Форма: Правильный тетраэдр (специальное состояние) / Произвольный

---

### 7. Automated Test Suites

1. **M1 Canonical Core Suite (`test:m1`)**:
   - 17/17 tests passing (T01 through T17).
2. **M1.5 Visual Client Suite (`test:client`)**:
   - C01: Camera mutations do not alter canonical geometry state or signature.
   - C02: Preserve persistent vertex identities when vertex is moved.
   - C03: Movement via spherical coordinates preserves $|P - O| = R$ within $10^{-12}$.
   - C04: Selecting D identifies affected (AD,BD,CD,ABD,ACD,BCD) and unaffected (AB,AC,BC,ABC).
   - C05: Selecting A identifies incident edges (AB,AC,AD), incident faces (ABC,ABD,ACD), and opposite face BCD.
   - C06: Selecting edge AB identifies adjacent faces (ABC, ABD) and disjoint edges.
   - C07: Derived metrics accurately compute edge lengths and signed volume.
   - C08: All 4 vertices (A, B, C, D) have identical mutation semantics and validations.
   - C09: Planar configuration produces COPLANAR orientation and degenerate realization.
   - C10: Inverted configuration produces NEGATIVE orientation (VALID_NEGATIVE).
- **Total Tests Executed**: 27 (27 Passed, 0 Failed).

---

### 8. Manual Browser Interaction Status

Per Section 25 requirement:
```
MANUAL BROWSER INTERACTION: NOT EXECUTED
```
*(Automated test suites executed deterministically in sandbox environment; live browser manual interaction is ready for human evaluation via the AI Studio preview URL).*

---

### 9. Known Limitations & Next Steps

1. Inscribed tetrahedron is currently restricted to straight Euclidean edges (Package 03); spherical geodesic arcs will be addressed in subsequent milestones.
2. WebGL shaders are not required at this stage; Canvas 2D subpixel renderer provides high performance without context loss.
