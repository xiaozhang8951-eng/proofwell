import assert from 'node:assert/strict';
import { completedReview, assessedEvidence, doiUrl, sourceUrl, isEditorialDate } from '../lib/editorial.ts';

assert.equal(completedReview(), undefined);
assert.equal(completedReview({ status: 'pending' }), undefined);
assert.equal(completedReview({ status: 'completed' }), undefined);
assert.equal(completedReview({ status: 'completed', reviewer: { name: ' ' }, reviewedOn: '2024-01-01' }), undefined);
assert.equal(completedReview({ status: 'completed', reviewer: { name: 'QA fixture (not a real reviewer)' }, reviewedOn: '2024-02-30' }), undefined);
assert.equal(assessedEvidence(), undefined);
assert.equal(assessedEvidence({ verified: false, level: 'Strong Evidence', summary: 'Unverified fixture', limitations: [] }), undefined);
assert.equal(assessedEvidence({ verified: true, level: 'Strong Evidence', summary: '', limitations: [] }), undefined);
assert.equal(doiUrl(), undefined);
assert.equal(doiUrl('[Verified reference required]'), undefined);
assert.equal(sourceUrl('javascript:alert(1)'), undefined);
assert.equal(sourceUrl('/not-a-reference'), undefined);
assert.equal(isEditorialDate('YYYY-MM-DD'), false);
assert.equal(isEditorialDate('2024-02-30'), false);
assert.equal(isEditorialDate('2024-02-29'), true);
console.log('Editorial guard checks passed: missing/pending reviews, invalid dates, unverified evidence, and unsafe/missing source URLs remain unpublished.');

// Render components in memory only: no QA fixture is added to the site content.
const { default: ts } = await import('typescript');
const { readFileSync } = await import('node:fs');
const { createRequire } = await import('node:module');
const { runInNewContext } = await import('node:vm');
const { createElement } = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const editorial = await import('../lib/editorial.ts');
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('../components/evidence.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
runInNewContext(compiled, { exports, require: id => id === '@/lib/editorial' ? editorial : require(id), URL });
const fixture = [{ title: 'QA component fixture (not a scientific reference)' }];
const references = renderToStaticMarkup(createElement(exports.ReferenceList, { items: fixture }));
const citation = renderToStaticMarkup(createElement(exports.Citation, { number: 1, references: fixture }));
assert.match(references, /id="reference-1"/);
assert.match(citation, /href="#reference-1"/);
assert.doesNotMatch(renderToStaticMarkup(createElement(exports.Citation, { number: 2, references: fixture })), /href=/);
assert.match(renderToStaticMarkup(createElement(exports.Citation, { number: 2, references: fixture })), /Verified reference required/);
const snapshot = renderToStaticMarkup(createElement(exports.EvidenceSnapshot, {
  data: { researchTopic: 'QA fixture only', verified: false, status: 'Unverified status fixture', mainFindings: ['UNVERIFIED_FINDING_FIXTURE'] },
}));
assert.doesNotMatch(snapshot, /UNVERIFIED_FINDING_FIXTURE|Unverified status fixture/);
assert.match(snapshot, /Verification pending/);
assert.equal(renderToStaticMarkup(createElement(exports.CommercialLink, { children: 'QA fixture link' })), '');
console.log('Component checks passed: citation targets match reference IDs, missing references stay pending, unverified findings stay hidden, and empty commercial links do not render.');
