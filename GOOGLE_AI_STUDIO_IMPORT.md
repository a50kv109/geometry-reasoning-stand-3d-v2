# Google AI Studio Import & Sync Protocol

## Purpose
Establishes the reproducible procedure for importing and synchronizing the 3D Geometry Reasoning Stand codebase within the Google AI Studio environment.

## Invariants
1. Do not introduce arbitrary feature creep or physics engines.
2. Preserve Cartesian Single Source of Truth (SSOT).
3. Validate all deterministic tests post-import.

## Verification Checklist
- `npm run lint` (0 errors)
- `npm run test:all` (All suites pass)
- `npm run build` (Successful production bundle)
