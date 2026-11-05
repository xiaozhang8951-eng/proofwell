import { resolveSiteOrigin } from './metadata';
export const siteUrl = resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
export const navigation = [['Reviews','/reviews'],['Comparisons','/comparisons'],['Buying Guides','/buying-guides'],['Science Explained','/science'],['Wellness','/wellness'],['Topics','/topics'],['About','/about']] as const;
export const topics = [['Red Light Therapy','red-light-therapy'],['LED Masks','led-masks'],['Beauty Devices','beauty-devices'],['Skincare Science','skincare-science']] as const;
export const medicalDisclaimer = 'ProofWell provides educational information and consumer product analysis. Content is not medical advice and is not a substitute for diagnosis, treatment, or individualized guidance from a qualified healthcare professional.';

export const pillars = [
  { name: 'Skin Science & Beauty', href: '/skincare', description: 'Skin biology, ingredients, and beauty technology. Our first featured series examines LED light therapy.' },
  { name: 'Nutrition & Supplements', href: '/nutrition', description: 'A long-term focus on nutrition, ingredient quality, doses, and the evidence behind supplement claims.' },
  { name: 'Healthy Aging', href: '/healthy-aging', description: 'A longer view of strength, recovery, sleep, and the consumer products associated with living well.' },
  { name: 'Wellness Technology', href: '/wellness-technology', description: 'The evidence, practical value, and limitations of wearables, recovery tools, and at-home wellness devices.' },
] as const;

export const officialContact = { name: 'ProofWell Editorial Team', email: 'proofwelllife@gmail.com' } as const;

export const topicDescriptions: Record<string,string> = {
  'red-light-therapy': 'Research frameworks and consumer guidance on red and near-infrared light, photobiomodulation, realistic expectations, and uncertainty.',
  'led-masks': 'LED face-mask reviews, comparisons, safety questions, and buying frameworks that put technical specifications in context.',
  'beauty-devices': 'Explore evidence, usability, safety, and technical questions for at-home beauty devices, beginning with LED technology.',
  'skincare-science': 'Connect skin biology, skincare claims, scientific research, and beauty technology through the ProofWell editorial library.',
};
