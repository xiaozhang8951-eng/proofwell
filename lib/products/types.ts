export type TreatmentArea = 'face' | 'face-neck' | 'full-body';
export type ProductCategory = TreatmentArea | 'related-heat';
export type PriceTier = 'budget' | 'mid-range' | 'premium';
export type ProductImage = { src: string; alt: string; width: number; height: number; note: string };

export type TherapyProduct = {
  id: string;
  brand: string;
  productName: string;
  category: ProductCategory;
  formFactor?: 'mask' | 'dome' | 'panel' | 'heat-pad';
  productImage: ProductImage | null;
  amazonUrl: string | null;
  affiliateUrl: string | null;
  previousAffiliateUrls?: string[];
  /** USD. Only populate a current quote after an actual price check. */
  currentPrice: number | null;
  originalPrice: number | null;
  discountPercentage: number | null;
  rating: number | null;
  reviewCount: number | null;
  ledCount: number | null;
  wavelengths: { label: string; nanometers: number | null }[] | null;
  treatmentModes: number | null;
  coverageArea: string | null;
  /** Cable-free device, not merely a rechargeable battery. Null means unconfirmed. */
  wireless: boolean | null;
  rechargeable: boolean | null;
  keyFeatures: string[];
  suitableFor: string[];
  limitations: string[];
  fdaStatus: 'cleared' | 'approved' | null;
  evidenceNotes: string[];
  /** ISO date of a real price check, not an article publication date. */
  lastPriceChecked: string | null;
  asin: string | null;
  identityStatus: 'documented' | 'needs-confirmation';
  reviewUrl: string | null;
  sourceUrls: string[];
  sourceNotes?: string;
  modeNotes?: string;
  /** Kept separate from currentPrice so a screenshot never becomes a live quote. */
  referencePrice: number | null;
  referencePriceDate: string | null;
  priceSource: string;
  powerNotes: string | null;
  ledNotes: string | null;
  wavelengthNotes: string | null;
};

export type DiscoveryFilters = {
  area: TreatmentArea | 'all';
  budget: PriceTier | 'all';
  brand: string;
  power: 'all' | 'wireless' | 'wired' | 'unknown';
  modes: number | 'all';
  sort: 'editorial' | 'price-asc' | 'price-desc';
};
