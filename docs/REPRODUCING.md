# Reproducing the Tetraider Sphere Stand

**Project:** Tetraider Sphere (Dynamic 3D Geometry Reasoning Stand)  
**Target:** Independent Developer & AI System Reproduction Guide  
**Status:** EXPERIMENTALLY VERIFIED

This document provides a clean-clone reproduction guide. Following these steps allows any developer, CI runner, or AI coding system to clone the repository, install dependencies, run tests, start the development workstation, and compile the production bundle with zero guesswork.

---

## 1. Quickstart (Under 2 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/a50kv109/geometry-reasoning-stand-3d-v2.git
cd geometry-reasoning-stand-3d-v2

# 2. Install dependencies (Node 18+ or Bun)
npm install

# 3. Verify all 11 automated test suites pass (119+ assertions)
npm run test:all

# 4. Run TypeScript type check
npm run lint

# 5. Build production bundle
npm run build

# 6. Start the local interactive workstation (runs at http://localhost:3000)
npm run dev
```

---

## 2. Operating Environment & System Requirements

### Hardware & OS
- **Operating Systems:** Linux (Ubuntu 20.04+, Debian 11+, Fedora, Arch), macOS (12+ Monterey, Ventura, Sonoma), Windows 10/11 (WSL2 recommended or native PowerShell).
- **Architecture:** `x86_64` (amd64) or `arm64` (Apple Silicon / aarch64).
- **Memory:** Minimum 1 GB RAM (2 GB recommended).
- **Disk Space:** ~250 MB (including `node_modules`).

### Software Runtimes
| Runtime | Verified Version | Minimum Version | Notes |
| :--- | :---: | :---: | :--- |
| **Node.js** | `v22.23.2` | `v18.0.0` | Active LTS or Current recommended |
| **npm** | `10.9.8` | `9.0.0` | Bundled with Node.js |
| **Bun** *(Optional)* | `1.2.x` | `1.0.0` | Supported alternative; repository includes `bun.lock` |

---

## 3. Environment Variables & Secret Configuration

**Good news:** The Tetraider Sphere geometry stand, reasoning engine, LSM inspector, Agent Gateway, and test suites are **100% self-contained and require ZERO API keys or cloud credentials to run.**

- **Runtime Execution:** Completely offline and deterministic.
- **`.env.example` Reference:** The repository contains a `.env.example` file referencing `GEMINI_API_KEY` and `APP_URL`. These are template variables for optional cloud deployment wrappers. **They are not referenced anywhere in `src/` or `src/tests/` and are not required to run or test the application.**
- **No Configuration Required:** You do not need to create a `.env` file to build, test, or run the workstation.

---

## 4. Step-by-Step Clean Clone Workflow

### Step 1: Clone the Repository
```bash
git clone https://github.com/a50kv109/geometry-reasoning-stand-3d-v2.git
cd geometry-reasoning-stand-3d-v2
```

### Step 2: Install Dependencies
Install dependencies using standard npm:
```bash
npm install
```
*(Or alternatively with Bun: `bun install`)*

**Verification:** Confirm that `node_modules/` is created and contains `vite`, `react`, `@tailwindcss/vite`, `tsx`, and `typescript`.

### Step 3: Run Deterministic Test Suites
The stand includes 12 automated test suites covering canonical Euclidean math, scale invariance, local vertex geometry, Agent Gateway contracts, and golden reference benchmarks:
```bash
npm run test:all
```
**Expected Output:**
```text
# tests 124+
# pass 124+
# fail 0
# duration_ms < 1000ms
```

To run individual milestone test suites:
- `npm run test:m1` — M1 Canonical geometry state & sphere membership (17 tests)
- `npm run test:client` — M1.5 Visual client & coordinate conversion (10 tests)
- `npm run test:layout` — M1.6 Desktop two-column layout ergonomics (7 tests)
- `npm run test:guides` — M1.7 Per-vertex coordinate guides & scale (16 tests)
- `npm run test:scale` — PAT-27 Scale dependency consistency (12 tests)
- `npm run test:metrics` — Regular tetrahedron metric invariants (5 tests)
- `npm run test:epistemic` — Epistemic status orthogonality (7 tests)
- `npm run test:agent` — Agent readiness & oracle boundary smoke test (11 tests)
- `npm run test:lvg` — Dynamic reasoning LVG / DLVM / GDS / Temporal engine (10 tests)
- `npm run test:gateway` — Agent Gateway v0.1 acceptance suite (14 contracts)
- `npm run test:golden` — Analytical golden reference snapshot & symmetry group (5 benchmarks)

### Step 4: Run Type Checking & Linting
Validate TypeScript syntax and imports across the entire codebase without emitting code:
```bash
npm run lint
```
**Expected Output:** Exits with code `0` and zero errors.

### Step 5: Run Standalone Verification Scripts
```bash
# Gateway end-to-end flow (PGO-3D, PSS-3D, Claims, Perturbation, Ledger)
npm run example:gateway

# Agent hypothesis verification oracle
npm run example:agent

# Dynamic simulation transitions and scale experiments
npm run example:simulation
```

### Step 6: Build Production Application
Compile the optimized client bundle via Vite:
```bash
npm run build
```
**Expected Output:** Generates assets in `dist/`:
- `dist/index.html` (~1 kB)
- `dist/assets/index-*.css` (~45 kB)
- `dist/assets/index-*.js` (~650 kB)
- Exits with code `0`.

### Step 7: Preview Production Build
Launch the built static application locally:
```bash
npm run preview
```
Open `http://localhost:4173` (or the printed port) in a web browser.

### Step 8: Start Development Server
For interactive exploration and active live development:
```bash
npm run dev
```
**Expected Output:**
```text
  VITE v6.x.x  ready in ~300 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```
Open `http://localhost:3000` in Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge.

---

## 5. What to Look For in the Running UI

Once `http://localhost:3000` is loaded, verify the following elements:
1. **Left Main Area (~65% width):**
   - 3D perspective canvas rendering the unit sphere $S^2(O, R=1)$ and inscribed tetrahedron.
   - 4 colored vertex badges: $A$ (cyan/amber), $B$ (emerald), $C$ (violet), $D$ (rose).
   - Dragging any vertex across the sphere rotates and recalculates chords in real time.
   - Floating HUD button: `[ 🌐 Глобус углов D ]` opens the floating Local Spherical Manifold inspector.
2. **Right Sidebar (~35% width):**
   - **Section 1: Active Vertex & Coordinate Controls:** Dual Cartesian $(x,y,z)$ and spherical $(\phi, \lambda)$ inputs.
   - **Section 2: Embedded LSM Inspector:** «Глобус локальной угловой геометрии» showing unit ray pins on $S^2(v)$, solid angle $\Omega$, and planar face angles.
   - **Section 3: Metric Readout:** Edge lengths, face areas, signed volume $V_s$, and regularity ratio.
   - **Section 4: Agent Console (v0.1):** Tabs for `Команды MVP`, `JSON Консоль`, `Паспорт PGO-3D`, and `Журнал`.

---

## 6. How to Access Agent Gateway v0.1 Locally

The stand provides two programmatic ways to interact with the geometric core:

### Method A: Browser DevTools Console
When the web application is open in the browser:
1. Press `F12` or right-click $\to$ **Inspect** $\to$ open the **Console** tab.
2. The gateway is bound to `window.__fssAgentGateway`.
3. Try executing an inspection command:
   ```javascript
   const res = window.__fssAgentGateway.executeCommand({
     command: 'inspect_passport'
   });
   console.log(res.data);
   ```
4. Try verifying a symmetry invariance hypothesis:
   ```javascript
   const verifyRes = window.__fssAgentGateway.executeCommand({
     command: 'verify_claim',
     hypothesis: {
       predicate: 'IS_INVARIANT_UNDER_OPERATION',
       claimedValue: true,
       operationContext: {
         type: 'AXIS_ROTATION',
         axis: { x: 0, y: 0, z: 1 },
         angleDegrees: 120
       }
     }
   });
   console.log('Verdict:', verifyRes.evidence.verdict); // "VERIFIED"
   console.log('Residual:', verifyRes.evidence.mathematicalEvidence.residual);
   ```

### Method B: Headless TypeScript Script
In Node.js or automated test scripts:
```typescript
import {
  createAgentGateway,
  constructRegularTetrahedron,
  createPoint3D
} from './src/core';

// 1. Construct regular tetrahedron
const res = constructRegularTetrahedron(1.0);
const gateway = createAgentGateway(res.canonicalState!);

// 2. Query metric
const volumeRes = gateway.executeCommand({
  command: 'query_metric',
  metricName: 'signedVolume'
});

console.log('Volume:', volumeRes.data.value);
```

---

## 7. Connectivity & Network Transport Limitations

| Transport Type | Status | Description |
| :--- | :---: | :--- |
| **In-Memory TypeScript API** | `SUPPORTED` | Full access via `src/core/agentGateway.ts`. |
| **In-Browser Window Global** | `SUPPORTED` | Bound to `window.__fssAgentGateway` during UI execution. |
| **Workstation UI Console** | `SUPPORTED` | Visual interactive testing panel in sidebar. |
| **External HTTP REST Endpoint** | `NOT_SUPPORTED` | Dev server runs on port 3000 via Vite; no HTTP API routes exist. |
| **External JSON-RPC / MCP Server** | `NOT_SUPPORTED` | No Model Context Protocol daemon is present in the repository. |

> **Crucial Clarification:** An external agent running on a remote machine cannot make `POST /api/...` calls to the stand out of the box because no backend HTTP routes are mounted. External agents must either execute in the same Node.js runtime or interact via browser automation (Playwright, Puppeteer).

---

## 8. Troubleshooting Common Issues

### Issue 1: Port 3000 is already in use
**Symptom:** Vite logs `Port 3000 is in use, trying another one...`  
**Fix:** Stop the existing process on port 3000 (`lsof -i :3000` or `kill $(lsof -t -i :3000)`), or specify a custom port:
```bash
npm run dev -- --port 3001
```

### Issue 2: Node version incompatibility
**Symptom:** `SyntaxError: Unexpected token '?'` or module resolution errors.  
**Fix:** Upgrade Node.js to version $\ge 18.0.0$ (v20 or v22 LTS recommended). Verify with `node -v`.

### Issue 3: Missing `dist/` on preview
**Symptom:** `npm run preview` fails with `The directory "dist" does not exist`.  
**Fix:** Run `npm run build` first to compile the production bundle.
