/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Epistemic Status Layer
 * 
 * Strict architectural separation:
 * Epistemic metadata (hypotheses, derivations, proofs, confidence) is strictly orthogonal
 * to canonical Euclidean geometry. Epistemic labels never mutate the Cartesian SSOT.
 */

import { EpistemicStatus, EpistemicWrapper } from './types';

export function wrapEpistemic<T>(
  value: T,
  status: EpistemicStatus,
  provenance: string,
  confidence: number = 1.0
): EpistemicWrapper<T> {
  return {
    value,
    status,
    provenance,
    confidence: Math.max(0.0, Math.min(1.0, confidence)),
    timestamp: Date.now()
  };
}

export function fact<T>(value: T, provenance: string = 'STAND_CANONICAL_SSOT'): EpistemicWrapper<T> {
  return wrapEpistemic(value, EpistemicStatus.KNOWN_FACT, provenance, 1.0);
}

export function derived<T>(value: T, provenance: string = 'STAND_DETERMINISTIC_EVAL'): EpistemicWrapper<T> {
  return wrapEpistemic(value, EpistemicStatus.DERIVED, provenance, 1.0);
}

export function hypothesis<T>(value: T, provenance: string = 'AGENT_UNVERIFIED_PROPOSAL', confidence: number = 0.5): EpistemicWrapper<T> {
  return wrapEpistemic(value, EpistemicStatus.HYPOTHESIS, provenance, confidence);
}

export function verified<T>(value: T, provenance: string = 'STAND_ORACLE_VERIFICATION'): EpistemicWrapper<T> {
  return wrapEpistemic(value, EpistemicStatus.VERIFIED, provenance, 1.0);
}

export function contradiction<T>(value: T, provenance: string = 'STAND_ORACLE_CONTRADICTION'): EpistemicWrapper<T> {
  return wrapEpistemic(value, EpistemicStatus.CONTRADICTION, provenance, 0.0);
}

export function refuted<T>(value: T, provenance: string = 'STAND_ORACLE_REFUTATION'): EpistemicWrapper<T> {
  return wrapEpistemic(value, EpistemicStatus.REFUTED, provenance, 0.0);
}

export function isEpistemicOrthogonal<T>(originalValue: T, wrapper: EpistemicWrapper<T>): boolean {
  return originalValue === wrapper.value;
}
