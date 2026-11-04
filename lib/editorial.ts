export const evidenceLevels = [
  'Strong Evidence', 'Moderate Evidence', 'Emerging Evidence',
  'Limited Evidence', 'Unsupported Claim',
] as const;
export type EvidenceLevelName = typeof evidenceLevels[number];
export type Reference = {
  title?: string;
  authors?: string[];
  journal?: string;
  year?: number;
  citation?: string;
  doi?: string;
  pubmedUrl?: string;
  url?: string;
};
export type EvidenceSnapshotData = {
  researchTopic: string;
  verified: boolean;
  status?: string;
  mainFindings?: string[];
  limitations?: string[];
};
export type FaqItem = { question: string; answer: string };
export type AuthorInfo = { kind?: 'person' | 'organization'; credentials?: string; bio?: string };
export type ScientificReview = {
  status: 'pending' | 'completed';
  reviewer?: { name: string; credentials?: string; bio?: string };
  reviewedOn?: string;
};
export type EvidenceAssessment = {
  verified: boolean;
  level: EvidenceLevelName;
  summary: string;
  limitations: string[];
};

export function isEditorialDate(value?: string): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// A name alone must never produce a scientific-review badge.
export function completedReview(review?: ScientificReview) {
  return review?.status === 'completed' && typeof review.reviewer?.name === 'string' && review.reviewer.name.trim() && isEditorialDate(review.reviewedOn)
    ? { reviewer: review.reviewer, reviewedOn: review.reviewedOn }
    : undefined;
}

export function assessedEvidence(evidence?: EvidenceAssessment) {
  return evidence?.verified === true && evidenceLevels.includes(evidence.level) &&
    typeof evidence.summary === 'string' && evidence.summary.trim() && Array.isArray(evidence.limitations) && evidence.limitations.some(item => typeof item === 'string' && item.trim())
    ? evidence : undefined;
}

export function doiUrl(doi?: string) {
  const identifier = doi?.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
  // Syntax checking is not verification; editors must check the actual source.
  return identifier && /^10\.\d{4,9}\/\S+$/i.test(identifier)
    ? `https://doi.org/${encodeURI(identifier).replace(/[?#]/g, encodeURIComponent)}` : undefined;
}

export function sourceUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined;
  } catch { return undefined; }
}
