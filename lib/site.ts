export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
export const navigation = [['Reviews','/reviews'],['Comparisons','/comparisons'],['Buying Guides','/buying-guides'],['Science Explained','/science'],['Wellness','/wellness'],['Topics','/topics'],['About','/about']] as const;
export const topics = [['Red Light Therapy','red-light-therapy'],['LED Masks','led-masks'],['Beauty Devices','beauty-devices'],['Skincare Science','skincare-science']] as const;
export const medicalDisclaimer = 'ProofWell provides educational information and consumer product analysis. Content is not medical advice and is not a substitute for diagnosis, treatment, or individualized guidance from a qualified healthcare professional.';
