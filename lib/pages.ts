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
 'terms': {
  seoTitle:'Terms of Use — ProofWell', title:'Terms of use.', eyebrow:'TERMS · DRAFT',
  description:'[CUSTOMIZE BEFORE PUBLICATION] The site owner should review these terms for the applicable jurisdiction before launch.',
  sections:[
    {title:'Using the site',text:'Content is provided for general education and consumer research. It is not individualized medical, legal or professional advice. Community is disabled pending owner approval; these rules are a preparation draft.'},
    {title:'Community participation',text:'Use a nickname and share only content you have the right to submit. Do not post medical records, contact details, advertising, harassment, impersonation, HTML or scripts. Personal experiences and poll responses are not clinical evidence. Age eligibility and any guardian requirements must be confirmed before participation is enabled.',ownerInput:true},
    {title:'Moderation and content use',text:'Comments are private until approved; suggestions remain private to editors. Moderators may decline, hide or delete submissions, and approval does not verify a scientific claim. Submission permits processing for moderation and, if approved, displaying your nickname and comment on the relevant article; it does not claim transfer of ownership. The final license, moderation standards and appeal process require owner review.',ownerInput:true},
    {title:'Privacy, retention and requests',text:'Guest sessions use persistent browser credentials and a pseudonymous Auth identity. Supabase and Cloudflare process community and security requests. Raw votes, helpfulness responses and suggestions have a 90-day retention limit; approved comments remain until deletion is processed, pending/spam comments at most 90 days, security logs at most 30 days and admin logs 180 days. Polls stay open and repeat responses are possible after raw records expire, so totals are response counts. See the Privacy Policy for aggregate data, cookies, Google tags, provider limitations and removal requests. Contact proofwelllife@gmail.com for deletion or moderation concerns; do not send passwords or tokens.',links:[{label:'Privacy Policy',href:'/privacy-policy'},{label:'Community privacy contact',href:'mailto:proofwelllife@gmail.com'}]},
    {title:'Availability and fair use',text:'Access may be restricted for abuse, verification failures, maintenance or outages. A browser identifier is not proof of a unique person. No fabricated counts are shown. Analytics permission is separate from acknowledgement of community publication rules.'},
    {title:'Editorial content and external links',text:'Third-party information and product details may change. The site owner must confirm rights, link policies, permitted reuse and appropriate limitations before launch.'},
    {title:'Operator and unresolved legal details',text:'ProofWell is a brand operated by an individual, not a claimed registered company. The operator’s full legal identity, effective date, storage region, age policy, governing-law and dispute provisions remain pending. Visitors may have rights under laws applicable to their location; these terms do not assert a single jurisdiction applies to everyone. Official contact: ProofWell Editorial Team — proofwelllife@gmail.com.',ownerInput:true}
  ]
 }
};
