export type InfoSection = { title: string; text: string; items?: string[]; links?: { label: string; href: string }[]; ownerInput?: boolean };
export type InfoPage = { title: string; seoTitle: string; eyebrow: string; description: string; sections: InfoSection[]; contact?: { title: string; purpose: string }; contactFirst?: boolean; draftUpdated?: string };

export const trustPages: Record<string, InfoPage> = {
  "about": {
    "title": "Making wellness claims easier to evaluate.",
    "seoTitle": "About ProofWell — Our Mission & Editorial Approach",
    "eyebrow": "ABOUT PROOFWELL",
    "description": "ProofWell is an independent editorial platform translating research into practical guidance across skin science, nutrition, healthy aging, and wellness technology.",
    "sections": [
      {
        "title": "Evidence over everything.",
        "text": "Health and beauty information can mix useful research with incomplete data and persuasive marketing. ProofWell exists to help readers understand what a claim is based on, how relevant the evidence is, and what remains uncertain. Our mission is clearer consumer decisions, not certainty where the research cannot provide it."
      },
      {
        "title": "Research first. Claims second. Products third.",
        "text": "We start with the question and the scientific literature. We explain technical terms in everyday language, connect findings to practical considerations, and distinguish educational guidance from individualized medical advice."
      },
      {
        "title": "Four editorial pillars",
        "text": "Our first featured series examines LED light therapy. The same critical approach guides four long-term areas of coverage:",
        "items": [
          "Skin Science — skin biology, skincare ingredients, and beauty technology.",
          "Nutrition — food, supplement ingredients, doses, quality, and uncertainty.",
          "Healthy Aging — strength, sleep, recovery, and products associated with living well.",
          "Wellness Technology — wearables, recovery tools, and at-home devices."
        ],
        "links": [
          {
            "label": "Explore all topics",
            "href": "/topics"
          }
        ]
      },
      {
        "title": "How we evaluate evidence",
        "text": "We consider study quality, population, comparison groups, outcomes, effect sizes, consistency, funding, and relevance to the product or decision being discussed. A laboratory mechanism does not establish a benefit in people, and results for one device do not establish results for every device.",
        "links": [
          {
            "label": "Read our editorial policy",
            "href": "/editorial-policy"
          }
        ]
      },
      {
        "title": "Independent conclusions",
        "text": "Commercial compensation must not determine our conclusions, rankings, or choice of evidence. Potential affiliate relationships are disclosed. We do not imply hands-on testing, scientific review, or institutional endorsement unless it has actually occurred and is documented.",
        "links": [
          {
            "label": "Affiliate disclosure",
            "href": "/affiliate-disclosure"
          }
        ]
      },
      {
        "title": "People and accountability",
        "text": "ProofWell Editorial Team is the official contact for the publication. Named author biographies, credentials, and any scientific reviewer details must be verified before attribution. No founder qualifications, clinical experience, awards, affiliations, or endorsements are claimed here."
      }
    ],
    "contact": {
      "title": "Contact information",
      "purpose": "For questions about ProofWell, our mission, or our editorial approach, contact:"
    }
  },
  "editorial-policy": {
    "title": "Research first. Always.",
    "seoTitle": "Editorial Policy — Evidence, Independence & Corrections",
    "eyebrow": "EDITORIAL POLICY",
    "description": "How ProofWell evaluates scientific literature, separates research from marketing, communicates uncertainty, and handles editorial corrections.",
    "sections": [
      {
        "title": "Scientific literature before marketing",
        "text": "We prioritize relevant scientific literature over product copy or testimonials. Peer review is a starting point for critical assessment, not a guarantee that a study is reliable, applicable, or free from bias. Manufacturer claims are identified as claims and considered separately from independent findings."
      },
      {
        "title": "Different research answers different questions",
        "text": "Systematic reviews synthesize studies; human clinical research evaluates outcomes in people. Observational findings may identify associations without establishing causation. Animal studies and in-vitro laboratory work can inform hypotheses and mechanisms but cannot, by themselves, establish human clinical benefits. Manufacturer-funded work is assessed with its funding and potential conflicts made clear."
      },
      {
        "title": "A consistent evidence framework",
        "text": "These categories describe an editorial assessment, not automatic product scores. Strength depends on quality, consistency, relevance, and limitations, not study type alone. A weak systematic review can be less informative than a careful individual trial; observational findings do not automatically establish a causal effect.",
        "items": [
          "Stronger evidence — systematic reviews and well-designed randomized controlled trials, when the underlying research is relevant, rigorous, and consistent.",
          "Moderate evidence — controlled clinical studies and consistent observational evidence, with attention to confounding and remaining uncertainty.",
          "Preliminary evidence — small human studies and early clinical findings that require confirmation.",
          "Preclinical evidence — animal and laboratory studies; these are not treated as proof of benefit in people."
        ]
      },
      {
        "title": "Labels must explain their limits",
        "text": "Articles may use the existing Strong, Moderate, Emerging, Limited, or Unsupported evidence labels only when a documented assessment supports them. Preliminary research may inform an Emerging label, but no label is assigned from study type alone. Preclinical-only findings are explicitly identified; a lack of human evidence is not silently converted into a positive product verdict."
      },
      {
        "title": "Relevance, uncertainty, and safety",
        "text": "We assess the study population, sample size, controls, outcomes, effect sizes, follow-up, funding, and reported adverse events. We explain uncertainties, conflicting results, and gaps. Mechanistic plausibility, statistical changes, and practically meaningful benefits are kept distinct. Product claims require evidence relevant to the model, formulation, dose, and use conditions."
      },
      {
        "title": "Accessible sources and transparent attribution",
        "text": "Articles should link to the actual source using reference lists, DOI links, PubMed, or other appropriate source URLs. Author information and publication or update dates must reflect real information. A scientific reviewer is identified only after an actual completed review. Draft markers and missing-reference notices remain visible while verification is incomplete."
      },
      {
        "title": "Updating articles and correcting errors",
        "text": "Important new evidence, safety information, changed specifications or formulations, material price changes, or regulatory developments may prompt an update. Substantive revisions should be described and dated when made. For a correction, include the article URL, the passage in question, the proposed correction, and accessible supporting sources. We do not promise a review or response deadline."
      },
      {
        "title": "Commercial independence",
        "text": "Affiliate relationships, supplied products, or other compensation must not determine our conclusions or guarantee favorable coverage. Any claim of hands-on testing must reflect actual testing. Educational analysis is not individualized medical advice.",
        "links": [
          {
            "label": "Commercial transparency",
            "href": "/affiliate-disclosure"
          },
          {
            "label": "Health disclaimer",
            "href": "/disclaimer"
          }
        ]
      }
    ],
    "contact": {
      "title": "Scientific corrections and editorial feedback",
      "purpose": "For scientific corrections, editorial feedback, or content-related inquiries, contact:"
    }
  },
  "affiliate-disclosure": {
    "title": "Clear about commercial relationships.",
    "seoTitle": "Affiliate Disclosure — Commercial Transparency",
    "eyebrow": "AFFILIATE DISCLOSURE",
    "description": "How potential affiliate links work and why commercial compensation must not determine ProofWell reviews, rankings, or editorial conclusions.",
    "sections": [
      {
        "title": "What an affiliate link means",
        "text": "Some links may be affiliate links. If a reader purchases through a qualifying link, ProofWell may earn a commission. The reader does not pay an additional amount because of the affiliate relationship. Prices and third-party terms can change independently."
      },
      {
        "title": "No unverified partnership claims",
        "text": "The MEGELIN face and neck mask review includes an owner-authorized PartnerBoost affiliate link. Compensation depends on qualifying purchases and applicable program terms. The supplied destination and commission terms have not been independently confirmed by the editorial team; link placement does not certify a product, seller, scientific claim or favorable review."
      },
      {
        "title": "Coverage cannot be bought",
        "text": "An affiliate partnership does not guarantee a positive review, inclusion, ranking, or recommendation. Editorial conclusions must remain independent of commercial compensation. We do not present a product as independently tested or endorsed by a professional unless that claim is substantiated."
      },
      {
        "title": "Disclosures where they matter",
        "text": "Commercial articles carry a disclosure near the beginning. A disclosure can also appear beside a relevant commercial link. Affiliate links use owner-approved destinations and sponsored link attributes; placeholder or fabricated affiliate URLs are not used.",
        "links": [
          {
            "label": "Buying guides",
            "href": "/buying-guides"
          },
          {
            "label": "Editorial policy",
            "href": "/editorial-policy"
          }
        ]
      },
      {
        "title": "External sites and tracking",
        "text": "A third-party seller or affiliate service may process information when a reader follows its links. That service has its own privacy practices. The MEGELIN review uses an outbound PartnerBoost link at pboost.me. Its destination, third-party tracking and retention practices have not been independently verified; check the notices of the services you visit.",
        "links": [
          {
            "label": "Privacy policy",
            "href": "/privacy-policy"
          }
        ]
      }
    ],
    "contact": {
      "title": "Affiliate and business partnership inquiries",
      "purpose": "For affiliate, commercial, and business partnership inquiries, contact:"
    }
  },
  "privacy-policy": {
    "title": "Your privacy, in plain English.",
    "seoTitle": "Privacy Policy — Information, Cookies & Your Choices",
    "eyebrow": "PRIVACY POLICY · OWNER REVIEW PENDING",
    "description": "What the ProofWell website currently does with visitor information, how email and external links work, and which privacy details still require owner confirmation.",
    "draftUpdated": "2026-11-05",
    "sections": [
      {
        "title": "Status of this draft",
        "text": "This is a readable description of the current website code and a policy draft for owner review. It is not legal advice or a claim of compliance with any particular privacy law. The legal owner or data controller, applicable jurisdiction, and effective date have not yet been confirmed.",
        "ownerInput": true
      },
      {
        "title": "Information you choose to provide",
        "text": "You may contact the editorial team by email. Messages may contain your name, email address, message, and any details you choose to include. Email is handled by the relevant mail providers rather than by the static website. The contact and newsletter forms are frontend previews: they do not transmit or save submissions, and subscriptions are not active. Please avoid sending sensitive personal or medical information."
      },
      {
        "title": "Technical and analytics information",
        "text": "A hosting service may receive technical request information such as an IP address, browser details, requested URL, and request time when it delivers a page. No client-side analytics or advertising service is configured in this repository. Owner confirmation is required for the actual hosting provider, server or platform logs, analytics enabled outside the code, information collected, and the purpose and legal basis for processing.",
        "ownerInput": true
      },
      {
        "title": "Cookies and similar technologies",
        "text": "The current website code does not set tracking cookies or persist form entries in browser storage. Interactive search, navigation, and form-preview state are held in memory while the page is open. Hosting or future third-party integrations may behave differently. Any actual cookies, storage, consent controls, and providers must be documented before activation.",
        "ownerInput": true
      },
      {
        "title": "Third-party services and external links",
        "text": "Research references and other external links take you to sites with their own privacy practices. Future analytics, advertising, newsletter, or form services must be documented if connected; no specific such service is claimed to be active. The MEGELIN review contains an outbound PartnerBoost affiliate link at pboost.me. Following it takes you to third-party services that may process referral information under their own notices. Their destination, tracking and retention practices have not been independently verified. No PartnerBoost script or tracking cookie is added by this website code.",
        "links": [
          {
            "label": "Affiliate disclosure",
            "href": "/affiliate-disclosure"
          }
        ]
      },
      {
        "title": "Retention, access, and security",
        "text": "Owner confirmation is required for who can access editorial email, how long messages and hosting logs are retained, deletion practices, service-provider arrangements, international transfers, and applicable security measures. The preview forms do not create a site database of submissions. No guarantee of absolute security is made.",
        "ownerInput": true
      },
      {
        "title": "Privacy rights and requests",
        "text": "Depending on your location and the law that applies, you may have rights to request access, correction, deletion, restriction, or objection. Contact the editorial team to ask about information handled in relation to this website. The applicable rights, request procedure, identity-verification process, complaint route, and legal deadlines require owner review; this draft does not promise a specific outcome.",
        "ownerInput": true
      },
      {
        "title": "Changes to this policy",
        "text": "The draft update date records this website revision, not a confirmed legal effective date. The owner must approve an effective date and revise this policy when actual data handling, providers, or applicable requirements change.",
        "ownerInput": true
      }
    ],
    "contact": {
      "title": "Privacy inquiries",
      "purpose": "For privacy questions or requests relating to ProofWell, contact:"
    }
  },
  "contact": {
    "title": "Good questions welcome.",
    "seoTitle": "Contact ProofWell — Editorial, Corrections & Partnerships",
    "eyebrow": "CONTACT PROOFWELL",
    "description": "Contact the ProofWell Editorial Team for general inquiries, editorial feedback, scientific corrections, product information, privacy questions, or business partnerships.",
    "contactFirst": true,
    "sections": [
      {
        "title": "General inquiries",
        "text": "For questions about ProofWell, the website, or where to find a guide, email the editorial team. Include enough context to make your inquiry clear."
      },
      {
        "title": "Editorial feedback",
        "text": "Send comments on clarity, coverage, accessibility, or missing context. Include the relevant article or page URL.",
        "links": [
          {
            "label": "Our editorial policy",
            "href": "/editorial-policy"
          }
        ]
      },
      {
        "title": "Scientific corrections",
        "text": "Identify the article URL and specific passage, explain the proposed correction, and include accessible research or technical sources. A correction request does not imply that a change has already been accepted or scientifically reviewed."
      },
      {
        "title": "Product review inquiries",
        "text": "Provide the exact product name, model or formulation, region, and source documentation. Sending a product or information does not guarantee testing, coverage, or a favorable conclusion."
      },
      {
        "title": "Business and partnership inquiries",
        "text": "Describe the proposed relationship and any relevant terms. Commercial compensation must not determine editorial judgments, positive reviews, or rankings.",
        "links": [
          {
            "label": "Affiliate disclosure",
            "href": "/affiliate-disclosure"
          }
        ]
      },
      {
        "title": "Privacy questions",
        "text": "Use the same official email for privacy-related inquiries. The privacy policy describes the current website and the owner details that still require confirmation.",
        "links": [
          {
            "label": "Privacy policy",
            "href": "/privacy-policy"
          }
        ]
      }
    ],
    "contact": {
      "title": "Official contact",
      "purpose": "The official email for ProofWell is:"
    }
  }
};
