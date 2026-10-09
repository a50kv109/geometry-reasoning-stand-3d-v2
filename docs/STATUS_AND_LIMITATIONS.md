# System Status & Known Limitations

**Project:** Tetraider Sphere 3D Geometry Stand  
**Baseline Version:** 0.1.0  
**Audit Date:** 2026-10-09  
**Status:** RELEASE BASELINE CONSOLIDATED

---

## 1. Feature Implementation Status Matrix

Every capability in the repository is classified into one of five rigorous statuses:
- `IMPLEMENTED` — Verified in source code.
- `TESTED` — Covered by an executable test suite in `src/tests/`.
- `DOCUMENTED_ONLY` — Formulated in concept or specification, but not written in code.
- `NOT_IMPLEMENTED` — Explicitly absent from the repository.
- `UNKNOWN` — Insufficient evidence.

| Capability / Subsystem | Implementation Status | Test Status | Location / Notes |
| :--- | :---: | :---: | :--- |
| **Canonical Geometry State Core** | `IMPLEMENTED` | `TESTED` | `src/core/geometryState.ts`, 17 tests in `m1_canonical_state.test.ts` |
| **Persistent 4V/6E/4F Topology** | `IMPLEMENTED` | `TESTED` | `src/core/topology.ts`, verified in M1 suite |
| **Sphere Membership Enforcer** | `IMPLEMENTED` | `TESTED` | Rejects outside points (`OUTSIDE_SPHERE`), no silent projection |
| **Dual Coordinate Representation** | `IMPLEMENTED` | `TESTED` | `src/core/representation.ts`, $(\phi, \lambda) \leftrightarrow (x, y, z)$ |
| **Per-Vertex Coordinate Guides** | `IMPLEMENTED` | `TESTED` | `src/visualization/renderer3d.ts`, 16 tests in `m1_7_scale_and_guides.test.ts` |
| **Visual Viewport Scale (Fit, 100%, 75%, 50%)**| `IMPLEMENTED` | `TESTED` | Decoupled from geometry; verified in M1.7 suite |
| **Two-Column Ergonomic Layout** | `IMPLEMENTED` | `TESTED` | Viewport (~65%) and Sidebar (~35%), 7 tests in `m1_6_workspace_layout.test.ts` |
| **LSM Inspector (Physical Globe Model)** | `IMPLEMENTED` | `TESTED` | Dual-mode inspector (docked + HUD), local unit sphere $S^2(v)$, Oosterom-Strackee $\Omega(v)$ |
| **Dynamic Reasoning (LVG / DLVM / GDS)** | `IMPLEMENTED` | `TESTED` | `lvg.ts`, `dlvm.ts`, `gds.ts`, 10 contracts in `lvg_dlvm_gds_temporal.test.ts` |
| **Scale-Aware Tolerances (Package 06)** | `IMPLEMENTED` | `TESTED` | `src/core/tolerances.ts`, verified across scale tests |
| **Agent Gateway (9 Commands)** | `IMPLEMENTED` | `TESTED` | `src/core/agentGateway.ts`, 14 tests in `agent_gateway_v01.test.ts` |
| **State-Specific Symmetry Passport** | `IMPLEMENTED` | `TESTED` | `gatewayTypes.ts`, verified in Contract 13 |
| **Agent Console UI** | `IMPLEMENTED` | `TESTED` | `src/components/AgentConsole.tsx`, Presets + JSON editor + Passport inspector |
| **Temporal Delta Measurements** | `IMPLEMENTED` | `TESTED` | `src/core/geometryTemporal.ts`, verified in temporal suite |
| **Interactive Scrubber Timeline UI** | `NOT_IMPLEMENTED` | `DOCUMENTED_ONLY` | Data model exists; interactive scrub slider UI not built |
| **Face-Center 4-State Classification UI** | `NOT_IMPLEMENTED` | `DOCUMENTED_ONLY` | Normals computed; 4-state classification UI not active in sidebar |
| **Arbitrary Polyhedra Catalog** | `NOT_IMPLEMENTED` | `NOT_IMPLEMENTED` | Engine is strictly restricted to tetrahedra |
| **External HTTP / REST Server** | `NOT_IMPLEMENTED` | `NOT_IMPLEMENTED` | Application is client-side Vite SPA; no HTTP API routes on port 3000 |
| **JSON-RPC / MCP Transport** | `NOT_IMPLEMENTED` | `NOT_IMPLEMENTED` | No remote daemon or Model Context Protocol server present |

---

## 2. Test Verification Baseline

The repository was verified with all 11 test suites executing cleanly with zero failures:

```bash
$ npm run test:all
# Total Suites: 11 / 11 PASS
# Total Test Assertions: 120+ PASS, 0 FAIL
```

1. `m1_canonical_state.test.ts`: 17 tests (Cartesian invariants, topology, tolerances, rejection).
2. `m1_5_visual_client.test.ts`: 10 tests (coordinate conversions, camera invariants).
3. `m1_6_workspace_layout.test.ts`: 7 tests (desktop two-column layout, sidebar panels).
4. `m1_7_scale_and_guides.test.ts`: 16 tests (visual scale, parallels, meridians, occlusion).
5. `scale_dependency_consistency.test.ts`: 6 tests (scaling with $R$, regular tetrahedron).
6. `scale_dependency_irregular.test.ts`: 6 tests (scaling with $R$, irregular tetrahedron).
7. `regular_tetrahedron_metric.test.ts`: 5 tests (analytic metric comparisons).
8. `epistemic_status_orthogonal.test.ts`: 7 tests (4-domain status orthogonality).
9. `agent_readiness_smoke.test.ts`: 11 tests (oracle boundary evaluation).
10. `lvg_dlvm_gds_temporal.test.ts`: 10 tests (LVG angles, DLVM shared edges, GDS, temporal transitions).
11. `agent_gateway_v01.test.ts`: 14 tests (13 core contracts, all 9 commands, symmetry passport).

---

## 3. Known Limitations

### Geometric & Mathematical Limitations
1. **Restricted to Spherical Tetrahedra:** The engine exclusively models 4 vertices inscribed on a sphere. It does not support arbitrary polyhedra (e.g. cubes, octahedra, icosahedra).
2. **Discrete Chord Approximation:** Edges are straight line segments traversing the sphere's interior, not geodesics (great-circle arcs) on the spherical manifold.
3. **No Symbolic Geometry Proofs:** The oracle is a deterministic numerical evaluation engine using scale-aware floating-point arithmetic ($10^{-6}$ to $10^{-7}$). It is not a computer algebra system (CAS) or symbolic theorem prover.

### Architectural & Runtime Limitations
1. **Local-Only Gateway Transport:** The Agent Gateway functions strictly in-process (via TypeScript imports) or inside the browser session via `window.__fssAgentGateway`. External network access requires hosting the engine in a Node.js/Express server wrapper.
2. **Single Active Human Viewport:** While the gateway can store multiple branched experiment states in its registry memory, the interactive 3D canvas viewport renders one active state at a time.
3. **Temporal Scrubber Missing:** The temporal measurement module (`geometryTemporal.ts`) calculates deltas between discrete snapshots, but an interactive visual timeline scrubber has not been integrated into the human UI.

---

## 4. Planned Future Work (Post-v0.1)

The following capabilities are specified in project roadmaps but are **not** part of the current baseline:
1. **Milestone M4 UI:** Embedding the 4-state face-center classification indicators into the sidebar.
2. **Milestone M6 UI:** Interactive multi-frame temporal scrubber slider and history playback.
3. **Phase 2 Headless Transport:** Standalone Express/MCP HTTP server binding `AgentGateway` to `/api/agent/command` for remote Python/LangChain agents.
4. **Expanded Catalog:** Inscribing additional Platonic solids (cube, octahedron) to study polyhedral dualities.
