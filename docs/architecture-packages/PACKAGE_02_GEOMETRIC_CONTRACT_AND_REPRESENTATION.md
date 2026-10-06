# Package 02: Geometric Contract & Representation Model
**Type:** Architectural Transfer Specification & Geometric Protocol  
**Status:** Ingested & Frozen  
**Core Domain:** Fixed Reference Frame, Sphere $S^2$, Persistent Topology, Dual Representation

---

## 1. Fixed Global Reference Frame

The world geometry is anchored to an immutable right-handed Cartesian coordinate system:
- **Origin $O(0, 0, 0)$**: Fixed center of the reference sphere.
- **Axes $+X, +Y, +Z$**:
  - $+Z$: Passes through the North Pole ($\phi = +90^\circ$).
  - $-Z$: Passes through the South Pole ($\phi = -90^\circ$).
  - $+X$: Defines the prime meridian ($\lambda = 0^\circ$) on the equatorial plane.
  - $+Y$: Orthogonal axis at $\lambda = +90^\circ$.
- **Invariance Rule:** The global reference frame never rotates, translates, or tracks vertices.

---

## 2. Geometric Primitives & Topology

### 2.1. The Fixed Sphere $S^2(O, R)$
- Center $O \in \mathbb{R}^3$, Radius $R \in \mathbb{R}^+$ ($R > 0$).
- Equation: $(x - O_x)^2 + (y - O_y)^2 + (z - O_z)^2 = R^2$.

### 2.2. Persistent Combinatorial Topology (4V / 6E / 4F)
- **4 Vertices:** $A, B, C, D \in S^2(O, R)$. Labeled identities are persistent and immutable. Vertices are never sorted or re-indexed by coordinates.
- **6 Straight Euclidean Edges (Chords):**
  $$E = \{ AB, AC, AD, BC, BD, CD \}$$
  Edges are straight line segments in $\mathbb{R}^3$, not spherical geodesics. Length $L_{ij} = \|V_j - V_i\| \in [0, 2R]$.
- **4 Planar Faces:**
  $$F = \{ ABC, ABD, ACD, BCD \}$$
  Faces are flat Euclidean triangles in $\mathbb{R}^3$, not spherical curved triangles.

---

## 3. Dual Representation Model

The stand supports dual coordinate representations:
1. **Canonical Cartesian Coordinates (Truth):** $P = (x, y, z) \in \mathbb{R}^3$.
2. **Spherical Coordinates (Representation):** $(\phi, \lambda)$ with latitude $\phi \in [-\frac{\pi}{2}, \frac{\pi}{2}]$ and longitude $\lambda \in [0, 2\pi)$.

### Transformations:
- **Spherical $\to$ Cartesian:**
  $$x = O_x + R \cos\phi \cos\lambda, \quad y = O_y + R \cos\phi \sin\lambda, \quad z = O_z + R \sin\phi$$
- **Cartesian $\to$ Spherical:**
  $$\phi = \arcsin\left(\operatorname{clamp}\left(\frac{z - O_z}{R}, -1, 1\right)\right), \quad \lambda = \operatorname{atan2}(y - O_y, x - O_x) \pmod{2\pi}$$

### Singularity & Boundary Rules:
- **Pole Singularity:** At $\phi = \pm \frac{\pi}{2}$ (within $\text{EPS\_ANGLE}$), $\lambda$ is geometrically indeterminate; by canonical convention it is set to $0$.
- **Anti-Silent-Projection Guard:** Any Cartesian coordinate where $|\|P - O\| - R| > \epsilon_{\text{sphere}}$ must be explicitly rejected with `OUTSIDE_SPHERE`. No silent radial snapping is allowed.

---

## 4. Degrees of Freedom (DOF)

- **Unconstrained 4-Point System in $\mathbb{R}^3$:** $4 \times 3 = 12$ DOFs.
- **Sphere Constraint ($\|V_i - O\| = R$):** 4 constraints $\implies 8$ coordinate DOFs ($4 \times (\phi, \lambda)$).
- **Intrinsic Rigid Configuration ($SO(3)$ Quotient):** $8 - 3 = 5$ intrinsic geometric DOFs for an inscribed tetrahedron at fixed $R$.
