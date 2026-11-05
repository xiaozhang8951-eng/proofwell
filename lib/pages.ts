import { trustPages } from './trust-pages';
import type { InfoPage } from './trust-pages';
export const categories:Record<string,{title:string;eyebrow:string;description:string;section?:string;sections?:string[];topic?:string;planned?:string[]}>={
'reviews':{title:'A closer look. A clearer verdict.',eyebrow:'REVIEWS',description:'Independent frameworks for evaluating evidence, specifications, usability, and value. Reviews remain in research until verified.',section:'reviews'},
'comparisons':{title:'The differences that matter.',eyebrow:'COMPARISONS',description:'Side-by-side comparisons, with the same questions asked of every product.',section:'comparisons'},
'buying-guides':{title:'Start with better questions.',eyebrow:'BUYING GUIDES',description:'Practical guidance for making informed purchases, before you start comparing products.',section:'buying-guides'},
'science':{title:'Less jargon. More understanding.',eyebrow:'SCIENCE EXPLAINED',description:'Scientific concepts translated into useful consumer context, with the limits of the evidence kept in view.',section:'science'},
'beauty-tech':{title:'Beyond the spec sheet.',eyebrow:'BEAUTY TECHNOLOGY',description:'LED masks, microcurrent devices, radiofrequency tools, and at-home beauty technology.',topic:'beauty-devices'},
'skincare':{title:'More than an ingredient list.',eyebrow:'SKIN SCIENCE & BEAUTY',description:'Skin biology, ingredients, formulations, and beauty technology. LED light therapy is our first featured editorial series.',topic:'skincare-science',planned:['Retinol vs Retinal','Vitamin C','Niacinamide','Ceramides','Sunscreen Filters','Skin Barrier Science']},
'wellness':{title:'Everyday wellbeing. Better informed.',eyebrow:'WELLNESS',description:'An expanding editorial lens on sleep, recovery, supplements, and the tools we use to feel well.',planned:['Sleep Products','Recovery Devices','Wearable Wellness Technology','Home Wellness Devices']},
'supplements':{title:'Look beyond the label.',eyebrow:'SUPPLEMENTS',description:'A future home for evidence-led analysis of ingredients, doses, quality, and safety. No efficacy claims or recommendations are available yet.',planned:['Magnesium Glycinate vs Citrate','Collagen Supplementation','Omega-3','Probiotics']},
'healthy-aging':{title:'A longer view of living well.',eyebrow:'HEALTHY AGING',description:'An upcoming collection examining the products, habits, and technologies associated with healthy aging.',planned:['Protein Intake','Creatine','Resistance Training Technology','Wearables']},
'sleep':{title:'A more considered approach to rest.',eyebrow:'SLEEP',description:'Future evidence-led coverage of sleep products and technology.',planned:['Sleep Trackers','Sleep Masks and Light Exposure','Magnesium and Sleep']},
'recovery':{title:'Recovery, examined.',eyebrow:'RECOVERY',description:'Future analysis of recovery tools and the evidence supporting their claims.',planned:['Massage Guns','Compression Devices','Cold Therapy']},
'nutrition':{title:'Food for better questions.',eyebrow:'NUTRITION & SUPPLEMENTS',description:'A long-term editorial pillar exploring nutrition, supplement ingredients, doses, quality, and uncertainty. No supplement recommendations have been published yet.',sections:['nutrition','supplements'],planned:['Protein','Ingredient Transparency']},
'wellness-technology':{title:'Technology with a purpose.',eyebrow:'WELLNESS TECHNOLOGY',description:'Future reviews of wearables and home wellness devices.',planned:['Wearables','Home Wellness Devices']},
};
export const information: Record<string, InfoPage> = {
...trustPages,
'editorial-standards': {
  "title": "How our editorial standards work.",
  "seoTitle": "Editorial Standards \u2014 Applying the ProofWell Policy",
  "eyebrow": "EDITORIAL STANDARDS",
  "description": "A practical overview of how ProofWell separates research, product claims, uncertainty, and editorial interpretation, with links to the complete editorial policy.",
  "sections": [
    {
      "title": "Read the full policy",
      "text": "Our editorial policy explains the evidence framework, source evaluation, commercial independence, attribution, corrections, and updates.",
      "links": [
        {
          "label": "Read the editorial policy",
          "href": "/editorial-policy"
        }
      ]
    },
    {
      "title": "Ask the same questions consistently",
      "text": "We consider research quality, relevance, consistency, limitations, funding, and whether findings apply to the exact product and intended use. Laboratory findings, human outcomes, and marketing claims are kept distinct."
    },
    {
      "title": "Make uncertainty visible",
      "text": "Missing data, unverified specifications, or absent references should be marked openly. No ratings, hands-on testing, scientific reviews, or endorsements are inferred from a template."
    }
  ],
  "contact": {
    "title": "Editorial feedback and corrections",
    "purpose": "For content questions and correction requests, contact:"
  }
},
'disclaimer':{seoTitle:'Health & Medical Disclaimer — ProofWell',title:'Information with clear limits.',eyebrow:'HEALTH & MEDICAL DISCLAIMER',description:'Educational information. Consumer analysis. Not individualized medical guidance.',sections:[{title:'Not medical advice',text:'ProofWell provides educational information and consumer product analysis. Content is not medical advice and is not a substitute for diagnosis, treatment, or individualized guidance from a qualified healthcare professional.'},{title:'Individual circumstances matter',text:'Supplement, nutrition, healthy aging, and device content is educational. Do not use it to diagnose or treat a condition. Ask an appropriately qualified healthcare professional about personal suitability, interactions, or contraindications.'},{title:'Research is not a guarantee',text:'Published research does not guarantee that a product will produce a particular outcome. Draft content and unverified placeholders should not be used to make purchasing or health decisions.'}]},
 'terms':{seoTitle:'Terms of Use — ProofWell',title:'Terms of use.',eyebrow:'TERMS · DRAFT',description:'[CUSTOMIZE BEFORE PUBLICATION] The site owner should review these terms for the applicable jurisdiction before launch.',sections:[{title:'Using the site',text:'Content is provided for general education and consumer research. Do not rely on draft material as verified factual, medical, legal, or professional advice.'},{title:'Editorial content and external links',text:'Third-party information and product details may change. The site owner must confirm rights, link policies, permitted reuse, and appropriate limitation-of-liability wording before public launch.'},{title:'Owner details and governing law',text:'[CUSTOMIZE BEFORE PUBLICATION] Add legal owner identity, effective date, applicable law, dispute process, and enforceable terms after appropriate review. The official contact email is available in the footer.'}]}
};
