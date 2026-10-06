# M1: CANONICAL 3D GEOMETRY STATE SPECIFICATION

**Project:** Dynamic 3D Geometry Reasoning Stand  
**Milestone:** M1 — Canonical 3D Geometry State Implementation  
**Status:** COMPLETE  
**Date:** 2026-09-13  

---

## 1. Canonical State

The system enforces **ONE GEOMETRY, ONE CANONICAL STATE, MANY CLIENTS**.

The canonical geometry state is defined strictly by the Cartesian model:
$$\mathcal{S}_{\text{canonical}} = \left( O, R, A, B, C, D \right)$$
where:
* Sphere Center: $O \in \mathbb{R}^3$ (canonically $(0, 0, 0)$ in the fixed global reference frame).
* Sphere Radius: $R \in \mathbb{R}_{> 0}$.
* Four Vertices: $A, B, C, D \in S^2(O, R)$ such that:
  $$\forall V \in \{A, B, C, D\}, \quad |\|V - O\| - R| \le \epsilon_{\text{sphere}}$$

All canonical objects are deeply frozen (`Object.freeze`) and immutable.

---

## 2. Canonical Entities

The base geometric object is a **GENERAL INSCRIBED TETRAHEDRON**. It is NOT constrained to be regular. Regularity is strictly a derived predicate evaluated in later engine phases.

* **Point3D:** `{ readonly x: number; readonly y: number; readonly z: number }`
* **Sphere3D:** `{ readonly center: Point3D; readonly radius: number }`
* **CanonicalGeometryState:** `{ readonly sphere: Sphere3D; readonly vertices: Readonly<Record<VertexId, Point3D>> }`

---

## 3. Persistent Tetrahedral Topology

The combinatorial structure is persistent, closed, and independent of coordinates or motion:
* **4 Vertices:** $A, B, C, D$
* **6 Edges:** $AB, AC, AD, BC, BD, CD$
* **4 Faces:** $ABC, ABD, ACD, BCD$

### Topological Incident Maps:
* $\text{Edges}(A) = \{AB, AC, AD\}$, $\text{Edges}(B) = \{AB, BC, BD\}$, $\text{Edges}(C) = \{AC, BC, CD\}$, $\text{Edges}(D) = \{AD, BD, CD\}$
* $\text{Faces}(A) = \{ABC, ABD, ACD\}$, $\text{Faces}(B) = \{ABC, ABD, BCD\}$, $\text{Faces}(C) = \{ABC, ACD, BCD\}$, $\text{Faces}(D) = \{ABD, ACD, BCD\}$
* $\text{OppositeFace}(A) = BCD$, $\text{OppositeFace}(B) = ACD$, $\text{OppositeFace}(C) = ABD$, $\text{OppositeFace}(D) = ABC$
* $\text{OppositeEdge}(AB) = CD$, $\text{OppositeEdge}(AC) = BD$, $\text{OppositeEdge}(AD) = BC$

**Invariant:** When vertices move, geometric realization and metric validity change, but combinatorial topology remains strictly invariant.

---

## 4. Identity Rules

* Persistent named entities: $A, B, C, D$.
* Moving a vertex never alters its semantic identifier.
* Vertices are **never** sorted or re-indexed by latitude, longitude, Cartesian coordinates, distance, or chronological order.
* Semantic identities are preserved across all state transitions.

---

## 5. Validity Boundary & Epistemic Taxonomies

Following Package 05 and Package 06, validity is separated into orthogonal classifications:

### InputGeometryStatus:
* `VALID_INPUT`: Coordinates are finite, $R > 0$, and all vertices satisfy $|\|V - O\| - R| \le \epsilon_{\text{sphere}}$.
* `INVALID_INPUT`: $R \le 0$.
* `NON_FINITE_INPUT`: Coordinates or radius contain `NaN` or `Infinity`.
* `OUTSIDE_SPHERE`: One or more vertices violate sphere surface membership beyond $\epsilon_{\text{sphere}}$.

### RealizationStatus:
* `VALID_POSITIVE`: Vertices form a non-degenerate tetrahedron with positive orientation ($V_s > +\epsilon_{\text{volume}}$).
* `VALID_NEGATIVE`: Vertices form a non-degenerate tetrahedron with negative orientation ($V_s < -\epsilon_{\text{volume}}$).
* `DEGENERATE`: Vertices are coplanar or flat ($|V_s| \le \epsilon_{\text{volume}}$).
* `VERTEX_COINCIDENT`: Two or more vertices are within $\epsilon_{\text{coincident}}$.

### Strict Boundary Rules:
* **No Silent Projection:** If a vertex is off the sphere, it is rejected with `OUTSIDE_SPHERE`. It is never silently snapped or projected onto the sphere.
* **Negative Orientation Permitted:** Negative signed volume is a valid geometric realization (`VALID_NEGATIVE`). It is never rejected as invalid input.

---

## 6. Representation Boundary

* Spherical coordinates $(\phi, \lambda)$ are strictly a projection/representation layer for display and inspection.
* **No Second Geometry State:** The Stand never maintains an authoritative spherical geometry state. Spherical coordinates are derived on-demand from canonical Cartesian coordinates.
* **Pole Singularity Convention:** At poles ($\phi = \pm \pi/2$), $\lambda$ is canonicalized to $0.0$ in the representation layer.

---

## 7. Tolerance Dependency (Package 06 Centralized Architecture)

No local or ad-hoc tolerance constants exist. Tolerances are dynamically resolved from the characteristic scale $L_{\text{scale}} = R$:

$$\begin{aligned}
\epsilon_{\text{sphere}} &= 10^{-6} \cdot R \quad &[L] \\
\epsilon_{\text{coincident}} &= 10^{-6} \cdot R \quad &[L] \\
\epsilon_{\text{plane}} &= 10^{-6} \cdot R \quad &[L] \\
\epsilon_{\text{face}} &= 10^{-6} \cdot R^2 \quad &[L^2] \\
\epsilon_{\text{volume}} &= 10^{-7} \cdot R^3 \quad &[L^3] \\
\text{EPS\_REGULARITY} &= 10^{-4} \quad &[L^0] \\
\text{EPS\_ANGLE} &= 10^{-6} \text{ rad} \quad &[L^0] \\
\text{EPS\_FINITE} &= 10^{-12} \quad &[L^0]
\end{aligned}$$

---

## 8. Deterministic Geometry Signature

The signature is computed strictly from the canonical state:
$$\text{Signature} = \text{GEOM\_V1}|O:(x,y,z)|R:r|\text{VERTICES}:[A:(...),B:(...),C:(...),D:(...)]$$
* Coordinates are formatted to 10 fixed decimal digits with normalized $+0$.
* Metadata (timestamps, UI selections, camera parameters, rendering options) is completely excluded from the signature.

---

## 9. Implemented Functionality

1. `src/core/types.ts`: Complete data models, persistent identifiers, and epistemic status enums.
2. `src/core/tolerances.ts`: Scale-aware tolerance derivation per Package 06.
3. `src/core/topology.ts`: Fixed 4V/6E/4F combinatorial graph and incident query functions.
4. `src/core/geometryState.ts`: Authoritative state factory, distance functions, signed volume, and validation engine.
5. `src/core/signature.ts`: Deterministic serialization and FNV-1a hashing.
6. `src/core/representation.ts`: Dual representation converter (Spherical $\leftrightarrow$ Cartesian) with pole handling and anti-silent-projection guards.
7. `src/tests/m1_canonical_state.test.ts`: Deterministic M1 test suite executing T01–T17.
8. `src/App.tsx`: Minimal development/debug diagnostic view.

---

## 10. Executed Tests (T01 – T17)

All 17 deterministic tests executed successfully:
* **T01:** Create valid sphere S²(O, R) with O(0,0,0) and R > 0. `[PASS]`
* **T02:** Create four distinct vertices on the sphere. `[PASS]`
* **T03:** Reject R <= 0 with explicit INVALID_INPUT status. `[PASS]`
* **T04:** Reject NaN coordinates in sphere or vertices. `[PASS]`
* **T05:** Reject Infinity in sphere radius or vertex coordinates. `[PASS]`
* **T06:** Reject a vertex outside the sphere without silent projection. `[PASS]`
* **T07:** Accept a valid point on the sphere within scale-aware tolerance. `[PASS]`
* **T08:** Detect coincident vertices within epsCoincident threshold. `[PASS]`
* **T09:** Preserve A/B/C/D persistent semantic identities regardless of geometric coordinates. `[PASS]`
* **T10:** Verify the six canonical edges exist (AB, AC, AD, BC, BD, CD). `[PASS]`
* **T11:** Verify the four canonical faces exist (ABC, ABD, ACD, BCD). `[PASS]`
* **T12:** Verify topology remains invariant after changing a vertex position. `[PASS]`
* **T13:** Verify geometry signature changes when a vertex position changes. `[PASS]`
* **T14:** Verify geometry signature does NOT depend on metadata (timestamp, UI, camera). `[PASS]`
* **T15:** Verify negative orientation is represented as VALID_NEGATIVE and not rejected as invalid input. `[PASS]`
* **T16:** Verify coplanar configuration is representable and classified as DEGENERATE without input rejection. `[PASS]`
* **T17:** Verify representation and UI metadata cannot mutate canonical geometry implicitly. `[PASS]`

---

## 11. Known Limitations & Intentionally Deferred Functionality

* **Deferred to M2:** Advanced state transitions and multi-client reactive subscriptions.
* **Deferred to M3:** Full deterministic metric suite (6 chord lengths $L_{ij}$, 4 face areas $S_F$, perimeters $P_F$, face normals $\vec{n}_F$, regularity predicate, and face center classifications).
* **Deferred to M4:** Local face-center 4-state classifications and face profile vector $(C_{ABC}, C_{ABD}, C_{ACD}, C_{BCD})$.
* **Deferred to M5:** Dependency graph change propagation and semantic impact maps.
* **Deferred to M6:** Temporal trace history and transition snapshots.
* **Deferred to M7:** Public verification engine (`VERIFY_RESULT`, `VERIFY_STEP`, `CONSISTENCY_CHECK`).
* **Deferred to M10:** 3D rendering viewports (Three.js / WebGL), camera orbit controls, interactive vertex dragging.
