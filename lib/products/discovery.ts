import type { DiscoveryFilters, PriceTier, TherapyProduct } from './types';

export const priceTiers: { id: PriceTier; label: string; description: string }[] = [
  { id: 'budget', label: 'Under $150', description: 'A smaller starting budget' },
  { id: 'mid-range', label: '$150–$250', description: 'Including exactly $150 and $250' },
  { id: 'premium', label: 'Above $250', description: 'A higher initial spend' },
];

export const defaultFilters: DiscoveryFilters = { area: 'all', budget: 'all', brand: 'all', power: 'all', modes: 'all', sort: 'editorial' };
export function getPriceTier(price: number | null): PriceTier | null {
  if (price === null || !Number.isFinite(price) || price < 0) return null;
  return price < 150 ? 'budget' : price <= 250 ? 'mid-range' : 'premium';
}

export function getDiscoveryPrice(product: TherapyProduct) {
  return product.currentPrice ?? product.referencePrice;
}
export function getProductPriceTier(product: TherapyProduct) {
  return getPriceTier(getDiscoveryPrice(product));
}
export function getDiscountPercentage(product: TherapyProduct): number | null {
  const price = getDiscoveryPrice(product);
  if (price === null || product.originalPrice === null || product.originalPrice <= 0 || price >= product.originalPrice) return null;
  return Math.round((1 - price / product.originalPrice) * 100);
}
export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}
export function formatWavelengths(product: TherapyProduct) {
  if (product.category === 'related-heat') return 'Not applicable to red/NIR LED comparison';
  if (!product.wavelengths?.length) return 'Individual wavelengths not established';
  return product.wavelengths.map(wave => wave.nanometers === null ? `${wave.label} (nm unknown)` : `${wave.nanometers} nm ${wave.label.toLowerCase()}`).join(' · ');
}
export function formatPowerArrangement(product: TherapyProduct) {
  if (product.wireless === null) return 'Cable arrangement unknown';
  const mask = !product.formFactor || product.formFactor === 'mask';
  return product.wireless ? (mask ? 'Wireless mask' : 'Cable-free device') : (mask ? 'Mask-to-controller cable' : 'Wired device');
}
export function filterProducts(products: TherapyProduct[], filters: DiscoveryFilters): TherapyProduct[] {
  const result = products.filter(product =>
    (filters.area === 'all' || product.category === filters.area) &&
    (filters.budget === 'all' || getProductPriceTier(product) === filters.budget) &&
    (filters.brand === 'all' || product.brand === filters.brand) &&
    (filters.power === 'all' || (filters.power === 'unknown' ? product.wireless === null : product.wireless === (filters.power === 'wireless'))) &&
    (filters.modes === 'all' || product.treatmentModes === filters.modes));
  if (filters.sort !== 'editorial') result.sort((a, b) => {
    const left = getDiscoveryPrice(a), right = getDiscoveryPrice(b);
    // Unknown prices remain last in either direction, never interpreted as $0.
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    return filters.sort === 'price-asc' ? left - right : right - left;
  });
  return result;
}
