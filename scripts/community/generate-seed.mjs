// Prints explicit article/poll registration SQL. Does not touch the database.
// Run for new articles and review output before applying; existing settings are preserved.
import { getArticles, articleUrl } from '../../lib/content.ts';
import { isEditorialDate } from '../../lib/editorial.ts';
import { communityConfig } from '../../lib/community/config.ts';
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
console.log('-- Article registrations from actual MDX, not route guesses. No reader data.\nbegin;');
for (const article of getArticles()) {
  const key=articleUrl(article); const c=communityConfig(article);
  const published=article.draft!==true&&article.noindex!==true&&isEditorialDate(article.published)&&article.published<=new Date().toISOString().slice(0,10);
  console.log(`insert into public.community_articles(article_key,title,enabled,discussion_prompt,next_question) values(${quote(key)},${quote(article.title)},${published},${quote(c.discussionPrompt)},${quote(c.nextQuestion)}) on conflict(article_key) do nothing;`);
  console.log(`insert into public.community_polls(article_key,question,options) select ${quote(key)},${quote(c.question)},${quote(JSON.stringify(c.options))}::jsonb where not exists(select 1 from public.community_polls where article_key=${quote(key)} and active);`);
}
console.log('commit;');
