import assert from 'node:assert/strict';
import { csv, interactionEvent } from '../../lib/community/client.ts';
globalThis.window={};
for(const event of ['poll_vote','comment_submit','article_feedback','question_submit'])interactionEvent(event,'/science/how-led-masks-work');
assert.equal(window.dataLayer.length,4);
for(const entry of window.dataLayer) {
  assert.deepEqual(Object.keys(entry).sort(),['article_slug','event','interaction_type']);
  assert.equal(entry.article_slug,'how-led-masks-work');
}
const result=csv([{nickname:'=HYPERLINK("https://evil.invalid")',body:'A, "quoted" comment\nwith a second line',question:'@SUM(1+1)',id:'safe'}]);
assert.ok(result.includes("\"'=HYPERLINK"));assert.ok(result.includes("\"'@SUM"));assert.ok(result.includes('"A, ""quoted"" comment\nwith a second line"'));
console.log('Four whitelisted dataLayer events and formula-safe CSV passed. No live GA4 request.');
