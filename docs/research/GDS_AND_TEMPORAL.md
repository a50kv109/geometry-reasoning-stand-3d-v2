# GDS & Temporal Reasoning Specification

## 1. Geometric Diagnostic Snapshot (GDS)
GDS captures an atomic, read-only diagnostic state:
$$\mathrm{GDS} = \langle t, \sigma, \mathcal{M}_{\mathrm{global}}, \{\mathrm{DLVM}_V\}_{V \in \{A, B, C, D\}}, \mathrm{Consistency}, \mathrm{Epistemic} \rangle$$

There is strictly NO mutation channel from GDS back into Canonical Geometry State.

## 2. Geometry Temporal Evolution
Temporal reasoning tracks transitions between observations:
$$\mathcal{T} = (O_0, O_1, \dots, O_n)$$

### Strict Monotonicity
For any transition $(O_i, O_{i+1})$, the stand requires:
$$t_{i+1} > t_i$$
Non-monotonic transitions ($t_{i+1} \le t_i$) are flagged as `CORRUPTED`.
