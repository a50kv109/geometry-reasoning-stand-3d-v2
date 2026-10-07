# Dynamic Reasoning Architecture

## Pipeline Flow

```text
CanonicalGeometryState (SSOT)
         │
         ├──► Global Metrics (Signed Volume, Surface Area, Centroid)
         │
         ├──► LVG (Gram Matrix, Solid Angle Ω, Planar & Dihedral Angles)
         │       │
         │       ▼
         ├──► DLVM (4x Local Vertex Manifolds, Shared-Edge Verification)
         │       │
         │       ▼
         └──► GDS (Diagnostic Snapshot, Epistemic Integration)
                 │
                 ▼
          Temporal Engine (Transitions, Trace, Quality)
```

## Guardrails
1. Sole mutable source: Cartesian coordinates of $A, B, C, D \in S^2(O, R)$.
2. All subsequent stages are pure deterministic functions without side-effects.
3. No reverse writes, no caches acting as authorities.
