export const reviewSections=['Quick Verdict','Who This Is For','Key Specifications','What the Brand Claims','What the Evidence Supports','How It Works','Key Ingredients or Technology','Dose or Technical Parameters','Usage Protocol','Design and Usability','Safety and Contraindications','What We Like','What We Would Change','Alternatives','Price and Value','Final Verdict','References','Affiliate Disclosure'];
export const supplementSections=['Quick Verdict','What It Contains','Active Ingredients','Dose','What the Evidence Says','Who Might Benefit','Who Should Be Cautious','Safety','Potential Interactions','Quality and Transparency','Usage and Usability','Advantages and Limitations','Value','Alternatives','Final Verdict','References','Affiliate Disclosure'];
export const comparisonSections=['Quick Answer','Side-by-Side Specifications','Key Ingredients or Technology','Dose or Technical Parameters','Evidence','Ease of Use','Safety','Price and Value','Best For Different Users','Final Recommendation','References'];

export const evaluationFramework = [
  { label: 'Product specifications', heading: 'Key Specifications', supplementHeading: 'What It Contains', guidance: 'Verify the exact model or formulation, region, and source date.' },
  { label: 'Ingredients & technical principles', heading: 'Key Ingredients or Technology', supplementHeading: 'Active Ingredients', guidance: 'Separate proposed mechanisms from demonstrated outcomes.' },
  { label: 'Scientific evidence', heading: 'What the Evidence Supports', supplementHeading: 'What the Evidence Says', guidance: 'Assess the tested product, population, study design, funding, and uncertainty.' },
  { label: 'Safety considerations', heading: 'Safety and Contraindications', supplementHeading: 'Safety', guidance: 'Check instructions, contraindications, and potential interactions.' },
  { label: 'Usability', heading: 'Design and Usability', supplementHeading: 'Usage and Usability', guidance: 'Distinguish documented features from actual hands-on observations.' },
  { label: 'Price & value', heading: 'Price and Value', supplementHeading: 'Value', guidance: 'Use dated, region-specific prices only after verification.' },
  { label: 'Advantages & limitations', heading: 'What We Like', supplementHeading: 'Advantages and Limitations', guidance: 'Record substantiated strengths, tradeoffs, and missing information.' },
  { label: 'Intended users', heading: 'Who This Is For', supplementHeading: 'Who Might Benefit', guidance: 'Explain suitability and cautions without personalized medical advice.' },
  { label: 'Editorial verdict', heading: 'Final Verdict', supplementHeading: 'Final Verdict', guidance: 'Withhold recommendations until the supporting material is checked.' },
] as const;
