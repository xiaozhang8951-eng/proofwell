export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
export const navigation = [['Reviews','/reviews'],['Comparisons','/comparisons'],['Buying Guides','/buying-guides'],['Science Explained','/science'],['Wellness','/wellness'],['Topics','/topics'],['About','/about']] as const;
export const topics = [['Red Light Therapy','red-light-therapy'],['LED Masks','led-masks'],['Beauty Devices','beauty-devices'],['Skincare Science','skincare-science']] as const;
export const medicalDisclaimer = 'ProofWell provides educational information and consumer product analysis. Content is not medical advice and is not a substitute for diagnosis, treatment, or individualized guidance from a qualified healthcare professional.';

export const pillars = [
  { name: 'Skin Science & Beauty', href: '/skincare', description: 'Skin biology, ingredients, and beauty technology. Our first featured series examines LED light therapy.' },
  { name: 'Nutrition & Supplements', href: '/nutrition', description: 'A long-term focus on nutrition, ingredient quality, doses, and the evidence behind supplement claims.' },
  { name: 'Healthy Aging', href: '/healthy-aging', description: 'A longer view of strength, recovery, sleep, and the consumer products associated with living well.' },
  { name: 'Wellness Technology', href: '/wellness-technology', description: 'The evidence, practical value, and limitations of wearables, recovery tools, and at-home wellness devices.' },
] as const;
