import fs from 'node:fs';
import assert from 'node:assert/strict';
import {getArticles,articleUrl} from '../../lib/content.ts';
const articles=getArticles();
for(const article of articles) {
  const html=fs.readFileSync(`out${articleUrl(article)}.html`,'utf8');
  assert.equal((html.match(/id="article-community"/g)||[]).length,1,article.slug);
  const module=html.indexOf('id="article-community"');
  assert.ok(module>html.indexOf('class="prose"') && module<html.indexOf('class="related section"'),article.slug);
  const reference=html.indexOf('class="references"');if(reference!==-1)assert.ok(reference<module,article.slug);
  assert.ok(html.includes('What Do You Think?'));
  assert.equal((html.match(/id="google-tag-manager"/g)||[]).length,1,article.slug);
  assert.ok(html.includes('GTM-TK8MNNSV'));
  assert.ok(!html.includes('GTM-PH85ZDWJ'));
}
const admin=fs.readFileSync('out/community-admin.html','utf8');
assert.ok(admin.includes('<meta name="robots" content="noindex, nofollow"'));
assert.ok(!fs.readFileSync('out/sitemap.xml','utf8').includes('/community-admin'));
assert.deepEqual(JSON.parse(fs.readFileSync('out/_routes.json','utf8')),{version:1,include:['/api/community'],exclude:[]},'Only the API may invoke the Pages Function');
assert.ok(!fs.readFileSync('out/sitemap.xml','utf8').includes('/api/community'));
for(const file of ['app/layout.tsx','app/robots.ts','app/sitemap.ts','next.config.mjs'])assert.ok(fs.existsSync(file));
console.log(JSON.stringify({articles:articles.length,oneModuleEach:true,afterReferencesBeforeRelated:true,gtmOnce:true,adminNoindexAndExcluded:true},null,2));
