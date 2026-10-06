# Geometric Model

## 1. Mathematical World Definition

The universe of the stand consists of a single fixed Euclidean sphere $S^2(O, R)$ in $\mathbb{R}^3$:

$$\mathcal{S} = \left\{ P \in \mathbb{R}^3 \mid \|P - O\|_2 = R \right\}$$

- **Center $O$:** Canonical Cartesian origin $(0, 0, 0)$.
- **Radius $R > 0$:** Characteristic scale length of the universe.
- **Reference Frame:** Right-handed orthogonal frame $(+X, +Y, +Z)$ where $+Z$ is the polar axis, and $+X$ intersects the equator at the prime meridian.

---

## 2. Combinatorial Topology vs. Geometric Realization vs. Validity

The geometric model strictly decouples three conceptual levels:

```text
1. Combinatorial Topology
   Abstract graph / simplicial complex: 4 vertices, 6 edges, 4 faces.
   Persistent labeled identities: A, B, C, D. Completely independent of coordinates.
            │
            ▼
2. Geometric Realization
   Concrete embedding into ℝ³: Vertices A, B, C, D ∈ S²(O, R).
   Edges as straight Euclidean line segments (chords).
   Faces as flat planar Euclidean triangles.
            │
            ▼
3. Geometric Validity & Classification
   Dimension-aware numerical evaluation:
   Is the solid degenerate? What is its orientation? Is it regular?
```

---

## 3. The Inscribed General Tetrahedron

The base object of the stand is the **general inscribed tetrahedron** $T = (A, B, C, D)$ with $A, B, C, D \in S^2(O, R)$.

> **Fundamental Principle:**  
> The **regular tetrahedron** is NOT a distinct geometric primitive. It is merely an infinitesimal singular point in the 5-dimensional intrinsic configuration manifold of general inscribed tetrahedra, characterized by the derived predicate `isRegular = true`.

### 3.1. Vertices (0-Simplex)
Four persistent points $V = \{A, B, C, D\}$. Each vertex possesses:
- Persistent label: `"A"`, `"B"`, `"C"`, or `"D"`.
- Cartesian coordinates: $(x, y, z) \in \mathbb{R}^3$ satisfying $|\|V_i - O\| - R| \le \epsilon_{\text{sphere}}$.
- Dual spherical representation: Latitude $\phi \in [-\pi/2, \pi/2]$, Longitude $\lambda \in [0, 2\pi)$.

### 3.2. Edges (1-Simplex)
Six straight Euclidean line segments connecting vertex pairs:
$$E = \{ AB, AC, AD, BC, BD, CD \}$$
- **Straight Chords:** Edges cut directly through the interior of the sphere; they are **not** spherical arcs on the surface.
- **Chord Length:** $L_{ij} = \|V_j - V_i\|_2$.
- **Bounds:** For points on $S^2(O, R)$, $0 \le L_{ij} \le 2R$. Maximum length $2R$ occurs if and only if $V_i$ and $V_j$ are antipodal.

### 3.3. Faces (2-Simplex)
Four flat planar triangles bounded by triples of vertices:
$$F = \{ ABC, ABD, ACD, BCD \}$$
- **Planar Euclidean Surfaces:** Faces are flat triangles slicing the sphere interior; they are **not** spherical caps.
- **Face Area:** For triangle with vertices $P, Q, S$:
  $$S_F = \frac{1}{2} \|(Q - P) \times (S - P)\|_2$$
- **Perimeter:** $P_F = \|Q - P\| + \|S - Q\| + \|P - S\|$.
- **Unit Normal:** $\vec{n}_F = \frac{(Q - P) \times (S - P)}{\|(Q - P) \times (S - P)\|}$, strictly defined when $S_F > \epsilon_{\text{face}}$, and `UNDEFINED` otherwise.

---

## 4. Solid Metrics & Global Predicates

### 4.1. Signed Volume ($V_s$)
Computed via the scalar triple product:
$$V_s = \frac{1}{6} \det \begin{pmatrix} B - A \\ C - A \\ D - A \end{pmatrix} = \frac{1}{6} \left[ (B - A) \cdot ((C - A) \times (D - A)) \right]$$

### 4.2. Orientation & Realization Classification
Volume sign determines the geometric orientation of the solid:

| Realization Status | Mathematical Condition | Interpretation | Valid Geometry? |
| :--- | :--- | :--- | :---: |
| **`VALID_POSITIVE`** | $V_s > +\epsilon_{\text{volume}}$ | Standard right-handed orientation. | **YES** |
| **`VALID_NEGATIVE`** | $V_s < -\epsilon_{\text{volume}}$ | Inverted left-handed orientation. | **YES** |
| **`DEGENERATE`** | $|V_s| \le \epsilon_{\text{volume}}$ | All four vertices are coplanar ($V_s = 0$). | **YES** (Zero volume) |
| **`VERTEX_COINCIDENT`** | $\exists i \ne j : \|V_i - V_j\| \le \epsilon_{\text{coincident}}$ | Two or more vertices coincide. | **YES** (Degenerate) |

> **Orientation Contract:** An inverted tetrahedron ($V_s < 0$) is completely valid Euclidean geometry. The stand never rejects negative-volume configurations as errors.

### 4.3. Total Surface Area
$$S_{\text{total}} = S_{ABC} + S_{ABD} + S_{ACD} + S_{BCD}$$

### 4.4. Centroid ($G$)
The center of mass of the four vertices:
$$G = \frac{A + B + C + D}{4}$$
- For a general tetrahedron, $G$ varies continuously throughout the interior of the ball $B^3(O, R)$.
- $G = O$ if and only if the inscribed tetrahedron is regular.

---

## 5. The Regularity Invariant

A tetrahedron is regular if and only if all six edge chords are equal in length:
$$L_{AB} = L_{AC} = L_{AD} = L_{BC} = L_{BD} = L_{CD}$$

### Scale-Normalized Regularity Formula
To preserve scale invariance across any radius $R$, the stand defines:
$$\Delta L_{\text{norm}} = \frac{L_{\max} - L_{\min}}{R} \le \text{EPS\_REGULARITY} \quad (10^{-4})$$

### Canonical Regular Configuration Invariants
When $T$ is regular and inscribed in $S^2(O, R)$:
- **Edge Length:** $L = R \sqrt{\frac{8}{3}} \approx 1.632993161855 \cdot R$
- **Face Area:** $S_F = \frac{\sqrt{3}}{4} L^2 = \frac{2\sqrt{3}}{3} R^2 \approx 1.154700538379 \cdot R^2$
- **Total Surface Area:** $S_{\text{total}} = \frac{8\sqrt{3}}{3} R^2 \approx 4.618802153517 \cdot R^2$
- **Signed Volume:** $V_s = \frac{L^3}{6\sqrt{2}} = \frac{8\sqrt{3}}{27} R^3 \approx 0.513200239279 \cdot R^3$
- **Centroid:** $G = O(0, 0, 0)$ exactly.
- **Mutual Angular Separation:** $\arccos(-1/3) \approx 109.4712^\circ$ between vertex radius vectors.
