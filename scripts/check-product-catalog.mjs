import assert from 'node:assert/strict';
import fs from 'node:fs';
import { therapyProducts } from '../lib/products/catalog.ts';
import { catalogGroups, treatmentCategories } from '../lib/products/content.ts';
import { defaultFilters, filterProducts, formatPowerArrangement, getDiscoveryPrice, getDiscountPercentage, getPriceTier, getProductPriceTier } from '../lib/products/discovery.ts';

for (const [price, expected] of [[0, 'budget'], [149.99, 'budget'], [150, 'mid-range'], [250, 'mid-range'], [250.01, 'premium'], [null, null], [-1, null], [NaN, null], [Infinity, null]]) {
  assert.equal(getPriceTier(price), expected, `Tier boundary: ${price}`);
}
const base = therapyProducts[0];
const fixtures = [
  { ...base, id: 'budget', currentPrice: 149.99, category: 'face', wireless: true, treatmentModes: 3 },
  { ...base, id: 'lower-boundary', currentPrice: 150, category: 'face', wireless: false, treatmentModes: 4 },
  { ...base, id: 'upper-boundary', currentPrice: 250, category: 'face-neck', brand: 'Other', wireless: null, treatmentModes: 7 },
  { ...base, id: 'premium', currentPrice: 250.01, category: 'face-neck', wireless: null, treatmentModes: 7 },
  { ...base, id: 'unknown', currentPrice: null, referencePrice: null, category: 'full-body', wireless: null, treatmentModes: null },
];
const select = overrides => filterProducts(fixtures, { ...defaultFilters, ...overrides }).map(product => product.id);
assert.deepEqual(select({ budget: 'budget' }), ['budget']);
assert.deepEqual(select({ budget: 'mid-range' }), ['lower-boundary', 'upper-boundary']);
assert.deepEqual(select({ budget: 'premium' }), ['premium']);
assert.deepEqual(select({ power: 'wireless' }), ['budget']);
assert.deepEqual(select({ power: 'wired' }), ['lower-boundary']);
assert.deepEqual(select({ power: 'unknown' }), ['upper-boundary', 'premium', 'unknown']);
assert.deepEqual(select({ area: 'face-neck', budget: 'mid-range', brand: 'Other', modes: 7, power: 'unknown' }), ['upper-boundary']);
assert.deepEqual(select({ area: 'face', modes: 7 }), []);
assert.deepEqual(select({ sort: 'price-asc' }), ['budget', 'lower-boundary', 'upper-boundary', 'premium', 'unknown']);
assert.deepEqual(select({ sort: 'price-desc' }), ['premium', 'upper-boundary', 'lower-boundary', 'budget', 'unknown']);
assert.deepEqual(fixtures.map(product => product.id), ['budget', 'lower-boundary', 'upper-boundary', 'premium', 'unknown'], 'Sorting must not mutate the catalog');
assert.equal(getDiscoveryPrice({ ...base, currentPrice: 150 }), 150, 'Checked current quote overrides the supplied reference');
assert.equal(getProductPriceTier({ ...base, currentPrice: 250 }), 'mid-range');
assert.equal(getDiscountPercentage(base), 56);
assert.equal(getDiscountPercentage({ ...base, originalPrice: null }), null);
assert.equal(getDiscountPercentage({ ...base, currentPrice: 200 }), null, 'No invented discount when price exceeds reference');

const required = ['id', 'brand', 'productName', 'category', 'productImage', 'amazonUrl', 'affiliateUrl', 'currentPrice', 'originalPrice', 'discountPercentage', 'rating', 'reviewCount', 'ledCount', 'wavelengths', 'treatmentModes', 'coverageArea', 'wireless', 'rechargeable', 'keyFeatures', 'suitableFor', 'limitations', 'fdaStatus', 'evidenceNotes', 'lastPriceChecked'];
assert.equal(new Set(therapyProducts.map(product => product.id)).size, therapyProducts.length);
const asins = therapyProducts.flatMap(product => product.asin ? [product.asin] : []);
assert.equal(new Set(asins).size, asins.length, 'No duplicate catalog entries for the same ASIN');
for (const product of therapyProducts) {
  for (const field of required) assert.ok(Object.hasOwn(product, field), `${product.id}: missing ${field}`);
  assert.ok(catalogGroups.some(category => category.id === product.category));
  for (const amount of [product.currentPrice, product.originalPrice, product.referencePrice]) assert.ok(amount === null || (Number.isFinite(amount) && amount >= 0));
  assert.equal(product.currentPrice, null, 'Existing sources contain no independently checked current quotes');
  assert.equal(product.lastPriceChecked, null, 'Do not fabricate a price-check date');
  assert.equal(product.rating, null); assert.equal(product.reviewCount, null); assert.equal(product.fdaStatus, null);
  if (product.affiliateUrl) { const url = new URL(product.affiliateUrl); assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'pboost.me'); }
  if (product.amazonUrl) { const url = new URL(product.amazonUrl); assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'www.amazon.com'); assert.equal(url.pathname, `/dp/${product.asin}`); }
  if (product.productImage) assert.ok(fs.existsSync(`public${product.productImage.src}`));
  for (const url of [product.reviewUrl, ...product.sourceUrls].filter(Boolean)) {
    if (url.startsWith('/')) assert.ok(fs.existsSync(`content${url}.mdx`), `${product.id}: broken source ${url}`);
    else assert.equal(new URL(url).hostname, 'www.amazon.com');
  }
  if (product.recommendation) {
    assert.equal(product.recommendation.priceTier, getProductPriceTier(product), 'Recommendation must match the derived price tier');
    assert.ok(fs.existsSync(`content${product.recommendation.comparisonUrl}.mdx`), 'Recommendation comparison must exist');
  }
}
const reglow = therapyProducts.find(product => product.asin === 'B0DT14FRPG');
assert.equal(reglow.productName, 'ReGlow LED Face Mask');
assert.equal(reglow.category, 'face');
assert.equal(reglow.referencePrice, 219);
assert.equal(getProductPriceTier(reglow), 'mid-range');
assert.equal(reglow.recommendation.label, 'Best Mid-Range LED Face Mask');
assert.equal(reglow.fdaStatus, null, 'Do not publish unverified exact-model FDA clearance');
assert.equal(reglow.affiliateUrl, 'https://pboost.me/U6Iqwz7T');
assert.equal(therapyProducts.filter(product => product.category === 'full-body').length, 2);
assert.equal(treatmentCategories.length, 3, 'Keep three primary LED treatment categories');
assert.equal(therapyProducts.filter(product => product.category === 'related-heat').length, 1);
assert.ok(treatmentCategories.every(category => category.published === false), 'Future category pages need a separate editorial publication decision');
assert.equal(therapyProducts.find(product => product.asin === 'B0FH6SLD7R').referencePrice, 349, 'Use the owner-supplied reference for this catalog entry');
assert.equal(therapyProducts.find(product => product.asin === 'B0FH6SLD7R').originalPrice, null, 'Do not infer a list price from a cropped percentage label');
assert.equal(getDiscountPercentage(therapyProducts.find(product => product.asin === 'B0FH6SLD7R')), null);
assert.equal(getDiscountPercentage(therapyProducts.find(product => product.id === 'amiro-5-in-1')), 5);
assert.deepEqual(filterProducts(therapyProducts, { ...defaultFilters, budget: 'budget' }).map(product => product.id), ['ulike-lite-3-mode', 'aurphany-face-neck', 'megelin-8-in-1-dome', 'utk-jade-far-infrared-pad']);
assert.deepEqual(filterProducts(therapyProducts, { ...defaultFilters, budget: 'mid-range' }).map(product => product.id), ['ulike-reglow-360', 'amiro-5-in-1', 'megelin-white-face-neck', 'megelin-black-face-neck', 'swirise-7-in-1-dome']);
assert.deepEqual(filterProducts(therapyProducts, { ...defaultFilters, budget: 'premium' }).map(product => product.id), ['ulike-lite-4-mode']);
assert.equal(therapyProducts.find(product => product.id === 'amiro-5-in-1').referencePrice, 197.99);
assert.equal(therapyProducts.find(product => product.id === 'amiro-5-in-1').originalPrice, 208.47);
const expectedUpdates = [
  ['B0FRSHQZKL', 'https://pboost.me/R6X3gRaN6', 110.49, 129.99, 15],
  ['B0CQJVJVZW', 'https://pboost.me/c6ZPnduE', 129, 179, 28],
  ['B0DL651HX5', 'https://pboost.me/Z6V4kHTq2', 168.63, 219, 23],
  ['B073Z72FFY', 'https://pboost.me/C6USRzYc', 123.07, 144.79, 15],
  ['B0CPY3NKWB', 'https://pboost.me/c6JsnaNk', 249, 362.7, 31],
  ['B0CPXZ33M8', 'https://pboost.me/y6CYOckC', 249.99, 362.7, 31],
];
for (const [asin, affiliateUrl, price, original, discount] of expectedUpdates) {
  const matches = therapyProducts.filter(product => product.asin === asin);
  assert.equal(matches.length, 1, 'Update the existing ASIN, never add a duplicate');
  const product = matches[0];
  assert.equal(product.affiliateUrl, affiliateUrl); assert.equal(product.referencePrice, price);
  assert.equal(product.originalPrice, original); assert.equal(getDiscountPercentage(product), discount);
}
const heat = therapyProducts.find(product => product.id === 'utk-jade-far-infrared-pad');
assert.equal(heat.category, 'related-heat'); assert.equal(heat.ledCount, null); assert.equal(heat.wavelengths, null); assert.equal(heat.treatmentModes, null);
assert.equal(formatPowerArrangement(heat), 'Wired device');
assert.ok(!filterProducts(therapyProducts, { ...defaultFilters, area: 'full-body' }).includes(heat));
assert.equal(therapyProducts.find(product => product.id === 'megelin-8-in-1-dome').treatmentModes, null, 'Do not infer eight modes from a marketing label with an incomplete map');
assert.equal(therapyProducts.find(product => product.id === 'amiro-5-in-1').rechargeable, null, 'Battery capacity alone does not establish rechargeability');
assert.deepEqual(therapyProducts.find(product => product.asin === 'B0CPY3NKWB').previousAffiliateUrls, ['https://pboost.me/K6B2taMZ?uid=megelin_white_01']);
assert.equal(therapyProducts.find(product => product.asin === 'B0CPXZ33M8').referencePriceDate, null, 'Older reference-supply date must not become the new screenshot capture date');
console.log(JSON.stringify({ status: 'PASS', products: therapyProducts.length, tierBoundaries: '149.99 / 150 / 250 / 250.01', combinedFilters: 'PASS', unknownsAndPricePrecedence: 'PASS', separatePowerStates: 'PASS', linksAndSourceRecords: 'PASS', futurePagesUnpublished: true }, null, 2));
