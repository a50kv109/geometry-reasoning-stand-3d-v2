# M1.7: Geometric Scale Control & Vertex Coordinate Guides

## 1. Executive Summary & Design Principle

M1.7 introduces two visual and cognitive enhancements to the **Dynamic 3D Geometry Reasoning Stand** while preserving the canonical geometry core:

1. **Geometry View Scale Control**:
   - Allows users to scale the geometry (sphere + inscribed tetrahedron) within the viewport to **100% (default)**, **75%**, **50%**, and **Fit**.
   - Solves viewport crowding and gives the user generous breathing room around the sphere.
   - **Architectural Invariant**: Changing visual scale modifies *only* the viewport projection pixel multiplier (`scaleMultiplier = targetPixelRadius / R * visualScale`). The canonical Cartesian coordinates of vertices $A, B, C, D$, the sphere radius $R$, the signed volume $V_s$, the edge lengths, and the deterministic geometric signature remain strictly invariant.

2. **Vertex Coordinate Guides (Parallel & Meridian on $S^2$)**:
   - Visualizes the latitude parallel and longitude meridian corresponding to any vertex on the sphere.
   - When a vertex (e.g., $B$) is selected or dragged, a parallel circle (at latitude $\phi_B$) and a meridian half-great-circle (at longitude $\lambda_B$, running from the South Pole $S$ to the North Pole $N$) appear on the sphere.
   - Turns the sphere into a 3D coordinate board where moving a vertex demonstrates immediate causal linkage:
     $$\text{Vertex Move} \implies (\phi, \lambda)\text{ change} \implies \text{coordinate curves shift} \implies \text{incident tetrahedron edges/faces change}.$$
   - Coordinates are visually badged directly next to the active vertex on screen (`B: φ = -19.5°, λ = 0.0°`) and explained in the educational panel.

---

## 2. Mathematical Definition & Projection

### 2.1. Coordinate Invariants

For sphere $S^2(O, R)$ with center $O=(O_x, O_y, O_z)$ and radius $R$:
Given a point $P = (P_x, P_y, P_z) \in S^2(O, R)$, spherical coordinates $(\phi, \lambda)$ are derived by:
$$\sin \phi = \frac{P_z - O_z}{R}, \quad \phi = \arcsin(\sin \phi) \in \left[-\frac{\pi}{2}, \frac{\pi}{2}\right]$$
$$\lambda = \operatorname{atan2}(P_y - O_y, P_x - O_x) \pmod{2\pi} \in [0, 2\pi)$$
With canonical pole singularity convention: if $|\phi| = \frac{\pi}{2}$, $\lambda = 0$.

### 2.2. Parallel Circle (Latitude Guide)
The latitude parallel circle passing through $P$ is parameterized by $\theta \in [0, 2\pi)$:
$$\mathbf{C}_{\text{lat}}(\theta) = \begin{pmatrix} O_x + R \cos \phi \cos \theta \\ O_y + R \cos \phi \sin \theta \\ O_z + R \sin \phi \end{pmatrix}$$
This circle lies entirely on $S^2(O, R)$, has radius $r_{\text{parallel}} = R \cos \phi$, and plane equation $z = O_z + R \sin \phi$.

### 2.3. Meridian Arc (Longitude Guide)
The longitude meridian arc passing through $P$ connects the South Pole $S(O_x, O_y, O_z - R)$ and North Pole $N(O_x, O_y, O_z + R)$:
$$\mathbf{C}_{\text{lon}}(\phi') = \begin{pmatrix} O_x + R \cos \phi' \cos \lambda \\ O_y + R \cos \phi' \sin \lambda \\ O_z + R \sin \phi' \end{pmatrix}, \quad \phi' \in \left[-\frac{\pi}{2}, \frac{\pi}{2}\right]$$

### 2.4. Depth-Aware Curve Rendering
To preserve 3D clarity, each curve segment is tested against the view direction:
- Eye-space coordinate $z_{\text{eye}} = (\mathbf{C} - \mathbf{E}) \cdot \mathbf{v}_{\text{forward}}$.
- Front hemisphere segments (facing the camera) are rendered as crisp, glowing lines with primary color.
- Back hemisphere segments (occluded by the sphere body) are rendered with dashed line style and 35% opacity.

---

## 3. UI Controls & Synchronization

1. **Bottom-Left Viewport Toolbar**:
   - `[ Масштаб: Fit | 100% | 75% | 50% ]`
   - `scale-fit-btn`: Resets camera to standard isometric view and restores `visualScale = 1.0`.
   - `scale-100-btn`, `scale-75-btn`, `scale-50-btn`: Instantly scales the projection without mutating state.
   - Screen raycasting and vertex hit-testing dynamically scale with `visualScale`, ensuring that grabbing vertices on 50% scale is as accurate as on 100% scale.

2. **Top-Right Viewport Display Toggles**:
   - `toggle-vertex-guides-btn` (Compass icon): Toggles vertex coordinate guides on/off.
   - `toggle-all-guides-btn`: Switches guide display between "Активная" (active vertex only) and "Все" (all 4 vertices simultaneously).

3. **Sidebar Educational Panel (LearningPanel)**:
   - Contains a dedicated narrative card explaining the active vertex's exact $(\phi, \lambda)$ values.
   - Highlights that the parallel is perpendicular to the $Z$-axis and parallel to the equator, and that the meridian connects the North and South poles through the vertex.
