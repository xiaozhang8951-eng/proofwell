import type { ProductCategory, TreatmentArea } from './types';

/** Future routes are reserved here, not generated. Publication requires an editorial review. */
export const treatmentCategories: { id: TreatmentArea; title: string; path: string; published: boolean; description: string; detail: string }[] = [
  { id: 'face', title: 'Face devices', path: '/red-light-therapy/face-masks', published: false,
    description: 'LED masks and facial devices for a face-focused routine.', detail: 'Compare fit, modes, power arrangement and model-matched evidence.' },
  { id: 'face-neck', title: 'Face & neck devices', path: '/red-light-therapy/face-neck-devices', published: false,
    description: 'Systems with separate or combined face and neck coverage.', detail: 'Check what is included and how each piece is powered and positioned.' },
  { id: 'full-body', title: 'Full-body & body-area devices', path: '/red-light-therapy/full-body-panels', published: false,
    description: 'Panels and domes designed for body-area positioning.', detail: 'The compact domes listed here cover selected areas, not the whole body at once. Check dimensions, distance and positioning.' },
];

// Keep three primary LED treatment categories. Heat pads have a separate group
// so their prices/features are never ranked against LED products.
export const catalogGroups: { id: ProductCategory; title: string }[] = [
  ...treatmentCategories.map(({ id, title }) => ({ id, title })),
  { id: 'related-heat', title: 'Related heat devices · not LED' },
];

export const hubFaqs = [
  { question: 'Which red light therapy device is best for me?', answer: 'Start with the treatment area, your budget and the format you will realistically use. Compare face masks with face masks, and face-and-neck systems with other systems covering both areas. ProofWell has not tested these devices or established a universal clinical winner. The shortlists on this page describe features and buying priorities, not proven treatment outcomes.' },
  { question: 'How do the budget filters work?', answer: 'Budget is under US$150; mid-range includes US$150 through US$250; premium is above US$250. A checked current price takes priority. When none is available, filters and sorting use a clearly labeled supplied reference or screenshot price. Products with no price stay unclassified and appear only when no budget filter is selected. Prices exclude unverified coupons, shipping and taxes.' },
  { question: 'Are these live prices and verified customer ratings?', answer: 'No live price feed or independently checked customer-rating dataset is connected. Available amounts are supplied references or screenshot offers. An unknown price-check date means the offer has not been independently checked here; it is not the article publication date. Confirm the selected model, seller, final total and return terms at the destination.' },
  { question: 'Does a higher LED count or more modes mean better results?', answer: 'No. LED count and mode names describe features, not measured dose, uniformity or clinical effectiveness. Compare wavelength, irradiance at the intended treatment distance, session time, coverage and exact-model evidence together. An advertised wavelength span is not a verified mode-by-mode spectrum.' },
  { question: 'Is FDA-cleared the same as FDA-approved?', answer: 'No. Clearance and approval are different regulatory pathways. A claim must match the exact device, region and intended use. ProofWell has not independently confirmed clearance or approval for the products in this catalog, so neither status is assigned. Regulatory status would not validate every advertising claim.' },
  { question: 'Can I use any mask for acne, wrinkles or full-body wellness?', answer: 'Do not assume that one device or wavelength has evidence for every goal. Check exact-model documentation and the intended use. A face mask is not a full-body device, and a compact dome may illuminate only one body area at a time. A coverage slogan is not proof of uniform exposure. Far-infrared heat pads are thermal devices, not red/near-infrared LED devices, and are listed separately. Follow the current instructions and eye-protection guidance, and ask a qualified professional about photosensitivity, medicines or eye conditions. This page is consumer education, not medical advice.' },
];
