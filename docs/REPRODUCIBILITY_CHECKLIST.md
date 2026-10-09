# Reproduction Acceptance Checklist

**Project:** Tetraider Sphere (Dynamic 3D Geometry Reasoning Stand)  
**Standard:** Clean-Clone Independent Verification Protocol  
**Purpose:** Ensure any independent system or developer can verify faithful reproduction of the stand without guesswork.

---

## Acceptance Verification Protocol

Follow these 8 sequential checkpoints upon cloning the repository. Every checkpoint defines an exact command, an expected observable result, and pass/fail criteria.

---

### Checkpoint 1: Dependency Installation

- **Action:** Run package manager installation in the cloned repository root.
  ```bash
  npm install
  ```
- **Observable Result:**
  - `node_modules/` directory is populated.
  - Package tree contains core dependencies: `react`, `react-dom`, `vite`, `@tailwindcss/vite`, `tsx`, `typescript`, `lucide-react`.
  - Process exits with return code `0`.
- **Pass Criteria:** No unresolved dependency errors or unhandled peer dependency crashes.

---

### Checkpoint 2: Automated Test Execution

- **Action:** Run the complete deterministic test suite:
  ```bash
  npm run test:all
  ```
- **Observable Result:**
  - 12 distinct test files execute sequentially via `tsx`:
    1. `src/tests/m1_canonical_state.test.ts` (17 tests)
    2. `src/tests/m1_5_visual_client.test.ts` (10 tests)
    3. `src/tests/m1_6_workspace_layout.test.ts` (7 tests)
    4. `src/tests/m1_7_scale_and_guides.test.ts` (16 tests)
    5. `src/tests/scale_dependency_consistency.test.ts` (6 tests)
    6. `src/tests/scale_dependency_irregular.test.ts` (6 tests)
    7. `src/tests/regular_tetrahedron_metric.test.ts` (5 tests)
    8. `src/tests/epistemic_status_orthogonal.test.ts` (7 tests)
    9. `src/tests/agent_readiness_smoke.test.ts` (11 tests)
    10. `src/tests/lvg_dlvm_gds_temporal.test.ts` (10 tests)
    11. `src/tests/agent_gateway_v01.test.ts` (14 tests)
    12. `src/tests/golden_reference_snapshot.test.ts` (5 benchmarks)
  - Process exits with code `0`.
- **Pass Criteria:** Total test assertions $\ge 124$, zero failures (`fail: 0`), zero cancelled tests.

---

### Checkpoint 3: Static Type Checking & Linting

- **Action:** Run the TypeScript compiler in check-only mode:
  ```bash
  npm run lint
  ```
- **Observable Result:**
  - Executes `tsc --noEmit`.
  - No syntax, type, or import errors logged.
  - Exits with return code `0`.
- **Pass Criteria:** Zero TypeScript compilation diagnostics.

---

### Checkpoint 4: Production Compilation

- **Action:** Compile the production client bundle:
  ```bash
  npm run build
  ```
- **Observable Result:**
  - Executes `vite build`.
  - Output files generated in `dist/`:
    - `dist/index.html`
    - `dist/assets/index-*.css`
    - `dist/assets/index-*.js`
  - Build logs display: `✓ built in ~5s` (or similar).
  - Exits with return code `0`.
- **Pass Criteria:** `dist/index.html` exists and is non-empty; process exits with code `0`.

---

### Checkpoint 5: Application Startup & Workspace Rendering

- **Action:** Start the development server and open the application in a web browser:
  ```bash
  npm run dev
  ```
  Navigate to `http://localhost:3000`.
- **Observable Result:**
  - Web page title: `"Dynamic 3D Geometry Reasoning Stand"`.
  - Layout: Desktop two-column split screen:
    - **Left (~65% width):** Interactive 3D canvas showing the sphere and general tetrahedron with 4 colored vertex handles ($A, B, C, D$).
    - **Right (~35% width):** Sidebar panels containing coordinate inputs, local angle inspector, metrics table, and Agent Console.
  - Interactive Manipulation: Dragging any vertex across the sphere smoothly updates coordinates and connected chord lines.
- **Pass Criteria:** Canvas renders without WebGL/canvas errors; vertex dragging recalculates metrics at 60 fps.

---

### Checkpoint 6: Local Spherical Manifold (LSM) Inspector Access

- **Action:** Locate and click the **`[ 🌐 Глобус углов D ]`** button in the sidebar or the floating canvas HUD button.
- **Observable Result:**
  - The «Глобус локальной угловой геометрии» panel expands.
  - Features an interactive $220 \times 200$ px globe canvas on stand.
  - Displays unit ray vectors $\mathbf{u}_{DA}, \mathbf{u}_{DB}, \mathbf{u}_{DC}$ pinned to local sphere $S^2(D)$.
  - Displays numerical values: solid angle $\Omega(D)$ (in steradians) and planar angles $\angle ADB, \angle ADC, \angle BDC$.
  - Rotating the globe via mouse drag or Pitch/Yaw sliders turns the globe on its stand without mutating the underlying tetrahedron coordinates.
- **Pass Criteria:** The local sphere renders pins and solid angle calculations without console exceptions.

---

### Checkpoint 7: Agent Console & Command Execution

- **Action:** In the right sidebar, scroll to Section 4: **`FSS Agent Gateway v0.1`**.
  1. Click the **`Команды MVP`** tab.
  2. Click the preset button: **`1. inspect_passport`**.
- **Observable Result:**
  - The results card below immediately displays:
    ```json
    {
      "objectId": "FSS-POLYHEDRON-TETRA-001",
      "name": "Правильный тетраэдр (Regular Tetrahedron)",
      "objectClass": "POLYHEDRON",
      "topology": {
        "vertexLabels": ["A", "B", "C", "D"],
        "edgeCount": 6,
        "faceCount": 4,
        "eulerCharacteristic": 2
      }
    }
    ```
- **Pass Criteria:** Passport data matches the 4V/6E/4F topological schema and returns `success: true`.

---

### Checkpoint 8: Deterministic Verification & Evidence Record

- **Action:**
  1. In the Agent Console, click preset: **`5. Верификация гипотезы C₃`**.
  2. Next, click preset: **`6. Эксперимент: Срыв симметрии`**.
- **Observable Result:**
  - For preset 5 ($C_3$ rotation around Z by $120^\circ$ on regular tetrahedron):
    - Badge: **`VERIFIED`** in green.
    - Residual: $< 1.0 \times 10^{-12}$.
    - Applied Oracle Tolerance: $1.0 \times 10^{-6}$.
    - Epistemic Status: `VERIFIED`.
  - For preset 6 (Perturbation of vertex $A$ by $\Delta x = 0.15$ followed by $C_3$ test):
    - Badge: **`REFUTED`** in red.
    - Residual: $\approx 0.15$ ($> 1.0 \times 10^{-6}$).
    - Epistemic Status: `REFUTED`.
  - Under the **`Журнал`** tab: both experiments appear in chronological order with their unique `experimentId` and signatures.
- **Pass Criteria:** The oracle correctly verifies $C_3$ invariance on the symmetric state and strictly refutes it on the perturbed state.

---

## Checklist Completion Matrix

| Checkpoint | Tested Criterion | Command / Step | Result |
| :---: | :--- | :--- | :---: |
| **CP-1** | Clean Dependency Installation | `npm install` | **PASS** |
| **CP-2** | 11 Deterministic Test Suites | `npm run test:all` | **PASS** |
| **CP-3** | Static Type Check & Lint | `npm run lint` | **PASS** |
| **CP-4** | Production Client Build | `npm run build` | **PASS** |
| **CP-5** | 3D Viewport & Workspace | `npm run dev` $\to$ `http://localhost:3000` | **PASS** |
| **CP-6** | LSM Inspector Globe | `[ 🌐 Глобус углов {id} ]` | **PASS** |
| **CP-7** | Agent Gateway Passport | `inspect_passport` command | **PASS** |
| **CP-8** | Oracle Verdict & Evidence | `verify_claim` (C3 + Perturbation) | **PASS** |

**Conclusion:** The repository meets all 8 reproduction checkpoints. Any developer or automated reasoning system cloning this repository will obtain a completely functioning stand and oracle verification baseline.
