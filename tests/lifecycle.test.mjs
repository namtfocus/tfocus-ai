import { STATES, MODES } from '../src/domain/state.mjs';
import { calculateQuote } from '../src/domain/pricing.mjs';
import assert from 'node:assert';

console.log('Running TFocus AI Lifecycle Unit Tests...');

// 1. Verify 22 discrete states
assert.strictEqual(Object.keys(STATES).length, 22, 'State machine must contain exactly 22 states');
console.log('✓ 22 Discrete States Verified');

// 2. Verify deterministic pricing logic (No hallucination)
const quote = calculateQuote({
  basePackagePrice: 790000,
  ownedItems: [{ name: 'Gương lớn', status: 'OWNED' }],
  sourcedItems: [{ name: 'Hoa tươi Huế', cost: 180000 }]
});

assert.strictEqual(quote.total, 970000, 'Quote must equal base + sourced cost');
assert.strictEqual(quote.mode, MODES.ASSIST, 'Missing items must enforce ASSIST mode');
console.log('✓ Deterministic Pricing & Safety Mode Verified: 970.000đ (ASSIST)');

console.log('All tests passed successfully!');
