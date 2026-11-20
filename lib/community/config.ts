// Article-specific defaults; PostgreSQL becomes authoritative after seeding.
// Keep content separate from MDX so no editorial prose/publication state changes.
export type CommunityConfig = { question: string; options: { id: string; label: string }[]; discussionPrompt: string; nextQuestion: string };
const experienceOptions = [
  { id: 'regularly', label: 'Yes, regularly' },
  { id: 'occasionally', label: 'Yes, occasionally' },
  { id: 'interested', label: "Not yet, but I'm interested" },
  { id: 'researching', label: 'No, just researching' },
];
const overrides: Record<string, Partial<CommunityConfig>> = {
  'does-red-light-therapy-work': { question: 'Have you tried red light therapy?' },
  'red-light-therapy-skin': { question: 'Have you tried red light therapy for skin?' },
  'how-led-masks-work': { question: 'Have you used an LED face mask?' },
  '633-vs-830-nm': { question: 'Which wavelength information do you check before choosing a device?', options: [{id:'red',label:'Red light specifications'},{id:'nir',label:'Near-infrared specifications'},{id:'both',label:'Both'},{id:'learning',label:"I'm still learning what to check"}] },
  'red-vs-near-infrared': { question: 'Which light technology are you researching?', options: [{id:'red',label:'Red light'},{id:'nir',label:'Near-infrared light'},{id:'both',label:'Both'},{id:'unsure',label:'Not sure yet'}] },
  'irradiance-vs-fluence': { question: 'Which device parameter is hardest to interpret?', options: [{id:'irradiance',label:'Irradiance'},{id:'fluence',label:'Fluence / radiant exposure'},{id:'time',label:'Treatment time'},{id:'geometry',label:'Measurement distance and fit'}] },
  'ulike-reglow-vs-megelin-white-led-mask': { question: 'What matters most when comparing these masks?', options: [{id:'coverage',label:'Face and neck coverage'},{id:'evidence',label:'Evidence and specifications'},{id:'price',label:'Price and return terms'},{id:'routine',label:'Fit with my routine'}] },
};
export function communityConfig(article: { slug: string; kind: string; shortTitle: string }): CommunityConfig {
  const base: CommunityConfig = {
    question: article.kind === 'review' ? `Have you used ${article.shortTitle}?` : article.kind === 'comparison' ? 'What matters most when you compare LED devices?' : 'Have you tried a device or routine discussed in this article?',
    options: article.kind === 'comparison' ? [{id:'evidence',label:'Relevant human evidence'},{id:'specs',label:'Technical specifications'},{id:'fit',label:'Comfort and coverage'},{id:'value',label:'Price and support'}] : experienceOptions,
    discussionPrompt: 'Share what you tried, what you noticed, or a question about this article. Personal experiences are not clinical evidence. Please do not include medical records, contact details or other sensitive information.',
    nextQuestion: 'What Would You Like Us to Explore Next?',
  };
  return { ...base, ...overrides[article.slug] };
}
