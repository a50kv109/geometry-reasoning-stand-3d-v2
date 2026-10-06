# Agent Interface & Verification Boundary Contract

## 1. Core Principle
> *"Agent may be wrong. Stand must not."*

The 3D Geometry Reasoning Stand serves as an authoritative ground-truth oracle for AI reasoning agents. The Stand never trusts claims emitted by an agent until they are checked against the canonical state.

## 2. Interaction Protocol
1. **Query State (`getStateSnapshot`):** Agent retrieves immutable snapshot containing Cartesian coordinates, derived spherical representation, topology, validation flags, and geometric signature.
2. **Formulate Claim (`AgentClaim`):** Agent proposes a hypothesis (e.g. edge length, face area, signed volume, regularity, degeneracy).
3. **Verify Claim (`verifyClaim` / `verifyBatch`):** The Stand computes ground truth via deterministic full recomputation and returns an `AgentVerificationReport` with an explicit epistemic verdict (`VERIFIED` or `REFUTED`).

## 3. Epistemic Separation
Epistemic classifications (`KNOWN_FACT`, `DERIVED`, `HYPOTHESIS`, `VERIFIED`, `CONTRADICTION`, `REFUTED`) describe the provenance of statements and never alter Euclidean ground truth.
