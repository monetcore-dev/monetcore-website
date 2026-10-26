import { test } from 'node:test';
import assert from 'node:assert/strict';
import { engineeringCapabilities } from '../app/config/engineeringCapabilities.ts';
import { findService, products } from '../app/config/offeringCatalog.ts';

test('corporate engineering capabilities resolve to existing service pages', () => {
  assert.equal(engineeringCapabilities.length, 6);
  for (const capability of engineeringCapabilities) {
    assert.ok(capability.description.length > 40);
    assert.ok(findService(capability.href.replace('/services/', '')));
  }
});
test('product catalogue keeps explicit availability and demonstration disclosures', () => {
  for (const product of products) {
    assert.ok(product.status.trim());
    assert.ok(product.disclosure.trim());
  }
});
