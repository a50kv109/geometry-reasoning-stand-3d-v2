import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EpistemicStatus,
  fact,
  hypothesis,
  derived,
  verified,
  contradiction,
  refuted,
  isEpistemicOrthogonal
} from '../core';

test('Epistemic Status Orthogonality Verification Suite', async (t) => {
  const edgeValue = 1.632993;

  await t.test('Wrapping value in epistemic tag preserves underlying numerical equality', () => {
    const wrappedFact = fact(edgeValue);
    const wrappedHypo = hypothesis(edgeValue);
    const wrappedDerived = derived(edgeValue);

    assert.equal(wrappedFact.value, edgeValue);
    assert.equal(wrappedHypo.value, edgeValue);
    assert.equal(wrappedDerived.value, edgeValue);
    assert.ok(isEpistemicOrthogonal(edgeValue, wrappedFact));
  });

  await t.test('Epistemic status taxonomy tags are distinct and non-overlapping', () => {
    const statuses = [
      EpistemicStatus.KNOWN_FACT,
      EpistemicStatus.DERIVED,
      EpistemicStatus.HYPOTHESIS,
      EpistemicStatus.VERIFIED,
      EpistemicStatus.CONTRADICTION,
      EpistemicStatus.REFUTED,
      EpistemicStatus.INDETERMINATE
    ];
    const unique = new Set(statuses);
    assert.equal(unique.size, statuses.length);
  });

  await t.test('Fact helper sets 1.0 confidence and KNOWN_FACT status', () => {
    const w = fact(42, 'CANONICAL_TEST');
    assert.equal(w.status, EpistemicStatus.KNOWN_FACT);
    assert.equal(w.confidence, 1.0);
    assert.equal(w.provenance, 'CANONICAL_TEST');
  });

  await t.test('Hypothesis helper sets HYPOTHESIS status and allows custom confidence', () => {
    const w = hypothesis(42, 'AGENT_GUESS', 0.65);
    assert.equal(w.status, EpistemicStatus.HYPOTHESIS);
    assert.equal(w.confidence, 0.65);
  });

  await t.test('Verified and Contradiction helpers assign correct polarity', () => {
    const v = verified(true);
    const c = contradiction(false);
    assert.equal(v.status, EpistemicStatus.VERIFIED);
    assert.equal(v.confidence, 1.0);
    assert.equal(c.status, EpistemicStatus.CONTRADICTION);
    assert.equal(c.confidence, 0.0);
  });

  await t.test('Refuted helper assigns REFUTED with 0 confidence', () => {
    const r = refuted('invalid claim');
    assert.equal(r.status, EpistemicStatus.REFUTED);
    assert.equal(r.confidence, 0.0);
  });
});
