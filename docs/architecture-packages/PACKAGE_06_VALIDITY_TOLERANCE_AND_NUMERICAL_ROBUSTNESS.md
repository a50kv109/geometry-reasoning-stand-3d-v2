# Package 06: Validity, Tolerance & Numerical Robustness Contract
**Type:** Architectural Transfer Specification & Numerical Policy  
**Status:** Ingested & Frozen  
**Core Domain:** Scale-Aware Tolerances, Physical Dimensions, Numerical Precedence, Invariants

---

## 1. Central Tolerance Principle

$$\text{ONE GEOMETRY} \quad | \quad \text{ONE DETERMINISTIC CORE} \quad | \quad \text{ONE TOLERANCE POLICY} \quad | \quad \text{MANY CLIENTS}$$

Ad-hoc, hardcoded epsilon constants are strictly prohibited. Every tolerance is dimensionally derived from the characteristic scale $L_{\text{scale}} = R$.

---

## 2. Dimensional Scaling Table

| Tolerance Key | Dimension | Formula | Default Constant ($c$) | Base Value ($R=1$) |
| :--- | :---: | :---: | :---: | :---: |
| **`epsSphere`** | $\mathsf{L}^1$ | $c_{\text{sphere}} \cdot R$ | $10^{-6}$ | $10^{-6}$ |
| **`epsCoincident`** | $\mathsf{L}^1$ | $c_{\text{coincident}} \cdot R$ | $10^{-6}$ | $10^{-6}$ |
| **`epsPlane`** | $\mathsf{L}^1$ | $c_{\text{plane}} \cdot R$ | $10^{-6}$ | $10^{-6}$ |
| **`epsFace`** | $\mathsf{L}^2$ | $c_{\text{face}} \cdot R^2$ | $10^{-6}$ | $10^{-6}$ |
| **`epsVolume`** | $\mathsf{L}^3$ | $c_{\text{volume}} \cdot R^3$ | $10^{-7}$ | $10^{-7}$ |
| **`epsRegularity`** | $\mathsf{L}^0$ | $c_{\text{reg}}$ (dimensionless) | $10^{-4}$ | $10^{-4}$ |
| **`epsAngle`** | $\mathsf{L}^0$ | $c_{\text{angle}}$ (radians) | $10^{-6}$ | $10^{-6}$ |

---

## 3. Regularity Tolerance Invariant

The canonical regularity formula is strictly normalized by radius $R$:
$$\frac{L_{\max} - L_{\min}}{R} \le \text{EPS\_REGULARITY}$$

Because for a regular tetrahedron inscribed in $S^2(O, R)$, $L = R\sqrt{8/3} \approx 1.63299 R$, this formula guarantees strict scale invariance across all valid sphere radii $R \in [10^{-6}, 10^6]$.

---

## 4. Periodic Angle Metric

Longitude comparison across the $0^\circ / 360^\circ$ branch cut is governed by the periodic geodesic distance:
$$\Delta_\lambda = \min(|\lambda_1 - \lambda_2|, 2\pi - |\lambda_1 - \lambda_2|) \le \text{EPS\_ANGLE}$$

---

## 5. Numerical Precedence Pipeline

All validations adhere to a strict evaluation order:
1. **Finiteness Check:** Coordinates must be finite ($\ne \text{NaN}, \ne \pm\infty$).
2. **Sphere Radius Validity:** $R > 0$ and $R$ is finite.
3. **Sphere Membership:** $|\|V_i - O\| - R| \le \epsilon_{\text{sphere}}$.
4. **Vertex Distinctness:** $\|V_j - V_i\| > \epsilon_{\text{coincident}}$ for all pairs $i \ne j$.
5. **Dimensional Tolerance Scaling:** Compute scale factors $R, R^2, R^3$.
6. **Primitive Evaluation:** Compute lengths, cross products, signed volume.
7. **Orientation & Solid Realization:** Classify into `VALID_POSITIVE`, `VALID_NEGATIVE`, or `DEGENERATE`.
8. **Regularity Predicate:** Test $(L_{\max} - L_{\min})/R \le \text{EPS\_REGULARITY}$.
