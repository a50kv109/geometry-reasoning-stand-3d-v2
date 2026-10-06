# Package 03: Deterministic Engine & Classification
**Type:** Architectural Transfer Specification & Computational Model  
**Status:** Ingested & Frozen  
**Core Domain:** Derivations, Signed Volume, Face Metrics, Degeneracy, Regularity

---

## 1. Deterministic Derivation Pipeline

The deterministic engine executes an immutable, feed-forward derivation sequence:
$$\text{Environment } S^2(O, R) \to \text{Vertices } (A,B,C,D) \to \text{Edges } (6) \to \text{Faces } (4) \to \text{Metrics } \to \text{Validity } \to \text{Predicates}$$

The engine operates on full recomputation as its authoritative baseline oracle.

---

## 2. Mathematical Metrics & Formulas

### 2.1. Edge Chord Lengths
For each canonical pair $(V_i, V_j) \in E$:
$$L_{ij} = \|V_j - V_i\|_2 = \sqrt{(x_j - x_i)^2 + (y_j - y_i)^2 + (z_j - z_i)^2}$$

### 2.2. Planar Face Metrics
For face $F = (P, Q, S)$:
- **Edge vectors:** $\mathbf{u} = Q - P, \quad \mathbf{v} = S - P$
- **Cross product vector:** $\mathbf{w} = \mathbf{u} \times \mathbf{v}$
- **Face Area:** $S_F = \frac{1}{2} \|\mathbf{w}\|_2$
- **Face Perimeter:** $P_F = \|Q - P\| + \|S - Q\| + \|P - S\|$
- **Unit Normal Vector:**
  $$\vec{n}_F = \begin{cases} \frac{\mathbf{w}}{\|\mathbf{w}\|_2} & \text{if } S_F > \epsilon_{\text{face}} \\ \text{UNDEFINED} & \text{if } S_F \le \epsilon_{\text{face}} \end{cases}$$

### 2.3. Signed Volume of Inscribed Tetrahedron
$$V_s = \frac{1}{6} \det \begin{pmatrix} B_x - A_x & C_x - A_x & D_x - A_x \\ B_y - A_y & C_y - A_y & D_y - A_y \\ B_z - A_z & C_z - A_z & D_z - A_z \end{pmatrix} = \frac{1}{6} [(B - A) \cdot ((C - A) \times (D - A))]$$

- Absolute Volume: $V_{\text{abs}} = |V_s|$.
- Orientation:
  - $V_s > +\epsilon_{\text{volume}} \implies$ **Right-Handed / Positive Orientation** (`VALID_POSITIVE`).
  - $V_s < -\epsilon_{\text{volume}} \implies$ **Left-Handed / Inverted Orientation** (`VALID_NEGATIVE`, fully valid geometry).
  - $|V_s| \le \epsilon_{\text{volume}} \implies$ **Degenerate / Coplanar Configuration** (`DEGENERATE`).

### 2.4. Tetrahedron Centroid
$$G = \frac{A + B + C + D}{4}$$
*Note: Centroid $G$ is mathematically decoupled from sphere center $O(0,0,0)$. For an arbitrary inscribed tetrahedron, $G = O$ if and only if the tetrahedron is regular.*

### 2.5. Regularity Predicate
A tetrahedron is regular if and only if all six Euclidean edges are of equal length:
$$\Delta L = L_{\max} - L_{\min} \le \text{EPS\_REGULARITY} \cdot R$$
For a regular tetrahedron inscribed in $S^2(O, R)$, $L = R \sqrt{\frac{8}{3}} \approx 1.63299 R$, and $V_s = \frac{8\sqrt{3}}{27} R^3 \approx 0.51320 R^3$.

---

## 3. Local Face-Center Classification (Package 03 Contract)

For each face $F$, distance from origin $O$ to face plane $d_F = |O \cdot \vec{n}_F - d|$ classifies relation:
- `CENTER_IN_FACE`: $d_F \le \epsilon_{\text{plane}}$ and projected center lies inside closed triangle.
- `CENTER_IN_FACE_PLANE_OUTSIDE`: $d_F \le \epsilon_{\text{plane}}$ and projected center lies outside triangle.
- `CENTER_OUTSIDE_FACE_PLANE`: $d_F > \epsilon_{\text{plane}}$.
- `CENTER_TO_FACE_UNDEFINED`: face is degenerate ($S_F \le \epsilon_{\text{face}}$).
