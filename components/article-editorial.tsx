import type { Article } from '@/lib/content';
import { headingId } from '@/lib/content';
import { isPublishedArticle } from '@/lib/public-routes';
import { assessedEvidence, completedReview, isEditorialDate } from '@/lib/editorial';
import { evaluationFramework } from '@/lib/templates';
import { EvidenceLevel, EvidenceSnapshot } from './evidence';

function DateLabel({ label, value }: { label: string; value?: string }) {
  if (!isEditorialDate(value)) return null;
  const display = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  return <span>{label} <time dateTime={value}>{display}</time></span>;
}

export function ArticleDates({ article }: { article: Article }) {
  const review = completedReview(article.scientificReview);
  return <div className="article-dates">
    <DateLabel label="Published" value={article.published}/>
    <DateLabel label="Last updated" value={article.updated}/>
    {review && <span>Scientifically reviewed by <strong>{review.reviewer.name}</strong>
      {review.reviewer.credentials && `, ${review.reviewer.credentials}`} · <DateLabel label="Reviewed" value={review.reviewedOn}/>
    </span>}
  </div>;
}

export function EditorialSummary({ article }: { article: Article }) {
  const assessment = assessedEvidence(article.evidenceAssessment);
  const publishedArticle2 = article.slug === 'how-led-masks-work' && isPublishedArticle(article);
  return <aside id="evidence-snapshot" className="editorial-summary" aria-label="Evidence assessment">
    <EvidenceSnapshot data={article.evidenceSnapshot || {
      researchTopic: article.shortTitle,
      verified: Boolean(assessment),
      status: assessment?.level,
      mainFindings: assessment ? [assessment.summary] : undefined,
      limitations: article.limitations || assessment?.limitations,
    }}/>
    <span className="eyebrow">REVIEW STATUS</span>
    {assessment ? <><EvidenceLevel level={assessment.level}/><p>{assessment.summary}</p></> :
      <p><strong>{article.evidenceSnapshot?.verified ? 'Evidence grade not assigned.' : 'Evidence not yet assessed.'}</strong> {article.evidenceSnapshot?.verified ? 'See the snapshot for documented findings and uncertainty.' : publishedArticle2 ? 'This article has no assigned evidence grade or product recommendation.' : 'This draft has no assigned evidence grade or product recommendation.'}</p>}
    {!completedReview(article.scientificReview) && <p className="review-pending">{publishedArticle2 ? 'Scientific review has not been completed for this article.' : 'Scientific review has not been completed for this draft.'}</p>}
    <p>Research findings, proposed mechanisms, manufacturer claims, and editorial interpretation are evaluated separately. <a href="/editorial-standards">Our editorial standards</a></p>

  </aside>;
}

export function ReviewFramework({ kind, headings }: { kind: string; headings: string[] }) {
  return <details className="review-framework"><summary>Our product evaluation framework</summary>
    <p>The same nine questions guide every review. Inclusion here does not mean testing or verification is complete.</p>
    <dl>{evaluationFramework.map(item => {
      const heading = kind === 'supplement' ? item.supplementHeading : item.heading;
      return <div key={item.label}><dt>{headings.includes(heading) ? <a href={`#${headingId(heading)}`}>{item.label}</a> : item.label}</dt><dd>{item.guidance}</dd></div>;
    })}</dl>
  </details>;
}

export function AuthorInformation({ article }: { article: Article }) {
  const review = completedReview(article.scientificReview);
  return <div className="author-bio" id="author-information"><span className="eyebrow">ABOUT THE AUTHOR</span>
    <h3>{article.author}</h3>
    {article.authorInfo?.credentials && <p>{article.authorInfo.credentials}</p>}
    <p>{article.authorInfo?.bio || 'Author biography and credentials have not yet been supplied by the site owner.'}</p>
    {review && <div className="reviewer-bio"><span className="eyebrow">SCIENTIFIC REVIEWER</span><h3>{review.reviewer.name}</h3>
      {review.reviewer.credentials && <p>{review.reviewer.credentials}</p>}{review.reviewer.bio && <p>{review.reviewer.bio}</p>}
    </div>}
    <a href="/editorial-standards">Our editorial standards ↗</a>
  </div>;
}
