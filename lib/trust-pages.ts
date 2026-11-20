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
    "draftUpdated": "2026-11-19",
    "sections": [
      {
        "title": "Status and operator",
        "text": "This policy remains a draft for owner review; Community is disabled in this development delivery. ProofWell is a public-facing brand operated by an individual, not a claimed registered company. The operator’s full legal identity, policy effective date and any legally required additional details remain pending. Privacy contact: ProofWell Editorial Team — proofwelllife@gmail.com. This draft is not legal advice or a certification of compliance.",
        "ownerInput": true
      },
      {
        "title": "Visitors and applicable rights",
        "text": "ProofWell serves readers in the United States, United Kingdom, Canada and Australia and allows global access. Applicable privacy rights and obligations depend on the visitor’s location and circumstances; no single jurisdiction is asserted to govern everyone. The operator must confirm lawful bases, local notices, age eligibility, transfers and complaint routes before enabling Community.",
        "ownerInput": true
      },
      {
        "title": "Information you choose to provide",
        "text": "Email inquiries are handled by the relevant mail providers. Contact and newsletter forms remain frontend previews and do not save or transmit submissions. If Community is later enabled, we process the article reference, nickname, comment text, vote or helpfulness response, optional question or suggestion, moderation status and timestamps needed to operate it. Avoid contact details, medical records or other sensitive information in submissions. We do not require a public profile or an email address for a guest session."
      },
      {
        "title": "Public comments and private suggestions",
        "text": "Comments are pending and not public until approved. Approved nicknames, comment text and times are visible to readers and may be copied or captured by others; moderation is not scientific verification. Hidden comments remain private until deleted; hiding an approved comment does not classify it as spam. Questions and topic suggestions are private to authorized editors. Poll and helpfulness displays show informal aggregate responses, not clinical evidence or unique-person counts. No separate indexable comment pages are created; this is not a promise that public text cannot be read or saved by search engines."
      },
      {
        "title": "Guest sessions and browser storage",
        "text": "Supabase Auth issues a pseudonymous user identifier and verifies session credentials on the server. This is not fully anonymous identity, and it does not prove one account equals one person. The SDK persists session credentials in browser storage under proofwell-community-session to restore a guest session. Clearing storage or switching devices can lose that association; server-side limits also apply. Session persistence, expiry, account inactivity and deletion settings must be reviewed against the actual Supabase project. The publication acknowledgement checkbox is not analytics consent.",
        "ownerInput": true
      },
      {
        "title": "Security processing and when requests occur",
        "text": "When Community is enabled, approaching the article’s interaction section loads public results and Cloudflare Turnstile; these providers may receive technical request data before a reader starts a guest session. Auth is contacted when starting or restoring a session. Submissions require fresh human verification. The Pages gateway receives a Cloudflare-controlled client IP, authenticates it to the backend, and the backend derives keyed, rotating IP-based abuse counters. Application community tables do not store raw IPs, but hosting, Auth, CAPTCHA and other providers may receive or log IPs, browser details and request times. A keyed hash is not a guarantee of legal anonymization."
      },
      {
        "title": "Purpose and data minimization",
        "text": "Community data is used to operate discussion, moderate content, count feedback, consider editorial topics, respond to rights requests and prevent abuse. We do not sell Community data or use it for advertising profiles. Authorized moderators can view private queues and export operational data; exports require restricted storage and the same retention/deletion controls. Any legal basis or exception must be reviewed for the applicable visitor and processing purpose.",
        "ownerInput": true
      },
      {
        "title": "Retention and deletion",
        "text": "The approved operating limits below are a preparation policy, not proof that a production cleanup job or provider settings have been configured. Scheduled deletion, monitoring, backup expiry and third-party logs must be verified before launch. Expiry alone does not physically delete a database row.",
        "items": [
          "Approved comments: retained until a valid user deletion request or user deletion is processed. No automatic age-based deletion of normal approved comments is added.",
          "Pending and explicitly classified spam comments: no more than 90 days from submission. Hiding a normal approved comment does not classify it as spam or start an automatic deletion clock. Normal hidden comments and historical hidden records of unknown classification require individual review.",
          "Raw votes, helpfulness responses and private topic suggestions: no more than 90 days from submission. Polls remain open; once a guest’s raw record expires and is removed, another response is permitted. Aggregate response counts may therefore include repeat participants.",
          "Expired vote and helpfulness rows are replaced only by real counts per poll option or article, without user IDs, IPs, raw response times or text. Long-term retention requires an assessment that these aggregates are genuinely anonymous; sparse groups may need suppression or deletion.",
          "IP and security logs: no more than 30 days. Application abuse-counter rows expire sooner (two days) and gateway nonce rows after five minutes, but deletion requires writes or an approved maintenance schedule. Provider log and backup retention remain pending confirmation.",
          "Administrator action logs: 180 days. No comment bodies, passwords or CAPTCHA tokens should be copied into audit records.",
          "Anonymous Auth account lifecycle, email requests, provider backups and exported files require an approved schedule and verified provider controls. Deleting an Auth user can cascade into their live community records; do not bulk-delete accounts as a substitute for scoped retention."
        ],
        "ownerInput": true
      },
      {
        "title": "Analytics and consent",
        "text": "The existing website loads Google Tag Manager; its published tags, Google Analytics/Ads destinations, automatic form collection, storage and consent settings still require an account-level audit. No new Google tag is installed for Community. Community success events are separately disabled by default and are emitted only after an approved consent-management integration explicitly grants analytics permission. Withdrawal blocks later Community events; past actions are not queued for replay. These events contain only an article slug and interaction type, not nicknames, text, email, IPs, user IDs or tokens. This separate gate does not control all existing Google tags or constitute a complete site-wide consent system.",
        "ownerInput": true
      },
      {
        "title": "Providers and international processing",
        "text": "If enabled, Community uses Supabase for Auth/database/Edge processing and Cloudflare Pages/Turnstile for hosting, gateway and abuse protection. Existing Google and affiliate services have their own practices. Supabase’s actual storage region, contracts, subprocessors, cross-border safeguards, provider log retention and backup controls remain pending verification. Following an affiliate link may send referral data to the external service under its own notice; no claim is made that external sites follow this policy.",
        "links": [
          {
            "label": "Affiliate disclosure",
            "href": "/affiliate-disclosure"
          }
        ],
        "ownerInput": true
      },
      {
        "title": "Privacy rights and removal requests",
        "text": "To request comment removal, access, correction or personal-data deletion, email proofwelllife@gmail.com. Approved comments have a Request removal link that opens your email application with the article and comment reference; it sends nothing automatically. For a pending comment or private suggestion, identify the article and approximate submission time without resending sensitive content. A public comment ID or nickname alone is not proof of ownership. We will seek only proportionate information needed to locate and verify a request; never send a password, access token, refresh token or medical record. The operator must confirm response deadlines, appeal/complaint routes and backup handling under applicable law. Public copies held by others may not be removable by ProofWell.",
        "links": [
          {
            "label": "Privacy contact",
            "href": "mailto:proofwelllife@gmail.com"
          }
        ],
        "ownerInput": true
      },
      {
        "title": "Security, review and effective date",
        "text": "Access is restricted through server authentication, administrator allowlisting, moderation and database Row Level Security; no system guarantees absolute security. The draft update date records this document revision, not a legal effective date, completed legal review or launch authorization. Unknown controller details, retention execution, storage region, consent configuration and legal requirements remain launch blockers.",
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
